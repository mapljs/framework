import { type Router, insertItem } from '@mapl/router/method';
import type { Err } from 'safe-throw';

/**
 * Describe a middleware function
 */
export type MiddlewareFunc<T = unknown> = (c: T, ...args: any[]) => any;

/**
 * Describe a middleware function
 */
export type Func = (...args: any[]) => any;

/**
 * Describe a function
 */
export type ErrorFunc = (err: Err, ...args: any[]) => any;

/**
 * Describe an error handler
 */
export type ErrorHandler<T extends ErrorFunc = ErrorFunc, Data = any> = [
  handler: T,
  data: Data,
];

/**
 * Describe a middleware
 */
export type Middleware<T extends MiddlewareFunc> =
  | [-1, (scope: ScopeState) => string]
  // Normal middleware (with or without error validation)
  | [0 | 2, T]
  // Bind value to context
  | [1 | 3, T, key: string];

/**
 * Describe a handler store
 */
export type Handler<T extends Func = Func, Data = unknown> = [
  method: string,
  path: string,
  handler: T,
  data: Data,
];

/**
 * Describe a handler group
 */
export type Group<
  E extends ErrorFunc = ErrorFunc,
  T extends Func = Func,
  Data = any,
> = [
  middlewares: Middleware<T>[],
  handlers: Handler<T, Data>[],
  errHandler: ErrorHandler<ErrorFunc, Data> | null | undefined,
  children: Record<string, Group<E, T, Data>> | null | undefined,
];

/**
 * Describe a hook
 */
export type Hook<T extends any[]> = (
  ...args: [...data: T, scope: Readonly<ScopeState>]
) => string;

/**
 * State for compilation
 */
export type CompilerState = [
  router: Router<string>,
  dependencies: any[],
  contextInit: string,
  compileHandler: Hook<[handler: Handler[2], data: Handler[3], path: string]>,
  compileErrorHandler: Hook<ErrorHandler>,
];

/**
 * This state doesn't change frequently
 */
export type ScopeState = [
  scopeAsync: boolean,
  contextCreated: boolean,
  errorHandler: ErrorHandler | null | undefined,
  compiledErrorHandler: string | null | undefined,
  hasTmp: boolean,
];

/**
 * The context initialization function
 */
export type ContextInit<T = unknown> = (headers: [string, string][]) => T;

export const createArgSet = (args: string[]): string[] => {
  const len = args.length;
  const arr = new Array(len + 1);
  arr[0] = '';
  for (let i = 1; i <= len; i++) arr[i] = args.slice(0, i).join();
  return arr;
};

export const concatPrefix = (prefix: string, path: string): string => {
  const p = prefix + path;
  return /.\/$/.test(p) ? prefix : p;
};

// Detect async functions
export const AsyncFunction: Function = (async () => {}).constructor;

// Compiler state
export const compilerState: CompilerState = new Array(5) as any;

// Utils
export const compileErrorHandler = (scope: ScopeState): string => scope[3] ??= compilerState[4](scope[2]![0], scope[2]![1], scope);
export const clearErrorHandler = (scope: ScopeState): void => {
  if (scope[2] != null) scope[3] = null;
}

export const createContext = (scope: ScopeState): string => {
  if (scope[1]) return '';

  scope[1] = true;
  clearErrorHandler(scope);
  return compilerState[2];
};

export const createAsyncScope = (scope: ScopeState): string => {
  if (scope[0]) return '';

  scope[0] = true;
  clearErrorHandler(scope);
  return constants.ASYNC_START;
};

export const setTmp = (scope: ScopeState): string => {
  if (scope[4]) return constants.TMP;
  scope[4] = true;
  return 'let ' + constants.TMP;
}

// Main fn
export const compileGroup = (
  group: Group,
  scope: ScopeState,

  // Path prefix
  prefix: string,
  // Previously built content
  content: string,
): void => {
  // Reset error handler when necessary
  if (group[2] != null) {
    scope[2] = group[2];
    scope[3] = null;
  }

  // Compile middlewares
  for (let i = 0, middlewares = group[0]; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    const fn = middleware[1];
    const id = middleware[0];

    if (id === -1) content += fn(scope);
    else {
      // Analyze function args
      let call = constants.DEP + compilerState[1].push(fn) + '(';
      if (fn.length > 0) {
        call += constants.CTX;
        content += createContext(scope);
      }
      call += ')';

      // Wrap everything in async if necessary
      if (fn instanceof AsyncFunction) {
        call = 'await ' + call;
        content += createAsyncScope(scope);
      }

      if (id === 0)
        // Assign call directly
        content += call + ';';
      else if (id === 1)
        // Assign to context variable
        content +=
          createContext(scope) +
          constants.CTX +
          '.' +
          middleware[2] +
          '=' +
          call +
          ';';
      else if (id === 2)
        // Check directly instead of creating temporary variables
        content +=
          'if(' +
          constants.IS_ERR +
          '(' +
          call +
          ')){' +
          compileErrorHandler(scope) +
          '}';
      else if (id === 3) {
        content +=
          // Create temporary variable
          setTmp(scope) +
          '=' +
          call +
          // Check error
          ';if(' +
          constants.IS_ERR +
          '(' +
          constants.TMP +
          ')){' +
          compileErrorHandler(scope) +
          '}' +
          // Assign to context variable
          createContext(scope) +
          constants.CTX +
          '.' +
          middleware[2] +
          '=' +
          constants.TMP +
          ';';
      }
    }
  }

  // Register handlers
  for (
    let i = 0,
      handlers = group[1],
      asyncEnd = scope[0] ? constants.ASYNC_END : '';
    i < handlers.length;
    i++
  ) {
    const handler = handlers[i];
    const pathTransform = concatPrefix(prefix, handler[1]);

    insertItem(
      compilerState[0],

      // Method and analyze path
      handler[0],
      pathTransform,

      // Compile a route
      content +
        compilerState[3](handler[2], handler[3], pathTransform, scope) +
        asyncEnd,
    );
  }

  const childGroups = group[3];
  if (childGroups != null)
    for (const childPrefix in childGroups)
      compileGroup(
        childGroups[childPrefix],
        scope.slice() as any,
        childPrefix === '/' ? prefix : prefix + childPrefix,
        content,
      );
};
