import { router, parsers } from '@mapl/framework';
import jit from '@mapl/framework/jit';

const api = router(
  // attach response sender
  [parsers.response],
  // base path for all routes of this instance (optional)
  '/@:org',
).get(
  '/:pkg',
  // inferred context as { res: ResponseSender, params: { org: string, pkg: string } }
  ({ res, params }) => {
    res.headers.set('Powered-By', 'mapl');
    return res.body(`package: @${params.org}/${params.pkg}`);
  },
);

export default {
  // compile to a fetch function
  fetch: jit(api),
};
