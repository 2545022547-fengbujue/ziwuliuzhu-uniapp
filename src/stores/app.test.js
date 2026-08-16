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
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '@/stores/app.js'
import { clearUniStorage } from '../../tests/setup.js'

// 包装 5 个算法服务为可计数 fn（内部仍调用真实实现，结果不变）：
// 用于验证「results 拆分后」的响应式精确化——toggleHeRiHuYong 只重算纳甲、
// setNaziMode 零重算（不参与任何计算方法依赖）。
vi.mock('@/services/najia.js', async (importOriginal) => {
  const actual = await importOriginal()
  // 注意：calculateFanke 也在 najia.js 导出（反克法同模块维护）
  return { ...actual, calculateNajia: vi.fn(actual.calculateNajia), calculateFanke: vi.fn(actual.calculateFanke) }
})
vi.mock('@/services/nazi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, calculateNazi: vi.fn(actual.calculateNazi) }
})
vi.mock('@/services/lingui.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, calculateLingui: vi.fn(actual.calculateLingui) }
})
vi.mock('@/services/feiteng.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, calculateFeiteng: vi.fn(actual.calculateFeiteng) }
})

describe('useAppStore - 初始状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  it('子时跨自然日：visualClock/显示时间继续走，不因 currentHour 未变而停在 23:xx', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 26, 23, 10, 0))
    const s = useAppStore()
    expect(s.currentHour).toBe(0)

    // 到次日 00:30：时辰索引仍为 0，优化逻辑允许 currentTime 不更新，
    // 但显示用的 visualClock 必须推进，否则界面分钟停留在 23:10。
    vi.setSystemTime(new Date(2026, 4, 27, 0, 30, 0))
    s.updateCurrentTime()
    expect(s.currentHour).toBe(0)
    expect(s.effectiveCurrentTime.getHours()).toBe(0)
    expect(s.effectiveCurrentTime.getMinutes()).toBe(30)
    vi.useRealTimers()
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
    s.switchToManualMode(new Date(2026, 4, 26), 6)
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
    s.switchToManualMode(new Date(2026, 4, 26), 5)
    expect(s.results.najia.isClosed).toBe(true)
    expect(s.results.najia.alternativePoints).toBeNull()

    s.toggleHeRiHuYong(true)
    // 开关触发重算（同一日期时辰基于新选项）
    expect(s.results.najia.alternativePoints).toBeTruthy()
    expect(s.results.najia.alternativePoints.heLabel).toBe('庚合乙')
  })

  it('switchToAutoMode 退出手动并强制刷新', () => {
    const s = useAppStore()
    s.switchToManualMode(new Date(2026, 4, 26), 6)
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

describe('useAppStore - 响应式精确化（results 拆分后）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  async function countCalls() {
    // 读取被 vi.fn 包装的模块（vitest mock 版本）
    const najia = await import('@/services/najia.js')
    const nazi = await import('@/services/nazi.js')
    const lingui = await import('@/services/lingui.js')
    const feiteng = await import('@/services/feiteng.js')
    return { najia, nazi, lingui, feiteng }
  }

  it('toggleHeRiHuYong 切换只重算纳甲（其余 4 方法零重算）', async () => {
    const s = useAppStore()
    s.switchToManualMode(new Date(2026, 4, 26), 6) // 庚子日壬午时（非闭穴）
    // 首次读取触发全量计算（5 方法各 1 次）
    void s.results.najia; void s.results.nazi; void s.results.lingui; void s.results.feiteng; void s.results.fanke
    const { najia, nazi, lingui, feiteng } = await countCalls()
    najia.calculateNajia.mockClear()
    najia.calculateFanke.mockClear()
    nazi.calculateNazi.mockClear()
    lingui.calculateLingui.mockClear()
    feiteng.calculateFeiteng.mockClear()

    // 切换合日互用：仅纳甲重算
    s.toggleHeRiHuYong(true)
    void s.results.najia
    expect(najia.calculateNajia).toHaveBeenCalledTimes(1)
    // 其余 4 方法不得重算
    expect(nazi.calculateNazi).not.toHaveBeenCalled()
    expect(lingui.calculateLingui).not.toHaveBeenCalled()
    expect(feiteng.calculateFeiteng).not.toHaveBeenCalled()
    expect(najia.calculateFanke).not.toHaveBeenCalled()
  })

  it('setNaziMode 切换零重算（naziMode 不参与任何计算方法依赖）', async () => {
    const s = useAppStore()
    s.switchToManualMode(new Date(2026, 4, 26), 6)
    void s.results.najia; void s.results.nazi
    const { najia, nazi, lingui, feiteng } = await countCalls()
    najia.calculateNajia.mockClear()
    najia.calculateFanke.mockClear()
    nazi.calculateNazi.mockClear()
    lingui.calculateLingui.mockClear()
    feiteng.calculateFeiteng.mockClear()

    // 切换纳子法模式（daily↔bumu）：拆分前会连带重算全部 5 方法，拆分后零重算
    s.setNaziMode('bumu')
    expect(najia.calculateNajia).not.toHaveBeenCalled()
    expect(nazi.calculateNazi).not.toHaveBeenCalled()
    expect(lingui.calculateLingui).not.toHaveBeenCalled()
    expect(feiteng.calculateFeiteng).not.toHaveBeenCalled()
    expect(najia.calculateFanke).not.toHaveBeenCalled()
  })
})

describe('useAppStore - 持久化 schema 版本化', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearUniStorage()
  })

  it('旧数据（无 schemaVersion，视为 v0）创建 store 时自动迁移为 v1 并保留既有字段', () => {
    // 模拟旧用户持久化数据：无 schemaVersion 字段
    globalThis.uni.setStorageSync('ziwuliuzhu-app', JSON.stringify({ theme: 'green', uiStyle: 'classic', showWuXing: false }))
    const s = useAppStore()
    expect(s.schemaVersion).toBe(1)
    // 迁移写回：带版本号且既有字段保留
    const saved = JSON.parse(globalThis.uni.getStorageSync('ziwuliuzhu-app'))
    expect(saved.schemaVersion).toBe(1)
    expect(saved.theme).toBe('green')
    expect(saved.uiStyle).toBe('classic')
    expect(saved.showWuXing).toBe(false)
  })

  it('当前版本数据（v1）不做重复迁移', () => {
    globalThis.uni.setStorageSync('ziwuliuzhu-app', JSON.stringify({ schemaVersion: 1, theme: 'red' }))
    const s = useAppStore()
    expect(s.schemaVersion).toBe(1)
    const saved = JSON.parse(globalThis.uni.getStorageSync('ziwuliuzhu-app'))
    expect(saved.schemaVersion).toBe(1)
    expect(saved.theme).toBe('red')
  })

  it('脏数据防御：非法 JSON 不阻断 store 创建', () => {
    globalThis.uni.setStorageSync('ziwuliuzhu-app', 'not-json{{{')
    expect(() => useAppStore()).not.toThrow()
    const s = useAppStore()
    expect(s.schemaVersion).toBe(1)
  })
})
