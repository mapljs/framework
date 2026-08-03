import type { Evaluate, ObjectUnionToIntersect } from '../utils/types.ts';

export interface Parser<
  in Context extends {},
  in out Value = unknown,
  out Key extends string | undefined = string | undefined,
  out Meta = unknown,
> {
  readonly name?: Key;
  readonly init: (c: Context) => Value;
  readonly deinit?: (value: Awaited<Value>, c: Context) => any;
  readonly meta?: Meta;
}

export type InferParser<T extends Parser<any>> = {
  [K in Extract<T['name'], string>]: ReturnType<T['init']>;
};

export type InferParsers<
  BaseContext extends {},
  T extends Parser<BaseContext>[],
> = T['length'] extends 0
  ? BaseContext
  : Evaluate<
      BaseContext &
        ObjectUnionToIntersect<
          {
            [K in Extract<keyof T, number>]: InferParser<T[K]>;
          }[Extract<keyof T, number>]
        >
    >;

export const tap = <BaseContext extends {}, const R, const Meta = undefined>(
  init: (c: BaseContext) => R,
  meta: Meta,
): {
  init: (c: BaseContext) => R;
  meta: Meta;
} => ({ init, meta });
