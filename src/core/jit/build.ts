import { ref } from 'runtime-compiler';

import type { Router } from '../router.ts';
import type { BaseContext } from '../../index.ts';
import { accessProperty, isAsyncFunction } from './utils.ts';
import { normalizePattern } from '../../utils/pattern.ts';
import { ResponseInfo } from '../response.ts';

const defaultGlobals = `let ResponseInfo=$[${ref(ResponseInfo)}];`
export abstract class BuildState {
  /**
   * Add code for a route.
   *
   * Must handle HEAD requests for routes without a HEAD handler.
   */
  abstract readonly addRoute: (method: string, pattern: string, code: string, routeState: RouterState) => void;

  /**
   * Finalize to a handler string.
   */
  abstract readonly finalize: () => string;

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

export const REQUIRE_ASYNC = 0b1;

export const nextId = (state: BuildState): string => 'r' + state.nextId++;
export const createGlobalId = (state: BuildState, value: any): string => {
  const valueRef = ref(value),
    id = nextId(state);
  state.globals += `let ${id}=$[${valueRef}]`;
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
): string =>
  callWithoutArgs(fn, buildState, routerState) + (fn.length > 0 ? '(c);' : '();');

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
      // Check illegal names
      if (parser.name === 'req') throw new Error('cannot override c.req!');
      else if (parser.name === 'res') throw new Error('cannot override c.res!');

      prefix += `c${accessProperty(parser.name)}=`;
      routerState[1].push(parser.name);
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
    let routePrefix = 'let c={req,res:new ResponseInfo';
    for (
      let i = 0, contextKeys = (routerState[1] = new Set(routerState[1]).values().toArray());
      i < contextKeys.length;
      i++
    )
      routePrefix += `,${contextKeys[i]}:void 0`;
    routePrefix += `};${prefix}return `;

    for (let i = 0, { routes } = router; i < routes.length; i++) {
      let route = routes[i],
        routeState = cloneRouterState(routerState),
        routeContent =
          routePrefix + callWithContextStatement(route.fn, buildState, routeState) + suffix;

      buildState.addRoute(
        route.method,
        normalizePattern(basePattern + route.pattern),
        routeContent,
        routeState
      );
    }
  }

  // Build subroutes
  for (let i = 0, routers = router.routers as Router<any>[]; i < routers.length; i++)
    buildRouter(routers[i], buildState, cloneRouterState(routerState), basePattern, prefix, suffix);
};

export const build = (router: Router<BaseContext>, buildState: BuildState): string => (
  buildRouter(router, buildState, [0, []], '', '', ''),
  buildState.finalize()
);
