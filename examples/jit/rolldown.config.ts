import { defineConfig } from 'rolldown';
import rtc from 'runtime-compiler/rolldown';
import swc from '@swc/core';

export default defineConfig({
  input: 'main.ts',
  output: {
    file: 'main.aot.js',
  },
  plugins: [
    rtc(),

    // unplugin-swc doesn't run on renderChunk so we have to do this
    {
      name: 'swc-minify',
      renderChunk: (code) =>
        swc.minifySync(code, {
          compress: {
            const_to_let: true,
            sequences: false
          },
          mangle: false,
          module: true,
        }),
    },
  ],
});
