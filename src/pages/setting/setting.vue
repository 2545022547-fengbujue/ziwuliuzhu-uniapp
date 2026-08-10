<template>
  <view class="page" :class="[`theme-${store.activeTheme}`, store.activeUiStyle !== 'classic' ? `ui-${store.activeUiStyle}` : '']">
    <AppNavbar title="设置" />
    <view :style="{ height: navHeight + 'px' }" class="nav-placeholder"></view>
    <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
      <view class="setting-content">
        <!-- ========== 真太阳时设置区域 ========== -->
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

        <!-- ========== 外观风格统一切换 ========== -->
        <view class="setting-card">
          <view class="card-title">
            <text class="card-icon">✦</text>
            <text>外观风格</text>
          </view>
          <view class="ui-style-list">
            <view
              v-for="style in store.appearanceOptions"
              :key="style.id"
              class="ui-style-option"
              :class="{ active: style.active }"
              @tap="store.setAppearance(style.id)"
            >
              <view v-if="style.swatch" class="theme-swatch" :class="style.swatch"></view>
              <view class="ui-style-copy">
                <text class="ui-style-name">{{ style.name }}</text>
                <text class="ui-style-desc">{{ style.desc }}</text>
              </view>
              <text v-if="style.active" class="ui-style-check">✓</text>
            </view>
          </view>
        </view>

        <!-- ========== 反克法显示模式 ========== -->
        <view class="setting-card">
          <view class="setting-row">
            <view class="setting-copy">
              <text class="setting-label">单独显示反克法</text>
              <text class="setting-hint">开启后，反克法有取穴结果时会单独显示</text>
            </view>
            <switch
              :checked="store.fankeDisplayMode === 'separate'"
              @change="onFankeModeChange"
              :color="store.themeSwitchColor"
            />
          </view>
        </view>

        <!-- ========== 取穴方法说明入口 ========== -->
        <view class="setting-card" @tap="goMethods">
          <view class="setting-row">
            <text class="setting-label">取穴方法说明</text>
            <text class="picker-arrow">▶</text>
          </view>
        </view>

        <!-- ========== 关于入口 ========== -->
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

    <!-- 取穴方法说明弹窗 -->
    <view v-if="showMethods" class="fullscreen-overlay" @tap="showMethods = false">
      <view class="fullscreen-panel" @tap.stop>
        <view class="fullscreen-header" :style="{ paddingTop: statusBarHeight + 'px' }">
          <view class="close-btn" @tap="showMethods = false">
            <text class="close-icon">✕</text>
          </view>
          <text class="fullscreen-title">取穴方法说明</text>
        </view>
        <scroll-view scroll-y class="fullscreen-body" :show-scrollbar="false">
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
          <view :style="{ height: safeBottom + 20 + 'px' }"></view>
        </scroll-view>
      </view>
    </view>

    <!-- 关于弹窗 -->
    <view v-if="showAbout" class="fullscreen-overlay" @tap="showAbout = false">
      <view class="fullscreen-panel" @tap.stop>
        <view class="fullscreen-header" :style="{ paddingTop: statusBarHeight + 'px' }">
          <view class="close-btn" @tap="showAbout = false">
            <text class="close-icon">✕</text>
          </view>
          <text class="fullscreen-title">关于</text>
        </view>
        <scroll-view scroll-y class="fullscreen-body" :show-scrollbar="false">
          <view class="about-content-inner">
            <!-- Logo区域 -->
            <view class="logo-area">
              <text class="logo-icon">☯</text>
              <text class="app-name">子午流注取穴</text>
              <text class="app-version">v{{ version }}</text>
            </view>
            <!-- 应用简介 -->
            <view class="desc-card">
              <text class="desc-text">
                子午流注取穴系统是一款基于中医时间医学的智能化取穴辅助工具。系统支持纳甲法、纳子法、灵龟八法、飞腾八法四种传统取穴方法，结合干支推算和真太阳时校正，为中医针灸师提供精准的取穴参考。
              </text>
            </view>
            <!-- 免责声明 -->
            <view class="disclaimer-card">
              <text class="disclaimer-label">免责声明</text>
              <text class="disclaimer-text">
                软件所提供的取穴结果仅供参考，不作为任何临床诊疗依据。实际应用中应以临床实际为准，因时、因地、因人，结合患者具体情况进行辨证施治。
              </text>
            </view>
          </view>
          <view :style="{ height: safeBottom + 20 + 'px' }"></view>
        </scroll-view>
      </view>
    </view>
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
import { onShow, onBackPress } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'
import CityPicker from '@/components/CityPicker.vue'
import manifest from '@/manifest.json'
import { METHOD_DESCS } from '@/data/constants.js'

