<template>
  <view class="page">
    <AppNavbar title="关于">
      <template #left>
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">←</text>
        </view>
      </template>
    </AppNavbar>
    <view :style="{ height: navHeight + 'px' }"></view>
    <view class="about-content">
      <view class="logo-area">
        <text class="logo-icon">☯</text>
        <text class="app-name">子午流注取穴</text>
        <text class="app-version">v1.0.0</text>
      </view>
      <view class="desc-card">
        <text class="desc-text">
          子午流注取穴系统是一款基于中医时间医学的智能化取穴辅助工具。系统支持纳甲法、纳子法、灵龟八法、飞腾八法四种传统取穴方法，结合干支推算和真太阳时校正，为中医针灸师提供精准的取穴参考。
        </text>
      </view>
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">技术栈</text>
          <text class="info-value">uni-app Vue3 + Vite</text>
        </view>
        <view class="info-row">
          <text class="info-label">适用平台</text>
          <text class="info-value">Android / iOS / 微信小程序</text>
        </view>
      </view>

      <!-- 免责声明 -->
      <view class="disclaimer-card">
        <text class="disclaimer-text">
          免责声明：软件所提供的取穴结果仅供参考，不作为任何临床诊疗依据。实际应用中应以临床实际为准，因时、因地、因人，结合患者具体情况进行辨证施治。
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 关于页 - about.vue
 *
 * 功能：
 *   1. 显示应用名称、版本号、简介
 *   2. 显示技术栈和适用平台信息
 *   3. 免责声明（底部小字）
 *
 * 免责声明：
 *   软件取穴结果仅供参考，不作为临床诊疗依据，需结合三因制宜辨证施治
 */
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'

const { statusBarHeight } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background-color: $tcm-bg; }
.back-btn { padding: 10rpx; }
.back-icon { font-size: 40rpx; color: #fff; }

.about-content { padding: $spacing-lg; }

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 40rpx;
}

.logo-icon { font-size: 120rpx; margin-bottom: $spacing-md; }
.app-name { font-size: $font-size-xl; font-weight: 700; color: $tcm-primary; font-family: 'KaiTi', serif; }
.app-version { font-size: $font-size-sm; color: $tcm-text-hint; margin-top: $spacing-xs; }

.desc-card, .info-card {
  background: $tcm-bg-light;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.desc-text { font-size: $font-size-sm; color: $tcm-text-secondary; line-height: 2; }

.info-row {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid rgba($tcm-primary, 0.06);
  &:last-child { border-bottom: none; }
}
.info-label { font-size: $font-size-sm; color: $tcm-text; }
.info-value { font-size: $font-size-sm; color: $tcm-text-secondary; }

.disclaimer-card {
  margin-top: $spacing-md;
  padding: $spacing-md;
}

.disclaimer-text {
  font-size: 22rpx;
  color: $tcm-text-hint;
  line-height: 1.8;
  text-align: justify;
}
</style>
