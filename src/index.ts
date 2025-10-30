export type Macro<State extends ScopeState> = string | ((state: State) => string);

export type Router<State extends ScopeState> = [
  layers: Macro<State>[],
  routes: [method: string, path: string, ...layers: Macro<State>[]][],
  children?: Record<string, Router<State>>,
];

export interface ScopeState {
  /**
   * Fork the current state
   */
  slice: () => this;
}
