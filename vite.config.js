import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import directoryStoragePlugin from './vite-plugin-storage';

export default defineConfig({
  plugins: [
    react(),
    directoryStoragePlugin(),
  ],

  server: {
    port: 5175,
    host: true,
  },

  preview: {
    port: 5175,
    host: true,
  },

  build: {
    // Chunk splitting for better caching
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ai-vendor': ['@google/generative-ai'],
          'utils-vendor': ['date-fns', 'uuid'],
          'media-vendor': ['html2canvas'],
        },
      },
    },
    // Warn if any chunk exceeds 400 KB gzipped
    chunkSizeWarningLimit: 400,
  },

  // Test configuration (Vitest)
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    pool: 'threads',
  },
});
