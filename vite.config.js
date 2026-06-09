import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react'
          if (id.includes('node_modules/react-router-dom/')) return 'vendor-router'
          if (id.includes('node_modules/lucide-react/')) return 'vendor-icons'
          if (id.endsWith('.json') && id.includes('/src/data/')) {
            const match = id.match(/\/src\/data\/(.+)\.json/)
            return match ? `data-${match[1]}` : 'data'
          }
        }
      }
    }
  }
})
