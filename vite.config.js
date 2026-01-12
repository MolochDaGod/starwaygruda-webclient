import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['monaco-editor']
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces (accessible over Radmin VPN)
    port: 8080,      // Web server port
    open: true,
    strictPort: false // Try next port if busy
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false // Disable source maps for smaller build
  }
});
