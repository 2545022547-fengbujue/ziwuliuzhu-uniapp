import { getStemIndex } from './ganzhi.js'
import { getEightPointFull } from './acupuncturePoints.js'

/**
 * 时辰名称
 */
const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

/**
 * 天干八卦对应（飞腾八法）
 */
const STEM_GUA_MAP = {
  '壬': { gua: '乾', number: 9 },
  '甲': { gua: '乾', number: 9 },
  '丙': { gua: '艮', number: 8 },
  '戊': { gua: '坎', number: 1 },
  '庚': { gua: '坤', number: 2 },
  '辛': { gua: '震', number: 3 },
  '丁': { gua: '离', number: 9 },
  '乙': { gua: '离', number: 9 },
  '己': { gua: '兑', number: 7 },
  '癸': { gua: '巽', number: 4 }
}

/**
 * 飞腾八法计算
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 */
export function calculateFeiteng(ganzhi, hourIndex) {
  const dayStem = ganzhi.day.heavenlyStem
  const hourStem = ganzhi.hour.heavenlyStem
  
  // 以天干为主
  const dayGuaData = STEM_GUA_MAP[dayStem]
  const hourGuaData = STEM_GUA_MAP[hourStem]
  
  // 获取开穴
  let openPoints = []
  
  // 飞腾八法天干穴位对应（基于歌诀）
  // 壬甲公孙即是乾，丙居艮上内关然，戊为临泣生坎水，庚属外关震相连，
  // 辛上后溪装巽卦，乙癸申脉到坤传，己土列缺南离上，丁居照海兑金全。
  const stemPointMap = {
    '壬': 'SP4', '甲': 'SP4',   // 公孙 → 乾
    '丙': 'PC6',                // 内关 → 艮
    '戊': 'GB41',               // 足临泣 → 坎
    '庚': 'TE5',                // 外关 → 震
    '辛': 'SI3',                // 后溪 → 巽
    '乙': 'BL62', '癸': 'BL62', // 申脉 → 坤
    '己': 'LU7',                // 列缺 → 离
    '丁': 'KI6'                 // 照海 → 兑
  }
  
  // 根据日天干确定开穴
  const dayCode = stemPointMap[dayStem]
  if (dayCode && dayCode !== '？') {
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
  const hourCode = stemPointMap[hourStem]
  if (hourCode && hourCode !== '？' && hourCode !== dayCode) {
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
