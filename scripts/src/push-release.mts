import { enableCompileCache } from 'node:module';
enableCompileCache();

import { execFileSync } from 'node:child_process';
import pkg from '../../package.json' with { type: 'json' };

if (process.argv[2] === 'help') {
  console.info(
    'Tag and push commits with current version in ./package.json, which triggers ./.github/workflows/publish.yml workflow.',
  );
} else {
  execFileSync('git', ['tag', pkg.version]);
  execFileSync('git', ['push', '--tags']);
}
