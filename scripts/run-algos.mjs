import { getGanZhi } from '../src/services/ganzhi.js'
import { calculateNajia } from '../src/services/najia.js'
import { calculateNazi } from '../src/services/nazi.js'
import { calculateLingui } from '../src/services/lingui.js'
import { calculateFeiteng } from '../src/services/feiteng.js'
import { getPointByCode } from '../src/services/acupuncturePoints.js'

const PREFIXES = ['LU','LI','ST','SP','HT','SI','BL','KI','PC','TE','GB','LR','CV','GV']

const methods = {
  najia: (g, h) => calculateNajia(g, h, { enableHeRiHuYong: true }),
  nazi: (g, h) => calculateNazi(g, h),
  lingui: (g, h) => calculateLingui(g, h),
  feiteng: (g, h) => calculateFeiteng(g, h)
}

const nullCodes = new Map()
const badMeridian = new Map()
const exceptions = []
let calls = 0
let emptyResults = 0

function checkResult(res, tag) {
  const s = JSON.stringify(res)
  const re = /"code":"((?:[A-Z]{2}\d{1,3}|EX-[A-Z0-9-]+))"/g
  let m
  while ((m = re.exec(s))) {
    const code = m[1]
    const r = getPointByCode(code)
    if (!r) { nullCodes.set(code, (nullCodes.get(code) || 0) + 1); continue }
    if (PREFIXES.includes(code.slice(0, 2)) && (!r.meridian || r.meridian === '')) {
      badMeridian.set(code, (badMeridian.get(code) || 0) + 1)
    }
    if (!r.location || r.location === '') badMeridian.set('LOC空:' + code, (badMeridian.get('LOC空:' + code) || 0) + 1)
  }
}

function runDate(d, lon, useTrue) {
  for (const m of Object.keys(methods)) {
    for (let h = 0; h < 12; h++) {
      try {
        const g = getGanZhi(d, lon, useTrue)
        if (!g) { exceptions.push(`getGanZhi null @${d} lon=${lon}`); continue }
        const res = methods[m](g, h)
        calls++
        checkResult(res, `${m}@${d}h${h}`)
        const pts = res && (res.openPoints || res.points || [])
        if (res && (res.isClosed || (Array.isArray(pts) && pts.length === 0))) emptyResults++
      } catch (e) {
        exceptions.push(`[${m}] 异常 @${d} h=${h} lon=${lon} useTrue=${useTrue}: ${e.message}`)
      }
    }
  }
}

// 1) 2024 全年逐日 × 12 时辰（覆盖全部日干支/时辰）
{
  const start = new Date(2024, 0, 1)
  for (let i = 0; i < 366; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); d.setHours(12, 0, 0, 0)
    runDate(d, 116.407, false)
  }
}
// 2) 真太阳时 + 经度极端(东130/西-120) 跨日，2024 60天
{
  const start = new Date(2024, 0, 1)
  for (let i = 0; i < 60; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    for (const lon of [130, -120]) { d.setHours(12, 0, 0, 0); runDate(d, lon, true) }
  }
}
// 3) 子时翻转：23:30 应映射次日子时，2024 60天 × 12时辰
{
  const start = new Date(2024, 0, 1)
  for (let i = 0; i < 60; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); d.setHours(23, 30, 0, 0)
    runDate(d, 116.407, false)
  }
}
// 4) 多年度抽样 2020-2030 每年1/7月
{
  for (let y = 2020; y <= 2030; y++) {
    for (const mo of [0, 6]) {
      const d = new Date(y, mo, 1, 12, 0, 0, 0)
      runDate(d, 116.407, false)
    }
  }
}

console.log('===== 端到端算法扫描结果 =====')
console.log('总调用次数:', calls)
console.log('空结果(闭穴/无开穴,属正常)次数:', emptyResults)
console.log('运行时异常:', exceptions.length)
exceptions.slice(0, 30).forEach(e => console.log('  !', e))
console.log('解析为 null 的 code:', nullCodes.size)
for (const [c, n] of nullCodes) console.log('  -', c, '×', n)
console.log('所属经络空/定位空:', badMeridian.size)
for (const [c, n] of badMeridian) console.log('  -', c, '×', n)
console.log('\n结论:', (exceptions.length === 0 && nullCodes.size === 0 && badMeridian.size === 0) ? '✅ 全量扫掠零异常、零空解析、零空经络' : '❌ 见上方')
