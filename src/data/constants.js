/**
 * 应用常量定义
 */

// 时辰名称
export const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

// 时辰时间范围
export const HOUR_RANGES = [
  { start: 23, end: 1, name: '子时' },
  { start: 1, end: 3, name: '丑时' },
  { start: 3, end: 5, name: '寅时' },
  { start: 5, end: 7, name: '卯时' },
  { start: 7, end: 9, name: '辰时' },
  { start: 9, end: 11, name: '巳时' },
  { start: 11, end: 13, name: '午时' },
  { start: 13, end: 15, name: '未时' },
  { start: 15, end: 17, name: '申时' },
  { start: 17, end: 19, name: '酉时' },
  { start: 19, end: 21, name: '戌时' },
  { start: 21, end: 23, name: '亥时' }
]

// 天干
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

// 地支
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 取穴方法
export const METHODS = {
  NAJIA: 'najia',
  NAZI: 'nazi',
  LINGUI: 'lingui',
  FEITENG: 'feiteng',
  FANKE: 'fanke'
}

// 方法名称映射
export const METHOD_NAMES = {
  najia: '纳甲法',
  nazi: '纳子法',
  lingui: '灵龟八法',
  feiteng: '飞腾八法',
  fanke: '反克法'
}

// 五行
export const WUXING = ['木', '火', '土', '金', '水']

// 五行相生
export const WUXING_SHENG = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
}

// 五行相克
export const WUXING_KE = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
}

// 经络五行属性
export const MERIDIAN_WUXING = {
  'LU': '金', 'LI': '金',
  'ST': '土', 'SP': '土',
  'HT': '火', 'SI': '火',
  'BL': '水', 'KI': '水',
  'PC': '火', 'TE': '火',
  'GB': '木', 'LR': '木'
}

// 五输穴
export const WUSHU_POINTS = ['井', '荥', '输', '经', '合']

// 中国大陆时区配置
export const CHINA_TIMEZONE = 'Asia/Shanghai'
export const CHINA_CENTER_LONGITUDE = 104 // 中国大陆中心经度
