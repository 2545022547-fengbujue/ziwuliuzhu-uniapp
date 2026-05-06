import { getEightPointFull } from './acupuncturePoints.js'
import { HOUR_NAMES } from '@/data/constants.js'
import { STEM_POINT_MAP } from '@/data/eight-points.js'

/**
 * 天干→八卦映射（飞腾八法·先天八卦纳甲）
 *
 * 飞腾八法用先天八卦（伏羲八卦），与灵龟八法的后天八卦不同。
 * 同一个穴位在两个系统中对应不同的卦象，因此不能从 eight-points.js 的 gua/palace 派生。
 *
 * 歌诀：壬甲公孙即是乾，丙居艮上内关然，戊为临泣生坎水，庚属外关震相连，
 *       辛上后溪装巽卦，乙癸申脉到坤传，己土列缺南离上，丁居照海兑金全。
 */
const STEM_GUA_MAP = {
  '壬': { gua: '乾', number: 6 }, '甲': { gua: '乾', number: 6 },
  '丙': { gua: '艮', number: 8 },
  '戊': { gua: '坎', number: 1 },
  '庚': { gua: '震', number: 3 },
  '辛': { gua: '巽', number: 4 },
  '乙': { gua: '坤', number: 2 }, '癸': { gua: '坤', number: 2 },
  '己': { gua: '离', number: 9 },
  '丁': { gua: '兑', number: 7 }
}

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
  
  // 飞腾八法：时天干为主穴，日天干为配穴
  const dayGuaData = STEM_GUA_MAP[dayStem]
  const hourGuaData = STEM_GUA_MAP[hourStem]

  let openPoints = []

  // 时天干 → 主穴
  const hourCode = STEM_POINT_MAP[hourStem]
  if (hourCode) {
    const hourPoint = getEightPointFull(hourCode)
    if (hourPoint) {
      openPoints.push({
        ...hourPoint,
        isOpen: true,
        isPair: false,
        basis: '时天干（主穴）',
        gua: hourGuaData?.gua,
        number: hourGuaData?.number
      })
    }
  }

  // 日天干 → 配穴（仅当日天干与时天干不同时）
  const dayCode = STEM_POINT_MAP[dayStem]
  if (dayCode && dayCode !== hourCode) {
    const dayPoint = getEightPointFull(dayCode)
    if (dayPoint) {
      openPoints.push({
        ...dayPoint,
        isOpen: true,
        isPair: true,
        basis: '日天干（配穴）',
        gua: dayGuaData?.gua,
        number: dayGuaData?.number
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
