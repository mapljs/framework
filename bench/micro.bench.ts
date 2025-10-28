import { bench, summary, do_not_optimize, run } from 'mitata';

summary(() => {
  bench('object clone', function* () {
    yield {
      [0]: () => ({ a: 1, b: 2, c: 3, d: 4, e: 5 }),
      bench: (obj: any) => {
        do_not_optimize({ ...obj });
      },
    };
  }).gc('inner');

  bench('array clone', function* () {
    yield {
      [0]: () => [1, 2, 3, 4, 5],
      bench: (obj: any[]) => {
        do_not_optimize(obj.slice());
      },
    };
  }).gc('inner');
});

run();
