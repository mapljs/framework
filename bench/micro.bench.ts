import { run, bench, summary } from 'mitata';

summary(() => {
  const ARRAY_SIZE = 5;

  const it = (name: string, fn: (arr: number[]) => any) => {
    bench(name, function* () {
      yield {
        [0]: () => new Array(ARRAY_SIZE).fill(0).map((_, i) => i),
        bench: fn,
      };
    });
  };

  it('array shallow clone - spread', (arr) => [...arr]);
  it('array shallow clone - slice', (arr) => arr.slice());
});

summary(() => {
  const OBJECT_SIZE = 5;

  const it = (name: string, fn: (o: Record<string, any>) => any) => {
    bench(name, function* () {
      yield {
        [0]: () =>
          Object.fromEntries(
            new Array(OBJECT_SIZE).fill(0).map((_, i) => ['d' + i, i]),
          ),
        bench: fn,
      };
    });
  };

  it('object shallow clone - spread', (o) => ({ ...o }));
  it('object shallow clone - assign', (o) => Object.assign({}, o));
});

run({
  format: 'markdown',
});
