<template>
  <!--
    水墨意境主题设置页（SettingInk）- 薄壳
    公共布局见 _shared/SettingLayout.vue；本组件仅提供卡片标题图标插槽。
    根 class 由 SettingLayout 按 store.activeUiStyle 自动推导（ui-ink）。
    视觉差异由全局 ui-ink.scss 的 .ui-ink 命名空间覆盖实现。
  -->
  <SettingLayout>
    <template #icon-solar><view class="card-icon-svg"><SettingIcon name="solar" /></view></template>
    <template #icon-style><view class="card-icon-svg"><SettingIcon name="style" /></view></template>
    <template #icon-najia><text class="card-icon">☯</text></template>
    <template #icon-personal><view class="card-icon-svg"><SettingIcon name="personal" /></view></template>
    <template #icon-methods><view class="picker-arrow"><SettingIcon name="methods" /></view></template>
    <template #icon-about><view class="picker-arrow"><SettingIcon name="about" /></view></template>
  </SettingLayout>
</template>

<script setup>
import SettingIcon from '@/components/SettingIcon.vue'
import SettingLayout from '@/views/_shared/SettingLayout.vue'
</script>
