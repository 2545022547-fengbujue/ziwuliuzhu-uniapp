/**
 * 穴位数据服务
 * 关联国家标准穴位数据（GB/T 12346-2021）与特定穴数据库、经外奇穴数据库
 */

import acupuncturePointsData from '@/data/acupuncture-points-gb2021.json'
import { SPECIAL_POINTS } from '@/data/special-points.js'
import { EXTRA_POINTS } from '@/data/extra-points.js'

/**
 * 构建穴位索引（按代码快速查找）
 */
const pointsIndex = {}
acupuncturePointsData.points.forEach(point => {
  pointsIndex[point.code] = point
})

// 添加经外奇穴到索引
EXTRA_POINTS.forEach(point => {
  pointsIndex[point.code] = point
})

/**
 * 构建特定穴索引（按代码快速查找）
 */
const specialPointsIndex = {}
SPECIAL_POINTS.forEach(point => {
  specialPointsIndex[point.code] = point
})

/**
 * 构建经络代码到全称的映射
 */
const MERIDIAN_FULL_NAMES = {
  'LU': '手太阴肺经', 'LI': '手阳明大肠经',
  'ST': '足阳明胃经', 'SP': '足太阴脾经',
  'HT': '手少阴心经', 'SI': '手太阳小肠经',
  'BL': '足太阳膀胱经', 'KI': '足少阴肾经',
  'PC': '手厥阴心包经', 'TE': '手少阳三焦经',
  'GB': '足少阳胆经', 'LR': '足厥阴肝经',
  'CV': '任脉', 'GV': '督脉'
}

/**
 * 构建穴位代码到经络代码的映射
 */
const CODE_TO_MERIDIAN = {}
SPECIAL_POINTS.forEach(point => {
  // 从经络名称提取代码
  const meridianMap = {
    '手太阴肺经': 'LU', '手阳明大肠经': 'LI',
    '足阳明胃经': 'ST', '足太阴脾经': 'SP',
    '手少阴心经': 'HT', '手太阳小肠经': 'SI',
    '足太阳膀胱经': 'BL', '足少阴肾经': 'KI',
    '手厥阴心包经': 'PC', '手少阳三焦经': 'TE',
    '足少阳胆经': 'GB', '足厥阴肝经': 'LR',
    '任脉': 'CV', '督脉': 'GV'
  }
  const code = meridianMap[point.meridian]
  if (code) {
    CODE_TO_MERIDIAN[point.code] = code
  }
})

/**
 * 获取穴位完整信息（包含经络、类别、五行属性）
 * @param {string} code - 穴位代码（如 LU11, GB44）
 * @returns {Object|null} 穴位完整信息
 */
export function getPointByCode(code) {
  const basePoint = pointsIndex[code]
  if (!basePoint) return null
  
  // 经外奇穴直接返回
  if (basePoint.category === '经外奇穴') {
    return basePoint
  }
  
  // 查找经络代码
  const meridianCode = CODE_TO_MERIDIAN[code]
  const meridian = meridianCode ? MERIDIAN_FULL_NAMES[meridianCode] : ''
  
  // 查找特定穴信息（包含五输穴、原穴、络穴等所有特定穴）
  const specialPoint = specialPointsIndex[code]
  
  let category = ''
  let categories = []
  let wuxing = ''
  
  if (specialPoint) {
    // 使用特定穴的类别和五行属性
    categories = specialPoint.categories
    category = categories.join('、')
    wuxing = specialPoint.wuxing || ''
  }
  
  return {
    ...basePoint,
    meridian,
    category,
    categories,
    wuxing
  }
}

/**
 * 获取五输穴完整信息（关联国家标准数据）
 * @param {string} meridianCode - 经络代码（如 LU, GB）
 * @returns {Array} 五输穴完整信息列表
 */
export function getWushuPointsFull(meridianCode) {
  // 从特定穴数据库中筛选五输穴
  const wuxingCategories = ['井穴', '荥穴', '输穴', '经穴', '合穴']
  
  const wushuPoints = SPECIAL_POINTS.filter(point => {
    // 检查是否属于该经络
    const meridianMap = {
      'LU': '手太阴肺经', 'LI': '手阳明大肠经',
      'ST': '足阳明胃经', 'SP': '足太阴脾经',
      'HT': '手少阴心经', 'SI': '手太阳小肠经',
      'BL': '足太阳膀胱经', 'KI': '足少阴肾经',
      'PC': '手厥阴心包经', 'TE': '手少阳三焦经',
      'GB': '足少阳胆经', 'LR': '足厥阴肝经'
    }
    
    if (point.meridian !== meridianMap[meridianCode]) return false
    
    // 检查是否是五输穴
    return point.categories.some(cat => wuxingCategories.includes(cat))
  })
  
  return wushuPoints.map(point => {
    const fullData = getPointByCode(point.code)
    
    // 提取五输穴类别（井穴、荥穴等）
    const wushuCategory = point.categories.find(cat => wuxingCategories.includes(cat))
    
    return {
      ...point,
      // 合并国家标准数据
      pinyin: fullData?.pinyin || '',
      location: fullData?.location || '',
      notes: fullData?.notes || '',
      source: fullData?.source || '教材',
      // 算法相关字段
      category: wushuCategory || '',
      wuxing: point.wuxing || '',
      // 默认状态
      isOpen: false,
      isPair: false
    }
  })
}

