import type { ValueTag } from '../core/hook.mts';

export interface RawResponse<T extends BodyInit | null> extends Response {
  readonly text: () => Promise<T extends string ? T : T extends null ? '' : string & {}>;
}

export interface JsonResponse<T extends {} | null> extends Response {
  readonly json: () => Promise<T>;
}

export interface ResponseContext extends Required<ResponseInit> {
  headers: Headers;
}

export const body = <T extends BodyInit | null>(c: ResponseInit, body: T): RawResponse<T> =>
  new Response(body, c) as any;

export const html = <T extends BodyInit | null>(c: ResponseInit, body: T): RawResponse<T> => {
  const res = new Response(body, c);
  res.headers.set('content-type', 'text/html');
  return res as any;
};
export const json = <T extends {} | null>(c: ResponseInit, body: T): JsonResponse<T> =>
  Response.json(body, c);

/**
 * Generic response helper.
 */
export const ctx: [-2] & ValueTag<ResponseContext> = [-2] as any;
