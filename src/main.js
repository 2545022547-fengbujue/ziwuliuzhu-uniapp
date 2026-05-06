/**
 * 应用入口
 *
 * uni-app 要求导出 createApp 工厂函数（SSR 兼容）
 * 注册 Pinia 状态管理 + 持久化插件
 */
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persist-uni'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  pinia.use(piniaPersist)  // 注册 uni.storage 持久化插件
  app.use(pinia)
  return { app }
}
