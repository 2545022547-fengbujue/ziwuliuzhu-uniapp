import { ref, computed, inject, onUnmounted } from 'vue'
import { onPageShow, onPageHide, onBackPress } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app.js'
import { useSystemInfo } from '@/composables/useSystemInfo.js'
import { mark } from '@/utils/perf.js'
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
  const version = uni.getAppBaseInfo().appVersion || '1.0.0'

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
  let solarPickerTimer = null
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

  onPageShow(() => {
    store.refreshVisualClock()
    store.applyThemeChrome()
    startVisualClockTimer()
  })

  onPageHide(() => {
    stopVisualClockTimer()
    // 100ms 延迟打开 CityPicker 的定时器：切 tab 时若不清理，会在隐藏页面弹出选择器
    if (solarPickerTimer) clearTimeout(solarPickerTimer)
  })

  onUnmounted(() => {
    stopVisualClockTimer()
    if (solarPickerTimer) clearTimeout(solarPickerTimer)
    clearThemeTransitionTimers()
  })

  /** 真太阳时开关变化回调，开启时自动弹出城市选择 */
  function onSolarTimeToggle(e) {
    const enabled = Boolean(e?.detail?.value)
    store.toggleTrueSolarTime(enabled)
    if (enabled) {
      clearTimeout(solarPickerTimer)
      solarPickerTimer = setTimeout(() => {
        openCityPicker()
      }, 100)
    }
  }

  /** 反克法显示开关；关闭后不再把结果合并到纳甲法面板。 */
  function onFankeToggle(e) {
    store.toggleFanke(Boolean(e?.detail?.value))
  }

  /** 合日互用开关；切换后 store.results 会基于同一日期时辰立即重新计算。 */
  function onHeRiHuYongToggle(e) {
    store.toggleHeRiHuYong(Boolean(e?.detail?.value))
  }

  /** 穴位编码显示开关；状态持久化后同时作用于列表和详情标题。 */
  function onPointCodeToggle(e) {
    store.togglePointCode(Boolean(e?.detail?.value))
  }

  function onGanZhiToggle(e) {
    store.toggleGanZhi(Boolean(e?.detail?.value))
  }

  /** 五行属性显示开关；状态持久化后同时作用于取穴列表与穴位详情。 */
  function onWuXingToggle(e) {
    store.toggleWuXing(Boolean(e?.detail?.value))
  }

  /** 选择外观后立即收起列表，让用户清楚看到当前生效项。 */
  function selectAppearance(optionId) {
    appearanceExpanded.value = false
    // 切换起点打点：终点在 SettingLayout onMounted（measure 'theme-switch:start' → 'theme-layout:mounted'）
    mark('theme-switch:start')

    const targetStyle = optionId.startsWith('style-') ? optionId.slice(6) : ''
    const needsTransition = targetStyle === 'animal' || targetStyle === 'ink'
    const isAlreadyActive = store.appearanceOptions.some(item => item.id === optionId && item.active)

    if (!needsTransition || isAlreadyActive) {
      // 非过渡风格或已激活：先清掉可能残留的过渡遮罩定时器（过渡动画播放中切到
      // modern 等非过渡风格时，旧遮罩的 close/end 定时器会继续执行盖住新风格）
      clearThemeTransitionTimers()
      if (!isAlreadyActive) store.setAppearance(optionId)
      return
    }

    // 过渡动画进行中再点其它需过渡主题：清掉旧过渡链、按新目标重启播放，
    // 避免旧遮罩的 close/end 定时器继续执行，盖住刚选中的新风格。
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
    if (!cityPickerRef.value) {
      // 防御：CityPicker 组件尚未绑定（如 onSolarTimeToggle 的 100ms 延迟窗口内页面被切换）
      console.warn('[useSettingPage] cityPickerRef 尚未绑定 CityPicker 组件，跳过打开')
      return
    }
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
    statusBarHeight,
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

/**
 * useSetting - 主题设置页组件侧的注入包装
 *
 * 必须在设置页壳层（pages/setting/setting.vue，provide('setting')）的子组件中调用。
 * 相比裸写 inject('setting')，本包装提供契约兜底：注入缺失时立即抛错，
 * 避免主题组件因拼写错误静默拿到 undefined 导致白屏。
 * 返回结构 = useSettingPage() 的返回值（见上方 return）。
 */
export function useSetting() {
  const setting = inject('setting')
  if (!setting) {
    throw new Error('[useSetting] 未找到注入的 setting：请确认组件挂在设置页壳层 pages/setting/setting.vue 下')
  }
  return setting
}
