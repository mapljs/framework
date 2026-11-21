import { is_dynamic_pattern } from '@mapl/pattern-router/tree/utils';
import {
  router_init,
  router_set_dynamic,
  router_set_static,
  type Router,
} from '@mapl/pattern-router';

import type { Group, Handler } from '../core/route.mts';
import { router_compile_to_code } from '@mapl/pattern-router/jit';

export const AsyncFunction: {
    (...args: string[]): (...args: any[]) => Promise<any>;
    new (...args: string[]): (...args: any[]) => Promise<any>;
  } = (async () => {}).constructor as any,
  is_async_fn = (fn: unknown): fn is (...args: any[]) => Promise<any> =>
    fn instanceof AsyncFunction,
  concat_prefix = (a: string, b: string): string => (a === '/' ? b : b === '/' ? a : a + b),
  get_required_args = (arr: unknown[], startIdx: number, idMap: Map<unknown, string>): string => {
    if (arr.length <= startIdx) return '';

    let str = idMap.get(arr[startIdx]);
    if (str == null) throw new Error(`id ${arr[startIdx]} is not parsed!`);

    while (++startIdx < arr.length) {
      const key = idMap.get(arr[startIdx]);
      if (key == null) throw new Error(`id ${arr[startIdx]} is not parsed!`);
      str += ',' + key;
    }

    return str;
  },
  /**
 r: request

 d: response headers

 c: request context

 u: url

 s: path start

 e: path end

 m: matched dynamic handler

 o: remove response body helper if method = `HEAD`
 */
  compile_to_string = (
    group: Group,
    parentPath: string,
    idMap: Map<any, string>,
    handlerArgs: string,
  ): string => {
    let urlRouter: Router<string> = router_init(),
      globalDecls = 'let o=(h,r)=>h?(r.body.cancel(),new Response(null,r)):r',
      keyAvailableId = 0,
      hookAvailableId = 0,
      subrouteAvailableId = 0,
      handleAvailableId = 0;

    (function compileGroup(
      group: Group,

      // parsed ids
      idMap: Map<any, string>,

      // final url router
      urlPrefix: string,
      isDynamic: boolean,

      // parent access path
      parentPath: string,

      // whether current scope needs async
      isScopeAsync: boolean,

      // function scope stuff
      scopePrefix: string,
      scopeSuffix: string,
    ) {
      for (let i = 0, idMapNotCloned = true, hooks = group[0]; i < hooks.length; i++) {
        const hook = hooks[i],
          hookId = hook[0];

        // parse result to an id
        if (hookId & 1) {
          const hookTargetId = hook[1];

          if (idMap.has(hookTargetId))
            throw new Error(`id ${hookTargetId} already existed or parsed!`);
          if (idMapNotCloned) {
            idMap = new Map(idMap);
            idMapNotCloned = false;
          }

          const parsedId = 'k' + keyAvailableId++;
          idMap.set(hookTargetId, parsedId);

          if (hookId < 7) {
            let callId = 'm' + hookAvailableId++,
              call = callId + `(${get_required_args(hook, 3, idMap)});`;

            globalDecls += `,${callId}=${parentPath}[0][${i}][2]`;
            if (is_async_fn(hook[2])) {
              isScopeAsync = true;
              call = 'await ' + call;
            }

            // parse()
            if (hookId === 1) scopePrefix += `let ${parsedId}=`;

            // resource()
            else if (hookId === 3) scopePrefix += `using ${parsedId}=`;

            // async_resource()
            else if (hookId === 5) {
              scopePrefix += `await using ${parsedId}=` + call;
              isScopeAsync = true;
            }

            scopePrefix += call;
          }

          // use()
          else if (hookId === 7) globalDecls += `,${parsedId}=${parentPath}[0][${i}][2]`;

          // build()
          else if (hookId === 9) {
            let call = parentPath + `[0][${i}][2](${get_required_args(hook, 3, idMap)})`;
            if (is_async_fn(hook[2])) call = 'await ' + call;

            globalDecls += `,${parsedId}=` + call;
          }
        } else {
          let callId = 'm' + hookAvailableId++,
            requires = get_required_args(hook, 2, idMap),
            call =
              callId +
              (hookId === 6
                ? requires.length === 0
                  ? '(e)'
                  : `(e,${requires});`
                : `(${requires});`);
          globalDecls += `,${callId}=${parentPath}[0][${i}][1]`;

          if (is_async_fn(hook[1])) {
            isScopeAsync = true;
            call = 'await ' + call;
          }

          // run()
          if (hookId === 2) scopePrefix += call;

          // defer()
          else if (hookId === 4) {
            scopePrefix += 'try{';
            scopeSuffix = `}finally{${call}}` + scopeSuffix;
          }

          // error()
          else if (hookId === 6) {
            scopePrefix += 'try{';
            scopeSuffix = `}catch(e){return ${call}}`;
          }
        }
      }

      let startIdx = 1;

      // has subroutes
      if (!Array.isArray(group[1])) {
        const subroutes = group[1];
        for (const subrouteKey in subroutes) {
          const subrouteId = 's' + subrouteAvailableId++;
          globalDecls += `,${subrouteId}=${parentPath}[1]["${subrouteKey}"]`;

          compileGroup(
            subroutes[subrouteKey as keyof typeof subroutes],
            idMap,
            concat_prefix(urlPrefix, subrouteKey),
            isDynamic || is_dynamic_pattern(subrouteKey),
            subrouteId,
            isScopeAsync,
            scopePrefix,
            scopeSuffix,
          );
        }

        startIdx = 2;
      }

      while (startIdx < group.length) {
        let handler = group[startIdx] as Handler,
          routeMethod = handler[0],
          routePath = handler[1],
          fn = handler[2],
          // route-specific state
          isDynamicRoute = isDynamic || is_dynamic_pattern(routePath),
          isRouteScopeAsync = isScopeAsync,
          // route handler id
          params = get_required_args(handler, 3, idMap),
          callId = 'h' + handleAvailableId++;

        // add url params
        if (fn.length > handler.length - 3)
          params +=
            (handler.length > 3 ? ',' : '') + (isDynamicRoute ? 'm.groups' : 'Object.create(null)');

        globalDecls += `,${callId}=${parentPath}[${startIdx}][2]`;

        let store = callId + `(${params})`;
        if (is_async_fn(fn)) {
          store = 'await ' + store;
          isRouteScopeAsync = true;
        }

        // Return empty body if request matches HEAD
        if (routeMethod === 'GET') store = `o(h,${store})`;

        store = scopePrefix + 'return ' + store + scopeSuffix;
        if (isRouteScopeAsync) store = `return(async()=>{${store}})();`;

        // add to router
        isDynamicRoute
          ? router_set_dynamic(urlRouter, routeMethod, concat_prefix(urlPrefix, routePath), store)
          : router_set_static(urlRouter, routeMethod, concat_prefix(urlPrefix, routePath), store);

        startIdx++;
      }
    })(group, idMap, '/', false, parentPath, false, '', '');

    return (
      globalDecls +
      `;return ${handlerArgs}=>{let h=false,c={status:200,headers:new Headers(),statusText:''},u=r.url,s=u.indexOf('/',9),e=u.indexOf('?',s+1),p=e===-1?u.slice(s):u.slice(e);${router_compile_to_code(urlRouter, 'm', 'p', 'r.method', 'h=true')}return new Response(null,{status:404})};`
    );
  };
