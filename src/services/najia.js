/**
 * 纳甲法（纳干法）完整算法
 * 
 * 理论基础：
 * - 基于徐凤《子午流注逐日按时定穴歌》
 * - 核心逻辑：阳进阴退开井穴 → 经生经穴生穴 → 返本还原/遇输过原 → 气纳三焦/血归包络
 * 
 * 计算规则：
 * 1. 阳日（甲、丙、戊、庚、壬）：阳进阴退开井穴 → 经生经穴生穴（跨6条阳经）→ 气纳三焦
 * 2. 阴日（乙、丁、己、辛、癸）：阳进阴退开井穴 → 经生经穴生穴（跨6条阴经）→ 血归包络
 * 
 * "经生经、穴生穴"核心规则：
 * - 每日从值日经的五行开始，按五行相生链（木→火→土→金→水）递进
 * - 每步取对应经脉的第N个五输穴（井→荥→输→经→合）
 * - 如甲日(胆经,木): 胆(木)窍阴→小肠(火)前谷→胃(土)陷谷→大肠(金)阳溪→膀胱(水)委中→三焦液门
 * 
 * 五鼠遁（日上起时法）：
 * - 甲己日起甲子时（索引0），乙庚日起丙子时（索引2），丙辛日起戊子时（索引4）
 * - 丁壬日起庚子时（索引6），戊癸日起壬子时（索引8）
 * 
 * 合日互用：
 * - 天干逢五相合：甲己、乙庚、丙辛、丁壬、戊癸
 * - 闭穴时使用合日的开穴
 */

import { getStemIndex, getBranchIndex, HEAVENLY_STEMS, EARTHLY_BRANCHES } from './ganzhi.js'
import { getWushuPointsFull, getYuanPointFull, getPointByCode } from './acupuncturePoints.js'
import { getFankePoint } from '@/data/fanke-points.js'
import { DAY_MERIDIAN_MAP, HOUR_NAMES, WUXING_SHENG, WU_SHU_DUN, WUXING_CHAIN } from '@/data/constants.js'

/**
 * 根据值日经的五行和阴阳，构建当日的五行经脉链（5条经脉）
 * 
 * 规则：从值日经五行开始，按五行相生链递进，取同阴阳的经脉
 * 
 * @param {Object} dayMeridian - 值日经信息 { code, wuxing, yinYang, ... }
 * @returns {Array} 5条经脉信息的数组
 * 
 * @example
 * getDayMeridianChain({ code: 'GB', wuxing: '木', yinYang: '阳' })
 * // → [GB(木), SI(火), ST(土), LI(金), BL(水)]
 */
function getDayMeridianChain(dayMeridian) {
  const chain = []
  const startIndex = WUXING_CHAIN.indexOf(dayMeridian.wuxing)
  
  for (let i = 0; i < 5; i++) {
    const wuxing = WUXING_CHAIN[(startIndex + i) % 5]
    // 找到同阴阳、同五行的经脉
    const stem = Object.keys(DAY_MERIDIAN_MAP).find(
      s => DAY_MERIDIAN_MAP[s].wuxing === wuxing && DAY_MERIDIAN_MAP[s].yinYang === dayMeridian.yinYang
    )
    if (stem) {
      chain.push(DAY_MERIDIAN_MAP[stem])
    }
  }
  return chain
}

/**
 * 纳甲法计算（完整实现）
 * 
 * @param {Object} ganzhi - 干支信息（包含年、月、日、时的天干地支）
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
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
 * 计算当日完整流注顺序（基于徐凤歌诀）
 * 
 * 核心逻辑：
 * 1. 阳日阳时开阳经穴，阴日阴时开阴经穴
 * 2. 每日6个有效时辰，前5步"经生经、穴生穴"，第6步气纳三焦/血归包络
 */
