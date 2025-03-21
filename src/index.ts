import type { Method } from '@mapl/router/method';

/**
 * Describe a handler store
 */
export type Handler<T> = [method: Method, path: string, handler: T];

/**
 * Describe a handler group
 */
export type Group<M, T> = [
  middlewares: M[],
  handlers: Handler<T>[],
  errHandler: Handler<T> | null,
  children: ChildGroup<M, T>[]
];

/**
 * Describe a handler child group data
 */
export type ChildGroup<M, T> = [
  prefix: string,
  group: Group<M, T>
];

/**
 * Create a group
 */
export const group = <M, T>(): Group<M, T> => [[], [], null, []];
