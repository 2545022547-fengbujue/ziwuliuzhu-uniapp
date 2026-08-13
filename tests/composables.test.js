/**
 * tests/composables.test.js - 页面级 composable 单元测试
 *
 * 说明（给后来者/AI）：
 * - useHomePage / useSettingPage 是壳层业务逻辑（定时器、生命周期、过渡状态机），
 *   被 14 个主题组件共享，一处 bug 影响全部主题。
 * - @dcloudio/uni-app 的 onShow/onHide/onBackPress 钩子只能在 setup 上下文调用：
 *   这里用 vi.mock 捕获回调，并用 createApp + mount 提供真实组件实例上下文
 *   （使 vue 的 onMounted/onUnmounted 正常触发）。
 * - uni 全局桩见 tests/setup.js；store 需 setActivePinia(createPinia())。
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createApp, defineComponent, h, reactive } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// ---- mock @dcloudio/uni-app 生命周期钩子（捕获回调供测试手动触发）----
const uniLifecycle = vi.hoisted(() => ({ onShowCbs: [], onHideCbs: [], onBackPressCbs: [] }))
vi.mock('@dcloudio/uni-app', () => ({
  onShow: (cb) => uniLifecycle.onShowCbs.push(cb),
  onHide: (cb) => uniLifecycle.onHideCbs.push(cb),
  onBackPress: (cb) => uniLifecycle.onBackPressCbs.push(cb)
}))

import { useSettingPage } from '@/composables/useSettingPage.js'
import { useHomePage } from '@/composables/useHomePage.js'
import { clearUniStorage } from './setup.js'

/** 挂载一个调用指定 composable 的包装组件，返回其返回值与卸载函数。
 *  用 reactive 包裹返回值，与壳层 provide('home'/'setting', reactive(obj)) 的解包语义一致：
 *  测试中可直接读写值（如 h.showDatePicker = true），无需 .value。 */
function mountComposable(useFn) {
  let result
  const Comp = defineComponent({
    setup() {
      result = reactive(useFn())
      return () => h('div')
    }
  })
  const app = createApp(Comp)
  const root = document.createElement('div')
  document.body.appendChild(root)
  app.mount(root)
  return {
    result,
    unmount: () => {
      app.unmount()
      root.remove()
    }
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearUniStorage()
  uniLifecycle.onShowCbs.length = 0
  uniLifecycle.onHideCbs.length = 0
  uniLifecycle.onBackPressCbs.length = 0
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSettingPage', () => {
  it('初始状态与版本号', () => {
    const { result: s } = mountComposable(useSettingPage)
    expect(s.appearanceExpanded).toBe(false)
    expect(s.showMethods).toBe(false)
    expect(s.showAbout).toBe(false)
    expect(s.themeTransitionVisible).toBe(false)
    expect(typeof s.version).toBe('string')
  })

  it('onShow 回调注册且可触发（视觉时钟启动不抛错）', () => {
    mountComposable(useSettingPage)
    expect(uniLifecycle.onShowCbs).toHaveLength(1)
    expect(() => uniLifecycle.onShowCbs[0]()).not.toThrow()
  })

  it('selectAppearance 无过渡风格：立即生效', () => {
    const { result: s } = mountComposable(useSettingPage)
    s.selectAppearance('style-modern')
    expect(s.store.activeUiStyle).toBe('modern')
    expect(s.themeTransitionVisible).toBe(false)
  })

  it('selectAppearance 过渡状态机：120ms 应用 → 1380ms 关闭 → 1720ms 隐藏', () => {
    vi.useFakeTimers()
    const { result: s } = mountComposable(useSettingPage)
    s.selectAppearance('style-animal')

    expect(s.themeTransitionVisible).toBe(true)
    expect(s.themeTransitionKind).toBe('animal')
    expect(s.store.activeUiStyle).not.toBe('animal')

    vi.advanceTimersByTime(120)
    expect(s.store.activeUiStyle).toBe('animal')
    expect(s.themeTransitionClosing).toBe(false)

    vi.advanceTimersByTime(1380 - 120)
    expect(s.themeTransitionClosing).toBe(true)

    vi.advanceTimersByTime(1720 - 1380)
    expect(s.themeTransitionVisible).toBe(false)
    expect(s.themeTransitionClosing).toBe(false)
  })

  it('过渡进行中再点其它需过渡主题：重启过渡链，最终以新目标生效', () => {
    vi.useFakeTimers()
    const { result: s } = mountComposable(useSettingPage)
    s.selectAppearance('style-animal')
    vi.advanceTimersByTime(50) // 动画进行中
    s.selectAppearance('style-ink') // 重入

    // 旧链被清掉，新链从 0 开始
    expect(s.themeTransitionKind).toBe('ink')
    vi.advanceTimersByTime(120)
    expect(s.store.activeUiStyle).toBe('ink')
    vi.advanceTimersByTime(1720 - 120)
    expect(s.themeTransitionVisible).toBe(false)
  })

  it('onSolarTimeToggle 开启后延迟 100ms 尝试打开城市选择（ref 未绑定时安全跳过）', () => {
    vi.useFakeTimers()
    const { result: s } = mountComposable(useSettingPage)
    expect(() => {
      s.onSolarTimeToggle({ detail: { value: true } })
      vi.advanceTimersByTime(150)
    }).not.toThrow()
    expect(s.store.useTrueSolarTime).toBe(true)
  })

  it('goMethods 打开方法说明弹窗；onBackPress 优先关闭弹窗', () => {
    const { result: s } = mountComposable(useSettingPage)
    s.goMethods()
    expect(s.showMethods).toBe(true)

    const back = uniLifecycle.onBackPressCbs[0]
    expect(back()).toBe(true)
    expect(s.showMethods).toBe(false)
  })

  it('onBackPress 无弹窗时跳转首页并返回 true', () => {
    const { result: s } = mountComposable(useSettingPage)
    const switchTabSpy = vi.spyOn(globalThis.uni, 'switchTab')
    const back = uniLifecycle.onBackPressCbs[0]
    expect(back()).toBe(true)
    expect(switchTabSpy).toHaveBeenCalledWith({ url: '/pages/index/index' })
  })
})

