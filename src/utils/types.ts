export type ObjectUnionToIntersect<T> = { [K in T as K & string]: K }[any];
export type Evaluate<T> = { [K in keyof T]: T[K] } & {};
export type DelayInfer<T> = [T][T extends any ? 0 : never];

export type Cotravariant<T> = (c: T) => 0;
