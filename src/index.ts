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
export type ErrorHandler<T extends ErrorFunc = ErrorFunc, Data = any> = [handler: T, data: Data];

/**
 * Describe a middleware
 */
export type Middleware<T extends MiddlewareFunc> =
  [-1, (scope: ScopeState) => string] |
  // Normal middleware (with or without error validation)
  [0 | 2, T] |
  // Bind value to context
  [1 | 3, T, key: string];

/**
 * Describe a handler store
 */
export type Handler<T extends Func = Func, Data = unknown> = [method: string, path: string, handler: T, data: Data];

/**
 * Describe a handler group
 */
export type Group<E extends ErrorFunc = ErrorFunc, T extends Func = Func, Data = any> = [
  middlewares: Middleware<T>[],
  handlers: Handler<T, Data>[],
  errHandler: ErrorHandler<ErrorFunc, Data> | null,
  children: ChildGroup<E, T, Data>[]
];

/**
 * Describe a handler child group data
 */
export type ChildGroup<E extends ErrorFunc, T extends Func, Data = any> = [
  prefix: string,
  group: Group<E, T, Data>
];

/**
 * Describe a hook
 */
export type Hook<T extends any[]> = (
  ...args: [
    ...data: T,
    scope: Readonly<ScopeState>
  ]
) => string;

/**
 * State for compilation
 */
export type CompilerState = [
  router: Router<string>,

  dependencies: any[],
  contextInit: string,

  compileHandler: Hook<[
    handler: Handler[2],
    data: Handler[3],
    path: string
  ]>,

  compileErrorHandler: Hook<ErrorHandler>
];

/**
 * This state doesn't change frequently
 */
export type ScopeState = [
  scopeAsync: boolean,
  contextCreated: boolean,

  errorHandler: ErrorHandler | null,
  compiledErrorHandler: string | null
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
  return (/.\/$/).test(p) ? prefix : p;
};

// Detect async functions
export const AsyncFunction: Function = (async () => { }).constructor;

// Compiler state
export const compilerState: CompilerState = new Array(5) as any;

// Utils
export const createContext = (scope: ScopeState): string => {
  // Create the context when necessary
  if (!scope[1]) {
    scope[1] = true;

    // Reset compiled error
    if (scope[2] !== null)
      scope[3] = null;

    return compilerState[2];
  }

  return '';
}

export const createAsyncScope = (scope: ScopeState): string => {
  if (!scope[0]) {
    scope[0] = true;

    // Reset compiled error
    if (scope[2] !== null)
      scope[3] = null;

    return constants.ASYNC_START;
  }

  return '';
}

// Main fn
export const compileGroup = (
  group: Group,
  scope: ScopeState,

  // Path prefix
  prefix: string,
  // Previously built content
  content: string
): void => {
  // Set error handler
  if (group[2] != null) {
    scope[2] = group[2];
    scope[3] = null;
  }

  // Compile middlewares
  for (let i = 0, middlewares = group[0]; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    const fn = middleware[1];

    if (middleware[0] === -1)
      content += fn(scope);
    else {
      // Analyze function args
      let call = constants.DEP + compilerState[1].push(fn) + '(';
      if (fn.length > 0) {
        call += constants.CTX;
        content += createContext(scope);
      }
      call += ');';

      if (fn instanceof AsyncFunction) {
        call = 'await ' + call;
        content += createAsyncScope(scope);
      }

      // Modify to a statement that set the context (1 | 3)
      if ((middleware[0] & 1) === 1) {
        call = constants.CTX + '.' + middleware[2] + '=' + call;
        content += createContext(scope);
      }

      // Need validation (2 | 3)
      content += middleware[0] > 1
        ? '{let ' + constants.TMP + '=' + call + 'if(' + constants.IS_ERR + '(' + constants.TMP + ')){' + (
          scope[3] ??= compilerState[4](
            scope[2]![0],
            scope[2]![1],
            scope
          )
        ) + '}}'
        : call;
    }
  }

  // Register handlers
  for (let i = 0, handlers = group[1], asyncEnd = scope[0] ? constants.ASYNC_END : ''; i < handlers.length; i++) {
    const handler = handlers[i];
    const pathTransform = concatPrefix(prefix, handler[1]);

    insertItem(
      compilerState[0],

      // Method and analyze path
      handler[0],
      pathTransform,

      // Correctly wrap async end
      content + compilerState[3](
        handler[2],
        handler[3],
        pathTransform,
        scope
      ) + asyncEnd
    );
  }

  for (let i = 0, childGroups = group[3]; i < childGroups.length; i++) {
    compileGroup(
      childGroups[i][1],
      [...scope],
      childGroups[i][0] === '/' ? prefix : prefix + childGroups[i][0],
      content
    );
  }
};
