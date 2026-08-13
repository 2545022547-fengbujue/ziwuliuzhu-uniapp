<template>
  <!--
    设置页壳层（setting.vue）

    职责：
      1. 根据 store.activeUiStyle 选择对应的主题设置页面组件渲染；
      2. 调用 useSettingPage() 注册页面级生命周期（定时器、返回键等）；
      3. 通过 provide('setting') 向主题页面注入共享业务状态与方法。

    页面结构与视觉样式全部由 src/views/** 下的主题设置页面组件负责，
    本壳层不包含任何主题样式，避免"牵一发而动全身"。

    注意：微信小程序不支持 <component :is>，故使用 v-if/v-else-if 链。
  -->
  <SettingClassic v-if="store.activeUiStyle === 'classic'" />
  <!-- #ifndef MP-WEIXIN -->
  <SettingModern v-else-if="store.activeUiStyle === 'modern'" />
  <SettingInk v-else-if="store.activeUiStyle === 'ink'" />
  <SettingMorandi v-else-if="store.activeUiStyle === 'morandi'" />
  <SettingWatercolor v-else-if="store.activeUiStyle === 'watercolor'" />
  <SettingAnimal v-else-if="store.activeUiStyle === 'animal'" />
  <SettingPixel v-else-if="store.activeUiStyle === 'pixel'" />
  <!-- #endif -->
  <SettingClassic v-else />
</template>

<script setup>
import { provide, reactive, defineAsyncComponent } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useSettingPage } from '@/composables/useSettingPage.js'
// classic 常驻（唯一需兼容微信小程序的主题；小程序端仅保留此组件）
import SettingClassic from '@/views/classic/SettingClassic.vue'
// 非经典主题仅 H5/App 使用：
//   - 小程序端：条件编译整体排除（不编译、不打包）
//   - H5/App：defineAsyncComponent + 动态 import 异步加载（首包瘦身）
// #ifndef MP-WEIXIN
const SettingModern = defineAsyncComponent(() => import('@/views/modern/SettingModern.vue'))
const SettingInk = defineAsyncComponent(() => import('@/views/ink/SettingInk.vue'))
const SettingMorandi = defineAsyncComponent(() => import('@/views/morandi/SettingMorandi.vue'))
const SettingWatercolor = defineAsyncComponent(() => import('@/views/watercolor/SettingWatercolor.vue'))
const SettingAnimal = defineAsyncComponent(() => import('@/views/animal/SettingAnimal.vue'))
const SettingPixel = defineAsyncComponent(() => import('@/views/pixel/SettingPixel.vue'))
// #endif

const store = useAppStore()

// 页面级业务逻辑（含 onShow/onHide/onBackPress/定时器/主题过渡动画）
const setting = useSettingPage()

// 以 reactive 包裹后再注入，使子组件模板中 setting.xxx 能正常解包 ref
provide('setting', reactive(setting))
</script>