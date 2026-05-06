<template>
  <view class="result-panel" :class="{ compact }">
    <!-- 面板头部 -->
    <view class="panel-header">
      <view class="header-left">
        <text class="header-icon">{{ methodIcon }}</text>
        <text class="header-title">{{ methodName }}</text>
      </view>
    </view>

    <!-- 面板内容 -->
    <view class="panel-body">
      <!-- 日期时辰信息（干支时间） -->
      <view class="result-ganzhi-row">
        <text v-if="result?.date" class="result-ganzhi-date">{{ result.date }}</text>
        <view v-if="result?.hourGanZhi" class="result-ganzhi-hour-wrap">
          <text class="result-ganzhi-hour-label">时辰：</text>
          <view class="result-ganzhi-hour-tag">
            <text class="result-ganzhi-hour-text">{{ result.hourGanZhi }}时</text>
          </view>
        </view>
      </view>

      <!-- 闭穴提示 -->
      <view v-if="result?.isClosed" class="warning-box">
        <text class="warning-icon">⚠️</text>
        <text class="warning-text">当前时辰为闭穴</text>
      </view>

      <!-- 合日互用穴位（闭穴时） -->
      <view v-if="result?.isClosed && result?.alternativePoints?.openPoints?.length" class="section">
        <view class="section-title">
          <view class="dot secondary"></view>
          <text>合日互用开穴（{{ result.alternativePoints.heLabel }}）</text>
        </view>
        <view class="points-grid">
          <view
            v-for="point in result.alternativePoints.openPoints"
            :key="point.id"
            class="point-btn"
            :class="{ open: point.isOpen }"
            @tap="handlePointClick(point)"
          >
            <text class="point-name">{{ point.name }}</text>
            <text class="point-code">{{ point.code }}</text>
            <view v-if="point.wuxing" class="wuxing-tag" :style="getWuxingStyle(point.wuxing)">
              <text class="wuxing-text" :style="{ color: getWuxingColor(point.wuxing) }">{{ point.wuxing }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 值日/值时经络 -->
      <view v-if="result?.dayMeridian || result?.hourMeridian" class="meridian-row">
        <view v-if="result.dayMeridian" class="tag-primary">
          <text>值日：{{ result.dayMeridian.name }}</text>
        </view>
        <view v-if="result.hourMeridian" class="tag-primary">
          <text>值时：{{ result.hourMeridian.name }}</text>
        </view>
        <!-- 纳子法模式切换胶囊 -->
        <view v-if="isNazi" class="nazi-mode-switch">
          <view class="switch-option" :class="{ active: store.naziMode === 'daily' }" @tap="store.setNaziMode('daily')">
            <text>六十六穴</text>
          </view>
          <view class="switch-option" :class="{ active: store.naziMode === 'bumu' }" @tap="store.setNaziMode('bumu')">
            <text>补母泻子</text>
          </view>
        </view>
      </view>

      <!-- 补母泻子法开穴列表（纳子法 bumu 模式） -->
      <view v-if="isNazi && store.naziMode === 'bumu' && bumuPoints.length" class="section">
        <view class="section-title">
          <view class="dot primary"></view>
          <text>当前开穴</text>
        </view>
        <view class="points-grid" :style="gridStyle">
          <view
            v-for="bp in bumuPoints"
            :key="bp.point.id"
            class="point-btn"
            :class="{ open: bp.point.isOpen }"
            :style="getPointStyle(bp.point)"
            @tap="handlePointClick(bp.point)"
          >
            <text class="point-name">{{ bp.point.name }}</text>
            <text class="point-code">{{ bp.point.code }}</text>
            <view v-if="bp.point.wuxing" class="wuxing-tag" :style="getWuxingStyle(bp.point.wuxing)">
              <text class="wuxing-text" :style="{ color: getWuxingColor(bp.point.wuxing) }">{{ bp.point.wuxing }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 开穴列表（非补母泻子模式时显示） -->
      <view v-if="result?.openPoints?.length && !(isNazi && store.naziMode === 'bumu')" class="section">
        <view class="section-title">
          <view class="dot primary"></view>
          <text>当前开穴</text>
        </view>
        <view class="points-grid" :style="gridStyle">
          <view
            v-for="point in displayPoints"
            :key="point.id"
            class="point-btn"
            :class="{ open: point.isOpen }"
            :style="getPointStyle(point)"
            @tap="handlePointClick(point)"
          >
            <text class="point-name">{{ point.name }}</text>
            <text class="point-code">{{ point.code }}</text>
            <view v-if="point.wuxing" class="wuxing-tag" :style="getWuxingStyle(point.wuxing)">
              <text class="wuxing-text" :style="{ color: getWuxingColor(point.wuxing) }">{{ point.wuxing }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 补母泻子法底部提示 -->
      <view v-if="isNazi && store.naziMode === 'bumu'" class="bumu-tip">
        <text class="bumu-tip-icon">ⓘ</text>
        <text class="bumu-tip-text">当其时泻其子，过其时补其母</text>
      </view>

      <!-- 九宫信息（灵龟八法） -->
      <view v-if="result?.palace" class="palace-box">
        <text class="palace-icon">☯</text>
        <text class="palace-text">
          九宫数：{{ result.palace.palaceNumber }}
          <text v-if="result.palace.palaceNumber === 5" class="palace-note">
            （中宫，归{{ result.palace.actualPalace }}宫{{ result.palace.gua }}卦 · {{ result.palace.direction }}）
          </text>
          <text v-else class="palace-note">
            （{{ result.palace.gua }}卦 · {{ result.palace.direction }}）
          </text>
        </text>
      </view>

      <!-- 补泻建议 -->
      <view v-if="result?.suggestion" class="suggestion-box">
        <text class="suggestion-icon">💡</text>
        <view class="suggestion-content">
          <text class="suggestion-title">补泻手法</text>
          <view class="suggestion-principle">
            <text class="principle-text">虚则补其母，实则泻其子</text>
            <text class="principle-text">不盛不虚，以经取之</text>
          </view>
        </view>
      </view>

      <!-- 无结果 -->
      <view v-if="!result" class="empty-state">
        <text class="empty-icon">⚠️</text>
        <text class="empty-text">暂无开穴信息</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * ResultPanel - 取穴结果面板组件
 *
 * 功能：根据取穴方法显示计算结果，包括干支时间、开穴列表、补泻手法等
 *
 * Props：
 *   - method (String, 必填): 取穴方法标识，可选值：
 *     'najia'（纳甲法）、'nazi'（纳子法）、'lingui'（灵龟八法）、
 *     'feiteng'（飞腾八法）、'fanke'（反克法）
 *   - compact (Boolean, 默认false): 紧凑模式，去掉外边距和阴影，用于对比展示
 *
 * 调用方式：
 *   <ResultPanel :method="store.activeMethod" />      <!-- 主面板 -->
 *   <ResultPanel method="fanke" />                      <!-- 反克法面板 -->
 *   <ResultPanel :method="m" :compact="true" />         <!-- 对比用紧凑面板 -->
 *
 * 数据来源：从 Pinia store.results[method] 获取计算结果
 * 穴位点击：调用 store.selectPoint(point) 打开穴位详情弹窗
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { getWuxingStyle, getWuxingColor } from '@/utils/wuxing.js'
import { METHOD_NAMES } from '@/data/constants.js'

// Props 定义
const props = defineProps({
  method: { type: String, required: true },   // 取穴方法标识
  compact: { type: Boolean, default: false }  // 是否紧凑模式
})

const store = useAppStore()

// 从 store 中获取当前方法的计算结果（响应式）
const result = computed(() => store.results?.[props.method] || null)

// 是否纳子法
const isNazi = computed(() => props.method === 'nazi')

// 补母泻子法4个穴位的渲染数据（与六十六穴统一用 points-grid 展示）
const bumuPoints = computed(() => {
  const r = result.value
  if (!r) return []
  const items = []
  if (r.benPoint) items.push({ point: r.benPoint })
  if (r.yuanPoint) items.push({ point: r.yuanPoint })
  if (r.muPoint) items.push({ point: r.muPoint })
  if (r.ziPoint) items.push({ point: r.ziPoint })
  return items
})

// 穴位显示列表：纳子法按名字字数排序（两字在前、三字在后），其他方法不变
const displayPoints = computed(() => {
  if (!result.value?.openPoints) return []
  const points = result.value.openPoints
  if (props.method !== 'nazi') return points
  return [...points].sort((a, b) => (a.name?.length || 0) - (b.name?.length || 0))
})

// 网格容器样式：纳子法缩小间距
const gridStyle = computed(() => {
  if (props.method !== 'nazi') return null
  return { gap: '10rpx' }
})

// 方法中文名映射
const methodName = computed(() => METHOD_NAMES[props.method] || props.method)

// 方法图标映射
const methodIcon = computed(() => {
  const icons = { najia: '☰', nazi: '☷', lingui: '☯', feiteng: '⚡', fanke: '⇄' }
  return icons[props.method] || '•'
})

/**
 * 穴位按钮样式：纳子法缩小 padding 让一行放三个
 */
function getPointStyle(point) {
  if (props.method !== 'nazi') return null
  const isLong = point.name && point.name.length > 2
  return {
    padding: isLong ? '14rpx 20rpx' : '14rpx 16rpx',
    gap: '6rpx'
  }
}

/**
 * 穴位点击处理：打开穴位详情弹窗
 * @param {Object} point - 穴位对象 { id, name, code, wuxing, isOpen, ... }
 */
function handlePointClick(point) {
  store.selectPoint(point)
}
</script>

<style lang="scss" scoped>
.result-panel {
  margin: 0 $spacing-md $spacing-md;
  background: $tcm-bg-light;
  border-radius: 28rpx;
  box-shadow: 0 8rpx 32rpx rgba(139, 69, 19, 0.08);
  overflow: hidden;

  &.compact {
    margin: 0;
    box-shadow: 0 4rpx 16rpx rgba(139, 69, 19, 0.06);
  }
}

.panel-header {
  padding: 28rpx 36rpx;
  background: linear-gradient(135deg, #8B4513 0%, #6B3410 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.header-icon {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.8);
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  font-family: 'KaitiGB2312', 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
}

.panel-body {
  padding: 32rpx;
}

/* === 结果干支行 === */
.result-ganzhi-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
  margin-bottom: $spacing-md;
}

.result-ganzhi-date {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
  font-family: 'SimSun', '宋体', 'Noto Serif SC', serif;
}

.result-ganzhi-hour-wrap {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.result-ganzhi-hour-label {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
}

.result-ganzhi-hour-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: rgba($tcm-primary, 0.12);
}

.result-ganzhi-hour-text {
  font-size: $font-size-sm;
  font-weight: 700;
  color: $tcm-primary;
  font-family: 'SimSun', '宋体', 'Noto Serif SC', serif;
}

/* === 警告框 === */
.warning-box {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: rgba($tcm-red, 0.04);
  border: 1rpx solid rgba($tcm-red, 0.15);
  border-radius: 18rpx;
}

.warning-icon {
  font-size: $font-size-base;
}

.warning-text {
  font-size: 28rpx;
  font-weight: 500;
  color: $tcm-red;
}

/* === 区块 === */
.section {
  margin-bottom: $spacing-md;
}

.section-title {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
  font-size: $font-size-sm;
  font-weight: 500;
  color: rgba($tcm-text, 0.8);
}

.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;

  &.primary { background: $tcm-secondary; }
  &.secondary { background: $tcm-secondary; }
}

/* === 穴位网格 === */
.points-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.point-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
  background: rgba($tcm-primary, 0.06);
  transition: all 0.25s ease;

  &.open {
    background: rgba($tcm-primary, 0.1);
  }

  &:active {
    transform: scale(0.96);
    opacity: 0.85;
  }
}

.point-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $tcm-primary;
  font-family: 'SimSun', '宋体', 'Noto Serif SC', serif;
}

