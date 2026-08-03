import type { InferParsers, Parser } from './parser.ts';
import type { InferContextParams, RequireContext } from './types.ts';

export type RouteHandler<BaseContext extends {}, Pattern extends string> = (
  c: InferContextParams<BaseContext, Pattern>,
) => Response | Promise<Response>;

export type RouterEvent = 'error' | 'beforeAll';

export type RouterMethods<
  // Config
  MethodsMap extends Record<string, string>,
  EventsMap extends Record<string, any>,
  // Router props
  BaseContext extends {},
  PatternContext extends {},
  ParserContext extends {},
  Pattern extends string,
  Parsers extends any[],
  Routes extends any[],
  Routers extends any[],
  Events extends Record<RouterEvent, any>,
> = Events & {
  readonly [Name in keyof MethodsMap]: <
    RoutePattern extends string,
    const RouteFn extends RouteHandler<ParserContext, RoutePattern>,
    const Meta = undefined,
  >(
    pattern: RoutePattern,
    fn: RouteFn,
    meta?: Meta,
  ) => Router<
    BaseContext,
    PatternContext,
    ParserContext,
    Pattern,
    Parsers,
    [
      ...Routes,
      {
        pattern: RoutePattern;
        method: MethodsMap[Name];
        fn: RouteFn;
      },
    ],
    Routers,
    Events
  >;
} & {
  readonly route: <
    RouteMethod extends string,
    RoutePattern extends string,
    const RouteFn extends RouteHandler<ParserContext, RoutePattern>,
    const Meta = undefined,
  >(
    method: RouteMethod,
    pattern: RoutePattern,
    fn: RouteFn,
    meta?: Meta,
  ) => Router<
    BaseContext,
    PatternContext,
    ParserContext,
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
    Routers,
    Events
  >;

  readonly mount: <const MountRouters extends Router<ParserContext>[]>(
    ...routers: MountRouters
  ) => Router<
    BaseContext,
    PatternContext,
    ParserContext,
    Pattern,
    Parsers,
    Routes,
    [...Routers, ...MountRouters],
    Events
  >;

  readonly on: <K extends keyof EventsMap, const Handler extends EventsMap[K]>(
    event: K,
    handler: Handler,
  ) => Router<
    BaseContext,
    PatternContext,
    ParserContext,
    Pattern,
    Parsers,
    Routes,
    Routers,
    Events & {
      [key in K]: Handler;
    }
  >;
};

// @ts-ignore
export interface Router<
  in BaseContext extends {},
  in PatternContext extends {} = any,
  in ParserContext extends {} = any,
  // Fields
  in out Pattern extends string = any,
  in out Parsers extends any[] = any,
  in out Routes extends any[] = any,
  in out Routers extends any[] = any,
  in out Events extends Record<RouterEvent, any> = Record<RouterEvent, any>,
>
  extends
    RequireContext<BaseContext>,
    RouterMethods<
      {
        query: 'QUERY';
        get: 'GET';
        post: 'POST';
        put: 'PUT';
        del: 'DELETE';
        patch: 'PATCH';
        options: 'OPTIONS';
        trace: 'TRACE';
      },
      {
        error: (err: unknown, c: PatternContext) => Response | Promise<Response>;
        beforeAll: (c: BaseContext) => any;
      },
      BaseContext,
      PatternContext,
      ParserContext,
      Pattern,
      Parsers,
      Routes,
      Routers,
      Events
    > {
  readonly pattern: Pattern;
  readonly parsers: Parsers;
  readonly routes: Routes;
  readonly routers: Routers;
}

export type RouterInit<BaseContext extends {}> = <
  const Parsers extends Parser<PatternContext>[],
  Pattern extends string = '/',
  PatternContext extends {} = InferContextParams<BaseContext, Pattern>,
>(
  parsers: Parsers,
  pattern?: Pattern,
) => Router<
  BaseContext,
  PatternContext,
  InferParsers<PatternContext, Parsers>,
  Pattern,
  Parsers,
  [],
  [],
  Record<RouterEvent, any>
>;

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
  routes: any[];
  routers: any[];

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

  query(pattern: any, fn: any, meta: any): this {
    this.routes.push(routeUntyped('QUERY', pattern, fn, meta));
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

  error: any;
  beforeAll: any;
  on(event: RouterEvent, handler: any): this {
    this[event] = handler;
    return this;
  }
}
export const initUntyped = (parsers: any, pattern: any): any => new RouterUntyped(pattern, parsers);

export default <BaseContext extends {}>(): RouterInit<BaseContext> => initUntyped as any;
