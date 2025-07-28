import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/renderer',
  base: './', // Use relative paths for loading assets
  publicDir: 'public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    // Enable source maps in development
    sourcemap: process.env.NODE_ENV !== 'production',
    // Minify in production
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
  },
  server: {
    port: 3000,
    strictPort: true,
    open: false,
  },
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
  },
  // Load environment variables from .env files
  envDir: '../',
  envPrefix: 'VITE_',
});
