import type { ExecutionContext, Request as WorkerRequest } from '@cloudflare/workers-types';
import { router_init } from '@mapl/pattern-router';

import type { Group } from './core/route.mts';
import { compile_group, compile_fn_body } from './wintertc/compiler.mts';
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
export const compile_to_string = (group: Group, parentPath: string): string => {
    const urlRouter = router_init<string>();
    return `return function(r,v,x){${compile_group(
      group,
      urlRouter,
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
    )};return(this.fetch=(r,v,x)=>${compile_fn_body(urlRouter)})(r,v,x)}`;
  },
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
