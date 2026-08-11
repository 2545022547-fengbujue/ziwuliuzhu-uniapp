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
      <view v-if="showClosedWarning" class="warning-box">
        <text class="warning-icon">ⓘ</text>
        <text class="warning-text">当前时辰为闭穴</text>
      </view>

      <!-- 反克法合并显示（仅在纳甲法闭穴且合并模式下） -->
      <template v-if="isNajia && result?.isClosed && store.fankeDisplayMode === 'merged'">
        <view v-if="fankeHasOpenPoints" class="section fanke-merged">
          <view class="section-title">
            <view class="dot fanke"></view>
            <text>反克法开穴（纳甲法闭穴时的特殊方案）</text>
          </view>
          <view class="points-grid">
            <view
              v-for="point in fankeResult.openPoints"
              :key="'fanke-' + point.code"
              class="point-btn"
              :class="{ 'point-btn-code-hidden': !store.showPointCode }"
              @tap="handlePointClick(point)"
            >
              <text class="point-name">{{ point.name }}</text>
              <text v-if="store.showPointCode" class="point-code">{{ point.code }}</text>
              <view v-if="point.wuxing" class="wuxing-tag" :style="getWuxingStyle(point.wuxing)">
                <text class="wuxing-text" :style="{ color: getWuxingColor(point.wuxing) }">{{ point.wuxing }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>

      <!-- 合日互用穴位：只有设置开关开启、纳甲法本身闭穴且合日计算有结果时才渲染。 -->
      <view v-if="result?.isClosed && result?.alternativePoints?.openPoints?.length" class="section">
        <view class="section-title">
          <view class="dot secondary"></view>
          <text>合日互用开穴（{{ result.alternativePoints.heLabel }}）</text>
        </view>
        <view class="points-grid">
          <view
            v-for="point in result.alternativePoints.openPoints"
            :key="'alt-' + point.code"
            class="point-btn"
            :class="{ 'point-btn-code-hidden': !store.showPointCode }"
            @tap="handlePointClick(point)"
          >
            <text class="point-name">{{ point.name }}</text>
            <text v-if="store.showPointCode" class="point-code">{{ point.code }}</text>
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
        <view class="points-grid">
          <view
            v-for="bp in bumuPoints"
            :key="'bumu-' + bp.point.code"
            class="point-btn"
            :class="{ 'point-btn-code-hidden': !store.showPointCode }"
            @tap="handlePointClick(bp.point)"
          >
            <text class="point-name">{{ bp.point.name }}</text>
            <text v-if="store.showPointCode" class="point-code">{{ bp.point.code }}</text>
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
        <view class="points-grid">
          <view
            v-for="point in displayPoints"
            :key="'open-' + point.code"
            class="point-btn"
            :class="{ 'point-btn-code-hidden': !store.showPointCode }"
            @tap="handlePointClick(point)"
          >
            <text class="point-name">{{ point.name }}</text>
            <text v-if="store.showPointCode" class="point-code">{{ point.code }}</text>
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

// 是否纳甲法
const isNajia = computed(() => props.method === 'najia')

// 反克法结果（纳甲法合并模式使用）
const fankeResult = computed(() => store.results?.fanke || null)

const fankeHasOpenPoints = computed(() => {
  return Boolean(fankeResult.value?.openPoints?.length)
})

const alternativeHasOpenPoints = computed(() => {
  // alternativePoints 在开关关闭时固定为 null；这里不直接读取开关，
  // 让结果对象成为唯一渲染依据，避免 Store 状态和旧计算结果短暂不同步。
  return Boolean(result.value?.alternativePoints?.openPoints?.length)
})

const showClosedWarning = computed(() => {
  if (!result.value?.isClosed) return false
  if (isNajia.value) {
    // 单独显示反克法时，只看纳甲法本身和合日互用，不看反克法
    if (store.fankeDisplayMode === 'separate') {
      return !alternativeHasOpenPoints.value
    }
    // 合并模式时，看反克法+合日互用
    return !(fankeHasOpenPoints.value || alternativeHasOpenPoints.value)
  }
  return true
})

// 补母泻子法穴位渲染数据（按穴位code去重，避免本穴原穴相同时重复显示）
// 按名字字数排序：两字在前、三字在后
const bumuPoints = computed(() => {
  const r = result.value
  if (!r) return []

  // 按穴位code去重，只保留第一个出现的
  const seen = new Set()
  const items = []
  const pointOrder = [r.benPoint, r.yuanPoint, r.muPoint, r.ziPoint]
  for (const point of pointOrder) {
    if (!point) continue
    if (seen.has(point.code)) continue
    seen.add(point.code)
    items.push({ point })
  }

  return items.sort((a, b) => (a.point?.name?.length || 0) - (b.point?.name?.length || 0))
})

// 穴位显示列表：纳子法按名字字数排序（两字在前、三字在后），其他方法不变
const displayPoints = computed(() => {
  if (!result.value?.openPoints) return []
  const points = result.value.openPoints
  if (props.method !== 'nazi') return points
  return [...points].sort((a, b) => (a.name?.length || 0) - (b.name?.length || 0))
})

// 方法中文名映射
const methodName = computed(() => METHOD_NAMES[props.method] || props.method)

// 方法图标映射
const methodIcon = computed(() => {
  const icons = { najia: '☰', nazi: '☷', lingui: '☯', feiteng: '⚡', fanke: '⇄' }
  return icons[props.method] || '•'
})

/**
 * 穴位点击处理：打开穴位详情弹窗
 * @param {Object} point - 穴位对象 { id, name, code, wuxing, ... }
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
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
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
  font-family: 'KaitiGB2312', 'WenYuanSerifSC', 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
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
  background: var(--theme-surface-muted);
}

.result-ganzhi-hour-text {
  font-size: $font-size-sm;
  font-weight: 700;
  color: var(--theme-primary);
  font-family: 'SimSun', '宋体', 'Noto Serif SC', serif;
}

/* === 警告框（闭穴提示）=== */
.warning-box {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: var(--theme-surface-muted);
  border: 1rpx solid var(--theme-border);
  border-radius: 18rpx;
}

.warning-icon {
  font-size: $font-size-base;
}

.warning-text {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--theme-text-secondary);
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
  &.fanke { background: $tcm-red; }
}

