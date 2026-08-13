<template>
  <!--
    莫兰迪主题首页
    说明：本组件只负责莫兰迪主题的完整页面（模板 + 样式），
    业务逻辑统一由 useHomePage() 提供并通过 inject('home') 注入。
    视觉差异由全局 ui-morandi.scss 的 .ui-morandi 命名空间覆盖实现。
  -->
  <view class="page ui-morandi">
        <AppNavbar title="子午流注取穴" class="home-navbar" />
        <view :style="{ height: home.navHeight + 'px' }" class="nav-placeholder"></view>
    
        <scroll-view scroll-y class="page-scroll" :show-scrollbar="false">
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
import { inject } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import PointDetail from '@/components/PointDetail.vue'
import DatePicker from '@/components/DatePicker.vue'
import TimePicker from '@/components/TimePicker.vue'

const home = inject('home')
</script>

<style lang="scss" scoped>
@use '@/views/_shared/home-base.scss' as *;
</style>