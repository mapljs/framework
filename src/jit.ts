import { isDynamicPattern, validatePattern } from '@mapl/pattern-router/tree/utils';
import { router_init, router_set_dynamic, router_set_static, type Router as URLRouter } from '@mapl/pattern-router';
import { router_compile_to_code } from '@mapl/pattern-router/jit';

import {
  build,
  BuildState as GenericBuildState,
  nextId,
  REQUIRE_ASYNC,
  type RouterState,
} from './core/jit/index.ts';
import { hasFlag } from './core/jit/utils.ts';

import { evaluate } from 'runtime-compiler';
import { IS_AOT } from 'runtime-compiler/env';

import type { Router } from './core/router.ts';
import type { BaseContext } from './index.ts';

class BuildState extends GenericBuildState {
  method_router: URLRouter<string> = router_init();

  addRoute(method: string, pattern: string, code: string, contextPrefix: string, routeState: RouterState): void {
    validatePattern(pattern);

    if (IS_AOT) {
      hasFlag(REQUIRE_ASYNC, routeState[0]) && nextId(this);
    } else {
      const isDynamic = isDynamicPattern(pattern);
      code = (isDynamic ? contextPrefix + ',params:match.groups};' : '};') + code;

      if (hasFlag(REQUIRE_ASYNC, routeState[0])) {
        const id = nextId(this);

        const args = isDynamic ? '(req,match)' : '(req)';
        this.globals += `let ${id}=async${args}=>{${code}};`;
        code = `return ${id + args};`;
      }

      isDynamic
        ? router_set_dynamic(this.method_router, method, pattern, code)
        : router_set_static(this.method_router, method, pattern, code);
    }
  }
}

const jit = (router: Router<BaseContext>): ((req: Request) => Response | Promise<Response>) => {
  const state = new BuildState();
  build(router, state);
  return IS_AOT
    ? evaluate()
    : evaluate(
        state.globals +
          `return(req)=>{let{method,url}=req,pathStart=url.indexOf('/',10),pathEnd=url.indexOf('?',pathStart+1),path=pathEnd===-1?url.slice(pathStart):url.slice(pathStart,pathEnd);${router_compile_to_code(
            state.method_router,
            'match',
            'path',
            'method',
          )}return new Response(null,{status:404})}`,
      );
};
export default jit;
