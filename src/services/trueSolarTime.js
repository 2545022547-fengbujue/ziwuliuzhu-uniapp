/**
 * 真太阳时计算模块
 * 基于经度校正和时差计算
 */

/**
 * 中国主要城市经度
 */
export const CITY_LONGITUDE = {
  '北京': 116.4,
  '上海': 121.5,
  '广州': 113.3,
  '深圳': 114.1,
  '成都': 104.1,
  '西安': 108.9,
  '杭州': 120.2,
  '南京': 118.8,
  '武汉': 114.3,
  '重庆': 106.5,
  '天津': 117.2,
  '长沙': 112.9,
  '郑州': 113.7,
  '济南': 117.0,
  '福州': 119.3,
  '厦门': 118.1,
  '昆明': 102.7,
  '贵阳': 106.7,
  '南宁': 108.3,
  '哈尔滨': 126.6,
  '长春': 125.3,
  '沈阳': 123.4,
  '大连': 121.6,
  '青岛': 120.4,
  '石家庄': 114.5,
  '太原': 112.5,
  '呼和浩特': 111.7,
  '银川': 106.3,
  '西宁': 101.8,
  '兰州': 103.8,
  '乌鲁木齐': 87.6,
  '拉萨': 91.1
}

/**
 * 计算真太阳时
 * @param {Date} date - 北京时间
 * @param {number} longitude - 当地经度（默认中国大陆中心经度104°E）
 * @returns {Date} 真太阳时
 */
export function calculateTrueSolarTime(date, longitude = 104) {
  // 1. 计算平太阳时
  // 北京时间以东经120°为基准
  // 每1度经度差 = 4分钟时间差
  const offsetMinutes = (longitude - 120) * 4
  const pingSolarTime = new Date(date.getTime() + offsetMinutes * 60 * 1000)
  
  // 2. 计算真平太阳时差（Equation of Time）
  const eqOfTime = calculateEquationOfTime(date)
  
  // 3. 计算真太阳时
  const trueSolarTime = new Date(pingSolarTime.getTime() + eqOfTime * 60 * 1000)
  
  return trueSolarTime
}

/**
 * 计算真平太阳时差（EoT）
 * 使用近似公式
 * @param {Date} date - 日期
 * @returns {number} 时差（分钟）
 */
function calculateEquationOfTime(date) {
  const dayOfYear = getDayOfYear(date)
  
  // 使用近似公式
  // B = (2π / 365) × (day - 81)
  const B = (2 * Math.PI / 365) * (dayOfYear - 81)
  
  // EoT = 9.87sin(2B) - 7.53cos(B) - 1.5sin(B)
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
  
  return EoT // 分钟
}

/**
 * 获取一年中的第几天
 */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * 根据时辰索引判断时辰名称
 * @param {Date} trueSolarTime - 真太阳时
 * @returns {number} 时辰索引 (0-11)
 */
export function getHourIndexByTrueSolarTime(trueSolarTime) {
  const hours = trueSolarTime.getHours()
  
  if (hours >= 23 || hours < 1) return 0  // 子时
  if (hours >= 1 && hours < 3) return 1   // 丑时
  if (hours >= 3 && hours < 5) return 2   // 寅时
  if (hours >= 5 && hours < 7) return 3   // 卯时
  if (hours >= 7 && hours < 9) return 4   // 辰时
  if (hours >= 9 && hours < 11) return 5  // 巳时
  if (hours >= 11 && hours < 13) return 6 // 午时
  if (hours >= 13 && hours < 15) return 7 // 未时
  if (hours >= 15 && hours < 17) return 8 // 申时
  if (hours >= 17 && hours < 19) return 9 // 酉时
  if (hours >= 19 && hours < 21) return 10 // 戌时
  if (hours >= 21 && hours < 23) return 11 // 亥时
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
