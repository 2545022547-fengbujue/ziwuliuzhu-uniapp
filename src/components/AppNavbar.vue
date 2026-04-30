<template>
  <view class="navbar" :style="navbarStyle">
    <view class="navbar-content">
      <view class="navbar-left">
        <slot name="left"></slot>
      </view>
      <view class="navbar-title">
        <text>{{ title }}</text>
      </view>
      <view class="navbar-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo.js'

const props = defineProps({
  title: { type: String, default: '' },
  bgColor: { type: String, default: '' }
})

const { statusBarHeight } = useSystemInfo()

const navbarStyle = computed(() => ({
  paddingTop: `${statusBarHeight.value}px`,
  background: props.bgColor || 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)'
}))
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
