import type { ObjectUnionToIntersect } from '../utils/types.ts';

export interface Parser<
  in Context extends {},
  in out Value = unknown,
  out Key extends string = string,
> {
  readonly name?: Key;
  readonly init: (c: Context) => Value;
  readonly deinit?: (value: Awaited<Value>, c: Context) => any;
}

export type InferParser<T extends Parser<any>> = {
  [K in Extract<T['name'], string>]: ReturnType<T['init']>;
};

export type InferParsers<BaseContext extends {}, T extends Parser<BaseContext>[]> = BaseContext &
  ObjectUnionToIntersect<
    {
      [K in Extract<keyof T, number>]: InferParser<T[K]>;
    }[Extract<keyof T, number>]
  >;
