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
 * 数据流：
 *   用户操作 → 修改状态 → 触发计算 → 更新 results → ResultPanel 响应式更新
 *
 * 持久化：
 *   使用 pinia-plugin-persist-uni 将部分状态持久化到 uni.storage
 *   持久化字段：useTrueSolarTime、longitude、selectedCity、activeMethod
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
import { getGanZhi, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/services/ganzhi.js'
import { WU_SHU_DUN } from '@/data/constants.js'
import { calculateNajia, calculateFanke } from '@/services/najia.js'
import { calculateNazi } from '@/services/nazi.js'
import { calculateLingui } from '@/services/lingui.js'
import { calculateFeiteng } from '@/services/feiteng.js'
import { getHourIndexFromDate } from '@/utils/date.js'
import { APP_CONFIG } from '@/config/index.js'

export const useAppStore = defineStore('app', () => {
  // === 时间状态 ===
  const currentTime = ref(new Date())
  const currentHour = ref(0)
  const selectedDate = ref(new Date())
  const selectedHour = ref(0)
  const isManualMode = ref(false)

  // === 取穴方法 ===
  const activeMethod = ref('najia')

  // === 计算结果 ===
  const results = ref({
    najia: null,
    nazi: null,
    lingui: null,
    feiteng: null,
    fanke: null
  })

  // === UI 状态 ===
  const showDetail = ref(false)
  const selectedPoint = ref(null)
  const naziMode = ref('daily')  // 纳子法模式：'daily'(一日六十六穴) | 'bumu'(补母泻子)

  // === 真太阳时设置 ===
  const useTrueSolarTime = ref(false)
  const longitude = ref(APP_CONFIG.defaultLongitude) // 默认北京经度
  const selectedCity = ref('北京')

  // === 计算属性 ===
  const currentResults = computed(() => results.value[activeMethod.value])
  const currentGanZhi = ref(null)

  // === 构建干支信息 ===
  function buildGanZhi(date, hourIndex) {
    const baseGanZhi = getGanZhi(date, longitude.value, useTrueSolarTime.value)
    const dayStem = baseGanZhi.day.heavenlyStem
    const hourBranchIndex = hourIndex
    const hourBranch = EARTHLY_BRANCHES[hourBranchIndex]
    const startStemIndex = WU_SHU_DUN[dayStem] || 0
    const hourStemIndex = (startStemIndex + hourBranchIndex) % 10
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
  }

  // === 计算取穴结果 ===
  function calculateResults(ganzhi, hourIndex) {
    return {
      najia: calculateNajia(ganzhi, hourIndex),
      nazi: calculateNazi(ganzhi, hourIndex),
      lingui: calculateLingui(ganzhi, hourIndex),
      feiteng: calculateFeiteng(ganzhi, hourIndex),
      fanke: calculateFanke(ganzhi, hourIndex)
    }
  }

  // === 内部：重新计算干支和取穴结果 ===
  function _recalculate(date, hourIndex) {
    const ganzhi = buildGanZhi(date, hourIndex)
    currentGanZhi.value = ganzhi
    results.value = calculateResults(ganzhi, hourIndex)
  }

  // === 更新当前系统时间（自动模式）===
  function updateCurrentTime() {
    const now = new Date()
    currentTime.value = now
    currentHour.value = getHourIndexFromDate(now)
    _recalculate(now, currentHour.value)
  }

  // === 用户选择时间查询（手动模式）===
  function queryTime(date, hour) {
    selectedDate.value = date
    selectedHour.value = hour
    isManualMode.value = true
    _recalculate(date, hour)
  }

  // === 切换回自动模式 ===
  function switchToAutoMode() {
    isManualMode.value = false
    updateCurrentTime()
  }

  // === 切换到手动模式 ===
  function switchToManualMode(date, hour) {
    isManualMode.value = true
    selectedDate.value = date
    selectedHour.value = hour
    _recalculate(date, hour)
  }

  // === 更新经度 ===
  function updateLongitude(newLongitude, city) {
    longitude.value = newLongitude
    useTrueSolarTime.value = true
    if (city) selectedCity.value = city

    if (isManualMode.value) {
      _recalculate(selectedDate.value, selectedHour.value)
    } else {
      updateCurrentTime()
    }
  }

  // === 切换真太阳时开关 ===
  function toggleTrueSolarTime(enabled) {
    useTrueSolarTime.value = enabled
    if (!enabled) {
      longitude.value = APP_CONFIG.defaultLongitude
    }

    if (isManualMode.value) {
      _recalculate(selectedDate.value, selectedHour.value)
    } else {
      updateCurrentTime()
    }
  }

  // === 设置当前方法 ===
  function setActiveMethod(method) {
    activeMethod.value = method
  }

  // === 纳子法模式切换 ===
  function setNaziMode(mode) {
    naziMode.value = mode
  }

  // === 穴位详情 ===
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
    currentTime,
    currentHour,
    selectedDate,
    selectedHour,
    isManualMode,
    activeMethod,
    results,
    showDetail,
    selectedPoint,
    naziMode,
    useTrueSolarTime,
    longitude,
    selectedCity,
    // Getters
    currentResults,
    currentGanZhi,
    // Actions
    updateCurrentTime,
    queryTime,
    switchToAutoMode,
    switchToManualMode,
    updateLongitude,
    toggleTrueSolarTime,
    setActiveMethod,
    setNaziMode,
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
        paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod']
      }
    ]
  }
})
