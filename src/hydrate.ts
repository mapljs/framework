import type { Router } from './index.js';

/**
 * Use in `default` and `build` mode
 */
const hydrate = <ScopeState extends any[]>(
  router: Router<ScopeState>,
  state: ScopeState,
  pathPrefix: string
): void => {
  for (let i = 0, layers = router[0]; i < layers.length; i++) {
    const layer = layers[i];
    typeof layer === 'function' && layer(state);
  }

  for (let i = 0, routes = router[1]; i < routes.length; i++) {
    const routeState = state.slice() as ScopeState;

    for (let i = 2, route = routes[i]; i < route.length; i++) {
      const layer = route[i];
      typeof layer === 'function' && layer(routeState);
    }
  }

  if (router[2] != null) {
    const children = router[2];

    // Fast path for some cases
    if (pathPrefix === '')
      for (const childPath in children)
        hydrate(
          children[childPath],
          state.slice() as ScopeState,
          childPath === '/' ? '' : childPath
        );
    else
      for (const childPath in children)
        hydrate(
          children[childPath],
          state.slice() as ScopeState,
          pathPrefix + childPath
        );
  }
};

export default hydrate;
