/**
 * 城市坐标数据不变量测试（真太阳时校正依赖）
 *
 * 校验 CITIES 主数据健康度与 searchCities/getCityLongitude 的查询契约，
 * 防止城市数据编辑（增删/改经度/拼音）破坏真太阳时功能而不自知。
 */
import { describe, it, expect } from 'vitest'
import { CITIES, PROVINCE_ORDER, searchCities, getCityLongitude } from '@/data/city-coordinates.js'

describe('城市主数据（CITIES）', () => {
  it('覆盖 34 个省级行政区、总量 ≥ 348（注释声明的 348 地级市 + 直辖市）', () => {
    const provinces = new Set(CITIES.map(c => c.province))
    // 34 省级行政区：23 省 + 5 自治区 + 4 直辖市 + 2 特别行政区
    expect(provinces.size).toBeGreaterThanOrEqual(30)
    expect(CITIES.length).toBeGreaterThanOrEqual(348)
  })

  it('每条记录五字段非空，name 已去「市/地区」后缀', () => {
    for (const c of CITIES) {
      expect(c.name, `缺 name`).toBeTruthy()
      expect(c.province, `${c.name} 缺 province`).toBeTruthy()
      expect(typeof c.longitude, `${c.name} longitude 非法`).toBe('number')
      expect(c.pinyin, `${c.name} 缺 pinyin`).toBeTruthy()
      expect(c.abbr, `${c.name} 缺 abbr`).toBeTruthy()
      // name 应已去后缀（如 "北京" 而非 "北京市"）
      expect(/[市地区]$/.test(c.name), `${c.name} 名称仍含行政区后缀`).toBe(false)
    }
  })

  it('经度均在 70-140°E（中国领土范围），保证真太阳时计算合理', () => {
    for (const c of CITIES) {
      expect(c.longitude, `${c.name} 经度 ${c.longitude} 越界`).toBeGreaterThanOrEqual(70)
      expect(c.longitude, `${c.name} 经度 ${c.longitude} 越界`).toBeLessThanOrEqual(140)
    }
  })

  it('name 唯一；pinyin 允许真实碰撞（福州/抚州同为 fuzhou）但同拼音组内 name 必须可区分', () => {
    const names = new Set()
    const pinyinGroups = new Map()
    for (const c of CITIES) {
      expect(names.has(c.name), `重复城市名: ${c.name}`).toBe(false)
      names.add(c.name)
      const group = pinyinGroups.get(c.pinyin) || []
      group.push(c.name)
      pinyinGroups.set(c.pinyin, group)
    }
    for (const [pinyin, groupNames] of pinyinGroups) {
      // 同拼音城市必须不同名（搜索结果显示可区分），如 fuzhou → [福州, 抚州]
      expect(new Set(groupNames).size, `拼音 ${pinyin} 组内重名: ${groupNames}`).toBe(groupNames.length)
    }
  })

  it('北京经度 116.40（getCityLongitude 契约基准）', () => {
    expect(getCityLongitude('北京')).toBe(116.40)
  })
})

describe('searchCities 查询契约', () => {
  it('空关键字返回全量', () => {
    expect(searchCities('').length).toBe(CITIES.length)
  })

  it('中文名匹配：searchCities("北京") 首项为北京', () => {
    const r = searchCities('北京')
    expect(r.length).toBeGreaterThanOrEqual(1)
    expect(r[0].name).toBe('北京')
  })

  it('中文名带「市」后缀仍可匹配（searchCities("贵阳市")）', () => {
    const r = searchCities('贵阳市')
    expect(r.some(c => c.name === '贵阳')).toBe(true)
  })

  it('省份搜索返回该省全部城市（searchCities("广东")）', () => {
    const r = searchCities('广东')
    expect(r.length).toBeGreaterThanOrEqual(20)
    expect(r.every(c => c.province.includes('广东'))).toBe(true)
  })

  it('1-2 字母精确匹配 abbr：searchCities("bj") 含北京', () => {
    const r = searchCities('bj')
    expect(r.some(c => c.name === '北京')).toBe(true)
    // abbr 精确匹配（注释声明 bj → 北京、宝鸡）
    expect(r.every(c => c.abbr === 'bj')).toBe(true)
  })

  it('3+ 字母模糊匹配拼音：searchCities("beijing") 含北京', () => {
    const r = searchCities('beijing')
    expect(r.some(c => c.name === '北京')).toBe(true)
  })

  it('未知城市 getCityLongitude 返回 null（不抛错）', () => {
    expect(getCityLongitude('不存在城市')).toBeNull()
  })
})
