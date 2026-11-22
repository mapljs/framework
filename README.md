A fast, simple cross-runtime framework.

```mts
import { hook, route } from '@mapl/framework';
import { compile, ids } from '@mapl/framework/wintertc';

const router = route.group(
  [
    hook.error((e) => {
      console.error(e);
      return new Response('error', { status: 500 });
    }),
  ],
  route.get('*', (req) => new Response(req.url), ids.request),
  route.get('/:id', (params) => new Response(params.id)),
);

export default {
  fetch: compile(router),
};
```

To inspect the compiled handler:
```mts
import { compile_to_string } from '@mapl/framework/wintertc';

const str = compile_to_string(router, 'self');
```

### Cloudflare Workers
```mts
import { compile, compile_to_string, ids } from '@mapl/framework/cloudflare';

ids.worker_request; // a WorkerRequest
ids.worker_env; // your cloudflare Env, can be used in build() hook
ids.worker_ctx; // a request ExecutionContext, can be used in build() hook

export default {
  fetch: compile(router)
}

// inspect compiled handler
const str = compile_to_string(router, 'self');
```
