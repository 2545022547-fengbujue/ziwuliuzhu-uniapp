<template>
  <!--
    首页（取穴主界面）
    
    布局说明：
    - 顶部：导航栏 + 状态栏占位
    - 中间：可滚动区域（干支卡片、方法切换、结果面板）
    - 底部：弹窗（PointDetail）
  -->
  <view class="page">
    <!-- 导航栏 -->
    <AppNavbar title="子午流注取穴" />
    <view :style="{ height: navHeight + 'px' }"></view>

    <scroll-view scroll-y class="page-scroll" :style="{ height: scrollHeight + 'px' }">
      <!-- 干支信息卡片：显示年/月/日/时干支标签 -->
      <view class="ganzhi-card">
        <view class="ganzhi-header">
          <text class="ganzhi-title">{{ store.isManualMode ? '查询时间' : '当前时间' }}</text>
          <view class="ganzhi-toggle">
            <view
              class="toggle-btn"
              :class="{ active: !store.isManualMode }"
              @tap="switchToAuto"
            >
              <text class="toggle-icon">🔄</text>
              <text class="toggle-text">自动</text>
            </view>
            <view
              class="toggle-btn"
              :class="{ active: store.isManualMode }"
              @tap="switchToManual"
            >
              <text class="toggle-icon">📅</text>
              <text class="toggle-text">手动</text>
            </view>
          </view>
        </view>

        <!-- 手动模式选择器 -->
        <view v-if="store.isManualMode" class="manual-controls">
          <view class="control-row">
            <text class="control-label">📅 选择日期</text>
            <picker mode="date" :value="selectedDateStr" @change="onDateChange">
              <view class="picker-btn">
                <text>{{ selectedDateStr }}</text>
              </view>
            </picker>
          </view>
          <view class="control-row">
            <text class="control-label">🕐 选择时辰</text>
            <picker :range="hourLabels" :value="selectedHourIdx" @change="onHourChange">
              <view class="picker-btn">
                <text>{{ hourLabels[selectedHourIdx] }}</text>
              </view>
            </picker>
          </view>
          <view class="query-btn" @tap="handleQuery">
            <text class="query-btn-text">🔍 查询</text>
          </view>
        </view>

        <!-- 当前日期时间（数字） -->
        <view class="current-datetime">
          <text class="datetime-text">{{ store.isManualMode ? '查询' : '当前' }}：</text>
          <text class="datetime-value">{{ currentDateTimeStr }}</text>
        </view>

        <!-- 干支显示：乙巳年 辛巳月 癸亥日 丁巳时 -->
        <view v-if="currentGanZhi" class="ganzhi-display">
          <view class="ganzhi-tag-item">
            <text class="ganzhi-tag-text">{{ currentGanZhi.year.ganZhi }}年</text>
          </view>
          <view class="ganzhi-tag-item">
            <text class="ganzhi-tag-text">{{ currentGanZhi.month.ganZhi }}月</text>
          </view>
          <view class="ganzhi-tag-item highlight">
            <text class="ganzhi-tag-text">{{ currentGanZhi.day.ganZhi }}日</text>
          </view>
          <view class="ganzhi-tag-item highlight">
            <text class="ganzhi-tag-text">{{ currentGanZhi.hour.ganZhi }}时</text>
          </view>
        </view>
      </view>

      <!-- 方法切换 -->
      <view class="method-tabs">
        <view
          v-for="method in methods"
          :key="method.id"
          class="method-tab"
          :class="{ active: store.activeMethod === method.id }"
          @tap="store.setActiveMethod(method.id)"
        >
          <text class="method-icon">{{ method.icon }}</text>
          <text class="method-name">{{ method.name }}</text>
          <view v-if="store.activeMethod === method.id" class="method-indicator"></view>
        </view>
      </view>

      <!-- 主结果面板 -->
      <view class="result-wrapper" :key="store.activeMethod">
        <ResultPanel :method="store.activeMethod" />
      </view>

      <!-- 纳甲法闭穴时显示反克法补充 -->
      <view v-if="showFankeSupplement" class="fanke-supplement">
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
            v-for="method in otherMethods"
            :key="method"
            :method="method"
            :compact="true"
          />
        </view>
      </view>

      <view :style="{ height: safeBottom + 60 + 'px' }"></view>
    </scroll-view>

    <!-- 穴位详情弹窗 -->
    <PointDetail v-if="store.showDetail" />

  </view>
</template>

