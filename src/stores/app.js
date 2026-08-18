/**
 * useAppStore - 全局状态管理（Pinia Store）
 *
 * 核心职责：
 *   1. 管理时间状态（当前时间、手动模式时间）
 *   2. 管理取穴方法切换（纳甲法、纳子法、灵龟八法、飞腾八法、反克法）
 *   3. 调用算法层计算取穴结果
 *   4. 管理真太阳时设置（城市、经度）
 *   5. 管理穴位详情弹窗状态
 *
 * 数据流（声明式，computed 自动推导）：
 *   用户操作 → 修改状态 → currentGanZhi 自动重算 → results 自动重算 → ResultPanel 响应式更新
 *
 * 持久化：
 *   使用 pinia-plugin-persist-uni 将部分状态持久化到 uni.storage
 *   持久化字段：真太阳时设置、城市、取穴方法、传统主题和新增外观风格等
 *
 * 算法层调用：
 *   - najia.js → calculateNajia()   纳甲法
 *   - najia.js → calculateFanke()   反克法（与纳甲法共享逻辑）
 *   - nazi.js  → calculateNazi()    纳子法
 *   - lingui.js→ calculateLingui()  灵龟八法
 *   - feiteng.js→calculateFeiteng() 飞腾八法
 *   - ganzhi.js → getGanZhi()       干支计算（含真太阳时校正）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getGanZhi, getTrueSolarDate, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/services/ganzhi.js'
import { WU_SHU_DUN } from '@/data/constants.js'
import { calculateNajia, calculateFanke } from '@/services/najia.js'
import { calculateNazi } from '@/services/nazi.js'
import { calculateLingui } from '@/services/lingui.js'
import { calculateFeiteng } from '@/services/feiteng.js'
import { getHourIndexFromDate } from '@/utils/date.js'
import { APP_CONFIG } from '@/config/index.js'
import { CITIES } from '@/data/city-coordinates.js'
import { THEME_OPTIONS, THEME_CHROME, UI_STYLE_OPTIONS, UI_STYLE_PRIMARY, UI_STYLE_CHROME } from '@/config/themes.js'

function isKnownUiStyle(styleId) {
  return styleId === 'classic' || UI_STYLE_OPTIONS.some(s => s.id === styleId)
}

let supportsThemeSwitch = false
// #ifdef H5 || APP-PLUS
supportsThemeSwitch = true
// #endif

// 测试钩子：vitest 环境无条件编译宏，supportsThemeSwitch 恒为 false，
// activeUiStyle/activeTheme 会回退 classic/green；测试用它翻转以覆盖主题派生逻辑。
// 生产代码不调用，默认值不受影响。
export function __setSupportsThemeSwitchForTest(value) {
  supportsThemeSwitch = value
}

function isKnownTheme(themeId) {
  return THEME_OPTIONS.some(t => t.id === themeId)
}

// 主取穴方法白名单（反克法只作为纳甲闭穴补充，不作为可持久化的 activeMethod）
const ACTIVE_METHODS = ['najia', 'nazi', 'lingui', 'feiteng']

// === 持久化 schema 版本化 ===
// 动机：pinia-plugin-persist-uni 只做「自动恢复 + 自动保存」，无迁移钩子。
// 若未来新增/改状态字段语义，旧用户持久化数据可能不兼容。这里用显式版本号 +
// 迁移注册表保证可平滑升级；当前 v1 是首个带版本的格式，旧数据视为 v0。
const SCHEMA_VERSION = 1
const PERSIST_KEY = 'ziwuliuzhu-app'  // 与 persist.strategies[0].key 保持一致
// 生产零日志约定（perf.js 同款判断）：迁移等开发期诊断信息仅开发环境输出
const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
/** 迁移注册表：{ 目标版本: (旧数据对象) => 新数据对象 }。v1 为基线，无破坏性变更。 */
const SCHEMA_MIGRATIONS = {
  1: (data) => data
}

