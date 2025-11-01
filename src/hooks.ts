import type { ScopeState } from './index.ts';

/**
 * Register handler hook. Only called in `default` and `build` mode.
 */
export let registerHandler: <State extends ScopeState>(
  method: string,
  path: string,
  content: string,
  state: State,
) => any;
export const onRegisterHandler = (f: typeof registerHandler): void => {
  registerHandler = f;
};
