<template>
  <!--
    像素冒险主题首页（HomePixel）- 薄壳
    公共布局见 _shared/HomeLayout.vue；本组件仅提供 scroll-view 内顶部的 hero 装饰插槽。
    视觉差异由全局 ui-pixel.scss 的 .ui-pixel 命名空间覆盖实现。
  -->
  <HomeLayout>
    <template #hero>
      <view class="pixel-hero" aria-hidden="true">
        <view class="pixel-hero-icon">✚</view>
        <view class="pixel-hero-copy">
          <text class="pixel-hero-kicker">MERIDIAN QUEST</text>
          <text class="pixel-hero-title">经络冒险日志</text>
        </view>
        <view class="pixel-hero-hearts"><text>♥</text><text>♥</text><text>♥</text></view>
      </view>
    </template>
  </HomeLayout>
</template>

<script setup>
import HomeLayout from '@/views/_shared/HomeLayout.vue'
</script>
