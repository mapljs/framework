import * as mapl from './mapl';
import * as rou3 from './rou3';
import * as hono from './hono';
import * as findMyWay from './find-my-way';

export default [
  ...Object.values(mapl),
  ...Object.values(rou3),
  ...Object.values(findMyWay),
  ...Object.values(hono)
];
