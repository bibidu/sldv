import type { Options } from 'tsup';

const isDev = 'development' === process.env.NODE_ENV;

export const tsup: Options = {
  clean: true,
  format: isDev ? ['cjs'] : ['esm', 'cjs', 'iife'],
  legacyOutput: true,
  esbuildPlugins: [],
};
