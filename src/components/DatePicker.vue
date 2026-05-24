<template>
  <view class="date-picker-overlay" @tap="close">
    <view class="date-picker-panel" :class="`theme-${store.activeTheme}`" @tap.stop>
      <!-- 年份标题（左上角） -->
      <view class="year-header">
        <view class="year-nav" @tap="prevYear">
          <text class="year-arrow prev">◀</text>
        </view>
        <text class="year-text">{{ currentYear }}年</text>
        <view class="year-nav" @tap="nextYear">
          <text class="year-arrow next">▶</text>
        </view>
      </view>

      <!-- 月份切换行 -->
      <view class="month-row">
        <view class="month-nav" @tap="prevMonth">
          <text class="month-arrow prev">◀</text>
        </view>
        <text class="month-text">{{ currentMonth + 1 }}月{{ selectedDay }}日</text>
        <view class="month-nav" @tap="nextMonth">
          <text class="month-arrow next">▶</text>
        </view>
      </view>

      <!-- 日历网格 -->
      <view class="calendar-grid">
        <!-- 星期标题：一二三四五六日 -->
        <view class="week-header">
          <text class="week-item">一</text>
          <text class="week-item">二</text>
          <text class="week-item">三</text>
          <text class="week-item">四</text>
          <text class="week-item">五</text>
          <text class="week-item">六</text>
          <text class="week-item">日</text>
        </view>
        <!-- 日期网格 -->
        <view class="day-grid">
          <view
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="day-item"
            :class="{ empty: day.empty, selected: day.selected, today: day.today }"
            @tap="selectDay(day)"
          >
            <text v-if="!day.empty" class="day-text">{{ day.date }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-row">
        <view class="action-btn cancel" @tap="close">
          <text>取消</text>
        </view>
        <view class="action-btn confirm" @tap="confirm">
          <text>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()

const props = defineProps({
  value: { type: String, default: '' }
})

const emit = defineEmits(['change', 'close'])

// 解析初始日期
const parseDate = (dateStr) => {
  if (!dateStr) {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
  }
  const [y, m, d] = dateStr.split('-')
  return { year: Number(y), month: Number(m) - 1, day: Number(d) }
}

const initial = parseDate(props.value)
const currentYear = ref(initial.year)
const currentMonth = ref(initial.month)
const selectedDay = ref(initial.day)

// 今天的日期
const today = new Date()
const todayYear = today.getFullYear()
const todayMonth = today.getMonth()
const todayDate = today.getDate()

// 计算日历网格（周日放最后：一二三四五六日）
// JS getDay(): 0=周日, 1=周一...6=周六
// 新顺序下，周日(0)对应第7列，周一(1)对应第1列
// 空格数 = (getDay() - 1 + 7) % 7
const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const jsWeekday = firstDay.getDay()  // 0=周日, 1=周一...
  // 转换：周日(0)放最后，所以空格数 = (jsWeekday - 1 + 7) % 7
  const startOffset = (jsWeekday - 1 + 7) % 7
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  for (let i = 0; i < startOffset; i++) {
    days.push({ empty: true, date: 0 })
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push({
      empty: false,
      date: d,
      selected: d === selectedDay.value,
      today: currentYear.value === todayYear && currentMonth.value === todayMonth && d === todayDate
    })
  }

  // 补齐最后一行
  const remainder = days.length % 7
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      days.push({ empty: true, date: 0 })
    }
  }

  return days
})

function prevYear() {
  currentYear.value--
}

function nextYear() {
  currentYear.value++
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function selectDay(day) {
  if (day.empty) return
  selectedDay.value = day.date
}

function close() {
  emit('close')
}

function confirm() {
  const month = String(currentMonth.value + 1).padStart(2, '0')
  const day = String(selectedDay.value).padStart(2, '0')
  const dateStr = `${currentYear.value}-${month}-${day}`
  emit('change', dateStr)
  emit('close')
}
</script>

<style lang="scss" scoped>
.date-picker-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 500;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-picker-panel {
  width: 85%;
  max-width: 400px;
  background: var(--theme-surface);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 30px var(--theme-shadow);
}

.year-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme-border);
}

.year-nav {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--theme-surface-muted);
  cursor: pointer;
}

.year-arrow {
  font-size: 12px;
  color: var(--theme-primary);
  display: block;
  text-align: center;
  line-height: 1;

  // 三角符号本身不对称，微调使其视觉居中
  &.prev { transform: translateX(-1px); }
  &.next { transform: translateX(1px); }
}

.year-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text-secondary);
}

.month-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 0;
}

.month-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--theme-surface-muted);
  cursor: pointer;
}

.month-arrow {
  font-size: 14px;
  color: var(--theme-primary);
  display: block;
  text-align: center;
  line-height: 1;

  // 三角符号本身不对称，微调使其视觉居中
  &.prev { transform: translateX(-1px); }
  &.next { transform: translateX(1px); }
}

.month-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--theme-primary);
}

.calendar-grid {
  padding: 8px 0;
}

.week-header {
  display: flex;
  width: 100%;
}

.week-item {
  width: calc(100% / 7);
  text-align: center;
  font-size: 13px;
  color: var(--theme-text-secondary);
  padding: 6px 0;
}

.day-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.day-item {
  width: calc(100% / 7);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &.empty {
    cursor: default;
  }

  &.today .day-text {
    color: var(--theme-secondary);
    font-weight: 600;
  }

  &.selected {
    .day-text {
      background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
      color: var(--theme-surface);
      font-weight: 600;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &:not(.empty):not(.selected):hover {
    background: var(--theme-surface-muted);
    border-radius: 50%;
  }
}

.day-text {
  font-size: 15px;
  color: var(--theme-text);
}

.action-row {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border);
}

.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;

  &.cancel {
    background: var(--theme-surface-muted);
    text { color: var(--theme-text-secondary); }
  }

  &.confirm {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
    text { color: var(--theme-surface); font-weight: 600; }
  }
}

/* 深色主题特殊样式 */
.theme-black {
  /* #ifndef MP-WEIXIN */
  .date-picker-panel {
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
  /* #endif */

  .year-nav, .month-nav {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 128, 255, 0.4);
  }

  /* #ifndef MP-WEIXIN */
  .day-item:not(.empty):not(.selected):hover {
    background: rgba(0, 128, 255, 0.15);
  }
  /* #endif */
}
</style>