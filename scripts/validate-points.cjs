const fs = require('fs')
const path = require('path')
const D = path.join('src', 'data')
const read = file => fs.readFileSync(file, 'utf8')
const json = JSON.parse(read(path.join(D, 'acupuncture-points-gb2021.json')))
const pts = json.points
const pointsIndex = Object.fromEntries(pts.map(p => [p.code, p]))
const PREFIXES = ['LU','LI','ST','SP','HT','SI','BL','KI','PC','TE','GB','LR','CV','GV']
const PREFIX_RE = new RegExp(`^(?:${PREFIXES.join('|')})\\d+$`)
const MERIDIAN_CODE_TO_NAME = {
  LU:'手太阴肺经', LI:'手阳明大肠经', ST:'足阳明胃经', SP:'足太阴脾经',
  HT:'手少阴心经', SI:'手太阳小肠经', BL:'足太阳膀胱经', KI:'足少阴肾经',
  PC:'手厥阴心包经', TE:'手少阳三焦经', GB:'足少阳胆经', LR:'足厥阴肝经',
  CV:'任脉', GV:'督脉'
}
const issues = []
const warnings = []
const seenCode = new Set()
const seenName = new Set()
for (const p of pts) {
  for (const field of ['id', 'name', 'pinyin', 'code', 'location', 'source']) {
    if (p[field] === undefined || p[field] === '') issues.push(`[缺字段 ${field}] ${p.code || '?'}`)
  }
  if (!p.notes) warnings.push(`[空 notes] ${p.code}`)
  if (!PREFIX_RE.test(p.code)) issues.push(`[code格式非法] ${p.code}`)
  if (p.id !== p.code) issues.push(`[id≠code] id=${p.id} code=${p.code}`)
  if (seenCode.has(p.code)) issues.push(`[重复code] ${p.code}`)
  if (seenName.has(p.name)) issues.push(`[重复name] ${p.name}`)
  seenCode.add(p.code); seenName.add(p.name)
}
if (json.metadata.totalPoints !== pts.length) issues.push(`[数量不一致] metadata=${json.metadata.totalPoints} actual=${pts.length}`)

const extraText = read(path.join(D, 'extra-points.js'))
const extraCodes = new Set([...extraText.matchAll(/code:\s*['"](EX-[A-Z0-9-]+)['"]/g)].map(m => m[1]))
const refFiles = [
  'special-points.js', 'fanke-points.js', 'eight-points.js', 'constants.js',
  path.join('..', 'services', 'najia.js'), path.join('..', 'services', 'nazi.js'),
  path.join('..', 'services', 'lingui.js'), path.join('..', 'services', 'feiteng.js'),
  path.join('..', 'components', 'ResultPanel.vue'), path.join('..', 'components', 'PointDetail.vue'),
  path.join('..', 'pages', 'index', 'index.vue')
].map(f => path.join(D, f))
const refRe = /['"`]((?:LU|LI|ST|SP|HT|SI|BL|KI|PC|TE|GB|LR|CV|GV)\d{1,3}|EX-[A-Z0-9-]+)['"`]/g
const missing = new Set()
for (const file of refFiles) {
  const text = read(file)
  for (const match of text.matchAll(refRe)) {
    const code = match[1]
    if (code.startsWith('EX-') ? !extraCodes.has(code) : !pointsIndex[code]) missing.add(`${code} (${path.relative('.', file)})`)
  }
}

const specialTexts = [read(path.join(D, 'special-points.js')), read(path.join(D, 'eight-points.js'))]
const meridianIssues = []
for (const text of specialTexts) {
  for (const match of text.matchAll(/code:\s*['"]((?:LU|LI|ST|SP|HT|SI|BL|KI|PC|TE|GB|LR|CV|GV)\d{1,3})['"][^}]*?meridian:\s*['"]([^'"]+)['"]/g)) {
    const expected = MERIDIAN_CODE_TO_NAME[match[1].slice(0, 2)]
    if (expected && expected !== match[2]) meridianIssues.push(`${match[1]}: ${match[2]} ≠ ${expected}`)
  }
}

console.log('===== 穴位数据体检 =====')
console.log(`metadata.totalPoints=${json.metadata.totalPoints} | actual=${pts.length}`)
console.log(`必填字段/格式/重复问题: ${issues.length}`)
issues.forEach(x => console.log('  -', x))
console.log(`notes 为空（允许，待补充说明）: ${warnings.length}`)
console.log(`引用无法解析: ${missing.size}`)
missing.forEach(x => console.log('  -', x))
console.log(`经络前缀不一致: ${meridianIssues.length}`)
meridianIssues.forEach(x => console.log('  -', x))
const failed = issues.length + missing.size + meridianIssues.length
console.log(`\n结论: ${failed ? '❌ 存在阻断问题' : '✅ 数据结构、引用解析和经络映射通过'}`)
if (failed) process.exitCode = 1
