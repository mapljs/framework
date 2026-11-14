export interface Config {
  package: {
    /**
     * Package name.
     */
    name: string;

    /**
     * Script options.
     */
    scripts: {
      /**
       * Scripts to include (including pre/post hooks) in final `package.json`.
       */
      include: string[];

      /**
       * Script to execute a file.
       */
      runFile: (file: string) => string;
    };

    /**
     * Assets to include.
     */
    assets: string[];
  };
}

export const defineConfig = (t: Config): Config => t;
