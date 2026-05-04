/**
 * 五行颜色映射
 */
const WUXING_COLORS = {
  '木': '#2E7D32',  // 青绿
  '火': '#D32F2F',  // 朱红
  '土': '#F57C00',  // 琥珀
  '金': '#B8860B',  // 暗金
  '水': '#1565C0'   // 藏青
}

const WUXING_BG = {
  '木': 'rgba(46,125,50,0.08)',
  '火': 'rgba(211,47,47,0.08)',
  '土': 'rgba(245,124,0,0.08)',
  '金': 'rgba(184,134,11,0.1)',
  '水': 'rgba(21,101,192,0.08)'
}

const DEFAULT_COLOR = '#4b5563'
const DEFAULT_BG = '#f3f4f6'

/**
 * 获取五行文字颜色
 */
export function getWuxingColor(wuxing) {
  return WUXING_COLORS[wuxing] || DEFAULT_COLOR
}

/**
 * 获取五行完整样式（文字色 + 背景色）
 */
export function getWuxingStyle(wuxing) {
  return {
    color: WUXING_COLORS[wuxing] || DEFAULT_COLOR,
    bg: WUXING_BG[wuxing] || DEFAULT_BG
  }
}
