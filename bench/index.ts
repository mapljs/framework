import { bench, env } from 'measure-loop';
import run from './run.ts';

export default run(
  import.meta,
  bench({
    warmupIters: 32,
    iters: 128,
  })
    .it('env.hrtime()', [], env.hrtime)
    .it('performance.now()', [], performance.now.bind(performance))
    .it('Date.now()', [], Date.now)
);