export const useAppStore = defineStore('app', () => {
  // === 时间状态 ===
  const currentTime = ref(new Date())
  // 仅服务于时间相关的视觉效果，不参与取穴计算，避免每分钟重算全部算法。
  const visualClock = ref(new Date())
  const currentHour = ref(0)
  const selectedDate = ref(new Date())
  const selectedHour = ref(0)
  const isManualMode = ref(false)

  // === 取穴方法 ===
  const activeMethod = ref('najia')

  // === UI 状态 ===
  const showDetail = ref(false)
  const selectedPoint = ref(null)
  const naziMode = ref('daily')  // 纳子法模式：'daily'(一日六十六穴) | 'bumu'(补母泻子)
  // 新安装用户默认进入“青瓷天青”。Pinia 持久化会在已有设置存在时覆盖该初值，
  // 因此升级用户继续沿用自己的主题选择，不会被本次默认值调整强制切换。
  const theme = ref('green')
  // 外观风格内部状态：classic 使用传统配色主题，其余使用独立视觉方案
  const uiStyle = ref('classic')

  // === 真太阳时设置 ===
  const useTrueSolarTime = ref(false)
  const longitude = ref(APP_CONFIG.defaultLongitude) // 默认北京经度
  const selectedCity = ref('北京')

  // === 反克法显示开关 ===
  // 继续保存历史字段 fankeDisplayMode，避免已有用户升级后丢失设置：
  // 'separate' 表示“开启显示”，'merged' 仅作为旧值兼容表示“关闭隐藏”。
  // 开启后反克法结果合并进纳甲法面板（纳甲闭穴时替代显示），不再单独成卡（参考合日互用）。
  const fankeDisplayMode = ref('merged')
  // 合日互用默认关闭：只有用户明确启用后，纳甲法闭穴才计算并展示合日穴位。
  const useHeRiHuYong = ref(false)
  // 穴位编码默认显示；关闭后各主题使用独立的中文名排版。
  const showPointCode = ref(true)
  // 干支历法（四柱八字）默认关闭；开启后取穴界面当前时间面板显示年/月/日/时干支，关闭则仅显示公历。
  const showGanZhi = ref(false)
  // 五行属性默认开启；关闭后取穴界面与穴位详情不再显示穴位的五行属性。
  const showWuXing = ref(true)
  // 持久化 schema 版本（随 state 一起持久化，用于未来数据迁移判断）
  const schemaVersion = ref(SCHEMA_VERSION)

  // === 计算属性 ===

  /** 当前干支信息（自动/手动模式自动切换数据源） */
  const currentGanZhi = computed(() => {
    const date = isManualMode.value ? selectedDate.value : currentTime.value
    const hourIndex = isManualMode.value ? selectedHour.value : currentHour.value
    try {
      // 手动模式禁用真太阳时校正：用户选的是概念日期+时辰，不是具体时刻，校正无意义
      const baseGanZhi = isManualMode.value
        ? getGanZhi(date, 116.407, false)
        : getGanZhi(date, longitude.value, useTrueSolarTime.value)
      const dayStem = baseGanZhi.day.heavenlyStem
      const hourBranch = EARTHLY_BRANCHES[hourIndex]
      const startStemIndex = WU_SHU_DUN[dayStem] || 0
      const hourStemIndex = (startStemIndex + hourIndex) % 10
      const hourStem = HEAVENLY_STEMS[hourStemIndex]

      return {
        year: baseGanZhi.year,
        month: baseGanZhi.month,
        day: baseGanZhi.day,
        hour: {
          heavenlyStem: hourStem,
          earthlyBranch: hourBranch,
          ganZhi: hourStem + hourBranch
        }
      }
    } catch (e) {
      console.error('[干支计算错误]', e)
      return null
    }
  })

  /** 当前生效的时辰索引（自动/手动模式统一入口） */
  const activeHourIndex = computed(() => isManualMode.value ? selectedHour.value : currentHour.value)

  /**
   * 各取穴方法的独立计算结果（响应式精确化）。
   *
   * 演进动机：原实现把 5 种方法放在同一个 computed 内，任一依赖变化（如
   * toggleHeRiHuYong 只影响纳甲、naziMode 只影响纳子展示）都会连带重算全部 5 种方法。
   * 拆分后各方法 computed 只依赖自己真正需要的状态：
   *   - najia 依赖 useHeRiHuYong（合日互用开关）
   *   - nazi/lingui/feiteng/fanke 只依赖干支与时辰（切开关零重算）
   * 对外接口不变：消费方仍通过 store.results[method] 访问（聚合 computed 组装）。
   */
  const najiaResult = computed(() => {
    const gz = currentGanZhi.value
    if (!gz) return null
    try {
      return calculateNajia(gz, activeHourIndex.value, { enableHeRiHuYong: useHeRiHuYong.value })
    } catch (e) {
      console.error('[纳甲法计算错误]', e)
      return null
    }
  })

  const naziResult = computed(() => {
    const gz = currentGanZhi.value
    if (!gz) return null
    try { return calculateNazi(gz, activeHourIndex.value) } catch (e) { console.error('[纳子法计算错误]', e); return null }
  })

  const linguiResult = computed(() => {
    const gz = currentGanZhi.value
    if (!gz) return null
    try { return calculateLingui(gz, activeHourIndex.value) } catch (e) { console.error('[灵龟八法计算错误]', e); return null }
  })

  const feitengResult = computed(() => {
    const gz = currentGanZhi.value
    if (!gz) return null
    try { return calculateFeiteng(gz, activeHourIndex.value) } catch (e) { console.error('[飞腾八法计算错误]', e); return null }
  })

  const fankeResult = computed(() => {
    const gz = currentGanZhi.value
    if (!gz) return null
    try { return calculateFanke(gz, activeHourIndex.value) } catch (e) { console.error('[反克法计算错误]', e); return null }
  })

  /** 聚合出口：保持 store.results[method] 接口不变；聚合仅为对象组装（子 computed 已缓存） */
  const results = computed(() => {
    const base = {
      najia: najiaResult.value,
      nazi: naziResult.value,
      lingui: linguiResult.value,
      feiteng: feitengResult.value,
      fanke: fankeResult.value
    }
    return currentGanZhi.value ? base : { ...base, _error: '干支计算失败' }
  })

  // 当前激活方法的取穴结果（从 results 中按 activeMethod 索引）
  const currentResults = computed(() => results.value[activeMethod.value])

  const activeTheme = computed(() => {
    // #ifdef MP-WEIXIN
    // 小程序端 themes.scss 仅保留 .theme-yellow 变量块（black/green/red 被 #ifndef MP-WEIXIN 排除），
    // 强制回退古典宣纸，避免根类 theme-green 却无对应 CSS 变量导致 var(--theme-*) 全部失效。
    return 'yellow'
    // #endif
    // #ifndef MP-WEIXIN
    // H5/App 遇到空值或已下架的历史主题时同样回退青瓷，保证首次状态与异常兜底一致。
    return supportsThemeSwitch && isKnownTheme(theme.value) ? theme.value : 'green'
    // #endif
  })

  // 兜底校验：持久化值非法（如风格已下架）时回退经典界面
  const activeUiStyle = computed(() => {
    return supportsThemeSwitch && isKnownUiStyle(uiStyle.value) ? uiStyle.value : 'classic'
  })

  /** 反克法是否允许显示；隔离历史持久化枚举与当前布尔开关语义。 */
  const showFanke = computed(() => fankeDisplayMode.value === 'separate')

  // 设置页只展示一套“外观风格”，避免 theme 与 uiStyle 两套概念互相覆盖。
  const appearanceOptions = computed(() => [
    ...THEME_OPTIONS.map(item => ({
      id: `theme-${item.id}`,
      name: item.name,
      desc: item.desc,
      swatch: item.id,
      active: activeUiStyle.value === 'classic' && activeTheme.value === item.id
    })),
    ...UI_STYLE_OPTIONS.map(item => ({
      id: `style-${item.id}`,
      name: item.name,
      desc: item.desc,
      swatch: item.swatch,
      active: activeUiStyle.value === item.id
    }))
  ])

  const themePrimaryColor = computed(() => {
    // 新界面风格下使用风格专属主色（此时外观主题设置不生效）
    if (activeUiStyle.value !== 'classic' && UI_STYLE_PRIMARY[activeUiStyle.value]) {
      return UI_STYLE_PRIMARY[activeUiStyle.value]
    }
    return THEME_CHROME[activeTheme.value]?.selectedColor || THEME_CHROME.green.selectedColor
  })

  const themeSwitchColor = computed(() => {
    return themePrimaryColor.value
  })

  /**
   * 自动模式下用于展示的有效时间；开启真太阳时时为校正后的时间。
   *
   * 刻意基于 visualClock 而不是 currentTime：子时跨越自然日 00:00 时，
   * currentTime 为省算力仍停留在 23:xx（时辰索引同为 0，算法结果已通过
   * 23:00 子时翻转正确切换）；若显示也读 currentTime，00:00-00:59 的界面
   * 会一直停在 23:xx。visualClock 每分钟刷新，显示时间始终为真实当前时间。
   */
  const effectiveCurrentTime = computed(() => {
    return getTrueSolarDate(visualClock.value, longitude.value, useTrueSolarTime.value)
  })

  /** 水墨主题的七时段背景。使用设备当地时间，不受手动查询模式影响。 */
  const inkBackgroundPeriod = computed(() => {
    const hour = visualClock.value.getHours()
    const minuteOfDay = hour * 60 + visualClock.value.getMinutes()
    if (minuteOfDay >= 300 && minuteOfDay < 390) return 'sunrise'   // 05:00-06:29
    if (minuteOfDay >= 390 && minuteOfDay < 540) return 'morning'   // 06:30-08:59
    if (hour >= 9 && hour < 11) return 'forenoon'
    if (hour >= 11 && hour < 14) return 'noon'
    if (hour >= 14 && hour < 17) return 'afternoon'
    if (minuteOfDay >= 1020 && minuteOfDay < 1100) return 'sunset'  // 17:00-18:19
    if (minuteOfDay >= 1100 && minuteOfDay < 1200) return 'dusk'    // 18:20-19:59
    return 'night'
  })

  // === Actions（只改状态，不触计算）===

  function getEffectiveHourIndex(date) {
    const effectiveDate = getTrueSolarDate(date, longitude.value, useTrueSolarTime.value)
    return getHourIndexFromDate(effectiveDate)
  }

  function updateCurrentTime(forceUpdate = false) {
    const now = new Date()
    visualClock.value = now
    const newHour = getEffectiveHourIndex(now)
    // 定时器调用时（forceUpdate=false），只在时辰实际变化时才更新，
    // 避免每分钟触发 currentGanZhi/results 的无效重算
    // （2小时内可节省约 118 次 × 5种方法的重复计算）
    // 模式切换/经度变化时（forceUpdate=true），无条件更新以确保时间准确
    if (forceUpdate || newHour !== currentHour.value) {
      currentTime.value = now
      currentHour.value = newHour
    }
  }

  function refreshVisualClock() {
    visualClock.value = new Date()
  }

  function switchToAutoMode() {
    isManualMode.value = false
    // 切换回自动模式，强制更新时间
    updateCurrentTime(true)
  }

  function switchToManualMode(date, hour) {
    isManualMode.value = true
    selectedDate.value = date
    selectedHour.value = hour
  }

  // 经度变化时，自动模式同时刷新 currentTime/currentHour（以防真太阳时校正导致跨时辰）
  // 手动模式选择的是“某日某时辰”的概念时间，不应用真太阳时校正
  function updateLongitude(newLongitude, city) {
    longitude.value = newLongitude
    useTrueSolarTime.value = true
    if (city) selectedCity.value = city
    // 经度变化可能导致时辰跳变，强制更新
    if (!isManualMode.value) updateCurrentTime(true)
  }

  // 真太阳时开关变化同理：自动模式刷新时间；手动模式不受该设置影响
  function toggleTrueSolarTime(enabled) {
    useTrueSolarTime.value = enabled
    if (!enabled) {
      // 经度回退北京时城市必须同步回退，否则界面显示旧城市（如上海）却按北京经度计算
      longitude.value = APP_CONFIG.defaultLongitude
      selectedCity.value = APP_CONFIG.defaultCity
    }
    // 开关变化可能导致时辰跳变，强制更新
    if (!isManualMode.value) updateCurrentTime(true)
  }

  function setActiveMethod(method) {
    activeMethod.value = ACTIVE_METHODS.includes(method) ? method : 'najia'
  }

  /**
   * 设置纳子法模式（'daily' 一日六十六穴 | 'bumu' 补母泻子）。
   * 防御：非法值（含持久化脏数据）钳制回 'daily'，模板按 === 'bumu' 判断可安全降级。
   */
  function setNaziMode(mode) {
    naziMode.value = mode === 'bumu' ? 'bumu' : 'daily'
  }

  function togglePointCode(enabled) {
    showPointCode.value = Boolean(enabled)
  }

  function toggleGanZhi(enabled) {
    showGanZhi.value = Boolean(enabled)
  }

  /** 五行属性显示开关；状态持久化后同时作用于取穴列表与穴位详情。 */
  function toggleWuXing(enabled) {
    showWuXing.value = Boolean(enabled)
  }

  /**
   * 控制纳甲法闭穴时是否启用合日互用。
   * 该状态参与 results 计算依赖，切换后无需手动刷新，纳甲结果会立即重新计算。
   */
  function toggleHeRiHuYong(enabled) {
    useHeRiHuYong.value = Boolean(enabled)
  }

  function setTheme(nextTheme) {
    if (!supportsThemeSwitch) {
      theme.value = 'yellow'
      return
    }
    if (isKnownTheme(nextTheme)) {
      theme.value = nextTheme
      uiStyle.value = 'classic'
      applyThemeChrome()
    }
  }

  /** 切换独立界面风格，切换后同步刷新 TabBar 配色 */
  function setUiStyle(styleId) {
    uiStyle.value = isKnownUiStyle(styleId) ? styleId : 'classic'
    applyThemeChrome()
  }

  function setAppearance(optionId) {
    if (optionId.startsWith('theme-')) {
      setTheme(optionId.slice(6))
    } else if (optionId.startsWith('style-')) {
      setUiStyle(optionId.slice(6))
    }
  }

  /**
   * 切换反克法显示状态。
   * 内部仍写入旧枚举值以兼容已有持久化数据，但关闭后不会再以“合并模式”展示。
   */
  function toggleFanke(value) {
    fankeDisplayMode.value = value ? 'separate' : 'merged'
  }

  function applyThemeChrome() {
    if (!supportsThemeSwitch) return
    const chrome = activeUiStyle.value === 'classic'
      ? THEME_CHROME[activeTheme.value]
      : UI_STYLE_CHROME[activeUiStyle.value]
    if (!chrome) return
    try {
      const {
        homeIconPath = '/static/tabbar/home-green.png',
        homeSelectedIconPath,
        settingIconPath = '/static/tabbar/setting-green.png',
        settingSelectedIconPath,
        ...style
      } = chrome
      uni.setTabBarStyle(style)
      uni.setTabBarItem({
        index: 0,
        iconPath: homeIconPath,
        selectedIconPath: homeSelectedIconPath
      })
      uni.setTabBarItem({
        index: 1,
        iconPath: settingIconPath,
        selectedIconPath: settingSelectedIconPath
      })
    } catch (e) {
      console.warn('[applyThemeChrome] error:', e)
    }
  }

  function selectPoint(point) {
    selectedPoint.value = point
    showDetail.value = true
  }

  function closeDetail() {
    showDetail.value = false
    selectedPoint.value = null
  }

  /**
   * 持久化 schema 版本检查与迁移。
   *
   * 时机：store setup 末尾执行（此时 pinia-plugin-persist-uni 已完成旧数据恢复，
   * storage 里是已合并的持久化对象）。
   *
   * 行为：
   *   - 读取 storage 原始对象；无 schemaVersion 视为 v0；
   *   - 版本低于当前时，按 SCHEMA_MIGRATIONS 从 v+1 逐级迁移；
   *   - 迁移后写回带新版本号的完整对象（保留全部既有字段）；
   *   - 解析失败（脏数据）仅告警忽略，不阻断启动。
   */
  function ensureSchemaVersion() {
    try {
      const raw = uni.getStorageSync(PERSIST_KEY)
      if (!raw) return
      const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
      const from = Number(saved?.schemaVersion ?? 0)
      if (from >= SCHEMA_VERSION) return
      if (!isProd) console.info(`[持久化] schema v${from} → v${SCHEMA_VERSION}`)
      let data = saved
      for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
        const migrate = SCHEMA_MIGRATIONS[v]
        if (migrate) data = migrate(data)
      }
      uni.setStorageSync(PERSIST_KEY, JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION }))
    } catch (e) {
      console.warn('[持久化] schema 版本检查失败（按脏数据忽略）', e)
    }
  }

  /**
   * 持久化脏数据清洗。
   *
   * 背景：pinia-plugin-persist-uni 在 store setup 返回后才执行 $patch 恢复，
   * 因此这里的调用安排在微任务中（恢复完成后）。只清洗会直接影响计算/渲染
   * 的字段；theme/uiStyle 已有 activeTheme/activeUiStyle computed 兜底，不重复处理。
   */
  function sanitizePersistedState() {
    if (typeof longitude.value !== 'number' || !Number.isFinite(longitude.value) ||
        longitude.value < -180 || longitude.value > 180) {
      longitude.value = APP_CONFIG.defaultLongitude
    }
    if (typeof selectedCity.value !== 'string' || !selectedCity.value ||
        !CITIES.some(c => c.name === selectedCity.value)) {
      selectedCity.value = APP_CONFIG.defaultCity
    }
    if (typeof useTrueSolarTime.value !== 'boolean') {
      useTrueSolarTime.value = false
    }
    if (!ACTIVE_METHODS.includes(activeMethod.value)) {
      activeMethod.value = 'najia'
    }
    if (naziMode.value !== 'bumu') {
      naziMode.value = 'daily'
    }
    if (fankeDisplayMode.value !== 'separate' && fankeDisplayMode.value !== 'merged') {
      fankeDisplayMode.value = 'merged'
    }
    if (typeof useHeRiHuYong.value !== 'boolean') useHeRiHuYong.value = false
    if (typeof showPointCode.value !== 'boolean') showPointCode.value = true
    if (typeof showGanZhi.value !== 'boolean') showGanZhi.value = false
    if (typeof showWuXing.value !== 'boolean') showWuXing.value = true
  }

  // === 初始化 ===
  updateCurrentTime(true)  // 先用默认/内存值同步初始化，确保 store 一创建就有有效时间
  ensureSchemaVersion()  // 持久化版本检查（读的是 storage 原始对象，不依赖插件恢复时序）

  // pinia persist 插件在 setup 返回后同步 $patch 恢复持久化状态；微任务在其后运行，
  // 用恢复后的真太阳时/城市/方法等设置重新校正 currentHour，避免首帧使用默认值算错时辰。
  const runPostHydrationInit = () => {
    sanitizePersistedState()
    updateCurrentTime(true)
  }
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(runPostHydrationInit)
  } else {
    setTimeout(runPostHydrationInit, 0)
  }

  return {
    // State
    currentHour,
    selectedDate,
    selectedHour,
    isManualMode,
    activeMethod,
    results,
    showDetail,
    selectedPoint,
    naziMode,
    theme,
    uiStyle,
    activeUiStyle,
    uiStyles: UI_STYLE_OPTIONS,
    appearanceOptions,
    activeTheme,
    themePrimaryColor,
    themeSwitchColor,
    themes: THEME_OPTIONS,
    useTrueSolarTime,
    longitude,
    selectedCity,
    fankeDisplayMode,
    showFanke,
    useHeRiHuYong,
    showPointCode,
    showGanZhi,
    showWuXing,
    schemaVersion,
    // Getters
    currentResults,
    currentGanZhi,
    effectiveCurrentTime,
    inkBackgroundPeriod,
    // Actions
    updateCurrentTime,
    refreshVisualClock,
    switchToAutoMode,
    switchToManualMode,
    updateLongitude,
    toggleTrueSolarTime,
    toggleFanke,
    setActiveMethod,
    setNaziMode,
    toggleHeRiHuYong,
    togglePointCode,
    toggleGanZhi,
    toggleWuXing,
    setTheme,
    setUiStyle,
    setAppearance,
    applyThemeChrome,
    selectPoint,
    closeDetail
  }
}, {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'ziwuliuzhu-app',
        storage: {
          getItem: (key) => {
            try { return uni.getStorageSync(key) } catch { return null }
          },
          setItem: (key, value) => {
            try { uni.setStorageSync(key, value) } catch (e) {
              console.warn('[持久化写入失败]', key, e)
            }
          },
          removeItem: (key) => {
            try { uni.removeStorageSync(key) } catch (e) {
              console.warn('[持久化删除失败]', key, e)
            }
          }
        },
        paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod', 'naziMode', 'fankeDisplayMode', 'useHeRiHuYong', 'showPointCode', 'showGanZhi', 'showWuXing', 'theme', 'uiStyle', 'schemaVersion']
      }
    ]
  }
})
