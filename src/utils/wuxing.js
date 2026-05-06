/**
 * 五行工具模块
 *
 * 提供五行元素的颜色映射，用于 UI 展示（穴位卡片五行标签、ResultPanel 等）
 * 颜色设计遵循中医传统五行配色：木青、火赤、土黄、金白、水黑
 */

// 五行文字颜色（中医传统配色的现代化表达）
const WUXING_COLORS = {
  '木': '#2E7D32',  // 青绿
  '火': '#D32F2F',  // 朱红
  '土': '#F57C00',  // 琥珀
  '金': '#B8860B',  // 暗金
  '水': '#1565C0'   // 藏青
}

// 五行背景色（低透明度，用于标签背景）
const WUXING_BG = {
  '木': 'rgba(46,125,50,0.08)',
  '火': 'rgba(211,47,47,0.08)',
  '土': 'rgba(245,124,0,0.08)',
  '金': 'rgba(184,134,11,0.1)',
  '水': 'rgba(21,101,192,0.08)'
}

const DEFAULT_COLOR = '#4b5563'  // 无五行属性时的默认文字色
const DEFAULT_BG = '#f3f4f6'     // 无五行属性时的默认背景色

/**
 * 获取五行文字颜色
 * @param {string} wuxing - 五行属性（'木'/'火'/'土'/'金'/'水'）
 * @returns {string} CSS 颜色值
 */
export function getWuxingColor(wuxing) {
  return WUXING_COLORS[wuxing] || DEFAULT_COLOR
}

/**
 * 获取五行完整样式（文字色 + 背景色）
 * @param {string} wuxing - 五行属性
 * @returns {Object} { color: string, bg: string }
 */
export function getWuxingStyle(wuxing) {
  return {
    color: WUXING_COLORS[wuxing] || DEFAULT_COLOR,
    bg: WUXING_BG[wuxing] || DEFAULT_BG
  }
}
