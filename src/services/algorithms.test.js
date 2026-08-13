/**
 * src/services/algorithms.test.js - 取穴算法单元测试（黄金用例 + 不变量）
 *
 * 说明（给后来者/AI）：
 * - 黄金断言迁移自 tests/verify-algorithms.js（esbuild 打包版），
 *   本文件直接用 vitest 的模块解析 import 真实 src/services 源码，
 *   避免 esbuild 临时打包步骤，也避免复制业务常量（防漂移）。
 * - verify-algorithms.js 保留在 npm test 数据门禁中，双轨并行；
 *   若新增用例请优先加在本文件，再决定是否同步到数据门禁脚本。
 */
import { describe, it, expect } from 'vitest'
import { getGanZhi, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/services/ganzhi.js'
import { WU_SHU_DUN } from '@/data/constants.js'
import { calculateNajia, calculateFanke } from '@/services/najia.js'
import { calculateNazi } from '@/services/nazi.js'
import { calculateLingui } from '@/services/lingui.js'
import { calculateFeiteng } from '@/services/feiteng.js'

/**
 * 构造指定日期 + 时辰索引的完整干支对象。
 * 时干 = 五鼠遁(日干) 顺推 hourIndex；时支 = hourIndex 对应地支。
 * 与 verify-algorithms.js 的实现保持一致。
 */
function makeGanZhi(date, hourIndex) {
  const base = getGanZhi(date, 116.407, false)
  const dayStem = base.day.heavenlyStem
  const hourStem = HEAVENLY_STEMS[((WU_SHU_DUN[dayStem] || 0) + hourIndex) % 10]
  const hourBranch = EARTHLY_BRANCHES[hourIndex]
  return {
    ...base,
    hour: {
      heavenlyStem: hourStem,
      earthlyBranch: hourBranch,
      ganZhi: hourStem + hourBranch
    }
  }
}

const pointCodes = (points) => (points || []).map(p => p.code)

describe('干支计算（黄金值）', () => {
  it('2026-05-26 为庚子日，午时（idx6）为壬午', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 6)
    expect(gz.day.ganZhi).toBe('庚子')
    expect(gz.hour.ganZhi).toBe('壬午')
  })

  it('2026-05-04 为戊寅日，巳时（idx5）为丁巳', () => {
    const gz = makeGanZhi(new Date(2026, 4, 4), 5)
    expect(gz.day.ganZhi).toBe('戊寅')
    expect(gz.hour.ganZhi).toBe('丁巳')
  })
})

describe('灵龟八法（黄金值）', () => {
  it('庚子日壬午时：宫位 4，开 GB41+TE5', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 6)
    const r = calculateLingui(gz, 6)
    expect(r.palace.actualPalace).toBe(4)
    expect(pointCodes(r.openPoints)).toEqual(['GB41', 'TE5'])
  })

  it('戊寅日丁巳时：宫位 7，开 SI3+BL62', () => {
    const gz = makeGanZhi(new Date(2026, 4, 4), 5)
    const r = calculateLingui(gz, 5)
    expect(r.palace.actualPalace).toBe(7)
    expect(pointCodes(r.openPoints)).toEqual(['SI3', 'BL62'])
  })

  // 以下黄金值迁移自 tests/verify-lingui-fix.js（表10-16 丁壬=6/戊癸=5 修复回归用例），
  // 该脚本已废弃（复制 src 常量表有漂移风险），断言并入本文件的真实实现测试。
  it('庚子日己卯时：开 GB41+TE5（足临泣+外关）', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 3)
    expect(pointCodes(calculateLingui(gz, 3).openPoints)).toEqual(['GB41', 'TE5'])
  })

  it('庚子日乙酉时：开 GB41+TE5（足临泣+外关）', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 9)
    expect(pointCodes(calculateLingui(gz, 9).openPoints)).toEqual(['GB41', 'TE5'])
  })

  it('辛丑日甲午时：开 SP4+PC6（公孙+内关）', () => {
    const gz = makeGanZhi(new Date(2026, 4, 27), 6)
    expect(pointCodes(calculateLingui(gz, 6).openPoints)).toEqual(['SP4', 'PC6'])
  })
})

