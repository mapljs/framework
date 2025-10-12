import { isErr, type Err } from '@safe-std/error';
import {
  injectExternalDependency,
  lazyDependency,
  AsyncFunction
} from 'runtime-compiler';
import { isHydrating } from 'runtime-compiler/config';

export const IS_ERR_FN: () => string = lazyDependency(
  injectExternalDependency,
  isErr,
);

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
export type Hook<T extends any[], R = string> = (
  ...args: [...data: T, scope: Readonly<ScopeState>]
) => R;

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

const paramsCache: string[] = [''];

export const getParamArgs = (len: number): string => {
  while (len >= paramsCache.length) {
    const idx = paramsCache.length;
    paramsCache.push(paramsCache[idx - 1] + constants.PARAMS + idx + ',');
  }

  return paramsCache[len];
}

export const hooks: {
  compileHandler: Hook<
    [handler: Handler, prevContent: string, fullpath: string],
    void
  >;
  compileErrorHandler: Hook<[input: string, ...ErrorHandler]>;
} = {} as any;

// Init context
export let contextInit = '';
export const setContextInit = (init: string): void => {
  contextInit = init;
};

// Error compiler
export const compileErrorHandler = (input: string, scope: ScopeState): string =>
  (scope[3] ??= hooks.compileErrorHandler(
    input,
    scope[2]![0],
    scope[2]![1],
    scope,
  ));
export const clearErrorHandler = (scope: ScopeState): void => {
  scope[2] != null && (scope[3] = null);
};
export const compileErrorCheck = (scope: ScopeState, value: string): string =>
  'if(' +
  IS_ERR_FN() +
  '(' +
  value +
  ')){' +
  compileErrorHandler(value, scope) +
  '}';

// Context creation
export const createContext: (scope: ScopeState) => string = isHydrating
  ? (scope) => {
      if (!scope[1]) {
        scope[1] = true;
        clearErrorHandler(scope);
      }
      return '';
    }
  : (scope) => {
      if (scope[1]) return '';
      scope[1] = true;
      clearErrorHandler(scope);
      return contextInit;
    };
export const setContextProp = (prop: string, val: string): string =>
  constants.CTX + '.' + prop + '=' + val + ';';

export const createAsyncScope: (scope: ScopeState) => string = isHydrating
  ? (scope) => {
      if (!scope[0]) {
        scope[0] = true;
        clearErrorHandler(scope);
      }
      return '';
    }
  : (scope) => {
      if (scope[0]) return '';
      scope[0] = true;
      clearErrorHandler(scope);
      return constants.ASYNC_START;
    };

// Temporary values
export const createTmp = (scope: ScopeState): void => {
  scope[4] = true;
};
export const setTmpValue = (scope: ScopeState, value: string): string => {
  if (scope[4]) return constants.TMP + '=' + value + ';';
  scope[4] = true;
  return 'let ' + constants.TMP + '=' + value + ';';
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
        createTmp(scope);
        IS_ERR_FN();
        compileErrorHandler(constants.TMP, scope);
      } else if (id === 3) {
        createTmp(scope);
        IS_ERR_FN();
        compileErrorHandler(constants.TMP, scope);
        createContext(scope);
      }
    }
  }

  // Register handlers
  for (let i = 0, handlers = group[1]; i < handlers.length; i++) {
    const handler = handlers[i];
    hooks.compileHandler(
      handler,
      '',
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
        content += createContext(scope) + setContextProp(middleware[2], call);
      else if (id === 2)
        // Check directly instead of creating temporary variables
        content += setTmpValue(scope, call) + compileErrorCheck(scope, constants.TMP);
      else if (id === 3) {
        content +=
          setTmpValue(scope, call) +
          compileErrorCheck(scope, constants.TMP) +
          createContext(scope) +
          setContextProp(middleware[2], constants.TMP);
      }
    }
  }

  // Register handlers
  for (let i = 0, handlers = group[1]; i < handlers.length; i++) {
    const handler = handlers[i];
    // Compile a route
    hooks.compileHandler(
      handler,
      content,
      prefix + (handler[1] === '/' || prefix !== '' ? '' : handler[1]),
      scope,
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
