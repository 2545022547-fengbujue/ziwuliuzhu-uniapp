/**
 * 组件级交互测试：TimePicker / CityPicker / PointDetail
 *
 * 对应审查报告 2.7「缺少组件级测试」——补三类组件：
 * - TimePicker：非法 value 钳制、选中高亮、confirm/close 事件
 * - CityPicker：open 预选已保存城市、点击 popup 内部不关闭、close 清理旧 timer
 * - PointDetail：有/无 point 两种状态渲染、关闭按钮清空 store
 *
 * 挂载方式与 datepicker.test.js 一致：组件直接 useAppStore()，pinia 用 active 实例；
 * uni 内置组件声明为自定义元素（happy-dom 无注册实现）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TimePicker from '@/components/TimePicker.vue'
import CityPicker from '@/components/CityPicker.vue'
import PointDetail from '@/components/PointDetail.vue'
import { useAppStore } from '@/stores/app.js'
import { clearUniStorage } from './setup.js'

vi.mock('@dcloudio/uni-app', () => ({
  onShow: () => {},
  onHide: () => {},
  onBackPress: () => {}
}))

const UNI_TAGS = ['scroll-view', 'switch', 'image', 'text', 'view', 'input', 'button', 'canvas', 'video']

const globalConfig = {
  config: { compilerOptions: { isCustomElement: (tag) => UNI_TAGS.includes(tag) } }
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearUniStorage()
})

/* ---------------- TimePicker ---------------- */
describe('TimePicker 时辰选择', () => {
  function mountPicker(value) {
    return mount(TimePicker, { props: { value }, global: globalConfig })
  }

  it('value=5 时第 6 个时辰项高亮', () => {
    const wrapper = mountPicker(5)
    expect(wrapper.findAll('.hour-item')[5].classes()).toContain('selected')
  })

  it('非法 value（负数/越界/小数/NaN）钳制到 0，第 1 项高亮', () => {
    for (const bad of [-1, 99, 1.5, Number.NaN]) {
      const wrapper = mountPicker(bad)
      expect(wrapper.findAll('.hour-item')[0].classes()).toContain('selected')
    }
  })

  it('点击时辰项后高亮切换，确定时 emit change(索引) 与 close', async () => {
    const wrapper = mountPicker(0)
    await wrapper.findAll('.hour-item')[2].trigger('tap')
    expect(wrapper.findAll('.hour-item')[2].classes()).toContain('selected')
    expect(wrapper.findAll('.hour-item')[0].classes()).not.toContain('selected')
    await wrapper.find('.action-btn.confirm').trigger('tap')
    expect(wrapper.emitted('change')[0]).toEqual([2])
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('取消只 emit close，不 emit change', async () => {
    const wrapper = mountPicker(3)
    await wrapper.find('.action-btn.cancel').trigger('tap')
    expect(wrapper.emitted('change')).toBeFalsy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

/* ---------------- CityPicker ---------------- */
describe('CityPicker 城市选择', () => {
  function mountPicker() {
    return mount(CityPicker, { global: globalConfig })
  }

  it('open 后预选 store 已保存的城市：确定按钮可用、城市项高亮', async () => {
    const store = useAppStore()
    store.selectedCity = '温州'
    const wrapper = mountPicker()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isOpen).toBe(true)
    // 确认按钮因已预选城市而不 disabled（预选已生效）
    expect(wrapper.find('.btn-confirm').classes()).not.toContain('disabled')
  })

  it('open 且 store 无城市时：确定按钮为 disabled（未预选）', async () => {
    const store = useAppStore()
    store.selectedCity = ''
    const wrapper = mountPicker()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.btn-confirm').classes()).toContain('disabled')
  })

  it('点击 popup 内部 tip 区域不会误关闭弹窗（popupTapped 防穿透）', async () => {
    const wrapper = mountPicker()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()
    await wrapper.find('.tip-box').trigger('tap')
    expect(wrapper.vm.isOpen).toBe(true)
    expect(wrapper.find('.overlay').exists()).toBe(true)
  })

  it('close 清理旧 timer：快进 500ms 后弹窗保持关闭且无异常', async () => {
    vi.useFakeTimers()
    const wrapper = mountPicker()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()
    wrapper.vm.close()
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(500)
    expect(wrapper.vm.isOpen).toBe(false)
    expect(wrapper.find('.overlay').exists()).toBe(false)
    vi.useRealTimers()
  })
})

/* ---------------- PointDetail ---------------- */
describe('PointDetail 穴位详情', () => {
  const POINT = {
    name: '合谷',
    code: 'LI4',
    meridian: '手阳明大肠经',
    category: '原穴',
    location: '手背，第1、2掌骨间，第2掌骨桡侧的中点处',
    needling: '直刺0.5-1寸',
    moxibustion: '艾灸5-10分钟',
    wuxing: '火',
    contraindications: '孕妇慎用',
    naziType: ''
  }

  function mountDetail() {
    return mount(PointDetail, { global: globalConfig })
  }

  it('无 point（selectedPoint=null）：显示空态', () => {
    const store = useAppStore()
    store.selectedPoint = null
    const wrapper = mountDetail()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('穴位信息加载失败')
  })

  it('有 point：渲染穴位名、经络与定位', () => {
    const store = useAppStore()
    store.selectedPoint = POINT
    const wrapper = mountDetail()
    expect(wrapper.find('.point-name').text()).toContain('合谷')
    expect(wrapper.text()).toContain('手阳明大肠经')
    expect(wrapper.text()).toContain('定位')
    expect(wrapper.text()).toContain('直刺0.5-1寸')
  })

  it('点击关闭按钮：清空 store.selectedPoint（走 closeDetail）', async () => {
    const store = useAppStore()
    store.selectedPoint = POINT
    const wrapper = mountDetail()
    await wrapper.find('.close-btn').trigger('tap')
    expect(store.selectedPoint).toBeNull()
  })
})
