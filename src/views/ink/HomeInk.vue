<template>
  <!--
    水墨意境主题首页（HomeInk）- 薄壳
    公共布局见 _shared/HomeLayout.vue；本组件仅作为主题入口，
    根 class 由 HomeLayout 按 store.activeUiStyle 自动推导（classic → theme-*，其它 → ui-*）。
    时段背景类 ink-bg-* 由 HomeLayout 按 store.inkBackgroundPeriod 自动补充；视觉差异由 ui-ink.scss 覆盖。
  -->
  <HomeLayout />
</template>

<script setup>
import HomeLayout from '@/views/_shared/HomeLayout.vue'
</script>
