import type { ValueTag } from '../core/hook.mts';

/**
 * Typing fixes for `Request`.
 */
export interface RequestContext extends Request {
  json(): Promise<{} | null>;
}

/**
 * Raw query string
 */
export const query: [-1] & ValueTag<string> = [-1] as any;

/**
 * Generic request.
 */
export const ctx: [-3] & ValueTag<RequestContext> = [-3] as any;
