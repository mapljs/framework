import type { Group } from './core/route.mts';
import { compile_lazy_fn } from './wintertc/compiler.mts';
import { context, query, request } from './wintertc/ids.mts';

export * as ids from './wintertc/ids.mts';

/**
 * Compile a group to string.
 */
export const compile_to_string = (group: Group, parentPath: string): string =>
    compile_lazy_fn(
      group,
      parentPath,
      new Map<any, string>([
        [request, 'r'],
        [query, 'e===-1?"":u.slice(e)'],
        [context, 'c'],
      ]),
      new Map(),
      '(r)',
    ),
  /**
   * Compile a group to a handler function.
   */
  compile = (
    group: Group,
  ): (group: Group) => ((this: { fetch: any }, req: Request) => Response | Promise<Response>) =>
    Function('g', compile_to_string(group, 'g')) as any;
