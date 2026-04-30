/**
 * 纳甲法（纳干法）完整算法
 * 
 * 理论基础：
 * - 基于徐凤《子午流注逐日按时定穴歌》
 * - 核心逻辑：阳进阴退开井穴 → 经生经穴生穴 → 返本还原 → 气纳三焦/血归包络
 * 
 * 计算规则：
 * 1. 阳日（甲、丙、戊、庚、壬）：阳进阴退开井穴 → 按时辰顺序开井荥输经合 → 遇输过原 → 气纳三焦
 * 2. 阴日（乙、丁、己、辛、癸）：阳进阴退开井穴 → 按时辰顺序开井荥输经合 → 遇输过原 → 血归包络
 * 
 * 五鼠遁（日上起时法）：
 * - 甲己日起甲子时（索引0）
 * - 乙庚日起丙子时（索引2）
 * - 丙辛日起戊子时（索引4）
 * - 丁壬日起庚子时（索引6）
 * - 戊癸日起壬子时（索引8）
 * 
 * 合日互用：
 * - 天干逢五相合：甲己、乙庚、丙辛、丁壬、戊癸
 * - 闭穴时使用合日的开穴
 */

import { getStemIndex, getBranchIndex, HEAVENLY_STEMS, EARTHLY_BRANCHES } from './ganzhi.js'
import { getWushuPointsFull, getYuanPointFull, getPointByCode } from './acupuncturePoints.js'
import { getFankePoint } from '@/data/fanke-points.js'

/**
 * 日天干对应值日经络（教材表10-2）
 * 
 * 规则：
 * - 甲日：胆经（阳木）
 * - 乙日：肝经（阴木）
 * - 丙日：小肠经（阳火）
 * - 丁日：心经（阴火）
 * - 戊日：胃经（阳土）
 * - 己日：脾经（阴土）
 * - 庚日：大肠经（阳金）
 * - 辛日：肺经（阴金）
 * - 壬日：膀胱经（阳水）
 * - 癸日：肾经（阴水）
 */
const DAY_MERIDIAN_MAP = {
  '甲': { name: '胆经', code: 'GB', fullName: '足少阳胆经', yinYang: '阳', wuxing: '木' },
  '乙': { name: '肝经', code: 'LR', fullName: '足厥阴肝经', yinYang: '阴', wuxing: '木' },
  '丙': { name: '小肠经', code: 'SI', fullName: '手太阳小肠经', yinYang: '阳', wuxing: '火' },
  '丁': { name: '心经', code: 'HT', fullName: '手少阴心经', yinYang: '阴', wuxing: '火' },
  '戊': { name: '胃经', code: 'ST', fullName: '足阳明胃经', yinYang: '阳', wuxing: '土' },
  '己': { name: '脾经', code: 'SP', fullName: '足太阴脾经', yinYang: '阴', wuxing: '土' },
  '庚': { name: '大肠经', code: 'LI', fullName: '手阳明大肠经', yinYang: '阳', wuxing: '金' },
  '辛': { name: '肺经', code: 'LU', fullName: '手太阴肺经', yinYang: '阴', wuxing: '金' },
  '壬': { name: '膀胱经', code: 'BL', fullName: '足太阳膀胱经', yinYang: '阳', wuxing: '水' },
  '癸': { name: '肾经', code: 'KI', fullName: '足少阴肾经', yinYang: '阴', wuxing: '水' }
}

/**
 * 时辰名称
 */
const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

/**
 * 五行相生关系
 */
const WUXING_SHENG = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
}

/**
 * 五行相克关系
 */
const WUXING_KE = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
}

/**
 * 纳甲法计算（完整实现）
 * 
 * @param {Object} ganzhi - 干支信息（包含年、月、日、时的天干地支）
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 * 
 * @example
 * // 计算壬日未时的纳甲法取穴
 * calculateNajia(ganzhi, 7)
 * // 返回：{ method: 'najia', openPoints: [...], isClosed: true/false, ... }
 */
