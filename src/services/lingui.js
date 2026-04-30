/**
 * 灵龟八法完整算法
 * 基于教材：八卦、九宫、八脉、八穴、干支代数
 */

import { getStemIndex, getBranchIndex } from './ganzhi.js'
import { getEightPointFull } from './acupuncturePoints.js'

/**
 * 时辰名称
 */
const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

/**
 * 八法逐日干支代数（教材表10-15）
 */
const DAY_STEM_VALUES = {
  '甲': 9, '己': 9,
  '乙': 8, '庚': 8,
  '丙': 7, '辛': 7,
  '丁': 6, '壬': 6,
  '戊': 5, '癸': 5
}

const DAY_BRANCH_VALUES = {
  '子': 9, '午': 9,
  '丑': 8, '未': 8,
  '寅': 7, '申': 7,
  '卯': 6, '酉': 6,
  '辰': 5, '戌': 5,
  '巳': 4, '亥': 4
}

/**
 * 八法临时干支代数（教材表10-16）
 */
const HOUR_STEM_VALUES = {
  '甲': 9, '己': 9,
  '乙': 8, '庚': 8,
  '丙': 7, '辛': 7,
  '丁': 6, '壬': 6,
  '戊': 5, '癸': 5
}

const HOUR_BRANCH_VALUES = {
  '子': 9, '午': 9,
  '丑': 8, '未': 8,
  '寅': 7, '申': 7,
  '卯': 6, '酉': 6,
  '辰': 5, '戌': 5,
  '巳': 4, '亥': 4
}

/**
 * 八卦九宫对应
 */
const PALACE_GUA = {
  1: '坎', 2: '坤', 3: '震', 4: '巽',
  5: '中宫', 6: '乾', 7: '兑', 8: '艮', 9: '离'
}

/**
 * 九宫方位
 */
const PALACE_DIRECTION = {
  1: '正北', 2: '西南', 3: '正东', 4: '东南',
  5: '中央', 6: '西北', 7: '正西', 8: '东北', 9: '正南'
}

/**
 * 八脉八穴（教材八法逐日干支代数）
 */
const EIGHT_POINTS = [
  { 
    id: 'SP4', name: '公孙', code: 'SP4', 
    meridian: '足太阴脾经', 
    connectedMeridian: '冲脉',
    gua: '乾', palace: 6,
    pairedPoint: '内关', pairedCode: 'PC6'
  },
  { 
    id: 'PC6', name: '内关', code: 'PC6', 
    meridian: '手厥阴心包经', 
    connectedMeridian: '阴维脉',
    gua: '艮', palace: 8,
    pairedPoint: '公孙', pairedCode: 'SP4'
  },
  { 
    id: 'SI3', name: '后溪', code: 'SI3', 
    meridian: '手太阳小肠经', 
    connectedMeridian: '督脉',
    gua: '坎', palace: 1,
    pairedPoint: '申脉', pairedCode: 'BL62'
  },
  { 
    id: 'BL62', name: '申脉', code: 'BL62', 
    meridian: '足太阳膀胱经', 
    connectedMeridian: '阳跷脉',
    gua: '震', palace: 3,
    pairedPoint: '后溪', pairedCode: 'SI3'
  },
  { 
    id: 'GB41', name: '足临泣', code: 'GB41', 
    meridian: '足少阳胆经', 
    connectedMeridian: '带脉',
    gua: '巽', palace: 4,
    pairedPoint: '外关', pairedCode: 'TE5'
  },
  { 
    id: 'TE5', name: '外关', code: 'TE5', 
    meridian: '手少阳三焦经', 
    connectedMeridian: '阳维脉',
    gua: '离', palace: 9,
    pairedPoint: '足临泣', pairedCode: 'GB41'
  },
  { 
    id: 'LU7', name: '列缺', code: 'LU7', 
    meridian: '手太阴肺经', 
    connectedMeridian: '任脉',
    gua: '坤', palace: 2,
    pairedPoint: '照海', pairedCode: 'KI6'
  },
  { 
    id: 'KI6', name: '照海', code: 'KI6', 
    meridian: '足少阴肾经', 
    connectedMeridian: '阴跷脉',
    gua: '兑', palace: 7,
    pairedPoint: '列缺', pairedCode: 'LU7'
  }
]

