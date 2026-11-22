import type { ExecutionContext, Request as WorkerRequest } from '@cloudflare/workers-types';

import type { Group } from './core/route.mts';
import { compile_lazy_fn } from './wintertc/compiler.mts';
import {
  context,
  params,
  query,
  request,
  worker_request,
  worker_env,
  execution_context,
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
        [params, 'm.groups'],
        [context, 'c'],

        [worker_request, 'r'],
        [worker_env, 'v'],
        [execution_context, 'x'],
      ]),
      '(r,v,x)',
    ),
  /**
   * Compile a group to a handler function, the setup phase is run on first request.
   */
  compile = (
    group: Group,
  ): ((
    this: { fetch: any },
    req: WorkerRequest,
    env: Env,
    ctx: ExecutionContext,
  ) => Response | Promise<Response>) => Function('g', compile_to_string(group, 'g'))(group);
