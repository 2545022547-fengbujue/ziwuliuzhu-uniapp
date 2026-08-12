<template>
  <view class="page" :class="[store.activeUiStyle === 'classic' ? `theme-${store.activeTheme}` : `ui-${store.activeUiStyle}`, store.activeUiStyle === 'ink' ? `ink-bg-${store.inkBackgroundPeriod}` : '']">
    <AppNavbar title="设置" />
    <view :style="{ height: navHeight + 'px' }" class="nav-placeholder"></view>
    <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
      <view class="setting-content">
        <view v-if="store.activeUiStyle === 'animal'" class="animal-friends-setting" aria-hidden="true">
          <image
            class="animal-friends-setting-image"
            src="/static/themes/animal/animal-friends.png"
            mode="widthFix"
          />
          <text class="animal-friends-setting-label">欢迎来到动物岛</text>
        </view>
        <view v-if="store.activeUiStyle === 'pixel'" class="pixel-setting-banner" aria-hidden="true">
          <text class="pixel-setting-icon">⚙</text>
          <view><text>OPTIONS</text><text>冒险者设置</text></view>
          <text class="pixel-setting-cursor">▶</text>
        </view>
        <!-- ========== 真太阳时设置区域 ========== -->
        <view class="setting-card solar-card">
          <view class="card-title">
            <view class="card-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><line x1="56" y1="232" x2="200" y2="232" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></view>
            <text>真太阳时校正</text>
          </view>
          <text class="solar-desc">根据指定城市的地理位置进行时间误差校正</text>
          <view class="setting-row">
            <text class="setting-label">启用真太阳时</text>
            <view
              v-if="store.activeUiStyle === 'ink'"
              class="ink-switch"
              :class="{ active: store.useTrueSolarTime }"
              @tap="onSolarTimeToggle({ detail: { value: !store.useTrueSolarTime } })"
            >
              <view class="ink-switch-track"></view>
              <view class="ink-switch-knob"></view>
            </view>
            <switch
              v-else
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
            <view class="card-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><line x1="216" y1="128" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="192" y1="152" x2="240" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="80" y1="40" x2="80" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="56" y1="64" x2="104" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="168" y1="184" x2="168" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="152" y1="200" x2="184" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="80" x2="176" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="21.49" y="105.37" width="213.02" height="45.25" rx="8" transform="translate(-53.02 128) rotate(-45)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></view>
            <text>外观风格</text>
          </view>
          <!-- 默认只呈现当前风格，避免八个选项把设置页拉得过长。 -->
          <view
            v-if="currentAppearance"
            class="ui-style-option ui-style-current active"
            @tap="appearanceExpanded = !appearanceExpanded"
          >
            <view v-if="currentAppearance.swatch" class="theme-swatch" :class="currentAppearance.swatch"></view>
            <view class="ui-style-copy">
              <text class="ui-style-name">{{ currentAppearance.name }}</text>
              <text class="ui-style-desc">{{ currentAppearance.desc }}</text>
            </view>
            <text class="appearance-expand-icon" :class="{ expanded: appearanceExpanded }">⌄</text>
          </view>
          <view v-if="appearanceExpanded" class="ui-style-list theme-options">
            <!--
              经典配色以二级分组承载：一级列表只占一行，展开后才显示四色。
              这样保留原有配色能力，同时避免它们与六套完整 UI 风格平铺在同一层。
            -->
            <view
              class="ui-style-option classic-style-group"
              :class="{ active: store.activeUiStyle === 'classic' }"
              @tap="classicThemesExpanded = !classicThemesExpanded"
            >
              <view class="theme-swatch classic"></view>
              <view class="ui-style-copy">
                <text class="ui-style-name">经典四色</text>
                <text class="ui-style-desc">{{ classicGroupDescription }}</text>
              </view>
              <text class="appearance-expand-icon" :class="{ expanded: classicThemesExpanded }">⌄</text>
            </view>
            <view v-if="classicThemesExpanded" class="classic-theme-list">
              <view
                v-for="style in classicAppearanceOptions"
                :key="style.id"
                class="ui-style-option classic-theme-option"
                :class="{ active: style.active }"
                @tap="selectAppearance(style.id)"
              >
                <view class="theme-swatch" :class="style.swatch"></view>
                <view class="ui-style-copy">
                  <text class="ui-style-name">{{ style.name }}</text>
                  <text class="ui-style-desc">{{ style.desc }}</text>
                </view>
                <text v-if="style.active" class="ui-style-check">✓</text>
              </view>
            </view>
            <view
              v-for="style in standaloneAppearanceOptions"
              :key="style.id"
              class="ui-style-option"
              :class="{ active: style.active }"
              @tap="selectAppearance(style.id)"
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

        <!-- ========== 特殊取穴（原纳甲法设置） ========== -->
        <view class="setting-card" :class="{ 'card-collapsed': !najiaExpanded }">
          <view class="card-title card-title-collapsible" @tap="najiaExpanded = !najiaExpanded">
            <view class="card-title-left">
              <text class="card-icon">☯</text>
              <text>特殊取穴</text>
            </view>
            <view class="caret-expand" :class="{ expanded: najiaExpanded }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="88 112 128 152 168 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
            </view>
          </view>
          <text class="card-desc">调整纳甲法的特殊取穴方法</text>
          <view v-if="najiaExpanded">
            <view class="setting-row">
              <view class="setting-copy">
                <text class="setting-label">反克法</text>
                <text class="setting-hint">开启后将会显示反克法取穴（如有）</text>
              </view>
              <view
                v-if="store.activeUiStyle === 'ink'"
                class="ink-switch"
                :class="{ active: store.showFanke }"
                @tap="onFankeToggle({ detail: { value: !store.showFanke } })"
              >
                <view class="ink-switch-track"></view>
                <view class="ink-switch-knob"></view>
              </view>
              <switch
                v-else
                :checked="store.showFanke"
                @change="onFankeToggle"
                :color="store.themeSwitchColor"
              />
            </view>
            <!-- 默认关闭，只在纳甲法闭穴时补充合日穴位，不改变原始纳甲结果。 -->
            <view class="setting-row no-border">
              <view class="setting-copy">
                <text class="setting-label">合日互用</text>
                <text class="setting-hint">开启后将会显示合日互用取穴（如有）</text>
              </view>
              <view
                v-if="store.activeUiStyle === 'ink'"
                class="ink-switch"
                :class="{ active: store.useHeRiHuYong }"
                @tap="onHeRiHuYongToggle({ detail: { value: !store.useHeRiHuYong } })"
              >
                <view class="ink-switch-track"></view>
                <view class="ink-switch-knob"></view>
              </view>
              <switch
                v-else
                :checked="store.useHeRiHuYong"
                @change="onHeRiHuYongToggle"
                :color="store.themeSwitchColor"
              />
            </view>
          </view>
        </view>

        <!-- ========== 个性化 ========== -->
        <view class="setting-card" :class="{ 'card-collapsed': !personalExpanded }">
          <view class="card-title card-title-collapsible" @tap="personalExpanded = !personalExpanded">
            <view class="card-title-left">
              <view class="card-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M130.05,206.11c-1.34,0-2.69,0-4,0L94,224a104.61,104.61,0,0,1-34.11-19.2l-.12-36c-.71-1.12-1.38-2.25-2-3.41L25.9,147.24a99.15,99.15,0,0,1,0-38.46l31.84-18.1c.65-1.15,1.32-2.29,2-3.41l.16-36A104.58,104.58,0,0,1,94,32l32,17.89c1.34,0,2.69,0,4,0L162,32a104.61,104.61,0,0,1,34.11,19.2l.12,36c.71,1.12,1.38,2.25,2,3.41l31.85,18.14a99.15,99.15,0,0,1,0,38.46l-31.84,18.1c-.65,1.15-1.32,2.29-2,3.41l-.16,36A104.58,104.58,0,0,1,162,224Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></view>
              <text>个性化</text>
            </view>
            <view class="caret-expand" :class="{ expanded: personalExpanded }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="88 112 128 152 168 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
            </view>
          </view>
          <text class="card-desc">调整个性化体验和观感</text>
          <view v-if="personalExpanded">
            <view class="setting-row">
              <view class="setting-copy">
                <text class="setting-label">干支历法</text>
                <text class="setting-hint">开启后将显示干支历法（四柱八字）</text>
              </view>
              <view
                v-if="store.activeUiStyle === 'ink'"
                class="ink-switch"
                :class="{ active: store.showGanZhi }"
                @tap="onGanZhiToggle({ detail: { value: !store.showGanZhi } })"
              >
                <view class="ink-switch-track"></view>
                <view class="ink-switch-knob"></view>
              </view>
              <switch
                v-else
                :checked="store.showGanZhi"
                @change="onGanZhiToggle"
                :color="store.themeSwitchColor"
              />
            </view>
            <view class="setting-row">
              <view class="setting-copy">
                <text class="setting-label">穴位编码</text>
                <text class="setting-hint">开启后将显示穴位编码</text>
              </view>
              <view
                v-if="store.activeUiStyle === 'ink'"
                class="ink-switch"
                :class="{ active: store.showPointCode }"
                @tap="onPointCodeToggle({ detail: { value: !store.showPointCode } })"
              >
                <view class="ink-switch-track"></view>
                <view class="ink-switch-knob"></view>
              </view>
              <switch
                v-else
                :checked="store.showPointCode"
                @change="onPointCodeToggle"
                :color="store.themeSwitchColor"
              />
            </view>
            <view class="setting-row no-border">
              <view class="setting-copy">
                <text class="setting-label">五行属性</text>
                <text class="setting-hint">开启后将显示穴位的五行属性</text>
              </view>
              <view
                v-if="store.activeUiStyle === 'ink'"
                class="ink-switch"
                :class="{ active: store.showWuXing }"
                @tap="onWuXingToggle({ detail: { value: !store.showWuXing } })"
              >
                <view class="ink-switch-track"></view>
                <view class="ink-switch-knob"></view>
              </view>
              <switch
                v-else
                :checked="store.showWuXing"
                @change="onWuXingToggle"
                :color="store.themeSwitchColor"
              />
            </view>
          </view>
        </view>

        <!-- ========== 取穴方法说明入口 ========== -->
        <view class="setting-card card-compact" @tap="goMethods">
          <view class="setting-row">
            <text class="setting-label">取穴方法说明</text>
            <view class="picker-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="112 88 152 128 112 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
            </view>
          </view>
        </view>

        <!-- ========== 关于入口 ========== -->
        <view class="setting-card card-compact" @tap="goAbout">
          <view class="setting-row">
            <text class="setting-label">关于</text>
            <view class="picker-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="112 88 152 128 112 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
            </view>
          </view>
        </view>

        <view :style="{ height: safeBottom + 60 + 'px' }"></view>
      </view>
    </scroll-view>
    <CityPicker ref="cityPickerRef" />

    <ThemeTransitionOverlay
      v-if="themeTransitionVisible"
      :theme="themeTransitionKind"
      :closing="themeTransitionClosing"
    />

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
import { ref, computed, onUnmounted } from 'vue'
import { onShow, onHide, onBackPress } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import AppNavbar from '@/components/AppNavbar.vue'
import CityPicker from '@/components/CityPicker.vue'
import ThemeTransitionOverlay from '@/components/ThemeTransitionOverlay.vue'
import manifest from '@/manifest.json'
import { METHOD_DESCS } from '@/data/constants.js'

