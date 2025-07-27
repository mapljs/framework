import { RegExpRouter } from 'hono/router/reg-exp-router';
import { TrieRouter } from 'hono/router/trie-router';
import { PatternRouter } from 'hono/router/pattern-router';

import type { Router } from 'hono/router';
import type { IRouter, IHandler } from '../types';

const init = (name: string, C: { new (): Router<IHandler> }): IRouter => ({
  name: 'hono - ' + name,
  fn: (routes) => {
    const router = new C();

    // Hono does not capture rest parameters?
    for (const route of routes)
      router.add(
        route.method,
        route.path.endsWith('*')
          ? route.path.slice(0, -1) + ':_{.*}'
          : route.path,
        route.item,
      );

    if (C === RegExpRouter)
      return (method, path) => {
        const res = router.match(method, path);

        if (res[0].length > 0) {
          // Need to get values of params
          const params = [];
          for (let i = 1, stash = res[1]!; i < stash.length; i++)
            if (stash[i]) params.push(stash[i]);
          return [res[0][0][0], params];
        }
      };

    return (method, path) => {
      const res = router.match(method, path);
      return res[0].length === 0 ? null : (res[0][0] as any);
    };
  },
});

export const regexp = init('regexp', RegExpRouter);
export const trie = init('trie', TrieRouter);
export const pattern = init('pattern', PatternRouter);
