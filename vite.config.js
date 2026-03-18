import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces (accessible over Radmin VPN)
    port: 8080,      // Web server port
    open: true,
    strictPort: false, // Try next port if busy
    headers: {
      // Allow eval for Monaco editor and other dynamic code features
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: http: https:; worker-src 'self' blob:;"
    },
    proxy: {
      '/api/auth': { target: 'https://id.grudge-studio.com', changeOrigin: true, rewrite: (p) => p.replace('/api/auth', '/auth') },
      '/api/game': { target: 'https://api.grudge-studio.com', changeOrigin: true },
    },
    cors: true // Enable CORS
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps for smaller build
    rollupOptions: {
      input: {
        landing: './index-landing.html',
        main: './index.html',
        game: './game.html',
        mmo: './index-mmo.html',
        space: './index-space.html',
        test: './test-population.html',
        admin: './admin.html'
      }
    }
  }
});
