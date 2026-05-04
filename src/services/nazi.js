/**
 * 纳子法（纳支法）计算模块
 * 
 * 理论基础：
 * - 子午流注纳子法是根据十二地支配合十二时辰与十二经脉，采用补母泻子的方法针灸治病
 * - 核心原则："虚则补其母，实则泻其子，不实不虚，以经取之"
 * - 《难经·六十九难》："虚者补其母，实者泻其子"
 * - 《灵枢·经脉》："不实不虚，以经取之"
 * 
 * 取穴方式：
 * 1. 本穴：五行属性与本经相同的穴位（如胆经属木，本穴为足临泣属木）
 * 2. 原穴：该经原气输注之处
 * 3. 母穴（补穴）：五行中"生我者"的穴位（虚证用补法）
 * 4. 子穴（泻穴）：五行中"我生者"的穴位（实证用泻法）
 * 5. 五输穴：该经全部五输穴（不盛不虚，以经取之）
 * 
 * 五行相生关系：木 → 火 → 土 → 金 → 水 → 木
 */

import { getWushuPointsFull, getPointByCode } from './acupuncturePoints.js'
import { HOUR_NAMES, MERIDIAN_WUXING, NAZI_SPECIAL_POINTS } from '@/data/constants.js'

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
 * 纳子法计算
 *
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 */
export function calculateNazi(ganzhi, hourIndex) {
  // 确定值时经络
  const hourMeridian = HOUR_MERIDIAN_MAP[hourIndex]
  const meridianWuxing = MERIDIAN_WUXING[hourMeridian.code]

  // 获取该经全部五输穴（以经取之）
  const openPoints = getWushuPoints(hourMeridian.code)

  // 获取本穴、原穴、母穴、子穴
  const specialPoints = getSpecialPoints(hourMeridian.code)

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
    ...specialPoints
  }
}

/**
 * 获取五输穴（井、荥、输、经、合）
 *
 * @param {string} meridianCode - 经络代码
 * @returns {Array} 五输穴列表
 */
function getWushuPoints(meridianCode) {
  const wushuPoints = getWushuPointsFull(meridianCode)
  return wushuPoints.map(point => ({
    ...point,
    isOpen: true
  }))
}

/**
 * 获取本穴、原穴、母穴（补穴）、子穴（泻穴）
 * 
 * 通过 NAZI_SPECIAL_POINTS 查表获取穴位编码，再用 getPointByCode 获取完整信息
 * 
 * @param {string} meridianCode - 经络代码
 * @returns {Object} { benPoint, yuanPoint, muPoint, ziPoint }
 */
function getSpecialPoints(meridianCode) {
  const special = NAZI_SPECIAL_POINTS[meridianCode]
  if (!special) return {}

  const benPoint = getPointByCode(special.ben)
  const yuanPoint = getPointByCode(special.yuan)
  const muPoint = getPointByCode(special.mu)
  const ziPoint = getPointByCode(special.zi)

  return {
    benPoint: benPoint ? { ...benPoint, isOpen: true, naziType: '本穴' } : null,
    yuanPoint: yuanPoint ? { ...yuanPoint, isOpen: true, naziType: '原穴' } : null,
    muPoint: muPoint ? { ...muPoint, isOpen: true, naziType: '母穴（补）' } : null,
    ziPoint: ziPoint ? { ...ziPoint, isOpen: true, naziType: '子穴（泻）' } : null
  }
}
