/**
 * 主题体系一致性测试（审查缺口补齐）
 *
 * 覆盖：
 * 1. useRootClasses：classic → theme-<id>；非 classic → ui-<id>；ink 额外 ink-bg-<period>
 * 2. themes.js 完整性：THEME_OPTIONS/UI_STYLE_OPTIONS 结构与 id；UI_STYLE_PRIMARY/CHROME
 *    与 6 套 UI 风格一一对应；THEME_CHROME/UI_STYLE_CHROME 引用的 tabbar 图标真实存在
 *    （守护 resvg 生成脚本对 themes.js 的正则提取，防双源漂移）
 * 3. SettingIcon H5 分支：5 个 name 都能渲染唯一的 svg（v-if/v-else-if/v-else 链），
 *    about 落到 methods 同图分支；App 分支的 image src 映射非空（about 走 methods 别名）
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore, __setSupportsThemeSwitchForTest } from '@/stores/app.js'
import { useRootClasses } from '@/composables/useRootClasses.js'
import { THEME_OPTIONS, THEME_CHROME, UI_STYLE_OPTIONS, UI_STYLE_PRIMARY, UI_STYLE_CHROME } from '@/config/themes.js'
import SettingIcon from '@/components/SettingIcon.vue'
import { clearUniStorage } from './setup.js'
import fs from 'node:fs'
import path from 'node:path'
import { vi } from 'vitest'

const UI_STYLE_IDS = UI_STYLE_OPTIONS.map((s) => s.id)
const THEME_IDS = THEME_OPTIONS.map((t) => t.id)

beforeEach(() => {
  setActivePinia(createPinia())
  clearUniStorage()
  // vitest 无条件编译宏，默认 activeUiStyle 恒回退 classic；开启以覆盖主题派生
  __setSupportsThemeSwitchForTest(true)
})

describe('useRootClasses 主题根类契约', () => {
  it('classic → theme-<activeTheme>，无 ui-* 前缀', () => {
    const store = useAppStore()
    store.uiStyle = 'classic'
    store.theme = 'red'
    const rootClasses = useRootClasses()
    // 注：vitest 不剥离 uni 条件编译，activeTheme 的 #ifdef MP-WEIXIN 分支
    // return 'yellow' 先执行 → 恒 yellow（与 app.test.js:148 文档化的怪癖一致）；
    // 这里验证的是「classic → theme-* 且无 ui-* 前缀」的派生规则本身。
    expect(rootClasses.value).toEqual(['theme-yellow'])
    expect(rootClasses.value.some((c) => c.startsWith('ui-'))).toBe(false)
  })

  it('非 classic → ui-<uiStyle>', () => {
    const store = useAppStore()
    store.uiStyle = 'morandi'
    const rootClasses = useRootClasses()
    expect(rootClasses.value).toContain('ui-morandi')
  })

  it('ink 额外追加 ink-bg-<period>（18:30 → dusk）', () => {
    vi.useFakeTimers()
    const store = useAppStore()
    store.uiStyle = 'ink'
    vi.setSystemTime(new Date('2026-05-26T18:30:00'))
    store.refreshVisualClock() // visualClock 取 fake 时钟 → inkBackgroundPeriod=dusk
    const rootClasses = useRootClasses()
    expect(rootClasses.value).toEqual(['ui-ink', 'ink-bg-dusk'])
    vi.useRealTimers()
  })
})

describe('themes.js 主题目录完整性', () => {
  it('经典四色 4 个 id 且 THEME_CHROME 一一对应', () => {
    expect(THEME_OPTIONS.length).toBe(4)
    expect(THEME_IDS).toEqual(['yellow', 'black', 'green', 'red'])
    expect(Object.keys(THEME_CHROME).sort()).toEqual(THEME_IDS.slice().sort())
  })

  it('6 套独立 UI 风格与 PRIMARY/CHROME 键一一对应', () => {
    expect(UI_STYLE_IDS).toEqual(['modern', 'ink', 'morandi', 'watercolor', 'animal', 'pixel'])
    expect(Object.keys(UI_STYLE_PRIMARY).sort()).toEqual(UI_STYLE_IDS.slice().sort())
    expect(Object.keys(UI_STYLE_CHROME).sort()).toEqual(UI_STYLE_IDS.slice().sort())
  })

  it('CHROME 引用的 tabbar 图标文件全部存在（防资源缺失）', () => {
    const tabbarDir = path.resolve(__dirname, '../src/static/tabbar')
    const chrome = { ...THEME_CHROME, ...UI_STYLE_CHROME }
    for (const [id, cfg] of Object.entries(chrome)) {
      for (const key of ['homeIconPath', 'homeSelectedIconPath', 'settingIconPath', 'settingSelectedIconPath']) {
        const rel = cfg[key]
        expect(rel, `${id}.${key} 缺失路径`).toBeTruthy()
        const file = path.join(tabbarDir, path.basename(rel))
        expect(fs.existsSync(file), `${rel} 文件不存在`).toBe(true)
      }
    }
  })
})

describe('SettingIcon 图标组件', () => {
  const globalConfig = {
    config: { compilerOptions: { isCustomElement: (tag) => ['image', 'view', 'text'].includes(tag) } }
  }

  it.each(['solar', 'style', 'personal', 'methods', 'about'])('name=%s 渲染唯一 svg（H5 分支）', (name) => {
    const wrapper = mount(SettingIcon, { props: { name }, global: globalConfig })
    const svgs = wrapper.findAll('svg')
    expect(svgs.length).toBe(1)
    expect(svgs[0].classes()).toContain('svg-icon')
  })

  it('about 与 methods 渲染同一 SVG（v-else 分支复用）', () => {
    const a = mount(SettingIcon, { props: { name: 'about' }, global: globalConfig })
    const m = mount(SettingIcon, { props: { name: 'methods' }, global: globalConfig })
    expect(a.html()).toBe(m.html())
  })

  it('App 分支 image src 映射非空（about 走 methods 别名）', () => {
    const store = useAppStore()
    store.uiStyle = 'animal'
    for (const name of ['solar', 'style', 'personal', 'methods', 'about']) {
      const wrapper = mount(SettingIcon, { props: { name }, global: globalConfig })
      const img = wrapper.find('image')
      expect(img.exists(), `${name} 应有 image（App 分支）`).toBe(true)
      expect(img.attributes('src'), `${name} src 不应为空`).toBeTruthy()
    }
  })
})
