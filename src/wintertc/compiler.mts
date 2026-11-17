import { is_dynamic_pattern } from '@mapl/pattern-router/tree/utils';
import {
  router_init,
  router_set_dynamic,
  router_set_static,
  type Router,
} from '@mapl/pattern-router';

import type { Group, Handler } from '../core/route.mts';
import { router_compile_to_code } from '@mapl/pattern-router/jit';

const AsyncFunction = (async () => {}).constructor,
  isAsyncFn = (fn: unknown): fn is (...args: any[]) => Promise<any> => fn instanceof AsyncFunction,
  concatPrefix = (a: string, b: string): string => (a === '/' ? b : b === '/' ? a : a + b),
  getRequiredArgs = (arr: unknown[], startIdx: number, id_map: Map<unknown, string>): string => {
    if (arr.length <= startIdx) return '';

    let str = id_map.get(arr[startIdx]);
    if (str == null) throw new Error(`id ${arr[startIdx]} is not parsed!`);

    while (++startIdx < arr.length) {
      const key = id_map.get(arr[startIdx]);
      if (key == null) throw new Error(`id ${arr[startIdx]} is not parsed!`);
      str += ',' + key;
    }

    return str;
  };

export default (group: Group, parentPath: string, id_map: Map<any, string>): string => {
  let urlRouter: Router<string> = router_init(),
    globalScope = '',
    keyAvailableId = 0,
    hookAvailableId = 0,
    subrouteAvailableId = 0,
    handleAvailableId = 0;

  (function compileGroup(
    group: Group,

    // parsed ids
    id_map: Map<any, string>,

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

        if (id_map.has(hookTargetId))
          throw new Error(`id ${hookTargetId} already existed or parsed!`);
        if (idMapNotCloned) {
          id_map = new Map(id_map);
          idMapNotCloned = false;
        }

        const parsedId = 'k' + keyAvailableId++;
        id_map.set(hookTargetId, parsedId);

        if (hookId < 7) {
          const callId = 'm' + hookAvailableId++;
          globalScope += `let ${callId}=${parentPath}[0][${i}][2];`;

          let call = callId + `(${getRequiredArgs(hook, 3, id_map)});`;
          if (isAsyncFn(hook[2])) {
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
        else if (hookId === 7) globalScope += `let ${parsedId}=${parentPath}[0][${i}][2];`;

        // build()
        else if (hookId === 9) {
          let call = parentPath + `[0][${i}][2](${getRequiredArgs(hook, 3, id_map)});`;
          if (isAsyncFn(hook[2])) call = 'await ' + call;

          globalScope += `let ${parsedId}=` + call;
        }
      } else {
        const callId = 'm' + hookAvailableId++;
        globalScope += `let ${callId}=${parentPath}[0][${i}][2];`;

        let call = callId + `(${getRequiredArgs(hook, 3, id_map)});`;
        if (isAsyncFn(hook[2])) {
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
      let subroutes = group[1];

      for (const subrouteKey in subroutes) {
        const subrouteId = 's' + subrouteAvailableId++;
        globalScope += `let ${subrouteId}=${parentPath}[1]["${subrouteKey}"];`;

        compileGroup(
          subroutes[subrouteKey as keyof typeof subroutes],
          id_map,
          concatPrefix(urlPrefix, subrouteKey),
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
        fn = handler[2],
        routeMethod = handler[0],
        routePath = handler[1],
        // route-specific state
        isDynamicRoute = isDynamic || is_dynamic_pattern(routePath),
        isRouteScopeAsync = isScopeAsync,
        // route handler id
        params = getRequiredArgs(handler, 3, id_map),
        callId = 'h' + handleAvailableId++;

      // add url params
      if (fn.length > handler.length - 3)
        params +=
          (handler.length > 3 ? ',' : '') + (isDynamicRoute ? 'm.groups' : 'Object.create(null)');

      globalScope += `let ${callId}=${parentPath}[${startIdx}][2];`;

      let store = callId + `(${params})`;
      if (isAsyncFn(fn)) {
        store = 'await ' + store;
        isRouteScopeAsync = true;
      }

      // Return empty body if request matches HEAD
      if (routeMethod === 'GET') store = `o(h,${store})`;

      store = scopePrefix + 'return ' + store + scopeSuffix;
      if (isRouteScopeAsync) store = `return(async()=>{${store}})();`;

      // add to router
      isDynamicRoute
        ? router_set_dynamic(urlRouter, routeMethod, concatPrefix(urlPrefix, routePath), store)
        : router_set_static(urlRouter, routeMethod, concatPrefix(urlPrefix, routePath), store);

      startIdx++;
    }
  })(group, id_map, '/', false, parentPath, false, '', '');

  return (
    globalScope +
    `let o=(h,r)=>h?(r.body.cancel(),new Response(null,r)):r;return r=>{let h=false,c={status:200,headers:new Headers(),statusText:''},u=r.url,s=u.indexOf('/',9),e=u.indexOf('?',s+1),p=e===-1?u.slice(s):u.slice(e);${router_compile_to_code(urlRouter, 'm', 'p', 'r.method', 'h=true')}return new Response(null,{status:404})};`
  );
};
