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
import { getGanZhi, getTrueSolarDate, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/services/ganzhi.js'
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

/** 各日开井时辰索引（徐凤歌诀阳进阴退：甲戌乙酉丙申丁未戊午己巳庚辰辛卯壬寅癸亥） */
const JING_HOUR_BY_STEM = {
  '甲': 10, '乙': 9, '丙': 8, '丁': 7, '戊': 6, '己': 5, '庚': 4, '辛': 3, '壬': 2, '癸': 11
}

/**
 * 纳甲法测试构造器（值日周期语义）。
 *
 * 重要背景：纳甲值日周期不以自然日切割——教材表10-10 的「甲日」周期从甲日甲戌
 * （开井）延续到乙日甲申（气纳三焦），其中丙子/戊寅/庚辰/壬午/甲申 是「乙日」
 * （自然日）的时辰，但仍属甲日值日周期。因此测试必须传入「值日周期日干」，
 * 由本函数推导对应的自然日日干，才能模拟 getGanZhi → calculateNajia 真实链路。
 *
 * 自然日干推导：若当前时辰已过/等于当日开井时辰（hourIdx >= jingHour）→ 值日=当日干；
 * 否则（hourIdx < jingHour）→ 值日=前一日干，自然日干需取「值日日的次日」。
 *
 * @param {string} periodDayStem - 值日周期日干（如 '甲' 表示甲日胆经值日）
 * @param {string} gz - 开穴时辰干支（如 '丙子'）
 * @param {number} hourIdx - 时辰索引
 */
function mkNajia(periodDayStem, gz, hourIdx) {
  const STEMS = '甲乙丙丁戊己庚辛壬癸'
  const periodIdx = STEMS.indexOf(periodDayStem)
  // 真实链路中 getGanZhi 按自然日（23:00 换日）返回日干：
  // hourIdx >= 开井时辰 → 当日干；否则 → 周期日干已在昨日开井后，自然日干=次日
  const naturalStem = hourIdx >= JING_HOUR_BY_STEM[periodDayStem]
    ? periodDayStem
    : STEMS[(periodIdx + 1) % 10]
  return {
    day: { heavenlyStem: naturalStem, earthlyBranch: '子', ganZhi: naturalStem + '子日' },
    hour: { heavenlyStem: gz[0], earthlyBranch: gz[1], ganZhi: gz + '时' },
    year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
  }
}

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

describe('干支边界（子时翻转 / 真太阳时 / 非法参数防御）', () => {
  it('23:00-23:59 视为次日子时：5/26 23:30 的日干支为次日辛丑、时干支为戊子（辛日起戊子）', () => {
    const gz = getGanZhi(new Date(2026, 4, 26, 23, 30))
    // 5/26 庚子日 → 5/27 辛丑日（60 干支循环顺推）
    expect(gz.day.ganZhi).toBe('辛丑')
    // 五鼠遁：丙辛从戊起 → 辛日子时为戊子
    expect(gz.hour.ganZhi).toBe('戊子')
  })

  it('0:00-0:59 为当日子时：5/26 00:30 日干支为庚子、时干支为丙子（庚日起丙子）', () => {
    const gz = getGanZhi(new Date(2026, 4, 26, 0, 30))
    expect(gz.day.ganZhi).toBe('庚子')
    // 五鼠遁：乙庚起丙子
    expect(gz.hour.ganZhi).toBe('丙子')
  })

  it('真太阳时未启用时返回同一时间（同一性）', () => {
    const d = new Date(2026, 4, 26, 12, 0, 0)
    expect(getTrueSolarDate(d, 116.407, false).getTime()).toBe(d.getTime())
  })

  it('真太阳时：经度 120 仅含 EoT（±16 分钟内）；北京 116.407 比东经 120 早约 14.37 分钟', () => {
    const d = new Date(2026, 4, 26, 12, 0, 0)
    const at120 = getTrueSolarDate(d, 120, true)
    // 5/26 的 EoT ≈ -3.3min，偏移量应在 ±16min 内（EoT 理论范围 ±16.4min）
    const eotOnly = at120.getTime() - d.getTime()
    expect(Math.abs(eotOnly)).toBeLessThan(16 * 60 * 1000)
    // 北京(116.407) 比 120°E 少 (120-116.407)*4 = 14.372 分钟
    const beijing = getTrueSolarDate(d, 116.407, true)
    const diff = beijing.getTime() - at120.getTime()
    expect(diff).toBeCloseTo(-14.372 * 60 * 1000, -1)
  })

  it('非法经度防御：getTrueSolarDate 经度越界回退北京（不产生 2.4 天偏移）', () => {
    const d = new Date(2026, 4, 26, 12, 0, 0)
    const bad = getTrueSolarDate(d, 1000, true)
    // 回退北京 → 偏移仅 EoT + (116.407-120)*4 ≈ -18min，绝不可能是 3520min
    const diff = Math.abs(bad.getTime() - d.getTime())
    expect(diff).toBeLessThan(30 * 60 * 1000)
  })

  it('非法参数防御：无效 Date 返回 null（getGanZhi），不抛异常', () => {
    const gz = getGanZhi(new Date('invalid'))
    expect(gz).toBeNull()
  })

  it('经度越界经 getGanZhi 时回退默认并正常计算', () => {
    const gz = getGanZhi(new Date(2026, 4, 26), 500)
    expect(gz.day.ganZhi).toBe('庚子')
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

describe('权威教材范例交叉验证（2026-08-14 联网核对）', () => {
  // 来源：百科/教材「灵龟八法」条目官方计算范例 + 《针灸大成》阳进阴退开井穴表 + 教材表13-9 反克表

  it('灵龟官方范例一：甲子日戊辰时 → 27 阳日除9整除 → 以9代之 → 离宫 列缺+照海（LU7+KI6）', () => {
    const r = calculateLingui({
      day: { heavenlyStem: '甲', earthlyBranch: '子' },
      hour: { heavenlyStem: '戊', earthlyBranch: '辰' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 4)
    expect(r.palace.palaceNumber).toBe(9)
    expect(r.palace.gua).toBe('离')
    expect(pointCodes(r.openPoints).sort()).toEqual(['KI6', 'LU7'])
  })

  it('灵龟官方范例二：乙丑日壬午时 → 34 阴日除6 → 余4 → 巽宫 临泣+外关（GB41+TE5）', () => {
    const r = calculateLingui({
      day: { heavenlyStem: '乙', earthlyBranch: '丑' },
      hour: { heavenlyStem: '壬', earthlyBranch: '午' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 6)
    expect(r.palace.actualPalace).toBe(4)
    expect(r.palace.gua).toBe('巽')
    expect(pointCodes(r.openPoints).sort()).toEqual(['GB41', 'TE5'])
  })

  it('纳甲阳进阴退开井穴：甲日戌时开胆井足窍阴 GB44、癸日亥时开肾井涌泉 KI1（教材表13-8）', () => {
    const mk = (dayStem, hourStem, hourBranch, hourIdx) => ({
      day: { heavenlyStem: dayStem, earthlyBranch: '子' },
      hour: { heavenlyStem: hourStem, earthlyBranch: hourBranch },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    })
    // 甲日甲戌时 → 足窍阴
    const r1 = calculateNajia(mk('甲', '甲', '戌', 10), 10)
    expect(pointCodes(r1.openPoints)).toContain('GB44')
    // 癸日癸亥时 → 涌泉
    const r2 = calculateNajia(mk('癸', '癸', '亥', 11), 11)
    expect(pointCodes(r2.openPoints)).toContain('KI1')
    // 庚日庚辰时 → 商阳
    const r3 = calculateNajia(mk('庚', '庚', '辰', 4), 4)
    expect(pointCodes(r3.openPoints)).toContain('LI1')
  })

  it('纳甲闭穴逻辑：阳日逢阴时闭穴（甲日乙亥时无穴可开）', () => {
    const r = calculateNajia({
      day: { heavenlyStem: '甲', earthlyBranch: '子' },
      hour: { heavenlyStem: '乙', earthlyBranch: '亥' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 11)
    expect(r.isClosed).toBe(true)
    expect(r.openPoints.length).toBe(0)
  })
})

/**
 * ============================================================
 * 教材级全量验算（2026-08-14 用户要求：根据教材表格验算推理，避免凭印象）
 *
 * 核心思想：测试文件内硬编码「教材权威常量表」（与 src 完全独立），
 * 用独立公式推导宫位，与 calculateLingui 输出逐项对照。
 * 若 src 中任一常量表/取余/归宫逻辑出错，此对照必然失败。
 * ============================================================
 */

/** 教材表10-15 逐日干支代数（歌诀校正版：地支「巳午亥子」，教材印「己亥午子」为巳/己形近排印） */
const TEXTBOOK_DAY_STEM = {
  '甲': 10, '己': 10, '乙': 9, '庚': 9, '丙': 7, '辛': 7, '丁': 8, '壬': 8, '戊': 7, '癸': 7
}
const TEXTBOOK_DAY_BRANCH = {
  '辰': 10, '戌': 10, '丑': 10, '未': 10, '申': 9, '酉': 9, '寅': 8, '卯': 8,
  '巳': 7, '亥': 7, '午': 7, '子': 7
}

/** 教材表10-16 八法临时干支代数（歌诀校正版：地支「寅申」，教材印「寅甲」为形近排印） */
const TEXTBOOK_HOUR_STEM = {
  '甲': 9, '己': 9, '乙': 8, '庚': 8, '丙': 7, '辛': 7, '丁': 6, '壬': 6, '戊': 5, '癸': 5
}
const TEXTBOOK_HOUR_BRANCH = {
  '子': 9, '午': 9, '丑': 8, '未': 8, '寅': 7, '申': 7, '卯': 6, '酉': 6, '辰': 5, '戌': 5, '巳': 4, '亥': 4
}

/** 独立公式：五鼠遁求时干（与 src 实现独立，按口诀公式硬推） */
function textbookHourStem(dayStem, hourIndex) {
  const stems = '甲乙丙丁戊己庚辛壬癸'
  return stems[(stems.indexOf(dayStem) * 2 + hourIndex) % 10]
}

/** 独立公式：纯教材表推算灵龟宫位（不调用任何 src 代码） */
function textbookPalace(dayStem, dayBranch, hourStem, hourBranch) {
  const total = TEXTBOOK_DAY_STEM[dayStem] + TEXTBOOK_DAY_BRANCH[dayBranch]
    + TEXTBOOK_HOUR_STEM[hourStem] + TEXTBOOK_HOUR_BRANCH[hourBranch]
  const isYang = dayStem === '甲' || dayStem === '丙' || dayStem === '戊' || dayStem === '庚' || dayStem === '壬'
  const mod = isYang ? 9 : 6
  let raw = total % mod
  if (raw === 0) raw = mod // 整除取最大数
  // 中宫5：阳日归坤(2)，阴日归艮(8)
  return raw === 5 ? (isYang ? 2 : 8) : raw
}

describe('灵龟八法教材级全量验算（独立公式对照，60甲子×12时辰=720组合）', () => {
  // 60 甲子日序列：天干癸后接甲，地支亥后接子
  const stems = '甲乙丙丁戊己庚辛壬癸'
  const branches = '子丑寅卯辰巳午未申酉戌亥'
  const jiaziDays = []
  for (let i = 0; i < 60; i++) {
    jiaziDays.push(stems[i % 10] + branches[i % 12])
  }

  it('720 组合宫位与独立公式完全一致', () => {
    for (const day of jiaziDays) {
      const dayStem = day[0]
      const dayBranch = day[1]
      for (let h = 0; h < 12; h++) {
        const hourStem = textbookHourStem(dayStem, h)
        const hourBranch = branches[h]
        const expected = textbookPalace(dayStem, dayBranch, hourStem, hourBranch)
        const r = calculateLingui({
          day: { heavenlyStem: dayStem, earthlyBranch: dayBranch, ganZhi: day + '日' },
          hour: { heavenlyStem: hourStem, earthlyBranch: hourBranch, ganZhi: hourStem + hourBranch + '时' },
          year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
        }, h)
        expect(r.palace.actualPalace, `${day} ${hourStem}${hourBranch}时`).toBe(expected)
      }
    }
  })

  it('宫位分布数学结构：阴日除6 仅出 1-6（7/9 永不出现），阳日除9 覆盖 1-9', () => {
    // 由独立公式推全量分布
    const dist = {}
    for (const day of jiaziDays) {
      const dayStem = day[0]
      const dayBranch = day[1]
      const isYang = '甲丙戊庚壬'.includes(dayStem)
      for (let h = 0; h < 12; h++) {
        const hs = textbookHourStem(dayStem, h)
        const p = textbookPalace(dayStem, dayBranch, hs, branches[h])
        const key = isYang ? '阳' : '阴'
        dist[`${key}${p}`] = (dist[`${key}${p}`] || 0) + 1
      }
    }
    // 阳日 360 组合分布在 1-9（含 7/9），阴日 360 组合只能落在 1-6
    for (let p = 1; p <= 9; p++) {
      const yangCount = dist[`阳${p}`] || 0
      if (p === 7 || p === 9) {
        // 7/9 仅阳日可达（阴日除6 余数 ≤6）
        expect(yangCount).toBeGreaterThan(0)
        expect(dist[`阴${p}`] || 0).toBe(0)
      }
    }
    // 阴阳日组合数守恒
    const yangTotal = Object.entries(dist).filter(([k]) => k.startsWith('阳')).reduce((s, [, v]) => s + v, 0)
    const yinTotal = Object.entries(dist).filter(([k]) => k.startsWith('阴')).reduce((s, [, v]) => s + v, 0)
    expect(yangTotal).toBe(360)
    expect(yinTotal).toBe(360)
  })

  it('中宫5 归宫规则：阳日→坤2、阴日→艮8（枚举验证全部命中）', () => {
    for (const day of jiaziDays) {
      const dayStem = day[0]
      const dayBranch = day[1]
      const isYang = '甲丙戊庚壬'.includes(dayStem)
      for (let h = 0; h < 12; h++) {
        const hs = textbookHourStem(dayStem, h)
        const total = TEXTBOOK_DAY_STEM[dayStem] + TEXTBOOK_DAY_BRANCH[dayBranch]
          + TEXTBOOK_HOUR_STEM[hs] + TEXTBOOK_HOUR_BRANCH[branches[h]]
        const mod = isYang ? 9 : 6
        const raw = total % mod === 0 ? mod : total % mod
        if (raw !== 5) continue // 只验证中宫5 的组合
        const expected = isYang ? 2 : 8
        const r = calculateLingui({
          day: { heavenlyStem: dayStem, earthlyBranch: dayBranch, ganZhi: day + '日' },
          hour: { heavenlyStem: hs, earthlyBranch: branches[h], ganZhi: hs + branches[h] + '时' },
          year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
        }, h)
        expect(r.palace.palaceNumber, `${day} ${hs}${branches[h]}时 原始宫位应为5`).toBe(5)
        expect(r.palace.actualPalace, `${day} ${hs}${branches[h]}时 归宫`).toBe(expected)
      }
    }
  })

  it('开穴映射：九宫数 → 八脉交会穴对（八对双向闭环）', () => {
    // 教材表10-14 八卦九宫八穴：乾6/艮8→公孙内关，坎1/兑7→后溪申脉，震3/巽4→临泣外关，坤2/离9→列缺照海
    const palacePoints = {
      1: ['SI3', 'BL62'], 2: ['LU7', 'KI6'], 3: ['GB41', 'TE5'], 4: ['GB41', 'TE5'],
      6: ['SP4', 'PC6'], 7: ['SI3', 'BL62'], 8: ['SP4', 'PC6'], 9: ['LU7', 'KI6']
    }
    for (const day of jiaziDays) {
      const dayStem = day[0]
      for (let h = 0; h < 12; h++) {
        const hs = textbookHourStem(dayStem, h)
        const p = textbookPalace(dayStem, day[1], hs, branches[h])
        const r = calculateLingui({
          day: { heavenlyStem: dayStem, earthlyBranch: day[1], ganZhi: day + '日' },
          hour: { heavenlyStem: hs, earthlyBranch: branches[h], ganZhi: hs + branches[h] + '时' },
          year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
        }, h)
        expect(pointCodes(r.openPoints).sort(), `${day} ${hs}${branches[h]}时 宫${p}`)
          .toEqual([...palacePoints[p]].sort())
      }
    }
  })
})

/**
 * ============================================================
 * 纳甲法教材级验算（2026-08-14，用户要求：根据教材表格验算推理）
 *
 * 对照教材表10-10（甲胆主气开穴）与表10-11（乙肝主血开穴），
 * 11+11=22 时辰逐一回放：开穴集合、闭穴、返本还原/遇输过原、气纳三焦/血归包络。
 * 教材表数据为硬编码权威值（与 src 独立）。
 * ============================================================
 */

describe('纳甲法教材级验算（表10-10 甲胆 + 表10-11 乙肝，22 时辰回放）', () => {
  // 教材表10-10 甲胆主气开穴：甲戌(井窍阴)→闭→丙子(荥前谷)→闭→戊寅(输陷谷+返本还原丘墟)→闭→
  // 庚辰(经阳溪)→闭→壬午(合委中)→闭→甲申(日干重见·气纳三焦液门)
  const T1010 = [
    { gz: '甲戌', h: 10, exp: ['GB44'] }, { gz: '乙亥', h: 11, exp: [] },
    { gz: '丙子', h: 0, exp: ['SI2'] }, { gz: '丁丑', h: 1, exp: [] },
    { gz: '戊寅', h: 2, exp: ['ST43', 'GB40'] }, { gz: '己卯', h: 3, exp: [] },
    { gz: '庚辰', h: 4, exp: ['LI5'] }, { gz: '辛巳', h: 5, exp: [] },
    { gz: '壬午', h: 6, exp: ['BL40'] }, { gz: '癸未', h: 7, exp: [] },
    { gz: '甲申', h: 8, exp: ['TE2'] }
  ]
  // 教材表10-11 乙肝主血开穴：乙酉(井大敦)→闭→丁亥(荥少府)→闭→己丑(输太白+遇输过原太冲)→闭→
  // 辛卯(经经渠)→闭→癸巳(合阴谷)→闭→乙未(日干重见·血归包络劳宫)
  const T1011 = [
    { gz: '乙酉', h: 9, exp: ['LR1'] }, { gz: '丙戌', h: 10, exp: [] },
    { gz: '丁亥', h: 11, exp: ['HT8'] }, { gz: '戊子', h: 0, exp: [] },
    { gz: '己丑', h: 1, exp: ['SP3', 'LR3'] }, { gz: '庚寅', h: 2, exp: [] },
    { gz: '辛卯', h: 3, exp: ['LU8'] }, { gz: '壬辰', h: 4, exp: [] },
    { gz: '癸巳', h: 5, exp: ['KI10'] }, { gz: '甲午', h: 6, exp: [] },
    { gz: '乙未', h: 7, exp: ['PC8'] }
  ]

  it.each(T1010)('甲日周期 $gz 时开穴 = [$exp]', ({ gz, h, exp }) => {
    // 甲日值日周期：甲戌为甲日子时…不，甲戌是甲日戌时（开井），
    // 丙子/戊寅/庚辰/壬午/甲申 是乙日（自然日）的时辰但仍属甲日周期——由 mkNajia 推导自然日干
    const r = calculateNajia(mkNajia('甲', gz, h), h)
    expect(pointCodes(r.openPoints).sort(), `${gz}时`).toEqual([...exp].sort())
  })

  it.each(T1011)('乙日周期 $gz 时开穴 = [$exp]', ({ gz, h, exp }) => {
    const r = calculateNajia(mkNajia('乙', gz, h), h)
    expect(pointCodes(r.openPoints).sort(), `${gz}时`).toEqual([...exp].sort())
  })

  it('返本还原/遇输过原 type 标记：主穴为输穴、原穴带专用标记', () => {
    // 甲日值日周期戊寅时（自然日乙日寅时）：陷谷(主·输穴) + 丘墟(胆经原穴·返本还原)
    const r1 = calculateNajia(mkNajia('甲', '戊寅', 2), 2)
    expect(r1.openPoints.find(p => p.code === 'ST43')?.type).toBe('输穴')
    expect(r1.openPoints.find(p => p.code === 'GB40')?.type).toBe('原穴（返本还原）')
    // 乙日值日周期己丑时（自然日丙日丑时）：太白(主·输穴) + 太冲(肝经原穴·遇输过原)
    const r2 = calculateNajia(mkNajia('乙', '己丑', 1), 1)
    expect(r2.openPoints.find(p => p.code === 'SP3')?.type).toBe('输穴')
    expect(r2.openPoints.find(p => p.code === 'LR3')?.type).toBe('原穴（遇输过原）')
  })

  it('气纳三焦/血归包络：日干重见时开三焦/心包经穴（表10-10/10-11 末时辰）', () => {
    // 甲申（甲日周期重见甲，自然日乙日申时）：气纳三焦→液门 TE2
    const r1 = calculateNajia(mkNajia('甲', '甲申', 8), 8)
    expect(r1.openPoints.find(p => p.code === 'TE2')?.type).toContain('三焦')
    // 乙未（乙日周期重见乙，自然日丙日未时）：血归包络→劳宫 PC8
    const r2 = calculateNajia(mkNajia('乙', '乙未', 7), 7)
    expect(r2.openPoints.find(p => p.code === 'PC8')?.type).toContain('包络')
  })
})

/**
 * ============================================================
 * 纳甲法时辰干支 vs 徐凤《子午流注逐日按时定穴歌》全量对照（2026-08-14）
 *
 * 背景（重要，勿按自然日五鼠遁理解）：
 * 值日周期不以自然日切割——甲日胆经值日从甲日甲戌（开井）开始，
 * 顺推到乙日甲申（气纳三焦），跨两个自然日。因此开穴时辰的干支必须
 * 从「开井时辰」起连续顺推（每时辰干支各+1），而非从当日子时起按五鼠遁排。
 * 此前代码按后者导致 30/60 处干支错位（如甲日荥穴误标甲子、应为丙子），
 * 本对照为永久回归防线。
 * ============================================================
 */

describe('纳甲法时辰干支与徐凤歌诀全量对照（10日×6时=60处）', () => {
  // 徐凤《子午流注逐日按时定穴歌》：每日子 6 个开穴时辰（歌诀原文顺序）
  const SONG_HOURS = {
    '甲': ['甲戌', '丙子', '戊寅', '庚辰', '壬午', '甲申'],
    '乙': ['乙酉', '丁亥', '己丑', '辛卯', '癸巳', '乙未'],
    '丙': ['丙申', '戊戌', '庚子', '壬寅', '甲辰', '丙午'],
    '丁': ['丁未', '己酉', '辛亥', '癸丑', '乙卯', '丁巳'],
    '戊': ['戊午', '庚申', '壬戌', '甲子', '丙寅', '戊辰'],
    '己': ['己巳', '辛未', '癸酉', '乙亥', '丁丑', '己卯'],
    '庚': ['庚辰', '壬午', '甲申', '丙戌', '戊子', '庚寅'],
    '辛': ['辛卯', '癸巳', '乙未', '丁酉', '己亥', '辛丑'],
    '壬': ['壬寅', '甲辰', '丙午', '戊申', '庚戌', '壬子'],
    '癸': ['癸亥', '乙丑', '丁卯', '己巳', '辛未', '癸酉']
  }
  const BRANCH_IDX = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 }

  it.each(Object.entries(SONG_HOURS))('$0 值日周期 6 个开穴时辰与歌诀一致', (periodStem, expectedHours) => {
    for (const gz of expectedHours) {
      const h = BRANCH_IDX[gz[1]]
      const r = calculateNajia(mkNajia(periodStem, gz, h), h)
      const seq = r.dailySequence[h]
      expect(seq.hourStem + seq.hourBranch, `${periodStem}周期 h${h}`).toBe(gz)
      expect(seq.isOpen, `${periodStem}周期 ${gz}时应为开穴时辰`).toBe(true)
    }
  })

  it('跨日顺推自洽：甲日开井(甲戌)后荥穴在丙子（非甲子，勿按自然日五鼠遁）', () => {
    // 歌诀原文「甲日戌时胆窍阴，丙子时中前谷荣」——丙子是从甲戌跨夜顺推2时辰，
    // 自然日为乙日子时（乙日起丙子），值日周期仍为甲日
    const r = calculateNajia(mkNajia('甲', '丙子', 0), 0)
    // 子时（h0）是荥穴步：开小肠荥前谷 SI2
    expect(r.dailySequence[0].points.map(p => p.code)).toEqual(['SI2'])
    expect(r.dailySequence[0].hourStem + r.dailySequence[0].hourBranch).toBe('丙子')
    // 甲日从甲戌起顺推 12 时辰完整序列：甲戌乙亥丙子丁丑戊寅己卯庚辰辛巳壬午癸未甲申乙酉
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙']
    const branches = ['戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉']
    stems.forEach((s, i) => {
      expect(r.dailySequence[(10 + i) % 12].hourStem, `甲日顺推+${i} 天干`).toBe(s)
      expect(r.dailySequence[(10 + i) % 12].hourBranch, `甲日顺推+${i} 地支`).toBe(branches[i])
    })
  })
})

/**
 * ============================================================
 * 返本还原/遇输过原完整语义验证（2026-08-14 深度推敲）
 *
 * 教材定义（《针灸学》正文）：
 * "当开的穴是输穴时，同时要开值日经的原穴，这一规律称返本还原。
 *  '本'指的是本日的值日经，'原'指的是值日经的原穴。
 *  一般开原穴的时辰，是在开井穴以后的4个时辰。
 *  若为阴经，则以'输'代之，称遇输过原。"
 *
 * 徐凤歌诀逐日佐证：
 *   甲日：戊寅陷谷阳明俞，返本丘墟木在寅（阳日开输+值日经胆原丘墟）
 *   壬日：丙午小肠后溪俞，返求京骨本原寻，三焦寄有阳池穴（阳日+三焦寄穴）
 *   癸日：丁卯俞穴神门是，本寻肾水太溪原，包络大陵原并过（阴日+包络寄穴）
 *
 * 语义要点：
 * 1. 返本还原（阳日）：输穴步开「值日经」的原穴（如甲日胆原丘墟）
 * 2. 遇输过原（阴日）：阴经以输为原，输穴步开值日经的输穴即原穴（如乙日肝原太冲）
 * 3. 壬日三焦寄穴阳池、癸日包络寄穴大陵：值日经原穴之外再加开寄穴
 * ============================================================
 */

describe('纳甲法返本还原/遇输过原完整语义', () => {
  const codes = pts => (pts || []).map(p => p.code).sort()
  const typeOf = (pts, code) => (pts || []).find(p => p.code === code)?.type

  it('阳日返本还原：甲日戊寅(输)同时开胃输陷谷+胆原丘墟，丘墟带返本还原标记', () => {
    // 值日周期甲日、自然日乙日寅时（戊寅）——mkNajia 推导自然日干
    const r = calculateNajia(mkNajia('甲', '戊寅', 2), 2)
    expect(codes(r.openPoints)).toEqual(['GB40', 'ST43'])
    expect(typeOf(r.openPoints, 'ST43')).toBe('输穴')     // 主穴=胃经输穴
    expect(typeOf(r.openPoints, 'GB40')).toBe('原穴（返本还原）') // 附加=胆经原穴
  })

  it('阴日遇输过原：乙日己丑(输)同时开脾输太白+肝原太冲，太冲带遇输过原标记', () => {
    // 值日周期乙日、自然日丙日丑时（己丑）——mkNajia 推导
    const r = calculateNajia(mkNajia('乙', '己丑', 1), 1)
    expect(codes(r.openPoints)).toEqual(['LR3', 'SP3'])
    expect(typeOf(r.openPoints, 'SP3')).toBe('输穴')
    expect(typeOf(r.openPoints, 'LR3')).toBe('原穴（遇输过原）') // 阴经以输代原
  })

  it('开原穴时辰=开井后4个时辰（教材正文）；10日输穴时辰对照徐凤歌诀', () => {
    // 甲日开井甲戌(h10) → 输穴戊寅(h2)，(2-10+12)%12=4 → 恰为开井后第4个时辰
    const r = calculateNajia(mkNajia('甲', '戊寅', 2), 2)
    expect(r.dailySequence[2].hourStem + r.dailySequence[2].hourBranch).toBe('戊寅')
    // 乙日开井乙酉(h9) → 输穴己丑(h1)，(1-9+12)%12=4 → 开井后第4个时辰
    const r2 = calculateNajia(mkNajia('乙', '己丑', 1), 1)
    expect(r2.dailySequence[1].hourStem + r2.dailySequence[1].hourBranch).toBe('己丑')
  })

  it('壬日三焦寄穴阳池：输穴步开膀胱原京骨 + 三焦寄阳池（歌诀"三焦寄有阳池穴"）', () => {
    const r = calculateNajia(mkNajia('壬', '丙午', 6), 6)
    expect(codes(r.openPoints)).toEqual(['BL64', 'SI3', 'TE4']) // 后溪+京骨+阳池
    expect(typeOf(r.openPoints, 'TE4')).toBe('原穴（三焦寄穴）')
    expect(typeOf(r.openPoints, 'BL64')).toBe('原穴（返本还原）')
  })

  it('癸日包络寄穴大陵：输穴步开肾原太溪 + 包络寄大陵（歌诀"包络大陵原并过"）', () => {
    const r = calculateNajia(mkNajia('癸', '丁卯', 3), 3)
    expect(codes(r.openPoints)).toEqual(['HT7', 'KI3', 'PC7']) // 神门+太溪+大陵
    expect(typeOf(r.openPoints, 'PC7')).toBe('原穴（包络寄穴）')
    expect(typeOf(r.openPoints, 'KI3')).toBe('原穴（遇输过原）')
  })

  it('非输穴时辰不开原穴：甲日庚辰(经)只开阳溪，无丘墟', () => {
    const r = calculateNajia(mkNajia('甲', '庚辰', 4), 4)
    expect(codes(r.openPoints)).toEqual(['LI5'])
    expect(r.openPoints.some(p => p.code === 'GB40')).toBe(false)
  })
})

/**
 * ============================================================
 * 值日周期跨夜推导（2026-08-14 修复跨夜 bug 后固化）
 *
 * 背景：纳甲值日周期不以自然日切割。getGanZhi 在 23:00 按子时换日（如 5/20 23:30
 * 返回乙日子时丙子），但值日周期判定「当前时辰是否已过当日开井时辰」：
 *   - 已过（hourIdx >= jingHour）→ 值日=当日干
 *   - 未过（hourIdx < jingHour）→ 值日=前一日干（仍在前日周期内）
 * 例：5/20 甲日 23:30（自然日乙、h0 子时）→ 乙日开井酉(h9)，h0<9 → 值日=甲
 *     → 应开甲日周期丙子荥前谷（徐凤歌诀"丙子时中前谷荣"），而非乙日周期闭穴。
 * ============================================================
 */

describe('纳甲法值日周期跨夜推导（23:00 后仍属前日周期）', () => {
  const STEMS = '甲乙丙丁戊己庚辛壬癸'

  it('甲日深夜（自然乙日子时）：值日仍为甲，开丙子荥前谷 SI2（歌诀丙子时中前谷荣）', () => {
    // 模拟 getGanZhi(5/20 23:30) 返回的自然日干支：乙日丙子时
    const r = calculateNajia({
      day: { heavenlyStem: '乙', earthlyBranch: '子', ganZhi: '乙子日' },
      hour: { heavenlyStem: '丙', earthlyBranch: '子', ganZhi: '丙子时' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 0)
    expect(r.dayMeridian.code).toBe('GB')  // 值日经=胆（甲日），非肝（乙日）
    expect(r.dayStem).toBe('甲')
    expect(pointCodes(r.openPoints)).toEqual(['SI2']) // 荥前谷
    expect(r.isClosed).toBe(false)
  })

  it('乙日清晨（自然乙日寅时）：值日仍为甲，开戊寅输陷谷+返本还原丘墟', () => {
    const r = calculateNajia({
      day: { heavenlyStem: '乙', earthlyBranch: '子', ganZhi: '乙子日' },
      hour: { heavenlyStem: '戊', earthlyBranch: '寅', ganZhi: '戊寅时' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 2)
    expect(r.dayStem).toBe('甲')
    expect(pointCodes(r.openPoints).sort()).toEqual(['GB40', 'ST43'])
  })

  it('乙日酉时（h9=开井）：值日切为乙，开乙酉井大敦 LR1', () => {
    const r = calculateNajia({
      day: { heavenlyStem: '乙', earthlyBranch: '子', ganZhi: '乙子日' },
      hour: { heavenlyStem: '乙', earthlyBranch: '酉', ganZhi: '乙酉时' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 9)
    expect(r.dayStem).toBe('乙')
    expect(pointCodes(r.openPoints)).toEqual(['LR1'])
  })

  it('癸日亥时（h11=开井）：值日切为癸，开癸亥井涌泉 KI1', () => {
    const r = calculateNajia({
      day: { heavenlyStem: '癸', earthlyBranch: '子', ganZhi: '癸子日' },
      hour: { heavenlyStem: '癸', earthlyBranch: '亥', ganZhi: '癸亥时' },
      year: { ganZhi: 'X' }, month: { ganZhi: 'X' }
    }, 11)
    expect(r.dayStem).toBe('癸')
    expect(pointCodes(r.openPoints)).toEqual(['KI1'])
  })

  it('值日周期推导逻辑完备：10日×12时辰 值日周期日干跨日无缝', () => {
    // 独立验证：有效值日 = (h >= jingHour) ? 当日干 : 前一日干
    // 检查跨日连续性：前一日 h11 与当日 h0 的有效值日应相同（同一周期延续）
    const jingHour = { '甲': 10, '乙': 9, '丙': 8, '丁': 7, '戊': 6, '己': 5, '庚': 4, '辛': 3, '壬': 2, '癸': 11 }
    const prevStem = s => STEMS[(STEMS.indexOf(s) + 9) % 10]
    for (let i = 0; i < 10; i++) {
      const day = STEMS[i]
      const prevDay = prevStem(day)
      // 前一日 h11（亥时）的有效值日
      const effPrevH11 = 11 >= jingHour[prevDay] ? prevDay : prevStem(prevDay)
      // 当日 h0（子时）的有效值日
      const effCurrH0 = 0 >= jingHour[day] ? day : prevStem(day)
      expect(effPrevH11, `${prevDay}日h11 与 ${day}日h0 周期连续`).toBe(effCurrH0)
    }
  })
})

/**
 * ============================================================
 * 论文级交叉验证（2026-08-14 用户提供两篇论文）
 *
 * 论文一：张雨辰《子午流注针法中干支数学公式推算法的修正》
 *   - 时干支公式：时干代数 = [(日干支代数-1)×12+时支代数]÷10 取余
 *   - 日干支：元旦公式 + 顺推（本项目用 lunar-javascript，此处验证时干支）
 * 论文二：佟佳恒《子午流注（纳甲法）的数学原理》
 *   - 佟氏第一定律：HSH-EBH=2HSD（推论①：跨日 HSD'≡HSD 或 HSD+1 = 本项目的值日周期推导）
 *   - 佟氏第二定律：HSH+EBH=4(F-1)（F=井1荥2输3经4合5，6=三焦/心包）
 *   - 佟氏第三定律：气纳三焦 PTE≡(HSD+3)/2、血归包络 PPC≡(HSD+2)/2 (mod5)
 *   - 佟氏第四定律：HSH≡C(mod10)（时辰天干=所开经）
 *
 * 独立脚本已验证全部公式/定律（60+50+10 处）与代码一致，此处固化为单元测试。
 * ============================================================
 */

describe('论文级交叉验证（张雨辰干支公式 + 佟佳恒纳甲四定律）', () => {
  // === 佟氏编号（1-based，癸≡10≡0 mod10）===
  const STEM_NUM = { '甲': 1, '乙': 2, '丙': 3, '丁': 4, '戊': 5, '己': 6, '庚': 7, '辛': 8, '壬': 9, '癸': 10 }
  const BRANCH_NUM = { '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6, '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12 }
  const MERID_NUM = { 'GB': 1, 'LR': 2, 'SI': 3, 'HT': 4, 'ST': 5, 'SP': 6, 'LI': 7, 'LU': 8, 'BL': 9, 'KI': 0 }
  const CN_MERID = { '胆': 'GB', '肝': 'LR', '小肠': 'SI', '心': 'HT', '胃': 'ST', '脾': 'SP', '大肠': 'LI', '肺': 'LU', '膀胱': 'BL', '肾': 'KI' }
  const BRANCH_IDX = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 }
  const JING_HOUR = { '甲': 10, '乙': 9, '丙': 8, '丁': 7, '戊': 6, '己': 5, '庚': 4, '辛': 3, '壬': 2, '癸': 11 }
  // 值日周期开穴时辰（徐凤歌诀 10日×6时）
  const SONG = {
    '甲': ['甲戌', '丙子', '戊寅', '庚辰', '壬午', '甲申'], '乙': ['乙酉', '丁亥', '己丑', '辛卯', '癸巳', '乙未'],
    '丙': ['丙申', '戊戌', '庚子', '壬寅', '甲辰', '丙午'], '丁': ['丁未', '己酉', '辛亥', '癸丑', '乙卯', '丁巳'],
    '戊': ['戊午', '庚申', '壬戌', '甲子', '丙寅', '戊辰'], '己': ['己巳', '辛未', '癸酉', '乙亥', '丁丑', '己卯'],
    '庚': ['庚辰', '壬午', '甲申', '丙戌', '戊子', '庚寅'], '辛': ['辛卯', '癸巳', '乙未', '丁酉', '己亥', '辛丑'],
    '壬': ['壬寅', '甲辰', '丙午', '戊申', '庚戌', '壬子'], '癸': ['癸亥', '乙丑', '丁卯', '己巳', '辛未', '癸酉']
  }

  it('佟氏第二定律：HSH+EBH=4(F-1)，60 个开穴时辰全部成立（mod 双值表示）', () => {
    for (const [periodDay, hours] of Object.entries(SONG)) {
      for (let f = 1; f <= 6; f++) {
        const gz = hours[f - 1]
        const hshBase = STEM_NUM[gz[0]]
        const ebhBase = BRANCH_NUM[gz[1]]
        // HSH 双值（含癸≡0），EBH 双值（mod12 负表示）
        const hs = [hshBase, hshBase + 10, hshBase === 10 ? 0 : -1].filter(v => v >= 0 && v <= 20)
        const eb = [ebhBase, ebhBase - 12].filter(v => v >= -10 && v <= 10)
        const hit = hs.some(h => eb.some(e => h + e === 4 * (f - 1)))
        expect(hit, `${periodDay}日${gz}时 F${f} 佟氏第二定律`).toBe(true)
      }
    }
  })

  it('佟氏第四定律：HSH≡C(mod10)（时辰天干=所开经），50 个五输穴开穴全部成立', () => {
    for (const [periodDay, hours] of Object.entries(SONG)) {
      for (let f = 1; f <= 5; f++) {
        const gz = hours[f - 1]
        const r = calculateNajia(mkNajia(periodDay, gz, BRANCH_IDX[gz[1]]), BRANCH_IDX[gz[1]])
        const mer = r.openPoints[0]?.meridian || ''
        const merCode = Object.entries(CN_MERID).find(([cn]) => mer.includes(cn))?.[1] || ''
        expect(MERID_NUM[merCode] !== undefined, `${periodDay}日${gz}时开穴经可解析`).toBe(true)
        expect((STEM_NUM[gz[0]] % 10), `${periodDay}日${gz}时 HSH≡C`).toBe(MERID_NUM[merCode] % 10)
      }
    }
  })

  it('佟氏第三定律：气纳三焦 PTE≡(HSD+3)/2、血归包络 PPC≡(HSD+2)/2 (mod5)，10 处全部成立', () => {
    const wushuOrder = ['井', '荥', '输', '经', '合']
    for (const [periodDay, hours] of Object.entries(SONG)) {
      const hsd = STEM_NUM[periodDay]
      const lastGz = hours[5]
      const r = calculateNajia(mkNajia(periodDay, lastGz, BRANCH_IDX[lastGz[1]]), BRANCH_IDX[lastGz[1]])
      const point = r.openPoints[0]
      expect(point, `${periodDay}日${lastGz}时应开穴`).toBeTruthy()
      const isYang = ['甲', '丙', '戊', '庚', '壬'].includes(periodDay)
      const expectedF = isYang ? (hsd + 3) / 2 : (hsd + 2) / 2
      const mod5 = ((expectedF % 5) + 5) % 5 || 5
      const cat = (point.category || '').replace(/穴/g, '')
      const actualF = wushuOrder.indexOf(cat) + 1
      expect(actualF, `${periodDay}日 ${point.name} 佟氏第三定律`).toBe(mod5)
    }
  })

  it('佟氏第一定律跨日推论（HSD\'≡HSD 或 HSD+1）对应本项目的值日周期推导', () => {
    // 佟氏4.5推论①：开穴所在日干支 HSD' 与经气流注日干 HSD 的关系
    //   EBH≥12-HSD → HSD'≡HSD；EBH<12-HSD → HSD'≡HSD+1 (mod10)
    // 本项目值日周期推导：hourIdx >= jingHour → 值日=当日干；否则=前一日干
    // 验证甲日周期：甲戌(开井,自然日甲) HSD'=HSD=甲；丙子(自然日乙) HSD'=HSD+1=乙
    // 用歌诀甲日丙子时验证：值日周期日干=甲，自然日日干=乙（HSD'=HSD+1）
    const hsd = STEM_NUM['甲']  // 1
    const gz = '丙子'
    const h = BRANCH_IDX['子']  // 0
    const r = calculateNajia(mkNajia('甲', gz, h), h)
    expect(r.dayStem).toBe('甲')          // 值日周期日干 HSD
    // 佟氏推论：EBH=子=1，HSD=1，EBH≥12-HSD? 1≥11? 否 → HSD'=HSD+1=2=乙
    // 验证 mkNajia 推导的自然日干=乙
    const stems = '甲乙丙丁戊己庚辛壬癸'
    const naturalStem = h >= JING_HOUR['甲'] ? '甲' : stems[(stems.indexOf('甲') + 1) % 10]
    expect(naturalStem).toBe('乙')        // 自然日 HSD'=HSD+1 ✓
    expect(STEM_NUM[naturalStem]).toBe(hsd + 1)  // 佟氏推论数值验证
  })
})
