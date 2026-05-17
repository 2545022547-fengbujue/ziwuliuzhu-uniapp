<template>
  <view class="navbar" :style="navbarStyle">
    <view class="navbar-content">
      <view class="navbar-title">
        <text>{{ title }}</text>
      </view>
      <view class="navbar-left">
        <slot name="left"></slot>
      </view>
      <view class="navbar-right">
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
 */
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo.js'

const props = defineProps({
  title: { type: String, default: '' },
  bgColor: { type: String, default: '' }
})

const { statusBarHeight } = useSystemInfo()

// 导航栏样式
const navbarStyle = computed(() => ({
  paddingTop: `${statusBarHeight.value}px`,
  background: props.bgColor || 'linear-gradient(135deg, var(--theme-primary, #8B4513) 0%, var(--theme-primary-dark, #6B3410) 100%)'
}))
</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  &-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 30rpx;
  }

  &-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
  }

  &-left,
  &-right {
    display: flex;
    align-items: center;
  }
}
</style>
