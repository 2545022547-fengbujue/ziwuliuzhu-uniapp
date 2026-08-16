import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

// 构建期为主字体注入 <link rel="preload">（审查报告 2.6，优化弱网首屏）
// 背景：H5 字体经 Vite 处理为带 hash 的产物 URL，index.html 无法硬编码；
//       构建完成后从 bundle 按文件名匹配主字体，注入 preload。
// 注意：只匹配 H5 实际生效的 @font-face（wenjinmincho-subset-v6 = 文渊宋体正文，
//       #ifndef MP-WEIXIN 在 H5 编译）。kaiti-gb2312 是 #ifdef APP-PLUS 专属，
//       不要 preload——H5 走系统楷体回退，preload 会白下 383KB 高优资源。
function fontPreloadPlugin() {
  return {
    name: 'font-preload',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      if (!ctx || !ctx.bundle) return html
      const targets = Object.keys(ctx.bundle).filter(
        (f) => /\.(ttf|woff2?)$/i.test(f) && /wenjinmincho-subset-v6/.test(f)
      )
      const links = targets
        .map((f) => `<link rel="preload" as="font" type="font/ttf" crossorigin href="${f}">`)
        .join('\n    ')
      if (!links) return html
      return html.replace('<!--preload-links-->', `${links}\n    <!--preload-links-->`)
    }
  }
}

export default defineConfig({
  plugins: [uni(), fontPreloadPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/styles/variables.scss" as *;'
      }
    }
  }
})
