/**
 * 应用入口
 *
 * uni-app 要求导出 createApp 工厂函数（SSR 兼容）
 * 注册 Pinia 状态管理 + 持久化插件
 */

// #ifdef MP-WEIXIN
// 微信小程序 API polyfill：在框架加载前替换废弃的 getSystemInfoSync
// 必须在所有 import 之前执行，才能拦截 vendor.js 的调用
if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
  const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : {}
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : {}
  const appBaseInfo = wx.getAppBaseInfo ? wx.getAppBaseInfo() : {}

  wx.getSystemInfoSync = function() {
    return {
      ...deviceInfo,
      ...windowInfo,
      ...appBaseInfo,
      model: deviceInfo.model || '',
      brand: deviceInfo.brand || '',
      system: deviceInfo.system || '',
      platform: deviceInfo.platform || '',
      SDKVersion: appBaseInfo.SDKVersion || '',
      language: appBaseInfo.language || '',
      version: appBaseInfo.version || '',
      windowWidth: windowInfo.windowWidth || 0,
      windowHeight: windowInfo.windowHeight || 0,
      statusBarHeight: windowInfo.statusBarHeight || 0,
      safeArea: windowInfo.safeArea || {},
      pixelRatio: windowInfo.pixelRatio || 1
    }
  }
}
// #endif

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
