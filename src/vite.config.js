import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

/**
 * App（uni-app x 蒸汽模式）构建专用配置。
 *
 * App 端构建时，uni 的 addConfigFile 只会加载 UNI_INPUT_DIR（src/）下的
 * vite.config（见 vite-plugin-uni dist/cli/utils.js resolveConfigFile），
 * 项目根部的 vite.config.js 仅用于 Web/小程序的 npm 构建。
 *
 * 与 HBuilderX 内置 uniapp-cli-vite/vite.config.js 保持一致的极简形态：
 * 插件链（含 uni:app-uts 的 vue/@vue/shared 外部化、蒸汽共享数据等）由
 * uni() 自行组装，不要在此额外注入 rollupOptions，避免覆盖内部配置。
 */
export default defineConfig({
  plugins: [
    uni(),
    {
      name: 'zwlx:debug-external',
      enforce: 'post',
      configResolved(config) {
        if (process.env.UNI_PLATFORM === 'app') {
          console.error('[ZWLX] rollupOptions.external =', JSON.stringify(config.build && config.build.rollupOptions && config.build.rollupOptions.external))
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
})
