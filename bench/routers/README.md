To start the benchmark run `index.bench.ts`.
```sh
# Benchmark on Bun
bun ./index.bench.ts

# Benchmark on Node
bun tsx ./index.bench.ts

# Or go to the root dir and run
bun task bench routers/index # Bun
bun task bench --node routers/index # Node
```

You should do some of [these things](https://llvm.org/docs/Benchmarking.html) for more accurate benchmarking results.
