import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
// onShow/onHide/onBackPress 是 uni-app 页面生命周期，用于暂停/恢复定时器、拦截返回键
import { onPageShow, onPageHide, onBackPress } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import { APP_CONFIG } from '@/config/index.js'
import { formatDate, getHourIndexFromDate, HOUR_OPTIONS, SHICHEN_START_HOURS } from '@/utils/date.js'

/**
 * useHomePage - 取穴首页共享逻辑（所有主题页面复用）
 *
 * 将原 pages/index/index.vue 中的业务逻辑整体下沉到此处，
 * 页面壳层负责「按外观风格选择主题页面」，主题页面只负责「各自模板 + 样式」。
 *
 * 职责：
 *   - 时间状态展示（自动/手动、当前干支）
 *   - 手动查询确认流程
 *   - 定时器管理（分钟级轮询，隐藏/返回前台时暂停/恢复）
 *   - 返回键拦截
 *
 * 主题页面通过 inject('home') 获取本函数返回的共享状态与方法。
 */

// 模块级只读常量（避免每次调用 useHomePage 重建数组）：
// 四种主取穴方法（不含反克法，反克法是闭穴时的补充）
const METHODS = [
  { id: 'najia', name: '纳甲法', icon: '☰' },
  { id: 'nazi', name: '纳子法', icon: '☷' },
  { id: 'lingui', name: '灵龟八法', icon: '☯' },
  { id: 'feiteng', name: '飞腾八法', icon: '⚡' }
]

// 时辰下拉选项标签（"子时 23:00-01:00"），由 HOUR_OPTIONS 派生
const HOUR_LABELS = HOUR_OPTIONS.map(h => h.label)

export function useHomePage() {
  const store = useAppStore()
  const { statusBarHeight, safeAreaBottom } = useSystemInfo()
  // 导航栏高度 = 状态栏 + 44px
  const navHeight = computed(() => statusBarHeight.value + 44)
  const safeBottom = computed(() => safeAreaBottom.value)

  // 当前日期时间格式化字符串（如"2026年04月30日 22:30"）
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
    minuteTick.value
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
  const showDatePicker = ref(false)                     // 日历面板显示状态
  const showTimePicker = ref(false)                     // 时辰面板显示状态
  // 已确认的查询参数（用于显示时间和干支，确认后才更新）
  const confirmedDateStr = ref('')
  const confirmedHourIdx = ref(-1)
  // 分钟时间戳（自动模式下每分钟递增一次，驱动 currentDateTimeStr 时间字符串刷新，节省电量）
  const minuteTick = ref(0)

  // 其他方法对比列表（排除当前选中的方法；含纳甲，避免 activeMethod 非纳甲时对比区恒缺纳甲）
  const otherMethods = computed(() => {
    return METHODS.map(m => m.id).filter(m => m !== store.activeMethod)
  })

  // 自动更新定时器
  let timer = null

  /** 切换到自动模式 */
  function switchToAuto() {
    store.switchToAutoMode()
  }

  /** 切换到手动模式，初始化为当前时间（与 confirmQuery 一致用所选日期 00:00 构造） */
  function switchToManual() {
    const now = new Date()
    const hourIdx = getHourIndexFromDate(now)
    selectedDateStr.value = formatDate(now)
    selectedHourIdx.value = hourIdx
    confirmedDateStr.value = selectedDateStr.value
    confirmedHourIdx.value = hourIdx
    // 修复：23:00-23:59 进入手动时若把含时刻的 now 直接传入，getGanZhi 会因子时翻转
    // 把日干支按次日算，与 UI「子时按所选日期 00:00-00:59 计」矛盾，且点查询确认前后
    // 干支与算法结果整体跳变。与 confirmQuery 统一用所选日期 00:00 构造。
    const parts = selectedDateStr.value.split('-')
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0)
    store.switchToManualMode(date, hourIdx)
  }

  /** 日期选择面板回调（三端统一使用） */
  function onDatePickerChange(dateStr) {
    selectedDateStr.value = dateStr
  }

  /** 时辰面板回调（三端统一使用） */
  function onTimePickerChange(hourIdx) {
    selectedHourIdx.value = hourIdx
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
    store.switchToManualMode(date, selectedHourIdx.value)
  }

  /** 启动定时器（每分钟检查一次），比每秒更新节省约 60 倍 CPU 和电量消耗 */
  function startTimer() {
    stopTimer()
    timer = setInterval(() => {
      if (!store.isManualMode) {
        minuteTick.value++
        // store 内部会按真太阳时设置计算当前时辰，避免页面使用未校正时辰。
        // 不传 forceUpdate（默认 false），只在时辰实际变化时才更新，避免无效重算
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

  // === 生命周期 ===
  onMounted(() => {
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })

  // 页面隐藏时（切后台、锁屏）暂停定时器，节省电量
  onPageHide(() => {
    stopTimer()
  })

  // 页面显示时（回到前台）恢复定时器，并立即刷新时间
  onPageShow(() => {
    store.applyThemeChrome()
    startTimer()
    if (!store.isManualMode) {
      minuteTick.value++
      store.updateCurrentTime(true)
    }
  })

  /** 返回键拦截：优先拦截确认弹窗，其次拦截穴位弹窗 */
  onBackPress(() => {
    if (showDatePicker.value) {
      showDatePicker.value = false
      return true
    }
    if (showTimePicker.value) {
      showTimePicker.value = false
      return true
    }
    if (showQueryConfirm.value) {
      showQueryConfirm.value = false
      return true
    }
    if (store.selectedPoint) {
      store.closeDetail()
      return true
    }
    return false
  })

  return {
    store,
    navHeight,
    safeBottom,
    methods: METHODS,
    currentDateTimeStr,
    selectedDateStr,
    selectedHourIdx,
    hourLabels: HOUR_LABELS,
    showQueryConfirm,
    showDatePicker,
    showTimePicker,
    confirmedDateStr,
    confirmedHourIdx,
    minuteTick,
    otherMethods,
    switchToAuto,
    switchToManual,
    onDatePickerChange,
    onTimePickerChange,
    handleQuery,
    confirmQuery
  }
}

/**
 * useHome - 主题首页组件侧的注入包装
 *
 * 必须在首页壳层（pages/index/index.vue，provide('home')）的子组件中调用。
 * 相比裸写 inject('home')，本包装提供契约兜底：注入缺失时立即抛错，
 * 避免主题组件因拼写错误静默拿到 undefined 导致白屏。
 * 返回结构 = useHomePage() 的返回值（见上方 return）。
 */
export function useHome() {
  const home = inject('home')
  if (!home) {
    throw new Error('[useHome] 未找到注入的 home：请确认组件挂在首页壳层 pages/index/index.vue 下')
  }
  return home
}
