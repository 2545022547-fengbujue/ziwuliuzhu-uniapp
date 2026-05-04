import { getStemIndex } from './ganzhi.js'
import { getEightPointFull } from './acupuncturePoints.js'
import { HOUR_NAMES } from '@/data/constants.js'
import { STEM_POINT_MAP, EIGHT_POINTS_MAP } from '@/data/eight-points.js'

/**
 * 天干八卦对应（飞腾八法）
 * 从八脉八穴共享数据的宫位信息构建
 */
const STEM_GUA_MAP = {}
Object.entries(STEM_POINT_MAP).forEach(([stem, code]) => {
  const point = EIGHT_POINTS_MAP[code]
  if (point) {
    STEM_GUA_MAP[stem] = { gua: point.gua, number: point.palace }
  }
})

/**
 * 飞腾八法计算
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 */
export function calculateFeiteng(ganzhi, hourIndex) {
  if (hourIndex < 0 || hourIndex > 11) {
    console.warn(`飞腾八法：无效的时辰索引 ${hourIndex}`)
    return { method: 'feiteng', methodName: '飞腾八法', openPoints: [] }
  }
  if (!ganzhi?.day?.heavenlyStem || !ganzhi?.hour?.heavenlyStem) {
    console.warn('飞腾八法：干支信息不完整')
    return { method: 'feiteng', methodName: '飞腾八法', openPoints: [] }
  }

  const dayStem = ganzhi.day.heavenlyStem
  const hourStem = ganzhi.hour.heavenlyStem
  
  // 以天干为主
  const dayGuaData = STEM_GUA_MAP[dayStem]
  const hourGuaData = STEM_GUA_MAP[hourStem]
  
  // 获取开穴
  let openPoints = []

  // 根据日天干确定开穴
  const dayCode = STEM_POINT_MAP[dayStem]
  if (dayCode) {
    const dayPoint = getEightPointFull(dayCode)
    if (dayPoint) {
      openPoints.push({
        ...dayPoint,
        isOpen: true,
        isPair: false,
        basis: '日天干',
        gua: dayGuaData?.gua,
        number: dayGuaData?.number
      })
    }
  }

  // 根据时天干确定配穴
  const hourCode = STEM_POINT_MAP[hourStem]
  if (hourCode && hourCode !== dayCode) {
    const hourPoint = getEightPointFull(hourCode)
    if (hourPoint) {
      openPoints.push({
        ...hourPoint,
        isOpen: true,
        isPair: true,
        basis: '时天干',
        gua: hourGuaData?.gua,
        number: hourGuaData?.number
      })
    }
  }
  
  return {
    method: 'feiteng',
    methodName: '飞腾八法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    hourGanZhi: ganzhi.hour.ganZhi,
    dayStem,
    hourStem,
    dayGua: dayGuaData,
    hourGua: hourGuaData,
    openPoints
  }
}