// 反克法合并显示区域
.fanke-merged {
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: var(--theme-surface-muted);
  border: 1rpx solid var(--theme-border);
  border-radius: $radius-md;
}

/* === 穴位网格 ===
 * 主面板和纵向对比面板统一使用三列，不再让 flex 根据文字宽度自行换行。
 * minmax(0, 1fr) 很重要：允许包含三字穴位名、编码和五行标签的网格项真正收缩，
 * 避免某个按钮的内容宽度把整列撑开，重新形成“2 + 2 + 1”的不规则排列。
 */
.points-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  align-items: stretch;
}

.point-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  width: 100%;
  min-width: 0;
  min-height: 84rpx;
  padding: 12rpx 10rpx;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 20rpx;
  background: var(--theme-surface-muted);
  transition: all 0.25s ease;

  &:active {
    transform: scale(0.96);
    opacity: 0.85;
  }
}

.point-name {
  flex-shrink: 0;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--theme-primary);
  font-family: 'SimSun', '宋体', 'Noto Serif SC', serif;
  line-height: 1.2;
  white-space: nowrap;
}

.point-code {
  min-width: 0;
  font-size: 18rpx;
  color: $tcm-text-hint;
  line-height: 1.2;
  white-space: nowrap;
}

.wuxing-tag {
  flex-shrink: 0;
  padding: 2rpx 7rpx;
  border-radius: $radius-sm;
}

.wuxing-text {
  font-size: 20rpx;
  font-weight: 500;
  font-family: 'WenYuanSerifSC-Bold', 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;
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
  background: var(--theme-surface-muted);
  border-radius: $radius-sm;
  border: 1rpx solid transparent;
  font-size: $font-size-xs;
  color: var(--theme-primary);
}

/* === 九宫信息 === */
.palace-box {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: var(--theme-surface-muted);
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
  border: 1rpx solid var(--theme-border);
  border-radius: 12rpx;
  overflow: hidden;
  margin-left: auto;
}

.switch-option {
  padding: 4rpx 14rpx;
  font-size: 22rpx;
  color: $tcm-text-secondary;
  background: var(--theme-surface-muted);

  &.active {
    color: #fff;
    background: var(--theme-primary);
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
