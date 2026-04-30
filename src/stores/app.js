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
import { calculateNajia, calculateFanke } from '@/services/najia.js'
import { calculateNazi } from '@/services/nazi.js'
import { calculateLingui } from '@/services/lingui.js'
import { calculateFeiteng } from '@/services/feiteng.js'
import { getHourIndexFromDate } from '@/utils/date.js'

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

  // === 穴位数据库 ===
  const acupuncturePoints = ref([])

  // === UI 状态 ===
  const showDetail = ref(false)
  const selectedPoint = ref(null)

  // === 真太阳时设置 ===
  const useTrueSolarTime = ref(false)
  const longitude = ref(104) // 默认经度（中国大陆中心）
  const selectedCity = ref('北京')

  // === 五鼠遁（日上起时法）===
  const wuShuDun = {
    '甲': 0, '己': 0,
    '乙': 2, '庚': 2,
    '丙': 4, '辛': 4,
    '丁': 6, '壬': 6,
    '戊': 8, '癸': 8
  }

  // === 计算属性 ===
  const currentResults = computed(() => results.value[activeMethod.value])
  const currentGanZhi = computed(() => {
    const r = results.value.najia
    return r ? r.ganzhi : null
  })

  // === 构建干支信息 ===
  function buildGanZhi(date, hourIndex) {
    const baseGanZhi = getGanZhi(date, longitude.value, useTrueSolarTime.value)
    const dayStem = baseGanZhi.day.heavenlyStem
    const hourBranchIndex = hourIndex
    const hourBranch = EARTHLY_BRANCHES[hourBranchIndex]
    const startStemIndex = wuShuDun[dayStem] || 0
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
      nazi: calculateNazi(ganzhi, hourIndex, '平补平泻'),
      lingui: calculateLingui(ganzhi, hourIndex),
      feiteng: calculateFeiteng(ganzhi, hourIndex),
      fanke: calculateFanke(ganzhi, hourIndex)
    }
  }

  // === 更新当前系统时间（自动模式）===
  function updateCurrentTime() {
    const now = new Date()
    currentTime.value = now
    currentHour.value = getHourIndexFromDate(now)

    const ganzhi = buildGanZhi(now, currentHour.value)
    results.value = calculateResults(ganzhi, currentHour.value)
  }

  // === 用户选择时间查询（手动模式）===
  function queryTime(date, hour) {
    selectedDate.value = date
    selectedHour.value = hour
    isManualMode.value = true

    const ganzhi = buildGanZhi(date, hour)
    results.value = calculateResults(ganzhi, hour)
  }

  // === 切换回自动模式 ===
  function switchToAutoMode() {
    isManualMode.value = false
    updateCurrentTime()
  }

  // === 更新经度 ===
  function updateLongitude(newLongitude, city) {
    longitude.value = newLongitude
    useTrueSolarTime.value = true
    if (city) selectedCity.value = city

    // 重新计算
    if (isManualMode.value) {
      const ganzhi = buildGanZhi(selectedDate.value, selectedHour.value)
      results.value = calculateResults(ganzhi, selectedHour.value)
    } else {
      updateCurrentTime()
    }
  }

  // === 切换真太阳时开关 ===
  function toggleTrueSolarTime(enabled) {
    useTrueSolarTime.value = enabled
    if (!enabled) {
      longitude.value = 104
    }
    // 重新计算
    if (isManualMode.value) {
      const ganzhi = buildGanZhi(selectedDate.value, selectedHour.value)
      results.value = calculateResults(ganzhi, selectedHour.value)
    } else {
      updateCurrentTime()
    }
  }

  // === 设置当前方法 ===
  function setActiveMethod(method) {
    activeMethod.value = method
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
    acupuncturePoints,
    showDetail,
    selectedPoint,
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
    updateLongitude,
    toggleTrueSolarTime,
    setActiveMethod,
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
            try { uni.setStorageSync(key, value) } catch {}
          },
          removeItem: (key) => {
            try { uni.removeStorageSync(key) } catch {}
          }
        },
        paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod']
      }
    ]
  }
})
