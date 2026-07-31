export * as parsers from './core/parsers/index.ts';
export { default as requires } from './core/router.ts';
import { initUntyped, type RouterInit } from './core/router.ts';

export const router: RouterInit<{ req: Request }> = initUntyped;
