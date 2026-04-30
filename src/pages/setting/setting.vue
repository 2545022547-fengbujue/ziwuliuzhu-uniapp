<template>
  <view class="page">
    <AppNavbar title="设置" />
    <view :style="{ height: navHeight + 'px' }"></view>
    <scroll-view scroll-y class="page-scroll">
      <view class="setting-content">
        <!-- 真太阳时设置 -->
        <view class="setting-card">
          <view class="card-title">
            <text class="card-icon">🌍</text>
            <text>真太阳时校正</text>
          </view>
          <view class="setting-row">
            <text class="setting-label">启用真太阳时</text>
            <switch
              :checked="store.useTrueSolarTime"
              @change="onSolarTimeToggle"
              color="#8B4513"
            />
          </view>
          <view v-if="store.useTrueSolarTime" class="setting-row">
            <text class="setting-label">当前城市</text>
            <view class="city-picker-btn" @tap="openCityPicker">
              <text class="city-name-text">{{ store.selectedCity }}</text>
              <text class="picker-arrow">▶</text>
            </view>
          </view>
          <view v-if="store.useTrueSolarTime" class="setting-row">
            <text class="setting-label">经度</text>
            <text class="setting-value">{{ store.longitude.toFixed(1) }}°</text>
          </view>
        </view>

        <!-- 计算方法说明 -->
        <view class="setting-card">
          <view class="card-title">
            <text class="card-icon">📖</text>
            <text>取穴方法说明</text>
          </view>
          <view class="method-desc" v-for="m in methodDescs" :key="m.id">
            <view class="method-header">
              <text class="method-icon">{{ m.icon }}</text>
              <text class="method-name">{{ m.name }}</text>
            </view>
            <text class="method-detail">{{ m.desc }}</text>
          </view>
        </view>

        <!-- 关于 -->
        <view class="setting-card" @tap="goAbout">
          <view class="setting-row">
            <text class="setting-label">关于</text>
            <text class="picker-arrow">▶</text>
          </view>
        </view>

        <view :style="{ height: safeBottom + 60 + 'px' }"></view>
      </view>
    </scroll-view>
    <CityPicker ref="cityPickerRef" />
  </view>
</template>

<script setup>
/**
 * 设置页 - setting.vue
 *
 * 功能：
 *   1. 真太阳时校正设置（开关 + 城市选择 + 经度显示）
 *   2. 四种取穴方法的说明介绍
 *   3. 关于页面入口
 *
 * 城市选择：
 *   复用 CityPicker 弹窗组件（和首页完全一致），选择后更新 store 的经度和城市名
 *
 * 注意：之前用 <picker> 原生下拉框选择城市，后来改成了 CityPicker 弹窗
 *   原因：下拉框在手机端体验差（300+ 城市滚动太长），弹窗支持搜索功能
 */
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'
import CityPicker from '@/components/CityPicker.vue'

const store = useAppStore()
const { statusBarHeight, safeAreaBottom } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)
const safeBottom = computed(() => safeAreaBottom.value)
const cityPickerRef = ref(null)

// 取穴方法说明列表
const methodDescs = [
  { id: 'najia', icon: '☰', name: '纳甲法', desc: '以天干配脏腑，按时取穴。根据日干支推算开穴，是最经典的子午流注取穴方法。' },
  { id: 'nazi', icon: '☷', name: '纳子法', desc: '以地支配脏腑，按时辰取穴。十二经脉气血流注，按子午流注规律取本经子母穴。' },
  { id: 'lingui', icon: '☯', name: '灵龟八法', desc: '取奇经八脉交会穴，按时辰推算九宫数，取相应穴位。' },
  { id: 'feiteng', icon: '⚡', name: '飞腾八法', desc: '取奇经八脉交会穴，以天干推算，按时取穴，方法更为简便。' }
]

/** 真太阳时开关变化回调 */
function onSolarTimeToggle(e) {
  store.toggleTrueSolarTime(e.detail.value)
}

/** 打开城市选择弹窗（复用 CityPicker 组件） */
function openCityPicker() {
  cityPickerRef.value.open((cityData) => {
    // 回调：用户选择城市后，更新经度和城市名
    store.updateLongitude(cityData.longitude, cityData.name)
  })
}

function goAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $tcm-bg;
}
.page-scroll { width: 100%; }

.setting-content {
  padding: $spacing-md;
}

.setting-card {
  background: $tcm-bg-light;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.card-title {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-size-base;
  font-weight: 600;
  color: $tcm-text;
  margin-bottom: $spacing-lg;
}

.card-icon {
  font-size: $font-size-lg;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md 0;
  border-bottom: 1rpx solid rgba($tcm-primary, 0.06);
}

.setting-label {
  font-size: $font-size-sm;
  color: $tcm-text;
}

.setting-value {
  font-size: $font-size-sm;
  color: $tcm-text-secondary;
}

.picker-display {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $tcm-text-secondary;
}

.city-picker-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 24rpx;
  background: #fff;
  border: 1rpx solid rgba($tcm-primary, 0.15);
  border-radius: 16rpx;
}

.city-name-text {
  font-size: $font-size-sm;
  color: $tcm-primary;
  font-weight: 500;
}

.picker-arrow {
  font-size: 18rpx;
  color: $tcm-text-hint;
}

/* === 方法说明 === */
.method-desc {
  padding: $spacing-md 0;
  border-bottom: 1rpx solid rgba($tcm-primary, 0.06);

  &:last-child { border-bottom: none; }
}

.method-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-xs;
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
  font-size: $font-size-xs;
  color: $tcm-text-secondary;
  line-height: 1.8;
  padding-left: 40rpx;
}
</style>
