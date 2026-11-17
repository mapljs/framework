import type { Id } from '../core/hook.mts';

export const request: Id<Request> = 'wintertc:request' as any,
  query: Id<string> = 'wintertc:query' as any,
  params: Id<Record<string, string | undefined>> = 'wintertc:params' as any,
  context: Id<Required<ResponseInit>> = 'wintertc:context' as any;
