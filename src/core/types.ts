import type { InferParams } from '@mapl/pattern-router/tree/utils';
import type { Cotravariant, Evaluate } from '../utils/types.ts';

export type InferContextParams<BaseContext extends {}, Pattern extends string> =
  {} extends InferParams<Pattern>
    ? BaseContext
    : Evaluate<
        BaseContext & {
          params: InferParams<Pattern>;
        }
      >;

export interface RequireContext<in T extends {}> {
  '~mapl:context': Cotravariant<T>;
}
