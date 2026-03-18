import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: true,
    strictPort: false,
    headers: {
      // Allow eval for Monaco editor and other dynamic code features
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: http: https:; worker-src 'self' blob:;"
    },
    proxy: {
      '/api/auth': { target: 'https://id.grudge-studio.com', changeOrigin: true, rewrite: (p) => p.replace('/api/auth', '/auth') },
      '/api/game': { target: 'https://api.grudge-studio.com', changeOrigin: true },
    },
    cors: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Raise warning threshold — Three.js + game assets are inherently large
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        // Production routes
        mmo:      './index-mmo.html',     // Primary — mapped to / in vercel.json
        main:     './index.html',         // Advanced space/ground hybrid
        game:     './game.html',
        space:    './index-space.html',
        landing:  './index-landing.html',
        crafting: './crafting.html',
        admin:    './admin.html',
        // Note: test-population.html intentionally excluded from prod build
      },
      output: {
        manualChunks(id) {
          // Split Three.js into its own chunk — it is the biggest dep
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          // Split large optional deps
          if (id.includes('node_modules/monaco-editor')) {
            return 'vendor-monaco';
          }
          if (id.includes('node_modules/cannon-es')) {
            return 'vendor-physics';
          }
          if (
            id.includes('node_modules/socket.io-client') ||
            id.includes('node_modules/howler') ||
            id.includes('node_modules/simplex-noise') ||
            id.includes('node_modules/@tweenjs')
          ) {
            return 'vendor-misc';
          }
        }
      }
    }
  }
});
