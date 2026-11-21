import type { Request as WorkerRequest, ExecutionContext } from '@cloudflare/workers-types';
import type { Id } from '../core/hook.mts';

// auto-merge with other Env declarations
declare global {
  interface Env {}
}

export * from '../wintertc/ids.mts';
export const worker_request: Id<WorkerRequest> = 'cloudflare:request' as any,
  worker_env: Id<Env> = 'cloudflare:env' as any,
  execution_context: Id<ExecutionContext> = 'cloudflare:ctx' as any;
