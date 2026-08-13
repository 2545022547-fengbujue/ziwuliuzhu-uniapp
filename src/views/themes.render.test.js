/**
 * src/views/themes.render.test.js - 主题组件可渲染冒烟（provide 契约防线）
 *
 * 说明（给后来者/AI）：
 * - 重构后 14 个主题组件均为薄壳，依赖壳层 provide 的 home/setting 注入
 *   （契约见 useHomePage.js / useSettingPage.js 的 return）。
 * - 本测试对每个主题组件做「全链 mount + 真实 composable 桩」：
 *   任何 inject 字段误拼、composable 返回结构缺字段、模板引用未定义值，
 *   都会在此暴露为渲染异常或关键节点缺失（白屏第一防线）。
 * - 与 composables.test.js 一样需 vi.mock @dcloudio/uni-app 生命周期钩子。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'

const uniLifecycle = vi.hoisted(() => ({ onShowCbs: [], onHideCbs: [], onBackPressCbs: [] }))
vi.mock('@dcloudio/uni-app', () => ({
  onShow: (cb) => uniLifecycle.onShowCbs.push(cb),
  onHide: (cb) => uniLifecycle.onHideCbs.push(cb),
  onBackPress: (cb) => uniLifecycle.onBackPressCbs.push(cb)
}))

import { useHomePage } from '@/composables/useHomePage.js'
import { useSettingPage } from '@/composables/useSettingPage.js'
import { clearUniStorage } from '../../tests/setup.js'

import HomeClassic from '@/views/classic/HomeClassic.vue'
import HomeModern from '@/views/modern/HomeModern.vue'
import HomeInk from '@/views/ink/HomeInk.vue'
import HomeMorandi from '@/views/morandi/HomeMorandi.vue'
import HomeWatercolor from '@/views/watercolor/HomeWatercolor.vue'
import HomeAnimal from '@/views/animal/HomeAnimal.vue'
import HomePixel from '@/views/pixel/HomePixel.vue'

import SettingClassic from '@/views/classic/SettingClassic.vue'
import SettingModern from '@/views/modern/SettingModern.vue'
import SettingInk from '@/views/ink/SettingInk.vue'
import SettingMorandi from '@/views/morandi/SettingMorandi.vue'
import SettingWatercolor from '@/views/watercolor/SettingWatercolor.vue'
import SettingAnimal from '@/views/animal/SettingAnimal.vue'
import SettingPixel from '@/views/pixel/SettingPixel.vue'

const HOME_COMPONENTS = [
  ['classic', HomeClassic], ['modern', HomeModern], ['ink', HomeInk],
  ['morandi', HomeMorandi], ['watercolor', HomeWatercolor],
  ['animal', HomeAnimal], ['pixel', HomePixel]
]

const SETTING_COMPONENTS = [
  ['classic', SettingClassic], ['modern', SettingModern], ['ink', SettingInk],
  ['morandi', SettingMorandi], ['watercolor', SettingWatercolor],
  ['animal', SettingAnimal], ['pixel', SettingPixel]
]

beforeEach(() => {
  setActivePinia(createPinia())
  clearUniStorage()
  uniLifecycle.onShowCbs.length = 0
  uniLifecycle.onHideCbs.length = 0
  uniLifecycle.onBackPressCbs.length = 0
})

describe('首页主题组件可渲染冒烟（provide("home") 契约）', () => {
  it.each(HOME_COMPONENTS)('%s 首页全链渲染出干支卡片', (_name, Comp) => {
    const wrapper = mount(Comp, {
      global: { provide: { home: reactive(useHomePage()) } }
    })
    expect(wrapper.find('.ganzhi-card').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('设置页主题组件可渲染冒烟（provide("setting") 契约）', () => {
  it.each(SETTING_COMPONENTS)('%s 设置页全链渲染出设置卡片', (_name, Comp) => {
    const wrapper = mount(Comp, {
      global: { provide: { setting: reactive(useSettingPage()) } }
    })
    expect(wrapper.find('.setting-card').exists()).toBe(true)
    wrapper.unmount()
  })
})
