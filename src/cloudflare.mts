import type { ExecutionContext, Request as WorkerRequest } from '@cloudflare/workers-types';

import type { Id } from './core/hook.mts';
import type { Group } from './core/route.mts';
import { compile_lazy_fn } from './wintertc/compiler.mts';

import { context, query, request } from './wintertc/ids.mts';

// auto-merge with other Env declarations
declare global {
  interface Env {}
}

export const env: Id<Env> = 'cloudflare:env' as any,
  ctx: Id<ExecutionContext> = 'cloudflare:ctx' as any;

export * as ws from './cloudflare/ws.mts';

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

        [env, 'v'],
        [ctx, 'x'],
      ]),
      new Map([
        [env, 'v'],
        [ctx, 'x'],
      ]),
      '(r,v,x)',
    ),
  /**
   * Compile a group to a handler function, the setup phase is run on first request.
   */
  compile = (
    group: Group,
  ): ((
    group: Group,
  ) => (
    this: { fetch: any },
    req: WorkerRequest,
    env: Env,
    ctx: ExecutionContext,
  ) => Response | Promise<Response>) => Function('g', compile_to_string(group, 'g')) as any;
