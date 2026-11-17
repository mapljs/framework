import { get_args, get_args_with_tags } from './utils.mts';

export type AnyHook = [number, ...any[]];

export type Id<T = unknown> = string & { '~V': T };
export type InferIds<Requires extends Id[]> = {
  [K in keyof Requires]: Requires[K]['~V'];
};
export type ParsedId<T extends Id> = T['~V'] | Promise<T['~V']>;

/**
 * Create a dependency.
 */
export const id = <T,>(id: unknown = Symbol()): T extends Promise<any> ? never : Id<T> => id as any,
  group: <const Hook extends AnyHook[]>(...hook: Hook) => Hook = get_args,
  /**
   * Parse a value.
   */
  parse: <TargetId extends Id, const Hook extends any[], Requires extends Id[] = []>(
    ...hook: Hook &
      [
        id: TargetId,
        parse: (...args: InferIds<Requires>) => ParsedId<TargetId>,
        ...requires: Requires,
      ]
  ) => [1, ...Hook] = get_args_with_tags(1),
  /**
   * Create a resource.
   */
  resource: <TargetId extends Id<Disposable>, const Hook extends any[], Requires extends Id[] = []>(
    ...hook: Hook &
      [id: TargetId, f: (...args: InferIds<Requires>) => ParsedId<TargetId>, ...requires: Requires]
  ) => [3, ...Hook] = get_args_with_tags(3),
  /**
   * Create an async resource.
   */
  async_resource: <
    TargetId extends Id<Disposable>,
    const Hook extends any[],
    Requires extends Id[] = [],
  >(
    ...hook: Hook &
      [id: TargetId, f: (...args: InferIds<Requires>) => ParsedId<TargetId>, ...requires: Requires]
  ) => [5, ...Hook] = get_args_with_tags(5),
  /**
   * Use an external value.
   */
  use: <TargetId extends Id<Disposable>, const Hook extends any[]>(
    ...hook: Hook & [id: TargetId, value: ParsedId<TargetId>]
  ) => [7, ...Hook] = get_args_with_tags(7),
  /**
   * Build an external value.
   */
  build: <TargetId extends Id<Disposable>, const Hook extends any[], Requires extends Id[] = []>(
    ...hook: Hook &
      [
        id: TargetId,
        value: (...args: InferIds<Requires>) => ParsedId<TargetId>,
        ...requires: Requires,
      ]
  ) => [9, ...Hook] = get_args_with_tags(9),
  /**
   * Run something before handling.
   */
  run: <const Hook extends any[], Requires extends Id[] = []>(
    ...hook: Hook & [f: (...args: InferIds<Requires>) => any, ...requires: Requires]
  ) => [2, ...Hook] = get_args_with_tags(2),
  /**
   * Run something after handling.
   */
  defer: <const Hook extends any[], Requires extends Id[] = []>(
    ...hook: Hook & [f: (...args: InferIds<Requires>) => any, ...requires: Requires]
  ) => [4, ...Hook] = get_args_with_tags(4),
  /**
   * Run on error.
   */
  error: <const Hook extends any[], Requires extends Id[] = []>(
    ...hook: Hook &
      [
        f: (err: unknown, ...args: InferIds<Requires>) => Response | Promise<Response>,
        ...requires: Requires,
      ]
  ) => [6, ...Hook] = get_args_with_tags(6);
