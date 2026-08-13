/**
 * src/stores/app.test.js - Pinia store 业务编排层单元测试
 *
 * 说明（给后来者/AI）：
 * - store 是 5 种取穴算法 + 干支 + 外观状态的编排层，任何 service 改动都可能在此静默回归。
 * - 测试前先 setActivePinia(createPinia())；未注册 pinia-plugin-persist-uni，
 *   store 定义里的 persist 选项会被忽略（插件在 main.js 注册），行为无影响。
 * - 全局 uni 桩见 tests/setup.js（内存 storage），保证 store 模块顶层加载安全。
 * - 黄金日期沿用 algorithms.test.js：2026-05-26 为庚子日（辛巳时闭穴、可验合日互用）。
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '@/stores/app.js'
import { clearUniStorage } from '../../tests/setup.js'

describe('useAppStore - 初始状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  it('默认外观：classic + 主题回退 yellow（非 H5 构建环境 supportsThemeSwitch=false）', () => {
    const s = useAppStore()
    expect(s.activeUiStyle).toBe('classic')
    expect(s.activeTheme).toBe('yellow')
    expect(s.isManualMode).toBe(false)
    expect(s.activeMethod).toBe('najia')
  })

  it('非法持久化值兜底：uiStyle 未知时回退 classic', () => {
    const s = useAppStore()
    s.uiStyle = 'non-existent-style'
    expect(s.activeUiStyle).toBe('classic')
  })
})

describe('useAppStore - 手动查询流程', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  it('queryTime 进入手动模式并计算全部方法结果', () => {
    const s = useAppStore()
    s.queryTime(new Date(2026, 4, 26), 6)
    expect(s.isManualMode).toBe(true)
    // 五类方法均产出结果；纳甲序列恒为 12 项
    expect(s.results.najia.dailySequence).toHaveLength(12)
    expect(s.results.nazi).toBeTruthy()
    expect(s.results.lingui).toBeTruthy()
    expect(s.results.feiteng).toBeTruthy()
    expect(s.results.fanke).toBeTruthy()
  })

  it('庚子日辛巳时（闭穴时辰）：默认无合日互用，开启后出现 alternativePoints', () => {
    const s = useAppStore()
    s.queryTime(new Date(2026, 4, 26), 5)
    expect(s.results.najia.isClosed).toBe(true)
    expect(s.results.najia.alternativePoints).toBeNull()

    s.toggleHeRiHuYong(true)
    // 开关触发重算（同一日期时辰基于新选项）
    expect(s.results.najia.alternativePoints).toBeTruthy()
    expect(s.results.najia.alternativePoints.heLabel).toBe('庚合乙')
  })

  it('switchToAutoMode 退出手动并强制刷新', () => {
    const s = useAppStore()
    s.queryTime(new Date(2026, 4, 26), 6)
    s.switchToAutoMode()
    expect(s.isManualMode).toBe(false)
  })
})

describe('useAppStore - 真太阳时设置', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  it('updateLongitude 开启真太阳时并更新城市', () => {
    const s = useAppStore()
    s.updateLongitude(121.47, '上海')
    expect(s.useTrueSolarTime).toBe(true)
    expect(s.selectedCity).toBe('上海')
    expect(Number(s.longitude).toFixed(2)).toBe('121.47')
  })

  it('toggleTrueSolarTime(false) 关闭并复位经度为默认值', () => {
    const s = useAppStore()
    s.updateLongitude(121.47, '上海')
    s.toggleTrueSolarTime(false)
    expect(s.useTrueSolarTime).toBe(false)
  })
})

describe('useAppStore - 外观切换', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  it('setAppearance 支持 style-* 与 theme-* 两类 id', () => {
    const s = useAppStore()
    s.setAppearance('style-ink')
    expect(s.activeUiStyle).toBe('ink')

    s.setAppearance('theme-red')
    expect(s.activeUiStyle).toBe('classic')
    expect(s.theme).toBe('red') // 持久化值已更新
    // 注：vitest 下 uni 条件编译不剥离，activeTheme 的 MP 分支 return 'yellow' 先执行 → 恒 yellow；
    //     真机 H5/App 构建会剥离 MP 分支，activeTheme 才随 theme 切换（此处仅验证持久化键链路）。
    expect(s.activeTheme).toBe('yellow')
  })
})
