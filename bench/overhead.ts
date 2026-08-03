import { bench } from 'measure-loop';
import run from './run.ts';
import { ResponseSender } from '@mapl/framework/core/response';

export default run(
  import.meta,
  bench({
    warmupIters: 64,
    iters: 512,
  }).it('c.res', [], () => new ResponseSender()),
);
