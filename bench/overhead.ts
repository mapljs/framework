import { bench } from 'measure-loop';
import run from './run.ts';
import { ResponseSender } from '@mapl/framework/core/response';

export default run(
  import.meta,
  bench({
    warmupIters: 128,
    iters: 1024,
    gcOnce: true,
  })
    .it('c.res', [], () => new ResponseSender())
    .it('c.res.setHeader()', [() => new ResponseSender()], (res) => {
      res.setHeader('vary', 'origin');
      res.setHeader('content-type', 'text/plain');
    })
    .it('c.res.headers.set()', [() => new ResponseSender()], (res) => {
      res.headers.set('vary', 'origin');
      res.headers.set('content-type', 'text/plain');
    })
    .it('c.res.headers.set() destructed', [() => new ResponseSender()], ({ headers }) => {
      headers.set('vary', 'origin');
      headers.set('content-type', 'text/plain');
    }),
);
