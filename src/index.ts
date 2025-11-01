export type Macro<State extends ScopeState> =
  | string
  | ((state: State) => string);

export type HandlerMacro<State extends ScopeState> =
  | string
  | ((
    state: State,
    /**
     * Path parameter count of the current route, is the same in `default` and
     * `build` mode but set to `0` in `hydrate` mode.
     *
     * Frameworks can use this field for different handler type tags (tags should be negative)
     */
    paramCount: number
  ) => string);

export type Router<State extends ScopeState> = [
  layers: Macro<State>[],
  routes: Record<string, Record<string, HandlerMacro<State>>>,
  children?: Record<string, Router<State>>,
];

export interface ScopeState {
  /**
   * Fork the current state
   */
  slice: () => this;
}
