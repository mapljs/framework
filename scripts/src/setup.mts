import { globSync, mkdirSync, writeFileSync } from 'node:fs';

import pkg from '../../package.json' with { type: 'json' };

import { measureSyncTask } from '../lib/tasks.mts';
import config from '../config.mts';

measureSyncTask('update package.json scripts', () => {
  {
    // @ts-ignore
    const scripts: Record<string, string> = (pkg.scripts ||= {});

    for (const file of globSync('*.mts', { cwd: 'scripts/src' })) {
      const scriptName = file.slice(0, -4);
      scripts[scriptName] = config.package.scripts.runFile('scripts/src/' + file);
      console.info('added script:', scriptName);
    }
  }

  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
});

measureSyncTask('create & optimize dist/package.json', () => {
  // @ts-ignore
  pkg.name = config.package.name;

  // @ts-ignore
  delete pkg.devDependencies;
  // @ts-ignore
  delete pkg.trustedDependencies;

  {
    // @ts-ignore
    let scripts: Record<string, string> = (pkg.scripts ||= {}),
      scriptRegex = new RegExp(`^(?:pre|post)?(?:${config.package.scripts.include.join('|')})$`);

    for (const key in scripts) if (!scriptRegex.test(key)) delete scripts[key];

    // @ts-ignore
    if (Object.keys(scripts).length === 0) delete pkg.scripts;
  }

  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/package.json', JSON.stringify(pkg));
});
