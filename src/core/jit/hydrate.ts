import type { Router } from '../router.ts';
import type { BaseContext } from '../../index.ts';

import { ref } from 'runtime-compiler';
import { ResponseInfo } from '../response.ts';

export const hydrateGlobals = (): void => {
  ref(ResponseInfo);
}

export const hydrateRouter = (router: Router<BaseContext>): void => {
  // Handle error
  typeof router.error === 'function' && ref(router.error);

  // Build parsers
  typeof router.beforeParse === 'function' && ref(router.beforeParse);
  for (let i = 0, { parsers } = router; i < parsers.length; i++) {
    const parser = parsers[i];

    if (typeof parser.name === 'string') {
      const { name } = parser;

      // Check illegal names
      if (name === 'req') throw new Error('cannot override c.req!');
      else if (name === 'res') throw new Error('cannot override c.res!');
    }

    ref(parser.init);
    typeof parser.deinit === 'function' && ref(parser.deinit);
  }
  typeof router.afterParse === 'function' && ref(router.afterParse);

  // Build subroutes
  for (let i = 0, routers = router.routers as Router<any>[]; i < routers.length; i++)
    hydrateRouter(routers[i]);
};
