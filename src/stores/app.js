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
 *   持久化字段：useTrueSolarTime、longitude、selectedCity、activeMethod、theme
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
  { id: 'classic', name: '古典宣纸', desc: '温润沉稳，保留当前默认外观' },
  // #ifdef H5 || APP-PLUS
  { id: 'ink', name: '玄黑金篆', desc: '黑金低亮，适合夜间查看' },
  { id: 'celadon', name: '青瓷天青', desc: '清润舒展，适合白天使用' },
  { id: 'vermilion', name: '朱砂丹霞', desc: '温暖醒目，适合重点查阅' }
  // #endif
]

const THEME_CHROME = {
  classic: {
    backgroundColor: '#FFFFFF',
    color: '#999999',
    selectedColor: '#8B4513',
    borderStyle: 'white',
    homeSelectedIconPath: '/static/tabbar/home-active.png',
    settingSelectedIconPath: '/static/tabbar/setting-active.png'
  },
  ink: {
    backgroundColor: '#17140F',
    color: '#9B927F',
    selectedColor: '#D6A85A',
    borderStyle: 'black',
    homeSelectedIconPath: '/static/tabbar/home-active-ink.png',
    settingSelectedIconPath: '/static/tabbar/setting-active-ink.png'
  },
  celadon: {
    backgroundColor: '#F7FBF8',
    color: '#71827B',
    selectedColor: '#2F7D73',
    borderStyle: 'white',
    homeSelectedIconPath: '/static/tabbar/home-active-celadon.png',
    settingSelectedIconPath: '/static/tabbar/setting-active-celadon.png'
  },
  vermilion: {
    backgroundColor: '#FFF8F2',
    color: '#8A756B',
    selectedColor: '#B83A2E',
    borderStyle: 'white',
    homeSelectedIconPath: '/static/tabbar/home-active-vermilion.png',
    settingSelectedIconPath: '/static/tabbar/setting-active-vermilion.png'
  }
}

let supportsThemeSwitch = false
// #ifdef H5 || APP-PLUS
supportsThemeSwitch = true
// #endif

let supportsSystemTheme = false
// #ifdef APP-PLUS
supportsSystemTheme = true
// #endif

function isKnownTheme(themeId) {
  return THEME_OPTIONS.some(t => t.id === themeId)
}

function normalizeSystemTheme(themeName) {
  return themeName === 'dark' ? 'dark' : 'light'
}

