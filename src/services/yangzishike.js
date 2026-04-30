/**
 * 养子时刻注穴法
 * 金代何若愚《子午流注针经》首创
 * 每个时辰内，气血依次流注井、荥、输、经、合五穴
 */

import { getStemIndex, getBranchIndex, HEAVENLY_STEMS, EARTHLY_BRANCHES } from './ganzhi.js'
import { WUSHU_POINTS } from '@/data/wushu-points.js'

/**
 * 时辰名称
 */
const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

/**
 * 日天干对应值日经络
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
 * 五行相生关系
 */
const WUXING_SHENG = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
}

/**
 * 养子时刻注穴法计算
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 */
export function calculateYangziShike(ganzhi, hourIndex) {
  const dayStem = ganzhi.day.heavenlyStem
  const dayMeridian = DAY_MERIDIAN_MAP[dayStem]
  
  if (!dayMeridian) {
    throw new Error(`未知的日天干：${dayStem}`)
  }
  
  // 计算当日所有时辰的开穴
  const dailySequence = calculateDailySequence(dayStem, dayMeridian)
  
  // 获取当前时辰的开穴
  const currentHourData = dailySequence[hourIndex]
  const openPoints = currentHourData ? currentHourData.points : []
  
  return {
    method: 'yangzishike',
    methodName: '养子时刻注穴法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    dayMeridian,
    openPoints,
    dailySequence,
    // 附加信息
    dayStem,
    // 百刻制说明
    keSystem: {
      totalKe: 100,
      kePerHour: Math.floor(100 / 12),
      kePerPoint: Math.floor(100 / 12 / 5)
    }
  }
}

/**
 * 计算当日完整流注顺序
 * 每个时辰开五穴（井荥输经合）
 */
function calculateDailySequence(dayStem, dayMeridian) {
  const sequence = []
  const meridianCode = dayMeridian.code
  const wushuPoints = WUSHU_POINTS[meridianCode]
  
  if (!wushuPoints || wushuPoints.length === 0) {
    // 如果没有五输穴数据，返回空序列
    for (let i = 0; i < 12; i++) {
      sequence.push({
        hour: i,
        hourName: HOUR_NAMES[i],
        points: [],
        isOpen: false
      })
    }
    return sequence
  }
  
  // 每个时辰开五穴
  for (let hour = 0; hour < 12; hour++) {
    const points = []
    
    // 按时辰顺序，依次流注五穴
    wushuPoints.forEach((point, index) => {
      points.push({
        ...point,
        meridian: dayMeridian.fullName,
        isOpen: true,
        sequence: index + 1, // 流注顺序
        keTime: calculateKeTime(hour, index) // 刻数时间
      })
    })
    
    sequence.push({
      hour,
      hourName: HOUR_NAMES[hour],
      points,
      isOpen: points.length > 0
    })
  }
  
  return sequence
}

/**
 * 计算刻数时间
 * 一日100刻，12时辰，每时辰约8.33刻
 * 每穴约1.67刻
 */
function calculateKeTime(hourIndex, pointIndex) {
  const kePerHour = 100 / 12
  const kePerPoint = kePerHour / 5
  
  const startKe = hourIndex * kePerHour + pointIndex * kePerPoint
  const endKe = startKe + kePerPoint
  
  return {
    startKe: Math.round(startKe * 100) / 100,
    endKe: Math.round(endKe * 100) / 100,
    description: `第${Math.round(startKe)}-${Math.round(endKe)}刻`
  }
}

/**
 * 获取某时辰的某穴
 */
export function getPointByHourAndSequence(hourIndex, sequence) {
  // sequence: 1=井, 2=荥, 3=输, 4=经, 5=合
  const wushuNames = ['井穴', '荥穴', '输穴', '经穴', '合穴']
  return wushuNames[sequence - 1]
}
