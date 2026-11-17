import { hook, route } from './index.mts';
import { compile, request } from './wintertc.mts';

const router = route.group(
  [
    hook.error((e) => {
      console.error(e);
      return new Response('L');
    }),
  ],
  route.get('/*', (req) => new Response(req.url), request),
  route.get('/:id', (params) => new Response(params.id)),
);

console.log(compile(router).toString());
