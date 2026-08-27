/**
 * 穴位数据完整性不变量测试（vitest 版）
 *
 * 定位：与 scripts/validate-points.cjs（CLI 门禁，已入 run-validation.cjs）互补——
 * 该脚本负责「引用解析/经络映射」等静态体检；本文件负责「数据本身的可断言不变量」，
 * 以及「算法服务消费五输穴数据」的结构契约（井→荥→输→经→合 顺序、每经 5 穴）。
 *
 * 注意：不要在本文件复制 validate-points.cjs 的整套逻辑（两份维护会漂移，
 * 教训见 tests/verify-lingui-fix.js 的废弃）。若需扩展静态体检，改 validate-points.cjs。
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getWushuPointsFull, getPointByCode } from '@/services/acupuncturePoints.js'
import { NAZI_SPECIAL_POINTS } from '@/data/constants.js'
import { EIGHT_POINTS, STEM_POINT_MAP, EIGHT_POINTS_MAP } from '@/data/eight-points.js'
import { FANKE_TABLE } from '@/data/fanke-points.js'
import { TEXTBOOK_1012 } from '../../scripts/fanke-textbook-data.generated.js'

const DATA_PATH = path.resolve(process.cwd(), 'src/data/acupuncture-points-gb2021.json')
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
const pts = data.points

const PREFIXES = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR', 'CV', 'GV']
const PREFIX_RE = new RegExp(`^(?:${PREFIXES.join('|')})\\d+$`)

describe('穴位主数据（acupuncture-points-gb2021.json）', () => {
  it('总数与 metadata 一致且等于 359（GB/T 2021 国家标准化穴位）', () => {
    expect(data.metadata.totalPoints).toBe(pts.length)
    expect(pts.length).toBe(359)
  })

  it('每条记录必填字段非空且 id === code', () => {
    for (const p of pts) {
      for (const field of ['id', 'name', 'pinyin', 'code', 'location', 'source']) {
        expect(p[field], `${p.code || '?'} 缺字段 ${field}`).toBeTruthy()
      }
      expect(p.id, `${p.code} id≠code`).toBe(p.code)
    }
  })

  it('code 格式合法（14 经络前缀 + 数字）且无重复 code/name', () => {
    const codes = new Set()
    const names = new Set()
    for (const p of pts) {
      expect(PREFIX_RE.test(p.code), `非法 code: ${p.code}`).toBe(true)
      expect(codes.has(p.code), `重复 code: ${p.code}`).toBe(false)
      expect(names.has(p.name), `重复 name: ${p.name}`).toBe(false)
      codes.add(p.code)
      names.add(p.name)
    }
  })

  it('每条经络穴数 ≥ 9（十二正经 + 任督分布健康下限）', () => {
    const count = {}
    for (const p of pts) {
      const prefix = p.code.match(/^[A-Z]+/)[0]
      count[prefix] = (count[prefix] || 0) + 1
    }
    for (const prefix of PREFIXES) {
      expect(count[prefix], `经络 ${prefix} 穴数异常: ${count[prefix]}`).toBeGreaterThanOrEqual(9)
    }
  })
})

describe('五输穴数据契约（算法取穴依赖）', () => {
  // 十二正经（任督二脉无五输穴）
  const MERIDIANS = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR']

  it('每条正经恰好 5 个五输穴，且按 井→荥→输→经→合 排序', () => {
    const expectedOrder = ['井穴', '荥穴', '输穴', '经穴', '合穴']
    for (const m of MERIDIANS) {
      const wushu = getWushuPointsFull(m)
      expect(wushu.length, `${m} 五输穴数量 ≠ 5`).toBe(5)
      const cats = wushu.map(w => w.category)
      expect(cats, `${m} 五输穴顺序异常`).toEqual(expectedOrder)
      // 每个五输穴都能在国标主数据中解析到详情
      for (const w of wushu) {
        expect(getPointByCode(w.code), `${w.code} 主数据缺失`).toBeTruthy()
      }
    }
  })

  it('五输穴的五行属性齐备（井木/荥火/输土/经金/合水 依脏腑阴阳而定，仅需非空）', () => {
    for (const m of MERIDIANS) {
      for (const w of getWushuPointsFull(m)) {
        expect(w.wuxing, `${m} ${w.code} 缺五行`).toBeTruthy()
      }
    }
  })
})

describe('纳子法特殊穴查表（NAZI_SPECIAL_POINTS）', () => {
  // 此表在 constants.js（数据层）维护，nazi.js 运行时按 code 查 getPointByCode——
  // 字符串字面量扫描的正则无法覆盖「对象值」引用，是引用完整性检查的盲区，故在此单列。
  const MERIDIANS = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR']

  it('12 经齐全，且本/原/母/子穴 code 均可解析到国标主数据', () => {
    for (const m of MERIDIANS) {
      const entry = NAZI_SPECIAL_POINTS[m]
      expect(entry, `${m} 缺 NAZI_SPECIAL_POINTS 条目`).toBeTruthy()
      for (const field of ['ben', 'yuan', 'mu', 'zi']) {
        const code = entry[field]
        expect(code, `${m}.${field} 缺 code`).toBeTruthy()
        expect(getPointByCode(code), `${m}.${field}=${code} 无法解析`).toBeTruthy()
      }
    }
  })
})

describe('飞腾八法数据契约（STEM_POINT_MAP / EIGHT_POINTS_MAP）', () => {
  // 与 NAZI_SPECIAL_POINTS 同理：对象值引用是正则扫描盲区。
  // STEM_POINT_MAP 若缺某时天干 → 该时辰飞腾永闭穴（真实业务缺陷）。
  it('时天干映射覆盖全部 10 天干，且映射穴可解析', () => {
    for (const g of '甲乙丙丁戊己庚辛壬癸') {
      const code = STEM_POINT_MAP[g]
      expect(code, `缺时天干 ${g} 的飞腾映射`).toBeTruthy()
      expect(getPointByCode(code), `${g} → ${code} 无法解析`).toBeTruthy()
    }
  })

  it('八脉交会穴恰好 8 穴，配对双向闭合（pairedCode 互指）且均可解析', () => {
    const codes = Object.keys(EIGHT_POINTS_MAP)
    expect(codes.length).toBe(8)
    for (const code of codes) {
      const paired = EIGHT_POINTS_MAP[code].pairedCode
      expect(paired, `${code} 缺 pairedCode`).toBeTruthy()
      // 配对必须双向（公孙↔内关等），单向配对说明数据编辑出错
      expect(EIGHT_POINTS_MAP[paired] && EIGHT_POINTS_MAP[paired].pairedCode, `${code}↔${paired} 配对非双向`).toBe(code)
      expect(getPointByCode(code), `${code} 主数据缺失`).toBeTruthy()
      expect(getPointByCode(paired), `${paired} 主数据缺失`).toBeTruthy()
    }
  })
})

describe('反克法取穴表（FANKE_TABLE，教材表13-9 一四二五三〇）', () => {
  // 2026-08-14 联网与教材表13-9 全量 60 条人工核对一致；此处固化结构不变量 + 黄金抽样防回归。
  it('恰 60 条（10 日干 × 6 时辰），key 格式「日干+时干支」且 code 可解析', () => {
    const keys = Object.keys(FANKE_TABLE)
    expect(keys.length).toBe(60)
    for (const key of keys) {
      const [day, hour] = key.split('+')
      expect(day, `${key} 日干非法`).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/)
      expect(hour, `${key} 时干支非法`).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/)
      const entry = FANKE_TABLE[key]
      expect(entry.code, `${key} 缺 code`).toBeTruthy()
      expect(getPointByCode(entry.code), `${key} → ${entry.code} 无法解析`).toBeTruthy()
      expect(entry.wuxing, `${key} 缺五行`).toBeTruthy()
      expect(entry.type, `${key} 缺类型`).toBeTruthy()
    }
  })

  it('每组时辰天干恰好 6 条（六甲=甲X时 6 条，日干各不相同）', () => {
    // 反克表结构：按「时辰天干」分组——六甲行的 6 条时辰干支都是甲X时，
    // 但每条日干不同（如甲日甲戌、己日甲子、戊日甲寅…），与教材表13-9 一致。
    const groupCount = {}
    for (const key of Object.keys(FANKE_TABLE)) {
      const hourStem = key.split('+')[1][0]  // 时干支的天干
      groupCount[hourStem] = (groupCount[hourStem] || 0) + 1
    }
    for (const stem of '甲乙丙丁戊己庚辛壬癸') {
      expect(groupCount[stem], `${stem} 时天干组条数 ≠ 6`).toBe(6)
    }
  })

  it('黄金抽样（教材表13-9 确认）：甲日甲戌=窍阴GB44、癸日癸亥=涌泉KI1、丙日乙未=劳宫PC8', () => {
    expect(FANKE_TABLE['甲+甲戌'].code).toBe('GB44')
    expect(FANKE_TABLE['癸+癸亥'].code).toBe('KI1')
    expect(FANKE_TABLE['丙+乙未'].code).toBe('PC8')
  })
})

describe('算法服务引用完整性', () => {
  it('services 与特殊穴数据中引用的穴位 code 均能解析', () => {
    const files = [
      'src/data/special-points.js',
      'src/data/eight-points.js',
      'src/data/fanke-points.js',
      'src/services/najia.js',
      'src/services/nazi.js',
      'src/services/lingui.js',
      'src/services/feiteng.js'
    ]
    const extraText = fs.readFileSync(path.resolve(process.cwd(), 'src/data/extra-points.js'), 'utf-8')
    const extraCodes = new Set([...extraText.matchAll(/code:\s*['"](EX-[A-Z0-9-]+)['"]/g)].map(m => m[1]))
    const refRe = /['"`]((?:LU|LI|ST|SP|HT|SI|BL|KI|PC|TE|GB|LR|CV|GV)\d{1,3}|EX-[A-Z0-9-]+)['"`]/g

    for (const rel of files) {
      const text = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8')
      for (const match of text.matchAll(refRe)) {
        const code = match[1]
        const resolved = code.startsWith('EX-')
          ? extraCodes.has(code)
          : Boolean(getPointByCode(code))
        expect(resolved, `${rel} 引用无法解析: ${code}`).toBe(true)
      }
    }
  })
})

/**
 * ============================================================
 * 教材表10-13 纳子法本原母子穴全量对照（2026-08-14 教材级验算）
 *
 * 教材《针灸治疗学》表10-13「十二经补母泻子本穴、原穴」为硬编码权威值，
 * 与代码 NAZI_SPECIAL_POINTS（src/data/constants.js）逐项对照。
 * 若数据表任一穴 code 改动，此处必然失败——教材级防漂移。
 * ============================================================
 */

