## Goals
- As fast as possible with decent DX.
- Full type introspection.
- Simple, optimizable control flow.
- Framework-agnostic utilities (utilities should only depends on web standard APIs).
- Target-specific optimizations (eg. use `routes` API if target server is `Bun.serve`).
- JIT integration with `runtime-compiler` for AOT compilation support.

## TODO
- **Targets**: `bun`, `deno`, `cloudflare`, `jitless`.
- **Utilities**: Auth, security headers, CSP, cookies, query parsing.
