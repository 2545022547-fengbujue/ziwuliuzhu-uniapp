/**
 * vitest.config.js - 单元测试配置（独立于 uni-app 的 vite.config.js）
 *
 * ============================================================
 * 设计说明（给后来者/AI）
 * ============================================================
 * 1. 为什么独立配置文件：主 vite.config.js 挂载了 @dcloudio/vite-plugin-uni，
 *    若直接复用会让 vitest 走进 uni-app 的编译管线（页面/条件编译等），
 *    纯逻辑单测不需要也不应该。此处只保留路径别名 @ → src，与主配置一致。
 * 2. environment: happy-dom —— store/composable 测试需要 DOM 与事件循环；
 *    纯函数测试（date.js 等）也统一跑在 happy-dom 下，行为无差异。
 * 3. globals: true —— 测试文件可直接使用 describe/it/expect，无需显式 import。
 * 4. setupFiles: tests/setup.js —— 在测试启动前 stub 全局 uni/wx，
 *    因为 store（pinia-plugin-persist-uni）与部分 service 在模块顶层就引用 uni 全局，
 *    必须先注入桩再加载被测模块（见 tests/setup.js 注释）。
 * ============================================================
 */
import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dir, 'src')
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/setup.js'],
    include: ['src/**/*.test.js', 'tests/**/*.test.js'],
    // 算法黄金用例可能较长，放宽单测超时
    testTimeout: 15000
  }
})