<script setup>
/**
 * 首页（取穴主界面）- index.vue
 *
 * 功能：
 *   1. 显示当前干支时间（年/月/日/时）
 *   2. 自动模式：每60秒自动更新时间并重新计算
 *   3. 手动模式：用户选择日期和时辰查询
 *   4. 取穴方法切换（纳甲法、纳子法、灵龟八法、飞腾八法）
 *   6. 反克法补充（纳甲法闭穴时自动显示）
 *   7. 其他方法对比（底部显示其他3种方法的结果）
 *
 * 核心逻辑：
 *   - currentGanZhi：独立计算干支（照搬电脑端 TimePicker 的逻辑）
 *   - 五鼠遁（日上起时法）：根据日天干推算时辰天干
 *   - 每60秒轮询更新（仅自动模式下）
 *
 * 组件引用：
 *   - AppNavbar：自定义导航栏
 *   - ResultPanel：取穴结果面板（核心展示组件）
 *   - PointDetail：穴位详情弹窗（通过 store 控制显示）
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import { formatDate, getHourIndexFromDate, HOUR_OPTIONS } from '@/utils/date.js'
import { getGanZhi, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/services/ganzhi.js'
import AppNavbar from '@/components/AppNavbar.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import PointDetail from '@/components/PointDetail.vue'


const store = useAppStore()
const { statusBarHeight, screenHeight, safeAreaBottom } = useSystemInfo()
// 导航栏高度 = 状态栏 + 44px
const navHeight = computed(() => statusBarHeight.value + 44)
// 可滚动区域高度 = 屏幕高度 - 导航栏 - 底部安全区 - tab栏
const scrollHeight = computed(() => screenHeight.value - navHeight.value - safeAreaBottom.value - 50)
const safeBottom = computed(() => safeAreaBottom.value)

// 四种主取穴方法（不含反克法，反克法是闭穴时的补充）
const methods = [
  { id: 'najia', name: '纳甲法', icon: '☰' },
  { id: 'nazi', name: '纳子法', icon: '☷' },
  { id: 'lingui', name: '灵龟八法', icon: '☯' },
  { id: 'feiteng', name: '飞腾八法', icon: '⚡' }
]

// 五鼠遁（日上起时法）— 根据日天干推算时辰天干的起始索引
// 甲己日起甲子时（索引0），乙庚日起丙子时（索引2），以此类推
const wuShuDun = {
  '甲': 0, '己': 0,
  '乙': 2, '庚': 2,
  '丙': 4, '辛': 4,
  '丁': 6, '壬': 6,
  '戊': 8, '癸': 8
}

// 独立计算干支（照搬电脑端 TimePicker 的 currentGanZhi 计算逻辑）
// 为什么不直接用 store 的结果？因为首页需要显示完整的干支信息（年/月/日/时）
// 而 store 的 results 只保存各方法的取穴结果
const currentGanZhi = computed(() => {
  let date, hourIndex
  if (store.isManualMode) {
    if (!selectedDateStr.value) return null
    date = new Date(selectedDateStr.value)
    hourIndex = selectedHourIdx.value
  } else {
    date = store.currentTime  // 使用 store 的响应式时间，每秒更新
    hourIndex = getHourIndexFromDate(date)
  }

  // 获取年/月/日干支（含真太阳时校正）
  const baseGanZhi = getGanZhi(date, store.longitude, store.useTrueSolarTime)
  // 用五鼠遁推算时辰天干
  const dayStem = baseGanZhi.day.heavenlyStem
  const hourBranchIndex = hourIndex
  const hourBranch = EARTHLY_BRANCHES[hourBranchIndex]
  const startStemIndex = wuShuDun[dayStem] || 0
  const hourStemIndex = (startStemIndex + hourBranchIndex) % 10
  const hourStem = HEAVENLY_STEMS[hourStemIndex]

  return {
    year: baseGanZhi.year,    // 年干支（如"乙巳"）
    month: baseGanZhi.month,  // 月干支（如"辛巳"）
    day: baseGanZhi.day,      // 日干支（如"癸亥"）
    hour: {
      heavenlyStem: hourStem,      // 时天干
      earthlyBranch: hourBranch,   // 时地支
      ganZhi: hourStem + hourBranch // 时干支（如"丁巳"）
    }
  }
})

// 当前日期时间格式化字符串（如"2026年04月30日 22:30"）
// 依赖 store.currentTime 的响应式更新，每秒刷新一次
const currentDateTimeStr = computed(() => {
  const d = store.isManualMode ? new Date(selectedDateStr.value) : store.currentTime
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}`
})

// 当前时辰索引（响应式，每秒更新）
const currentHourIndex = computed(() => {
  return getHourIndexFromDate(store.currentTime)
})

// === 手动模式状态 ===
const selectedDateStr = ref(formatDate(new Date()))  // 手动模式选择的日期（"YYYY-MM-DD" 格式）
const selectedHourIdx = ref(0)                         // 手动模式选择的时辰索引（0=子时, 1=丑时...）
const hourLabels = HOUR_OPTIONS.map(h => h.label)      // 时辰下拉选项标签（"子时 23:00-01:00"）

// 是否显示反克法补充（仅纳甲法闭穴时显示）
const showFankeSupplement = computed(() => {
  return store.activeMethod === 'najia' && store.results.najia?.isClosed
})

// 其他方法对比列表（排除当前选中的方法）
const otherMethods = computed(() => {
  return ['nazi', 'lingui', 'feiteng'].filter(m => m !== store.activeMethod)
})

// 自动更新定时器
let timer = null

/** 切换到自动模式 */
function switchToAuto() {
  store.switchToAutoMode()
}

