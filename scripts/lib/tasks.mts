import { styleText } from 'node:util';

export const measureAsyncTask = async <R,>(
  name: string,
  fn: (label: string) => R,
): Promise<Awaited<R>> => {
  name = styleText('bold', '[' + name + ']');

  console.time(name);
  try {
    return await fn(name);
  } finally {
    console.timeEnd(name);
  }
};

export const measureSyncTask = <R,>(name: string, fn: (label: string) => R): R => {
  name = styleText('bold', '[' + name + ']');

  console.time(name);
  try {
    return fn(name);
  } finally {
    console.timeEnd(name);
  }
};
