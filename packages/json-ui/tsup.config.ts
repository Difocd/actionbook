import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    catalog: 'src/catalog.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: {
    entry: {
      index: 'src/index.ts',
      catalog: 'src/catalog.ts',
    },
  },
  clean: true,
  external: ['react'],
  treeshake: true,
  splitting: false, // Disable code splitting for CLI to work properly
});
