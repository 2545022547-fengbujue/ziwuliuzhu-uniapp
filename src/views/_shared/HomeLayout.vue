<template>
  <!--
    HomeLayout - 首页共享布局（模板收敛核心）

    ============================================================
    设计说明（给后来者/AI）
    ============================================================
    1. 背景：此前 7 套首页主题组件各自持有约 160 行几乎相同的模板
       （干支卡/方法切换/结果区/反克/对比/确认弹窗/选择器），
       任何业务改动都要同步 7 份（曾因漏改导致 statusBarHeight 回归）。
       本组件把全部公共结构收拢到一处，主题组件退化为薄壳：
           主题组件 → <HomeLayout> + 可选 <template #hero>
       业务改动点从 7 处收敛为 1 处（本组件）。
    2. 根 class 自动推导（主题组件无需传）：
       - classic → theme-<activeTheme>（如 theme-yellow）
       - 其它   → ui-<activeUiStyle>（如 ui-ink）
       - ink    额外补 ink-bg-<inkBackgroundPeriod>（时段背景）
       推导逻辑基于 store，与壳层 v-if 分发使用同一数据源，杜绝错配。
    3. hero 插槽：仅 animal/pixel 两个主题有页面顶部装饰区，
       插槽渲染在 scroll-view 内顶部（与滚动内容一起滚动）；
       其视觉样式由全局 ui-animal.scss / ui-pixel.scss 的 .ui-* 命名空间提供。
    4. 业务状态：通过 useHome() 获取壳层注入（provide('home') 见 index.vue），
       与 useHomePage.js 返回结构契约一致（见该文件 JSDoc）。
    5. 样式：本组件 scoped 引入 home-base.scss 作为全部主题共用的经典基线；
       主题差异由全局 themes.scss / ui-*.scss 命名空间覆盖实现。
    ============================================================
  -->
  <view class="page" :class="rootClasses">
    <!-- 导航栏 -->
    <AppNavbar title="子午流注取穴" class="home-navbar" />
    <view :style="{ height: home.navHeight + 'px' }" class="nav-placeholder"></view>

    <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
      <!-- 主题专属顶部装饰区（仅 animal / pixel 提供该插槽） -->
      <slot name="hero"></slot>

      <!-- 干支信息卡片：显示年/月/日/时干支标签 -->
      <view class="ganzhi-card">
        <view class="ganzhi-header">
          <text class="ganzhi-title">{{ home.store.isManualMode ? '查询时间' : '当前时间' }}</text>
          <view class="ganzhi-toggle">
            <view
              class="toggle-btn"
              :class="{ active: !home.store.isManualMode }"
              @tap="home.switchToAuto"
            >
              <text class="toggle-icon">🔄</text>
              <text class="toggle-text">自动</text>
            </view>
            <view
              class="toggle-btn"
              :class="{ active: home.store.isManualMode }"
              @tap="home.switchToManual"
            >
              <text class="toggle-icon">📅</text>
              <text class="toggle-text">手动</text>
            </view>
          </view>
        </view>

        <!-- 手动模式选择器 -->
        <view v-if="home.store.isManualMode" class="manual-controls">
          <view class="control-row">
            <text class="control-label">📅 选择日期</text>
            <!-- 三端统一使用自定义 DatePicker 日历面板 -->
            <view class="picker-btn" @tap="home.showDatePicker = true">
              <text>{{ home.selectedDateStr }}</text>
            </view>
          </view>
          <view class="control-row">
            <text class="control-label">🕐 选择时辰</text>
            <!-- 三端统一使用自定义 TimePicker 时辰列表 -->
            <view class="picker-btn" @tap="home.showTimePicker = true">
              <text>{{ home.hourLabels[home.selectedHourIdx] }}</text>
            </view>
          </view>
          <view class="query-btn" @tap="home.handleQuery">
            <text class="query-btn-text">🔍 查询</text>
          </view>
        </view>

        <!-- 当前日期时间（数字） -->
        <view class="current-datetime">
          <text class="datetime-text">{{ home.store.isManualMode ? '查询' : '当前' }}：</text>
          <text class="datetime-value">{{ home.currentDateTimeStr }}</text>
        </view>

        <!-- 干支显示：乙巳年 辛巳月 癸亥日 丁巳时 -->
        <view v-if="home.store.currentGanZhi && home.store.showGanZhi" class="ganzhi-display">
          <view class="ganzhi-tag-item">
            <text class="ganzhi-tag-text">{{ home.store.currentGanZhi.year.ganZhi }}年</text>
          </view>
          <view class="ganzhi-tag-item">
            <text class="ganzhi-tag-text">{{ home.store.currentGanZhi.month.ganZhi }}月</text>
          </view>
          <view class="ganzhi-tag-item highlight">
            <text class="ganzhi-tag-text">{{ home.store.currentGanZhi.day.ganZhi }}日</text>
          </view>
          <view class="ganzhi-tag-item highlight">
            <text class="ganzhi-tag-text">{{ home.store.currentGanZhi.hour.ganZhi }}时</text>
          </view>
        </view>
      </view>

      <!-- 方法切换 -->
      <view class="method-tabs">
        <view
          v-for="method in home.methods"
          :key="method.id"
          class="method-tab"
          :class="{ active: home.store.activeMethod === method.id }"
          @tap="home.store.setActiveMethod(method.id)"
        >
          <text class="method-icon">{{ method.icon }}</text>
          <text class="method-name">{{ method.name }}</text>
          <view v-if="home.store.activeMethod === method.id" class="method-indicator"></view>
        </view>
      </view>

      <!-- 主结果面板 -->
      <view class="result-wrapper" :key="home.store.activeMethod">
        <ResultPanel :method="home.store.activeMethod" />
      </view>

      <!-- 反克法开关开启后，纳甲法闭穴且确有结果时才显示独立补充区。 -->
      <view v-if="home.showFankeSupplement" class="fanke-supplement">
        <view class="fanke-header">
          <text class="fanke-icon">⇄</text>
          <text class="fanke-title">反克法补充</text>
          <text class="fanke-desc">（纳甲法闭穴时的替代方案）</text>
        </view>
        <ResultPanel method="fanke" />
      </view>

      <!-- 其他方法对比 -->
      <view class="compare-section">
        <view class="compare-divider">
          <view class="divider-line"></view>
          <text class="divider-text">其它方法对比</text>
          <view class="divider-line"></view>
        </view>
        <view class="compare-grid">
          <ResultPanel
            v-for="method in home.otherMethods"
            :key="method"
            :method="method"
            :compact="true"
          />
        </view>
      </view>

      <view :style="{ height: home.safeBottom + 60 + 'px' }"></view>
    </scroll-view>

    <!-- 穴位详情弹窗 -->
    <PointDetail v-if="home.store.showDetail" />

    <!-- 手动查询确认弹窗 -->
    <view v-if="home.showQueryConfirm" class="confirm-overlay" @tap="home.showQueryConfirm = false">
      <view class="confirm-popup" @tap.stop>
        <text class="confirm-title">确认查询</text>
        <view class="confirm-info">
          <text class="confirm-label">日期</text>
          <text class="confirm-value">{{ home.selectedDateStr }}</text>
        </view>
        <view class="confirm-info">
          <text class="confirm-label">时辰</text>
          <text class="confirm-value">{{ home.hourLabels[home.selectedHourIdx] }}</text>
        </view>
        <view class="confirm-btns">
          <view class="confirm-cancel" @tap="home.showQueryConfirm = false">
            <text>取消</text>
          </view>
          <view class="confirm-ok" @tap="home.confirmQuery">
            <text>确认查询</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 日历面板 -->
    <DatePicker
      v-if="home.showDatePicker"
      :value="home.selectedDateStr"
      @change="home.onDatePickerChange"
      @close="home.showDatePicker = false"
    />
    <!-- 时辰面板 -->
    <TimePicker
      v-if="home.showTimePicker"
      :value="home.selectedHourIdx"
      @change="home.onTimePickerChange"
      @close="home.showTimePicker = false"
    />
  </view>
</template>

<script setup>
import { useHome } from '@/composables/useHomePage.js'
import { useRootClasses } from '@/composables/useRootClasses.js'
import AppNavbar from '@/components/AppNavbar.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import PointDetail from '@/components/PointDetail.vue'
import DatePicker from '@/components/DatePicker.vue'
import TimePicker from '@/components/TimePicker.vue'

// 壳层注入的共享业务状态与方法（契约见 useHomePage.js）
const home = useHome()

// 主题根 class 自动推导（classic → theme-*，其它 → ui-*，ink 补 ink-bg-*），
// 规则唯一来源见 useRootClasses.js
const rootClasses = useRootClasses()
</script>

<style lang="scss" scoped>
@use '@/views/_shared/home-base.scss' as *;

/* === 经典主题专属样式 === */
/* 暗夜幽光主题：微信小程序弹窗背景半透明（随模板收敛从 HomeClassic 移入公共基线，
   仅当根元素带 theme-black 类时生效，其它主题不受影响） */
.theme-black .confirm-popup {
  /* #ifdef MP-WEIXIN */
  background: rgba(0, 0, 0, 0.5);
  /* #endif */
}
</style>
