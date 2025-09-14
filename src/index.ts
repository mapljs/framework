import { isErr, type Err } from '@safe-std/error';
import { injectExternalDependency } from 'runtime-compiler';

const IS_ERR = injectExternalDependency(isErr);

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

// Detect async functions
export const AsyncFunction: Function = (async () => {}).constructor;

let hooks: {
  compileHandler: Hook<[handler: Handler[2], data: Handler[3], path: string]>,
  compileErrorHandler: Hook<ErrorHandler>,
  registerCompiled: (method: string, path: string, item: string) => any
};
export const setHooks = (allHooks: Partial<typeof hooks>): void => {
  // @ts-ignore
  hooks = allHooks;
}

// Init context
export let contextInit = '';
export const setContextInit = (init: string): void => {
  contextInit = init;
}

// Utils
export const compileErrorHandler = (scope: ScopeState): string =>
  (scope[3] ??= hooks.compileErrorHandler(scope[2]![0], scope[2]![1], scope));
export const clearErrorHandler = (scope: ScopeState): void => {
  scope[2] != null && (scope[3] = null);
};

export const createContext = (scope: ScopeState): string => {
  if (scope[1]) return '';
  scope[1] = true;
  clearErrorHandler(scope);
  return contextInit;
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
};

/**
 * Required hooks: compileHandler, compileErrorHandler
 */
export const hydrateDependency = (
  group: Group,
  scope: ScopeState,
  prefix: string,
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

    if (id === -1) fn(scope);
    else {
      injectExternalDependency(fn);
      if (fn.length > 0) createContext(scope);

      // Wrap everything in async if necessary
      if (fn instanceof AsyncFunction) createAsyncScope(scope);

      if (id === 1) createContext(scope);
      else if (id === 2) {
        setTmp(scope);
        compileErrorHandler(scope);
      } else if (id === 3) {
        setTmp(scope);
        compileErrorHandler(scope);
        createContext(scope);
      }
    }
  }

  // Register handlers
  for (let i = 0, handlers = group[1]; i < handlers.length; i++) {
    const handler = handlers[i];
    hooks.compileHandler(
      handler[2],
      handler[3],
      prefix + (handler[1] === '/' || prefix !== '' ? '' : handler[1]),
      scope,
    );
  }

  const childGroups = group[3];
  if (childGroups != null)
    for (const childPrefix in childGroups)
      hydrateDependency(
        childGroups[childPrefix],
        scope.slice() as any,
        childPrefix === '/' ? prefix : prefix + childPrefix,
      );
};

/**
 * Required hooks: compileHandler, compileErrorHandler, registerCompiled
 */
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
      let call = injectExternalDependency(fn) + '(';
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
          // Create temporary variable
          setTmp(scope) +
          '=' +
          call +
          // Check error
          ';if(' +
          IS_ERR +
          '(' +
          constants.TMP +
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
          IS_ERR +
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
    const pathTransform =
      prefix + (handler[1] === '/' || prefix !== '' ? '' : handler[1]);

    hooks.registerCompiled(
      // Method and analyze path
      handler[0],
      pathTransform,

      // Compile a route
      content +
        hooks.compileHandler(handler[2], handler[3], pathTransform, scope) +
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
