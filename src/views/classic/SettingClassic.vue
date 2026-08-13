<template>
  <!--
    经典主题设置页（SettingClassic）- 薄壳
    公共布局见 _shared/SettingLayout.vue；本组件仅提供卡片标题图标插槽。
    对应经典四色：古典宣纸 / 暗夜幽光 / 青瓷天青 / 朱砂丹霞（根类由 SettingLayout 按 activeTheme 推导）。

    注意：本组件是唯一需要兼容微信小程序的主题页面，
    图标一律使用文本/emoji（小程序原生不支持内联 SVG）。
  -->
  <SettingLayout>
    <template #icon-solar><text class="card-icon">☀</text></template>
    <template #icon-style><text class="card-icon">🎨</text></template>
    <template #icon-najia><text class="card-icon">☯</text></template>
    <template #icon-personal><text class="card-icon">👤</text></template>
    <template #icon-methods><text class="classic-arrow">▶</text></template>
    <template #icon-about><text class="classic-arrow">▶</text></template>
  </SettingLayout>
</template>

<script setup>
import SettingLayout from '@/views/_shared/SettingLayout.vue'
</script>

<style lang="scss" scoped>
/* classic 版文本箭头：替代其它主题的 caret 内联 SVG（小程序兼容）。
   var(--theme-text-hint, #999) 跟随四色变量；小程序端 black/green/red 无变量时回退 #999。 */
.classic-arrow {
  font-size: 18rpx;
  color: var(--theme-text-hint, #999);
}
</style>
