/**
 * 五输穴数据库（基于教材表10-5）
 * 每条经络的井、荥、输、经、合穴
 * 阳经：井(金)→荥(水)→输(木)→经(火)→合(土)
 * 阴经：井(木)→荥(火)→输(土)→经(金)→合(水)
 */

export const WUSHU_POINTS = {
  // 手太阴肺经（阴经，属金）
  'LU': [
    { id: 'LU11', name: '少商', code: 'LU11', category: '井穴', wuxing: '木' },
    { id: 'LU10', name: '鱼际', code: 'LU10', category: '荥穴', wuxing: '火' },
    { id: 'LU9', name: '太渊', code: 'LU9', category: '输穴;原穴', wuxing: '土' },
    { id: 'LU8', name: '经渠', code: 'LU8', category: '经穴', wuxing: '金' },
    { id: 'LU5', name: '尺泽', code: 'LU5', category: '合穴', wuxing: '水' }
  ],
  
  // 手阳明大肠经（阳经，属金）
  'LI': [
    { id: 'LI1', name: '商阳', code: 'LI1', category: '井穴', wuxing: '金' },
    { id: 'LI2', name: '二间', code: 'LI2', category: '荥穴', wuxing: '水' },
    { id: 'LI3', name: '三间', code: 'LI3', category: '输穴', wuxing: '木' },
    { id: 'LI5', name: '阳溪', code: 'LI5', category: '经穴', wuxing: '火' },
    { id: 'LI11', name: '曲池', code: 'LI11', category: '合穴', wuxing: '土' }
  ],
  
  // 足阳明胃经（阳经，属土）
  'ST': [
    { id: 'ST45', name: '厉兑', code: 'ST45', category: '井穴', wuxing: '金' },
    { id: 'ST44', name: '内庭', code: 'ST44', category: '荥穴', wuxing: '水' },
    { id: 'ST43', name: '陷谷', code: 'ST43', category: '输穴', wuxing: '木' },
    { id: 'ST41', name: '解溪', code: 'ST41', category: '经穴', wuxing: '火' },
    { id: 'ST36', name: '足三里', code: 'ST36', category: '合穴', wuxing: '土' }
  ],
  
  // 足太阴脾经（阴经，属土）
  'SP': [
    { id: 'SP1', name: '隐白', code: 'SP1', category: '井穴', wuxing: '木' },
    { id: 'SP2', name: '大都', code: 'SP2', category: '荥穴', wuxing: '火' },
    { id: 'SP3', name: '太白', code: 'SP3', category: '输穴;原穴', wuxing: '土' },
    { id: 'SP5', name: '商丘', code: 'SP5', category: '经穴', wuxing: '金' },
    { id: 'SP9', name: '阴陵泉', code: 'SP9', category: '合穴', wuxing: '水' }
  ],
  
  // 手少阴心经（阴经，属火）
  'HT': [
    { id: 'HT9', name: '少冲', code: 'HT9', category: '井穴', wuxing: '木' },
    { id: 'HT8', name: '少府', code: 'HT8', category: '荥穴', wuxing: '火' },
    { id: 'HT7', name: '神门', code: 'HT7', category: '输穴;原穴', wuxing: '土' },
    { id: 'HT5', name: '通里', code: 'HT5', category: '经穴', wuxing: '金' },
    { id: 'HT3', name: '少海', code: 'HT3', category: '合穴', wuxing: '水' }
  ],
  
  // 手太阳小肠经（阳经，属火）
  'SI': [
    { id: 'SI1', name: '少泽', code: 'SI1', category: '井穴', wuxing: '金' },
    { id: 'SI2', name: '前谷', code: 'SI2', category: '荥穴', wuxing: '水' },
    { id: 'SI3', name: '后溪', code: 'SI3', category: '输穴', wuxing: '木' },
    { id: 'SI5', name: '阳谷', code: 'SI5', category: '经穴', wuxing: '火' },
    { id: 'SI8', name: '小海', code: 'SI8', category: '合穴', wuxing: '土' }
  ],
  
  // 足太阳膀胱经（阳经，属水）
  'BL': [
    { id: 'BL67', name: '至阴', code: 'BL67', category: '井穴', wuxing: '金' },
    { id: 'BL66', name: '足通谷', code: 'BL66', category: '荥穴', wuxing: '水' },
    { id: 'BL65', name: '束骨', code: 'BL65', category: '输穴', wuxing: '木' },
    { id: 'BL60', name: '昆仑', code: 'BL60', category: '经穴', wuxing: '火' },
    { id: 'BL40', name: '委中', code: 'BL40', category: '合穴', wuxing: '土' }
  ],
  
  // 足少阴肾经（阴经，属水）
  'KI': [
    { id: 'KI1', name: '涌泉', code: 'KI1', category: '井穴', wuxing: '木' },
    { id: 'KI2', name: '然谷', code: 'KI2', category: '荥穴', wuxing: '火' },
    { id: 'KI3', name: '太溪', code: 'KI3', category: '输穴;原穴', wuxing: '土' },
    { id: 'KI7', name: '复溜', code: 'KI7', category: '经穴', wuxing: '金' },
    { id: 'KI10', name: '阴谷', code: 'KI10', category: '合穴', wuxing: '水' }
  ],
  
  // 手厥阴心包经（阴经，属相火）
  'PC': [
    { id: 'PC9', name: '中冲', code: 'PC9', category: '井穴', wuxing: '木' },
    { id: 'PC8', name: '劳宫', code: 'PC8', category: '荥穴', wuxing: '火' },
    { id: 'PC7', name: '大陵', code: 'PC7', category: '输穴;原穴', wuxing: '土' },
    { id: 'PC5', name: '间使', code: 'PC5', category: '经穴', wuxing: '金' },
    { id: 'PC3', name: '曲泽', code: 'PC3', category: '合穴', wuxing: '水' }
  ],
  
  // 手少阳三焦经（阳经，属相火）
  'TE': [
    { id: 'TE1', name: '关冲', code: 'TE1', category: '井穴', wuxing: '金' },
    { id: 'TE2', name: '液门', code: 'TE2', category: '荥穴', wuxing: '水' },
    { id: 'TE3', name: '中渚', code: 'TE3', category: '输穴', wuxing: '木' },
    { id: 'TE4', name: '阳池', code: 'TE4', category: '原穴', wuxing: '火' },
    { id: 'TE5', name: '外关', code: 'TE5', category: '络穴', wuxing: '火' },
    { id: 'TE10', name: '天井', code: 'TE10', category: '合穴', wuxing: '土' }
  ],
  
  // 足少阳胆经（阳经，属木）
  'GB': [
    { id: 'GB44', name: '足窍阴', code: 'GB44', category: '井穴', wuxing: '金' },
    { id: 'GB43', name: '侠溪', code: 'GB43', category: '荥穴', wuxing: '水' },
    { id: 'GB40', name: '丘墟', code: 'GB40', category: '输穴;原穴', wuxing: '木' },
    { id: 'GB38', name: '阳辅', code: 'GB38', category: '经穴', wuxing: '火' },
    { id: 'GB34', name: '阳陵泉', code: 'GB34', category: '合穴', wuxing: '土' }
  ],
  
  // 足厥阴肝经（阴经，属木）
  'LR': [
    { id: 'LR1', name: '大敦', code: 'LR1', category: '井穴', wuxing: '木' },
    { id: 'LR2', name: '行间', code: 'LR2', category: '荥穴', wuxing: '火' },
    { id: 'LR3', name: '太冲', code: 'LR3', category: '输穴;原穴', wuxing: '土' },
    { id: 'LR5', name: '中封', code: 'LR5', category: '经穴', wuxing: '金' },
    { id: 'LR8', name: '曲泉', code: 'LR8', category: '合穴', wuxing: '水' }
  ]
}

