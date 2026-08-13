/**
 * 飞腾八法算法模块
 *
 * 【理论基础】
 * 飞腾八法与灵龟八法同属"八法"时间针灸学，但算法原理不同：
 *
 * | 对比项 | 飞腾八法 | 灵龟八法 |
 * |--------|----------|----------|
 * | 八卦系统 | 先天八卦（伏羲八卦） | 后天八卦（文王八卦） |
 * | 开穴依据 | 时天干 | 日时干支代数和 |
 * | 算法特点 | 简便，按时天干直接取穴 | 复杂，需计算代数 |
 *
 * 【先天八卦纳甲歌诀】
 * 【先天八卦纳甲歌诀】（《针灸大全》飞腾八法歌，本项目采用此版本，见下方 STEM_GUA_MAP）
 * 壬甲公孙即是乾，丙居艮上内关然，戊为临泣生坎水，庚属外关震相连，
 * 辛上后溪装巽卦，乙癸申脉到坤传，己土列缺南离上，丁居照海兑金全。
 *
 * 注意：另一传本作「甲坤丙艮戊坎庚震壬离兑丁巽己乾」（乾/坤/离/兑 位置互换），
 * 两传本对同一时干的卦象归属不同（如甲：乾 vs 坤）。本项目以《针灸大全》为准
 * （壬甲→乾、己→离、丁→兑），已联网核对多来源一致，并以教材/论文级测试固化。
 * 修改本映射前务必核对歌诀原文，勿以记忆为准。
 *
 * （时天干对应八卦宫位，宫位对应八脉交会穴）
 *
 * 【配穴规则】
 * - 主穴：按时天干取穴（如甲时→公孙）
 * - 配穴：主穴的固定配对穴（公孙↔内关、足临泣↔外关、后溪↔申脉、列缺↔照海）
 *
 * 【数据来源】
 * 八卦宫位配穴见 data/eight-points.js（先天八卦部分）
 * 与灵龟八法共用八脉交会穴数据，但取穴逻辑不同
 *
 * @module services/feiteng
 * @see data/eight-points.js - 八穴配对关系
 * @see services/lingui.js - 灵龟八法（后天八卦）
 */
import { getEightPointFull } from './acupuncturePoints.js'
import { HOUR_NAMES } from '@/data/constants.js'
import { STEM_POINT_MAP } from '@/data/eight-points.js'

/**
 * 天干→八卦映射（飞腾八法·先天八卦纳甲）
 *
 * 飞腾八法用先天八卦（伏羲八卦），与灵龟八法的后天八卦不同。
 * 同一个穴位在两个系统中对应不同的卦象，因此不能从 eight-points.js 的 gua/palace 派生。
 *
 * 歌诀：壬甲公孙即是乾，丙居艮上内关然，戊为临泣生坎水，庚属外关震相连，
 *       辛上后溪装巽卦，乙癸申脉到坤传，己土列缺南离上，丁居照海兑金全。
 */
const STEM_GUA_MAP = {
  '壬': { gua: '乾', number: 6 }, '甲': { gua: '乾', number: 6 },
  '丙': { gua: '艮', number: 8 },
  '戊': { gua: '坎', number: 1 },
  '庚': { gua: '震', number: 3 },
  '辛': { gua: '巽', number: 4 },
  '乙': { gua: '坤', number: 2 }, '癸': { gua: '坤', number: 2 },
  '己': { gua: '离', number: 9 },
  '丁': { gua: '兑', number: 7 }
}

/**
 * 飞腾八法计算
 * @param {Object} ganzhi - 干支信息
 * @param {number} hourIndex - 时辰索引 (0-11)
 * @returns {Object} 取穴结果
 */
export function calculateFeiteng(ganzhi, hourIndex) {
  if (hourIndex < 0 || hourIndex > 11) {
    console.warn(`飞腾八法：无效的时辰索引 ${hourIndex}`)
    return { method: 'feiteng', methodName: '飞腾八法', openPoints: [] }
  }
  if (!ganzhi?.day?.heavenlyStem || !ganzhi?.hour?.heavenlyStem) {
    console.warn('飞腾八法：干支信息不完整')
    return { method: 'feiteng', methodName: '飞腾八法', openPoints: [] }
  }

  const dayStem = ganzhi.day.heavenlyStem
  const hourStem = ganzhi.hour.heavenlyStem
  
  // 飞腾八法：时天干定主穴；配穴来自主穴的固定配对关系
  const dayGuaData = STEM_GUA_MAP[dayStem]
  const hourGuaData = STEM_GUA_MAP[hourStem]

  let openPoints = []

  // 时天干 → 主穴
  const hourCode = STEM_POINT_MAP[hourStem]
  if (hourCode) {
    const hourPoint = getEightPointFull(hourCode)
    if (hourPoint) {
      openPoints.push({
        ...hourPoint,
        isOpen: true,
        isPair: false,
        basis: '时天干（主穴）',
        gua: hourGuaData?.gua,
        number: hourGuaData?.number
      })

      // 配穴 = 主穴的配对穴（固定配对关系：公孙↔内关、足临泣↔外关、后溪↔申脉、列缺↔照海）
      const pairedCode = hourPoint.pairedCode
      if (pairedCode) {
        const pairedPoint = getEightPointFull(pairedCode)
        if (pairedPoint) {
          openPoints.push({
            ...pairedPoint,
            isOpen: true,
            isPair: true,
            basis: '主穴配对'
          })
        }
      }
    }
  }
  
  return {
    method: 'feiteng',
    methodName: '飞腾八法',
    date: `${ganzhi.year.ganZhi}年 ${ganzhi.month.ganZhi}月 ${ganzhi.day.ganZhi}日`,
    hourIndex,
    hourName: HOUR_NAMES[hourIndex],
    hourGanZhi: ganzhi.hour.ganZhi,
    dayStem,
    hourStem,
    dayGua: dayGuaData,
    hourGua: hourGuaData,
    openPoints
  }
}
