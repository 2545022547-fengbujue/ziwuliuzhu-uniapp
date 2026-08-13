<template>
  <!--
    水彩画风主题首页（HomeWatercolor）- 薄壳
    公共布局见 _shared/HomeLayout.vue；本组件仅作为主题入口，
    根 class 由 HomeLayout 按 store.activeUiStyle 自动推导（classic → theme-*，其它 → ui-*）。
    视觉差异由全局 ui-watercolor.scss 的 .ui-watercolor 命名空间覆盖实现。
  -->
  <HomeLayout />
</template>

<script setup>
import HomeLayout from '@/views/_shared/HomeLayout.vue'
</script>