export function calculateNajia(ganzhi, hourIndex) {
  const dayStem = ganzhi.day.heavenlyStem
  const dayBranch = ganzhi.day.earthlyBranch
  const hourStem = ganzhi.hour.heavenlyStem
  const hourBranch = ganzhi.hour.earthlyBranch
  
  // 1. 确定值日经络
  const dayMeridian = DAY_MERIDIAN_MAP[dayStem]
  if (!dayMeridian) {
    throw new Error(`未知的日天干：${dayStem}`)
  }
  
  // 2. 计算当日所有开穴（完整流注顺序）
  const openedPoints = new Set()
  const dailySequence = calculateDailySequence(dayStem, dayMeridian, openedPoints)
  
  // 3. 获取当前时辰的开穴
  const currentHourData = dailySequence[hourIndex]
  const openPoints = currentHourData ? currentHourData.points : []
  
  // 4. 检查是否闭穴
  const isClosed = openPoints.length === 0
  
  // 5. 闭穴时合日互用（使用合日的开穴）
  let alternativePoints = null
  if (isClosed) {
    alternativePoints = getHeRiHuYong(dayStem, ganzhi, hourIndex)
  }
  
  return {
    method: 'najia',
    methodName: '纳甲法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    hourGanZhi: ganzhi.hour.ganZhi,
    dayMeridian,
    dayYinYang: dayMeridian.yinYang,
    openPoints,
    isClosed,
    alternativePoints,
    dailySequence,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch
  }
}

/**
 * 五鼠遁（日上起时法）- 时辰天干起始索引
 * 甲己日起甲子时（索引0）
 * 乙庚日起丙子时（索引2）
 * 丙辛日起戊子时（索引4）
 * 丁壬日起庚子时（索引6）
 * 戊癸日起壬子时（索引8）
 */
const WU_SHU_DUN = {
  '甲': 0, '己': 0,
  '乙': 2, '庚': 2,
  '丙': 4, '辛': 4,
  '丁': 6, '壬': 6,
  '戊': 8, '癸': 8
}

/**
 * 计算当日完整流注顺序（基于徐凤歌诀）
 * 核心逻辑：
 * 1. 阳日：阳进阴退开井穴 → 按时辰顺序开井荥输经合 → 遇输过原 → 气纳三焦
 * 2. 阴日：阳进阴退开井穴 → 按时辰顺序开井荥输经合 → 遇输过原 → 血归包络
 */
function calculateDailySequence(dayStem, dayMeridian, openedPoints = new Set()) {
  const sequence = []
  const yinYang = dayMeridian.yinYang
  const jingHour = calculateJingHour(dayStem)
  const startStemIndex = WU_SHU_DUN[dayStem] || 0
  
  // 徐凤歌诀的流注顺序：按时辰天干顺序，而不是简单的hourIndex
  // 阳日：甲→丙→戊→庚→壬（阳时）
  // 阴日：乙→丁→己→辛→癸（阴时）
  
  for (let hour = 0; hour < 12; hour++) {
    const hourStemIndex = (startStemIndex + hour) % 10
    const hourBranchIndex = hour
    
    const hourStem = HEAVENLY_STEMS[hourStemIndex]
    const hourBranch = EARTHLY_BRANCHES[hourBranchIndex]
    
    const isYangHour = hourBranchIndex % 2 === 0
    const isYinHour = hourBranchIndex % 2 === 1
    
    let points = []
    
    if (yinYang === '阳' && isYangHour) {
      points = calculateYangDayPoints(dayStem, dayMeridian, hourStem, hourBranch, hour, openedPoints, jingHour)
    } else if (yinYang === '阴' && isYinHour) {
      points = calculateYinDayPoints(dayStem, dayMeridian, hourStem, hourBranch, hour, openedPoints, jingHour)
    }
    
    sequence.push({
      hour,
      hourName: HOUR_NAMES[hour],
      hourStem,
      hourBranch,
      points,
      isOpen: points.length > 0
    })
  }
  
  return sequence
}

/**
 * 计算开井穴的时辰（阳进阴退）
 * 甲日戌时(10)，乙日酉时(9)，丙日申时(8)，丁日未时(7)，戊日午时(6)，
 * 己日巳时(5)，庚日辰时(4)，辛日卯时(3)，壬日寅时(2)，癸日亥时(11)
 * 
 * 注意：这里返回的是时辰索引（0-11），对应十二地支的顺序
 */
function calculateJingHour(dayStem) {
  const jingHours = [10, 9, 8, 7, 6, 5, 4, 3, 2, 11]
  const stemIndex = getStemIndex(dayStem)
  return jingHours[stemIndex]
}

/**
 * 计算阳日开穴（基于徐凤歌诀）
 * 歌诀示例（甲日）：
 * 甲日戌时胆窍阴，丙子时中前谷荥，戊寅陷谷阳明输，返本丘墟木在寅，
 * 庚辰经注阳溪穴，壬午膀胱委中寻，甲申时纳三焦水，荥合天干取液门。
 */
