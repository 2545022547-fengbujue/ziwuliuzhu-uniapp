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

const THEME_OPTIONS = [
  { id: 'yellow', name: '古典宣纸', desc: '温润沉稳，经典默认风格' },
  // #ifdef H5 || APP-PLUS
  { id: 'black', name: '暗夜幽光', desc: '静谧深邃，适合夜间使用' },
  { id: 'green', name: '青瓷天青', desc: '清润舒展，适合白天使用' },
  { id: 'red', name: '朱砂丹霞', desc: '温暖醒目，适合重点查阅' }
  // #endif
]

const THEME_CHROME = {
  yellow: {
    backgroundColor: '#FFFFFF',
    color: '#999999',
    selectedColor: '#8B4513',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-yellow.png',
    homeSelectedIconPath: '/static/tabbar/home-yellow-active.png',
    settingIconPath: '/static/tabbar/setting-yellow.png',
    settingSelectedIconPath: '/static/tabbar/setting-yellow-active.png'
  },
  black: {
    backgroundColor: '#000000',
    color: '#9B9B9B',
    selectedColor: '#0080FF',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-black.png',
    homeSelectedIconPath: '/static/tabbar/home-black-active.png',
    settingIconPath: '/static/tabbar/setting-black.png',
    settingSelectedIconPath: '/static/tabbar/setting-black-active.png'
  },
  green: {
    backgroundColor: '#F7FBF8',
    color: '#71827B',
    selectedColor: '#2F7D73',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-green.png',
    homeSelectedIconPath: '/static/tabbar/home-green-active.png',
    settingIconPath: '/static/tabbar/setting-green.png',
    settingSelectedIconPath: '/static/tabbar/setting-green-active.png'
  },
  red: {
    backgroundColor: '#FFF8F2',
    color: '#8A756B',
    selectedColor: '#B83A2E',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-red.png',
    homeSelectedIconPath: '/static/tabbar/home-red-active.png',
    settingIconPath: '/static/tabbar/setting-red.png',
    settingSelectedIconPath: '/static/tabbar/setting-red-active.png'
  }
}

// === 新增的四套界面风格（uiStyle）===
// classic 沿用传统配色主题；下面四套风格各自拥有完整的排版、组件和交互样式。
// 注释统一说明设计意图，避免把“主色替换”误当成一套完整风格。
const UI_STYLE_OPTIONS = [
  // 现代简约：实际采用柔和新拟物语言，通过明暗双阴影塑造轻浮雕层次。
  { id: 'modern', name: '现代简约', desc: '柔和浮雕，轻盈有序', swatch: 'modern' },
  // 水墨意境：白宣纸、墨色笔触与克制的印色点睛，并按时段切换山水背景。
  { id: 'ink', name: '水墨意境', desc: '宣纸墨色，东方留白', swatch: 'ink' },
  // 莫兰迪奶油：以低饱和灰粉、灰绿和奶油纸色形成安静柔和的观感。
  { id: 'morandi', name: '莫兰迪奶油', desc: '低饱和灰调，温柔治愈', swatch: 'morandi' },
  // 水彩画风：使用透明色层与纸面晕染，不使用生硬的纯色矩形堆叠。
  { id: 'watercolor', name: '水彩画风', desc: '纸面晕染，柔和诗意', swatch: 'watercolor' },
  // 动物岛露营：参考 Animal Island UI 的奶油纸面、岛屿青绿和暖黄木牌语言。
  { id: 'animal', name: '动物森友会', desc: '双狸迎宾，轻松岛居', swatch: 'animal' },
  // 复古像素：遵循 Pixelium Design 的硬边轮廓、有限色板和 4px 像素节奏。
  { id: 'pixel', name: '复古像素', desc: '掌机像素，怀旧冒险', swatch: 'pixel' }
]

// 每种新风格的主色（用于 switch 开关等原生组件着色）
const UI_STYLE_PRIMARY = {
  modern: '#4F46E5',
  ink: '#2F4A48',
  morandi: '#A98282',
  watercolor: '#4A6FA5',
  animal: '#19AFA2',
  pixel: '#5B6EE1'
}

// 每种新风格的 TabBar 配色；可按风格同时覆盖普通与选中图标。
const UI_STYLE_CHROME = {
  modern: {
    backgroundColor: '#FFFFFF',
    color: '#9CA3AF',
    selectedColor: '#4F46E5',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-modern.png',
    homeSelectedIconPath: '/static/tabbar/home-modern-active.png',
    settingIconPath: '/static/tabbar/setting-modern.png',
    settingSelectedIconPath: '/static/tabbar/setting-modern-active.png'
  },
  ink: {
    backgroundColor: '#FDFDFA',
    color: '#7A817D',
    selectedColor: '#2F4A48',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-ink.png',
    homeSelectedIconPath: '/static/tabbar/home-ink-active.png',
    settingIconPath: '/static/tabbar/setting-ink.png',
    settingSelectedIconPath: '/static/tabbar/setting-ink-active.png'
  },
  morandi: {
    backgroundColor: '#F6F1EB',
    color: '#8F8880',
    selectedColor: '#A98282',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-morandi.png',
    homeSelectedIconPath: '/static/tabbar/home-morandi-active.png',
    settingIconPath: '/static/tabbar/setting-morandi.png',
    settingSelectedIconPath: '/static/tabbar/setting-morandi-active.png'
  },
  watercolor: {
    backgroundColor: '#FAF8F5',
    color: '#8A9DB3',
    selectedColor: '#4A6FA5',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-watercolor.png',
    homeSelectedIconPath: '/static/tabbar/home-watercolor-active.png',
    settingIconPath: '/static/tabbar/setting-watercolor.png',
    settingSelectedIconPath: '/static/tabbar/setting-watercolor-active.png'
  },
  animal: {
    backgroundColor: '#F7F3DF',
    color: '#8A7B66',
    selectedColor: '#19AFA2',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-animal.png',
    homeSelectedIconPath: '/static/tabbar/home-animal-active.png',
    settingIconPath: '/static/tabbar/setting-animal.png',
    settingSelectedIconPath: '/static/tabbar/setting-animal-active.png'
  },
  pixel: {
    backgroundColor: '#F7E7B7',
    color: '#6B5B53',
    selectedColor: '#5B6EE1',
    borderStyle: 'black',
    homeIconPath: '/static/tabbar/home-pixel.png',
    homeSelectedIconPath: '/static/tabbar/home-pixel-active.png',
    settingIconPath: '/static/tabbar/setting-pixel.png',
    settingSelectedIconPath: '/static/tabbar/setting-pixel-active.png'
  }
}

