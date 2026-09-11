import { defineConfig } from 'vite';

// Preview only the exported files, matching the static Sites deployment.
export default defineConfig({
  build: { outDir: 'dist/client' },
  preview: { host: '127.0.0.1', port: 3001, strictPort: true },
});