function calculateYangDayPoints(dayStem, dayMeridian, hourStem, hourBranch, hour, openedPoints, jingHour) {
  const points = []
  const meridianCode = dayMeridian.code
  
  const wushuPoints = getWushuPointsFull(meridianCode)
  if (!wushuPoints || wushuPoints.length === 0) return points
  
  // 使用传入的 jingHour 参数，避免重复计算
  if (jingHour === undefined) {
    jingHour = calculateJingHour(dayStem)
  }
  
  // 1. 开井穴（第一个阳时）
  if (hour === jingHour) {
    const jingPoint = wushuPoints[0]
    if (jingPoint && !openedPoints.has(jingPoint.id)) {
      points.push({
        ...jingPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '井穴'
      })
      openedPoints.add(jingPoint.id)
    }
  }
  
  // 2. 开荥穴（第二个阳时）
  // 经生经（木→火），穴生穴（井→荥）
  const yingHour = (jingHour + 2) % 12
  if (hour === yingHour) {
    const yingPoint = wushuPoints[1]
    if (yingPoint && !openedPoints.has(yingPoint.id)) {
      points.push({
        ...yingPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '荥穴'
      })
      openedPoints.add(yingPoint.id)
    }
  }
  
  // 3. 开输穴 + 返本还原（第三个阳时）
  const shuHour = (jingHour + 4) % 12
  if (hour === shuHour) {
    // 开输穴
    const shuPoint = wushuPoints[2]
    if (shuPoint && !openedPoints.has(shuPoint.id)) {
      points.push({
        ...shuPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '输穴'
      })
      openedPoints.add(shuPoint.id)
    }
    
    // 返本还原：开值日经的原穴
    const yuanPoint = getYuanPointFull(meridianCode)
    if (yuanPoint && !openedPoints.has(yuanPoint.id)) {
      points.push({
        ...yuanPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '原穴（返本还原）'
      })
      openedPoints.add(yuanPoint.id)
    }
    
    // 特殊处理：壬日同时开三焦经原穴（阳池 TE4）
    if (dayStem === '壬') {
      const sanziaoYuanPoint = getYuanPointFull('TE')
      if (sanziaoYuanPoint && !openedPoints.has(sanziaoYuanPoint.id)) {
        points.push({
          ...sanziaoYuanPoint,
          meridian: '手少阳三焦经',
          isOpen: true,
          isNa: false,
          isGu: false,
          type: '原穴（三焦寄穴）'
        })
        openedPoints.add(sanziaoYuanPoint.id)
      }
    }
  }
  
  // 4. 开经穴（第四个阳时）
  const jingXueHour = (jingHour + 6) % 12
  if (hour === jingXueHour) {
    const jingXuePoint = wushuPoints[3]
    if (jingXuePoint && !openedPoints.has(jingXuePoint.id)) {
      points.push({
        ...jingXuePoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '经穴'
      })
      openedPoints.add(jingXuePoint.id)
    }
  }
  
  // 5. 开合穴（第五个阳时）
  const heHour = (jingHour + 8) % 12
  if (hour === heHour) {
    const hePoint = wushuPoints[4]
    if (hePoint && !openedPoints.has(hePoint.id)) {
      points.push({
        ...hePoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '合穴'
      })
      openedPoints.add(hePoint.id)
    }
  }
  
  // 6. 气纳三焦（第六个阳时，最后一个）
  const lastYangHour = (jingHour + 10) % 12
  if (hour === lastYangHour) {
    const sanziaoPoint = getSanziaoPoint(dayMeridian.wuxing)
    if (sanziaoPoint) {
      points.push({
        ...sanziaoPoint,
        isOpen: true,
        isNa: true,
        isGu: false,
        type: '气纳三焦（他生我）'
      })
    }
  }
  
  return points
}

/**
 * 计算阴日开穴（基于徐凤歌诀）
 * 歌诀示例（乙日）：
 * 乙日酉时肝大敦，丁亥时荥少府心，己丑太白太冲穴，辛卯经渠是肺经，
 * 癸已肾宫阴谷合，乙未劳宫火穴荥。
 */
