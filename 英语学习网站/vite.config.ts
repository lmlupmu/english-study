import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 目标：兼容性更好的现代浏览器
    target: 'es2020',
    // 减小警告阈值压力
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 代码分割：把大依赖拆成独立 chunk，加快首屏加载
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('framer-motion')) {
              return 'animation'
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts'
            }
            if (id.includes('lucide-react')) {
              return 'icons'
            }
          }
        },
      },
    },
  },
})
