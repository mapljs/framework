import { get_args, get_args_with_tags } from './utils.mts';

export type AnyHook = [number, ...any[]];

export type InferHookTags<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends ValueTag<infer V>
  ? [V, ...InferHookTags<Rest>]
  : InferHookTags<Rest>
  : [];

export interface ValueTag<out T> {
  '~V': T;
}

export type HookBuildData = [visiting: boolean, shortestAccessPath: string, maxDepthFromRoot: number, hook: AnyHook];
export type HookBuildMap = Map<AnyHook, HookBuildData>;

/**
 * Create requirements.
 */
export const requires: <const Requires extends AnyHook[]>(...requires: Requires) => Requires =
  get_args,
  /**
   * Create a parse hook.
   */
  parse: <Hook extends any[], T extends {} | null, Requires extends AnyHook[]>(
    ...args: Hook &
    [
      parse: (...requires: InferHookTags<Requires>) => T,
      ...(
        | Requires
        | [
          drop: (value: Awaited<T>, ...requires: InferHookTags<Requires>) => any,
          ...requires: Requires,
        ]
      ),
    ]
  ) => [1, ...Hook] & ValueTag<Awaited<T>> = get_args_with_tags(1),
  /**
   * Create a resource hook.
   */
  use: <const Hook extends any[], T extends Disposable, Requires extends AnyHook[]>(
    ...args: Hook & [use: (...requires: InferHookTags<Requires>) => T, ...requires: Requires]
  ) => [2, ...Hook] & ValueTag<Awaited<T>> = get_args_with_tags(2),
  /**
   * Create an async resource hook.
   */
  use_async: <const Hook extends any[], T extends AsyncDisposable, Requires extends AnyHook[]>(
    ...args: Hook & [use: (...requires: InferHookTags<Requires>) => T, ...requires: Requires]
  ) => [3, ...Hook] & ValueTag<Awaited<T>> = get_args_with_tags(3),
  /**
   * Create a hook that runs on request cleanup.
   */
  defer: <const Hook extends any[], Requires extends AnyHook[]>(
    ...args: Hook & [defer: (...requires: InferHookTags<Requires>) => any, ...requires: Requires]
  ) => [4, ...Hook] = get_args_with_tags(4),
  /**
   * @internal
   */
  hook_requires_start_idx = (hook: AnyHook): number => hook[0] === 1
    ? // no drop function then requires starts at 2
    hook.length < 3 || Array.isArray(hook[2])
      ? 2
      : 3
    : // other hooks start at 2
    2,
  /**
   * Load a hook, its requirement hooks and detect recursive requirements.
   * @internal
   */
  build_hook_order = (
    parentHook: unknown[],
    requiresStartIdx: number,
    parentAccessPath: string,
    postorder: AnyHook[],
    currentMap: HookBuildMap
  ): void => {
    while (requiresStartIdx < parentHook.length) {
      const hook = parentHook[requiresStartIdx] as AnyHook;
      if (hook[0] > -1 && hook[0] < 5) {
        let hookData = currentMap.get(hook),
          currentAccessPath = parentAccessPath + `[${requiresStartIdx}]`;

        if (hookData == null) {
          currentMap.set(
            hook,
            (hookData = [true, currentAccessPath, 0, hook]),
          );

          // visit child hooks
          build_hook_order(
            hook,
            hook_requires_start_idx(hook),
            hookData[1],
            postorder,
            currentMap
          );

          // done visiting
          hookData[0] = false;
          postorder.push(hook);
        } else if (hookData[0])
          // node is the child of itself
          throw new Error(
            `recursive hook requirements at ${currentAccessPath}`,
          );
        else if (hookData[1].length > currentAccessPath.length)
          // set shorter access path
          hookData[1] = currentAccessPath;
      }

      requiresStartIdx++;
    }
  },
  /**
   * Sort ordered hooks by depths.
   */
  build_hook_depths = (postorder: AnyHook[], currentMap: HookBuildMap): HookBuildData[][] => {
    let depths: HookBuildData[][] = [];

    for (let i = postorder.length - 1; i >= 0; i--) {
      const parentHook = postorder[i],
        parentData = currentMap.get(parentHook)!,
        parentDepth = parentData[2];

      while (depths.length <= parentDepth) depths.push([]);
      depths[parentDepth].push(parentData);

      for (let j = hook_requires_start_idx(parentHook); j < parentHook.length; j++) {
        const hookData = currentMap.get(parentHook[j])!;
        if (parentDepth >= hookData[2])
          hookData[2] = parentDepth + 1;
      }
    }

    return depths;
  };
