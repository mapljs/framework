import type { InferParams } from '@mapl/pattern-router/tree/utils';
import { get_args, get_args_with_tags } from './utils.mts';
import type { AnyHook, InferHookTags } from './hook.mts';

/**
 * A route handler.
 */
export type Handler = [
  string,
  string,
  (...args: any[]) => Response | Promise<Response>,
  ...AnyHook[],
];

/**
 * A route group.
 */
export type Group =
  | [AnyHook[], ...Handler[]]
  | [AnyHook[], Record<`/${string}`, Group>, ...Handler[]];

/**
 * Create a request handler.
 */
type CreateRequestHandler<Method extends string> = <
  const Route extends any[],
  Path extends string,
  Requires extends AnyHook[] = [],
>(
  path: Path,
  ...handler: Route &
    [
      handle: (
        ...args: [
          ...requires: InferHookTags<Requires>,
          params: Record<string, string | undefined> & InferParams<Path>,
        ]
      ) => Response | Promise<Response>,
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
    Requires extends AnyHook[] = [],
  >(
    ...handler: Route &
      [
        method: Method,
        path: Path,
        handle: (
          ...args: [
            ...requires: InferHookTags<Requires>,
            params: Record<string, string | undefined> & InferParams<Path>,
          ]
        ) => Response | Promise<Response>,
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
