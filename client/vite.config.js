// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy WebSocket and API calls through Vite → HTTPS server
      // This avoids mixed-content issues and self-signed cert browser warnings
      '/socket.io': {
        target: 'https://localhost:3443',
        ws: true,
        secure: false,        // allow self-signed cert
        changeOrigin: true,
      },
      '/api': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false,        // allow self-signed cert
      }
    }
  }
})