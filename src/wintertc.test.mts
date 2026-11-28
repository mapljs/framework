import { hook, route } from './index.mts';
import { compile, params, request } from './wintertc.mts';

const org = hook.id<string>();

const router = route.group(
  [
    hook.error((e) => {
      console.error(e);
      return new Response('error', { status: 500 });
    }),
  ],
  {
    '/@:org': route.group(
      [
        hook.parse(
          org,
          (params) => {
            const org = params.org!;
            if (org !== 'mapl') throw new Error('invalid org');
            return org;
          },
          params,
        ),
      ],
      route.get('/:id+', (org, params) => new Response(`package: @${org}/${params.id}`), org),
    ),
  },
  route.get('/:id', (params) => new Response(params.id)),
  route.get('/*', (req) => new Response(req.url), request),
);

const build = compile(router);
const o = {
  fetch: build(router),
};
console.log(o.fetch.toString());

export default o;
