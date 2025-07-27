import { insertItemWithParts, type Router } from '@mapl/router/method';
import { transformRoute } from '@mapl/router/transform';

import compile from '@mapl/router/method/compiler';
import { o2 } from '@mapl/router/tree/compiler';

import { PARAMS, PATH } from '@mapl/router/constants';

import type { IHandler, IRouter } from '../types';

export const compiled: IRouter = {
  name: 'mapl - compiled',
  fn: (routes) => {
    const router: Router<string> = {};

    const deps: string[] = [];
    const values: IHandler[] = [];

    for (const route of routes) {
      const result = transformRoute(route.path);

      // Bind the function name and return in the result
      const name = 'f' + (values.push(route.item) - 1);
      deps.push(name);

      // Insert the return statement
      insertItemWithParts(
        router,
        route.method,
        result,
        `return[${name},[${result[0].map((_, i) => PARAMS + i).join()}]];`,
      );
    }

    return Function(
      ...deps,
      `return (_,${PATH})=>{${compile(router, o2, '_', '', 0)}}`,
    )(...values);
  },
};
