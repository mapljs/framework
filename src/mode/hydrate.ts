import type { Router, ScopeState } from '../index.js';

/**
 * Use in `default` and `build` mode
 */
const hydrate = (router: Router<any>, state: ScopeState): void => {
  for (let i = 0, layers = router[0]; i < layers.length; i++) {
    const layer = layers[i];
    typeof layer !== 'string' && layer(state);
  }

  const routes = router[1];
  for (const childPath in routes) {
    const methods = routes[childPath];

    for (const method in methods) {
      const handler = methods[method];
      typeof handler !== 'string' && handler(state.slice(), 0);
    }
  }

  if (router[2] != null) {
    const children = router[2];
    for (const childPath in children)
      hydrate(children[childPath], state.slice());
  }
};

export default hydrate;
