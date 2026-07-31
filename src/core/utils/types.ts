export type ObjectUnionToIntersect<T> = { [K in T as K & string]: K }[any];
export type Evaluate<T> = { [K in keyof T]: T[K] } & {};
export type Cotravariant<T> = (c: T) => 0;
