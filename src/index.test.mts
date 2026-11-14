import { build_hook_depths, build_hook_order, type AnyHook, type HookBuildMap } from './core/hook.mts';
import { hook, route } from './index.mts';

const now = hook.parse(performance.now),
  rand = hook.parse(Math.random),
  num = hook.parse((now, rand) => now * rand, now, rand);

const handler = route.get('/', (num, now) => new Response(`id: ${num}, current time: ${now}`), num, now);

const start = performance.now();

const map: HookBuildMap = new Map(), postorder: AnyHook[] = [];
build_hook_order(handler, 3, 'root', postorder, map);
const depths = build_hook_depths(postorder, map);

const end = performance.now();

console.log(end - start, depths)
