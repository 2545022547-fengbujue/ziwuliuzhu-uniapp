/**
 * beijing-time 时区无关性测试（对应审查报告 2.1）
 *
 * 核心断言：
 * 1. UTC+8 设备上 getBeijingDate 幂等（返回原对象，现有行为零变化）；
 * 2. 非 UTC+8 设备（东京/伦敦）墙钟读数正确转换到北京时间；
 * 3. 同一 UTC 时刻，经 getBeijingDate 后各时区得到的干支完全一致
 *    （验证"调用方统一走北京墙钟"的完整管线）。
 *
 * 实现：Node 尊重 process.env.TZ（ICU），在 try/finally 中切换/恢复，
 * 不污染其他测试文件。
 */
import { describe, it, expect } from 'vitest'
import { getBeijingDate } from '@/utils/beijing-time.js'
import { getGanZhi } from '@/services/ganzhi.js'

const DEFAULT_TZ = process.env.TZ

function withTz(tz, fn) {
  process.env.TZ = tz
  try {
    return fn()
  } finally {
    process.env.TZ = DEFAULT_TZ
  }
}

describe('getBeijingDate 时区无关转换', () => {
  it('UTC+8 设备幂等返回原对象', () => {
    withTz('Asia/Shanghai', () => {
      const d = new Date('2026-05-26T12:30:00')
      expect(getBeijingDate(d)).toBe(d)
    })
  })

  it('UTC+9（东京）12:30 → 北京墙钟 11:30', () => {
    withTz('Asia/Tokyo', () => {
      const bj = getBeijingDate(new Date('2026-05-26T12:30:00'))
      expect(bj.getHours()).toBe(11)
      expect(bj.getMinutes()).toBe(30)
      expect(bj.getDate()).toBe(26)
    })
  })

  it('UTC+0（Etc/UTC）12:30 → 北京 20:30；23:30 → 次日 07:30（跨日边界）', () => {
    withTz('Etc/UTC', () => {
      const bj1 = getBeijingDate(new Date('2026-05-26T12:30:00'))
      expect(bj1.getHours()).toBe(20)
      expect(bj1.getDate()).toBe(26)

      const bj2 = getBeijingDate(new Date('2026-05-26T23:30:00'))
      expect(bj2.getHours()).toBe(7)
      expect(bj2.getDate()).toBe(27)
    })
  })

  it('同一 UTC 时刻，经 getBeijingDate 后各时区干支完全一致（完整管线）', () => {
    const utcInstant = Date.UTC(2026, 4, 26, 3, 0, 0) // 北京 2026-05-26 11:00
    let shanghai = null
    let tokyo = null
    let london = null
    withTz('Asia/Shanghai', () => {
      shanghai = getGanZhi(getBeijingDate(new Date(utcInstant))).day.ganZhi
    })
    withTz('Asia/Tokyo', () => {
      tokyo = getGanZhi(getBeijingDate(new Date(utcInstant))).day.ganZhi
    })
    withTz('Europe/London', () => {
      london = getGanZhi(getBeijingDate(new Date(utcInstant))).day.ganZhi
    })
    expect(tokyo).toBe(shanghai)
    expect(london).toBe(shanghai)
  })
})
