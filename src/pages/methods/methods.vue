<template>
  <view class="page">
    <AppNavbar title="取穴方法说明">
      <template #left>
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">←</text>
        </view>
      </template>
    </AppNavbar>
    <view :style="{ height: navHeight + 'px' }"></view>
    <view class="methods-content">
      <view
        v-for="m in methodDescs"
        :key="m.id"
        class="method-card"
      >
        <view class="method-header">
          <text class="method-icon">{{ m.icon }}</text>
          <text class="method-name">{{ m.name }}</text>
        </view>
        <text class="method-detail">{{ m.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'

const { statusBarHeight } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)

const methodDescs = [
  { id: 'najia', icon: '☰', name: '纳甲法', desc: '以天干配脏腑，按时取穴。根据日干支推算开穴，是最经典的子午流注取穴方法。' },
  { id: 'nazi', icon: '☷', name: '纳子法', desc: '以地支配脏腑，按时辰取穴。十二经脉气血流注，按子午流注规律取本经子母穴。' },
  { id: 'lingui', icon: '☯', name: '灵龟八法', desc: '取奇经八脉交会穴，按时辰推算九宫数，取相应穴位。' },
  { id: 'feiteng', icon: '⚡', name: '飞腾八法', desc: '取奇经八脉交会穴，以天干推算，按时取穴，方法更为简便。' }
]

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $tcm-bg;
}
.back-btn { padding: 10rpx; }
.back-icon { font-size: 40rpx; color: #fff; }

.methods-content {
  padding: $spacing-lg;
}

.method-card {
  background: $tcm-bg-light;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.method-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
}

.method-icon {
  font-size: $font-size-md;
}

.method-name {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $tcm-text;
}

.method-detail {
  display: block;
  font-size: $font-size-xs;
  color: $tcm-text-secondary;
  line-height: 1.8;
  padding-left: 40rpx;
}
</style>