describe('useHomePage', () => {
  it('switchToManual 初始化手动参数并进入手动模式', () => {
    const { result: h } = mountComposable(useHomePage)
    h.switchToManual()
    expect(h.store.isManualMode).toBe(true)
    expect(h.selectedDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(h.selectedHourIdx).toBeGreaterThanOrEqual(0)
    expect(h.confirmedDateStr).toBe(h.selectedDateStr)
    expect(h.confirmedHourIdx).toBe(h.selectedHourIdx)
  })

  it('confirmQuery 用本地时间构造 Date（防 UTC 陷阱）并触发查询', () => {
    const { result: h } = mountComposable(useHomePage)
    h.selectedDateStr = '2026-05-26'
    h.selectedHourIdx = 6
    h.handleQuery()
    expect(h.showQueryConfirm).toBe(true)

    h.confirmQuery()
    expect(h.showQueryConfirm).toBe(false)
    expect(h.confirmedDateStr).toBe('2026-05-26')
    expect(h.confirmedHourIdx).toBe(6)
    // 手动查询结果已计算（纳甲序列 12 项）
    expect(h.store.results.najia.dailySequence).toHaveLength(12)
  })

  it('onBackPress：优先关闭日期选择面板，其次穴位详情', () => {
    const { result: h } = mountComposable(useHomePage)
    const back = uniLifecycle.onBackPressCbs[0]

    h.showDatePicker = true
    expect(back()).toBe(true)
    expect(h.showDatePicker).toBe(false)

    h.store.selectPoint({ code: 'LI4', name: '合谷' })
    expect(h.store.showDetail).toBe(true)
    expect(back()).toBe(true)
    expect(h.store.showDetail).toBe(false)
  })

  it('自动模式 currentDateTimeStr 格式为 YYYY年MM月DD日 HH:mm', () => {
    const { result: h } = mountComposable(useHomePage)
    expect(h.store.isManualMode).toBe(false)
    expect(h.currentDateTimeStr).toMatch(/^\d{4}年\d{2}月\d{2}日 \d{2}:\d{2}$/)
  })
})