const store = useAppStore()
const { statusBarHeight, safeAreaBottom } = useSystemInfo()
const navHeight = computed(() => statusBarHeight.value + 44)
const safeBottom = computed(() => safeAreaBottom.value)
const cityPickerRef = ref(null)
const showMethods = ref(false)
const showAbout = ref(false)
const appearanceExpanded = ref(false)
const classicThemesExpanded = ref(false)
const najiaExpanded = ref(false)
const personalExpanded = ref(false)
const themeTransitionVisible = ref(false)
const themeTransitionClosing = ref(false)
const themeTransitionKind = ref('animal')
const version = manifest.versionName || '1.0.0'

const methodDescs = METHOD_DESCS
const currentAppearance = computed(() => {
  return store.appearanceOptions.find(item => item.active) || store.appearanceOptions[0]
})
/** 经典主题与独立 UI 风格拆成两层，仅改变设置页信息架构，不改变 Store 的持久化键。 */
const classicAppearanceOptions = computed(() => store.appearanceOptions.filter(item => item.id.startsWith('theme-')))
const standaloneAppearanceOptions = computed(() => store.appearanceOptions.filter(item => item.id.startsWith('style-')))
const classicGroupDescription = computed(() => {
  const activeClassic = classicAppearanceOptions.value.find(item => item.active)
  return activeClassic ? `当前：${activeClassic.name}` : '古典宣纸、暗夜幽光、青瓷天青、朱砂丹霞'
})
let visualClockTimer = null
let themeTransitionApplyTimer = null
let themeTransitionCloseTimer = null
let themeTransitionEndTimer = null

