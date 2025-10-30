import { registerHandler } from '../hooks.js';
import type { Router, ScopeState } from '../index.js';

/**
 * Use in `default` and `build` mode
 */
const hydrate = (router: Router<any, any>, state: ScopeState): void => {
  for (let i = 0, layers = router[0]; i < layers.length; i++) {
    const layer = layers[i];
    typeof layer !== 'string' && layer(state);
  }

  for (let i = 0, routes = router[1]; i < routes.length; i++) {
    const route = routes[i];

    const routeState = state.slice();

    for (let i = 3; i < route.length; i++) {
      const layer = route[i];
      typeof layer !== 'string' && layer(routeState);
    }

    registerHandler(route[0], '', route[2], '', routeState);
  }

  if (router[2] != null) {
    const children = router[2];
    for (const childPath in children)
      hydrate(children[childPath], state.slice());
  }
};

export default hydrate;
