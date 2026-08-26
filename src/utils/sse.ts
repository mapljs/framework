/**
 * Return an event stream response.
 *
 * @example
 * ```ts
 * router([])
 *   .get('/events', (c) => createEventStream(
 *     c.res,
 *     createEventStream(c.req)
 *   ));
 * ```
 */
export const createEventStream = (res: { headers: Headers }, body: ReadableStream): Response => {
  res.headers.set('content-type', 'text/event-stream');
  res.headers.set('cache-control', 'no-cache');
  res.headers.set('connection', 'keep-alive');
  return new Response(body, res);
};
