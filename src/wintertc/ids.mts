import type { Id } from '../core/hook.mts';

export { params } from '../core/compiler.mts';
export const request: Id<Request> = 'wintertc:request' as any,
  query: Id<string> = 'wintertc:query' as any,
  context: Id<Required<ResponseInit>> = 'wintertc:context' as any;