describe('灵龟八法结构不变量（多日 × 12 时辰）', () => {
  // 八脉交会穴对集合（code 集合，用于断言开穴必属于交会穴）
  const PAIR_CODES = new Set(['GB41', 'TE5', 'SP4', 'PC6', 'SI3', 'BL62', 'KI6', 'LU7'])

  // 从 2026-01-01 起取 5 个不同日干日期，覆盖阳/阴日两类
  const stems = new Set()
  const dates = []
  const d = new Date(2026, 0, 1)
  while (dates.length < 5 && stems.size < 10) {
    const gz = getGanZhi(d, 116.407, false)
    if (!stems.has(gz.day.heavenlyStem)) {
      stems.add(gz.day.heavenlyStem)
      dates.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }

  it.each(dates.map((date, i) => [`日期${i + 1}: ${date.toISOString().slice(0, 10)}`, date]))(
    '%s 的 12 时辰：宫位合法、开穴必属八脉交会穴、阳除9/阴除6 自洽',
    (_label, date) => {
      for (let h = 0; h < 12; h++) {
        const gz = makeGanZhi(date, h)
        const r = calculateLingui(gz, h)
        const p = r.palace
        // 宫位 1-9 合法（5 中宫会被转换为 2/8，故实际宫位不含 5）
        expect(p.actualPalace).toBeGreaterThanOrEqual(1)
        expect(p.actualPalace).toBeLessThanOrEqual(9)
        expect(p.actualPalace).not.toBe(5)
        // 九宫数校验：阳日除9、阴日除6
        const mod = p.dayYinYang === '阳' ? 9 : 6
        expect(p.palaceNumber).toBe(p.totalSum % mod === 0 ? mod : p.totalSum % mod)
        // 开穴必属于八脉交会穴对
        for (const pt of r.openPoints) {
          expect(PAIR_CODES.has(pt.code)).toBe(true)
        }
      }
    }
  )
})

describe('飞腾八法（黄金值）', () => {
  it('壬时开 SP4+PC6；丁时开 KI6+LU7', () => {
    const gz1 = makeGanZhi(new Date(2026, 4, 26), 6)
    expect(pointCodes(calculateFeiteng(gz1, 6).openPoints)).toEqual(['SP4', 'PC6'])
    const gz2 = makeGanZhi(new Date(2026, 4, 4), 5)
    expect(pointCodes(calculateFeiteng(gz2, 5).openPoints)).toEqual(['KI6', 'LU7'])
  })
})

describe('飞腾八法结构不变量（多日 × 12 时辰）', () => {
  const PAIR_CODES = new Set(['GB41', 'TE5', 'SP4', 'PC6', 'SI3', 'BL62', 'KI6', 'LU7'])

  const stems = new Set()
  const dates = []
  const d = new Date(2026, 0, 1)
  while (dates.length < 3 && stems.size < 10) {
    const gz = getGanZhi(d, 116.407, false)
    if (!stems.has(gz.day.heavenlyStem)) {
      stems.add(gz.day.heavenlyStem)
      dates.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }

  it.each(dates.map((date, i) => [`日期${i + 1}: ${date.toISOString().slice(0, 10)}`, date]))(
    '%s 的 12 时辰：开穴为空或为一对八脉交会穴',
    (_label, date) => {
      for (let h = 0; h < 12; h++) {
        const gz = makeGanZhi(date, h)
        const r = calculateFeiteng(gz, h)
        expect(r.openPoints.length === 0 || r.openPoints.length === 2).toBe(true)
        for (const pt of r.openPoints) {
          expect(PAIR_CODES.has(pt.code)).toBe(true)
        }
      }
    }
  )
})

describe('纳子法结构不变量（12 时辰全覆盖）', () => {
  // 十二经（井荥输经合 五输穴按顺序：金水木火土 / 阳经井金起始，阴经井木起始）
  const MERIDIAN_CODES = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR']

  it('12 时辰各自经络合法、五输穴 5 个、本/原/母/子穴齐全', () => {
    for (let h = 0; h < 12; h++) {
      const gz = makeGanZhi(new Date(2026, 4, 26), h)
      const r = calculateNazi(gz, h)
      expect(MERIDIAN_CODES).toContain(r.hourMeridian.code)
      expect(r.openPoints).toHaveLength(5)
      expect(r.benPoint.code).toBeTruthy()
      expect(r.yuanPoint.code).toBeTruthy()
      expect(r.muPoint.code).toBeTruthy()
      expect(r.ziPoint.code).toBeTruthy()
    }
  })

  it('12 时辰经络覆盖完整（十二经各出现一次）', () => {
    const gz = new Date(2026, 4, 26)
    const seen = new Set()
    for (let h = 0; h < 12; h++) {
      seen.add(calculateNazi(makeGanZhi(gz, h), h).hourMeridian.code)
    }
    expect(seen.size).toBe(12)
  })
})

describe('纳子法（黄金值）', () => {
  it('子时值胆经，五输穴顺序与本/原/母/子穴正确', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 0)
    const r = calculateNazi(gz, 0)
    expect(r.hourMeridian.code).toBe('GB')
    expect(pointCodes(r.openPoints)).toEqual(['GB44', 'GB43', 'GB41', 'GB38', 'GB34'])
    expect(r.benPoint.code).toBe('GB41')
    expect(r.yuanPoint.code).toBe('GB40')
    expect(r.muPoint.code).toBe('GB43')
    expect(r.ziPoint.code).toBe('GB38')
  })
})

