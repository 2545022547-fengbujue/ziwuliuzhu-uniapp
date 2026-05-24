<template>
  <!--
    DatePicker.vue - 日历面板式日期选择器（H5/App端专用）

    功能：
    - 年份在左上角显示，可左右切换（◀2026▶）
    - 月份居中显示当前选中日期（如"5月24日"）
    - 日历网格：星期顺序一二三四五六日（周日在最后）
    - 今日日期特殊标记，选中日期高亮显示

    调用方式：
    <DatePicker :value="selectedDate" @change="onDateChange" @close="showDatePicker = false" />

    条件编译：
    - 仅在 H5 和 App 端使用（微信小程序用原生 picker）
    - 通过 #ifndef MP-WEIXIN 控制是否渲染此组件

    已知坑：
    - JS getDay() 返回 0=周日，需转换为周日放最后的顺序
    - CSS 必须用 px 单位（不用 rpx），否则部分设备布局异常
    - 暗夜幽光主题需要毛玻璃效果，但微信小程序不支持 backdrop-filter
  -->
  <view class="date-picker-overlay" @tap="close">
    <view class="date-picker-panel" :class="`theme-${store.activeTheme}`" @tap.stop>
      <!-- 年份标题（左上角）：◀2026▶ -->
      <view class="year-header">
        <view class="year-nav" @tap="prevYear">
          <text class="year-arrow prev">◀</text>
        </view>
        <text class="year-text">{{ currentYear }}年</text>
        <view class="year-nav" @tap="nextYear">
          <text class="year-arrow next">▶</text>
        </view>
      </view>

      <!-- 月份切换行：居中显示"5月24日" -->
      <view class="month-row">
        <view class="month-nav" @tap="prevMonth">
          <text class="month-arrow prev">◀</text>
        </view>
        <!-- currentMonth 是 0-11，显示时需 +1 -->
        <text class="month-text">{{ currentMonth + 1 }}月{{ selectedDay }}日</text>
        <view class="month-nav" @tap="nextMonth">
          <text class="month-arrow next">▶</text>
        </view>
      </view>

      <!-- 日历网格 -->
      <view class="calendar-grid">
        <!-- 星期标题：一二三四五六日（周日在最后） -->
        <view class="week-header">
          <text class="week-item">一</text>
          <text class="week-item">二</text>
          <text class="week-item">三</text>
          <text class="week-item">四</text>
          <text class="week-item">五</text>
          <text class="week-item">六</text>
          <text class="week-item">日</text>
        </view>
        <!-- 日期网格：通过 calendarDays computed 动态生成 -->
        <view class="day-grid">
          <view
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="day-item"
            :class="{ empty: day.empty, selected: day.selected, today: day.today }"
            @tap="selectDay(day)"
          >
            <!-- 空格子不显示日期（月份开头/结尾的空白填充） -->
            <text v-if="!day.empty" class="day-text">{{ day.date }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-row">
        <view class="action-btn cancel" @tap="close">
          <text class="action-btn-text">取消</text>
        </view>
        <view class="action-btn confirm" @tap="confirm">
          <text class="action-btn-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * DatePicker - 日历面板式日期选择器
 *
 * 核心逻辑：
 * 1. parseDate 解析传入的日期字符串（格式 YYYY-MM-DD）
 * 2. calendarDays 计算日历网格（考虑周日放最后的需求）
 * 3. 年份/月份切换时自动更新日历网格
 *
 * 日历算法说明：
 * - JS Date.getDay() 返回：0=周日, 1=周一, ..., 6=周六
 * - 需求：周日放最后，即周一在第1列，周日第7列
 * - 转换公式：空格数 = (getDay() - 1 + 7) % 7
 *   例：周日(0) → 空格数 = (0-1+7)%7 = 6（放第7列）
 *   例：周一(1) → 空格数 = (1-1+7)%7 = 0（放第1列）
 */
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()

// 接收父组件传入的当前日期值（格式：YYYY-MM-DD）
const props = defineProps({
  value: { type: String, default: '' }
})

// 事件：change 确认选择时触发，close 关闭面板时触发
const emit = defineEmits(['change', 'close'])

/**
 * 解析日期字符串为年/月/日对象
 * @param {string} dateStr - 格式 YYYY-MM-DD，空则返回今天
 * @returns {object} { year, month, day } - month 是 0-11（JS Date 原生格式）
 */
const parseDate = (dateStr) => {
  if (!dateStr) {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
  }
  const [y, m, d] = dateStr.split('-')
  // m-1：传入 "05" 时 JS Date.getMonth() 期望的是 4（0-11）
  return { year: Number(y), month: Number(m) - 1, day: Number(d) }
}

// 初始化当前显示的年/月/日（从 props 解析）
const initial = parseDate(props.value)
const currentYear = ref(initial.year)    // 当前显示的年份
const currentMonth = ref(initial.month)  // 当前显示的月份（0-11）
const selectedDay = ref(initial.day)     // 当前选中的日期（1-31）

// 今天的日期（用于标记"今日"样式）
const today = new Date()
const todayYear = today.getFullYear()
const todayMonth = today.getMonth()
const todayDate = today.getDate()

/**
 * 计算日历网格数组
 *
 * 算法步骤：
 * 1. 计算当月第一天是星期几（JS getDay()）
 * 2. 转换为"周日在最后"顺序的偏移量
 * 3. 填充开头空白格
 * 4. 填充当月所有日期（标记选中/今日）
 * 5. 补齐最后一行空白格
 *
 * @returns {Array} 每个元素包含 { empty, date, selected, today }
 */
const calendarDays = computed(() => {
  const days = []
  // 当月第一天的 Date 对象
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  // JS 原生星期：0=周日, 1=周一...
  const jsWeekday = firstDay.getDay()
  // 转换：周日(0)放最后，空格数 = (jsWeekday - 1 + 7) % 7
  const startOffset = (jsWeekday - 1 + 7) % 7
  // 当月总天数（getDate() 对下月第0天返回上月最后一天）
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  // 填充开头空白格（让第一天对齐到正确的星期列）
  for (let i = 0; i < startOffset; i++) {
    days.push({ empty: true, date: 0 })
  }

  // 填充当月所有日期
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      empty: false,
      date: d,
      selected: d === selectedDay.value,  // 是否为当前选中日期
      today: currentYear.value === todayYear && currentMonth.value === todayMonth && d === todayDate  // 是否为今天
    })
  }

  // 补齐最后一行空白格（让日历网格完整 7 列）
  const remainder = days.length % 7
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      days.push({ empty: true, date: 0 })
    }
  }

  return days
})

