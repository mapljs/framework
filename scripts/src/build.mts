import { enableCompileCache } from 'node:module';
enableCompileCache();

import { transformSync } from 'oxc-transform';
import { readFile, writeFile, readdir, mkdir, link, glob } from 'node:fs/promises';

import { measureAsyncTask } from '../lib/tasks.mts';
import config from '../config.mts';

if (process.argv[2] === 'help') {
  console.info('Build package to ./dist');
} else {
  const recursively = { recursive: true } as const;
  await Promise.all([
    measureAsyncTask('link assets', async () =>
      Promise.all(
        (await Array.fromAsync(glob(config.package.assets))).map((file) => {
          const finalPath = './dist/' + file;

          return measureAsyncTask(`symlink ./${file} to ${finalPath}`, async () => {
            await mkdir(finalPath.slice(0, finalPath.lastIndexOf('/')), recursively);
            try {
              return await link(file, finalPath);
            } catch (e: any) {
              if (e.code !== 'EEXIST') throw e;
            }
          });
        }),
      ),
    ),

    measureAsyncTask('transform', async () => {
      // [path, content, ...]
      const writeContents: string[] = [];

      /**
       * Pick up the files recursively, queue `mkdir` tasks to create subdirectories and `transform` tasks to transform files concurrently.
       * @returns whether the callee should create the directory, if `false` it means the caller already creates the subdirectory recursively.
       */
      const recursiveTransform = async (
        srcdir: string,
        outdir: string,
        tasks: Promise<any>[],
      ): Promise<boolean> => {
        let hasFiles = false,
          subdirReads: Promise<boolean>[] = [];

        for (const dirent of await readdir(srcdir, { withFileTypes: true })) {
          const direntName = dirent.name;
          if (direntName === 'node_modules' || direntName.startsWith('.')) continue;

          if (dirent.isFile() || dirent.isSymbolicLink()) {
            hasFiles = true;

            if (direntName.endsWith('.mts') && !direntName.endsWith('.test.mts')) {
              const srcPath = srcdir + direntName,
                // index.
                outPathWithoutExt = outdir + direntName.slice(0, -3);

              tasks.push(
                measureAsyncTask(`transform ${srcPath}`, async () => {
                  const transformed = transformSync(
                    srcPath,
                    await readFile(srcPath, { encoding: 'utf8' }),
                    {
                      sourceType: 'module',
                      typescript: {
                        rewriteImportExtensions: true,
                        declaration: {
                          stripInternal: true,
                        },
                      },
                      lang: 'ts',
                    },
                  );

                  writeContents.push(outPathWithoutExt + 'mjs', transformed.code);
                  if (transformed.declaration != null)
                    writeContents.push(outPathWithoutExt + 'd.mts', transformed.declaration);
                }),
              );
            }
          } else if (dirent.isDirectory()) {
            const subpath = direntName + '/';
            subdirReads.push(recursiveTransform(srcdir + subpath, outdir + subpath, tasks));
          }
        }

        // Avoids a lot of syscalls if the directories only contain directories or is empty
        if (subdirReads.length > 0)
          for (
            let i = 0, dirNotCreatedResults = await Promise.all(subdirReads);
            i < dirNotCreatedResults.length;
            i++
          )
            // Subdir reads already created the directory
            if (!dirNotCreatedResults[i]) return false;

        if (hasFiles) {
          tasks.push(
            // @ts-ignore
            measureAsyncTask(`mkdir ${outdir}`, () => mkdir(outdir, recursively)),
          );

          return false;
        }

        return true;
      };

      // Initialize all dirs
      const beforeWriteTasks: Promise<void>[] = [];
      await recursiveTransform('./src/', './dist/', beforeWriteTasks);
      await Promise.all(beforeWriteTasks);

      // Write contents
      const halfLen = writeContents.length >>> 1,
        writeTasks: Promise<void>[] = new Array(halfLen);

      for (let i = 0; i < halfLen; i++)
        writeTasks[i] = measureAsyncTask(`write ${writeContents[i << 1]}`, () =>
          writeFile(writeContents[i << 1], writeContents[(i << 1) | 1]),
        );

      await Promise.all(writeTasks);
    }),
  ]);
}