function isKnownUiStyle(styleId) {
  return styleId === 'classic' || UI_STYLE_OPTIONS.some(s => s.id === styleId)
}

let supportsThemeSwitch = false
// #ifdef H5 || APP-PLUS
supportsThemeSwitch = true
// #endif

function isKnownTheme(themeId) {
  return THEME_OPTIONS.some(t => t.id === themeId)
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
  const theme = ref('yellow')
  // 外观风格内部状态：classic 使用传统配色主题，其余使用独立视觉方案
  const uiStyle = ref('classic')

  // === 真太阳时设置 ===
  const useTrueSolarTime = ref(false)
  const longitude = ref(APP_CONFIG.defaultLongitude) // 默认北京经度
  const selectedCity = ref('北京')

  // === 反克法显示模式 ===
  const fankeDisplayMode = ref('merged') // 默认合并到纳甲法 | 'separate'=单独显示
  // 合日互用默认关闭：只有用户明确启用后，纳甲法闭穴才计算并展示合日穴位。
  const useHeRiHuYong = ref(false)
  // 穴位编码默认显示；关闭后各主题使用独立的中文名排版。
  const showPointCode = ref(true)

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

  /** 全部取穴结果（从 currentGanZhi 自动推导，含错误边界） */
  const results = computed(() => {
    const ganzhi = currentGanZhi.value
    const hourIndex = isManualMode.value ? selectedHour.value : currentHour.value
    if (!ganzhi) {
      return { najia: null, nazi: null, lingui: null, feiteng: null, fanke: null, _error: '干支计算失败' }
    }
    try {
      return {
        najia: calculateNajia(ganzhi, hourIndex, { enableHeRiHuYong: useHeRiHuYong.value }),
        nazi: calculateNazi(ganzhi, hourIndex),
        lingui: calculateLingui(ganzhi, hourIndex),
        feiteng: calculateFeiteng(ganzhi, hourIndex),
        fanke: calculateFanke(ganzhi, hourIndex)
      }
    } catch (e) {
      console.error('[取穴计算错误]', e)
      return { najia: null, nazi: null, lingui: null, feiteng: null, fanke: null, _error: e.message }
    }
  })

  // 当前激活方法的取穴结果（从 results 中按 activeMethod 索引）
  const currentResults = computed(() => results.value[activeMethod.value])

  const activeTheme = computed(() => {
    return supportsThemeSwitch && isKnownTheme(theme.value) ? theme.value : 'yellow'
  })

  // 兜底校验：持久化值非法（如风格已下架）时回退经典界面
  const activeUiStyle = computed(() => {
    return supportsThemeSwitch && isKnownUiStyle(uiStyle.value) ? uiStyle.value : 'classic'
  })

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
    return THEME_CHROME[activeTheme.value]?.selectedColor || THEME_CHROME.yellow.selectedColor
  })

  const themeSwitchColor = computed(() => {
    return themePrimaryColor.value
  })

  // 自动模式下用于展示的有效时间；开启真太阳时时为校正后的时间
  const effectiveCurrentTime = computed(() => {
    return getTrueSolarDate(currentTime.value, longitude.value, useTrueSolarTime.value)
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

  function queryTime(date, hour) {
    selectedDate.value = date
    selectedHour.value = hour
    isManualMode.value = true
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
    if (!enabled) longitude.value = APP_CONFIG.defaultLongitude
    // 开关变化可能导致时辰跳变，强制更新
    if (!isManualMode.value) updateCurrentTime(true)
  }

  function setActiveMethod(method) {
    activeMethod.value = method
  }

  function setNaziMode(mode) {
    naziMode.value = mode
  }

  function togglePointCode(enabled) {
    showPointCode.value = Boolean(enabled)
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

  function applyThemeChrome() {
    if (!supportsThemeSwitch) return
    const chrome = activeUiStyle.value === 'classic'
      ? THEME_CHROME[activeTheme.value]
      : UI_STYLE_CHROME[activeUiStyle.value]
    if (!chrome) return
    try {
      const {
        homeIconPath = '/static/tabbar/home.png',
        homeSelectedIconPath,
        settingIconPath = '/static/tabbar/setting.png',
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

  // === 初始化 ===
  updateCurrentTime(true)  // 强制初始化，确保首次加载时间正确

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
    useHeRiHuYong,
    showPointCode,
    // Getters
    currentResults,
    currentGanZhi,
    effectiveCurrentTime,
    inkBackgroundPeriod,
    // Actions
    updateCurrentTime,
    refreshVisualClock,
    queryTime,
    switchToAutoMode,
    switchToManualMode,
    updateLongitude,
    toggleTrueSolarTime,
    setActiveMethod,
    setNaziMode,
    toggleHeRiHuYong,
    togglePointCode,
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
        paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod', 'naziMode', 'fankeDisplayMode', 'useHeRiHuYong', 'showPointCode', 'theme', 'uiStyle']
      }
    ]
  }
})
