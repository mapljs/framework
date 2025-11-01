import type { Macro, Router, ScopeState } from '../index.js';
import { registerHandler } from '../hooks.js';

import { countParams } from '@mapl/router/utils';

/**
 * Use in `default` and `build` mode
 */
const build = (
  router: Router<any>,
  state: ScopeState,
  pathPrefix: string,
  paramCount: number,
  content: string,
): void => {
  for (let i = 0, layers = router[0]; i < layers.length; i++) {
    const layer = layers[i];
    content += typeof layer === 'string' ? layer : layer(state);
  }

  const routes = router[1];
  for (const childPath in routes) {
    const methods = routes[childPath];
    const childPathParams = paramCount + countParams(childPath);

    for (const method in methods) {
      const routeState = state.slice();
      const handler = methods[method];

      registerHandler(
        method,
        pathPrefix + childPath,
        content +
          (typeof handler === 'string'
            ? handler
            : handler(routeState, childPathParams)),
        routeState,
      );
    }
  }

  if (router[2] != null) {
    const children = router[2];

    // Fast path for some cases
    if (pathPrefix === '')
      for (const childPath in children)
        build(
          children[childPath],
          state.slice(),
          childPath === '/' ? '' : childPath,
          paramCount + countParams(childPath),
          content,
        );
    else
      for (const childPath in children)
        build(
          children[childPath],
          state.slice(),
          pathPrefix + childPath,
          paramCount + countParams(childPath),
          content,
        );
  }
};

export default build;
