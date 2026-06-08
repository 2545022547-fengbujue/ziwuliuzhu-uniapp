/**
 * 灵龟八法修复验证脚本
 *
 * 验证表10-16临时干支代数修复后的计算结果
 * 运行方式：node tests/verify-lingui-fix.js
 */

const { Lunar } = require('lunar-javascript')

// ============ 表10-15 逐日干支代数 ============
const DAY_STEM_VALUES = {
  '甲': 10, '己': 10,
  '乙': 9, '庚': 9,
  '丙': 7, '辛': 7,
  '丁': 8, '壬': 8,
  '戊': 7, '癸': 7
}

const DAY_BRANCH_VALUES = {
  '辰': 10, '戌': 10, '丑': 10, '未': 10,
  '申': 9, '酉': 9,
  '寅': 8, '卯': 8,
  '巳': 7, '亥': 7, '子': 7, '午': 7
}

// ============ 表10-16 临时干支代数（修正后）============
const HOUR_STEM_VALUES = {
  '甲': 9, '己': 9,
  '乙': 8, '庚': 8,
  '丙': 7, '辛': 7,
  '丁': 6, '壬': 6,  // ← 修正：原错误为7
  '戊': 5, '癸': 5   // ← 修正：原错误为6
}

const HOUR_BRANCH_VALUES = {
  '子': 9, '午': 9,
  '丑': 8, '未': 8,
  '寅': 7, '申': 7,
  '卯': 6, '酉': 6,
  '辰': 5, '戌': 5,
  '巳': 4, '亥': 4
}

// ============ 九宫八卦对应 ============
const PALACE_GUA = {
  1: '坎', 2: '坤', 3: '震', 4: '巽',
  5: '中宫', 6: '乾', 7: '兑', 8: '艮', 9: '离'
}

const PALACE_POINTS = {
  1: ['后溪', '申脉'],
  2: ['列缺', '照海'],
  3: ['足临泣', '外关'],
  4: ['足临泣', '外关'],
  6: ['公孙', '内关'],
  7: ['后溪', '申脉'],
  8: ['公孙', '内关'],
  9: ['列缺', '照海']
}

// ============ 计算函数 ============
function calculateLingui(date, hourName) {
  const lunar = Lunar.fromDate(date)

  const dayStem = lunar.getDayGan()
  const dayBranch = lunar.getDayZhi()
  const hourStem = lunar.getTimeGan()
  const hourBranch = lunar.getTimeZhi()

  const daySum = DAY_STEM_VALUES[dayStem] + DAY_BRANCH_VALUES[dayBranch]
  const hourSum = HOUR_STEM_VALUES[hourStem] + HOUR_BRANCH_VALUES[hourBranch]
  const totalSum = daySum + hourSum

  // 判断阳日阴日
  const stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const stemIdx = stems.indexOf(dayStem)
  const dayYinYang = stemIdx % 2 === 0 ? '阳' : '阴'

  // 计算九宫数
  let palaceNumber = dayYinYang === '阳'
    ? (totalSum % 9 || 9)
    : (totalSum % 6 || 6)

  // 中宫5处理
  let actualPalace = palaceNumber
  if (palaceNumber === 5) {
    actualPalace = dayYinYang === '阳' ? 2 : 8
  }

  return {
    date: `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`,
    hourName,
    dayGanZhi: lunar.getDayInGanZhi(),
    hourGanZhi: lunar.getTimeInGanZhi(),
    daySum,
    hourSum,
    totalSum,
    dayYinYang,
    palaceNumber,
    actualPalace,
    gua: PALACE_GUA[actualPalace],
    points: PALACE_POINTS[actualPalace]
  }
}

// 验证用例（预期值由修正后的算法计算得出）
const testCases = [
  // 用户报告的问题用例 - 这是核心验证点
  { date: new Date(2026, 4, 26, 12, 0, 0), hour: '午时', expected: ['足临泣', '外关'], desc: '庚子日壬午时（用户报告问题）' },
  // 补充验证用例
  { date: new Date(2026, 4, 26, 6, 0, 0), hour: '卯时', expected: ['足临泣', '外关'], desc: '庚子日己卯时' },
  { date: new Date(2026, 4, 26, 18, 0, 0), hour: '酉时', expected: ['足临泣', '外关'], desc: '庚子日乙酉时' },
  { date: new Date(2026, 4, 27, 12, 0, 0), hour: '午时', expected: ['公孙', '内关'], desc: '辛丑日甲午时' },
  // 验证丁壬=6的关键用例：旧值丁=7会落艮宫，新值丁=6应落兑宫
  { date: new Date(2026, 4, 4, 10, 0, 0), hour: '巳时', expected: ['后溪', '申脉'], desc: '戊寅日丁巳时（验证丁壬=6）' },
]

console.log('='.repeat(60))
console.log('灵龟八法修复验证')
console.log('='.repeat(60))
console.log()

let passed = 0
let failed = 0

for (const tc of testCases) {
  const result = calculateLingui(tc.date, tc.hour)
  const success = result.points[0] === tc.expected[0] && result.points[1] === tc.expected[1]

  if (success) passed++
  else failed++

  console.log(`【${tc.desc}】`)
  console.log(`  日期时辰: ${result.date} ${result.hourName} (${result.dayGanZhi}日 ${result.hourGanZhi}时)`)
  console.log(`  日总和=${result.daySum}, 时总和=${result.hourSum}, 总合=${result.totalSum}`)
  console.log(`  ${result.dayYinYang}日: ${result.totalSum}%${result.dayYinYang==='阳'?'9':'6'}=${result.palaceNumber} → ${result.actualPalace}(${result.gua})`)
  console.log(`  计算结果: ${result.points.join('、')}`)
  console.log(`  预期结果: ${tc.expected.join('、')}`)
  console.log(`  验证状态: ${success ? '✓ 通过' : '✗ 失败'}`)
  console.log()
}

console.log('='.repeat(60))
console.log(`验证结果: ${passed} 通过, ${failed} 失败`)
console.log('='.repeat(60))

// 显示表10-16修正对比
console.log()
console.log('表10-16 临时干支代数修正对比:')
console.log('  天干: 丁壬 原值=7 → 修正=6')
console.log('  天干: 戊癸 原值=6 → 修正=5')

if (failed > 0) {
  process.exit(1)
}
