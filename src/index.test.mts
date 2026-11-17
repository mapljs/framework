import { hook, route } from './index.mts';
import { compile, ids } from './wintertc.mts';

const router = route.group(
  [
    hook.error((e) => {
      console.error(e);
      return new Response('error', { status: 500 });
    }),
  ],
  route.get('/*', (req) => new Response(req.url), ids.request),
  route.get('/:id', (params) => new Response(params.id)),
);

export default {
  fetch: await compile(router),
};