/**
 * 年份切换：减一年
 */
function prevYear() {
  currentYear.value--
}

/**
 * 年份切换：加一年
 */
function nextYear() {
  currentYear.value++
}

/**
 * 月份切换：减一月（跨年时需同时减年份）
 */
function prevMonth() {
  if (currentMonth.value === 0) {
    // 1月减1 → 12月，年份减1
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

/**
 * 月份切换：加一月（跨年时需同时加年份）
 */
function nextMonth() {
  if (currentMonth.value === 11) {
    // 12月加1 → 1月，年份加1
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

/**
 * 点击日期格子
 * @param {object} day - { empty, date, selected, today }
 */
function selectDay(day) {
  if (day.empty) return  // 空格子不可选
  selectedDay.value = day.date
}

/**
 * 关闭面板（取消选择）
 */
function close() {
  emit('close')
}

/**
 * 确认选择：格式化为 YYYY-MM-DD 返回给父组件
 */
function confirm() {
  // 月份补零：5 → "05"
  const month = String(currentMonth.value + 1).padStart(2, '0')
  // 日期补零：9 → "09"
  const day = String(selectedDay.value).padStart(2, '0')
  const dateStr = `${currentYear.value}-${month}-${day}`
  emit('change', dateStr)
  emit('close')
}
</script>

<style lang="scss" scoped>
/*
 * DatePicker 样式说明
 *
 * 主题适配：
 * - 通过 :class="`theme-${store.activeTheme}`" 动态切换主题
 * - 默认主题使用 CSS 变量（--theme-*）
 * - 暗夜幽光主题（theme-black）需要特殊处理：毛玻璃效果
 *
 * 已知坑：
 * - 微信小程序不支持 backdrop-filter，需用 #ifndef MP-WEIXIN 条件编译
 * - 三角符号（◀▶）在圆形背景内视觉不居中，用 transform 微调
 */

/* 全屏遮罩层 */
.date-picker-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 500;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 日历面板主体 */
.date-picker-panel {
  width: 85%;
  max-width: 400px;
  background: var(--theme-surface);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 30px var(--theme-shadow);
}

/* 年份行（左上角布局） */
.year-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme-border);
}

/* 年份切换按钮（圆形背景） */
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

/* 年份箭头符号 */
.year-arrow {
  font-size: 12px;
  color: var(--theme-primary);
  display: block;
  text-align: center;
  line-height: 1;
  /* 三角符号本身不对称，微调使其视觉居中 */
  &.prev { transform: translateX(-1px); }
  &.next { transform: translateX(1px); }
}

/* 年份文本 */
.year-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text-secondary);
}

