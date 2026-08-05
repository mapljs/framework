import type { Router } from '../core/router.ts';
import type { BaseContext } from '../index.ts';

export interface BuildState<T> {
  router: T;
  readonly addRoute: (router: T, method: string, path: string, code: string) => void;
  readonly mergeRoutes: (router: T) => string;
}

const REQUIRE_ASYNC = 0b1;
const REQUIRE_CONTEXT = 0b10;

export const buildParsers = (parsers: Router<BaseContext>['parsers'], flags: number) => {};

export const build = (
  router: Router<BaseContext>,
  state: BuildState<unknown>,
  flags: number,
  contextKeys: string[],
): string => {};

export default (router: Router<BaseContext>): ((req: Request) => any) => {};
