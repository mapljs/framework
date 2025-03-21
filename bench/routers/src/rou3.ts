import { addRoute, createRouter, findRoute } from 'rou3';
import type { IRouter, IHandler } from '../types';

export const main: IRouter = {
  name: 'rou3',
  fn: (routes) => {
    const router = createRouter<IHandler>();
    for (const route of routes) {
      addRoute(
        router,
        route.method,
        route.path.endsWith('*') ? route.path + '*' : route.path,
        route.item
      );
    }

    return (method, path) => {
      const res = findRoute(router, method, path);
      return res == null ? null : [res.data, res.params];
    }
  }
}
