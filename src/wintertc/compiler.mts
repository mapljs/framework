import { router_init } from '@mapl/pattern-router';

import type { Group } from '../core/route.mts';
import { CODE, DECLS, router_compile_to_code } from '@mapl/pattern-router/jit';
import { compile_group_decls } from '../core/compiler.mts';

/**
 * @example
 * compile_lazy_fn(group, 'self', new Map(), '(r,v,x)');
 */
export const compile_lazy_fn = (
  group: Group,
  parentPath: string,
  idMap: Map<any, string>,
  globalIdMap: Map<any, string>,
  args: string,
) => {
  const urlRouter = router_init<string>(),
    globalDecls = compile_group_decls(
      group,
      urlRouter,
      parentPath,
      idMap,
      globalIdMap,
      'm.groups',
      '',
    );

  router_compile_to_code(urlRouter, 'm', 'p', 'r.method', 'h=true;');
  return `return function${args}{let o=(h,r)=>h?(r.body.cancel(),new Response(null,r)):r${DECLS + globalDecls};return(this.fetch=${args}=>{let h=false,c={status:200,headers:new Headers(),statusText:''},u=r.url,s=u.indexOf('/',8),e=u.indexOf('?',s+1),p=e===-1?u.slice(s):u.slice(e);${CODE}return new Response(null,{status:404})})${args}}`;
};
