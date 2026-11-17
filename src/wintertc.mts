import type { Id } from './core/hook.mts';
import type { Group } from './core/route.mts';
import compileGroupToString from './wintertc/compiler.mts';

// preparsed symbol
export const request: Id<Request> = 'wintertc:request' as any,
  query: Id<string> = 'wintertc:query' as any,
  params: Id<Record<string, string | undefined>> = 'wintertc:params' as any,
  context: Id<Required<ResponseInit>> = 'wintertc:ctx' as any,
  preparsedSymbols: Map<any, string> = new Map<any, string>([
    [request, 'r'],
    [query, 'e===-1?"":u.slice(e)'],
    [params, 'm.groups'],
    [context, 'c'],
  ]),
  /**
   * Compile a group to string.
   */
  compileToString = (group: Group, parentPath: string): string =>
    compileGroupToString(group, parentPath, preparsedSymbols),
  /**
   * Compile a group to a handler function.
   */
  compile = (group: Group): ((req: Request) => Response | Promise<Response>) =>
    new Function('g', compileGroupToString(group, 'g', preparsedSymbols))(group);
