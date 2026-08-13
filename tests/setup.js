/**
 * tests/setup.js - vitest 全局桩（在加载任何被测模块之前执行）
 *
 * ============================================================
 * 为什么必须 stub：
 *   - src/stores/app.js 在模块顶层就调用 pinia-plugin-persist-uni 的持久化配置，
 *     该插件读取/写入 uni.getStorageSync / uni.setStorageSync；
 *   - src/composables/useSystemInfo.js 在首次调用时读取 uni.getSystemInfoSync；
 *   - src/composables/useHomePage.js / useSettingPage.js 引入 @dcloudio/uni-app 的生命周期钩子，
 *     只能在组件 setup 上下文调用（测试 composable 时需 vi.mock 该模块，见各测试文件）。
 * 这里先注入最小可用的 uni 桩（内存存储），保证 store / service 层可被直接加载测试。
 * ============================================================
 */

// 内存存储：替代 uni.storage，测试间可通过 clearUniStorage() 重置
const storage = new Map()

globalThis.uni = {
  getStorageSync: (key) => (storage.has(key) ? storage.get(key) : ''),
  setStorageSync: (key, value) => {
    storage.set(key, value)
  },
  removeStorageSync: (key) => {
    storage.delete(key)
  },
  clearStorageSync: () => {
    storage.clear()
  },
  getSystemInfoSync: () => ({
    statusBarHeight: 20,
    screenWidth: 375,
    screenHeight: 667,
    windowHeight: 667,
    safeAreaInsets: { top: 20, bottom: 0 },
    platform: 'devtools'
  }),
  // tabBar / 导航相关：测试中为 no-op
  setTabBarStyle: () => {},
  setTabBarItem: () => {},
  switchTab: () => {},
  navigateTo: () => {},
  redirectTo: () => {},
  // 平台判断：uni-app 编译期宏在 vitest 下不存在，保持默认 false 分支行为
  getSystemInfo: (cb) => cb && cb(globalThis.uni.getSystemInfoSync())
}

// 微信小程序全局：部分代码用 typeof wx !== 'undefined' 分支（如 useSystemInfo）
// 单测环境不模拟 wx，走 uni 兼容分支；如测试需要可在此注入 wx 桩
globalThis.wx = undefined

// 供测试文件引用的清理工具：import { clearUniStorage } from './setup'
export function clearUniStorage() {
  storage.clear()
}
