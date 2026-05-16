import { Lunar, Solar } from 'lunar-javascript'
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  HOUR_NAMES
} from '@/data/constants.js'

// Re-export 常量供其他模块使用
export { HEAVENLY_STEMS, EARTHLY_BRANCHES, HOUR_NAMES }

/**
 * 获取一年中的第几天
 * @param {Date} date
 * @returns {number}
 */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * 计算真平太阳时差（Equation of Time）
 * 使用近似公式：EoT = 9.87sin(2B) - 7.53cos(B) - 1.5sin(B)
 * @param {Date} date - 日期
 * @returns {number} 时差（分钟）
 */
function calculateEquationOfTime(date) {
  const dayOfYear = getDayOfYear(date)
  const B = (2 * Math.PI / 365) * (dayOfYear - 81)
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/**
 * 获取真太阳时校正后的日期时间
 * @param {Date} date - 原始本地时间
 * @param {number} longitude - 当地经度（默认北京经度 116.407°E）
 * @param {boolean} useTrueSolarTime - 是否启用真太阳时校正
 * @returns {Date} 校正后的时间；未启用时返回原始时间
 */
export function getTrueSolarDate(date, longitude = 116.407, useTrueSolarTime = false) {
  if (!useTrueSolarTime || !longitude) return date

  const offsetMinutes = (longitude - 120) * 4
  const eotMinutes = calculateEquationOfTime(date)
  const totalMs = (offsetMinutes + eotMinutes) * 60 * 1000
  return new Date(date.getTime() + totalMs)
}

/**
 * 获取指定日期的完整干支信息
 * @param {Date} date - 公历日期
 * @param {number} longitude - 当地经度（默认北京经度 116.407°E）
 * @param {boolean} useTrueSolarTime - 是否使用真太阳时校正
 * @returns {Object} 干支信息
 */
export function getGanZhi(date, longitude = 116.407, useTrueSolarTime = false) {
  // 真太阳时校正：经度偏移 + 时差方程(EoT)
  const adjustedDate = getTrueSolarDate(date, longitude, useTrueSolarTime)

  // 子时翻转修正：传统历法中 23:00-01:00 为次日子时，日干支应从23:00起算次日
  // lunar-javascript 将 23:00-23:59 视为"当天的子时"，与传统历法不符
  // 修正方法：将 23:00-23:59 映射到次日 00:00 再计算，确保日干支和时干支都正确
  // 同时处理真太阳时校正后往前跨日的情况（经度>120°时，校正后日期可能已进入次日）
  let lunarDate = adjustedDate
  const adjustedHour = adjustedDate.getHours()
  const isCrossDay = date.getDate() !== adjustedDate.getDate()

  if (adjustedHour >= 23) {
    // 情况1：23:00-23:59 → 次日 00:00（用年月日构造避免 +24h 语义歧义）
    lunarDate = new Date(
      adjustedDate.getFullYear(),
      adjustedDate.getMonth(),
      adjustedDate.getDate() + 1,
      0, 0, 0
    )
  } else if (isCrossDay) {
    // 情况2：真太阳时校正导致跨日（往东偏，经度>120°），直接使用校正后的日期
    lunarDate = adjustedDate
  }

  // 使用lunar-javascript获取干支
  const lunar = Lunar.fromDate(lunarDate)

  return {
    year: {
      heavenlyStem: lunar.getYearGan(),
      earthlyBranch: lunar.getYearZhi(),
      ganZhi: lunar.getYearInGanZhi()
    },
    month: {
      heavenlyStem: lunar.getMonthGan(),
      earthlyBranch: lunar.getMonthZhi(),
      ganZhi: lunar.getMonthInGanZhi()
    },
    day: {
      heavenlyStem: lunar.getDayGan(),
      earthlyBranch: lunar.getDayZhi(),
      ganZhi: lunar.getDayInGanZhi()
    },
    hour: {
      heavenlyStem: lunar.getTimeGan(),
      earthlyBranch: lunar.getTimeZhi(),
      ganZhi: lunar.getTimeInGanZhi()
    },
    // 农历日期
    lunarDate: {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      isLeap: lunar.getMonth() < 0
    },
    // 附加信息
    metadata: {
      originalDate: date,
      adjustedDate: adjustedDate,
      longitude,
      useTrueSolarTime
    }
  }
}

/**
 * 获取天干索引
 * @param {string} stem - 天干
 * @returns {number} 索引 (0-9)
 */
export function getStemIndex(stem) {
  return HEAVENLY_STEMS.indexOf(stem)
}

/**
 * 获取地支索引
 * @param {string} branch - 地支
 * @returns {number} 索引 (0-11)
 */
export function getBranchIndex(branch) {
  return EARTHLY_BRANCHES.indexOf(branch)
}
