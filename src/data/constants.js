/**
 * 应用常量定义
 */

// 时辰名称
export const HOUR_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

// 天干
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

// 地支
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

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

// 日天干对应值日经络
export const DAY_MERIDIAN_MAP = {
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

// 五鼠遁（日上起时法）- 时辰天干起始索引
// 甲己日起甲子时（索引0），乙庚日起丙子时（索引2），丙辛日起戊子时（索引4），丁壬日起庚子时（索引6），戊癸日起壬子时（索引8）
export const WU_SHU_DUN = {
  '甲': 0, '己': 0,
  '乙': 2, '庚': 2,
  '丙': 4, '辛': 4,
  '丁': 6, '壬': 6,
  '戊': 8, '癸': 8
}

// 五行相生链（纳甲法核心：经生经穴生穴）
export const WUXING_CHAIN = ['木', '火', '土', '金', '水']

// 五行相生反向查找：找到"生我"的五行（纳子法母穴用）
export const WUXING_SHENG_REVERSE = {
  '木': '水',  // 水生木
  '火': '木',  // 木生火
  '土': '火',  // 火生土
  '金': '土',  // 土生金
  '水': '金'   // 金生水
}

// 纳子法专用穴位表：本穴、原穴、母穴（补穴）、子穴（泻穴）
export const NAZI_SPECIAL_POINTS = {
  'GB': { ben: 'GB41', yuan: 'GB40', mu: 'GB43', zi: 'GB38' },  // 胆经(木)
  'LR': { ben: 'LR1',  yuan: 'LR3',  mu: 'LR8',  zi: 'LR2' },  // 肝经(木)
  'LU': { ben: 'LU8',  yuan: 'LU9',  mu: 'LU9',  zi: 'LU5' },  // 肺经(金)
  'LI': { ben: 'LI1',  yuan: 'LI4',  mu: 'LI11', zi: 'LI2' },  // 大肠经(金)
  'ST': { ben: 'ST36', yuan: 'ST42', mu: 'ST41', zi: 'ST45' }, // 胃经(土)
  'SP': { ben: 'SP3',  yuan: 'SP3',  mu: 'SP2',  zi: 'SP5' },  // 脾经(土)
  'HT': { ben: 'HT8',  yuan: 'HT7',  mu: 'HT9',  zi: 'HT7' },  // 心经(火)
  'SI': { ben: 'SI5',  yuan: 'SI4',  mu: 'SI3',  zi: 'SI8' },  // 小肠经(火)
  'BL': { ben: 'BL66', yuan: 'BL64', mu: 'BL67', zi: 'BL65' }, // 膀胱经(水)
  'KI': { ben: 'KI10', yuan: 'KI3',  mu: 'KI7',  zi: 'KI1' },  // 肾经(水)
  'PC': { ben: 'PC8',  yuan: 'PC7',  mu: 'PC9',  zi: 'PC7' },  // 心包经(火)
  'TE': { ben: 'TE6',  yuan: 'TE4',  mu: 'TE3',  zi: 'TE10' }  // 三焦经(火)
}

// 经络代码 → 经络全称
export const MERIDIAN_CODE_TO_NAME = {
  'LU': '手太阴肺经', 'LI': '手阳明大肠经',
  'ST': '足阳明胃经', 'SP': '足太阴脾经',
  'HT': '手少阴心经', 'SI': '手太阳小肠经',
  'BL': '足太阳膀胱经', 'KI': '足少阴肾经',
  'PC': '手厥阴心包经', 'TE': '手少阳三焦经',
  'GB': '足少阳胆经', 'LR': '足厥阴肝经',
  'CV': '任脉', 'GV': '督脉'
}
