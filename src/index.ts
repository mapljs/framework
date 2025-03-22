import { type Router, type Method, insertItemWithParts } from '@mapl/router/method';
import type { PathTransformResult } from '@mapl/router/transform';

import { isErr, type Err } from 'safe-throw';

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
export type Handler<T extends Func = Func, Data = unknown> = [method: Method, path: PathTransformResult, handler: T, data: Data];

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
export type Hook<T> = (
  data: T,

  // Injected dependencies
  dependencies: any[],

  // Argument set should include context
  argSet: string[],

  scopeAsync: boolean,
  contextCreated: boolean
) => string;

/**
 * Hooks for compilation
 */
export type CompilerHooks<E extends ErrorFunc = ErrorFunc, T extends Func = Func, Data> = [
  compileHandler: Hook<Handler<T, Data>>,
  compileErrorHandler: Hook<ErrorHandler<E, Data>>
];

/**
 * The context initialization function
 */
export type ContextInit<T = unknown> = (headers: [string, string][]) => T;

export const createArgSet = (args: string[]): string[] => {
  const len = args.length;
  const arr = new Array(len);
  for (let i = 0; i < len; i++) arr[i] = args.slice(0, i).join();
  return arr;
};

// Detect async functions
const asyncConstructor = (async () => { }).constructor;

// eslint-disable-next-line
export const isFuncAsync: (fn: Func) => fn is (...args: any[]) => Promise<any> = globalThis.process?.getBuiltinModule('util/types').isAsyncFunction as any  ?? ((fn) => fn instanceof asyncConstructor);

export const compileGroup = (
  group: Group,

  prefix: string,
  hooks: CompilerHooks,

  // Previously built content
  content: string,

  // Injected dependencies
  dependencies: any[],

  // Argument set should include context
  argSet: string[],
  router: Router<string>,

  scopeAsync: boolean,
  contextCreated: boolean,

  compiledErrorHandler: string,
  contextInit: string
): void => {
  // Compile error handler
  if (group[2] != null) {
    compiledErrorHandler = hooks[1](
      group[2],
      dependencies,
      argSet,
      scopeAsync,
      contextCreated
    );
  }

  // Compile middlewares
  for (let i = 0, middlewares = group[0]; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    const fn = middleware[1];

    // Analyze the function
    let call = constants.DEP + dependencies.push(fn) + '(';

    if (fn.length > 0) {
      call += constants.CTX + ',' + argSet[Math.min(argSet.length, fn.length) - 1];
      if (!contextCreated) {
        contextCreated = true;
        content += contextInit;
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
        content += 'if(' + constants.IS_ERR + '(' + call + ')){' + compiledErrorHandler + '}';
        break;
      case 2:
        content += constants.CTX + '.' + middleware[2] + '=' + call;
        break;
      case 3:
        content += 'if(' + constants.IS_ERR + '(' + constants.CTX + '.' + middleware[2] + '=' + call + ')){' + compiledErrorHandler + '}';
        break;
    }
  }

  // Register handlers
  for (let i = 0, handlers = group[1]; i < handlers.length; i++) {
    const handler = handlers[i];

    // Add prefix (prefix is always static)
    const parts = handler[1][1];
    if ((/.+\//).test(parts[0] = prefix + parts[0]))
      parts[0] = prefix;

    insertItemWithParts(
      router,

      // Analyzed path and method
      handler[0],
      parts,
      handler[1][2],

      // Correctly wrap async end
      content + hooks[0](
        handler,
        dependencies,
        argSet,
        scopeAsync,
        contextCreated
      ) + (scopeAsync ? constants.ASYNC_END : '')
    );
  }

  for (let i = 0, childGroups = group[3]; i < childGroups.length; i++) {
    const childGroup = childGroups[i];

    compileGroup(
      childGroup[1],
      // Prefix should never ends with '/'
      childGroup[0] === '/' ? prefix : prefix + childGroup[0],

      hooks,
      content,
      dependencies,
      argSet,
      router,
      scopeAsync,
      contextCreated,
      compiledErrorHandler,
      contextInit
    );
  }
};

export const buildFunc = (body: string, dependencies: any[]): Func =>
  // eslint-disable-next-line
  Function(
    constants.IS_ERR,
    ...dependencies.map((_, i) => constants.DEP + (i + 1)),
    body
  )(
    isErr,
    ...dependencies
  );
