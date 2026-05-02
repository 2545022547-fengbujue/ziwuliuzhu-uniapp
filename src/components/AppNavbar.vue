<template>
  <view class="navbar" :style="navbarStyle">
    <view class="navbar-content">
      <view class="navbar-left">
        <slot name="left"></slot>
      </view>
      <view class="navbar-title">
        <text>{{ title }}</text>
      </view>
      <view class="navbar-right" :style="rightStyle">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * AppNavbar - 自定义导航栏组件
 *
 * 功能：
 *   - 固定在页面顶部，支持自定义标题和背景色
 *   - 自动适配状态栏高度
 *   - 微信小程序中自动预留胶囊按钮空间
 */
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo.js'

const props = defineProps({
  title: { type: String, default: '' },
  bgColor: { type: String, default: '' }
})

const { statusBarHeight, menuButtonInfo } = useSystemInfo()

// 导航栏样式
const navbarStyle = computed(() => ({
  paddingTop: `${statusBarHeight.value}px`,
  background: props.bgColor || 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)'
}))

// 右侧区域样式：小程序中预留胶囊按钮空间
const rightStyle = computed(() => {
  if (menuButtonInfo.value) {
    const capsuleWidth = menuButtonInfo.value.width || 87
    return { minWidth: `${capsuleWidth + 20}px` }
  }
  return {}
})
</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;

  &-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 30rpx;
  }

  &-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
    flex: 1;
    text-align: center;
  }

  &-left,
  &-right {
    width: 80rpx;
    display: flex;
    align-items: center;
  }

  &-right {
    justify-content: flex-end;
  }
}
</style>
