import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: 'dist',
    rollupOptions: { output: { manualChunks: { chart: ['chart.js'], markdown: ['marked', 'dompurify'] } } },
  },
  // `wrangler pages dev` serves the functions on 8788; proxy API calls there during `vite` dev.
  server: { proxy: { '/api': 'http://localhost:8788' } },
});
