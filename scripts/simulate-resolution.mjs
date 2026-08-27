import fs from 'fs'
import { SPECIAL_POINTS } from '../src/data/special-points.js'
import { FANKE_TABLE } from '../src/data/fanke-points.js'
import { EIGHT_POINTS_MAP } from '../src/data/eight-points.js'
import { EXTRA_POINTS } from '../src/data/extra-points.js'
import { MERIDIAN_CODE_TO_NAME, NAZI_SPECIAL_POINTS } from '../src/data/constants.js'

const json = JSON.parse(fs.readFileSync(new URL('../src/data/acupuncture-points-gb2021.json', import.meta.url)))
const pointsIndex = {}
json.points.forEach(p => { pointsIndex[p.code] = p })
EXTRA_POINTS.forEach(p => { pointsIndex[p.code] = p })

const MERIDIAN_NAME_TO_CODE = Object.fromEntries(
  Object.entries(MERIDIAN_CODE_TO_NAME).map(([code, name]) => [name, code])
)
const CODE_TO_MERIDIAN = {}
SPECIAL_POINTS.forEach(p => {
  const code = MERIDIAN_NAME_TO_CODE[p.meridian]
  if (code) CODE_TO_MERIDIAN[p.code] = code
})

// 复刻 getPointByCode
function getPointByCode(code) {
  const base = pointsIndex[code]
  if (!base) return null
  if (base.category === '经外奇穴') return base
  const meridianCode = CODE_TO_MERIDIAN[code]
  const meridian = meridianCode ? MERIDIAN_CODE_TO_NAME[meridianCode] : ''
  const sp = SPECIAL_POINTS.find(p => p.code === code)
  let category = '', categories = [], wuxing = ''
  if (sp) { categories = sp.categories; category = categories.join('、'); wuxing = sp.wuxing || '' }
  return { ...base, meridian, category, categories, wuxing }
}

const issues = []
function check(code, where) {
  const r = getPointByCode(code)
  if (!r) { issues.push('[查不到] ' + code + ' (' + where + ')'); return }
  if (!r.location || r.location === '') issues.push('[定位空] ' + code + ' (' + where + ')')
  if (r.category !== '经外奇穴' && r.meridian === '') issues.push('[所属经络空] ' + code + ' (' + where + ')')
}

console.log('=== 仿真 getPointByCode：覆盖所有算法会产出的 code ===')
SPECIAL_POINTS.forEach(p => check(p.code, 'SPECIAL_POINTS'))
Object.values(NAZI_SPECIAL_POINTS).forEach(o => Object.values(o).forEach(c => check(c, 'NAZI_SPECIAL_POINTS')))
Object.values(FANKE_TABLE).forEach(o => check(o.code, 'FANKE_TABLE'))
Object.keys(EIGHT_POINTS_MAP).forEach(c => check(c, 'EIGHT_POINTS_MAP'))
EXTRA_POINTS.forEach(p => check(p.code, 'EXTRA_POINTS'))

console.log('检查 code 总数:', SPECIAL_POINTS.length + Object.keys(NAZI_SPECIAL_POINTS).length * 4 + Object.keys(FANKE_TABLE).length + Object.keys(EIGHT_POINTS_MAP).length + EXTRA_POINTS.length)
console.log('问题项:', issues.length)
issues.forEach(x => console.log('  -', x))

// 专项：太溪/筑宾 修复后
console.log('\n=== 专项复核 ===')
;['KI3', 'KI9', 'GB35', 'KI8', 'BL59'].forEach(c => {
  const r = getPointByCode(c)
  console.log(c, '->', r ? (r.name + ' | 经络=' + (r.meridian || '空') + ' | 定位=' + (r.location ? 'OK' : '空') + ' | id=' + r.id) : 'NULL')
})

console.log('\n结论:', issues.length === 0 ? '✅ 所有算法引用 code 均正常解析，无空所属经络/空定位' : '❌ 仍有 ' + issues.length + ' 处问题')
