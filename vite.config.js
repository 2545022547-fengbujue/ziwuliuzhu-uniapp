import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

// 注意：本文件仅服务于 Web / 小程序的 npm 构建（npm run build:h5 等）。
// App（uni-app x 蒸汽模式）构建不读它：uni 的 addConfigFile 只加载
// src/vite.config.js（见 vite-plugin-uni dist/cli/utils.js resolveConfigFile）。
// 另：蒸汽发行预编译管线不读取 vite 的 scss additionalData，全局样式变量
// 已改由 src/uni.scss 通过 @use 引入（uni-app 约定的自动注入机制）。

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
  },
})
