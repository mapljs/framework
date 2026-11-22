import { router_set_dynamic, router_set_static, type Router } from '@mapl/pattern-router';
import { is_dynamic_pattern } from '@mapl/pattern-router/tree/utils';

import type { Group, Handler } from './route.mts';
import type { Id } from './hook.mts';

export const params: Id<Record<string, string | undefined>> = 'core:params' as any,
  // Async function constructor
  AsyncFunction: {
    (...args: string[]): (...args: any[]) => Promise<any>;
    new (...args: string[]): (...args: any[]) => Promise<any>;
  } = (async () => {}).constructor as any,
  // Whether a function is marked async
  is_async_fn = (fn: unknown): fn is (...args: any[]) => Promise<any> =>
    fn instanceof AsyncFunction,
  // Merge 2 group prefixes or a group prefix with handler path
  concat_prefix = (a: string, b: string): string => (a === '/' ? b : b === '/' ? a : a + b),
  // Verify & parse arguments for a handler
  assert_parse_id = (id: unknown, idMap: Map<unknown, string>): unknown => {
    if (id === params || idMap.has(id)) throw new Error(`id ${id} already existed or parsed!`);
    return id;
  },
  get_arg = (argName: unknown, idMap: Map<unknown, string>, isDynamicRoute: boolean): string => {
    if (argName === params) {
      if (isDynamicRoute) return idMap.get(params)!;
      throw new Error(`static routes cannot access path parameters!`);
    }

    const str = idMap.get(argName);
    if (str == null) throw new Error(`id ${argName} is not parsed!`);
    return str;
  },
  get_args = (
    arr: unknown[],
    startIdx: number,
    idMap: Map<unknown, string>,
    isDynamicRoute: boolean,
  ): string => {
    if (arr.length <= startIdx) return '';
    let str = get_arg(arr[startIdx], idMap, isDynamicRoute);
    while (++startIdx < arr.length) str += ',' + get_arg(arr[startIdx], idMap, isDynamicRoute);
    return str;
  },
  /**
   * Compile a group, returns required global declarations and add all routes to `urlRouter`.
   *
   * Required declarations:
   * - `h`: Whether a request method is `HEAD`.
   * - `o(h,r)`: Cancel the response body.
   *
   * @param group Target route group
   * @param urlRouter URL router to add routes to
   * @param parentPath Access path of the route group in final compiled handler.
   * @param idMap Initial available ids (request, environment variables, execution context, ...)
   * @param globalDecls Initial global declarations
   *
   * @example
   * const router = router_init<string>();
   * compile_group(
   *   group,
   *   router,
   *   'self',
   *   new Map([
   *     [ids.request, 'r'],
   *     [ids.params, 'm.groups']
   *   ]),
   *   'let o=(h,r)=>h?new Response(null,r):r'
   * );
   */
  compile_group = (
    group: Group,
    urlRouter: Router<string>,
    parentPath: string,
    idMap: Map<any, string>,
    globalDecls: string,
  ): string => {
    let keyAvailableId = 0,
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
          const hookTargetId = assert_parse_id(hook[1], idMap);
          if (idMapNotCloned) {
            idMap = new Map(idMap);
            idMapNotCloned = false;
          }

          const parsedId = 'k' + keyAvailableId++;
          idMap.set(hookTargetId, parsedId);

          if (hookId < 7) {
            let callId = 'm' + hookAvailableId++,
              call = callId + `(${get_args(hook, 3, idMap, isDynamic)});`;

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
              scopePrefix += `await using ${parsedId}=`;
              isScopeAsync = true;
            }

            scopePrefix += call;
          }

          // use()
          else if (hookId === 7) globalDecls += `,${parsedId}=${parentPath}[0][${i}][2]`;

          // build()
          else if (hookId === 9) {
            let call = parentPath + `[0][${i}][2](${get_args(hook, 3, idMap, false)})`;
            if (is_async_fn(hook[2])) call = 'await ' + call;

            globalDecls += `,${parsedId}=` + call;
          }
        } else {
          let callId = 'm' + hookAvailableId++,
            requires = get_args(hook, 2, idMap, isDynamic),
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
          args = get_args(handler, 3, idMap, isDynamicRoute),
          callId = 'h' + handleAvailableId++;

        // add url params
        if (fn.length > handler.length - 3) {
          if (handler.length > 3) args += ',';
          args += get_arg(params, idMap, isDynamicRoute);
        }

        globalDecls += `,${callId}=${parentPath}[${startIdx}][2]`;

        let store = callId + `(${args})`;
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

    return globalDecls;
  };
