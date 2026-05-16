<template>
  <!--
    首页（取穴主界面）
    
    布局说明：
    - 顶部：导航栏 + 状态栏占位
    - 中间：可滚动区域（干支卡片、方法切换、结果面板）
    - 底部：弹窗（PointDetail）
  -->
  <view class="page" :class="`theme-${store.activeTheme}`">
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
        <view v-if="store.currentGanZhi" class="ganzhi-display">
          <view class="ganzhi-tag-item">
            <text class="ganzhi-tag-text">{{ store.currentGanZhi.year.ganZhi }}年</text>
          </view>
          <view class="ganzhi-tag-item">
            <text class="ganzhi-tag-text">{{ store.currentGanZhi.month.ganZhi }}月</text>
          </view>
          <view class="ganzhi-tag-item highlight">
            <text class="ganzhi-tag-text">{{ store.currentGanZhi.day.ganZhi }}日</text>
          </view>
          <view class="ganzhi-tag-item highlight">
            <text class="ganzhi-tag-text">{{ store.currentGanZhi.hour.ganZhi }}时</text>
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

    <!-- 手动查询确认弹窗 -->
    <view v-if="showQueryConfirm" class="confirm-overlay" @tap="showQueryConfirm = false">
      <view class="confirm-popup" @tap.stop>
        <text class="confirm-title">确认查询</text>
        <view class="confirm-info">
          <text class="confirm-label">日期</text>
          <text class="confirm-value">{{ selectedDateStr }}</text>
        </view>
        <view class="confirm-info">
          <text class="confirm-label">时辰</text>
          <text class="confirm-value">{{ hourLabels[selectedHourIdx] }}</text>
        </view>
        <view class="confirm-btns">
          <view class="confirm-cancel" @tap="showQueryConfirm = false">
            <text>取消</text>
          </view>
          <view class="confirm-ok" @tap="confirmQuery">
            <text>确认查询</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
/**
 * 首页（取穴主界面）- index.vue
 *
 * 功能：
 *   1. 显示当前干支时间（年/月/日/时）
 *   2. 自动模式：每分钟更新时间显示，当时辰变动时才重新计算取穴结果
 *   3. 手动模式：用户选择日期和时辰查询，需确认后才更新结果
 *   4. 取穴方法切换（纳甲法、纳子法、灵龟八法、飞腾八法）
 *   5. 反克法补充（纳甲法闭穴时自动显示）
 *   6. 其他方法对比（底部显示其他3种方法的结果）
 *
 * 核心逻辑：
 *   - currentGanZhi：由 store 维护，页面直接读取
 *   - 五鼠遁（日上起时法）：根据日天干推算时辰天干（在 store.currentGanZhi computed 中实现）
 *   - 每分钟轮询检查时辰变化（仅自动模式下），变动时调用 updateCurrentTime() 更新状态
 *     currentGanZhi/results 由 computed 自动推导，无需手动触发计算
 *   - 页面隐藏/锁屏时暂停定时器，返回前台时恢复，节省电量
 *   - 手动模式使用 confirmedDateStr/confirmedHourIdx 已确认参数，
 *     选择器改动不会立即生效，需点查询→确认后才更新显示和计算
 *
 * 手动模式查询流程：
 *   选择日期/时辰 → 点"查询" → 弹出确认弹窗 → 确认 → 更新时间和干支及取穴结果
 *
 * 组件引用：
 *   - AppNavbar：自定义导航栏
 *   - ResultPanel：取穴结果面板（核心展示组件）
 *   - PointDetail：穴位详情弹窗（通过 store 控制显示）
 *
 * 注意：
 *   - 真太阳时校正功能已移至设置页，首页不再包含该功能
 *   - CityPicker 组件仅在设置页使用
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
// onShow/onHide 是 uni-app 页面生命周期，用于暂停/恢复定时器节省电量
import { onShow, onHide } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import { APP_CONFIG } from '@/config/index.js'
import { formatDate, getHourIndexFromDate, HOUR_OPTIONS, SHICHEN_START_HOURS } from '@/utils/date.js'
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

// 干支信息由 store 维护，页面直接读取 store.currentGanZhi

// 当前日期时间格式化字符串（如"2026年04月30日 22:30"）
// 自动模式下直接读取手机本地时间，依赖 minuteTick 每分钟更新一次，避免每秒重渲染耗电
// 手动模式下显示所选时辰的起始时间（如未时→13:00）
const currentDateTimeStr = computed(() => {
  if (store.isManualMode) {
    if (!confirmedDateStr.value) return '--'
    const parts = confirmedDateStr.value.split('-')
    const y = parts[0]
    const m = parts[1]
    const day = parts[2]
    const h = String(SHICHEN_START_HOURS[confirmedHourIdx.value]).padStart(2, '0')
    return `${y}年${m}月${day}日 ${h}:00`
  }
  // 依赖 minuteTick 触发重新计算；开启真太阳时时显示校正后的有效时间。
  void minuteTick.value
  const d = store.effectiveCurrentTime
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}`
})

// === 手动模式状态 ===
const selectedDateStr = ref(formatDate(new Date()))  // 手动模式选择的日期（"YYYY-MM-DD" 格式，待确认）
const selectedHourIdx = ref(0)                         // 手动模式选择的时辰索引（待确认）
const hourLabels = HOUR_OPTIONS.map(h => h.label)      // 时辰下拉选项标签（"子时 23:00-01:00"）
const showQueryConfirm = ref(false)                    // 是否显示查询确认弹窗
// 已确认的查询参数（用于显示时间和干支，确认后才更新）
const confirmedDateStr = ref('')
const confirmedHourIdx = ref(-1)
// 分钟时间戳（自动模式下每分钟递增一次，驱动 currentDateTimeStr 时间字符串刷新，节省电量）
const minuteTick = ref(0)

// 是否显示反克法补充（独立模式下纳甲法闭穴时显示）
const showFankeSupplement = computed(() => {
  return store.activeMethod === 'najia' &&
    store.results.najia?.isClosed &&
    store.results.fanke?.openPoints?.length &&
    store.fankeDisplayMode === 'separate'
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
  const now = new Date()
  const hourIdx = getHourIndexFromDate(now)
  selectedDateStr.value = formatDate(now)
  selectedHourIdx.value = hourIdx
  confirmedDateStr.value = selectedDateStr.value
  confirmedHourIdx.value = hourIdx
  store.switchToManualMode(now, hourIdx)
}

/** 日期选择器变化回调 */
function onDateChange(e) {
  selectedDateStr.value = e.detail.value
}

