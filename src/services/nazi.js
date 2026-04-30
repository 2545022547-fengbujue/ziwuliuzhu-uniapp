/**
 * 纳子法（纳支法）计算模块
 * 
 * 理论基础：
 * - 子午流注纳子法是根据十二地支配合十二时辰与十二经脉，采用补母泻子的方法针灸治病
 * - 核心原则："虚则补其母，实则泻其子，不实不虚，以经取之"
 * - 《难经·六十九难》："虚者补其母，实者泻其子"
 * - 《灵枢·经脉》："不实不虚，以经取之"
 * 
 * 计算逻辑：
 * 1. 根据时辰确定值时经络（十二时辰对应十二经脉）
 * 2. 根据病证性质确定取穴方式：
 *    - 虚证：补法（取母穴）
 *    - 实证：泻法（取子穴）
 *    - 不实不虚：以经取之（取本经所有五输穴）
 * 
 * 五行相生关系：
 * 木 → 火 → 土 → 金 → 水 → 木
 * 
 * 经络五行属性：
 * - 木：胆经(GB)、肝经(LR)
 * - 火：小肠经(SI)、心经(HT)、心包经(PC)、三焦经(TE)
 * - 土：胃经(ST)、脾经(SP)
 * - 金：大肠经(LI)、肺经(LU)
 * - 水：膀胱经(BL)、肾经(KI)
 */

import { getBranchIndex } from './ganzhi.js'
import { getWushuPointsFull, getPointByCode } from './acupuncturePoints.js'

/**
 * 时辰对应经络
 */