.point-code {
  font-size: 24rpx;
  color: $tcm-text-hint;
}

.wuxing-tag {
  padding: 2rpx 10rpx;
  border-radius: $radius-sm;
}

.wuxing-text {
  font-size: $font-size-xs;
  font-weight: 500;
}

/* === 经络行 === */
.meridian-row {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.tag-primary {
  display: inline-flex;
  padding: 6rpx 16rpx;
  background: rgba($tcm-primary, 0.08);
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: $tcm-primary;
}

/* === 九宫信息 === */
.palace-box {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: rgba($tcm-secondary, 0.06);
  border-radius: $radius-md;
}

.palace-icon {
  font-size: $font-size-lg;
  color: $tcm-secondary;
}

.palace-text {
  font-size: $font-size-sm;
  color: rgba($tcm-text, 0.8);
  line-height: 1.6;
}

.palace-note {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
}

/* === 补泻建议 === */
.suggestion-box {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: rgba($tcm-jade, 0.05);
  border: 1rpx solid rgba($tcm-jade, 0.15);
  border-radius: 20rpx;
}

.suggestion-icon {
  font-size: $font-size-lg;
  color: $tcm-jade;
  margin-top: 4rpx;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $tcm-jade;
  margin-bottom: 12rpx;
}

.suggestion-principle {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.principle-text {
  font-size: $font-size-xs;
  color: rgba($tcm-text, 0.65);
  line-height: 1.8;
}

/* === 空状态 === */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xl 0;
}

.empty-icon {
  font-size: 64rpx;
}

.empty-text {
  font-size: $font-size-sm;
  color: $tcm-text-hint;
}

/* === 纳子法模式切换 === */
.nazi-mode-switch {
  display: flex;
  border: 1rpx solid rgba($tcm-primary, 0.15);
  border-radius: 12rpx;
  overflow: hidden;
  margin-left: auto;
}

.switch-option {
  padding: 4rpx 14rpx;
  font-size: 22rpx;
  color: $tcm-text-secondary;
  background: rgba($tcm-primary, 0.04);

  &.active {
    color: #fff;
    background: $tcm-primary;
  }
}

/* === 补母泻子法底部提示 === */
.bumu-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  background: rgba($tcm-text, 0.04);
  border-radius: 14rpx;
  margin-top: $spacing-md;
}

.bumu-tip-icon {
  font-size: 24rpx;
  color: $tcm-text-hint;
}

.bumu-tip-text {
  font-size: 24rpx;
  color: $tcm-text-hint;
}
</style>
