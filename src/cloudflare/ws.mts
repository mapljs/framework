export const upgrade = (request: Request): boolean => request.headers.get('upgrade') === 'websocket';

export type EventHandlers = {
  [K in 'onopen' | 'onmessage' | 'onerror' | 'onclose']?: WebSocket[K] & {}
};

/**
 * Create a websocket handler.
 */
export const handler = <T extends EventHandlers>(handlers: T): T => handlers;

/**
 * Handle the request using a websocket handler.
 */
export const route = (handlers: EventHandlers): Response => {
  const wsPair = new WebSocketPair();

  wsPair[1].accept();
  Object.assign(wsPair[1], handlers);

  return new Response(null, {
    status: 101,
    webSocket: wsPair[0]
  });
}
