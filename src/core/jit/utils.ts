const IDENTIFIER_REGEX = /$[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*^/u;
export const accessProperty = (name: string): string =>
  IDENTIFIER_REGEX.test(name) ? '.' + name : `[${JSON.stringify(name)}]`;

const AsyncFunction = (async () => {}).constructor;
export const isAsyncFunction = (fn: any): boolean => fn instanceof AsyncFunction;

export const hasFlag = (flag: number, flags: number): boolean => (flags & flag) === flag;
