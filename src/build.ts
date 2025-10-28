import type { Router } from './index.js';
import { registerHandler } from './hook.js';

/**
 * Use in `default` and `build` mode
 */
const build = <ScopeState extends any[]>(
  router: Router<ScopeState>,
  state: ScopeState,
  pathPrefix: string,
  content: string,
): void => {
  for (let i = 0, layers = router[0]; i < layers.length; i++) {
    const layer = layers[i];
    content += typeof layer === 'string' ? layer : layer(state);
  }

  for (let i = 0, routes = router[1]; i < routes.length; i++) {
    const route = routes[i];

    let routeContent = content;
    const routeState = state.slice() as ScopeState;

    for (let i = 2; i < route.length; i++) {
      const layer = route[i];
      routeContent += typeof layer === 'string' ? layer : layer(routeState);
    }

    registerHandler(route[0], pathPrefix + route[1], routeContent, routeState);
  }

  if (router[2] != null) {
    const children = router[2];

    // Fast path for some cases
    if (pathPrefix === '')
      for (const childPath in children)
        build(
          children[childPath],
          state.slice() as ScopeState,
          childPath === '/' ? '' : childPath,
          content,
        );
    else
      for (const childPath in children)
        build(
          children[childPath],
          state.slice() as ScopeState,
          pathPrefix + childPath,
          content,
        );
  }
};

export default build;
