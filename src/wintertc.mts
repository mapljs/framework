import type { Group } from './core/route.mts';
import compileGroupToString, { AsyncFunction } from './wintertc/compiler.mts';
import { context, params, query, request } from './wintertc/ids.mts';

// preparsed symbol
const preparsedSymbols = new Map<any, string>([
  [request, 'r'],
  [query, 'e===-1?"":u.slice(e)'],
  [params, 'm.groups'],
  [context, 'c'],
]);

export * as ids from './wintertc/ids.mts';

/**
 * Compiled request handler.
 */
export type CompiledHandler = (req: Request) => Response | Promise<Response>;

/**
 * Compile a group to string.
 */
export const compileToString = (group: Group, parentPath: string): string =>
    compileGroupToString(group, parentPath, preparsedSymbols, 'r'),
  /**
   * Compile a group to a handler function.
   */
  compile = (group: Group): Promise<CompiledHandler> =>
    AsyncFunction('g', compileToString(group, 'g'))(group);
