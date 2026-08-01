import type { Router } from './core/router.ts';
import type { BaseContext } from './index.ts';

export default (router: Router<BaseContext>): ((req: Request) => any) => {
  // TODO
  return null!;
};