/**
 * 十二原穴
 */
export const YUAN_POINTS = {
  'LU': { id: 'LU9', name: '太渊', code: 'LU9' },
  'LI': { id: 'LI4', name: '合谷', code: 'LI4' },
  'ST': { id: 'ST42', name: '冲阳', code: 'ST42' },
  'SP': { id: 'SP3', name: '太白', code: 'SP3' },
  'HT': { id: 'HT7', name: '神门', code: 'HT7' },
  'SI': { id: 'SI4', name: '腕骨', code: 'SI4' },
  'BL': { id: 'BL64', name: '京骨', code: 'BL64' },
  'KI': { id: 'KI3', name: '太溪', code: 'KI3' },
  'PC': { id: 'PC7', name: '大陵', code: 'PC7' },
  'TE': { id: 'TE4', name: '阳池', code: 'TE4' },
  'GB': { id: 'GB40', name: '丘墟', code: 'GB40' },
  'LR': { id: 'LR3', name: '太冲', code: 'LR3' }
}

/**
 * 获取某经络的五输穴
 */
export function getWushuPoints(meridianCode) {
  return WUSHU_POINTS[meridianCode] || []
}

/**
 * 获取某经络的原穴
 */
export function getYuanPoint(meridianCode) {
  return YUAN_POINTS[meridianCode] || null
}

/**
 * 获取某五输穴的五行属性
 */
export function getWuxingByCategory(meridianCode, category) {
  const points = getWushuPoints(meridianCode)
  const point = points.find(p => p.category.includes(category))
  return point ? point.wuxing : null
}
