export interface RawResponse<T extends BodyInit | null> extends Response {
  text(): Promise<T extends string ? T : T extends null ? '' : string>;
}

export interface JsonResponse<T extends {} | null> extends Response {
  json(): Promise<T>;
}

export const json = <const T extends {} | null>(c: ResponseInit, body: T): JsonResponse<T> => Response.json(body, c);
export const html = <const T extends BodyInit | null>(c: ResponseInit, body: T): RawResponse<T> => {
  const res = new Response(body, c);
  res.headers.set('content-type', 'text/html');
  return res as any;
}
