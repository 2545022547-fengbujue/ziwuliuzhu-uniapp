import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入 SCSS 变量（原 uni-app 项目同款配置）
        additionalData: '@use "@/styles/variables.scss" as *;'
      }
    }
  }
})
