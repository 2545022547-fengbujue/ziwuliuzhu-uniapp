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

    // 监听 theme / uiStyle 变化，自动更新 tabBar
    watch(
      () => [store.theme, store.uiStyle],
      () => {
        setTimeout(() => store.applyThemeChrome(), 50)
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
  onHide() {}
}
</script>

<style lang="scss">
@use '@/styles/index.scss';
</style>
