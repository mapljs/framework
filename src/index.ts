export * as parsers from './core/parser/index.ts';
export { default as requires } from './core/router.ts';

import { initUntyped, type RouterInit } from './core/router.ts';

export interface BaseContext {
  req: Request;
}
export const router: RouterInit<BaseContext> = initUntyped;
