import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import netlify from '@astrojs/netlify';
import { fileURLToPath } from 'node:url';

const rootDir = new URL('./', import.meta.url);

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  publicDir: './public',
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app.ts',
    }),
  ],
  vite: {
    build: {
      target: 'es2022',
    },
    esbuild: {
      target: 'es2022',
    },
    server: {
      fs: {
        allow: [fileURLToPath(rootDir)],
      },
    },
  },
});
