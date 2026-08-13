import { ref, computed, onUnmounted } from 'vue'
import { onShow, onHide, onBackPress } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import manifest from '@/manifest.json'
import { METHOD_DESCS } from '@/data/constants.js'

/**
 * useSettingPage - 设置页共享逻辑（所有主题页面复用）
 *
 * 职责：
 *   - 真太阳时校正设置（开关 + 城市选择 + 经度显示）
 *   - 外观风格切换（含主题过渡动画）
 *   - 取穴方法说明弹窗
 *   - 关于页面弹窗
 *   - 返回键拦截
 *
 * 主题页面通过 inject('setting') 获取本函数返回的共享状态与方法。
 */
export function useSettingPage() {
  const store = useAppStore()
  const { statusBarHeight, safeAreaBottom } = useSystemInfo()
  const navHeight = computed(() => statusBarHeight.value + 44)
  const safeBottom = computed(() => safeAreaBottom.value)
  const cityPickerRef = ref(null)
  const showMethods = ref(false)
  const showAbout = ref(false)
  const appearanceExpanded = ref(false)
  const classicThemesExpanded = ref(false)
  const najiaExpanded = ref(false)
  const personalExpanded = ref(false)
  const themeTransitionVisible = ref(false)
  const themeTransitionClosing = ref(false)
  const themeTransitionKind = ref('animal')
  const version = manifest.versionName || '1.0.0'

  const methodDescs = METHOD_DESCS
  const currentAppearance = computed(() => {
    return store.appearanceOptions.find(item => item.active) || store.appearanceOptions[0]
  })
  /** 经典主题与独立 UI 风格拆成两层，仅改变设置页信息架构，不改变 Store 的持久化键。 */
  const classicAppearanceOptions = computed(() => store.appearanceOptions.filter(item => item.id.startsWith('theme-')))
  const standaloneAppearanceOptions = computed(() => store.appearanceOptions.filter(item => item.id.startsWith('style-')))
  const classicGroupDescription = computed(() => {
    const activeClassic = classicAppearanceOptions.value.find(item => item.active)
    return activeClassic ? `当前：${activeClassic.name}` : '古典宣纸、暗夜幽光、青瓷天青、朱砂丹霞'
  })
  let visualClockTimer = null
  let themeTransitionApplyTimer = null
  let themeTransitionCloseTimer = null
  let themeTransitionEndTimer = null

  function startVisualClockTimer() {
    if (visualClockTimer) clearInterval(visualClockTimer)
    visualClockTimer = setInterval(() => store.refreshVisualClock(), 60 * 1000)
  }

  function stopVisualClockTimer() {
    if (visualClockTimer) {
      clearInterval(visualClockTimer)
      visualClockTimer = null
    }
  }

  function clearThemeTransitionTimers() {
    if (themeTransitionApplyTimer) clearTimeout(themeTransitionApplyTimer)
    if (themeTransitionCloseTimer) clearTimeout(themeTransitionCloseTimer)
    if (themeTransitionEndTimer) clearTimeout(themeTransitionEndTimer)
    themeTransitionApplyTimer = null
    themeTransitionCloseTimer = null
    themeTransitionEndTimer = null
  }

  onShow(() => {
    store.refreshVisualClock()
    store.applyThemeChrome()
    startVisualClockTimer()
  })

  onHide(() => {
    stopVisualClockTimer()
  })

  onUnmounted(() => {
    clearThemeTransitionTimers()
  })

  /** 真太阳时开关变化回调，开启时自动弹出城市选择 */
  function onSolarTimeToggle(e) {
    store.toggleTrueSolarTime(e.detail.value)
    if (e.detail.value) {
      setTimeout(() => {
        openCityPicker()
      }, 100)
    }
  }

  /** 反克法显示开关；关闭后不再把结果合并到纳甲法面板。 */
  function onFankeToggle(e) {
    store.toggleFanke(e.detail.value)
  }

  /** 合日互用开关；切换后 store.results 会基于同一日期时辰立即重新计算。 */
  function onHeRiHuYongToggle(e) {
    store.toggleHeRiHuYong(e.detail.value)
  }

  /** 穴位编码显示开关；状态持久化后同时作用于列表和详情标题。 */
  function onPointCodeToggle(e) {
    store.togglePointCode(e.detail.value)
  }

  function onGanZhiToggle(e) {
    store.toggleGanZhi(e.detail.value)
  }

  /** 五行属性显示开关；状态持久化后同时作用于取穴列表与穴位详情。 */
  function onWuXingToggle(e) {
    store.toggleWuXing(e.detail.value)
  }

  /** 选择外观后立即收起列表，让用户清楚看到当前生效项。 */
  function selectAppearance(optionId) {
    appearanceExpanded.value = false

    const targetStyle = optionId.startsWith('style-') ? optionId.slice(6) : ''
    const needsTransition = targetStyle === 'animal' || targetStyle === 'ink'
    const isAlreadyActive = store.appearanceOptions.some(item => item.id === optionId && item.active)

    if (!needsTransition || isAlreadyActive || themeTransitionVisible.value) {
      if (!isAlreadyActive) store.setAppearance(optionId)
      return
    }

    clearThemeTransitionTimers()
    themeTransitionKind.value = targetStyle
    themeTransitionClosing.value = false
    themeTransitionVisible.value = true

    themeTransitionApplyTimer = setTimeout(() => {
      store.setAppearance(optionId)
    }, 120)

    themeTransitionCloseTimer = setTimeout(() => {
      themeTransitionClosing.value = true
    }, 1380)

    themeTransitionEndTimer = setTimeout(() => {
      themeTransitionVisible.value = false
      themeTransitionClosing.value = false
      store.applyThemeChrome()
      clearThemeTransitionTimers()
    }, 1720)
  }

  /** 打开城市选择弹窗（复用 CityPicker 组件） */
  function openCityPicker() {
    cityPickerRef.value.open((cityData) => {
      store.updateLongitude(cityData.longitude, cityData.name)
    })
  }

  function goMethods() {
    showMethods.value = true
  }

  function goAbout() {
    showAbout.value = true
  }

  /** 返回键拦截：弹窗打开时关闭弹窗，否则跳转取穴页 */
  onBackPress(() => {
    if (cityPickerRef.value?.isOpen) {
      cityPickerRef.value.close()
      return true
    }
    if (showMethods.value) {
      showMethods.value = false
      return true
    }
    if (showAbout.value) {
      showAbout.value = false
      return true
    }
    uni.switchTab({ url: '/pages/index/index' })
    return true
  })

  return {
    store,
    navHeight,
    safeBottom,
    cityPickerRef,
    showMethods,
    showAbout,
    appearanceExpanded,
    classicThemesExpanded,
    najiaExpanded,
    personalExpanded,
    themeTransitionVisible,
    themeTransitionClosing,
    themeTransitionKind,
    version,
    methodDescs,
    currentAppearance,
    classicAppearanceOptions,
    standaloneAppearanceOptions,
    classicGroupDescription,
    onSolarTimeToggle,
    onFankeToggle,
    onHeRiHuYongToggle,
    onPointCodeToggle,
    onGanZhiToggle,
    onWuXingToggle,
    selectAppearance,
    openCityPicker,
    goMethods,
    goAbout
  }
}