export const useAppStore = defineStore('app', () => {
  // === 时间状态 ===
  const currentTime = ref(new Date())
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
  const theme = ref('classic')
  const themeMode = ref('system') // App 端默认跟随系统深色；用户手选主题后变为 manual
  const systemTheme = ref('light')

  // === 真太阳时设置 ===
  const useTrueSolarTime = ref(false)
  const longitude = ref(APP_CONFIG.defaultLongitude) // 默认北京经度
  const selectedCity = ref('北京')

  // === 反克法显示模式 ===
  const fankeDisplayMode = ref('merged') // 默认合并到纳甲法 | 'separate'=单独显示

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
        najia: calculateNajia(ganzhi, hourIndex),
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
    if (supportsSystemTheme && themeMode.value === 'system' && systemTheme.value === 'dark') {
      return 'ink'
    }
    return supportsThemeSwitch && isKnownTheme(theme.value) ? theme.value : 'classic'
  })

  const followsSystemTheme = computed(() => {
    return supportsSystemTheme && themeMode.value === 'system'
  })

  const themePrimaryColor = computed(() => {
    return THEME_CHROME[activeTheme.value]?.selectedColor || THEME_CHROME.classic.selectedColor
  })

  const themeSwitchColor = computed(() => {
    return activeTheme.value === 'ink' ? '#2A2419' : themePrimaryColor.value
  })

  // 自动模式下用于展示的有效时间；开启真太阳时时为校正后的时间
  const effectiveCurrentTime = computed(() => {
    return getTrueSolarDate(currentTime.value, longitude.value, useTrueSolarTime.value)
  })

  // === Actions（只改状态，不触计算）===

  function getEffectiveHourIndex(date) {
    const effectiveDate = getTrueSolarDate(date, longitude.value, useTrueSolarTime.value)
    return getHourIndexFromDate(effectiveDate)
  }

  function updateCurrentTime() {
    const now = new Date()
    currentTime.value = now
    currentHour.value = getEffectiveHourIndex(now)
  }

  function queryTime(date, hour) {
    selectedDate.value = date
    selectedHour.value = hour
    isManualMode.value = true
  }

  function switchToAutoMode() {
    isManualMode.value = false
    updateCurrentTime()
  }

  function switchToManualMode(date, hour) {
    isManualMode.value = true
    selectedDate.value = date
    selectedHour.value = hour
  }

  // 经度变化时，自动模式同时刷新 currentTime/currentHour（以防真太阳时校正导致跨时辰）
  // 手动模式下 computed 自动追踪 longitude 变化，无需额外操作
  function updateLongitude(newLongitude, city) {
    longitude.value = newLongitude
    useTrueSolarTime.value = true
    if (city) selectedCity.value = city
    if (!isManualMode.value) updateCurrentTime()
  }

  // 真太阳时开关变化同理：自动模式刷新时间，手动模式 computed 自动追踪 longitude/useTrueSolarTime 变化
  function toggleTrueSolarTime(enabled) {
    useTrueSolarTime.value = enabled
    if (!enabled) longitude.value = APP_CONFIG.defaultLongitude
    if (!isManualMode.value) updateCurrentTime()
  }

  function setActiveMethod(method) {
    activeMethod.value = method
  }

  function setNaziMode(mode) {
    naziMode.value = mode
  }

  function setTheme(nextTheme) {
    if (!supportsThemeSwitch) {
      theme.value = 'classic'
      return
    }
    if (isKnownTheme(nextTheme)) {
      themeMode.value = 'manual'
      theme.value = nextTheme
      applyThemeChrome()
    }
  }

  function syncSystemTheme(nextTheme) {
    if (!supportsSystemTheme) return
    systemTheme.value = normalizeSystemTheme(nextTheme)
    applyThemeChrome()
  }

  function syncSystemThemeFromDevice() {
    if (!supportsSystemTheme) return
    try {
      const info = uni.getSystemInfoSync()
      syncSystemTheme(info.theme || info.osTheme)
    } catch {
      syncSystemTheme('light')
    }
  }

  function toggleFollowSystemTheme(enabled) {
    if (!supportsSystemTheme) return
    themeMode.value = enabled ? 'system' : 'manual'
    syncSystemThemeFromDevice()
    applyThemeChrome()
  }

  function applyThemeChrome() {
    if (!supportsThemeSwitch) return
    const chrome = THEME_CHROME[activeTheme.value]
    if (!chrome) return
    try {
      const { homeSelectedIconPath, settingSelectedIconPath, ...style } = chrome
      uni.setTabBarStyle(style)
      uni.setTabBarItem({
        index: 0,
        iconPath: '/static/tabbar/home.png',
        selectedIconPath: homeSelectedIconPath
      })
      uni.setTabBarItem({
        index: 1,
        iconPath: '/static/tabbar/setting.png',
        selectedIconPath: settingSelectedIconPath
      })
    } catch {
      // 非 tabBar 页面或不支持的平台忽略，页面主题仍由 CSS class 生效。
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
  updateCurrentTime()

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
    themeMode,
    systemTheme,
    activeTheme,
    followsSystemTheme,
    themePrimaryColor,
    themeSwitchColor,
    themes: THEME_OPTIONS,
    useTrueSolarTime,
    longitude,
    selectedCity,
    fankeDisplayMode,
    // Getters
    currentResults,
    currentGanZhi,
    effectiveCurrentTime,
    // Actions
    updateCurrentTime,
    queryTime,
    switchToAutoMode,
    switchToManualMode,
    updateLongitude,
    toggleTrueSolarTime,
    setActiveMethod,
    setNaziMode,
    setTheme,
    syncSystemTheme,
    syncSystemThemeFromDevice,
    toggleFollowSystemTheme,
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
        paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod', 'fankeDisplayMode', 'theme', 'themeMode']
      }
    ]
  }
})
