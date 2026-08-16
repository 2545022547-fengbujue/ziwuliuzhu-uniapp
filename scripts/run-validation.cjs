const { execFileSync, spawnSync } = require('child_process')
const env = { ...process.env, PYTHONIOENCODING: 'utf-8' }
// 数据门禁（node/python 直跑脚本）：
//   - 灵龟八法回归用例已并入 vitest（src/services/algorithms.test.js，复用真实源码），
//     故不再运行已废弃的 tests/verify-lingui-fix.js（其复制 src 常量表有漂移风险）。
//   - verify-algorithms.js：esbuild 打包真实 services 的多算法黄金断言（与 vitest 双轨）。
//   - verify-font-subsets.py 需要 Python fontTools；缺失时先给人类可读的安装指引，
//     而不是把 ModuleNotFoundError 直接甩给 CI 日志。
// Windows 上解释器名可能是 py；优先 python，失败再试 py，两个都不行才报错。
let python = 'python'
let fontToolsCheck = spawnSync(python, ['-c', 'import fontTools; print(fontTools.version)'], { encoding: 'utf8', env })
if (fontToolsCheck.error || fontToolsCheck.status !== 0) {
  python = 'py'
  fontToolsCheck = spawnSync(python, ['-c', 'import fontTools; print(fontTools.version)'], { encoding: 'utf8', env })
}
if (fontToolsCheck.error || fontToolsCheck.status !== 0) {
  console.error('')
  console.error('❌ 字体回归门禁需要 Python 包 fonttools，但当前 Python 环境未安装。')
  console.error('   安装方法（二选一）：')
  console.error('     pip install -r requirements-dev.txt')
  console.error('     python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt（受管控系统/Windows 推荐）')
  console.error('   安装后重新运行 npm test。')
  console.error('')
  process.exit(1)
}
for (const [command, args] of [['node', ['tests/verify-algorithms.js']], ['node', ['scripts/validate-points.cjs']], [python, ['scripts/verify-font-subsets.py']]]) execFileSync(command, args, { stdio: 'inherit', env })
