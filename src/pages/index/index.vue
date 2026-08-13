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
import { provide, reactive } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useHomePage } from '@/composables/useHomePage.js'
import HomeClassic from '@/views/classic/HomeClassic.vue'
// 非经典主题仅 H5/App 使用，小程序端不编译（见工作区约定"除经典四色外不考虑小程序"）
// #ifndef MP-WEIXIN
import HomeModern from '@/views/modern/HomeModern.vue'
import HomeInk from '@/views/ink/HomeInk.vue'
import HomeMorandi from '@/views/morandi/HomeMorandi.vue'
import HomeWatercolor from '@/views/watercolor/HomeWatercolor.vue'
import HomeAnimal from '@/views/animal/HomeAnimal.vue'
import HomePixel from '@/views/pixel/HomePixel.vue'
// #endif

const store = useAppStore()

// 页面级业务逻辑（含 onShow/onHide/onBackPress/定时器）
const home = useHomePage()

// 以 reactive 包裹后再注入，使子组件模板中 home.xxx 能正常解包 ref
provide('home', reactive(home))
</script>