import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/phaser/')) {
            return 'phaser-runtime';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 4173,
  },
});
