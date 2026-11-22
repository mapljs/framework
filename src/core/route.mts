import type { InferParams  } from '@mapl/pattern-router/tree/utils';
import { get_args, get_args_with_tags } from './utils.mts';
import type { Id, InferIds, AnyHook } from './hook.mts';

/**
 * A route handler.
 */
export type Handler = [string, string, (...args: any[]) => any, ...Id[]];

/**
 * A route group.
 */
export type Group =
  | [AnyHook[], ...Handler[]]
  | [AnyHook[], Record<`/${string}`, Group>, ...Handler[]];

export type InferPathParams<Path extends string> = Readonly<Record<string, string | undefined> & InferParams<Path>>;

/**
 * Create a request handler.
 */
type CreateRequestHandler<Method extends string> = <
  const Route extends any[],
  Path extends string,
  Requires extends Id[] = [],
>(
  path: Path,
  ...handler: Route &
    [
      handle: (
        ...args: [
          ...requires: InferIds<Requires>,
          params: InferPathParams<Path>,
        ]
      ) => any,
      ...requires: Requires,
    ]
) => [Method, Path, ...Route];

/**
 * Create a request handler.
 */
export const handle: <
    Route extends any[],
    Method extends string,
    Path extends string,
    Requires extends Id[] = [],
  >(
    ...handler: Route &
      [
        method: Method,
        path: Path,
        handle: (
          ...args: [
            ...requires: InferIds<Requires>,
            params: InferPathParams<Path>,
          ]
        ) => any,
        ...requires: Requires,
      ]
  ) => Route = get_args,
  get: CreateRequestHandler<'GET'> = get_args_with_tags('GET'),
  post: CreateRequestHandler<'POST'> = get_args_with_tags('POST'),
  put: CreateRequestHandler<'PUT'> = get_args_with_tags('PUT'),
  del: CreateRequestHandler<'DELETE'> = get_args_with_tags('DELETE'),
  patch: CreateRequestHandler<'PATCH'> = get_args_with_tags('PATCH'),
  options: CreateRequestHandler<'OPTIONS'> = get_args_with_tags('OPTIONS'),
  trace: CreateRequestHandler<'TRACE'> = get_args_with_tags('TRACE'),
  any: CreateRequestHandler<''> = get_args_with_tags(''),
  group: <const T extends Group>(...group: T) => T = get_args;
