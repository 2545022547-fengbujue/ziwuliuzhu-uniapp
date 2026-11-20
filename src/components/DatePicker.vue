<template>
  <!--
    DatePicker.vue - 日历面板式日期选择器（三端统一）

    功能：
    - 年份在左上角显示，可左右切换（◀2026▶）
    - 月份居中显示当前选中日期（如"5月24日"）
    - 日历网格：星期顺序一二三四五六日（周日在最后）
    - 今日日期特殊标记，选中日期高亮显示

    调用方式：
    <DatePicker :value="selectedDate" @change="onDateChange" @close="showDatePicker = false" />

    平台说明：
    - H5、App、微信小程序均使用此自定义组件，不依赖原生 picker
    - 微信小程序端仅在样式层排除不支持的 backdrop-filter

    已知坑：
    - JS getDay() 返回 0=周日，需转换为周日放最后的顺序
    - CSS 必须用 px 单位（不用 rpx），否则部分设备布局异常
    - 暗夜幽光主题需要毛玻璃效果，但微信小程序不支持 backdrop-filter
  -->
  <view class="date-picker-overlay" @tap="close">
    <view
      class="date-picker-panel"
      :class="rootClasses"
      @tap.stop
    >
      <!-- 使用真实 image 层，避免部分 App WebView 对多重 CSS 背景图渲染不稳定。 -->
      <image
        v-if="store.activeUiStyle === 'ink'"
        class="ink-picker-bg"
        :src="inkPickerBackground"
        mode="aspectFill"
      />
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
        <text class="month-text">{{ monthTitle }}</text>
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
import { useRootClasses } from '@/composables/useRootClasses.js'
// #ifdef H5 || APP-PLUS
import { getInkPickerBackground } from '@/utils/ink-backgrounds.js'
// #endif

// 手动查询的合理年份窗口：
// - 下限/上限避免用户把年份翻到极端值，lunar-javascript 虽能算，但显示与
//   new Date(y, ...) 的 0-99 特殊映射（自动 +1900）会产生“显示 0001 年、
//   实际按 1901 年计算”的错位；
// - 2100 对中医取穴参考已足够宽裕。
const MIN_YEAR = 1900
const MAX_YEAR = 2100

const store = useAppStore()
// 面板根 class 与布局同源推导（ink-bg 后缀是 --ink-picker-scene 变量载体，见 useRootClasses JSDoc）
const rootClasses = useRootClasses()
// 水墨背景仅 H5/App 使用；MP 端不 import 背景模块，避免把 6 张背景图打进小程序包。
const inkPickerBackground = computed(() => {
  // #ifdef H5 || APP-PLUS
  return getInkPickerBackground(store.inkBackgroundPeriod)
  // #endif
  // #ifndef H5 || APP-PLUS
  return ''
  // #endif
})

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
  // 防御：外部传入的日期字符串格式非法（如持久化脏数据 "abc"、"2026/05/24"）时
  // 回退到今天，避免 Number() 产生 NaN 后污染日历网格（年/月/日全部 NaN 白屏）。
  const parts = String(dateStr).split('-')
  if (parts.length !== 3) {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
  }
  const [y, m, d] = parts.map(Number)
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) ||
      y < MIN_YEAR || y > MAX_YEAR) {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
  }
  // 防御不完整日期（如 2026-13-45 / 2026-02-30）：用 Date 回环校验，避免
  // new Date(y, m-1, d) 静默进位到其它月份，导致标题月与 currentMonth 状态错位。
  const candidate = new Date(y, m - 1, d)
  if (m < 1 || m > 12 || d < 1 || d > 31 ||
      candidate.getFullYear() !== y || candidate.getMonth() !== m - 1 || candidate.getDate() !== d) {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
  }
  // m-1：传入 "05" 时 JS Date.getMonth() 期望的是 4（0-11）
  return { year: y, month: m - 1, day: d }
}

// 初始化当前显示的年/月/日（从 props 解析）
const initial = parseDate(props.value)
const currentYear = ref(initial.year)    // 当前显示的年份
const currentMonth = ref(initial.month)  // 当前显示的月份（0-11）
// 选中状态记录完整年月日三元组：selected 高亮必须年/月/日全等，
// 否则切月后会把「另一月的同一天」错误标成选中（如选中 5/24 切到 6 月，6/24 被高亮）。
const selectedYear = ref(initial.year)
const selectedMonth = ref(initial.month)
const selectedDay = ref(initial.day)     // 当前选中的日期（1-31）

// 标题只在「浏览中的月份」与「选中日期所在月份」一致时才显示日号。
// 切到其它月份浏览时只显示“6月”，不再显示“6月24日”这种把旧选中日拼进新月份
// 的误导标题（确认按钮始终按选中日期输出，见 confirm()）。
const monthTitle = computed(() => {
  const base = `${currentMonth.value + 1}月`
  if (currentYear.value === selectedYear.value && currentMonth.value === selectedMonth.value) {
    return `${base}${selectedDay.value}日`
  }
  return base
})

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
      // 是否为当前选中日期：年月日三元组全等才算选中（避免跨月错位高亮）
      selected: currentYear.value === selectedYear.value
        && currentMonth.value === selectedMonth.value
        && d === selectedDay.value,
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
  if (currentYear.value <= MIN_YEAR) return
  currentYear.value--
}

/**
 * 年份切换：加一年
 */
function nextYear() {
  if (currentYear.value >= MAX_YEAR) return
  currentYear.value++
}

/**
 * 月份切换：减一月（跨年时需同时减年份；到 MIN_YEAR 不再跨年，避免 1900-01 → 1899-12 绕过钳制）
 */
function prevMonth() {
  if (currentMonth.value === 0) {
    if (currentYear.value <= MIN_YEAR) return
    // 1月减1 → 12月，年份减1
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

/**
 * 月份切换：加一月（跨年时需同时加年份；到 MAX_YEAR 不再跨年）
 */
function nextMonth() {
  if (currentMonth.value === 11) {
    if (currentYear.value >= MAX_YEAR) return
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
  // 记录选中时的年月（selected 高亮按三元组匹配）
  selectedYear.value = currentYear.value
  selectedMonth.value = currentMonth.value
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
  // 使用「选中日期」自己的年月，而不是面板当前浏览的年月：
  // 否则用户切到其它月份但未点选任何日期就按确定，会输出“浏览月 + 旧选中日”的错拼日期
  // （例：选中 5/24 → 切到 6 月 → 直接确定，修复前会输出 2026-06-24）。
  const month = String(selectedMonth.value + 1).padStart(2, '0')
  const day = String(selectedDay.value).padStart(2, '0')
  const dateStr = `${selectedYear.value}-${month}-${day}`
  emit('change', dateStr)
  emit('close')
}
</script>

<style lang="scss" scoped>
/*
 * DatePicker 样式说明
 *
 * 主题适配：
 * - 经典外观使用 theme-* 类，新增外观使用 ui-* 类
 * - 所有主题共享 CSS 变量（--theme-*），再由对应风格补充组件细节
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