const HOUR_MERIDIAN_MAP = {
  0: { name: '胆经', code: 'GB', fullName: '足少阳胆经' },    // 子时
  1: { name: '肝经', code: 'LR', fullName: '足厥阴肝经' },    // 丑时
  2: { name: '肺经', code: 'LU', fullName: '手太阴肺经' },    // 寅时
  3: { name: '大肠经', code: 'LI', fullName: '手阳明大肠经' }, // 卯时
  4: { name: '胃经', code: 'ST', fullName: '足阳明胃经' },    // 辰时
  5: { name: '脾经', code: 'SP', fullName: '足太阴脾经' },    // 巳时
  6: { name: '心经', code: 'HT', fullName: '手少阴心经' },    // 午时
  7: { name: '小肠经', code: 'SI', fullName: '手太阳小肠经' }, // 未时
  8: { name: '膀胱经', code: 'BL', fullName: '足太阳膀胱经' }, // 申时
  9: { name: '肾经', code: 'KI', fullName: '足少阴肾经' },    // 酉时
  10: { name: '心包经', code: 'PC', fullName: '手厥阴心包经' }, // 戌时
  11: { name: '三焦经', code: 'TE', fullName: '手少阳三焦经' } // 亥时
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
 * 经络五行属性
 */
const MERIDIAN_WUXING = {
  'LU': '金', 'LI': '金',
  'ST': '土', 'SP': '土',
  'HT': '火', 'SI': '火',
  'BL': '水', 'KI': '水',
  'PC': '火', 'TE': '火',
  'GB': '木', 'LR': '木'
}

/**
 * 纳子法计算
 * 
 * @param {Object} ganzhi - 干支信息（包含年、月、日、时的天干地支）
 * @param {number} hourIndex - 时辰索引 (0-11)，对应十二时辰
 * @param {string} diseaseType - 病证性质：'平补平泻' | '虚证' | '实证'
 * @returns {Object} 取穴结果
 * 
 * @example
 * // 计算壬日未时的纳子法取穴
 * calculateNazi(ganzhi, 7, '平补平泻')
 * // 返回：{ method: 'nazi', openPoints: [...], suggestion: {...} }
 */
export function calculateNazi(ganzhi, hourIndex, diseaseType = '平补平泻') {
  const hourBranch = ganzhi.hour.earthlyBranch
  
  // 确定值时经络
  const hourMeridian = HOUR_MERIDIAN_MAP[hourIndex]
  const meridianWuxing = MERIDIAN_WUXING[hourMeridian.code]
  
  // 计算补泻穴位
  let motherPoint = null  // 母穴（补法）
  let childPoint = null   // 子穴（泻法）
  
  if (meridianWuxing) {
    // 找母穴：五行相生关系中"生我"的穴位
    // 例如：肺经(金)的母穴是土穴（土生金）
    const motherElement = Object.keys(WUXING_SHENG).find(
      key => WUXING_SHENG[key] === meridianWuxing
    )
    // 找子穴：五行相生关系中"我生"的穴位
    // 例如：肺经(金)的子穴是水穴（金生水）
    const childElement = WUXING_SHENG[meridianWuxing]
    
    motherPoint = getPointByElement(hourMeridian.code, motherElement)
    childPoint = getPointByElement(hourMeridian.code, childElement)
  }
  
  // 根据病证性质确定取穴
  let openPoints = []
  let suggestion = {
    type: '平补平泻',
    reason: '平补平泻法'
  }
  
  if (diseaseType === '虚证') {
    // 虚则补其母
    openPoints = motherPoint ? [motherPoint] : []
    suggestion = {
      type: '补法',
      reason: '虚则补其母',
      element: motherElement
    }
  } else if (diseaseType === '实证') {
    // 实则泻其子
    openPoints = childPoint ? [childPoint] : []
    suggestion = {
      type: '泻法',
      reason: '实则泻其子',
      element: childElement
    }
  } else {
    // 不实不虚，以经取之：显示该经络所有五输穴
    openPoints = getWushuPoints(hourMeridian.code)
  }
  
  return {
    method: 'nazi',
    methodName: '纳子法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    hourGanZhi: ganzhi.hour.ganZhi,
    hourMeridian,
    meridianWuxing,
    openPoints,
    motherPoint,
    childPoint,
    suggestion,
    diseaseType
  }
}

/**
 * 获取某经络的某五行属性穴位
 * 
 * @param {string} meridianCode - 经络代码（如'LU'、'LI'等）
 * @param {string} element - 五行属性（'木'、'火'、'土'、'金'、'水'）
 * @returns {Object|null} 穴位信息，未找到返回null
 */
function getPointByElement(meridianCode, element) {
  // 使用完整穴位数据
  const wushuPoints = getWushuPointsFull(meridianCode)
  if (!wushuPoints || wushuPoints.length === 0) return null
  
  // 找到对应五行属性的穴位
  const point = wushuPoints.find(p => p.wuxing === element)
  if (point) {
    return {
      ...point,
      meridian: getMeridianFullName(meridianCode)
    }
  }
  
  return null
}

/**
 * 获取经络全称
 * 
 * @param {string} code - 经络代码（如'LU'、'LI'等）
 * @returns {string} 经络全称（如'手太阴肺经'）
 */
function getMeridianFullName(code) {
  const names = {
    'LU': '手太阴肺经', 'LI': '手阳明大肠经',
    'ST': '足阳明胃经', 'SP': '足太阴脾经',
    'HT': '手少阴心经', 'SI': '手太阳小肠经',
    'BL': '足太阳膀胱经', 'KI': '足少阴肾经',
    'PC': '手厥阴心包经', 'TE': '手少阳三焦经',
    'GB': '足少阳胆经', 'LR': '足厥阴肝经'
  }
  return names[code] || code
}

/**
 * 获取五输穴（井、荥、输、经、合）
 * 
 * @param {string} meridianCode - 经络代码
 * @returns {Array} 五输穴列表
 */
function getWushuPoints(meridianCode) {
  // 使用完整穴位数据
  const wushuPoints = getWushuPointsFull(meridianCode)
  return wushuPoints.map(point => ({
    ...point,
    meridian: getMeridianFullName(meridianCode),
    isOpen: true
  }))
}
