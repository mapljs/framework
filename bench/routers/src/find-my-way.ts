import type { HTTPMethod } from 'find-my-way';
import findMyWay from 'find-my-way';
import type { IRouter } from '../types';

export const main: IRouter = {
  name: 'find-my-way',
  fn: (routes) => {
    const router = findMyWay();
    for (const route of routes)
      router.on(route.method as HTTPMethod, route.path, route.item);

    return (method, path) => {
      const res = router.find(method as HTTPMethod, path);
      return res === null ? null : [res.handler as any, res.params];
    }
  }
};
