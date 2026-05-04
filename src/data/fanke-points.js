/**
 * 反克法取穴表（教材表10-12）
 * 一、四、二、五、三、〇反克取穴
 * 
 * 正确理解：
 * - 六X = 天干为X的六个时辰（如六甲=甲戌、甲子、甲寅、甲辰、甲午、甲申）
 * - 但每个时辰对应不同的日干
 * - 查表方式：日干+时辰干支 → 穴位
 */

/**
 * 反克法完整映射表
 * 格式：{ '日干+时辰干支': { code, name, wuxing, type } }
 */
export const FANKE_TABLE = {
  // 六甲（甲开头的六个时辰）
  '甲+甲戌': { code: 'GB44', name: '窍阴', wuxing: '金', type: '井穴' },
  '己+甲子': { code: 'GB38', name: '阳辅', wuxing: '火', type: '经穴' },
  '戊+甲寅': { code: 'GB43', name: '侠溪', wuxing: '水', type: '荥穴' },
  '丁+甲辰': { code: 'GB34', name: '阳陵泉', wuxing: '土', type: '合穴' },
  '丙+甲午': { code: 'GB41', name: '足临泣', wuxing: '木', type: '输穴' },
  '乙+甲申': { code: 'TE2', name: '液门', wuxing: '水', type: '气纳三焦' },
  
  // 六乙（乙开头的六个时辰）
  '乙+乙酉': { code: 'LR1', name: '大敦', wuxing: '木', type: '井穴' },
  '己+乙亥': { code: 'LR4', name: '中封', wuxing: '金', type: '经穴' },
  '己+乙丑': { code: 'LR2', name: '行间', wuxing: '火', type: '荥穴' },
  '戊+乙卯': { code: 'LR8', name: '曲泉', wuxing: '水', type: '合穴' },
  '丁+乙巳': { code: 'LR3', name: '太冲', wuxing: '土', type: '输穴' },
  '丙+乙未': { code: 'PC8', name: '劳宫', wuxing: '火', type: '血归包络' },
  
  // 六丙（丙开头的六个时辰）
  '丙+丙申': { code: 'SI1', name: '少泽', wuxing: '金', type: '井穴' },
  '庚+丙戌': { code: 'SI5', name: '阳谷', wuxing: '火', type: '经穴' },
  '庚+丙子': { code: 'SI2', name: '前谷', wuxing: '水', type: '荥穴' },
  '己+丙寅': { code: 'SI8', name: '小海', wuxing: '土', type: '合穴' },
  '戊+丙辰': { code: 'SI3', name: '后溪', wuxing: '木', type: '输穴' },
  '丁+丙午': { code: 'TE3', name: '中渚', wuxing: '木', type: '气纳三焦' },
  
  // 六丁（丁开头的六个时辰）
  '丁+丁未': { code: 'HT9', name: '少冲', wuxing: '木', type: '井穴' },
  '辛+丁酉': { code: 'HT4', name: '灵道', wuxing: '金', type: '经穴' },
  '庚+丁亥': { code: 'HT8', name: '少府', wuxing: '火', type: '荥穴' },
  '庚+丁丑': { code: 'HT3', name: '少海', wuxing: '水', type: '合穴' },
  '己+丁卯': { code: 'HT7', name: '神门', wuxing: '土', type: '输穴' },
  '戊+丁巳': { code: 'PC7', name: '大陵', wuxing: '土', type: '血归包络' },
  
  // 六戊（戊开头的六个时辰）
  '戊+戊午': { code: 'ST45', name: '厉兑', wuxing: '金', type: '井穴' },
  '壬+戊申': { code: 'ST41', name: '解溪', wuxing: '火', type: '经穴' },
  '辛+戊戌': { code: 'ST44', name: '内庭', wuxing: '水', type: '荥穴' },
  '辛+戊子': { code: 'ST36', name: '足三里', wuxing: '土', type: '合穴' },
  '庚+戊寅': { code: 'ST43', name: '陷谷', wuxing: '木', type: '输穴' },
  '己+戊辰': { code: 'TE6', name: '支沟', wuxing: '火', type: '气纳三焦' },
  
  // 六己（己开头的六个时辰）
  '己+己巳': { code: 'SP1', name: '隐白', wuxing: '木', type: '井穴' },
  '癸+己未': { code: 'SP5', name: '商丘', wuxing: '金', type: '经穴' },
  '壬+己酉': { code: 'SP2', name: '大都', wuxing: '火', type: '荥穴' },
  '辛+己亥': { code: 'SP9', name: '阴陵泉', wuxing: '水', type: '合穴' },
  '辛+己丑': { code: 'SP3', name: '太白', wuxing: '土', type: '输穴' },
  '庚+己卯': { code: 'PC5', name: '间使', wuxing: '金', type: '血归包络' },
  
  // 六庚（庚开头的六个时辰）
  '庚+庚辰': { code: 'LI1', name: '商阳', wuxing: '金', type: '井穴' },
  '甲+庚午': { code: 'LI5', name: '阳溪', wuxing: '火', type: '经穴' },
  '癸+庚申': { code: 'LI2', name: '二间', wuxing: '水', type: '荥穴' },
  '壬+庚戌': { code: 'LI11', name: '曲池', wuxing: '土', type: '合穴' },
  '壬+庚子': { code: 'LI3', name: '三间', wuxing: '木', type: '输穴' },
  '辛+庚寅': { code: 'TE10', name: '天井', wuxing: '土', type: '气纳三焦' },
  
  // 六辛（辛开头的六个时辰）
  '辛+辛卯': { code: 'LU11', name: '少商', wuxing: '木', type: '井穴' },
  '乙+辛巳': { code: 'LU8', name: '经渠', wuxing: '金', type: '经穴' },
  '甲+辛未': { code: 'LU10', name: '鱼际', wuxing: '火', type: '荥穴' },
  '癸+辛酉': { code: 'LU5', name: '尺泽', wuxing: '水', type: '合穴' },
  '壬+辛亥': { code: 'LU9', name: '太渊', wuxing: '土', type: '输穴' },
  '壬+辛丑': { code: 'PC3', name: '曲泽', wuxing: '水', type: '血归包络' },
  
  // 六壬（壬开头的六个时辰）
  '壬+壬寅': { code: 'BL67', name: '至阴', wuxing: '金', type: '井穴' },
  '丙+壬辰': { code: 'BL60', name: '昆仑', wuxing: '火', type: '经穴' },
  '己+壬午': { code: 'BL66', name: '通谷', wuxing: '水', type: '荥穴' },
  '甲+壬申': { code: 'BL40', name: '委中', wuxing: '土', type: '合穴' },
  '癸+壬戌': { code: 'BL65', name: '束骨', wuxing: '木', type: '输穴' },
  '癸+壬子': { code: 'TE1', name: '关冲', wuxing: '金', type: '气纳三焦' },
  
  // 六癸（癸开头的六个时辰）
  '癸+癸亥': { code: 'KI1', name: '涌泉', wuxing: '木', type: '井穴' },
  '戊+癸丑': { code: 'KI7', name: '复溜', wuxing: '金', type: '经穴' },
  '丁+癸卯': { code: 'KI2', name: '然谷', wuxing: '火', type: '荥穴' },
  '丙+癸巳': { code: 'KI10', name: '阴谷', wuxing: '水', type: '合穴' },
  '乙+癸未': { code: 'KI3', name: '太溪', wuxing: '土', type: '输穴' },
  '甲+癸酉': { code: 'PC9', name: '中冲', wuxing: '木', type: '血归包络' }
}

/**
 * 获取反克法穴位
 * @param {string} dayStem - 日天干
 * @param {string} hourGanZhi - 时辰干支
 * @returns {Object|null} 穴位信息
 */
export function getFankePoint(dayStem, hourGanZhi) {
  const key = `${dayStem}+${hourGanZhi}`
  return FANKE_TABLE[key] || null
}
