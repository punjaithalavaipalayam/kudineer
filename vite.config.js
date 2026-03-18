import { defineConfig } from 'vite';

export default defineConfig({
  // Set to your GitHub repo name for Pages deployment
  // e.g. if repo is github.com/punjaithalavaipalayam/kudineer → base: '/kudineer/'
  base: process.env.GITHUB_ACTIONS ? '/kudineer/' : '/',
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    minify: true,
  },
});
