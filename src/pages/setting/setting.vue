<template>
  <view class="page" :class="`theme-${store.activeTheme}`">
    <AppNavbar title="设置" />
    <view :style="{ height: navHeight + 'px' }"></view>
    <scroll-view scroll-y class="page-scroll" :style="{ height: scrollHeight + 'px' }">
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
              :color="store.themeSwitchColor"
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

        <!-- 外观主题 -->
        <!-- #ifndef MP-WEIXIN -->
        <view class="setting-card">
          <view class="card-title">
            <text class="card-icon">◐</text>
            <text>外观主题</text>
          </view>
          <!-- #ifdef APP-PLUS -->
          <view class="setting-row">
            <view class="setting-copy">
              <text class="setting-label">跟随系统深色模式</text>
              <text class="setting-tip inline">系统为深色时自动使用玄黑金篆</text>
            </view>
            <switch
              :checked="store.followsSystemTheme"
              @change="onFollowSystemThemeChange"
              :color="store.themeSwitchColor"
            />
          </view>
          <!-- #endif -->
          <view class="theme-options">
            <view
              v-for="theme in store.themes"
              :key="theme.id"
              class="theme-option"
              :class="{ active: store.activeTheme === theme.id }"
              @tap="store.setTheme(theme.id)"
            >
              <view class="theme-swatch" :class="theme.id"></view>
              <view class="theme-copy">
                <text class="theme-name">{{ theme.name }}</text>
                <text class="theme-desc">{{ theme.desc }}</text>
              </view>
            </view>
          </view>
        </view>
        <!-- #endif -->

        <!-- 反克法显示模式 -->
        <view class="setting-card">
          <view class="setting-row">
            <text class="setting-label">单独显示反克法</text>
            <switch
              :checked="store.fankeDisplayMode === 'separate'"
              @change="onFankeModeChange"
              :color="store.themeSwitchColor"
            />
          </view>
        </view>

        <!-- 取穴方法说明 -->
        <view class="setting-card" @tap="goMethods">
          <view class="setting-row">
            <text class="setting-label">取穴方法说明</text>
            <text class="picker-arrow">▶</text>
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
 * 真太阳时交互：
 *   - 用户打开真太阳时开关时，自动弹出 CityPicker 城市选择弹窗（延迟 100ms）
 *   - 用户选择城市后，更新 store 的经度和城市名，自动重新计算取穴结果
 *   - 关闭开关时，经度重置为默认值（116.407°，北京）
 *
 * 城市选择：
 *   复用 CityPicker 弹窗组件，选择后更新 store 的经度和城市名
 */
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'
import CityPicker from '@/components/CityPicker.vue'

const store = useAppStore()
const { statusBarHeight, safeAreaBottom, screenHeight } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)
const safeBottom = computed(() => safeAreaBottom.value)
const scrollHeight = computed(() => screenHeight.value - navHeight.value - safeAreaBottom.value - 50)
const cityPickerRef = ref(null)

onShow(() => {
  store.applyThemeChrome()
})

/** 真太阳时开关变化回调，开启时自动弹出城市选择 */
function onSolarTimeToggle(e) {
  store.toggleTrueSolarTime(e.detail.value)
  // 开启真太阳时时，自动弹出城市选择弹窗
  if (e.detail.value) {
    setTimeout(() => {
      openCityPicker()
    }, 100)
  }
}

/** 反克法显示模式切换 */
function onFankeModeChange(e) {
  store.fankeDisplayMode = e.detail.value ? 'separate' : 'merged'
}

/** App 端跟随系统深色模式 */
function onFollowSystemThemeChange(e) {
  store.toggleFollowSystemTheme(e.detail.value)
}

/** 打开城市选择弹窗（复用 CityPicker 组件） */
function openCityPicker() {
  cityPickerRef.value.open((cityData) => {
    // 回调：用户选择城市后，更新经度和城市名
    store.updateLongitude(cityData.longitude, cityData.name)
  })
}

function goMethods() {
  uni.navigateTo({ url: '/pages/methods/methods' })
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

.setting-copy {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.setting-label {
  font-size: $font-size-sm;
  color: $tcm-text;
}

.setting-value {
  font-size: $font-size-sm;
  color: $tcm-text-secondary;
}

.setting-tip {
  padding: $spacing-sm 0 0;
  font-size: $font-size-xs;
  color: $tcm-text-hint;
  line-height: 1.6;

  &.inline {
    padding: 0;
  }
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

.theme-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: #fff;
  border: 1rpx solid rgba($tcm-primary, 0.12);
  border-radius: 18rpx;

  &.active {
    border-color: $tcm-primary;
    background: rgba($tcm-primary, 0.06);
  }
}

.theme-swatch {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  flex-shrink: 0;

  &.classic {
    background: linear-gradient(135deg, #8B4513 0%, #FFFDF5 100%);
  }

  &.ink {
    background: linear-gradient(135deg, #17140F 0%, #D6A85A 100%);
  }

  &.celadon {
    background: linear-gradient(135deg, #2F7D73 0%, #F7FBF8 100%);
  }

  &.vermilion {
    background: linear-gradient(135deg, #B83A2E 0%, #FFF1E5 100%);
  }
}

.theme-copy {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.theme-name {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $tcm-text;
}

.theme-desc {
  font-size: $font-size-xs;
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
