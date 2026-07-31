import { router } from '@mapl/framework';

export default router([], '/@:org').get(
  '/:pkg',
  (c) => new Response(`package: @${c.params.org}/${c.params.pkg}`),
);