const store = useAppStore()
const { statusBarHeight, safeAreaBottom } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)
const safeBottom = computed(() => safeAreaBottom.value)
const cityPickerRef = ref(null)
const showMethods = ref(false)
const showAbout = ref(false)
const version = manifest.versionName || '1.0.0'

const methodDescs = METHOD_DESCS

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

/** 打开城市选择弹窗（复用 CityPicker 组件） */
function openCityPicker() {
  cityPickerRef.value.open((cityData) => {
    // 回调：用户选择城市后，更新经度和城市名
    store.updateLongitude(cityData.longitude, cityData.name)
  })
}

function goMethods() {
  showMethods.value = true
}

function goAbout() {
  showAbout.value = true
}

/** 返回键拦截：弹窗打开时关闭弹窗，否则跳转取穴页 */
onBackPress(() => {
  // 优先级：CityPicker > 方法说明 > 关于
  if (cityPickerRef.value?.isOpen) {
    cityPickerRef.value.close()
    return true // 拦截返回键
  }
  if (showMethods.value) {
    showMethods.value = false
    return true // 拦截返回键
  }
  if (showAbout.value) {
    showAbout.value = false
    return true // 拦截返回键
  }
  // 弹窗都关闭时，跳转取穴页（有意设计：设置页非主功能页，返回时回到取穴主界面）
  uni.switchTab({ url: '/pages/index/index' })
  return true // 拦截默认返回行为，避免直接退出应用
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $tcm-bg;
}

.nav-placeholder {
  flex-shrink: 0;
}

.page-scroll {
  flex: 1;
  height: 0;        /* 关键：配合flex:1让scroll-view正确计算剩余高度 */
  overflow: hidden;
}

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
  border-bottom: 1rpx solid var(--theme-border);

  &.no-border {
    border-bottom: none;
  }
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

.setting-hint {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
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
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  border-radius: 16rpx;
}

.city-name-text {
  font-size: $font-size-sm;
  color: var(--theme-primary);
  font-weight: 500;
}

.picker-arrow {
  font-size: 18rpx;
  color: $tcm-text-hint;
}

.theme-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md;
  background: var(--theme-surface-muted);
  border-radius: 18rpx;
  border: 1rpx solid var(--theme-border);
  margin-bottom: $spacing-sm;
}

.theme-current-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.theme-expand-arrow {
  font-size: 20rpx;
  color: $tcm-text-hint;
  transition: transform 0.25s ease;
  padding: 8rpx;
}

.theme-expand-arrow.expanded {
  transform: rotate(90deg);
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
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  border-radius: 18rpx;

  &.active {
    border-color: var(--theme-primary);
    background: var(--theme-surface-muted);
  }
}

