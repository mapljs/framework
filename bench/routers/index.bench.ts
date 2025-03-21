import { summary, run, bench, do_not_optimize } from 'mitata';
import { transformRoute } from '@mapl/router/transform';

import routers from './src';
import { inspect } from 'node:util';

const analyzeRoute = (route: [method: string, path: string], i: number) => {
  const [params, parts, flag] = transformRoute(route[1]);

  let path = '';
  for (let i = 0; i < params.length; i++) {
    const val = '' + Math.random();
    path += parts[i] + val;
    params[i] = val;
  }

  // Get the last part
  if (parts.length > params.length) path += parts[params.length];

  // Wildcard
  else if (flag === 2) {
    const val = '/' + Math.random();
    path += val;
    params[params.length - 1] += val;
  }

  // method, path, expected, params
  return {
    method: route[0],
    path,
    expected: i,
    params
  };
}

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

const loadTest = (label: string, routes: [method: string, path: string][], invalidRoutes: [method: string, path: string][]) => {
  const testRoutes = routes.map(analyzeRoute);
  const invalidTestRoutes = invalidRoutes.map(analyzeRoute);

  summary(() => {
    registerRouter: for (const router of routers) {
      const match = router.fn(
        routes.map((route, i) => ({
          method: route[0],
          path: route[1],
          item: () => i
        }))
      );

      // Validate registered routes
      for (const test of testRoutes) {
        try {
          const result = match(test.method, test.path);

          if (result != null) {
            let [actual, params] = result;

            // Encode params in different ways
            if (params == null) params = [];
            else if (!Array.isArray(params)) {
              const arr = [];
              for (const prop in params)
                arr.push(params[prop]);
              params = arr as any;
            }

            // Checks
            if (actual() === test.expected && inspect(params) === inspect(test.params))
              continue;
          }

          console.info('Test', test, 'failed with result:', result);
        } catch (e) {
          console.info('Test', test, 'throws', e);
        }

        // Register next router
        console.error('Skipping', router.name);
        continue registerRouter;
      }

      bench(`(${label}) ${router.name}`, function* () {
        let arr = testRoutes.concat(invalidTestRoutes);
        arr = [...arr, ...arr, ...arr, ...arr, ...arr];

        yield {
          [0]() {
            shuffleArray(arr);
            return arr.map((x) => x.method);
          },
          [1]() {
            return arr.map((x) => x.path);
          },
          bench(methods: string[], paths: string[]) {
            for (let i = 0; i < methods.length; i++)
              do_not_optimize(match(methods[i], paths[i]));
          }
        }
      });
    }
  })
}
loadTest('api', [
  ['GET', '/user'],
  ['GET', '/user/comments'],
  ['GET', '/user/avatar'],
  ['GET', '/user/lookup/username/:username'],
  ['GET', '/user/lookup/email/:address'],
  ['GET', '/event/:id'],
  ['GET', '/event/:id/comments'],
  ['POST', '/event/:id/comment'],
  ['GET', '/map/:location/events'],
  ['GET', '/status'],
  ['GET', '/very/deeply/nested/route/hello/there'],
  ['GET', '/static/*'],
], [
  ['GET', '/stat'],
  ['GET', '/user/lookup/email'],
  ['GET', '/user/lookup/username/a/b'],
  ['POST', '/use'],
  ['ANY', '/method']
]);

run();
