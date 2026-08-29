/**
 * point-name-glyphs - 穴位名逐字排版微调规则（主题专属字形表）
 *
 * ============================================================
 * 设计说明（给后来者/AI）
 * ============================================================
 * 背景：水墨主题下「陵泉」二字连排时因字体基线观感偏松，需要对该字对
 * 额外负 margin 收紧。此前这段规则以 `activeUiStyle === 'ink'` 的形式
 * 内联在共享组件 PointDetail 里——共享组件本不该认识具体主题的字形癖好。
 *
 * 本文件把「主题 → 逐字间距规则」收敛为一张配置表：
 *   - PointDetail 只负责按字遍历并派发（不判断主题）；
 *   - 新增某主题的字形微调，只在 NAME_GLYPH_RULES 加一条规则，
 *     共享组件零改动。
 *
 * 规则字段：
 *   prev / cur — 相邻两字才命中（prev 为前一字，cur 为当前字）
 *   style      — 命中时应用到当前字的内联样式字符串
 * ============================================================
 */
const NAME_GLYPH_RULES = {
  ink: [
    { prev: '陵', cur: '泉', style: 'margin-left:-10rpx' }
  ]
}

/**
 * 求穴位名第 i 个字符的主题字形微调样式。
 *
 * @param {string} uiStyle  当前外观风格 id（classic/modern/ink/...）
 * @param {string} prevChar 前一个字符（首字符传 undefined）
 * @param {string} ch       当前字符
 * @returns {string} 内联样式字符串；无命中规则时为空串
 */
export function nameGapStyle(uiStyle, prevChar, ch) {
  const rules = NAME_GLYPH_RULES[uiStyle]
  if (!rules || prevChar == null) return ''
  for (const rule of rules) {
    if (prevChar === rule.prev && ch === rule.cur) return rule.style
  }
  return ''
}