.theme-swatch {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  flex-shrink: 0;

  &.yellow {
    background: linear-gradient(135deg, #8B4513 0%, #FFFDF5 100%);
  }

  &.black {
    background: linear-gradient(135deg, #000000 0%, #0080FF 100%);
  }

  &.green {
    background: linear-gradient(135deg, #2F7D73 0%, #F7FBF8 100%);
  }

  &.red {
    background: linear-gradient(135deg, #B83A2E 0%, #FFF1E5 100%);
  }

  &.modern {
    background: linear-gradient(145deg, #f7f9fc 8%, #c4cad3 92%);
    box-shadow: inset 5rpx 5rpx 10rpx rgba(174, 181, 191, 0.55), inset -5rpx -5rpx 10rpx #ffffff;
  }

  &.ink {
    background: radial-gradient(circle at 68% 30%, #f7f3ea 0 24%, #77736b 26% 43%, #242424 72%);
  }

  &.morandi {
    background: linear-gradient(135deg, #b99a9a 0%, #d9c7bd 48%, #aeb9aa 100%);
  }

  &.watercolor {
    background:
      radial-gradient(circle at 25% 24%, rgba(232, 168, 124, 0.95), transparent 42%),
      radial-gradient(circle at 76% 72%, rgba(133, 205, 202, 0.95), transparent 46%),
      #faf8f5;
  }
}

/* === 界面风格切换（经典 + 多套新界面） === */
.ui-style-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.ui-style-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  padding: $spacing-md;
  background: var(--theme-surface-muted);
  border: 1rpx solid var(--theme-border);
  border-radius: 18rpx;
  transition: all 0.2s ease;

  &.active {
    border-color: var(--theme-primary);
    background: var(--theme-surface);

    .ui-style-name {
      color: var(--theme-primary);
    }
  }
}

.ui-style-copy {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  min-width: 0;
}

.ui-style-name {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $tcm-text;
}

.ui-style-desc {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
}

.ui-style-check {
  font-size: $font-size-md;
  font-weight: 700;
  color: var(--theme-primary);
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
  border-bottom: 1rpx solid var(--theme-border);

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

/* === 全屏弹窗（方法说明 / 关于） === */
.fullscreen-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 999;
  background: $tcm-bg;
  animation: overlayFadeIn 0.2s ease-out;
}

.fullscreen-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-header {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 20px 12px;
  border-bottom: 1px solid var(--theme-border);
  flex-shrink: 0;
}

.fullscreen-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-primary);
  font-family: 'KaitiGB2312', 'WenYuanSerifSC', 'KaiTi', 'STKaiti', serif;
}

.close-btn {
  background: none !important;
  border: none !important;
  width: auto !important;
  height: auto !important;
  border-radius: 0 !important;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* #ifndef MP-WEIXIN */
  margin-left: auto;  /* H5/App：推到右侧 */
  /* #endif */
}

.close-icon {
  font-size: 18px;
  color: var(--theme-text-secondary);
}

.fullscreen-body {
  flex: 1;
  height: 0;        /* 关键：配合flex:1让scroll-view正确计算剩余高度 */
  overflow: hidden;
}

/* 方法说明弹窗内容 */
.method-card {
  background: $tcm-bg-light;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $spacing-lg;
  margin: $spacing-md $spacing-lg 0;
}

.method-card:first-child {
  margin-top: $spacing-lg;
}

.method-card:last-child {
  margin-bottom: 0;
}

/* 关于弹窗内容 */
.about-content-inner {
  padding: $spacing-lg;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 36rpx;
}

.logo-icon {
  font-size: 120rpx;
  margin-bottom: $spacing-lg;
}

.app-name {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--theme-primary);
  font-family: 'KaitiGB2312', 'WenYuanSerifSC', 'KaiTi', serif;
}

.app-version {
  font-size: $font-size-sm;
  color: $tcm-text-hint;
  margin-top: $spacing-sm;
}

.desc-card {
  background: $tcm-bg-light;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $spacing-xl $spacing-lg;
  margin-bottom: $spacing-lg;
}

.desc-text {
  font-size: $font-size-sm;
  color: $tcm-text-secondary;
  line-height: 2.2;
  text-align: justify;
}

.disclaimer-card {
  background: var(--theme-surface-muted);
  border-radius: $radius-md;
  padding: $spacing-lg;
  border: 1rpx solid var(--theme-border);
}

.disclaimer-label {
  font-size: $font-size-xs;
  font-weight: 600;
  color: $tcm-text-hint;
  margin-bottom: $spacing-sm;
  display: block;
}

.disclaimer-text {
  font-size: 22rpx;
  color: $tcm-text-hint;
  line-height: 1.9;
  text-align: justify;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
