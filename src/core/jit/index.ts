import { ref } from 'runtime-compiler';

import type { Router } from '../router.ts';
import type { BaseContext } from '../../index.ts';
import { accessProperty, isAsyncFunction } from './utils.ts';
import { normalizePattern } from '../../utils/pattern.ts';
import { ResponseInfo } from '../response.ts';

export const createGlobals = (): string => `let ResponseInfo=$[${ref(ResponseInfo)}];`;

/**
 * BuildState should not have side effects (for example using `ref()` to add more dependencies).
 */
export interface BuildState {
  /**
   * Add code for a route.
   *
   * Must handle HEAD requests for routes without a HEAD handler.
   *
   * @param contextPrefix `let c={...`
   */
  readonly addRoute: (
    method: string,
    pattern: string,
    code: string,
    contextPrefix: string,
    routeState: RouterState,
  ) => void;

  /**
   * Global declarations.
   *
   * @example
   * state.globals += 'let name = value;';
   */
  globals: string;

  /**
   * Next available id.
   */
  nextId: number;
}

export type RouterState = [flags: number];

export const REQUIRE_ASYNC = 1;

export const nextId = (state: BuildState): string => 'r' + state.nextId++;
export const createGlobalId = (state: BuildState, value: any): string => {
  const valueRef = ref(value),
    id = nextId(state);

  state.globals += `let ${id}=$[${valueRef}];`;

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

export const cloneRouterState = (routerState: RouterState): RouterState => routerState.slice() as any;

export const buildRouter = (
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
    for (let i = 0, { routes } = router, routePrefix = prefix + 'return '; i < routes.length; i++) {
      let route = routes[i],
        routeState = cloneRouterState(routerState),
        routeContent =
          routePrefix + callWithContextStatement(route.fn, buildState, routeState) + suffix;

      buildState.addRoute(
        route.method,
        normalizePattern(basePattern + route.pattern),
        routeContent,
        'let c={req,res:new ResponseInfo',
        routeState,
      );
    }
  }

  // Build subroutes
  for (let i = 0, routers = router.routers as Router<any>[]; i < routers.length; i++)
    buildRouter(routers[i], buildState, cloneRouterState(routerState), basePattern, prefix, suffix);
};
