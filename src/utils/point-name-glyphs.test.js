import { describe, it, expect } from 'vitest'
import { nameGapStyle } from './point-name-glyphs.js'

describe('point-name-glyphs 主题字形微调规则', () => {
  it('ink 主题：「陵→泉」字对命中收紧规则', () => {
    expect(nameGapStyle('ink', '陵', '泉')).toBe('margin-left:-10rpx')
  })

  it('ink 主题：非「陵泉」组合不命中', () => {
    expect(nameGapStyle('ink', '太', '溪')).toBe('')
    expect(nameGapStyle('ink', '泉', '陵')).toBe('')
  })

  it('ink 主题：首字符无前字，不命中', () => {
    expect(nameGapStyle('ink', undefined, '泉')).toBe('')
  })

  it('classic 主题无规则表，恒返回空串', () => {
    expect(nameGapStyle('classic', '陵', '泉')).toBe('')
  })

  it('未知风格安全返回空串', () => {
    expect(nameGapStyle('not-a-style', '陵', '泉')).toBe('')
  })
})