describe('纳甲法（黄金值 + 合日互用）', () => {
  it('庚子日壬午时：序列 12 项、开穴 6 时辰、非闭穴', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 6)
    const r = calculateNajia(gz, 6)
    expect(r.dailySequence).toHaveLength(12)
    expect(r.dailySequence.filter(item => item.isOpen)).toHaveLength(6)
    expect(r.isClosed).toBe(false)
  })

  it('庚子日辛巳时：本法闭穴，开启合日互用后提供替代穴位（庚合乙）', () => {
    const gz = makeGanZhi(new Date(2026, 4, 26), 5)
    const withHy = calculateNajia(gz, 5, { enableHeRiHuYong: true })
    expect(withHy.isClosed).toBe(true)
    expect(withHy.alternativePoints).toBeTruthy()
    expect(withHy.alternativePoints.openPoints.length).toBeGreaterThan(0)
    expect(withHy.alternativePoints.heLabel).toBe('庚合乙')

    const withoutHy = calculateNajia(gz, 5)
    expect(withoutHy.alternativePoints).toBeNull()
  })

  it('戊日丁巳时反克开穴 PC7', () => {
    const gz = makeGanZhi(new Date(2026, 4, 4), 5)
    expect(pointCodes(calculateFanke(gz, 5).openPoints)).toEqual(['PC7'])
  })
})

describe('纳甲法结构不变量（多日 × 12 时辰冒烟）', () => {
  // 从 2026-01-01 起找 5 个不同日干日期，每天遍历 12 时辰断言结构自洽
  const stems = new Set()
  const dates = []
  const d = new Date(2026, 0, 1)
  while (dates.length < 5 && stems.size < 10) {
    const gz = getGanZhi(d, 116.407, false)
    if (!stems.has(gz.day.heavenlyStem)) {
      stems.add(gz.day.heavenlyStem)
      dates.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }

  it.each(dates.map((date, i) => [`日期${i + 1}: ${date.toISOString().slice(0, 10)}`, date]))(
    '%s 的 12 时辰：序列长度/开穴数/闭穴一致性自洽',
    (_label, date) => {
      for (let h = 0; h < 12; h++) {
        const gz = makeGanZhi(date, h)
        const r = calculateNajia(gz, h)
        expect(r.dailySequence).toHaveLength(12)
        expect(r.dailySequence.filter(item => item.isOpen)).toHaveLength(6)
        // isClosed 与 sequence 中当前时辰 isOpen 一致（sequence 按时辰索引对齐，见 najia.js calculateNajia）
        const current = r.dailySequence[h]
        expect(r.isClosed).toBe(!current.isOpen)
      }
    }
  )
})
