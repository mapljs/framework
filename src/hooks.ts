/**
 * Register handler hook. Only called in `default` and `build` mode.
 */
export let registerHandler: <ScopeState extends any[]>(
  method: string,
  path: string,
  handler: string,
  state: ScopeState,
) => any;
export const onRegisterHandler = (f: typeof registerHandler): void => {
  registerHandler = f;
};
