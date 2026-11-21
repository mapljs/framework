import { router_init } from '@mapl/pattern-router';

import type { Group } from './core/route.mts';
import { AsyncFunction, compile_fn_body, compile_group } from './wintertc/compiler.mts';
import { context, params, query, request } from './wintertc/ids.mts';

export * as ids from './wintertc/ids.mts';

/**
 * Compile a group to string.
 */
export const compile_to_string = (group: Group, parentPath: string): string => {
    const urlRouter = router_init<string>();
    return (
      compile_group(
        group,
        urlRouter,
        parentPath,
        new Map<any, string>([
          [request, 'r'],
          [query, 'e===-1?"":u.slice(e)'],
          [params, 'm.groups'],
          [context, 'c'],
        ]),
      ) +
      ';return r=>' +
      compile_fn_body(urlRouter)
    );
  },
  /**
   * Compile a group to a handler function.
   */
  compile = (group: Group): Promise<(req: Request) => Response | Promise<Response>> =>
    AsyncFunction('g', compile_to_string(group, 'g'))(group);
