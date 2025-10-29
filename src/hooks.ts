import type { ScopeState } from './index.js';

/**
 * Register handler hook. Only called in `default` and `build` mode.
 */
export let registerHandler: (
  method: string,
  path: string,
  handler: string,
  state: ScopeState,
) => any;
export const onRegisterHandler = (f: typeof registerHandler): void => {
  registerHandler = f;
};
