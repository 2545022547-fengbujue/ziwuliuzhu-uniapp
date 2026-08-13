/**
 * src/utils/date.test.js - 日期工具单元测试
 *
 * 覆盖：
 *   1. formatDate 补零与跨月/跨年
 *   2. getHourIndexFromDate 24 小时边界（子时跨日、每时辰起始/末尾）
 *   3. HOUR_OPTIONS 与 SHICHEN_START_HOURS 的一致性不变量
 *   4. 非法输入的防御行为
 */
import { describe, it, expect } from 'vitest'
import { formatDate, getHourIndexFromDate, HOUR_OPTIONS, SHICHEN_START_HOURS } from '@/utils/date.js'

describe('formatDate', () => {
  it('补零：月/日不足两位时前补 0', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatDate(new Date(2026, 4, 9))).toBe('2026-05-09')
  })

  it('跨月/跨年边界', () => {
    expect(formatDate(new Date(2025, 11, 31))).toBe('2025-12-31')
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('getHourIndexFromDate', () => {
  it('子时 23:00-23:59 归 0（跨日边界）', () => {
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 23, 0))).toBe(0)
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 23, 59))).toBe(0)
  })

  it('子时 00:00-00:59 归 0（凌晨归子时）', () => {
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 0, 0))).toBe(0)
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 0, 59))).toBe(0)
  })

  it('每个时辰的起始整点映射到对应索引（与 SHICHEN_START_HOURS 一致）', () => {
    SHICHEN_START_HOURS.forEach((startHour, idx) => {
      const d = new Date(2026, 4, 26, startHour, 0, 0)
      expect(getHourIndexFromDate(d)).toBe(idx)
    })
  })

  it('每个时辰的末尾分钟仍归当前索引', () => {
    // 丑时 01:00-02:59 → idx 1；02:59 仍属丑时
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 2, 59))).toBe(1)
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 4, 59))).toBe(2)
    expect(getHourIndexFromDate(new Date(2026, 4, 26, 22, 59))).toBe(11)
  })

  it('非法日期对象回退子时（不抛异常）', () => {
    expect(getHourIndexFromDate(new Date('invalid'))).toBe(0)
  })
})

describe('HOUR_OPTIONS 与 SHICHEN_START_HOURS 一致性', () => {
  it('选项数量一致且 value 从 0 递增', () => {
    expect(HOUR_OPTIONS).toHaveLength(SHICHEN_START_HOURS.length)
    HOUR_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(i)
    })
  })

  it('选项标签包含对应起始小时描述（抽查首末）', () => {
    expect(HOUR_OPTIONS[0].label).toContain('23:00')
    expect(HOUR_OPTIONS[11].label).toContain('21:00')
  })
})
