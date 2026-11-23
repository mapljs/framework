import type { ExecutionContext, Request as WorkerRequest } from '@cloudflare/workers-types';

import type { Group } from './core/route.mts';
import { compile_lazy_fn } from './wintertc/compiler.mts';
import {
  context,
  query,
  request,
  worker_request,
  worker_env,
  worker_ctx,
} from './cloudflare/ids.mts';

export * as ids from './cloudflare/ids.mts';

/**
 * Compile a group to string.
 */
export const compile_to_string = (group: Group, parentPath: string): string =>
    compile_lazy_fn(
      group,
      parentPath,
      new Map([
        [request, 'r'],
        [query, 'e===-1?"":u.slice(e)'],
        [context, 'c'],

        [worker_request, 'r'],
        [worker_env, 'v'],
        [worker_ctx, 'x'],
      ]),
      new Map([
        [worker_env, 'v'],
        [worker_ctx, 'x'],
      ]),
      '(r,v,x)',
    ),
  /**
   * Compile a group to a handler function, the setup phase is run on first request.
   */
  compile = (
    group: Group,
  ): (group: Group) => ((
    this: { fetch: any },
    req: WorkerRequest,
    env: Env,
    ctx: ExecutionContext,
  ) => Response | Promise<Response>) => Function('g', compile_to_string(group, 'g')) as any;
