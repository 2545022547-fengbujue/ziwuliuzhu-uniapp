<template>
  <view class="page">
    <AppNavbar title="取穴结果">
      <template #left>
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">←</text>
        </view>
      </template>
    </AppNavbar>
    <view :style="{ height: navHeight + 'px' }"></view>
    <scroll-view scroll-y class="page-scroll">
      <view class="result-content">
        <view v-for="method in allMethods" :key="method" class="result-section">
          <ResultPanel :method="method" />
        </view>
      </view>
      <view :style="{ height: safeBottom + 20 + 'px' }"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'
import ResultPanel from '@/components/ResultPanel.vue'

const { statusBarHeight, screenHeight, safeAreaBottom } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)
const safeBottom = computed(() => safeAreaBottom.value)
const allMethods = ['najia', 'nazi', 'lingui', 'feiteng']

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $tcm-bg;
}
.page-scroll { width: 100%; height: calc(100vh - 200rpx); }
.back-btn { padding: 10rpx; }
.back-icon { font-size: 40rpx; color: #fff; }
.result-content { padding: $spacing-md; }
.result-section { margin-bottom: $spacing-lg; }
</style>