function calculateDailySequence(dayStem, dayMeridian, openedPoints = new Set()) {
  const sequence = []
  const yinYang = dayMeridian.yinYang
  const jingHour = calculateJingHour(dayStem)
  const startStemIndex = WU_SHU_DUN[dayStem] || 0

  // 预缓存：同一天内经脉链和五输穴不变，避免每时辰重复计算
  const meridianChain = getDayMeridianChain(dayMeridian)
  const cachedWushuPoints = {}
  meridianChain.forEach(m => {
    if (m && !cachedWushuPoints[m.code]) {
      cachedWushuPoints[m.code] = getWushuPointsFull(m.code)
    }
  })

  for (let hour = 0; hour < 12; hour++) {
    const hourStemIndex = (startStemIndex + hour) % 10
    const hourBranchIndex = hour

    const hourStem = HEAVENLY_STEMS[hourStemIndex]
    const hourBranch = EARTHLY_BRANCHES[hourBranchIndex]

    const isYangHour = hourBranchIndex % 2 === 0
    const isYinHour = hourBranchIndex % 2 === 1

    let points = []

    if (yinYang === '阳' && isYangHour) {
      points = calculateDayPoints('阳', dayStem, dayMeridian, hour, openedPoints, jingHour, meridianChain, cachedWushuPoints)
    } else if (yinYang === '阴' && isYinHour) {
      points = calculateDayPoints('阴', dayStem, dayMeridian, hour, openedPoints, jingHour, meridianChain, cachedWushuPoints)
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
 */
function calculateJingHour(dayStem) {
  const jingHours = [10, 9, 8, 7, 6, 5, 4, 3, 2, 11]
  const stemIndex = getStemIndex(dayStem)
  return jingHours[stemIndex]
}

/**
 * 计算当日开穴（阳日/阴日统一处理）
 *
 * 核心逻辑：经生经、穴生穴
 * - 根据值日经五行构建经脉链（如甲日: GB→SI→ST→LI→BL）
 * - 每步从经脉链中取对应经脉的对应五输穴
 * - 第3步（输穴）额外开值日经原穴（返本还原/遇输过原）
 * - 第6步开三焦/心包经穴位（气纳三焦/血归包络）
 *
 * @param {string} dayType - '阳' 或 '阴'
 * @param {string} dayStem - 日天干
 * @param {Object} dayMeridian - 值日经信息
 * @param {number} hour - 时辰索引 (0-11)
 * @param {Set} openedPoints - 已开穴位集合（用于去重）
 * @param {number} jingHour - 开井穴时辰索引
 * @param {Array} meridianChain - 预计算的经脉链（由调用方缓存传入）
 * @param {Object} cachedWushuPoints - 预缓存的五输穴 { meridianCode: points[] }
 * @returns {Array} 开穴列表
 */
function calculateDayPoints(dayType, dayStem, dayMeridian, hour, openedPoints, jingHour, meridianChain, cachedWushuPoints) {
  const points = []

  if (jingHour === undefined) {
    jingHour = calculateJingHour(dayStem)
  }

  // 计算当前时辰是第几步（0-5）
  // 阳日只在阳时（偶数时辰索引）开穴，阴日只在阴时（奇数时辰索引）开穴
  // 每步间隔2个时辰索引
  const stepIndex = ((hour - jingHour + 12) % 12) / 2

  if (stepIndex >= 0 && stepIndex <= 4) {
    // 步骤 0-4：经生经、穴生穴
    const stepMeridian = meridianChain[stepIndex]
    if (!stepMeridian) return points

    const wushuPoints = cachedWushuPoints[stepMeridian.code]
    if (!wushuPoints || wushuPoints.length === 0) return points
    
    const point = wushuPoints[stepIndex]
    if (point && !openedPoints.has(point.id)) {
      const typeNames = ['井穴', '荥穴', '输穴', '经穴', '合穴']
      points.push({
        ...point,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: typeNames[stepIndex]
      })
      openedPoints.add(point.id)
    }
    
    // 步骤 2（输穴）：返本还原（阳日）/ 遇输过原（阴日）
    // 开值日经的原穴
    if (stepIndex === 2) {
      const yuanLabel = dayType === '阳' ? '返本还原' : '遇输过原'
      const yuanPoint = getYuanPointFull(dayMeridian.code)
      if (yuanPoint && !openedPoints.has(yuanPoint.id)) {
        points.push({
          ...yuanPoint,
          isOpen: true,
          isNa: false,
          isGu: false,
          type: `原穴（${yuanLabel}）`
        })
        openedPoints.add(yuanPoint.id)
      }
      
      // 特殊处理：阳日壬日同时开三焦经原穴（阳池 TE4）
      if (dayType === '阳' && dayStem === '壬') {
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
      
      // 特殊处理：阴日癸日同时开心包经原穴（大陵 PC7）
      if (dayType === '阴' && dayStem === '癸') {
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
  } else if (stepIndex === 5) {
    // 步骤 5：气纳三焦（阳日）/ 血归包络（阴日）
    if (dayType === '阳') {
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
    } else {
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
  }
  
  return points
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
  
  // 按五行相生顺序查找：他生我（WUXING_SHENG[point.wuxing] === dayWuxing）
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
  console.warn(`三焦经未找到匹配 ${dayWuxing} 的穴位，使用默认荥穴`)
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
  
  // 按五行相生顺序查找：我生他（WUXING_SHENG[dayWuxing] === point.wuxing）
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
  console.warn(`心包经未找到匹配 ${dayWuxing} 的穴位，使用默认荥穴`)
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
 * @returns {Object|null} 合日互用信息
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
