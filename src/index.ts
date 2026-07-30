import send from './parsers/send.ts';
import type { Parser, InferParsers } from './parsers/types.ts';
import type { InferParams } from '@mapl/pattern-router/tree/utils';
import type { Cotravariant, Evaluate } from './utils/types.ts';

type InferContextParams<BaseContext extends {}, Pattern extends string> =
  {} extends InferParams<Pattern>
    ? BaseContext
    : BaseContext &
        (BaseContext extends {
          params: infer Params;
        }
          ? {
              params: Params & InferParams<Pattern>;
            }
          : {
              params: InferParams<Pattern>;
            });

export const init = <
  BaseContext extends {},
  const Pattern extends string,
  const Parsers extends Parser<NoInfer<PatternContext>>[],
  const Routes extends {
    readonly '~route': Cotravariant<ParsersContext>;
  }[],
  const Routers extends {
    readonly '~router': Cotravariant<ParsersContext>;
  }[],
  // Inferred
  PatternContext extends {} = Evaluate<InferContextParams<BaseContext, Pattern>>,
  ParsersContext extends {} = Evaluate<InferParsers<PatternContext, Parsers>>,
>(
  pattern: Pattern,
  parsers: Parsers,
  routes: Routes,
  routers: Routers,
): {
  readonly '~router': Cotravariant<BaseContext>;
  readonly pattern: Pattern;
  readonly parsers: Parsers;
  readonly routes: Routes;
  readonly routers: Routers;
} => ({ pattern, parsers, routes, routers }) as any;

export const route = <
  BaseContext extends {},
  Pattern extends string,
  Method extends string,
  const R extends Response | Promise<Response>,
  // Inferred
  PatternContext extends {} = InferContextParams<BaseContext, Pattern>,
>(
  method: Method,
  pattern: Pattern,
  fn: (c: PatternContext) => R,
): {
  readonly '~route': Cotravariant<BaseContext>;
  readonly pattern: Pattern;
  readonly method: Method;
  readonly fn: (c: PatternContext) => R;
} => ({ pattern, method, fn }) as any;

// Example
{
  init(
    '/:id',
    [send],
    [route('GET', '/', (c) => c.send.body(c.params.id))],
    [init('/:org', [], [route('GET', '/', (c) => c.send.body(c.params.id + c.params.org))], [])],
  );
}
