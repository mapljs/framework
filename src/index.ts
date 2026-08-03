export { default as requires } from './core/router.ts';
export * as parser from './core/parser.ts';

export * as sse from './utils/sse.ts';
export * as cors from './utils/cors.ts';

import type { ResponseSender } from './core/response.ts';
import { initUntyped, type RouterInit } from './core/router.ts';

export interface BaseContext {
  req: Request;
  res: ResponseSender;
}
export const router: RouterInit<BaseContext> = initUntyped;
