<template>
  <!--
    SettingIcon - 设置页卡片图标（审查报告 2.3：App 端旧 Android WebView 内联 SVG 可能不渲染）

    - H5 / 小程序：内联 SVG（stroke=currentColor 跟随主题文字色）；
    - App（APP-PLUS）：改用预生成的主题色 PNG（scripts/generate-setting-icons.cjs 产出），
      避免旧 WebView 渲染 SVG 失败导致图标缺失。
    PNG 走 Vite 资源导入 + 条件编译：H5 不 import（用 SVG 分支）、MP 整个组件不编译、
    App 才打包 PNG（无 manifest 黑名单依赖）。
    图标内容为 6 套非经典设置页共用的 5 个 slot（methods 与 about 同图，共用 v-else 分支）。
  -->
  <!-- #ifdef APP-PLUS -->
  <image class="svg-icon" :src="pngSrc" mode="aspectFit" />
  <!-- #endif -->
  <!-- #ifndef APP-PLUS -->
  <svg v-if="name === 'solar'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><line x1="56" y1="232" x2="200" y2="232" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
  <svg v-else-if="name === 'style'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><line x1="216" y1="128" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="192" y1="152" x2="240" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="80" y1="40" x2="80" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="56" y1="64" x2="104" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="168" y1="184" x2="168" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="152" y1="200" x2="184" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="80" x2="176" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="21.49" y="105.37" width="213.02" height="45.25" rx="8" transform="translate(-53.02 128) rotate(-45)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
  <svg v-else-if="name === 'personal'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M130.05,206.11c-1.34,0-2.69,0-4,0L94,224a104.61,104.61,0,0,1-34.11-19.2l-.12-36c-.71-1.12-1.38-2.25-2-3.41L25.9,147.24a99.15,99.15,0,0,1,0-38.46l31.84-18.1c.65-1.15,1.32-2.29,2-3.41l.16-36A104.58,104.58,0,0,1,94,32l32,17.89c1.34,0,2.69,0,4,0L162,32a104.61,104.61,0,0,1,34.11,19.2l.12,36c.71,1.12,1.38,2.25,2,3.41l31.85,18.14a99.15,99.15,0,0,1,0,38.46l-31.84,18.1c-.65,1.15-1.32,2.29-2,3.41l-.16,36A104.58,104.58,0,0,1,162,224Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="112 88 152 128 112 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
  <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

// #ifdef APP-PLUS
// 主题色 PNG（scripts/generate-setting-icons.cjs 产出）；条件编译保证仅 App 打包
import iconSolarModern from '@/assets/icons/setting-solar-modern.png'
import iconSolarInk from '@/assets/icons/setting-solar-ink.png'
import iconSolarMorandi from '@/assets/icons/setting-solar-morandi.png'
import iconSolarWatercolor from '@/assets/icons/setting-solar-watercolor.png'
import iconSolarAnimal from '@/assets/icons/setting-solar-animal.png'
import iconSolarPixel from '@/assets/icons/setting-solar-pixel.png'
import iconStyleModern from '@/assets/icons/setting-style-modern.png'
import iconStyleInk from '@/assets/icons/setting-style-ink.png'
import iconStyleMorandi from '@/assets/icons/setting-style-morandi.png'
import iconStyleWatercolor from '@/assets/icons/setting-style-watercolor.png'
import iconStyleAnimal from '@/assets/icons/setting-style-animal.png'
import iconStylePixel from '@/assets/icons/setting-style-pixel.png'
import iconPersonalModern from '@/assets/icons/setting-personal-modern.png'
import iconPersonalInk from '@/assets/icons/setting-personal-ink.png'
import iconPersonalMorandi from '@/assets/icons/setting-personal-morandi.png'
import iconPersonalWatercolor from '@/assets/icons/setting-personal-watercolor.png'
import iconPersonalAnimal from '@/assets/icons/setting-personal-animal.png'
import iconPersonalPixel from '@/assets/icons/setting-personal-pixel.png'
import iconMethodsModern from '@/assets/icons/setting-methods-modern.png'
import iconMethodsInk from '@/assets/icons/setting-methods-ink.png'
import iconMethodsMorandi from '@/assets/icons/setting-methods-morandi.png'
import iconMethodsWatercolor from '@/assets/icons/setting-methods-watercolor.png'
import iconMethodsAnimal from '@/assets/icons/setting-methods-animal.png'
import iconMethodsPixel from '@/assets/icons/setting-methods-pixel.png'
const pngMap = {
  solar: {
    modern: iconSolarModern,
        ink: iconSolarInk,
        morandi: iconSolarMorandi,
        watercolor: iconSolarWatercolor,
        animal: iconSolarAnimal,
        pixel: iconSolarPixel
  },
  style: {
    modern: iconStyleModern,
        ink: iconStyleInk,
        morandi: iconStyleMorandi,
        watercolor: iconStyleWatercolor,
        animal: iconStyleAnimal,
        pixel: iconStylePixel
  },
  personal: {
    modern: iconPersonalModern,
        ink: iconPersonalInk,
        morandi: iconPersonalMorandi,
        watercolor: iconPersonalWatercolor,
        animal: iconPersonalAnimal,
        pixel: iconPersonalPixel
  },
  methods: {
    modern: iconMethodsModern,
        ink: iconMethodsInk,
        morandi: iconMethodsMorandi,
        watercolor: iconMethodsWatercolor,
        animal: iconMethodsAnimal,
        pixel: iconMethodsPixel
  }
}
// #endif

const props = defineProps({
  name: { type: String, required: true }
})
const store = useAppStore()

const pngSrc = computed(() => {
  // #ifdef APP-PLUS
  return pngMap[props.name]?.[store.activeUiStyle] || ''
  // #endif
  // #ifndef APP-PLUS
  return ''
  // #endif
})
</script>
