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
import { STEM_POINT_MAP, EIGHT_POINTS_MAP } from '@/data/eight-points.js'

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
