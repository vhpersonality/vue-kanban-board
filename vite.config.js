import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        // Отключаем некоторые проверки для production
        isCustomElement: (tag) => tag.includes('-')
      }
    }
  })],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Более агрессивное разделение чанков
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/') || id.includes('node_modules/pinia/')) {
            return 'vue-vendor'
          }
          if (id.includes('node_modules/element-plus/') || id.includes('node_modules/@element-plus/')) {
            return 'element-plus'
          }
          if (id.includes('node_modules/lodash')) {
            return 'lodash'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 800
  },
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    '__VUE_OPTIONS_API__': false,
    '__VUE_PROD_DEVTOOLS__': false
  }
})