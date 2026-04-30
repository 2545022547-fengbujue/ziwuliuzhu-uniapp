import { Lunar, Solar } from 'lunar-javascript'

/**
 * 天干地支常量
 */
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/**
 * 时辰名称
 */
export const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

/**
 * 时辰时间范围
 */
export const HOUR_RANGES = [
  { start: 23, end: 1, name: '子时' },   // 23:00-01:00
  { start: 1, end: 3, name: '丑时' },    // 01:00-03:00
  { start: 3, end: 5, name: '寅时' },    // 03:00-05:00
  { start: 5, end: 7, name: '卯时' },    // 05:00-07:00
  { start: 7, end: 9, name: '辰时' },    // 07:00-09:00
  { start: 9, end: 11, name: '巳时' },   // 09:00-11:00
  { start: 11, end: 13, name: '午时' },  // 11:00-13:00
  { start: 13, end: 15, name: '未时' },  // 13:00-15:00
  { start: 15, end: 17, name: '申时' },  // 15:00-17:00
  { start: 17, end: 19, name: '酉时' },  // 17:00-19:00
  { start: 19, end: 21, name: '戌时' },  // 19:00-21:00
  { start: 21, end: 23, name: '亥时' }   // 21:00-23:00
]

/**
 * 中国主要城市经度
 */
export const CITY_LONGITUDE = {
  '北京': 116.4, '上海': 121.5, '广州': 113.3, '深圳': 114.1,
  '成都': 104.1, '西安': 108.9, '杭州': 120.2, '南京': 118.8,
  '武汉': 114.3, '重庆': 106.5, '天津': 117.2, '长沙': 112.9,
  '郑州': 113.7, '济南': 117.0, '福州': 119.3, '厦门': 118.1,
  '昆明': 102.7, '贵阳': 106.7, '南宁': 108.3, '哈尔滨': 126.6,
  '长春': 125.3, '沈阳': 123.4, '大连': 121.6, '青岛': 120.4,
  '石家庄': 114.5, '太原': 112.5, '呼和浩特': 111.7, '银川': 106.3,
  '西宁': 101.8, '兰州': 103.8, '乌鲁木齐': 87.6, '拉萨': 91.1
}

/**
 * 获取指定日期的完整干支信息
 * @param {Date} date - 公历日期
 * @param {number} longitude - 当地经度（默认中国大陆中心经度104°E）
 * @param {boolean} useTrueSolarTime - 是否使用真太阳时校正
 * @returns {Object} 干支信息
 */
export function getGanZhi(date, longitude = 104, useTrueSolarTime = true) {
  // 真太阳时校正（手动计算：经度差 × 4分钟）
  let adjustedDate = date
  if (useTrueSolarTime && longitude) {
    const offsetMinutes = (longitude - 120) * 4
    const offsetMs = offsetMinutes * 60 * 1000
    adjustedDate = new Date(date.getTime() + offsetMs)
  }
  
  // 使用lunar-javascript获取干支
  const lunar = Lunar.fromDate(adjustedDate)
  
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
 * 将24小时制时间转换为时辰索引
 * @param {Date} date - 日期时间对象
 * @returns {number} 时辰索引 (0-11)
 */
export function getHourIndex(date) {
  const hour = date.getHours()
  
  if (hour >= 23 || hour < 1) return 0  // 子时
  if (hour >= 1 && hour < 3) return 1   // 丑时
  if (hour >= 3 && hour < 5) return 2   // 寅时
  if (hour >= 5 && hour < 7) return 3   // 卯时
  if (hour >= 7 && hour < 9) return 4   // 辰时
  if (hour >= 9 && hour < 11) return 5  // 巳时
  if (hour >= 11 && hour < 13) return 6 // 午时
  if (hour >= 13 && hour < 15) return 7 // 未时
  if (hour >= 15 && hour < 17) return 8 // 申时
  if (hour >= 17 && hour < 19) return 9 // 酉时
  if (hour >= 19 && hour < 21) return 10 // 戌时
  if (hour >= 21 && hour < 23) return 11 // 亥时
}

/**
 * 获取时辰名称
 * @param {number} hourIndex - 时辰索引
 * @returns {string} 时辰名称
 */
export function getHourName(hourIndex) {
  return HOUR_NAMES[hourIndex] || ''
}

/**
 * 获取真太阳时
 * @param {Date} date - 原始时间
 * @param {number} longitude - 经度（默认中国大陆中心经度104°E）
 * @returns {Date} 校正后的时间
 */
export function getTrueSolarTime(date, longitude = 104) {
  const offsetMinutes = (longitude - 120) * 4
  const offsetMs = offsetMinutes * 60 * 1000
  return new Date(date.getTime() + offsetMs)
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

/**
 * 判断天干阴阳
 * @param {string} stem - 天干
 * @returns {string} '阳' 或 '阴'
 */
export function getStemYinYang(stem) {
  const index = getStemIndex(stem)
  return index % 2 === 0 ? '阳' : '阴'
}

/**
 * 判断地支阴阳
 * @param {string} branch - 地支
 * @returns {string} '阳' 或 '阴'
 */
export function getBranchYinYang(branch) {
  const index = getBranchIndex(branch)
  return index % 2 === 0 ? '阳' : '阴'
}

/**
 * 天干五行属性
 */
export const STEM_WUXING = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
}

/**
 * 地支五行属性
 */
export const BRANCH_WUXING = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水'
}

/**
 * 获取城市经度
 */
export function getCityLongitude(cityName) {
  return CITY_LONGITUDE[cityName] || 104
}

/**
 * 计算时辰偏差（真太阳时与北京时间的差异）
 */
export function getTimeOffset(longitude = 104) {
  const offsetMinutes = (longitude - 120) * 4
  return {
    minutes: offsetMinutes,
    hours: offsetMinutes / 60,
    description: `${offsetMinutes > 0 ? '+' : ''}${offsetMinutes}分钟`
  }
}
