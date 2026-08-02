export { default as requires } from './core/router.ts';

import type { ResponseSender } from './core/response.ts';
import { initUntyped, type RouterInit } from './core/router.ts';

export interface BaseContext {
  req: Request;
  res: ResponseSender;
}
export const router: RouterInit<BaseContext> = initUntyped;
