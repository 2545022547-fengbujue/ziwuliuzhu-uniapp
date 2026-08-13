<template>
  <!--
    动物岛主题首页（HomeAnimal）- 薄壳
    公共布局见 _shared/HomeLayout.vue；本组件仅提供 scroll-view 内顶部的 hero 装饰插槽。
    视觉差异由全局 ui-animal.scss 的 .ui-animal 命名空间覆盖实现。
  -->
  <HomeLayout>
    <template #hero>
      <view class="animal-friends-hero" aria-hidden="true">
        <image
          class="animal-friends-image"
          src="/static/themes/animal/animal-friends.png"
          mode="widthFix"
        />
      </view>
    </template>
  </HomeLayout>
</template>

<script setup>
import HomeLayout from '@/views/_shared/HomeLayout.vue'
</script>
