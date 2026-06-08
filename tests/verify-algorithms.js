/**
 * 多算法核心案例验证
 *
 * 直接打包并调用 src/services 中的真实算法，避免测试脚本复制一套业务常量。
 */
const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const root = path.resolve(__dirname, '..')
const tmpEntry = path.join(__dirname, '.tmp-algorithm-test-entry.mjs')
const tmpBundle = path.join(__dirname, '.tmp-algorithm-test-bundle.cjs')

const entrySource = `
import { getGanZhi, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../src/services/ganzhi.js'
import { WU_SHU_DUN } from '../src/data/constants.js'
import { calculateNajia, calculateFanke } from '../src/services/najia.js'
import { calculateNazi } from '../src/services/nazi.js'
import { calculateLingui } from '../src/services/lingui.js'
import { calculateFeiteng } from '../src/services/feiteng.js'

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

export function runCases() {
  const gengziWu = makeGanZhi(new Date(2026, 4, 26), 6)
  const wuyinSi = makeGanZhi(new Date(2026, 4, 4), 5)

  return {
    gengziWu: {
      ganzhi: gengziWu,
      lingui: calculateLingui(gengziWu, 6),
      feiteng: calculateFeiteng(gengziWu, 6),
      nazi: calculateNazi(gengziWu, 0),
      najia: calculateNajia(gengziWu, 6),
      fanke: calculateFanke(gengziWu, 6)
    },
    wuyinSi: {
      ganzhi: wuyinSi,
      lingui: calculateLingui(wuyinSi, 5),
      feiteng: calculateFeiteng(wuyinSi, 5),
      najia: calculateNajia(wuyinSi, 5),
      fanke: calculateFanke(wuyinSi, 5)
    }
  }
}
`

function aliasAtPlugin() {
  return {
    name: 'alias-at',
    setup(build) {
      build.onResolve({ filter: /^@\// }, args => ({
        path: path.join(root, 'src', args.path.slice(2))
      }))
    }
  }
}

function pointCodes(points) {
  return (points || []).map(point => point.code)
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    throw new Error(`${message}: expected ${e}, got ${a}`)
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(message)
  }
}

async function main() {
  fs.writeFileSync(tmpEntry, entrySource, 'utf8')
  await esbuild.build({
    entryPoints: [tmpEntry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: tmpBundle,
    plugins: [aliasAtPlugin()],
    logLevel: 'silent'
  })

  delete require.cache[tmpBundle]
  const { runCases } = require(tmpBundle)
  const cases = runCases()

  const checks = [
    () => assertEqual(cases.gengziWu.ganzhi.day.ganZhi, '庚子', '2026-05-26 日干支'),
    () => assertEqual(cases.gengziWu.ganzhi.hour.ganZhi, '壬午', '庚子日午时时干支'),
    () => assertEqual(cases.gengziWu.lingui.palace.actualPalace, 4, '庚子日壬午时灵龟宫位'),
    () => assertDeepEqual(pointCodes(cases.gengziWu.lingui.openPoints), ['GB41', 'TE5'], '庚子日壬午时灵龟开穴'),
    () => assertDeepEqual(pointCodes(cases.gengziWu.feiteng.openPoints), ['SP4', 'PC6'], '壬时飞腾开穴'),

    () => assertEqual(cases.wuyinSi.ganzhi.day.ganZhi, '戊寅', '2026-05-04 日干支'),
    () => assertEqual(cases.wuyinSi.ganzhi.hour.ganZhi, '丁巳', '戊寅日巳时时干支'),
    () => assertEqual(cases.wuyinSi.lingui.palace.actualPalace, 7, '戊寅日丁巳时灵龟宫位'),
    () => assertDeepEqual(pointCodes(cases.wuyinSi.lingui.openPoints), ['SI3', 'BL62'], '戊寅日丁巳时灵龟开穴'),
    () => assertDeepEqual(pointCodes(cases.wuyinSi.feiteng.openPoints), ['KI6', 'LU7'], '丁时飞腾开穴'),
    () => assertDeepEqual(pointCodes(cases.wuyinSi.fanke.openPoints), ['PC7'], '戊日丁巳时反克开穴'),

    () => assertEqual(cases.gengziWu.nazi.hourMeridian.code, 'GB', '子时纳子值时经络'),
    () => assertDeepEqual(pointCodes(cases.gengziWu.nazi.openPoints), ['GB44', 'GB43', 'GB41', 'GB38', 'GB34'], '胆经五输穴顺序'),
    () => assertEqual(cases.gengziWu.nazi.benPoint.code, 'GB41', '胆经本穴'),
    () => assertEqual(cases.gengziWu.nazi.yuanPoint.code, 'GB40', '胆经原穴'),
    () => assertEqual(cases.gengziWu.nazi.muPoint.code, 'GB43', '胆经母穴'),
    () => assertEqual(cases.gengziWu.nazi.ziPoint.code, 'GB38', '胆经子穴'),

    () => assertEqual(cases.gengziWu.najia.dailySequence.length, 12, '纳甲每日流注序列长度'),
    () => assertTruthy(cases.gengziWu.najia.dailySequence.some(item => item.isOpen), '纳甲当天应有开穴时辰'),
    () => assertEqual(cases.gengziWu.najia.isClosed, true, '庚子日壬午时纳甲为闭穴'),
    () => assertTruthy(cases.gengziWu.najia.alternativePoints, '纳甲闭穴应提供合日互用'),
    () => assertEqual(cases.gengziWu.najia.alternativePoints.heLabel, '庚合乙', '庚日合日互用标签')
  ]

  let passed = 0
  const failures = []
  checks.forEach((check, index) => {
    try {
      check()
      passed += 1
    } catch (error) {
      failures.push(`用例 ${index + 1}: ${error.message}`)
    }
  })

  console.log(`多算法验证: ${passed} 通过, ${failures.length} 失败`)
  if (failures.length > 0) {
    failures.forEach(item => console.error(item))
    process.exit(1)
  }
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    for (const file of [tmpEntry, tmpBundle]) {
      try {
        fs.unlinkSync(file)
      } catch (_) {
        // ignore cleanup errors
      }
    }
  })
