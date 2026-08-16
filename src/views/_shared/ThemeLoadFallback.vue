<template>
  <!--
    ThemeLoadFallback - H5 异步主题 chunk 加载失败时的兜底页。
    仅由 pages/index/index.vue / pages/setting/setting.vue 的 defineAsyncComponent
    在 H5 分支作为 errorComponent 引用；App 端主题组件全部静态 import，不经过这里。
  -->
  <view class="theme-load-fallback">
    <text class="fallback-title">页面主题加载失败</text>
    <text class="fallback-desc">可能是网络中断或部署资源缺失，请重试。</text>
    <view class="fallback-btn" @tap="retry">
      <text class="fallback-btn-text">重新加载</text>
    </view>
  </view>
</template>

<script setup>
function retry() {
  // 仅 H5 分支会实例化本组件；location.reload 是 H5 最可靠的恢复方式。
  if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
    window.location.reload()
  }
}
</script>

<style lang="scss" scoped>
.theme-load-fallback {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding: 80rpx 60rpx;
}

.fallback-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--theme-text, #2C2C2C);
}

.fallback-desc {
  font-size: 26rpx;
  color: var(--theme-text-hint, #999999);
  text-align: center;
}

.fallback-btn {
  margin-top: 20rpx;
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
  background: var(--theme-primary, #8B4513);
}

.fallback-btn-text {
  font-size: 28rpx;
  color: #fff;
}
</style>
