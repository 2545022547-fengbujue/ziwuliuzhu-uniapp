/**
 * 灵龟八法完整算法
 *
 * 理论基础：
 * - 基于教材：八卦、九宫、八脉、八穴、干支代数
 * - 取奇经八脉交会穴，按时辰推算九宫数，取相应穴位
 *
 * 计算规则：
 * 1. 查日干支代数（教材表10-15）+ 时干支代数（教材表10-16）
 * 2. 求和后：阳日除9取余，阴日除6取余 → 九宫数
 * 3. 中宫5特殊处理：阳日归坤(2)，阴日归艮(8)
 * 4. 九宫数 → 八卦 → 对应八脉交会穴
 *
 * 配穴关系：
 * - 坎1/兑7 → 后溪+申脉（夫妻配）
 * - 坤2/离9 → 列缺+照海（夫妻配）
 * - 震3/巽4 → 足临泣+外关（男女配）
 * - 乾6/艮8 → 公孙+内关（父母配）
 */

import { getStemIndex, getBranchIndex } from './ganzhi.js'
import { getEightPointFull } from './acupuncturePoints.js'
import { HOUR_NAMES } from '@/data/constants.js'
import { EIGHT_POINTS } from '@/data/eight-points.js'

/**
 * 逐日干支代数（教材表10-15）
 *
 * 表10-15：代数10=甲己辰戌丑未，代数9=乙庚申酉，代数8=丁壬寅卯，代数7=戊丙癸辛己亥午子
 *
 * 注：逐日和临时的天干、地支代数不同，必须分开使用
 */
const DAY_STEM_VALUES = {
  '甲': 10, '己': 10,     // 甲己→10
  '乙': 9, '庚': 9,       // 乙庚→9
  '丙': 7, '辛': 7,       // 丙辛→7
  '丁': 8, '壬': 8,       // 丁壬→8
  '戊': 7, '癸': 7        // 戊癸→7（表10-15：戊丙癸辛→7）
}

const DAY_BRANCH_VALUES = {
  '辰': 10, '戌': 10,     // 辰戌→10
  '丑': 10, '未': 10,     // 丑未→10（表10-15：辰戌丑未→10）
  '申': 9, '酉': 9,       // 申酉→9
  '寅': 8, '卯': 8,       // 寅卯→8
  '巳': 7, '亥': 7,       // 己亥→7
  '子': 7, '午': 7        // 午子→7（表10-15：己亥午子→7）
}

/**
 * 临时干支代数（教材表10-16）
 *
 * 表10-16：代数9=甲己子午，代数8=乙庚丑未，代数7=丙辛丁壬寅申，
 *          代数6=戊癸卯酉，代数5=辰戌，代数4=巳亥
 */
const HOUR_STEM_VALUES = {
  '甲': 9, '己': 9,       // 甲己→9
  '乙': 8, '庚': 8,       // 乙庚→8
  '丙': 7, '辛': 7,       // 丙辛→7
  '丁': 7, '壬': 7,       // 丁壬→7
  '戊': 6, '癸': 6        // 戊癸→6
}

const HOUR_BRANCH_VALUES = {
  '子': 9, '午': 9,       // 子午→9
  '丑': 8, '未': 8,       // 丑未→8
  '寅': 7, '申': 7,       // 寅申→7
  '卯': 6, '酉': 6,       // 卯酉→6
  '辰': 5, '戌': 5,       // 辰戌→5
  '巳': 4, '亥': 4        // 巳亥→4
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
  if (!ganzhi?.day) {
    console.warn('[灵龟八法] 干支信息不完整')
    return { method: 'lingui', methodName: '灵龟八法', openPoints: [], isClosed: true }
  }
  const dayStem = ganzhi.day.heavenlyStem
  const dayBranch = ganzhi.day.earthlyBranch
  const hourStem = ganzhi.hour.heavenlyStem
  const hourBranch = ganzhi.hour.earthlyBranch

  // 1. 计算干支代数（逐日用表10-15，临时用表10-16，两表不同）
  const dayStemValue = DAY_STEM_VALUES[dayStem] || 0
  const dayBranchValue = DAY_BRANCH_VALUES[dayBranch] || 0
  const hourStemValue = HOUR_STEM_VALUES[hourStem] || 0
  const hourBranchValue = HOUR_BRANCH_VALUES[hourBranch] || 0
  
  const daySum = dayStemValue + dayBranchValue
  const hourSum = hourStemValue + hourBranchValue
  const totalSum = daySum + hourSum
  
  // 2. 计算九宫数
  // 阳日除9，阴日除6
  const stemIdx = getStemIndex(dayStem)
  if (stemIdx < 0) {
    console.warn(`[灵龟八法] 无效日天干：${dayStem}`)
    return { method: 'lingui', methodName: '灵龟八法', openPoints: [], isClosed: true }
  }
  const dayYinYang = stemIdx % 2 === 0 ? '阳' : '阴'
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
 * 根据九宫数获取开穴（八脉交会穴）
 *
 * 九宫数与穴位对应（中宫5已在调用方处理）：
 *   坎1/兑7 → 后溪(SI3) + 申脉(BL62)
 *   坤2/离9 → 列缺(LU7) + 照海(KI6)
 *   震3/巽4 → 足临泣(GB41) + 外关(TE5)
 *   乾6/艮8 → 公孙(SP4) + 内关(PC6)
 *
 * @param {number} palaceNumber - 九宫数（1-9，不含5）
 * @returns {Array} 开穴列表
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
    9: ['LU7', 'KI6']        // 离宫：列缺、照海
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
 * 获取配穴关系（父母夫妻男女配穴）
 *
 * 配穴是灵龟八法的重要概念，每对穴位互为配穴：
 *   - 父母配：公孙+内关（乾6/艮8）
 *   - 夫妻配：后溪+申脉（坎1/兑7）、列缺+照海（坤2/离9）
 *   - 男女配：足临泣+外关（震3/巽4）
 *
 * @param {number} palaceNumber - 九宫数
 * @returns {Object|null} { name: 配穴名, points: [穴位名1, 穴位名2] }
 */
function getPairedPoints(palaceNumber) {
  // 配穴关系
  const pairedMap = {
    1: { name: '夫妻配', points: ['后溪', '申脉'] },
    2: { name: '夫妻配', points: ['列缺', '照海'] },
    3: { name: '男女配', points: ['足临泣', '外关'] },
    4: { name: '男女配', points: ['足临泣', '外关'] },
    6: { name: '父母配', points: ['公孙', '内关'] },
    7: { name: '夫妻配', points: ['后溪', '申脉'] },
    8: { name: '父母配', points: ['公孙', '内关'] },
    9: { name: '夫妻配', points: ['列缺', '照海'] }
  }
  
  return pairedMap[palaceNumber] || null
}