function calculateYinDayPoints(dayStem, dayMeridian, hourStem, hourBranch, hour, openedPoints) {
  const points = []
  const meridianCode = dayMeridian.code
  
  const wushuPoints = getWushuPointsFull(meridianCode)
  if (!wushuPoints || wushuPoints.length === 0) return points
  
  // 1. 开井穴（第一个阴时）
  if (hour === calculateJingHour(dayStem)) {
    const jingPoint = wushuPoints[0]
    if (jingPoint && !openedPoints.has(jingPoint.id)) {
      points.push({
        ...jingPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '井穴'
      })
      openedPoints.add(jingPoint.id)
    }
  }
  
  // 2. 开荥穴（第二个阴时）
  const jingHour = calculateJingHour(dayStem)
  const yingHour = (jingHour + 2) % 12
  if (hour === yingHour) {
    const yingPoint = wushuPoints[1]
    if (yingPoint && !openedPoints.has(yingPoint.id)) {
      points.push({
        ...yingPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '荥穴'
      })
      openedPoints.add(yingPoint.id)
    }
  }
  
  // 3. 开输穴 + 遇输过原（第三个阴时）
  const shuHour = (jingHour + 4) % 12
  if (hour === shuHour) {
    // 开输穴
    const shuPoint = wushuPoints[2]
    if (shuPoint && !openedPoints.has(shuPoint.id)) {
      points.push({
        ...shuPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '输穴'
      })
      openedPoints.add(shuPoint.id)
    }
    
    // 遇输过原：开值日经的原穴
    const yuanPoint = getYuanPointFull(meridianCode)
    if (yuanPoint && !openedPoints.has(yuanPoint.id)) {
      points.push({
        ...yuanPoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '原穴（遇输过原）'
      })
      openedPoints.add(yuanPoint.id)
    }
    
    // 特殊处理：癸日同时开心包经原穴（大陵 PC7）
    if (dayStem === '癸') {
      const baoluoYuanPoint = getYuanPointFull('PC')
      if (baoluoYuanPoint && !openedPoints.has(baoluoYuanPoint.id)) {
        points.push({
          ...baoluoYuanPoint,
          meridian: '手厥阴心包经',
          isOpen: true,
          isNa: false,
          isGu: false,
          type: '原穴（包络寄穴）'
        })
        openedPoints.add(baoluoYuanPoint.id)
      }
    }
  }
  
  // 4. 开经穴（第四个阴时）
  const jingXueHour = (jingHour + 6) % 12
  if (hour === jingXueHour) {
    const jingXuePoint = wushuPoints[3]
    if (jingXuePoint && !openedPoints.has(jingXuePoint.id)) {
      points.push({
        ...jingXuePoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '经穴'
      })
      openedPoints.add(jingXuePoint.id)
    }
  }
  
  // 5. 开合穴（第五个阴时）
  const heHour = (jingHour + 8) % 12
  if (hour === heHour) {
    const hePoint = wushuPoints[4]
    if (hePoint && !openedPoints.has(hePoint.id)) {
      points.push({
        ...hePoint,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: '合穴'
      })
      openedPoints.add(hePoint.id)
    }
  }
  
  // 6. 血归包络（第六个阴时，最后一个）
  const lastYinHour = (jingHour + 10) % 12
  if (hour === lastYinHour) {
    const baoluoPoint = getBaoluoPoint(dayMeridian.wuxing)
    if (baoluoPoint) {
      points.push({
        ...baoluoPoint,
        isOpen: true,
        isNa: true,
        isGu: false,
        type: '血归包络（我生他）'
      })
    }
  }
  
  return points
}

/**
 * 获取下一个经络（五行相生顺序）
 * 木→火→土→金→水→木
 * 
 * @param {string} meridianCode - 当前经络代码
 * @returns {Object} 下一个经络信息 { code, fullName }
 */
function getNextMeridian(meridianCode) {
  const meridianWuxingMap = {
    'GB': '木', 'LR': '木',
    'SI': '火', 'HT': '火', 'TE': '火', 'PC': '火',
    'ST': '土', 'SP': '土',
    'LI': '金', 'LU': '金',
    'BL': '水', 'KI': '水'
  }
  
  const wuxingMap = {
    '木': ['SI', 'HT'],
    '火': ['ST', 'SP'],
    '土': ['LI', 'LU'],
    '金': ['BL', 'KI'],
    '水': ['GB', 'LR']
  }
  
  const currentWuxing = meridianWuxingMap[meridianCode]
  const nextMeridians = wuxingMap[currentWuxing]
  
  // 返回第一个匹配的经络
  const nextCode = nextMeridians[0]
  const nextEntry = DAY_MERIDIAN_MAP[Object.keys(DAY_MERIDIAN_MAP).find(key => DAY_MERIDIAN_MAP[key].code === nextCode)]
  return {
    code: nextCode,
    fullName: nextEntry?.fullName || ''
  }
}

/**
 * 获取三焦经穴位（气纳三焦，他生我）
 * 
 * 规则：找三焦经中能生日干五行的穴位（他生我）
 * 歌诀：甲申时纳三焦水，荥合天干取液门。
 * 
 * @param {string} dayWuxing - 日干五行属性
 * @returns {Object|null} 三焦经穴位信息
 */
