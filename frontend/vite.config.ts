import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend runs on :8000 (see backend/README.md). We proxy /api during dev
// so the frontend never hardcodes a host — same code works once this is
// deployed behind a real reverse proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
