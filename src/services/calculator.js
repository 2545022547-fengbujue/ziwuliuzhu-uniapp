import { getGanZhi, getHourIndex, getTrueSolarTime } from './ganzhi.js'
import { calculateNajia, calculateFanke } from './najia.js'
import { calculateNazi } from './nazi.js'
import { calculateLingui } from './lingui.js'
import { calculateFeiteng } from './feiteng.js'

/**
 * 统一计算接口
 * @param {Date} date - 日期
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @param {Object} options - 选项
 * @returns {Object} 所有取穴方法的结果
 */
export function calculateAll(date, hourIndex, options = {}) {
  const {
    useTrueSolarTime = true,
    longitude = 104, // 中国大陆中心经度
    diseaseType = '平补平泻'
  } = options
  
  // 真太阳时校正
  let adjustedDate = date
  
  if (useTrueSolarTime && longitude) {
    adjustedDate = getTrueSolarTime(date, longitude)
  }
  
  // 获取干支（使用校正后的日期，但保持用户选择的时辰索引）
  const ganzhi = getGanZhi(adjustedDate, longitude, useTrueSolarTime)
  
  // 计算所有取穴方法（使用用户选择的 hourIndex）
  const results = {
    najia: calculateNajia(ganzhi, hourIndex),
    nazi: calculateNazi(ganzhi, hourIndex, diseaseType),
    lingui: calculateLingui(ganzhi, hourIndex),
    feiteng: calculateFeiteng(ganzhi, hourIndex),
    fanke: calculateFanke(ganzhi, hourIndex)
  }
  
  return {
    ganzhi,
    results,
    metadata: {
      date: adjustedDate,
      hourIndex: hourIndex,
      originalDate: date,
      useTrueSolarTime,
      longitude,
      diseaseType
    }
  }
}

/**
 * 获取穴位信息
 * @param {string} pointId - 穴位ID
 * @param {Array} pointsDatabase - 穴位数据库
 * @returns {Object|null} 穴位信息
 */
export function getPointById(pointId, pointsDatabase) {
  return pointsDatabase.find(p => p.id === pointId) || null
}

/**
 * 获取某经络的所有穴位
 * @param {string} meridianCode - 经络代码
 * @param {Array} pointsDatabase - 穴位数据库
 * @returns {Array} 穴位数组
 */
export function getPointsByMeridian(meridianCode, pointsDatabase) {
  return pointsDatabase.filter(p => p.meridianCode === meridianCode)
}

/**
 * 搜索穴位
 * @param {string} keyword - 搜索关键词
 * @param {Array} pointsDatabase - 穴位数据库
 * @returns {Array} 匹配的穴位数组
 */
export function searchPoints(keyword, pointsDatabase) {
  const lowerKeyword = keyword.toLowerCase()
  return pointsDatabase.filter(p => 
    p.name.includes(keyword) ||
    p.pinyin.toLowerCase().includes(lowerKeyword) ||
    p.code.toLowerCase().includes(lowerKeyword) ||
    p.meridian.includes(keyword)
  )
}
