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

import { getStemIndex, HEAVENLY_STEMS, EARTHLY_BRANCHES } from './ganzhi.js'
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
 * @param {Object} options - 可选行为开关
 * @param {boolean} options.enableHeRiHuYong - 闭穴时是否计算合日互用，默认关闭
 * @returns {Object} 取穴结果
 */
export function calculateNajia(ganzhi, hourIndex, options = {}) {
  const { enableHeRiHuYong = false } = options
  // 参数验证：防止 null/undefined 导致运行时错误
  if (!ganzhi || !ganzhi.day || !ganzhi.hour) {
    console.warn('[纳甲法] 无效的干支参数')
    return {
      method: 'najia', methodName: '纳甲法', date: '', hourIndex,
      hourName: HOUR_NAMES[hourIndex] || '', hourGanZhi: '',
      dayMeridian: null, openPoints: [], isClosed: true,
      alternativePoints: null, dailySequence: []
    }
  }
  // hourIndex 范围验证
  if (hourIndex < 0 || hourIndex > 11) {
    console.warn(`[纳甲法] 无效的时辰索引 ${hourIndex}`)
    return {
      method: 'najia', methodName: '纳甲法', date: '', hourIndex,
      hourName: '', hourGanZhi: '', dayMeridian: null, openPoints: [], isClosed: true,
      alternativePoints: null, dailySequence: []
    }
  }

  const dayStem = ganzhi.day.heavenlyStem
  const dayBranch = ganzhi.day.earthlyBranch
  const hourStem = ganzhi.hour.heavenlyStem
  const hourBranch = ganzhi.hour.earthlyBranch

  // === 值日周期日干推导（重要，勿按自然日理解） ===
  // 纳甲值日周期不以自然日切割：甲日胆经值日从甲日甲戌（开井）开始，
  // 顺推到乙日甲申（气纳三焦）结束，跨越两个自然日。因此"值日经"不能直接用
  // getGanZhi 按自然日（23:00 换日）推算的日干，而要根据「开井时辰边界」判定：
  //   - 当前时辰已过/等于当日开井时辰（hourIndex >= jingHour）→ 值日经 = 当日干
  //   - 当前时辰在当日开井之前（hourIndex < jingHour）→ 值日经 = 前一日干
  //     （因为此刻仍处在前一日的值日周期内，如甲日子时实为癸日周期收尾）
  // 例：5/20 甲日 23:30（自然日已换乙、h0 子时）→ 乙日开井酉(h9)，h0<9 → 值日仍为甲，
  //     应开甲日周期丙子荥前谷（徐凤歌诀"丙子时中前谷荣"），而非乙日周期（乙日子时无穴）。
  const jingHourOfDay = calculateJingHour(dayStem)
  const effectiveDayStem = hourIndex >= jingHourOfDay
    ? dayStem
    : HEAVENLY_STEMS[(getStemIndex(dayStem) + 9) % 10] // 前一日干（干支表逆推1位）

  // 1. 确定值日经络（使用值日周期日干，非自然日日干）
  const dayMeridian = DAY_MERIDIAN_MAP[effectiveDayStem]
  // 异常输入保护：本层返回空结果避免异常传播，配合 store 层 try-catch 形成双重防御
  if (!dayMeridian) {
    console.error(`[纳甲法] 未知的日天干：${effectiveDayStem}（原始 ${dayStem}），返回空结果`)
    return {
      method: 'najia', methodName: '纳甲法', date: '', hourIndex,
      hourName: HOUR_NAMES[hourIndex], hourGanZhi: '',
      dayMeridian: null, openPoints: [], isClosed: true,
      alternativePoints: null, dailySequence: [],
      dayStem: effectiveDayStem, dayBranch, hourStem, hourBranch
    }
  }

  // 2. 计算当日所有开穴（完整流注顺序，基于值日周期日干）
  const openedPoints = new Set()
  const dailySequence = calculateDailySequence(effectiveDayStem, dayMeridian, openedPoints)
  
  // 3. 获取当前时辰的开穴（hourIndex 已在函数开头验证）
  const currentHourData = dailySequence[hourIndex]
  const openPoints = currentHourData?.points || []
  
  // 4. 检查是否闭穴
  const isClosed = openPoints.length === 0
  
  // 5. 合日互用是用户可选的闭穴补充方案。默认关闭时不计算、不返回替代穴位，
  // 避免用户把合日穴误认为本日原法开穴；开启后仅在纳甲法本身闭穴时计算。
  // 注意：合日互用基于「值日周期日干」（甲己合、乙庚合…），与值日经同源。
  let alternativePoints = null
  if (isClosed && enableHeRiHuYong) {
    alternativePoints = getHeRiHuYong(effectiveDayStem, ganzhi, hourIndex)
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
    dayStem: effectiveDayStem,
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
 * 
 * 时辰干支推算（重要，勿按自然日五鼠遁）：
 * - 值日周期不以自然日切割：甲日胆经值日从甲日甲戌（开井）开始，
 *   一直顺推到乙日甲申（气纳三焦），跨越两个自然日。
 * - 因此本序列的时辰干支必须从「开井时辰」起连续顺推（每时辰干支各+1），
 *   而不是从当日子时起按五鼠遁排——两者在开井之后会错位两个天干
 *   （例：甲日顺推得丙子时开荥，五鼠遁子时起算会误标为甲子时）。
 * - 验证基准：徐凤《子午流注逐日按时定穴歌》全 60 个开穴时辰（10日×6时）
 *   与「开井时辰 + offset(0,2,4,6,8,10) 顺推」序列完全一致。
 */
function calculateDailySequence(dayStem, dayMeridian, openedPoints = new Set()) {
  const sequence = []
  const yinYang = dayMeridian.yinYang
  const jingHour = calculateJingHour(dayStem)
  const startStemIndex = WU_SHU_DUN[dayStem] || 0

  // 开井时辰的干支起点（天干/地支索引）：
  //   天干 = 五鼠遁起点顺推 jingHour 个（甲日：0+10=10≡0 → 甲）
  //   地支 = jingHour（甲日=10 → 戌）
  // 之后每个时辰 offset=(hour-jingHour+12)%12，干支各 +offset（跨日连续，不回头）
  const jingStemIndex = (startStemIndex + jingHour) % 10
  const jingBranchIndex = jingHour

  // 预缓存：同一天内经脉链和五输穴不变，避免每时辰重复计算
  const meridianChain = getDayMeridianChain(dayMeridian)
  const cachedWushuPoints = {}
  meridianChain.forEach(m => {
    if (m && !cachedWushuPoints[m.code]) {
      cachedWushuPoints[m.code] = getWushuPointsFull(m.code)
    }
  })

  for (let hour = 0; hour < 12; hour++) {
    // 相对开井时辰的顺推步数（0-11；hour 在开井之前时按跨日回绕）
    const offset = (hour - jingHour + 12) % 12
    const hourStemIndex = (jingStemIndex + offset) % 10
    const hourBranchIndex = (jingBranchIndex + offset) % 12

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
 * 返回穴位在一轮流注计算中的稳定去重键。
 *
 * 特定穴数据长期以 code 作为唯一标识，部分记录没有 id。旧实现直接使用 point.id，
 * 第一个无 id 穴位会把 undefined 放进 Set，之后所有同样无 id 的穴位都被误判为重复，
 * 造成同一天后续时辰随机般“消失”，合日互用也因此时有时无。现在优先使用 code，
 * 仅在兼容外部扩展数据时回退 id；两者都缺失时返回 null，并跳过去重而不是污染 Set。
 */
function getPointDedupKey(point) {
  if (!point) return null
  return point.code || point.id || null
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
  // stepIndex 为整数时（hour 与 jingHour 同奇偶），当前时辰有开穴
  // stepIndex 为小数时（hour 与 jingHour 异奇偶），当前时辰闭穴
  const stepIndex = ((hour - jingHour + 12) % 12) / 2

  if (stepIndex >= 0 && stepIndex <= 4) {
    // 步骤 0-4：经生经、穴生穴
    const stepMeridian = meridianChain[stepIndex]
    if (!stepMeridian) return points

    const wushuPoints = cachedWushuPoints[stepMeridian.code]
    if (!wushuPoints || wushuPoints.length === 0) return points
    
    const point = wushuPoints[stepIndex]
    const pointKey = getPointDedupKey(point)
    if (point && (!pointKey || !openedPoints.has(pointKey))) {
      const typeNames = ['井穴', '荥穴', '输穴', '经穴', '合穴']
      points.push({
        ...point,
        isOpen: true,
        isNa: false,
        isGu: false,
        type: typeNames[stepIndex]
      })
      if (pointKey) openedPoints.add(pointKey)
    }
    
    // 步骤 2（输穴）：返本还原（阳日）/ 遇输过原（阴日）
    // 开值日经的原穴
    if (stepIndex === 2) {
      const yuanLabel = dayType === '阳' ? '返本还原' : '遇输过原'
      const yuanPoint = getYuanPointFull(dayMeridian.code)
      const yuanPointKey = getPointDedupKey(yuanPoint)
      if (yuanPoint && (!yuanPointKey || !openedPoints.has(yuanPointKey))) {
        points.push({
          ...yuanPoint,
          isOpen: true,
          isNa: false,
          isGu: false,
          type: `原穴（${yuanLabel}）`
        })
        if (yuanPointKey) openedPoints.add(yuanPointKey)
      }
      
      // 特殊处理：阳日壬日同时开三焦经原穴（阳池 TE4）
      if (dayType === '阳' && dayStem === '壬') {
        const sanziaoYuanPoint = getYuanPointFull('TE')
        const sanziaoYuanPointKey = getPointDedupKey(sanziaoYuanPoint)
        if (sanziaoYuanPoint && (!sanziaoYuanPointKey || !openedPoints.has(sanziaoYuanPointKey))) {
          points.push({
            ...sanziaoYuanPoint,
            meridian: '手少阳三焦经',
            isOpen: true,
            isNa: false,
            isGu: false,
            type: '原穴（三焦寄穴）'
          })
          if (sanziaoYuanPointKey) openedPoints.add(sanziaoYuanPointKey)
        }
      }
      
      // 特殊处理：阴日癸日同时开心包经原穴（大陵 PC7）
      if (dayType === '阴' && dayStem === '癸') {
        const baoluoYuanPoint = getYuanPointFull('PC')
        const baoluoYuanPointKey = getPointDedupKey(baoluoYuanPoint)
        if (baoluoYuanPoint && (!baoluoYuanPointKey || !openedPoints.has(baoluoYuanPointKey))) {
          points.push({
            ...baoluoYuanPoint,
            meridian: '手厥阴心包经',
            isOpen: true,
            isNa: false,
            isGu: false,
            type: '原穴（包络寄穴）'
          })
          if (baoluoYuanPointKey) openedPoints.add(baoluoYuanPointKey)
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
  // 参数验证
  if (!ganzhi || !ganzhi.day || !ganzhi.hour) {
    console.warn('[反克法] 无效的干支参数')
    return {
      method: 'fanke', methodName: '反克法', date: '', hourIndex,
      hourName: HOUR_NAMES[hourIndex] || '', openPoints: [], isClosed: true
    }
  }

  const dayStem = ganzhi.day.heavenlyStem
  // 防御：hour.ganZhi 兼容「丙子」与「丙子时」两种格式（正常链路 getGanZhi 返回纯干支，
  // 但外部直接构造 ganzhi 时可能带"时"后缀），避免查表 key 不匹配导致漏穴。
  const hourGanZhi = String(ganzhi.hour.ganZhi || '').replace(/时$/, '')

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
        // 使用穴位真实类别（井穴、荥穴等），而非数据表中的"气纳三焦/血归包络"等取穴规则名称
        category: fullPoint.category || '',
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
