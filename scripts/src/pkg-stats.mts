import { enableCompileCache } from 'node:module';
enableCompileCache();

import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

import { minifySync } from 'oxc-minify';
import { globSync } from 'node:fs';

if (process.argv[2] === 'help') {
  console.info('Print built package status');
} else {
  const fmtByte = (byte: number) =>
    byte >= 1e6
      ? +(byte / 1e6).toFixed(2) + 'mb'
      : byte >= 1e3
        ? +(byte / 1e3).toFixed(2) + 'kb'
        : byte + 'b';

  const result: Record<string, Record<string, string | number>> = {};

  await Promise.all(
    globSync('**/*', { cwd: 'dist' }).map(async (file) => {
      try {
        const realPath = './dist/' + file,
          code = await readFile(realPath, { encoding: 'utf8' });

        if (realPath.endsWith('.mjs')) {
          const { code: minified } = minifySync(file, code);
          result[realPath] = {
            size: fmtByte(code.length),
            'minified size': fmtByte(minified.length),
            'compressed size': fmtByte(gzipSync(minified).byteLength),
          };
        } else
          result[realPath] = {
            size: fmtByte(code.length),
          };
      } catch {}
    }),
  );

  console.table(result);
}