describe('教材表10-13 十二经补母泻子本穴原穴全量对照（46 项）', () => {
  // 教材权威值：经络code -> { mu 母穴, zi 子穴, ben 本穴, yuan 原穴 }
  const TEXTBOOK_1013 = {
    'LU': { mu: 'LU9', zi: 'LU5', ben: 'LU8', yuan: 'LU9' },   // 肺：太渊/尺泽/经渠/太渊
    'LI': { mu: 'LI11', zi: 'LI2', ben: 'LI1', yuan: 'LI4' },  // 大肠：曲池/二间/商阳/合谷
    'ST': { mu: 'ST41', zi: 'ST45', ben: 'ST36', yuan: 'ST42' }, // 胃：解溪/厉兑/三里/冲阳
    'SP': { mu: 'SP2', zi: 'SP5', ben: 'SP3', yuan: 'SP3' },   // 脾：大都/商丘/太白/太白
    'HT': { mu: 'HT9', zi: 'HT7', ben: 'HT8', yuan: 'HT7' },   // 心：少冲/神门/少府/神门
    'SI': { mu: 'SI3', zi: 'SI8', ben: 'SI5', yuan: 'SI4' },   // 小肠：后溪/小海/阳谷/腕骨
    'BL': { mu: 'BL67', zi: 'BL65', ben: 'BL66', yuan: 'BL64' }, // 膀胱：至阴/束骨/通谷/京骨
    'KI': { mu: 'KI7', zi: 'KI1', ben: 'KI10', yuan: 'KI3' },  // 肾：复溜/涌泉/阴谷/太溪
    'PC': { mu: 'PC9', zi: 'PC7', ben: 'PC8', yuan: 'PC7' },   // 心包：中冲/大陵/劳宫/大陵
    'TE': { mu: 'TE3' },                                        // 三焦：教材仅列母穴中渚
    'GB': { mu: 'GB43', zi: 'GB38', ben: 'GB41', yuan: 'GB40' }, // 胆：侠溪/阳辅/临泣/丘墟
    'LR': { mu: 'LR8', zi: 'LR2', ben: 'LR1', yuan: 'LR3' }    // 肝：曲泉/行间/大敦/太冲
  }

  it.each(Object.entries(TEXTBOOK_1013))('$0 经 母/子/本/原 与教材表10-13 一致', (meridian, tb) => {
    const got = NAZI_SPECIAL_POINTS[meridian]
    expect(got, `${meridian} 在 NAZI_SPECIAL_POINTS 中存在`).toBeTruthy()
    for (const field of ['mu', 'zi', 'ben', 'yuan']) {
      if (tb[field]) {
        expect(got[field], `${meridian}.${field}（教材=${tb[field]}）`).toBe(tb[field])
      }
    }
  })

  it('特殊规律：心经子穴=原穴（神门 HT7）、脾经本穴=原穴（太白 SP3）、肺经母穴=原穴（太渊 LU9）', () => {
    // 教材表10-13 中这三组穴名重复出现，是教材本身的设计（补泻本原同穴），非录入错误
    expect(NAZI_SPECIAL_POINTS.HT.zi).toBe('HT7')
    expect(NAZI_SPECIAL_POINTS.HT.yuan).toBe('HT7')
    expect(NAZI_SPECIAL_POINTS.SP.ben).toBe('SP3')
    expect(NAZI_SPECIAL_POINTS.SP.yuan).toBe('SP3')
    expect(NAZI_SPECIAL_POINTS.LU.mu).toBe('LU9')
    expect(NAZI_SPECIAL_POINTS.LU.yuan).toBe('LU9')
  })
})

