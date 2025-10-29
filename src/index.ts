export type Macro = string | ((state: ScopeState) => string);

export type Router = [
  layers: Macro[],
  routes: [method: string, path: string, ...layers: Macro[]][],
  children?: Record<string, Router>,
];

export interface ScopeState {
  /**
   * Fork the current state
   */
  slice: () => ScopeState;
}
