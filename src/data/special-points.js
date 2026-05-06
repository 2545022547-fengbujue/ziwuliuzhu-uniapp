/**
 * 特定穴数据库
 *
 * 包含十四经脉的所有特定穴，按经络分组排列。
 * 数据来源：《针灸学》教材
 *
 * 穴位类别：
 *   - 五输穴：井、荥、输、经、合（有五行属性）
 *   - 原穴：原气输注之处
 *   - 络穴：络脉别出之处
 *   - 郄穴：经气深聚之处
 *   - 募穴：脏腑之气输注于胸腹部
 *   - 背俞穴：脏腑之气输注于背腰部
 *   - 八会穴：脏、腑、气、血、筋、脉、骨、髓之精气会聚处
 *   - 八脉交会穴：奇经八脉与十二经脉交会的穴位
 *   - 下合穴：六腑下合于足三阳经的穴位
 *
 * 数据结构：
 *   - code: 穴位代码（如 'LU9'），遵循国际标准命名
 *   - name: 穴位中文名
 *   - meridian: 所属经络全称
 *   - categories: 穴位类别数组（一个穴位可属于多个类别，如太渊是输穴+原穴+八会穴）
 *   - wuxing: 五行属性（仅五输穴有值，其他为空字符串）
 */

export const SPECIAL_POINTS = [
  // 手太阴肺经
  { code: 'LU11', name: '少商', meridian: '手太阴肺经', categories: ['井穴'], wuxing: '木' },
  { code: 'LU10', name: '鱼际', meridian: '手太阴肺经', categories: ['荥穴'], wuxing: '火' },
  { code: 'LU9', name: '太渊', meridian: '手太阴肺经', categories: ['输穴', '原穴', '八会穴（脉会）'], wuxing: '土' },
  { code: 'LU8', name: '经渠', meridian: '手太阴肺经', categories: ['经穴'], wuxing: '金' },
  { code: 'LU5', name: '尺泽', meridian: '手太阴肺经', categories: ['合穴'], wuxing: '水' },
  { code: 'LU7', name: '列缺', meridian: '手太阴肺经', categories: ['络穴', '八脉交会穴'], wuxing: '' },
  { code: 'LU6', name: '孔最', meridian: '手太阴肺经', categories: ['郄穴'], wuxing: '' },
  { code: 'LU1', name: '中府', meridian: '手太阴肺经', categories: ['募穴（肺募）'], wuxing: '' },
  
  // 手厥阴心包经
  { code: 'PC9', name: '中冲', meridian: '手厥阴心包经', categories: ['井穴'], wuxing: '木' },
  { code: 'PC8', name: '劳宫', meridian: '手厥阴心包经', categories: ['荥穴'], wuxing: '火' },
  { code: 'PC7', name: '大陵', meridian: '手厥阴心包经', categories: ['输穴', '原穴'], wuxing: '土' },
  { code: 'PC5', name: '间使', meridian: '手厥阴心包经', categories: ['经穴'], wuxing: '金' },
  { code: 'PC3', name: '曲泽', meridian: '手厥阴心包经', categories: ['合穴'], wuxing: '水' },
  { code: 'PC6', name: '内关', meridian: '手厥阴心包经', categories: ['络穴', '八脉交会穴'], wuxing: '' },
  { code: 'PC4', name: '郄门', meridian: '手厥阴心包经', categories: ['郄穴'], wuxing: '' },
  
  // 手少阴心经
  { code: 'HT9', name: '少冲', meridian: '手少阴心经', categories: ['井穴'], wuxing: '木' },
  { code: 'HT8', name: '少府', meridian: '手少阴心经', categories: ['荥穴'], wuxing: '火' },
  { code: 'HT7', name: '神门', meridian: '手少阴心经', categories: ['输穴', '原穴'], wuxing: '土' },
  { code: 'HT4', name: '灵道', meridian: '手少阴心经', categories: ['经穴'], wuxing: '金' },
  { code: 'HT3', name: '少海', meridian: '手少阴心经', categories: ['合穴'], wuxing: '水' },
  { code: 'HT5', name: '通里', meridian: '手少阴心经', categories: ['络穴'], wuxing: '' },
  { code: 'HT6', name: '阴郄', meridian: '手少阴心经', categories: ['郄穴'], wuxing: '' },
  
  // 手阳明大肠经
  { code: 'LI1', name: '商阳', meridian: '手阳明大肠经', categories: ['井穴'], wuxing: '金' },
  { code: 'LI2', name: '二间', meridian: '手阳明大肠经', categories: ['荥穴'], wuxing: '水' },
  { code: 'LI3', name: '三间', meridian: '手阳明大肠经', categories: ['输穴'], wuxing: '木' },
  { code: 'LI5', name: '阳溪', meridian: '手阳明大肠经', categories: ['经穴'], wuxing: '火' },
  { code: 'LI11', name: '曲池', meridian: '手阳明大肠经', categories: ['合穴'], wuxing: '土' },
  { code: 'LI4', name: '合谷', meridian: '手阳明大肠经', categories: ['原穴'], wuxing: '' },
  { code: 'LI6', name: '偏历', meridian: '手阳明大肠经', categories: ['络穴'], wuxing: '' },
  { code: 'LI7', name: '温溜', meridian: '手阳明大肠经', categories: ['郄穴'], wuxing: '' },
  
  // 手少阳三焦经
  { code: 'TE1', name: '关冲', meridian: '手少阳三焦经', categories: ['井穴'], wuxing: '金' },
  { code: 'TE2', name: '液门', meridian: '手少阳三焦经', categories: ['荥穴'], wuxing: '水' },
  { code: 'TE3', name: '中渚', meridian: '手少阳三焦经', categories: ['输穴'], wuxing: '木' },
  { code: 'TE6', name: '支沟', meridian: '手少阳三焦经', categories: ['经穴'], wuxing: '火' },
  { code: 'TE10', name: '天井', meridian: '手少阳三焦经', categories: ['合穴'], wuxing: '土' },
  { code: 'TE4', name: '阳池', meridian: '手少阳三焦经', categories: ['原穴'], wuxing: '' },
  { code: 'TE5', name: '外关', meridian: '手少阳三焦经', categories: ['络穴', '八脉交会穴'], wuxing: '' },
  { code: 'TE7', name: '会宗', meridian: '手少阳三焦经', categories: ['郄穴'], wuxing: '' },
  
  // 手太阳小肠经
  { code: 'SI1', name: '少泽', meridian: '手太阳小肠经', categories: ['井穴'], wuxing: '金' },
  { code: 'SI2', name: '前谷', meridian: '手太阳小肠经', categories: ['荥穴'], wuxing: '水' },
  { code: 'SI3', name: '后溪', meridian: '手太阳小肠经', categories: ['输穴', '八脉交会穴'], wuxing: '木' },
  { code: 'SI5', name: '阳谷', meridian: '手太阳小肠经', categories: ['经穴'], wuxing: '火' },
  { code: 'SI8', name: '小海', meridian: '手太阳小肠经', categories: ['合穴'], wuxing: '土' },
  { code: 'SI4', name: '腕骨', meridian: '手太阳小肠经', categories: ['原穴'], wuxing: '' },
  { code: 'SI7', name: '支正', meridian: '手太阳小肠经', categories: ['络穴'], wuxing: '' },
  { code: 'SI6', name: '养老', meridian: '手太阳小肠经', categories: ['郄穴'], wuxing: '' },
  
  // 足太阴脾经
  { code: 'SP1', name: '隐白', meridian: '足太阴脾经', categories: ['井穴'], wuxing: '木' },
  { code: 'SP2', name: '大都', meridian: '足太阴脾经', categories: ['荥穴'], wuxing: '火' },
  { code: 'SP3', name: '太白', meridian: '足太阴脾经', categories: ['输穴', '原穴'], wuxing: '土' },
  { code: 'SP5', name: '商丘', meridian: '足太阴脾经', categories: ['经穴'], wuxing: '金' },
  { code: 'SP9', name: '阴陵泉', meridian: '足太阴脾经', categories: ['合穴'], wuxing: '水' },
  { code: 'SP4', name: '公孙', meridian: '足太阴脾经', categories: ['络穴', '八脉交会穴'], wuxing: '' },
  { code: 'SP8', name: '地机', meridian: '足太阴脾经', categories: ['郄穴'], wuxing: '' },
  { code: 'SP21', name: '大包', meridian: '足太阴脾经', categories: ['络穴（脾之大络）'], wuxing: '' },
  
  // 足厥阴肝经
  { code: 'LR1', name: '大敦', meridian: '足厥阴肝经', categories: ['井穴'], wuxing: '木' },
  { code: 'LR2', name: '行间', meridian: '足厥阴肝经', categories: ['荥穴'], wuxing: '火' },
  { code: 'LR3', name: '太冲', meridian: '足厥阴肝经', categories: ['输穴', '原穴'], wuxing: '土' },
  { code: 'LR4', name: '中封', meridian: '足厥阴肝经', categories: ['经穴'], wuxing: '金' },
  { code: 'LR8', name: '曲泉', meridian: '足厥阴肝经', categories: ['合穴'], wuxing: '水' },
  { code: 'LR5', name: '蠡沟', meridian: '足厥阴肝经', categories: ['络穴'], wuxing: '' },
  { code: 'LR6', name: '中都', meridian: '足厥阴肝经', categories: ['郄穴'], wuxing: '' },
  { code: 'LR14', name: '期门', meridian: '足厥阴肝经', categories: ['募穴（肝募）'], wuxing: '' },
  { code: 'LR13', name: '章门', meridian: '足厥阴肝经', categories: ['募穴（脾募）', '八会穴（脏会）'], wuxing: '' },
  
  // 足少阴肾经
  { code: 'KI1', name: '涌泉', meridian: '足少阴肾经', categories: ['井穴'], wuxing: '木' },
  { code: 'KI2', name: '然谷', meridian: '足少阴肾经', categories: ['荥穴'], wuxing: '火' },
  { code: 'KI3', name: '太溪', meridian: '足少阴肾经', categories: ['输穴', '原穴'], wuxing: '土' },
  { code: 'KI7', name: '复溜', meridian: '足少阴肾经', categories: ['经穴'], wuxing: '金' },
  { code: 'KI10', name: '阴谷', meridian: '足少阴肾经', categories: ['合穴'], wuxing: '水' },
  { code: 'KI4', name: '大钟', meridian: '足少阴肾经', categories: ['络穴'], wuxing: '' },
  { code: 'KI5', name: '水泉', meridian: '足少阴肾经', categories: ['郄穴'], wuxing: '' },
  { code: 'KI6', name: '照海', meridian: '足少阴肾经', categories: ['八脉交会穴'], wuxing: '' },
  
  // 足阳明胃经
  { code: 'ST45', name: '厉兑', meridian: '足阳明胃经', categories: ['井穴'], wuxing: '金' },
  { code: 'ST44', name: '内庭', meridian: '足阳明胃经', categories: ['荥穴'], wuxing: '水' },
  { code: 'ST43', name: '陷谷', meridian: '足阳明胃经', categories: ['输穴'], wuxing: '木' },
  { code: 'ST41', name: '解溪', meridian: '足阳明胃经', categories: ['经穴'], wuxing: '火' },
  { code: 'ST36', name: '足三里', meridian: '足阳明胃经', categories: ['合穴', '下合穴（胃）'], wuxing: '土' },
  { code: 'ST42', name: '冲阳', meridian: '足阳明胃经', categories: ['原穴'], wuxing: '' },
  { code: 'ST40', name: '丰隆', meridian: '足阳明胃经', categories: ['络穴'], wuxing: '' },
  { code: 'ST34', name: '梁丘', meridian: '足阳明胃经', categories: ['郄穴'], wuxing: '' },
  { code: 'ST37', name: '上巨虚', meridian: '足阳明胃经', categories: ['下合穴（大肠）'], wuxing: '' },
  { code: 'ST39', name: '下巨虚', meridian: '足阳明胃经', categories: ['下合穴（小肠）'], wuxing: '' },
  { code: 'ST25', name: '天枢', meridian: '足阳明胃经', categories: ['募穴（大肠募）'], wuxing: '' },
  
  // 足少阳胆经
  { code: 'GB44', name: '足窍阴', meridian: '足少阳胆经', categories: ['井穴'], wuxing: '金' },
  { code: 'GB43', name: '侠溪', meridian: '足少阳胆经', categories: ['荥穴'], wuxing: '水' },
  { code: 'GB41', name: '足临泣', meridian: '足少阳胆经', categories: ['输穴', '八脉交会穴'], wuxing: '木' },
  { code: 'GB38', name: '阳辅', meridian: '足少阳胆经', categories: ['经穴'], wuxing: '火' },
  { code: 'GB34', name: '阳陵泉', meridian: '足少阳胆经', categories: ['合穴', '八会穴（筋会）', '下合穴（胆）'], wuxing: '土' },
  { code: 'GB40', name: '丘墟', meridian: '足少阳胆经', categories: ['原穴'], wuxing: '' },
  { code: 'GB37', name: '光明', meridian: '足少阳胆经', categories: ['络穴'], wuxing: '' },
  { code: 'GB36', name: '外丘', meridian: '足少阳胆经', categories: ['郄穴'], wuxing: '' },
  { code: 'GB39', name: '悬钟', meridian: '足少阳胆经', categories: ['八会穴（髓会）'], wuxing: '' },
  { code: 'GB25', name: '京门', meridian: '足少阳胆经', categories: ['募穴（肾募）'], wuxing: '' },
  { code: 'GB24', name: '日月', meridian: '足少阳胆经', categories: ['募穴（胆募）'], wuxing: '' },
  
  // 足太阳膀胱经
  { code: 'BL67', name: '至阴', meridian: '足太阳膀胱经', categories: ['井穴'], wuxing: '金' },
  { code: 'BL66', name: '足通谷', meridian: '足太阳膀胱经', categories: ['荥穴'], wuxing: '水' },
  { code: 'BL65', name: '束骨', meridian: '足太阳膀胱经', categories: ['输穴'], wuxing: '木' },
  { code: 'BL60', name: '昆仑', meridian: '足太阳膀胱经', categories: ['经穴'], wuxing: '火' },
  { code: 'BL40', name: '委中', meridian: '足太阳膀胱经', categories: ['合穴', '下合穴（膀胱）'], wuxing: '土' },
  { code: 'BL64', name: '京骨', meridian: '足太阳膀胱经', categories: ['原穴'], wuxing: '' },
  { code: 'BL58', name: '飞扬', meridian: '足太阳膀胱经', categories: ['络穴'], wuxing: '' },
  { code: 'BL63', name: '金门', meridian: '足太阳膀胱经', categories: ['郄穴'], wuxing: '' },
  { code: 'BL39', name: '委阳', meridian: '足太阳膀胱经', categories: ['下合穴（三焦）'], wuxing: '' },
  { code: 'BL62', name: '申脉', meridian: '足太阳膀胱经', categories: ['八脉交会穴'], wuxing: '' },
  { code: 'BL13', name: '肺俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL14', name: '厥阴俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL15', name: '心俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL18', name: '肝俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL19', name: '胆俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL20', name: '脾俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL21', name: '胃俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL22', name: '三焦俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL23', name: '肾俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL25', name: '大肠俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL27', name: '小肠俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL28', name: '膀胱俞', meridian: '足太阳膀胱经', categories: ['背俞穴'], wuxing: '' },
  { code: 'BL17', name: '膈俞', meridian: '足太阳膀胱经', categories: ['八会穴（血会）'], wuxing: '' },
  { code: 'BL11', name: '大杼', meridian: '足太阳膀胱经', categories: ['八会穴（骨会）'], wuxing: '' },
  
  // 任脉
  { code: 'CV15', name: '鸠尾', meridian: '任脉', categories: ['络穴（任脉络穴）'], wuxing: '' },
  { code: 'CV17', name: '膻中', meridian: '任脉', categories: ['募穴（心包募）', '八会穴（气会）'], wuxing: '' },
  { code: 'CV14', name: '巨阙', meridian: '任脉', categories: ['募穴（心募）'], wuxing: '' },
  { code: 'CV12', name: '中脘', meridian: '任脉', categories: ['募穴（胃募）', '八会穴（腑会）'], wuxing: '' },
  { code: 'CV5', name: '石门', meridian: '任脉', categories: ['募穴（三焦募）'], wuxing: '' },
  { code: 'CV4', name: '关元', meridian: '任脉', categories: ['募穴（小肠募）'], wuxing: '' },
  { code: 'CV3', name: '中极', meridian: '任脉', categories: ['募穴（膀胱募）'], wuxing: '' },
  
  // 督脉
  { code: 'GV1', name: '长强', meridian: '督脉', categories: ['络穴（督脉络穴）'], wuxing: '' },
  
  // 奇经八脉
  { code: 'KI9', name: '筑宾', meridian: '阴维脉', categories: ['郄穴'], wuxing: '' },
  { code: 'GB35', name: '阳交', meridian: '阳维脉', categories: ['郄穴'], wuxing: '' },
  { code: 'KI8', name: '交信', meridian: '阴跷脉', categories: ['郄穴'], wuxing: '' },
  { code: 'BL59', name: '跗阳', meridian: '阳跷脉', categories: ['郄穴'], wuxing: '' }
]

/**
 * 获取特定穴完整信息
 * @param {string} code - 穴位代码
 * @returns {Object|null} 穴位完整信息
 */
export function getSpecialPointByCode(code) {
  return SPECIAL_POINTS.find(point => point.code === code) || null
}

/**
 * 获取所有特定穴
 * @returns {Array} 所有特定穴
 */
export function getAllSpecialPoints() {
  return SPECIAL_POINTS
}

/**
 * 按类别筛选特定穴
 * @param {string} category - 类别（如 '井穴', '原穴', '络穴'）
 * @returns {Array} 筛选结果
 */
export function getSpecialPointsByCategory(category) {
  return SPECIAL_POINTS.filter(point =>
    point.categories.some(cat => cat.includes(category))
  )
}

/**
 * 搜索特定穴
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
export function searchSpecialPoints(keyword) {
  if (!keyword) return []
  
  return SPECIAL_POINTS.filter(point =>
    point.name.includes(keyword) ||
    point.code.toLowerCase().includes(keyword.toLowerCase()) ||
    point.meridian.includes(keyword) ||
    point.categories.some(cat => cat.includes(keyword))
  )
}
