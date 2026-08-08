import { ref } from 'runtime-compiler';

import type { Parser } from '../core/parser.ts';
import type { Router } from '../core/router.ts';
import type { BaseContext } from '../index.ts';
import { accessProperty, isAsyncFunction } from './utils.ts';

export interface BuildState<in out URLRouter = unknown> {
  // URL router
  router: URLRouter;
  readonly addRoute: (router: URLRouter, method: string, path: string, code: string) => void;
  readonly mergeRoutes: (router: URLRouter) => string;

  /**
   * Global declarations.
   *
   * @example
   * state.globals += 'let name = value;';
   */
  globals: string;
}

export type RouterState = [flags: number, contextKeys: Set<string>];

const createGlobalId = (state: BuildState, value: any): string => {
  const valueRef = ref(value),
    id = 'r' + valueRef;
  state.globals += `let ${id}=$[${valueRef}]`;
  return id;
};

const REQUIRE_ASYNC = 0b1,
  REQUIRE_CONTEXT = 0b10;

export const callStatement = (
  fn: (c: any) => any,
  buildState: BuildState,
  routerState: RouterState,
): string =>
  (isAsyncFunction(fn) ? ((routerState[0] |= REQUIRE_ASYNC), 'await ') : '') +
  createGlobalId(buildState, fn) +
  (fn.length > 0 ? ((routerState[0] |= REQUIRE_CONTEXT), '(c);') : '();');

export const build = (
  router: Router<BaseContext>,
  buildState: BuildState<unknown>,
  routerState: RouterState,

  prefix: string,
  suffix: string,
): void => {
  if (typeof router.error === 'function') {
    prefix += 'try{';
    suffix +=
      '}catch(e){return ' +
      createGlobalId(buildState, router.error) +
      (router.error.length > 1 ? ((routerState[0] |= REQUIRE_CONTEXT), '(e,c);') : '(e);') +
      '}';
  }

  if (typeof router.beforeParse === 'function')
    prefix += callStatement(router.beforeParse, buildState, routerState);

  for (let i = 0, parsers = router.parsers as Parser<BaseContext>[]; i < parsers.length; i++) {
    const parser = parsers[i];

    if (typeof parser.name === 'string') {
      prefix += `c${accessProperty(parser.name)}=`;
      routerState[1].add(parser.name);
    }

    prefix += callStatement(parser.init, buildState, routerState);
    if (typeof parser.deinit === 'function') {
      prefix += 'try{';
      suffix = `}finally{${callStatement(parser.deinit, buildState, routerState)}}` + suffix;
    }
  }

  if (typeof router.afterParse === 'function')
    prefix += callStatement(router.afterParse, buildState, routerState);
};

export default (router: Router<BaseContext>): ((req: Request) => any) => {};
