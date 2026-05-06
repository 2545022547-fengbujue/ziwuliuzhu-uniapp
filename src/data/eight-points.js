/**
 * 八脉八穴共享数据
 *
 * 灵龟八法、飞腾八法、穴位数据服务三者共用，消除重复定义。
 * 数据来源：教材八法逐日干支代数、飞腾八法歌诀
 *
 * 八脉交会穴（八穴）——灵龟八法（表10-14）：
 *   公孙(冲脉) ↔ 申脉(阳跷脉)   — 乾6/坎1
 *   内关(阴维脉) ↔ 外关(阳维脉) — 艮8/震3
 *   临泣(带脉) ↔ 列缺(任脉)     — 巽4/离9
 *   照海(阴跷脉) ↔ 后溪(督脉)   — 坤2/兑7
 *
 * 飞腾八法的天干→卦象映射与灵龟八法不同，由 feiteng.js 的 STEM_GUA_MAP 单独维护。
 */

/**
 * 八脉八穴基础数据
 * 包含穴位编码、所属经络、通奇经八脉、卦象、九宫数、配穴
 */
export const EIGHT_POINTS = [
  {
    code: 'SP4', name: '公孙',
    meridian: '足太阴脾经',
    connectedMeridian: '冲脉',
    gua: '乾', palace: 6,
    pairedPoint: '内关', pairedCode: 'PC6'
  },
  {
    code: 'PC6', name: '内关',
    meridian: '手厥阴心包经',
    connectedMeridian: '阴维脉',
    gua: '艮', palace: 8,
    pairedPoint: '公孙', pairedCode: 'SP4'
  },
  {
    code: 'SI3', name: '后溪',
    meridian: '手太阳小肠经',
    connectedMeridian: '督脉',
    gua: '兑', palace: 7,
    pairedPoint: '申脉', pairedCode: 'BL62'
  },
  {
    code: 'BL62', name: '申脉',
    meridian: '足太阳膀胱经',
    connectedMeridian: '阳跷脉',
    gua: '坎', palace: 1,
    pairedPoint: '后溪', pairedCode: 'SI3'
  },
  {
    code: 'GB41', name: '足临泣',
    meridian: '足少阳胆经',
    connectedMeridian: '带脉',
    gua: '巽', palace: 4,
    pairedPoint: '外关', pairedCode: 'TE5'
  },
  {
    code: 'TE5', name: '外关',
    meridian: '手少阳三焦经',
    connectedMeridian: '阳维脉',
    gua: '震', palace: 3,
    pairedPoint: '足临泣', pairedCode: 'GB41'
  },
  {
    code: 'LU7', name: '列缺',
    meridian: '手太阴肺经',
    connectedMeridian: '任脉',
    gua: '离', palace: 9,
    pairedPoint: '照海', pairedCode: 'KI6'
  },
  {
    code: 'KI6', name: '照海',
    meridian: '足少阴肾经',
    connectedMeridian: '阴跷脉',
    gua: '坤', palace: 2,
    pairedPoint: '列缺', pairedCode: 'LU7'
  }
]

/**
 * 按穴位代码索引（穴位数据服务用）
 */
export const EIGHT_POINTS_MAP = Object.fromEntries(
  EIGHT_POINTS.map(p => [p.code, p])
)

/**
 * 天干→穴位代码映射（飞腾八法用）
 *
 * 歌诀：壬甲公孙即是乾，丙居艮上内关然，戊为临泣生坎水，庚属外关震相连，
 *       辛上后溪装巽卦，乙癸申脉到坤传，己土列缺南离上，丁居照海兑金全。
 *
 * 注：飞腾八法用先天八卦，灵龟八法用后天八卦，同一穴位在两系统中卦象不同。
 * EIGHT_POINTS 的 gua/palace 字段为灵龟八法值（表10-14），
 * 飞腾八法的天干→卦象映射由 feiteng.js 的 STEM_GUA_MAP 单独维护。
 */
export const STEM_POINT_MAP = {
  '壬': 'SP4', '甲': 'SP4',   // 公孙 → 乾
  '丙': 'PC6',                // 内关 → 艮
  '戊': 'GB41',               // 足临泣 → 坎
  '庚': 'TE5',                // 外关 → 震
  '辛': 'SI3',                // 后溪 → 巽
  '乙': 'BL62', '癸': 'BL62', // 申脉 → 坤
  '己': 'LU7',                // 列缺 → 离
  '丁': 'KI6'                 // 照海 → 兑
}