function getSanziaoPoint(dayWuxing) {
  const sanziaoPoints = getWushuPointsFull('TE')
  if (!sanziaoPoints || sanziaoPoints.length === 0) return null
  
  // 按五行相生顺序查找：他生我
  for (const point of sanziaoPoints) {
    if (WUXING_SHENG[point.wuxing] === dayWuxing) {
      return {
        ...point,
        meridian: '手少阳三焦经',
        type: '气纳三焦（他生我）'
      }
    }
  }
  
  // 默认返回荥穴（徐凤歌诀中多取荥穴）
  const defaultPoint = sanziaoPoints[1]
  return defaultPoint ? {
    ...defaultPoint,
    meridian: '手少阳三焦经',
    type: '气纳三焦（他生我）'
  } : null
}

/**
 * 获取心包经穴位（血归包络，我生他）
 * 
 * 规则：找心包经中被日干五行生的穴位（我生他）
 * 歌诀：乙未劳宫火穴荥。
 * 
 * @param {string} dayWuxing - 日干五行属性
 * @returns {Object|null} 心包经穴位信息
 */
function getBaoluoPoint(dayWuxing) {
  const baoluoPoints = getWushuPointsFull('PC')
  if (!baoluoPoints || baoluoPoints.length === 0) return null
  
  // 按五行相生顺序查找：我生他
  for (const point of baoluoPoints) {
    if (WUXING_SHENG[dayWuxing] === point.wuxing) {
      return {
        ...point,
        meridian: '手厥阴心包经',
        type: '血归包络（我生他）'
      }
    }
  }
  
  // 默认返回荥穴（徐凤歌诀中多取荥穴）
  const defaultPoint = baoluoPoints[1]
  return defaultPoint ? {
    ...defaultPoint,
    meridian: '手厥阴心包经',
    type: '血归包络（我生他）'
  } : null
}

/**
 * 合日互用（闭穴时的替代方案）
 * 
 * 规则：天干逢五相合
 * - 甲己合、乙庚合、丙辛合、丁壬合、戊癸合
 * 
 * 用途：当某日某时辰闭穴时，使用合日（天干五合）的同一时辰的开穴
 * 
 * @param {string} dayStem - 日天干
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引
 * @returns {Object|null} 合日互用信息，包含reason、meridian、dayStem、openPoints
 */
function getHeRiHuYong(dayStem, ganzhi, hourIndex) {
  const heMap = {
    '甲': '己', '己': '甲',
    '乙': '庚', '庚': '乙',
    '丙': '辛', '辛': '丙',
    '丁': '壬', '壬': '丁',
    '戊': '癸', '癸': '戊'
  }
  
  const heDayStem = heMap[dayStem]
  const heMeridian = DAY_MERIDIAN_MAP[heDayStem]
  
  if (!heMeridian) return null
  
  // 计算合日经络的开穴（使用独立的 openedPoints 避免冲突）
  const heOpenedPoints = new Set()
  const heDailySequence = calculateDailySequence(heDayStem, heMeridian, heOpenedPoints)
  const heCurrentHourData = heDailySequence[hourIndex]
  const heOpenPoints = heCurrentHourData ? heCurrentHourData.points : []
  
  return {
    reason: `闭穴，合日互用（${dayStem}合${heDayStem}）`,
    heLabel: `${dayStem}合${heDayStem}`,
    meridian: heMeridian,
    dayStem: heDayStem,
    openPoints: heOpenPoints,
    isClosed: heOpenPoints.length === 0
  }
}

/**
 * 反克法计算（142530反克法）
 * 
 * 规则：基于教材表10-12：一、四、二、五、三、〇反克取穴
 * 直接查表：日干+时辰干支 → 穴位
 * 
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引
 * @returns {Object} 反克法取穴结果
 */
export function calculateFanke(ganzhi, hourIndex) {
  const dayStem = ganzhi.day.heavenlyStem
  const hourGanZhi = ganzhi.hour.ganZhi
  
  // 直接查表
  const fankePointData = getFankePoint(dayStem, hourGanZhi)
  
  let openPoints = []
  let isClosed = true
  
  if (fankePointData) {
    const fullPoint = getPointByCode(fankePointData.code)
    if (fullPoint) {
      openPoints.push({
        ...fullPoint,
        wuxing: fankePointData.wuxing,
        category: fankePointData.type,
        isOpen: true,
        isPair: false
      })
      isClosed = false
    }
  }
  
  return {
    method: 'fanke',
    methodName: '反克法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    dayStem,
    hourGanZhi,
    openPoints,
    isClosed,
    explanation: `反克法：${dayStem}日${hourGanZhi}时`
  }
}
