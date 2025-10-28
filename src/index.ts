export type Macro<ScopeState extends any[]> =
  | string
  | ((scope: ScopeState) => string);

export type Router<ScopeState extends any[]> = [
  layers: Macro<ScopeState>[],
  routes: [
    method: string,
    path: string,
    ...layers: [...Macro<ScopeState>[], Macro<ScopeState>],
  ][],
  children?: Record<string, Router<ScopeState>>,
];
