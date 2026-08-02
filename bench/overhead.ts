import { bench } from 'measure-loop';
import run from './run.ts';
import { ResponseSender } from '@mapl/framework/core/response';

export default run(
  import.meta,
  bench({
    warmupIters: 32,
    iters: 128,
  }).it('c.res', [], () => new ResponseSender()),
);
