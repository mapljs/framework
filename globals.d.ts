import * as c from './src/constants';

// Zero-cost constants at runtime
declare global {
  const constants: typeof c;
}