function startVisualClockTimer() {
  if (visualClockTimer) clearInterval(visualClockTimer)
  visualClockTimer = setInterval(() => store.refreshVisualClock(), 60 * 1000)
}

function stopVisualClockTimer() {
  if (visualClockTimer) {
    clearInterval(visualClockTimer)
    visualClockTimer = null
  }
}

function clearThemeTransitionTimers() {
  if (themeTransitionApplyTimer) clearTimeout(themeTransitionApplyTimer)
  if (themeTransitionCloseTimer) clearTimeout(themeTransitionCloseTimer)
  if (themeTransitionEndTimer) clearTimeout(themeTransitionEndTimer)
  themeTransitionApplyTimer = null
  themeTransitionCloseTimer = null
  themeTransitionEndTimer = null
}

onShow(() => {
  store.refreshVisualClock()
  store.applyThemeChrome()
  startVisualClockTimer()
})

onHide(() => {
  stopVisualClockTimer()
})

onUnmounted(() => {
  clearThemeTransitionTimers()
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

/** 反克法显示开关；关闭后不再把结果合并到纳甲法面板。 */
function onFankeToggle(e) {
  store.toggleFanke(e.detail.value)
}

/** 合日互用开关；切换后 store.results 会基于同一日期时辰立即重新计算。 */
function onHeRiHuYongToggle(e) {
  store.toggleHeRiHuYong(e.detail.value)
}

/** 穴位编码显示开关；状态持久化后同时作用于列表和详情标题。 */
  function onPointCodeToggle(e) {
    store.togglePointCode(e.detail.value)
  }

  function onGanZhiToggle(e) {
    store.toggleGanZhi(e.detail.value)
  }

  /** 五行属性显示开关；状态持久化后同时作用于取穴列表与穴位详情。 */
  function onWuXingToggle(e) {
    store.toggleWuXing(e.detail.value)
  }

/** 选择外观后立即收起列表，让用户清楚看到当前生效项。 */
function selectAppearance(optionId) {
  appearanceExpanded.value = false

  const targetStyle = optionId.startsWith('style-') ? optionId.slice(6) : ''
  const needsTransition = targetStyle === 'animal' || targetStyle === 'ink'
  const isAlreadyActive = store.appearanceOptions.some(item => item.id === optionId && item.active)

  if (!needsTransition || isAlreadyActive || themeTransitionVisible.value) {
    if (!isAlreadyActive) store.setAppearance(optionId)
    return
  }

  clearThemeTransitionTimers()
  themeTransitionKind.value = targetStyle
  themeTransitionClosing.value = false
  themeTransitionVisible.value = true

  // 遮罩先完整出现，再切换底层主题，避免页面颜色在动画开始前闪变。
  // 不隐藏原生 TabBar：App 端可能延迟执行显隐，导致动画进行中底栏突然消失。
  themeTransitionApplyTimer = setTimeout(() => {
    store.setAppearance(optionId)
  }, 120)

  themeTransitionCloseTimer = setTimeout(() => {
    themeTransitionClosing.value = true
  }, 1380)

  themeTransitionEndTimer = setTimeout(() => {
    themeTransitionVisible.value = false
    themeTransitionClosing.value = false
    store.applyThemeChrome()
    clearThemeTransitionTimers()
  }, 1720)
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
  line-height: 1;
  width: 40rpx;
  text-align: center;
  flex-shrink: 0;
}

// 内联矢量图标容器（替换 emoji 符号）：跟随卡片标题主题色，垂直居中
.card-icon-svg {
  width: 40rpx;
  height: 40rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.svg-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.card-title-collapsible {
  justify-content: space-between;
  cursor: pointer;
}

.card-title-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.card-desc {
  display: block;
  font-size: $font-size-xs;
  color: $tcm-text-hint;
  line-height: 1.5;
  margin-top: -20rpx;
  margin-bottom: 28rpx;
  padding-left: 58rpx;
}

// 真太阳时校正标题下方的说明小字
.solar-desc {
  display: block;
  font-size: $font-size-xs;
  color: $tcm-text-hint;
  line-height: 1.5;
  margin-top: -16rpx;
  margin-bottom: 14rpx;
  padding-left: 58rpx;
}

// 真太阳时校正区域等比缩小（仅间距/图标/控件等比，字号保持原样），仅作用于本卡片内部
.solar-card {
  padding: 30rpx;

  .card-title {
    gap: 14rpx;
    margin-bottom: 26rpx;
  }

  .card-icon-svg {
    width: 32rpx;
    height: 32rpx;
  }

  .solar-desc {
    margin-top: -13rpx;
    margin-bottom: 12rpx;
    padding-left: 52rpx;
  }

  .setting-row {
    padding: 20rpx 0 12rpx;
  }

  .city-picker-btn {
    padding: 8rpx 20rpx;
    gap: 6rpx;
    border-radius: 14rpx;
  }

  // 行内控件与左侧文字垂直中线对齐，修正开关/图标偏上（跨端通用）
  switch,
  .ink-switch,
  .city-picker-btn,
  .setting-value {
    vertical-align: middle;
  }

  // 开关等比缩小（右侧对齐，缩放后位置不变）
  switch,
  .ink-switch {
    align-self: center;
    vertical-align: middle;
    transform: scale(0.82);
    transform-origin: right center;
  }

  // H5 下原生 switch 内部包裹层基线对齐
  uni-switch,
  .uni-switch-wrapper {
    vertical-align: middle;
  }
}

// 折叠态：压缩成与「取穴方法说明」类似的紧凑单行入口（仅标题 + 展开箭头）
.card-collapsed {
  .card-title {
    margin-bottom: 0;
  }

  .card-desc {
    display: none;
  }
}

// 取穴方法说明 / 关于：内部行清零上下内边距，与折叠态卡片等高的紧凑单行入口
.card-compact {
  .setting-row {
    padding: 0;
    border-bottom: none;
  }

  .setting-label {
    font-size: $font-size-base;
  }

  // 右侧导航箭头改用 caret-circle-right 内联 SVG；限定在本卡片内，不影响真太阳时城市选择器的文本箭头
  .picker-arrow {
    width: 36rpx;
    height: 36rpx;
    font-size: 0;
  }
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
    background:
      radial-gradient(circle at 28% 28%, #d8bfc0 0 24%, transparent 26%),
      radial-gradient(circle at 72% 70%, #c4d0c8 0 24%, transparent 26%),
      linear-gradient(135deg, #faf5ed, #dce5e7);
    border: 2rpx solid rgba(169, 130, 130, 0.12);
    box-shadow: 0 4rpx 12rpx rgba(142, 128, 116, 0.10);
  }

  &.classic {
    background: conic-gradient(from 45deg, #F1D8C7 0 25%, #BFD8D0 0 50%, #C9D6E8 0 75%, #E5C5C0 0);
    border: 4rpx solid rgba(255, 255, 255, 0.86);
    box-shadow: 0 0 0 1rpx rgba(89, 78, 68, 0.10);
  }

  &.watercolor {
    background:
      radial-gradient(circle at 25% 24%, rgba(232, 168, 124, 0.95), transparent 42%),
      radial-gradient(circle at 76% 72%, rgba(133, 205, 202, 0.95), transparent 46%),
      #faf8f5;
  }

  &.animal {
    background:
      radial-gradient(circle at 28% 26%, #F7CD67 0 22%, transparent 24%),
      radial-gradient(circle at 72% 72%, #82D5BB 0 24%, transparent 26%),
      linear-gradient(135deg, #F7F3DF 0%, #19AFA2 100%);
    box-shadow: inset 0 0 0 2rpx rgba(114, 93, 66, 0.10);
  }

  &.pixel {
    border-radius: 0;
    background:
      linear-gradient(90deg, transparent 0 25%, #5B6EE1 25% 50%, transparent 50% 75%, #E76E55 75%) 0 0 / 16rpx 16rpx,
      #F7E7B7;
    box-shadow: 0 0 0 4rpx #3F3A4B, 6rpx 6rpx 0 #9A7B4F;
    image-rendering: pixelated;
  }
}

/* === 界面风格切换（经典 + 多套新界面） === */
.ui-style-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.classic-theme-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-left: 28rpx;
  padding-left: 20rpx;
  border-left: 2rpx solid var(--theme-border);
}

.classic-theme-option {
  padding: 16rpx 24rpx;
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

.ui-style-current {
  cursor: pointer;
  padding: 42rpx;

  .ui-style-name {
    font-size: $font-size-md;
  }
}

.appearance-expand-icon {
  flex-shrink: 0;
  font-size: 34rpx;
  line-height: 1;
  color: var(--theme-primary);
  transform: rotate(0deg);
  transition: transform 0.22s ease;

  &.expanded {
    transform: rotate(180deg);
  }
}

// 折叠卡片展开图标（替换原 ⌄ 文本，flex 垂直居中的圆形箭头，展开时旋转 180° 指向上）
.caret-expand {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  color: var(--theme-primary);
  transform: rotate(0deg);
  transition: transform 0.22s ease;

  &.expanded {
    transform: rotate(180deg);
  }
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
