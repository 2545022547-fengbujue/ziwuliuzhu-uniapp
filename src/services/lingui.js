/**
 * 灵龟八法完整算法
 * 基于教材：八卦、九宫、八脉、八穴、干支代数
 */

import { getStemIndex, getBranchIndex } from './ganzhi.js'
import { getEightPointFull } from './acupuncturePoints.js'
import { HOUR_NAMES } from '@/data/constants.js'
import { EIGHT_POINTS } from '@/data/eight-points.js'

/**
 * 干支代数（教材表10-15/10-16）
 * 注：逐日和临时干支代数的值完全相同，合并为一份
 */
const STEM_VALUES = {
  '甲': 10, '己': 10,
  '乙': 9, '庚': 9,
  '丙': 7, '辛': 7,
  '丁': 8, '壬': 8,
  '戊': 6, '癸': 6
}

const BRANCH_VALUES = {
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
  const dayStemValue = STEM_VALUES[dayStem] || 0
  const dayBranchValue = BRANCH_VALUES[dayBranch] || 0
  const hourStemValue = STEM_VALUES[hourStem] || 0
  const hourBranchValue = BRANCH_VALUES[hourBranch] || 0
  
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
    6: ['SP4', 'PC6'],       // 乾宫：公孙、内关
    7: ['SI3', 'BL62'],      // 兑宫：后溪、申脉
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
    6: { name: '父母配', points: ['公孙', '内关'] },
    7: { name: '夫妻配', points: ['后溪', '申脉'] },
    8: { name: '男女配', points: ['足临泣', '外关'] },
    9: { name: '父母配', points: ['公孙', '内关'] }
  }
  
  return pairedMap[palaceNumber] || null
}
