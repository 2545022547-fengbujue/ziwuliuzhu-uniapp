const { execFileSync } = require('child_process')
const env = { ...process.env, PYTHONIOENCODING: 'utf-8' }
// 数据门禁（node/python 直跑脚本）：
//   - 灵龟八法回归用例已并入 vitest（src/services/algorithms.test.js，复用真实源码），
//     故不再运行已废弃的 tests/verify-lingui-fix.js（其复制 src 常量表有漂移风险）。
//   - verify-algorithms.js：esbuild 打包真实 services 的多算法黄金断言（与 vitest 双轨）。
for (const [command, args] of [['node', ['tests/verify-algorithms.js']], ['node', ['scripts/validate-points.cjs']], ['python', ['scripts/verify-font-subsets.py']]]) execFileSync(command, args, { stdio: 'inherit', env })
