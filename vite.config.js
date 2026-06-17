import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep heavy standalone deps separate but always bundle React with anything that uses it
          if (id.includes('node_modules/three') || id.includes('node_modules/@types/three')) return 'three';
          if (id.includes('node_modules/framer-motion')) return 'framer';
          if (id.includes('node_modules/maplibre-gl')) return 'maplibre';
        },
      },
    },
  },
});