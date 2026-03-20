import { defineConfig } from 'vite';

export default defineConfig({
  base: '/world/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
  },
});
