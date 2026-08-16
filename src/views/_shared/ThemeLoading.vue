<template>
  <!--
    ThemeLoading - H5 异步主题 chunk 加载中的轻量 loading 态（审查报告 2.9）。
    仅由 pages/index/index.vue / pages/setting/setting.vue 的 defineAsyncComponent
    在 H5 分支作为 loadingComponent 引用，配合 delay 避免快速切换时的闪烁；
    App 端主题组件全部静态 import，不经过这里。
  -->
  <view class="theme-loading">
    <text class="loading-text">主题加载中…</text>
  </view>
</template>

<style lang="scss" scoped>
.theme-loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 60rpx;
}

.loading-text {
  font-size: 28rpx;
  color: var(--theme-text-hint, #999999);
}
</style>
