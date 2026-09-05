import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@packages': path.resolve(import.meta.dirname, './src')
    }
  },
  server: {
    // The Flask backend writes JSON into backend/data/ on every registration.
    // Those files live under the project root, so without this the watcher
    // fires a full page reload mid-request and aborts the in-flight fetch.
    watch: {
      ignored: ['**/backend/**']
    },
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5050',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Backend service unavailable on port 5050' }));
            }
          });
        }
      }
    }
  }
})
