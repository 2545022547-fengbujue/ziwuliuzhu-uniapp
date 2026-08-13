<template>
  <!--
    首页壳层（index.vue）

    职责：
      1. 根据 store.activeUiStyle 选择对应的主题页面组件渲染；
      2. 调用 useHomePage() 注册页面级生命周期（定时器、返回键等）；
      3. 通过 provide('home') 向主题页面注入共享业务状态与方法。

    页面结构与视觉样式全部由 src/views/** 下的主题页面组件负责，
    本壳层不包含任何主题样式，避免"牵一发而动全身"。

    注意：微信小程序不支持 <component :is>，故使用 v-if/v-else-if 链。
  -->
  <HomeClassic v-if="store.activeUiStyle === 'classic'" />
  <!-- #ifndef MP-WEIXIN -->
  <HomeModern v-else-if="store.activeUiStyle === 'modern'" />
  <HomeInk v-else-if="store.activeUiStyle === 'ink'" />
  <HomeMorandi v-else-if="store.activeUiStyle === 'morandi'" />
  <HomeWatercolor v-else-if="store.activeUiStyle === 'watercolor'" />
  <HomeAnimal v-else-if="store.activeUiStyle === 'animal'" />
  <HomePixel v-else-if="store.activeUiStyle === 'pixel'" />
  <!-- #endif -->
  <HomeClassic v-else />
</template>

<script setup>
import { provide, reactive, defineAsyncComponent } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useHomePage } from '@/composables/useHomePage.js'
// classic 常驻（唯一需兼容微信小程序的主题；小程序端仅保留此组件）
import HomeClassic from '@/views/classic/HomeClassic.vue'
// 非经典主题仅 H5/App 使用：
//   - 小程序端：条件编译整体排除（不编译、不打包）
//   - H5/App：defineAsyncComponent + 动态 import 异步加载，首次切到该主题才拉取，
//     首包不再包含 6 套主题的代码与静态资源（主题切换时由设置页过渡遮罩掩盖加载瞬间）
// #ifndef MP-WEIXIN
const HomeModern = defineAsyncComponent(() => import('@/views/modern/HomeModern.vue'))
const HomeInk = defineAsyncComponent(() => import('@/views/ink/HomeInk.vue'))
const HomeMorandi = defineAsyncComponent(() => import('@/views/morandi/HomeMorandi.vue'))
const HomeWatercolor = defineAsyncComponent(() => import('@/views/watercolor/HomeWatercolor.vue'))
const HomeAnimal = defineAsyncComponent(() => import('@/views/animal/HomeAnimal.vue'))
const HomePixel = defineAsyncComponent(() => import('@/views/pixel/HomePixel.vue'))
// #endif

const store = useAppStore()

// 页面级业务逻辑（含 onShow/onHide/onBackPress/定时器）
const home = useHomePage()

// 以 reactive 包裹后再注入，使子组件模板中 home.xxx 能正常解包 ref
provide('home', reactive(home))
</script>