/* 月份切换行（居中布局） */
.month-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 0;
}

/* 月份切换按钮 */
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

/* 月份箭头符号 */
.month-arrow {
  font-size: 14px;
  color: var(--theme-primary);
  display: block;
  text-align: center;
  line-height: 1;
  &.prev { transform: translateX(-1px); }
  &.next { transform: translateX(1px); }
}

/* 月份文本（主要标题） */
.month-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--theme-primary);
}

/* 日历网格容器 */
.calendar-grid {
  padding: 8px 0;
}

/* 星期标题行（7列均分） */
.week-header {
  display: flex;
  width: 100%;
}

/* 星期标题项 */
.week-item {
  width: calc(100% / 7);
  text-align: center;
  font-size: 13px;
  color: var(--theme-text-secondary);
  padding: 6px 0;
}

/* 日期网格（7列均分，自动换行） */
.day-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

/* 单个日期格子 */
.day-item {
  width: calc(100% / 7);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  /* 空格子不可点击 */
  &.empty {
    cursor: default;
  }

  /* 今日标记：使用次要主题色 */
  &.today .day-text {
    color: var(--theme-secondary);
    font-weight: 600;
  }

  /* 选中日期：圆形渐变背景 */
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

  /* hover 效果（非选中状态） */
  &:not(.empty):not(.selected):hover {
    background: var(--theme-surface-muted);
    border-radius: 50%;
  }
}

/* 日期文本 */
.day-text {
  font-size: 15px;
  color: var(--theme-text);
}

/* 操作按钮行 */
.action-row {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border);
}

/* 操作按钮基础样式 */
.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;

  /* 取消按钮 */
  &.cancel {
    background: var(--theme-surface-muted);
    .action-btn-text { color: var(--theme-text-secondary); }
  }

  /* 确认按钮：渐变背景 */
  &.confirm {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
    .action-btn-text { color: var(--theme-surface); font-weight: 600; }
  }
}

/*
 * 暗夜幽光主题特殊样式
 *
 * 特点：
 * - 毛玻璃效果（backdrop-filter）
 * - 电蓝色边框和选中效果
 * - 微信小程序不支持 backdrop-filter，需条件编译排除
 */
.theme-black {
  /* #ifndef MP-WEIXIN */
  .date-picker-panel {
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
  /* #endif */

  /* 年份/月份按钮：电蓝色边框 */
  .year-nav, .month-nav {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 128, 255, 0.4);
  }

  /* hover 效果：电蓝色半透明 */
  /* #ifndef MP-WEIXIN */
  .day-item:not(.empty):not(.selected):hover {
    background: rgba(0, 128, 255, 0.15);
  }
  /* #endif */
}
</style>