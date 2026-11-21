import type { Group } from './core/route.mts';
import {
  AsyncFunction,
  compile_to_string as compile_group_to_string,
} from './wintertc/compiler.mts';
import { context, params, query, request } from './wintertc/ids.mts';

export * as ids from './wintertc/ids.mts';

/**
 * preparsed symbol
 * @internal
 */
export const symbols: Map<any, string> = new Map<any, string>([
    [request, 'r'],
    [query, 'e===-1?"":u.slice(e)'],
    [params, 'm.groups'],
    [context, 'c'],
  ]),
  /**
   * Compile a group to string.
   */
  compile_to_string = (group: Group, parentPath: string): string =>
    compile_group_to_string(group, parentPath, symbols, 'r'),
  /**
   * Compile a group to a handler function.
   */
  compile = (group: Group): Promise<(req: Request) => Response | Promise<Response>> =>
    AsyncFunction('g', compile_to_string(group, 'g'))(group);
