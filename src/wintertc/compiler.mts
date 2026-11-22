import { router_init, type Router } from '@mapl/pattern-router';

import type { Group } from '../core/route.mts';
import { router_compile_to_code } from '@mapl/pattern-router/jit';
import { compile_group } from '../core/compiler.mts';

export const compile_fn_body = (urlRouter: Router<string>) =>
    `{let h=false,c={status:200,headers:new Headers(),statusText:''},u=r.url,s=u.indexOf('/',9),e=u.indexOf('?',s+1),p=e===-1?u.slice(s):u.slice(e);${router_compile_to_code(urlRouter, 'm', 'p', 'r.method', 'h=true;')}return new Response(null,{status:404})}`,
  /**
   * @example
   * compile_lazy_fn(group, 'self', new Map(), '(r,v,x)');
   */
  compile_lazy_fn = (group: Group, parentPath: string, idMap: Map<any, string>, args: string) => {
    const urlRouter = router_init<string>();
    return `return function${args}{${compile_group(
      group,
      urlRouter,
      parentPath,
      idMap,
      'let o=(h,r)=>h?(r.body.cancel(),new Response(null,r)):r',
    )};return(this.fetch=${args}=>${compile_fn_body(urlRouter)})${args}}`;
  };
