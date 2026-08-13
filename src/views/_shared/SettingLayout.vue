<template>
  <!--
    SettingLayout - 设置页共享布局（模板收敛核心）

    ============================================================
    设计说明（给后来者/AI）
    ============================================================
    1. 背景：与 HomeLayout 同理，7 套设置页此前各自持有约 200 行几乎相同的模板
       （卡片结构/外观选项列表/折叠逻辑/两个全屏弹窗），业务改动需同步 7 份。
       本组件收拢全部公共结构，主题组件退化为薄壳：
           主题组件 → <SettingLayout> + 提供图标具名插槽
    2. 根 class 自动推导（同 HomeLayout）：classic → theme-<activeTheme>；
       其它 → ui-<activeUiStyle>；ink 额外补 ink-bg-<inkBackgroundPeriod>。
    3. 图标差异经具名插槽注入（每套主题只提供自己的卡片标题图标）：
       - icon-solar / icon-style / icon-najia / icon-personal：四张卡片标题图标
       - icon-methods / icon-about：两个入口行的右侧箭头
       classic 传 emoji/文本（微信小程序不支持内联 SVG），其余主题传内联 SVG。
    4. 开关统一使用 ThemeSwitch 组件（内部按主题分发原生 switch / ink 自定义开关）。
    5. 折叠箭头统一为 appearance-expand-icon（文本 ⌄，带旋转动画）：
       此前 modern 系使用 caret 圆形 SVG，收敛为统一形态，结构优先。
    6. 业务状态通过 useSetting() 获取（契约见 useSettingPage.js）；
       两个全屏弹窗（方法说明/关于）与返回键拦截逻辑仍在 useSettingPage 中。
    ============================================================
  -->
  <view class="page" :class="rootClasses">
    <AppNavbar title="设置" />
    <view :style="{ height: setting.navHeight + 'px' }" class="nav-placeholder"></view>

    <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
      <view class="setting-content">
        <!-- ========== 真太阳时设置区域 ========== -->
        <view class="setting-card solar-card">
          <view class="card-title">
            <slot name="icon-solar"></slot>
            <text>真太阳时校正</text>
          </view>
          <text class="solar-desc">根据指定城市的地理位置进行时间误差校正</text>
          <view class="setting-row">
            <text class="setting-label">启用真太阳时</text>
            <ThemeSwitch
              :checked="setting.store.useTrueSolarTime"
              @change="setting.onSolarTimeToggle"
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
            <text class="setting-value">{{ Number(setting.store.longitude || 0).toFixed(1) }}°</text>
          </view>
        </view>

        <!-- ========== 外观风格统一切换 ========== -->
        <view class="setting-card">
          <view class="card-title">
            <slot name="icon-style"></slot>
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
              <slot name="icon-najia"></slot>
              <text>特殊取穴</text>
            </view>
            <text class="appearance-expand-icon" :class="{ expanded: setting.najiaExpanded }">⌄</text>
          </view>
          <text class="card-desc">调整纳甲法的特殊取穴方法</text>
          <view v-if="setting.najiaExpanded">
            <view class="setting-row">
              <view class="setting-copy">
                <text class="setting-label">反克法</text>
                <text class="setting-hint">开启后将会显示反克法取穴（如有）</text>
              </view>
              <ThemeSwitch
                :checked="setting.store.showFanke"
                @change="setting.onFankeToggle"
              />
            </view>
            <!-- 默认关闭，只在纳甲法闭穴时补充合日穴位，不改变原始纳甲结果。 -->
            <view class="setting-row no-border">
              <view class="setting-copy">
                <text class="setting-label">合日互用</text>
                <text class="setting-hint">开启后将会显示合日互用取穴（如有）</text>
              </view>
              <ThemeSwitch
                :checked="setting.store.useHeRiHuYong"
                @change="setting.onHeRiHuYongToggle"
              />
            </view>
          </view>
        </view>

        <!-- ========== 个性化 ========== -->
        <view class="setting-card" :class="{ 'card-collapsed': !setting.personalExpanded }">
          <view class="card-title card-title-collapsible" @tap="setting.personalExpanded = !setting.personalExpanded">
            <view class="card-title-left">
              <slot name="icon-personal"></slot>
              <text>个性化</text>
            </view>
            <text class="appearance-expand-icon" :class="{ expanded: setting.personalExpanded }">⌄</text>
          </view>
          <text class="card-desc">调整个性化体验和观感</text>
          <view v-if="setting.personalExpanded">
            <view class="setting-row">
              <view class="setting-copy">
                <text class="setting-label">干支历法</text>
                <text class="setting-hint">开启后将显示干支历法（四柱八字）</text>
              </view>
              <ThemeSwitch
                :checked="setting.store.showGanZhi"
                @change="setting.onGanZhiToggle"
              />
            </view>
            <view class="setting-row">
              <view class="setting-copy">
                <text class="setting-label">穴位编码</text>
                <text class="setting-hint">开启后将显示穴位编码</text>
              </view>
              <ThemeSwitch
                :checked="setting.store.showPointCode"
                @change="setting.onPointCodeToggle"
              />
            </view>
            <view class="setting-row no-border">
              <view class="setting-copy">
                <text class="setting-label">五行属性</text>
                <text class="setting-hint">开启后将显示穴位的五行属性</text>
              </view>
              <ThemeSwitch
                :checked="setting.store.showWuXing"
                @change="setting.onWuXingToggle"
              />
            </view>
          </view>
        </view>

        <!-- ========== 取穴方法说明入口 ========== -->
        <view class="setting-card card-compact" @tap="setting.goMethods">
          <view class="setting-row">
            <text class="setting-label">取穴方法说明</text>
            <slot name="icon-methods"></slot>
          </view>
        </view>

        <!-- ========== 关于入口 ========== -->
        <view class="setting-card card-compact" @tap="setting.goAbout">
          <view class="setting-row">
            <text class="setting-label">关于</text>
            <slot name="icon-about"></slot>
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
import { onMounted } from 'vue'
import { useSetting } from '@/composables/useSettingPage.js'
import { useRootClasses } from '@/composables/useRootClasses.js'
import { mark, measure } from '@/utils/perf.js'
import AppNavbar from '@/components/AppNavbar.vue'
import CityPicker from '@/components/CityPicker.vue'
import ThemeTransitionOverlay from '@/components/ThemeTransitionOverlay.vue'
import ThemeSwitch from '@/views/_shared/ThemeSwitch.vue'

// 壳层注入的共享业务状态与方法（契约见 useSettingPage.js）
const setting = useSetting()

// 主题根 class 自动推导（classic → theme-*，其它 → ui-*，ink 补 ink-bg-*），
// 与 HomeLayout 共用同一实现，规则唯一来源见 useRootClasses.js
const rootClasses = useRootClasses()

// 挂载终点打点：与 useSettingPage.selectAppearance 的 'theme-switch:start' 配对，
// 汇总「切换命令 → 新主题 Layout 挂载完成」总耗时（含异步 chunk 解析/组件树创建/首次渲染）
onMounted(() => {
  mark('theme-layout:mounted')
  measure('theme-switch:start', 'theme-layout:mounted', `设置页主题切换 → ${setting.store.activeUiStyle}`)
})
</script>

<style lang="scss" scoped>
@use '@/views/_shared/setting-base.scss' as *;
</style>