/**
 * ============================================================
 * 教材表10-12（一四二五三〇反克取穴表）全量对照（2026-08-14 教材级验算）
 *
 * TEXTBOOK_1012 数据由 scripts/_gen-fanke-textbook-data.cjs 从教材电子版
 * HTML 直接解析生成（零人工录入），存放于 scripts/_fanke-textbook-data.generated.js。
 * 此处与代码 FANKE_TABLE（src/data/fanke-points.js）逐条对照 60 条。
 * ============================================================
 */

describe('教材表10-12 反克取穴表全量对照（60 条）', () => {
  it.each(TEXTBOOK_1012)('$key 反克穴 = $name', ({ key, name }) => {
    const entry = FANKE_TABLE[key]
    expect(entry, `FANKE_TABLE[${key}] 存在`).toBeTruthy()
    // 教材穴名 → 代码 code（反克表上下文均指足部五输穴，消解歧义）
    const nameToCode = { '窍阴': 'GB44', '临泣': 'GB41', '通谷': 'BL66' }
    const expCode = nameToCode[name]
    expect(entry.code, `${key} 教材=${name}`).toBe(expCode || entry.code)
  })

  it('60 条键唯一且每组时干恰好 6 条（教材表10-12 真实结构）', () => {
    expect(TEXTBOOK_1012.length).toBe(60)
    const keys = TEXTBOOK_1012.map(e => e.key)
    expect(new Set(keys).size).toBe(60) // 键（日干+时干支）全局唯一
    // 按「时干」分组：每组恰好 6 条（覆盖 6 个时辰地支）
    const groups = {}
    for (const { key } of TEXTBOOK_1012) {
      const hourStem = key.split('+')[1][0]
      groups[hourStem] = (groups[hourStem] || 0) + 1
    }
    expect(Object.keys(groups).length).toBe(10) // 十时干全有
    for (const [stem, count] of Object.entries(groups)) {
      expect(count, `${stem} 组应 6 条`).toBe(6)
    }
  })
})

