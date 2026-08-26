import { router } from '@mapl/framework';
import jit from '@mapl/framework/jit';

// Cache response
const errorResponse = new Response(null, { status: 500 });

const api = router(
  // no parsers
  [],
  // base path for all routes of this instance (optional)
  '/@:org',
)
  .get(
    '/:pkg',
    // inferred context as { res: ResponseSender, params: { org: string, pkg: string } }
    ({ res, params }) => {
      res.headers.set('Powered-By', 'mapl');
      return res.body(`package: @${params.org}/${params.pkg}`);
    },
  )
  .on('error', (err) => {
    console.error(err);
    return errorResponse;
  });

export default {
  // compile to a fetch function
  fetch: jit(api),
};