/** 切换到手动模式，初始化为当前时间 */
function switchToManual() {
  store.isManualMode = true
  const now = new Date()
  selectedDateStr.value = formatDate(now)
  selectedHourIdx.value = getHourIndexFromDate(now)
}

/** 日期选择器变化回调 */
function onDateChange(e) {
  selectedDateStr.value = e.detail.value
}

/** 时辰选择器变化回调 */
function onHourChange(e) {
  selectedHourIdx.value = Number(e.detail.value)
}

/** 手动查询：用选择的日期和时辰计算取穴结果 */
function handleQuery() {
  const date = new Date(selectedDateStr.value)
  store.queryTime(date, selectedHourIdx.value)
}

// === 生命周期 ===
onMounted(() => {
  // 每秒更新当前时间（轻量操作，只更新时间戳，不重新计算取穴）
  // currentDateTimeStr 和 currentGanZhi 会自动响应式刷新
  timer = setInterval(() => {
    if (!store.isManualMode) {
      const now = new Date()
      const newHour = getHourIndexFromDate(now)
      store.currentTime = now
      // 仅在时辰变化时才重新计算取穴结果（避免每秒都做重计算）
      if (newHour !== store.currentHour) {
        store.currentHour = newHour
        store.updateCurrentTime()
      }
    }
  }, 1000)
})

onUnmounted(() => {
  // 组件销毁时清除定时器，防止内存泄漏
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $tcm-bg;
}

.page-scroll {
  width: 100%;
}

/* === 干支卡片 === */
.ganzhi-card {
  margin: $spacing-md;
  padding: $spacing-lg;
  background: $tcm-bg-light;
  border-radius: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(139, 69, 19, 0.08);
}

.ganzhi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.ganzhi-title {
  font-size: 26rpx;
  color: $tcm-text-secondary;
}

.ganzhi-toggle {
  display: flex;
  gap: 8rpx;
  background: $tcm-bg;
  border-radius: 20rpx;
  padding: 4rpx;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 12rpx 24rpx;
  border-radius: 16rpx;
  transition: all 0.25s ease;

  &.active {
    background: $tcm-primary;
    box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.25);
    .toggle-text { color: #fff; }
  }
}

.toggle-icon {
  font-size: $font-size-sm;
}

.toggle-text {
  font-size: 24rpx;
  color: $tcm-text-secondary;
}

/* === 手动模式控件 === */
.manual-controls {
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: rgba($tcm-primary, 0.03);
  border-radius: 20rpx;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.control-label {
  font-size: 28rpx;
  color: $tcm-text-secondary;
}

.picker-btn {
  padding: 12rpx 28rpx;
  background: #fff;
  border: 1rpx solid rgba($tcm-primary, 0.15);
  border-radius: 16rpx;
  font-size: $font-size-sm;
  color: $tcm-text;
  min-width: 240rpx;
  text-align: center;
}

.query-btn {
  margin-top: $spacing-sm;
  padding: $spacing-md;
  background: linear-gradient(135deg, $tcm-primary 0%, $tcm-primary-dark 100%);
  border-radius: 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(139, 69, 19, 0.2);
}

.query-btn-text {
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
}

/* === 当前日期时间 === */
.current-datetime {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-md 0;
  border-top: 1rpx solid rgba($tcm-primary, 0.08);
}

.datetime-text {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
}

.datetime-value {
  font-size: $font-size-xs;
  color: $tcm-text-secondary;
}

/* === 干支标签显示（乙巳年 辛巳月 癸亥日 丁巳时）=== */
.ganzhi-display {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: $spacing-md;
}

.ganzhi-tag-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  background: rgba($tcm-primary, 0.08);

  &.highlight {
    background: rgba($tcm-primary, 0.15);

    .ganzhi-tag-text {
      font-weight: 700;
    }
  }
}

.ganzhi-tag-text {
  font-size: $font-size-sm;
  color: $tcm-primary;
  font-weight: 600;
  font-family: 'KaiTi', 'STKaiti', serif;
}

/* === 方法切换 === */
.method-tabs {
  display: flex;
  margin: 0 $spacing-md $spacing-md;
  padding: 10rpx;
  background: $tcm-bg-light;
  border-radius: 28rpx;
  box-shadow: 0 6rpx 24rpx rgba(139, 69, 19, 0.06);
  gap: 8rpx;
}

.method-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: $spacing-md 0;
  border-radius: 20rpx;
  position: relative;
  transition: all 0.3s ease;

  &.active {
    background: $tcm-primary;
    box-shadow: 0 6rpx 20rpx rgba(139, 69, 19, 0.3);
    transform: scale(1.02);

    .method-name {
      color: #fff;
      font-weight: 600;
    }
    .method-icon {
      transform: scale(1.1);
    }
  }
}

