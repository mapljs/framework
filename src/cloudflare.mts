import type { ExecutionContext, Request as WorkerRequest } from '@cloudflare/workers-types';

import type { Group } from './core/route.mts';
import { compile_to_string as compile_group_to_string } from './wintertc/compiler.mts';
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
 * preparsed symbol
 * @internal
 */
export const symbols: Map<any, string> = new Map<any, string>([
    [request, 'r'],
    [query, 'e===-1?"":u.slice(e)'],
    [params, 'm.groups'],
    [context, 'c'],

    [worker_request, 'r'],
    [worker_env, 'v'],
    [execution_context, 'x'],
  ]),
  /**
   * Compile a group to string.
   */
  compile_to_string = (group: Group, parentPath: string): string =>
    `return async function(r,v,x){return (this.fetch=await (async(v,x)=>{${compile_group_to_string(group, parentPath, symbols, 'r,v,x')}})(v,x))(r,v,x)}`,
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
