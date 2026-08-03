import type { ResponseSender } from '../core/response.ts';

/**
 * Return an event stream response.
 */
export const sendEvents = (res: ResponseSender, body: ReadableStream): Response => {
  res.setHeader('content-type', 'text/event-stream');
  res.setHeader('cache-control', 'no-cache');
  res.setHeader('connection', 'keep-alive');
  return new Response(body, res);
};
