<template>
  <view class="mascot-shell" aria-hidden="true">
    <!--
      App 端不再渲染内联 SVG DOM。uni-app 的 H5 编译器可以直接显示 svg 标签，
      但 App WebView/原生渲染链在部分 Android 机型会忽略这段节点，最终只留下
      右下角空白。预生成透明 PNG 后交给跨端 image 组件，H5 与 App 走同一条稳定路径。
    -->
    <image class="mascot-image" :src="mascotSrc" mode="aspectFit" />
  </view>
</template>

<script setup>
/**
 * AnimalMascot - 动物岛穴位详情的静态守护角色。
 *
 * 六种角色由 scripts/generate-animal-mascots.py 从同一套几何骨架生成透明 PNG，
 * 保持尺寸、配色、阴影和视觉重心一致。组件只负责把 variant 映射到静态资源：
 * 不读取穴位数据、不显示文字、不响应点击，也不添加任何循环动画。
 */
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'rabbit' }
})

const mascotSources = Object.freeze({
  rabbit: '/static/themes/animal/mascots/rabbit.png',
  cat: '/static/themes/animal/mascots/cat.png',
  dog: '/static/themes/animal/mascots/dog.png',
  deer: '/static/themes/animal/mascots/deer.png',
  squirrel: '/static/themes/animal/mascots/squirrel.png',
  owl: '/static/themes/animal/mascots/owl.png'
})

/** 非法或旧持久化值统一回退兔子，避免 image 收到 undefined 后静默不显示。 */
const mascotSrc = computed(() => mascotSources[props.variant] || mascotSources.rabbit)
</script>

<style lang="scss" scoped>
.mascot-shell,
.mascot-image {
  width: 174rpx;
  height: 174rpx;
}

.mascot-image {
  display: block;
}
</style>