/**
 * 获取原穴完整信息
 * @param {string} meridianCode - 经络代码
 * @returns {Object|null} 原穴完整信息
 */
export function getYuanPointFull(meridianCode) {
  // 从特定穴数据库中查找原穴
  const meridianMap = {
    'LU': '手太阴肺经', 'LI': '手阳明大肠经',
    'ST': '足阳明胃经', 'SP': '足太阴脾经',
    'HT': '手少阴心经', 'SI': '手太阳小肠经',
    'BL': '足太阳膀胱经', 'KI': '足少阴肾经',
    'PC': '手厥阴心包经', 'TE': '手少阳三焦经',
    'GB': '足少阳胆经', 'LR': '足厥阴肝经'
  }
  
  const yuanPoint = SPECIAL_POINTS.find(point => 
    point.meridian === meridianMap[meridianCode] && 
    point.categories.includes('原穴')
  )
  
  if (!yuanPoint) return null
  
  const fullData = getPointByCode(yuanPoint.code)
  return {
    ...yuanPoint,
    pinyin: fullData?.pinyin || '',
    location: fullData?.location || '',
    notes: fullData?.notes || '',
    source: fullData?.source || '教材',
    meridian: meridianMap[meridianCode] || '',
    category: '原穴',
    wuxing: ''
  }
}

/**
 * 获取八脉八穴完整信息
 * @param {string} code - 穴位代码
 * @returns {Object|null} 穴位完整信息
 */
export function getEightPointFull(code) {
  const fullData = getPointByCode(code)
  if (!fullData) return null
  
  // 八脉八穴特殊信息
  const eightPointsInfo = {
    'SP4': { connectedMeridian: '冲脉', gua: '乾', palace: 6, pairedPoint: '内关', pairedCode: 'PC6' },
    'PC6': { connectedMeridian: '阴维脉', gua: '艮', palace: 8, pairedPoint: '公孙', pairedCode: 'SP4' },
    'SI3': { connectedMeridian: '督脉', gua: '坎', palace: 1, pairedPoint: '申脉', pairedCode: 'BL62' },
    'BL62': { connectedMeridian: '阳跷脉', gua: '震', palace: 3, pairedPoint: '后溪', pairedCode: 'SI3' },
    'GB41': { connectedMeridian: '带脉', gua: '巽', palace: 4, pairedPoint: '外关', pairedCode: 'TE5' },
    'TE5': { connectedMeridian: '阳维脉', gua: '离', palace: 9, pairedPoint: '足临泣', pairedCode: 'GB41' },
    'LU7': { connectedMeridian: '任脉', gua: '坤', palace: 2, pairedPoint: '照海', pairedCode: 'KI6' },
    'KI6': { connectedMeridian: '阴跷脉', gua: '兑', palace: 7, pairedPoint: '列缺', pairedCode: 'LU7' }
  }
  
  const info = eightPointsInfo[code]
  return {
    ...fullData,
    ...info,
    isOpen: false,
    isPair: false
  }
}

/**
 * 搜索穴位（按名称或代码）
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
export function searchPoints(keyword) {
  if (!keyword) return []
  
  const results = []
  const kw = keyword.toLowerCase()
  
  acupuncturePointsData.points.forEach(point => {
    if (
      point.name.includes(keyword) ||
      point.code.toLowerCase().includes(kw) ||
      (point.pinyin && point.pinyin.toLowerCase().includes(kw))
    ) {
      results.push(point)
    }
  })
  
  // 搜索经外奇穴
  EXTRA_POINTS.forEach(point => {
    if (
      point.name.includes(keyword) ||
      point.code.toLowerCase().includes(kw) ||
      (point.pinyin && point.pinyin.toLowerCase().includes(kw))
    ) {
      results.push(point)
    }
  })
  
  return results.slice(0, 20)
}

/**
 * 获取所有穴位列表（包含经外奇穴）
 * @returns {Array} 所有穴位
 */
export function getAllPoints() {
  return [...acupuncturePointsData.points, ...EXTRA_POINTS]
}

/**
 * 获取某经络的所有穴位
 * @param {string} meridianCode - 经络代码
 * @returns {Array} 该经络的所有穴位
 */
export function getPointsByMeridian(meridianCode) {
  return acupuncturePointsData.points.filter(p => p.code.startsWith(meridianCode))
}

/**
 * 获取穴位数据库元数据
 * @returns {Object} 元数据
 */
export function getMetadata() {
  return {
    ...acupuncturePointsData.metadata,
    extraPointsCount: EXTRA_POINTS.length,
    specialPointsCount: SPECIAL_POINTS.length,
    totalPoints: acupuncturePointsData.points.length + EXTRA_POINTS.length
  }
}