/** 时辰选择器变化回调 */
function onHourChange(e) {
  selectedHourIdx.value = Number(e.detail.value)
}

/** 手动查询：弹出确认弹窗 */
function handleQuery() {
  showQueryConfirm.value = true
}

/** 确认查询：关闭弹窗后执行计算 */
function confirmQuery() {
  showQueryConfirm.value = false
  // 保存已确认的参数，触发时间和干支显示更新
  confirmedDateStr.value = selectedDateStr.value
  confirmedHourIdx.value = selectedHourIdx.value
  // 用本地时间构造 Date，避免 new Date("YYYY-MM-DD") 的 UTC 陷阱（会变成 08:00）
  const parts = selectedDateStr.value.split('-')
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0)
  store.queryTime(date, selectedHourIdx.value)
}

// === 生命周期 ===
onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

// 页面隐藏时（切后台、锁屏）暂停定时器，节省电量
onHide(() => {
  stopTimer()
})

// 页面显示时（回到前台）恢复定时器，并立即刷新时间
onShow(() => {
  store.applyThemeChrome()
  startTimer()
  if (!store.isManualMode) {
    minuteTick.value++
    store.updateCurrentTime()
  }
})

/**
 * 启动定时器（每分钟检查一次）
 * 比每秒更新节省 60 倍 CPU 和电量消耗
 */
function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (!store.isManualMode) {
      minuteTick.value++
      // store 内部会按真太阳时设置计算当前时辰，避免页面使用未校正时辰。
      store.updateCurrentTime()
    }
  }, APP_CONFIG.timerInterval)
}

/** 停止定时器 */
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
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
  font-family: 'KaitiGB2312', 'KaiTi', 'STKaiti', serif;
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

/* === 查询确认弹窗 === */
.confirm-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 300;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-popup {
  width: 75%;
  background: #FFFDF5;
  border-radius: 28rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.18);
}

.confirm-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $tcm-primary;
  text-align: center;
  margin-bottom: 36rpx;
}

.confirm-info {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba($tcm-primary, 0.06);
}

.confirm-label {
  font-size: $font-size-sm;
  color: $tcm-text-hint;
}

.confirm-value {
  font-size: $font-size-sm;
  color: $tcm-text;
  font-weight: 500;
}

.confirm-btns {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.confirm-cancel {
  flex: 1;
  padding: 24rpx 0;
  background: $tcm-bg;
  border-radius: 20rpx;
  text-align: center;
  font-size: $font-size-sm;
  color: $tcm-text-secondary;
}

.confirm-ok {
  flex: 1;
  padding: 24rpx 0;
  background: linear-gradient(135deg, $tcm-primary 0%, $tcm-primary-dark 100%);
  border-radius: 20rpx;
  text-align: center;
  font-size: $font-size-sm;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(139, 69, 19, 0.2);
}
</style>
