import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/check-writer/',
  publicDir: 'public',
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
