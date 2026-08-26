import { ref } from 'runtime-compiler';

import type { Router } from '../router.ts';
import type { BaseContext } from '../../index.ts';
import { accessProperty, isAsyncFunction } from './utils.ts';
import { normalizePattern } from '../../utils/pattern.ts';
import { ResponseInfo } from '../response.ts';
import { IS_AOT } from 'runtime-compiler/env';

const defaultGlobals = `let ResponseInfo=$[${ref(ResponseInfo)}];`;
export abstract class BuildState {
  /**
   * Add code for a route.
   *
   * Must handle HEAD requests for routes without a HEAD handler.
   *
   * @param contextPrefix `let c={...`
   */
  abstract addRoute(method: string, pattern: string, code: string, contextPrefix: string, routeState: RouterState): void;

  /**
   * Global declarations.
   *
   * @example
   * state.globals += 'let name = value;';
   */
  globals: string = defaultGlobals;

  /**
   * Next available id.
   */
  nextId: number = 0;
}

export type RouterState = [flags: number, contextKeys: string[]];

export const REQUIRE_ASYNC = 1;

export const nextId = (state: BuildState): string => 'r' + state.nextId++;
export const createGlobalId = (state: BuildState, value: any): string => {
  const valueRef = ref(value),
    id = nextId(state);

  IS_AOT || (state.globals += `let ${id}=$[${valueRef}];`);

  return id;
};
export const callWithoutArgs = (
  fn: (c: any) => any,
  buildState: BuildState,
  routerState: RouterState,
): string =>
  (isAsyncFunction(fn) ? ((routerState[0] |= REQUIRE_ASYNC), 'await ') : '') +
  createGlobalId(buildState, fn);
export const callWithContextStatement = (
  fn: (c: any) => any,
  buildState: BuildState,
  routerState: RouterState,
): string => callWithoutArgs(fn, buildState, routerState) + (fn.length > 0 ? '(c);' : '();');

export const cloneRouterState = (routerState: RouterState): RouterState => {
  const newState: RouterState = routerState.slice() as any;
  newState[1] = newState[1].slice();
  return newState;
};

const buildRouter = (
  router: Router<BaseContext>,
  buildState: BuildState,
  routerState: RouterState,

  basePattern: string,
  prefix: string,
  suffix: string,
): void => {
  if (typeof router.pattern === 'string') basePattern += router.pattern;

  // Handle error
  if (typeof router.error === 'function') {
    const { error } = router;

    prefix += 'try{';
    suffix +=
      '}catch(e){return ' +
      callWithoutArgs(error, buildState, routerState) +
      (error.length > 1 ? '(e,c);' : '(e);') +
      '}';
  }

  // Build parsers
  if (typeof router.beforeParse === 'function')
    prefix += callWithContextStatement(router.beforeParse, buildState, routerState);
  for (let i = 0, { parsers } = router; i < parsers.length; i++) {
    const parser = parsers[i];

    if (typeof parser.name === 'string') {
      const { name } = parser;

      // Check illegal names
      if (name === 'req') throw new Error('cannot override c.req!');
      else if (name === 'res') throw new Error('cannot override c.res!');

      prefix += `c${accessProperty(name)}=`;
      routerState[1].push(name);
    }

    prefix += callWithContextStatement(parser.init, buildState, routerState);
    if (typeof parser.deinit === 'function') {
      prefix += 'try{';
      suffix =
        `}finally{${callWithContextStatement(parser.deinit, buildState, routerState)}}` + suffix;
    }
  }
  if (typeof router.afterParse === 'function')
    prefix += callWithContextStatement(router.afterParse, buildState, routerState);

  // Build routes
  {
    let routeContextPrefix = 'let c={req,res:new ResponseInfo';
    for (
      let i = 0, contextKeys = new Set(routerState[1]).values().toArray();
      i < contextKeys.length;
      i++
    )
      routeContextPrefix += `,${contextKeys[i]}:void 0`;

    for (let i = 0, { routes } = router, routePrefix = prefix + 'return '; i < routes.length; i++) {
      let route = routes[i],
        routeState = cloneRouterState(routerState),
        routeContent =
          routePrefix + callWithContextStatement(route.fn, buildState, routeState) + suffix;

      buildState.addRoute(
        route.method,
        normalizePattern(basePattern + route.pattern),
        routeContent,
        routeContextPrefix,
        routeState,
      );
    }
  }

  // Build subroutes
  for (let i = 0, routers = router.routers as Router<any>[]; i < routers.length; i++)
    buildRouter(routers[i], buildState, cloneRouterState(routerState), basePattern, prefix, suffix);
};

export const build = (router: Router<BaseContext>, buildState: BuildState): void => {
  buildRouter(router, buildState, [0, []], '', '', '');
};
