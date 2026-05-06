/**
 * 穴位数据服务
 *
 * 整合三个数据源，提供统一的穴位查询接口：
 *   1. 国家标准穴位数据（GB/T 12346-2021）— 362个经穴的基础信息（名称、拼音、定位等）
 *   2. 特定穴数据库（special-points.js）— 五输穴、原穴、络穴、郄穴等分类信息
 *   3. 经外奇穴数据库（extra-points.js）— 十四经穴之外的穴位
 *
 * 被算法层（najia/nazi/lingui/feiteng）调用，获取穴位完整信息用于取穴计算和结果展示
 */

import acupuncturePointsData from '@/data/acupuncture-points-gb2021.json'
import { SPECIAL_POINTS } from '@/data/special-points.js'
import { EXTRA_POINTS } from '@/data/extra-points.js'
import { MERIDIAN_CODE_TO_NAME } from '@/data/constants.js'
import { EIGHT_POINTS_MAP } from '@/data/eight-points.js'

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
 * 经络名称 → 经络代码（反向映射，模块级单例）
 */
const MERIDIAN_NAME_TO_CODE = Object.fromEntries(
  Object.entries(MERIDIAN_CODE_TO_NAME).map(([code, name]) => [name, code])
)

/**
 * 构建穴位代码到经络代码的映射
 */
const CODE_TO_MERIDIAN = {}
SPECIAL_POINTS.forEach(point => {
  const code = MERIDIAN_NAME_TO_CODE[point.meridian]
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
  const meridian = meridianCode ? MERIDIAN_CODE_TO_NAME[meridianCode] : ''
  
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
  
  // 五输穴类别排序表（消除对数据文件隐式顺序的依赖）
  const categoryOrder = { '井穴': 0, '荥穴': 1, '输穴': 2, '经穴': 3, '合穴': 4 }

  const wushuPoints = SPECIAL_POINTS.filter(point => {
    if (point.meridian !== MERIDIAN_CODE_TO_NAME[meridianCode]) return false
    return point.categories.some(cat => wuxingCategories.includes(cat))
  }).sort((a, b) => {
    // 按井→荥→输→经→合顺序排列，确保算法取穴正确
    const aCat = a.categories.find(c => categoryOrder[c] !== undefined)
    const bCat = b.categories.find(c => categoryOrder[c] !== undefined)
    return (categoryOrder[aCat] ?? 99) - (categoryOrder[bCat] ?? 99)
  })
  
  if (wushuPoints.length !== 5) {
    console.warn(`[五输穴] ${meridianCode} 经脉五输穴数量异常: ${wushuPoints.length}，期望 5 个`)
  }

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
  const yuanPoint = SPECIAL_POINTS.find(point =>
    point.meridian === MERIDIAN_CODE_TO_NAME[meridianCode] &&
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
    meridian: MERIDIAN_CODE_TO_NAME[meridianCode] || '',
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

  const info = EIGHT_POINTS_MAP[code]
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
