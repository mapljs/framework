import { hook, route } from './index.mts';

import { ws, compile } from './cloudflare.mts';
import { context, request } from './wintertc.mts';

const ping = ws.handler({
  onmessage(msg) {
    if (msg.data !== 'ping') {
      this.close();
      return;
    }

    this.send('pong');
  }
});

const router = route.group(
  [
    hook.error((e) => {
      console.error(e);
      return new Response('error', { status: 500 });
    }),
  ],
  route.get('/:id', (params) => new Response(params.id)),
  route.get('/ws', (req, c) => {
    if (ws.upgrade(req))
      return ws.route(ping);

    c.status = 426;
    return new Response('WebSocket upgrade required', c);
  }, request, context)
);

const build = compile(router);
const o = {
  fetch: build(router),
};
console.log(o.fetch.toString());

export default o;
