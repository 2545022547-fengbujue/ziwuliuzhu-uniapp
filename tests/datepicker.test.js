/**
 * DatePicker 组件交互测试
 *
 * 覆盖本轮修复的两个真实问题：
 * 1. 跨月选中高亮错位：选中 5/24 后切到 6 月，6/24 不应被错误高亮（修复前只比较日号）
 * 2. parseDate 非法输入防御：value="abc" 等脏数据回退今天，不产生 NaN 日历
 *
 * 挂载方式：DatePicker 直接 useAppStore()，无需 provide；pinia 用 active 实例。
 * uni 内置组件声明为自定义元素（happy-dom 无注册实现）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DatePicker from '@/components/DatePicker.vue'
import { clearUniStorage } from './setup.js'

// DatePicker 不直接用生命周期钩子，但 store 模块顶层有持久化副作用，mock uni-app 生命周期以防万一
vi.mock('@dcloudio/uni-app', () => ({
  onShow: () => {},
  onHide: () => {},
  onBackPress: () => {}
}))

const UNI_TAGS = ['scroll-view', 'switch', 'image', 'text', 'view', 'input', 'button', 'canvas', 'video']

function mountPicker(value) {
  return mount(DatePicker, {
    props: { value },
    global: {
      config: {
        compilerOptions: { isCustomElement: (tag) => UNI_TAGS.includes(tag) }
      }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearUniStorage()
})

describe('DatePicker 日历正确性', () => {
  it('2026-05-24 初始渲染：5 月 24 日高亮选中', () => {
    const wrapper = mountPicker('2026-05-24')
    // 2026-05-01 是周五(getDay=5) → startOffset=(5-1+7)%7=4 → 5/24 的格子 index = 4 + 24 - 1 = 27
    const dayItems = wrapper.findAll('.day-item')
    expect(dayItems[27].classes()).toContain('selected')
    // 相邻日期不高亮
    expect(dayItems[26].classes()).not.toContain('selected')
    expect(dayItems[28].classes()).not.toContain('selected')
  })

  it('切到 6 月后，6/24 不应被错误高亮（跨月高亮修复）', async () => {
    const wrapper = mountPicker('2026-05-24')
    // 点击月份「下一月」
    await wrapper.find('.month-arrow.next').trigger('tap')
    // 6 月：6/1 是周一(getDay=1) → offset=0 → 6/24 的格子 index = 24 - 1 = 23
    const dayItems = wrapper.findAll('.day-item')
    expect(dayItems[23].text()).toBe('24')
    expect(dayItems[23].classes()).not.toContain('selected')
  })

  it('在 6 月点击 6/15 → 高亮该日，点确定输出 2026-06-15', async () => {
    const wrapper = mountPicker('2026-05-24')
    await wrapper.find('.month-arrow.next').trigger('tap')
    // 6/15 的格子 index = 15 - 1 = 14（6 月 offset=0）
    const dayItems = wrapper.findAll('.day-item')
    await dayItems[14].trigger('tap')
    expect(dayItems[14].classes()).toContain('selected')
    await wrapper.find('.action-btn.confirm').trigger('tap')
    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['2026-06-15'])
  })

  it('跨年：12 月点「下一月」进入次年 1 月，标题年份 +1', async () => {
    const wrapper = mountPicker('2026-12-15')
    await wrapper.find('.month-arrow.next').trigger('tap')
    expect(wrapper.find('.year-text').text()).toBe('2027年')
    expect(wrapper.find('.month-text').text()).toContain('1月')
    // 1 月 15 日仍应可选中并正确输出 2027-01-15
    const dayItems = wrapper.findAll('.day-item')
    // 2027-01-01 是周五(getDay=5) → offset=4 → 1/15 index = 4 + 15 - 1 = 18
    await dayItems[18].trigger('tap')
    await wrapper.find('.action-btn.confirm').trigger('tap')
    expect(wrapper.emitted('change')[0]).toEqual(['2027-01-15'])
  })

  it('非法 value 防御：不崩溃且正常渲染当月日历', () => {
    const wrapper = mountPicker('abc')
    expect(wrapper.find('.month-text').exists()).toBe(true)
    expect(wrapper.findAll('.day-item').length).toBeGreaterThanOrEqual(28)
  })
})
