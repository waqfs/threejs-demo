import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // The sandboxed preview has an opaque origin. GitHub Pages also serves with CORS enabled.
  server: { cors: true },
  preview: { cors: true },
  build: {
    rollupOptions: {
      input: {
        playground: resolve('index.html'),
        runner: resolve('runner.html'),
      },
    },
  },
});
