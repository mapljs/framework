import type { InferParsers, Parser } from './parsers/types.ts';
import type { InferParams } from '@mapl/pattern-router/tree/utils';
import send from './parsers/send.ts';
import type { Evaluate, In } from './utils/types.ts';

export type InferContextParams<BaseContext extends {}, Pattern extends string> =
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

const initUntyped = (pattern: any, use: any, routes: any, routers: any): any => ({
  pattern,
  use,
  routes,
  routers,
});

export const context = <BaseContext extends {}>(): (<
  // params
  const Pattern extends string,
  const ContextWithParams extends Evaluate<InferContextParams<BaseContext, Pattern>>,
  // parsers
  const Parsers extends Parser<NoInfer<ContextWithParams>>[],
  const ContextWithParsers extends Evaluate<InferParsers<ContextWithParams, Parsers>>,
  // routes
  const Routes extends {
    '~c': In<NoInfer<ContextWithParsers>>;
  }[],
  const Routers extends {
    '~c': In<NoInfer<ContextWithParsers>>;
  }[],
>(
  pattern: Pattern,
  use: Parsers,
  routes: Routes,
  routers: Routers,
) => {
  '~c': In<BaseContext>;
  pattern: Pattern;
  use: Parsers;
  routes: Routes;
  routers: Routers;
}) => initUntyped as any;

const route = <
  const BaseContext extends {},
  const Method extends string,
  const Pattern extends string,
  const Fn extends (
    c: InferContextParams<NoInfer<BaseContext>, Pattern>,
  ) => Response | Promise<Response>,
  const Meta = undefined,
>(
  method: Method,
  pattern: Pattern,
  fn: Fn,
  meta?: Meta,
): {
  '~c': In<BaseContext>;
  method: Method;
  pattern: Pattern;
  fn: Fn;
  meta: Meta;
} => ({ method, pattern, fn, meta }) as any;

const init = context<{
  req: Request;
}>();

init(
  '/:id',
  [send],
  [route('GET', '/:org', (c) => c.send.body(`@${c.params.org}: ${c.params.id}`))],
  [],
);
