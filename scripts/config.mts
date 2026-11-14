import { defineConfig } from './lib/config.mts';
import sh from './lib/sh.mts';

export default defineConfig({
  package: {
    name: '@mapl/framework',
    scripts: {
      include: ['install', 'uninstall', 'prepare', 'prepublish'],
      runFile: (file) => sh`node ${file}`,
    },
    assets: ['README.md', 'LICENSE'],
  },
});