/**
 * 灵龟八法计算（完整实现）
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 */
export function calculateLingui(ganzhi, hourIndex) {
  const dayStem = ganzhi.day.heavenlyStem
  const dayBranch = ganzhi.day.earthlyBranch
  const hourStem = ganzhi.hour.heavenlyStem
  const hourBranch = ganzhi.hour.earthlyBranch
  
  // 1. 计算干支代数（教材表10-15/10-16）
  const dayStemValue = DAY_STEM_VALUES[dayStem] || 0
  const dayBranchValue = DAY_BRANCH_VALUES[dayBranch] || 0
  const hourStemValue = HOUR_STEM_VALUES[hourStem] || 0
  const hourBranchValue = HOUR_BRANCH_VALUES[hourBranch] || 0
  
  const daySum = dayStemValue + dayBranchValue
  const hourSum = hourStemValue + hourBranchValue
  const totalSum = daySum + hourSum
  
  // 2. 计算九宫数
  // 阳日除9，阴日除6
  const dayYinYang = getStemIndex(dayStem) % 2 === 0 ? '阳' : '阴'
  let palaceNumber = dayYinYang === '阳' 
    ? (totalSum % 9 || 9) 
    : (totalSum % 6 || 6)
  
  // 中宫5的处理：阳日归坤(2)，阴日归艮(8)
  let actualPalace = palaceNumber
  if (palaceNumber === 5) {
    actualPalace = dayYinYang === '阳' ? 2 : 8
  }
  
  const gua = PALACE_GUA[actualPalace] || ''
  const direction = PALACE_DIRECTION[actualPalace] || ''
  
  // 3. 根据九宫数获取开穴（使用actualPalace）
  const openPoints = getPointsByPalace(actualPalace)
  
  // 4. 计算父母夫妻男女配穴
  const pairedPoints = getPairedPoints(actualPalace)
  
  return {
    method: 'lingui',
    methodName: '灵龟八法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    hourGanZhi: ganzhi.hour.ganZhi,
    palace: {
      daySum,
      hourSum,
      totalSum,
      palaceNumber,
      actualPalace,
      gua,
      direction,
      dayYinYang,
      dayStemValue,
      dayBranchValue,
      hourStemValue,
      hourBranchValue
    },
    openPoints,
    pairedPoints,
    eightPoints: EIGHT_POINTS
  }
}

/**
 * 根据九宫数获取开穴
 */
function getPointsByPalace(palaceNumber) {
  const points = []
  
  // 九宫数对应穴位
  const palaceMap = {
    1: ['SI3', 'BL62'],      // 坎宫：后溪、申脉
    2: ['LU7', 'KI6'],       // 坤宫：列缺、照海
    3: ['GB41', 'TE5'],      // 震宫：足临泣、外关
    4: ['GB41', 'TE5'],      // 巽宫：足临泣、外关
    6: ['SI3', 'BL62'],      // 乾宫：后溪、申脉
    7: ['LU7', 'KI6'],       // 兑宫：列缺、照海
    8: ['SP4', 'PC6'],       // 艮宫：公孙、内关
    9: ['SP4', 'PC6']        // 离宫：公孙、内关
  }
  
  const codes = palaceMap[palaceNumber] || []
  
  codes.forEach(code => {
    const point = getEightPointFull(code)
    if (point) {
      points.push({
        ...point,
        isOpen: true,
        isPair: false
      })
    }
  })
  
  return points
}

/**
 * 获取配穴（父母夫妻男女配穴）
 */
function getPairedPoints(palaceNumber) {
  // 配穴关系
  const pairedMap = {
    1: { name: '父母配', points: ['公孙', '内关'] },
    2: { name: '夫妻配', points: ['列缺', '照海'] },
    3: { name: '男女配', points: ['足临泣', '外关'] },
    4: { name: '男女配', points: ['足临泣', '外关'] },
    6: { name: '男女配', points: ['后溪', '申脉'] },
    7: { name: '夫妻配', points: ['列缺', '照海'] },
    8: { name: '父母配', points: ['公孙', '内关'] },
    9: { name: '父母配', points: ['公孙', '内关'] }
  }
  
  return pairedMap[palaceNumber] || null
}
