const { execFileSync } = require('child_process')
const env = { ...process.env, PYTHONIOENCODING: 'utf-8' }
for (const [command, args] of [['node', ['tests/verify-lingui-fix.js']], ['node', ['tests/verify-algorithms.js']], ['node', ['scripts/validate-points.cjs']], ['python', ['scripts/verify-font-subsets.py']]]) execFileSync(command, args, { stdio: 'inherit', env })
