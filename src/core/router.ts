import type { InferParsers, Parser } from './parsers/types.ts';
import type { InferContextParams, RequireContext } from './types.ts';
import type { Evaluate } from './utils/types.ts';

export type RouteRegister<
  RouteMethod extends string,
  BaseContext extends {},
  Context extends {},
  Pattern extends string,
  Parsers extends any[],
  Routes extends any[],
  Routers extends any[],
> = <
  RoutePattern extends string,
  const RouteFn extends (c: InferContextParams<Context, RoutePattern>) => any,
  const Meta = undefined,
>(
  pattern: RoutePattern,
  fn: RouteFn,
  meta?: Meta,
) => Router<
  BaseContext,
  Context,
  Pattern,
  Parsers,
  [
    ...Routes,
    {
      pattern: RoutePattern;
      method: RouteMethod;
      fn: RouteFn;
    },
  ],
  Routers
>;

export interface Router<
  BaseContext extends {},
  Context extends {} = any,
  // Fields
  Pattern extends string = string,
  Parsers extends any[] = any[],
  Routes extends any[] = any[],
  Routers extends any[] = any[],
> extends RequireContext<BaseContext> {
  readonly pattern: Pattern;
  readonly parsers: Parsers;
  readonly routes: Routes;
  readonly routers: Routers;

  readonly route: <
    RouteMethod extends string,
    RoutePattern extends string,
    const RouteFn extends (c: InferContextParams<Context, RoutePattern>) => any,
    const Meta = undefined,
  >(
    method: RouteMethod,
    pattern: RoutePattern,
    fn: RouteFn,
    meta?: Meta,
  ) => Router<
    BaseContext,
    Context,
    Pattern,
    Parsers,
    [
      ...Routes,
      {
        pattern: RoutePattern;
        method: RouteMethod;
        fn: RouteFn;
      },
    ],
    Routers
  >;

  readonly get: RouteRegister<'GET', BaseContext, Context, Pattern, Parsers, Routes, Routers>;
  readonly post: RouteRegister<'POST', BaseContext, Context, Pattern, Parsers, Routes, Routers>;
  readonly put: RouteRegister<'PUT', BaseContext, Context, Pattern, Parsers, Routes, Routers>;
  readonly del: RouteRegister<'DELETE', BaseContext, Context, Pattern, Parsers, Routes, Routers>;
  readonly patch: RouteRegister<'PATCH', BaseContext, Context, Pattern, Parsers, Routes, Routers>;
  readonly options: RouteRegister<
    'OPTIONS',
    BaseContext,
    Context,
    Pattern,
    Parsers,
    Routes,
    Routers
  >;
  readonly trace: RouteRegister<'TRACE', BaseContext, Context, Pattern, Parsers, Routes, Routers>;

  readonly mount: <MountRouters extends Router<Context>[]>(
    ...routers: MountRouters
  ) => Router<BaseContext, Context, Pattern, Parsers, Routes, [...Routers, ...MountRouters]>;
}

export type RouterInit<BaseContext extends {}> = <
  const Parsers extends Parser<PatternContext>[],
  Pattern extends string = '/',
  PatternContext extends {} = InferContextParams<BaseContext, Pattern>,
>(
  parsers: Parsers,
  pattern?: Pattern,
) => Router<BaseContext, Evaluate<InferParsers<PatternContext, Parsers>>, Pattern, Parsers, [], []>;

interface RouterUntyped extends RequireContext<any> {}
const routeUntyped = (method: any, pattern: any, fn: any, meta: any) => ({
  pattern,
  method,
  fn,
  meta,
});
class RouterUntyped {
  pattern: any;
  parsers: any;
  routes: any;
  routers: any;

  constructor(pattern: any, parsers: any) {
    this.pattern = pattern;
    this.parsers = parsers;
    this.routes = [];
    this.routers = [];
  }

  route(method: any, pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped(method, pattern, fn, meta));
    return this;
  }

  get(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('GET', pattern, fn, meta));
    return this;
  }
  post(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('POST', pattern, fn, meta));
    return this;
  }
  put(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('PUT', pattern, fn, meta));
    return this;
  }
  del(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('DELETE', pattern, fn, meta));
    return this;
  }
  patch(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('PATCH', pattern, fn, meta));
    return this;
  }
  options(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('OPTIONS', pattern, fn, meta));
    return this;
  }
  trace(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('TRACE', pattern, fn, meta));
    return this;
  }

  mount(...routers: any[]): this {
    this.routers.push(...routers);
    return this;
  }
}
export const initUntyped = (parsers: any, pattern: any): RouterUntyped =>
  new RouterUntyped(pattern, parsers);

export default <BaseContext extends {}>(): RouterInit<BaseContext> => initUntyped as any;
