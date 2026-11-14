export type Evaluate<T> = {
  [K in keyof T]: T[K];
} & {};

export const get_args = (...args: any[]): any => args;
export const get_args_with_tags =
  (...tags: any[]) =>
  (...args: any[]): any =>
    tags.concat(args);
