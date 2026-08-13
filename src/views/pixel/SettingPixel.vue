<template>
  <!--
    像素冒险主题设置页
  -->
  <view class="page ui-pixel">
  <AppNavbar title="设置" />
      <view :style="{ height: setting.navHeight + 'px' }" class="nav-placeholder"></view>
      <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
        <view class="setting-content">
          <view v-if="setting.store.activeUiStyle === 'pixel'" class="pixel-setting-banner" aria-hidden="true">
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
              <switch
                :checked="setting.store.useTrueSolarTime"
                @change="setting.onSolarTimeToggle"
                :color="setting.store.themeSwitchColor"
              />
            </view>
            <view v-if="setting.store.useTrueSolarTime" class="setting-row">
              <text class="setting-label">当前城市</text>
              <view class="city-picker-btn" @tap="setting.openCityPicker">
                <text class="city-name-text">{{ setting.store.selectedCity }}</text>
                <text class="picker-arrow">▶</text>
              </view>
            </view>
            <view v-if="setting.store.useTrueSolarTime" class="setting-row">
              <text class="setting-label">经度</text>
              <text class="setting-value">{{ setting.store.longitude.toFixed(1) }}°</text>
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
              v-if="setting.currentAppearance"
              class="ui-style-option ui-style-current active"
              @tap="setting.appearanceExpanded = !setting.appearanceExpanded"
            >
              <view v-if="setting.currentAppearance.swatch" class="theme-swatch" :class="setting.currentAppearance.swatch"></view>
              <view class="ui-style-copy">
                <text class="ui-style-name">{{ setting.currentAppearance.name }}</text>
                <text class="ui-style-desc">{{ setting.currentAppearance.desc }}</text>
              </view>
              <text class="appearance-expand-icon" :class="{ expanded: setting.appearanceExpanded }">⌄</text>
            </view>
            <view v-if="setting.appearanceExpanded" class="ui-style-list theme-options">
              <!--
                经典配色以二级分组承载：一级列表只占一行，展开后才显示四色。
                这样保留原有配色能力，同时避免它们与六套完整 UI 风格平铺在同一层。
              -->
              <view
                class="ui-style-option classic-style-group"
                :class="{ active: setting.store.activeUiStyle === 'classic' }"
                @tap="setting.classicThemesExpanded = !setting.classicThemesExpanded"
              >
                <view class="theme-swatch classic"></view>
                <view class="ui-style-copy">
                  <text class="ui-style-name">经典四色</text>
                  <text class="ui-style-desc">{{ setting.classicGroupDescription }}</text>
                </view>
                <text class="appearance-expand-icon" :class="{ expanded: setting.classicThemesExpanded }">⌄</text>
              </view>
              <view v-if="setting.classicThemesExpanded" class="classic-theme-list">
                <view
                  v-for="style in setting.classicAppearanceOptions"
                  :key="style.id"
                  class="ui-style-option classic-theme-option"
                  :class="{ active: style.active }"
                  @tap="setting.selectAppearance(style.id)"
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
                v-for="style in setting.standaloneAppearanceOptions"
                :key="style.id"
                class="ui-style-option"
                :class="{ active: style.active }"
                @tap="setting.selectAppearance(style.id)"
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
          <view class="setting-card" :class="{ 'card-collapsed': !setting.najiaExpanded }">
            <view class="card-title card-title-collapsible" @tap="setting.najiaExpanded = !setting.najiaExpanded">
              <view class="card-title-left">
                <text class="card-icon">☯</text>
                <text>特殊取穴</text>
              </view>
              <view class="caret-expand" :class="{ expanded: setting.najiaExpanded }">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="88 112 128 152 168 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
              </view>
            </view>
            <text class="card-desc">调整纳甲法的特殊取穴方法</text>
            <view v-if="setting.najiaExpanded">
              <view class="setting-row">
                <view class="setting-copy">
                  <text class="setting-label">反克法</text>
                  <text class="setting-hint">开启后将会显示反克法取穴（如有）</text>
                </view>
                <switch
                  :checked="setting.store.showFanke"
                  @change="setting.onFankeToggle"
                  :color="setting.store.themeSwitchColor"
                />
              </view>
              <!-- 默认关闭，只在纳甲法闭穴时补充合日穴位，不改变原始纳甲结果。 -->
              <view class="setting-row no-border">
                <view class="setting-copy">
                  <text class="setting-label">合日互用</text>
                  <text class="setting-hint">开启后将会显示合日互用取穴（如有）</text>
                </view>
                <switch
                  :checked="setting.store.useHeRiHuYong"
                  @change="setting.onHeRiHuYongToggle"
                  :color="setting.store.themeSwitchColor"
                />
              </view>
            </view>
          </view>
  
          <!-- ========== 个性化 ========== -->
          <view class="setting-card" :class="{ 'card-collapsed': !setting.personalExpanded }">
            <view class="card-title card-title-collapsible" @tap="setting.personalExpanded = !setting.personalExpanded">
              <view class="card-title-left">
                <view class="card-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M130.05,206.11c-1.34,0-2.69,0-4,0L94,224a104.61,104.61,0,0,1-34.11-19.2l-.12-36c-.71-1.12-1.38-2.25-2-3.41L25.9,147.24a99.15,99.15,0,0,1,0-38.46l31.84-18.1c.65-1.15,1.32-2.29,2-3.41l.16-36A104.58,104.58,0,0,1,94,32l32,17.89c1.34,0,2.69,0,4,0L162,32a104.61,104.61,0,0,1,34.11,19.2l.12,36c.71,1.12,1.38,2.25,2,3.41l31.85,18.14a99.15,99.15,0,0,1,0,38.46l-31.84,18.1c-.65,1.15-1.32,2.29-2,3.41l-.16,36A104.58,104.58,0,0,1,162,224Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></view>
                <text>个性化</text>
              </view>
              <view class="caret-expand" :class="{ expanded: setting.personalExpanded }">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="88 112 128 152 168 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
              </view>
            </view>
            <text class="card-desc">调整个性化体验和观感</text>
            <view v-if="setting.personalExpanded">
              <view class="setting-row">
                <view class="setting-copy">
                  <text class="setting-label">干支历法</text>
                  <text class="setting-hint">开启后将显示干支历法（四柱八字）</text>
                </view>
                <switch
                  :checked="setting.store.showGanZhi"
                  @change="setting.onGanZhiToggle"
                  :color="setting.store.themeSwitchColor"
                />
              </view>
              <view class="setting-row">
                <view class="setting-copy">
                  <text class="setting-label">穴位编码</text>
                  <text class="setting-hint">开启后将显示穴位编码</text>
                </view>
                <switch
                  :checked="setting.store.showPointCode"
                  @change="setting.onPointCodeToggle"
                  :color="setting.store.themeSwitchColor"
                />
              </view>
              <view class="setting-row no-border">
                <view class="setting-copy">
                  <text class="setting-label">五行属性</text>
                  <text class="setting-hint">开启后将显示穴位的五行属性</text>
                </view>
                <switch
                  :checked="setting.store.showWuXing"
                  @change="setting.onWuXingToggle"
                  :color="setting.store.themeSwitchColor"
                />
              </view>
            </view>
          </view>
  
          <!-- ========== 取穴方法说明入口 ========== -->
          <view class="setting-card card-compact" @tap="setting.goMethods">
            <view class="setting-row">
              <text class="setting-label">取穴方法说明</text>
              <view class="picker-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="112 88 152 128 112 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
              </view>
            </view>
          </view>
  
          <!-- ========== 关于入口 ========== -->
          <view class="setting-card card-compact" @tap="setting.goAbout">
            <view class="setting-row">
              <text class="setting-label">关于</text>
              <view class="picker-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="svg-icon"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="112 88 152 128 112 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
              </view>
            </view>
          </view>
  
          <view :style="{ height: setting.safeBottom + 60 + 'px' }"></view>
        </view>
      </scroll-view>
      <CityPicker :ref="el => (setting.cityPickerRef = el)" />
  
      <ThemeTransitionOverlay
        v-if="setting.themeTransitionVisible"
        :theme="setting.themeTransitionKind"
        :closing="setting.themeTransitionClosing"
      />
  
      <!-- 取穴方法说明弹窗 -->
      <view v-if="setting.showMethods" class="fullscreen-overlay" @tap="setting.showMethods = false">
        <view class="fullscreen-panel" @tap.stop>
          <view class="fullscreen-header" :style="{ paddingTop: setting.statusBarHeight + 'px' }">
            <view class="close-btn" @tap="setting.showMethods = false">
              <text class="close-icon">✕</text>
            </view>
            <text class="fullscreen-title">取穴方法说明</text>
          </view>
          <scroll-view scroll-y class="fullscreen-body" :show-scrollbar="false">
            <view
              v-for="m in setting.methodDescs"
              :key="m.id"
              class="method-card"
            >
              <view class="method-header">
                <text class="method-icon">{{ m.icon }}</text>
                <text class="method-name">{{ m.name }}</text>
              </view>
              <text class="method-detail">{{ m.desc }}</text>
            </view>
            <view :style="{ height: setting.safeBottom + 20 + 'px' }"></view>
          </scroll-view>
        </view>
      </view>
  
      <!-- 关于弹窗 -->
      <view v-if="setting.showAbout" class="fullscreen-overlay" @tap="setting.showAbout = false">
        <view class="fullscreen-panel" @tap.stop>
          <view class="fullscreen-header" :style="{ paddingTop: setting.statusBarHeight + 'px' }">
            <view class="close-btn" @tap="setting.showAbout = false">
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
                <text class="app-version">v{{ setting.version }}</text>
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
            <view :style="{ height: setting.safeBottom + 20 + 'px' }"></view>
          </scroll-view>
        </view>
      </view>
  </view>
</template>

<script setup>
import { useSetting } from '@/composables/useSettingPage.js'
import AppNavbar from '@/components/AppNavbar.vue'
import CityPicker from '@/components/CityPicker.vue'
import ThemeTransitionOverlay from '@/components/ThemeTransitionOverlay.vue'

const setting = useSetting()
</script>

<style lang="scss" scoped>
@use '@/views/_shared/setting-base.scss' as *;
</style>
