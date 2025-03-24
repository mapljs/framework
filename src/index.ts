import { type Router, type Method, insertItemWithParts } from '@mapl/router/method';
import type { PathTransformer, PathTransformResult } from '@mapl/router/transform';
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
export type ErrorHandler<T extends ErrorFunc = ErrorFunc, Data = unknown> = [handler: T, data: Data];

/**
 * Describe a middleware
 */
export type Middleware<T extends MiddlewareFunc> =
  // Normal middleware (with or without error validation)
  [0 | 1, T] |
  // Bind value to context
  [2 | 3, T, key: string];

/**
 * Describe a handler store
 */
export type Handler<T extends Func = Func, Data = unknown> = [method: Method, path: string, handler: T, data: Data];

/**
 * Describe a handler group
 */
export type Group<E extends ErrorFunc = ErrorFunc, T extends Func = Func, Data = unknown> = [
  middlewares: Middleware<T>[],
  handlers: Handler<T, Data>[],
  errHandler: ErrorHandler<ErrorFunc, Data> | null,
  children: ChildGroup<E, T, Data>[]
];

/**
 * Describe a handler child group data
 */
export type ChildGroup<E extends ErrorFunc, T extends Func, Data = unknown> = [
  prefix: string,
  group: Group<E, T, Data>
];

/**
 * Describe a hook
 */
export type Hook<T extends any[]> = (
  ...args: [
    ...data: T,
    state: CompilerState<any, any, any>,

    scopeAsync: boolean,
    contextCreated: boolean,

    compiledErrorHandler: string
  ]
) => string;

/**
 * State for compilation
 */
export type CompilerState<E extends ErrorFunc, T extends Func, Data> = [
  router: Router<string>,

  dependencies: any[],
  argSet: string[],
  contextInit: string,

  compileHandler: Hook<[Handler<T, Data>, PathTransformResult]>,
  compileErrorHandler: Hook<[ErrorHandler<E, Data>]>,

  pathTransformer: PathTransformer
];

/**
 * The context initialization function
 */
export type ContextInit<T = unknown> = (headers: [string, string][]) => T;

export const createArgSet = (args: string[]): string[] => {
  const len = args.length;
  const arr = new Array(len + 1);
  for (let i = 1; i <= len; i++) arr[i] = args.slice(0, i).join();
  return arr;
};

export const selectArgs = (argSet: string[], count: number): string => argSet[Math.min(argSet.length - 1, count)];

export const concatPrefix = (prefix: string, path: string): string => {
  path = prefix + path;
  return (/.\/$/).test(path) ? prefix : path;
};

// Detect async functions
const asyncConstructor = (async () => { }).constructor;

// eslint-disable-next-line
export const isFuncAsync: (fn: Func) => fn is (...args: any[]) => Promise<any> = globalThis.process?.getBuiltinModule?.('util/types').isAsyncFunction as any  ?? ((fn) => fn instanceof asyncConstructor);

export const compileGroup = (
  group: Group,
  state: CompilerState<any, any, any>,

  prefix: string,

  // Previously built content
  content: string,

  scopeAsync: boolean,
  contextCreated: boolean,

  compiledErrorHandler: string
): void => {
  // Compile error handler
  if (group[2] != null) {
    compiledErrorHandler = state[5](
      group[2],
      state,
      scopeAsync,
      contextCreated,
      compiledErrorHandler
    );
  }

  // Compile middlewares
  for (let i = 0, middlewares = group[0]; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    const fn = middleware[1];

    // Analyze function args
    let call = constants.DEP + state[1].push(fn) + '(';
    if (fn.length > 0) {
      call += selectArgs(state[2], fn.length);
      if (!contextCreated) {
        contextCreated = true;
        content += state[3];
      }
    }
    call += ');';

    if (isFuncAsync(fn)) {
      if (!scopeAsync) {
        scopeAsync = true;
        content += constants.ASYNC_START;
      }

      call = 'await ' + call;
    }

    // Compile middleware
    switch (middleware[0]) {
      case 0:
        content += call;
        break;
      case 1:
        content += 'let ' + constants.ERR + '=' + call + 'if(' + constants.IS_ERR + '(' + constants.ERR + ')){' + compiledErrorHandler + '}';
        break;
      case 2:
        content += constants.CTX + '.' + middleware[2] + '=' + call;
        break;
      case 3:
        content += 'let ' + constants.ERR + '=' + constants.CTX + '.' + middleware[2] + '=' + call + 'if(' + constants.IS_ERR + '(' + constants.ERR + ')){' + compiledErrorHandler + '}';
        break;
    }
  }

  // Register handlers
  for (let i = 0, handlers = group[1]; i < handlers.length; i++) {
    const handler = handlers[i];
    const pathTransform = state[6](concatPrefix(prefix, handler[1]));

    insertItemWithParts(
      state[0],

      // Method and analyze path
      handler[0],
      pathTransform,

      // Correctly wrap async end
      content + state[4](
        handler,
        pathTransform,
        state,
        scopeAsync,
        contextCreated,
        compiledErrorHandler
      ) + (scopeAsync ? constants.ASYNC_END : '')
    );
  }

  for (let i = 0, childGroups = group[3]; i < childGroups.length; i++) {
    const childGroup = childGroups[i];

    compileGroup(
      childGroup[1],
      state,
      // Prefix should never ends with '/'
      childGroup[0] === '/' ? prefix : prefix + childGroup[0],

      content,
      scopeAsync,
      contextCreated,
      compiledErrorHandler
    );
  }
};