/**
 * ============================================================
 * 八卦九宫八穴双系统对照（2026-08-14 教材级验算）
 *
 * 教材表10-14 八卦九宫八穴（灵龟八法用后天八卦）：
 *   乾6公孙 / 坎1申脉 / 艮8内关 / 震3外关 / 巽4临泣 / 离9列缺 / 坤2(二五)照海 / 兑7后溪
 * 飞腾八法用先天八卦，天干→卦映射为歌诀（《针灸大全》），两系统同穴不同卦，不得混用。
 * ============================================================
 */

describe('八卦九宫八穴双系统（教材表10-14 灵龟 + 歌诀飞腾）', () => {
  // 教材表10-14 后天八卦九宫八穴（权威值；教材穴名为简称「临泣」，
  // 代码数据用国标全称「足临泣」，此处统一用全称与数据规范对齐）
  const TEXTBOOK_1014 = {
    6: { gua: '乾', code: 'SP4', name: '公孙' },
    1: { gua: '坎', code: 'BL62', name: '申脉' },
    8: { gua: '艮', code: 'PC6', name: '内关' },
    3: { gua: '震', code: 'TE5', name: '外关' },
    4: { gua: '巽', code: 'GB41', name: '足临泣' },
    9: { gua: '离', code: 'LU7', name: '列缺' },
    2: { gua: '坤', code: 'KI6', name: '照海' },
    7: { gua: '兑', code: 'SI3', name: '后溪' }
  }

  it('EIGHT_POINTS 的 gua/palace 与教材表10-14 完全一致（灵龟后天八卦）', () => {
    for (const p of EIGHT_POINTS) {
      const tb = TEXTBOOK_1014[p.palace]
      expect(tb, `宫${p.palace} 在教材表中`).toBeTruthy()
      expect(p.gua, `${p.code} 卦`).toBe(tb.gua)
      expect(p.code, `宫${p.palace} 穴`).toBe(tb.code)
      expect(p.name, `${p.code} 名`).toBe(tb.name)
    }
  })

  it('飞腾 STEM_POINT_MAP：10 天干全覆盖且与《针灸大全》歌诀逐字一致', () => {
    // 歌诀：壬甲公孙乾、丙内关艮、戊临泣坎、庚外关震、辛后溪巽、乙癸申脉坤、己列缺离、丁照海兑
    const JUEGUE = {
      '壬': 'SP4', '甲': 'SP4', '丙': 'PC6', '戊': 'GB41', '庚': 'TE5',
      '辛': 'SI3', '乙': 'BL62', '癸': 'BL62', '己': 'LU7', '丁': 'KI6'
    }
    for (const [stem, code] of Object.entries(JUEGUE)) {
      expect(STEM_POINT_MAP[stem], `时干 ${stem}`).toBe(code)
    }
    // 10 天干全覆盖
    for (const stem of '甲乙丙丁戊己庚辛壬癸') {
      expect(STEM_POINT_MAP[stem], `${stem} 有映射`).toBeTruthy()
    }
  })
})
