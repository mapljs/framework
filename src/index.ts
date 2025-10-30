export type Macro<State extends ScopeState, Args extends any[] = []> =
  | string
  | ((state: State, ...args: Args) => string);

export type Router<State extends ScopeState, Fn> = [
  layers: Macro<State>[],
  routes: [method: string, path: string, fn: Fn, ...layers: Macro<State>[]][],
  children?: Record<string, Router<State, Fn>>,
];

export interface ScopeState {
  /**
   * Fork the current state
   */
  slice: () => this;
}