.method-icon {
  font-size: $font-size-lg;
  transition: transform 0.3s ease;
}

.method-name {
  font-size: 24rpx;
  color: $tcm-text-secondary;
  transition: all 0.25s ease;
}

.method-indicator {
  position: absolute;
  bottom: 8rpx;
  width: 32rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: rgba(255, 255, 255, 0.6);
}

/* === 结果过渡动画 === */
.result-wrapper {
  animation: fadeSlideIn 0.35s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === 反克法补充 === */
.fanke-supplement {
  margin: $spacing-md;
  padding: 40rpx;
  background: rgba($tcm-secondary, 0.04);
  border: 2rpx dashed rgba($tcm-secondary, 0.3);
  border-radius: 28rpx;
  animation: fadeSlideIn 0.35s ease-out;

  // 深化内部 ResultPanel 的样式
  :deep(.result-panel) {
    margin: 0;
    border-radius: 24rpx;
    box-shadow: 0 6rpx 24rpx rgba(91, 140, 62, 0.1);
  }

  :deep(.panel-header) {
    padding: 24rpx 32rpx;
  }

  :deep(.header-icon) {
    font-size: 34rpx;
  }

  :deep(.header-title) {
    font-size: 30rpx;
  }

  :deep(.panel-body) {
    padding: 28rpx;
  }

  :deep(.result-ganzhi-row) {
    margin-bottom: 20rpx;
  }

  :deep(.result-ganzhi-date) {
    font-size: 26rpx;
  }

  :deep(.result-ganzhi-hour-tag) {
    padding: 8rpx 20rpx;
  }

  :deep(.result-ganzhi-hour-text) {
    font-size: 28rpx;
  }

  :deep(.section-title) {
    font-size: 26rpx;
    margin-bottom: 16rpx;
  }

  :deep(.point-btn) {
    padding: 20rpx 36rpx;
    border-radius: 24rpx;
  }

  :deep(.point-name) {
    font-size: 32rpx;
  }

  :deep(.point-code) {
    font-size: 26rpx;
  }

  :deep(.suggestion-title) {
    font-size: 28rpx;
  }

  :deep(.principle-text) {
    font-size: 26rpx;
    line-height: 1.8;
  }
}

.fanke-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: $spacing-md;
}

.fanke-icon {
  font-size: 40rpx;
  color: $tcm-secondary;
}

.fanke-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $tcm-secondary;
}

.fanke-desc {
  font-size: 26rpx;
  color: $tcm-text-hint;
  margin-left: 8rpx;
}

/* === 对比区域 === */
.compare-section {
  margin: $spacing-lg $spacing-md $spacing-md;
}

.compare-divider {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(to right, transparent, rgba($tcm-primary, 0.12), transparent);
}

.divider-text {
  font-size: $font-size-xs;
  color: $tcm-text-hint;
}

.compare-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}
</style>
