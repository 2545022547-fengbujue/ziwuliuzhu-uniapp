<!--
  App.vue - 应用根组件

  uni-app 根组件负责全局样式注入和平台级启动逻辑：
  - 微信小程序端加载内嵌字体；
  - App 端应用主题到原生 tabBar。
-->
<template></template>

<script>
import { useAppStore } from '@/stores/app.js'
import { watch } from 'vue'

// #ifdef MP-WEIXIN
import { loadMiniProgramFonts } from '@/utils/font-loader.js'
// #endif

export default {
  onLaunch() {
    // #ifdef MP-WEIXIN
    loadMiniProgramFonts()
    // #endif

    // #ifdef H5 || APP-PLUS
    // H5 / App 端：启动时应用主题 tabBar
    const store = useAppStore()
    store.applyThemeChrome()

    // 监听 theme / uiStyle 变化，自动更新 tabBar（防抖合并连续切换）
    let chromeTimer = null
    watch(
      () => [store.theme, store.uiStyle],
      () => {
        clearTimeout(chromeTimer)
        chromeTimer = setTimeout(() => store.applyThemeChrome(), 50)
      }
    )
    // #endif
  },
  onShow() {
    // #ifdef H5 || APP-PLUS
    const store = useAppStore()
    store.applyThemeChrome()
    // #endif
  },
  onHide() {},

  /**
   * 全局错误兜底（生产可用健壮性）：
   * - 捕获未预期的运行时错误与未处理的 Promise 拒绝，统一落日志，
   *   便于真机/线上问题定位（本项目无网络上报，仅 console，按需扩展）。
   * - 注意：这里只做「记录」，不做静默吞错——错误仍会按平台默认行为继续。
   */
  onError(err) {
    console.error('[App] 全局运行时错误:', err)
  },
  onUnhandledRejection(err) {
    console.error('[App] 未处理的 Promise 拒绝:', err)
  }
}
</script>

<style lang="scss">
@use '@/styles/index.scss';
</style>
