#!/usr/bin/env node
/**
 * verify-mp-isolation.cjs - 微信小程序产物「非经典主题零残留」回归校验
 *
 * 背景：壳层 index.vue/setting.vue 的非 classic 主题 import 与 v-if 分支、
 *      index.scss 的 ui-*.scss @use 均已用 `#ifndef MP-WEIXIN` 条件编译隔离。
 *      若将来有人把这些条件编译注释移除/写错，MP 产物会混入：
 *        - 非 classic 主题组件（含内联 SVG，小程序 WXML 不支持）
 *        - 非 classic 主题样式（app.wxss 体积膨胀 + 无意义选择器）
 *      本脚本在 build:mp-weixin 之后运行，任何回归都会以非零退出码暴露。
 *
 * 用法：先 `npm run build:mp-weixin`，再 `node scripts/verify-mp-isolation.cjs`；
 *      已挂入 `npm run test:builds`（mp-weixin 构建后自动执行）。
 */
const fs = require('fs')
const path = require('path')

const MP_DIR = path.join('dist', 'build', 'mp-weixin')
const NON_CLASSIC_STYLES = ['ui-modern', 'ui-ink', 'ui-morandi', 'ui-watercolor', 'ui-animal', 'ui-pixel']
// 非 classic 主题组件（壳层 v-if 分支中被条件编译排除的标签名）
const NON_CLASSIC_TAGS = ['HomeModern', 'HomeInk', 'HomeMorandi', 'HomeWatercolor', 'HomeAnimal', 'HomePixel',
  'SettingModern', 'SettingInk', 'SettingMorandi', 'SettingWatercolor', 'SettingAnimal', 'SettingPixel']

function fail(msg) {
  console.error('❌ [MP隔离校验]', msg)
  process.exitCode = 1
}

if (!fs.existsSync(MP_DIR)) {
  console.error('❌ dist/build/mp-weixin 不存在，请先运行 npm run build:mp-weixin')
  process.exit(1)
}

// 1) views 目录下不应存在非 classic 主题目录
const viewsDir = path.join(MP_DIR, 'views')
if (fs.existsSync(viewsDir)) {
  for (const d of fs.readdirSync(viewsDir)) {
    if (NON_CLASSIC_TAGS.some(tag => tag.toLowerCase().startsWith(d.toLowerCase())) ||
        ['modern', 'ink', 'morandi', 'watercolor', 'animal', 'pixel'].includes(d)) {
      fail(`views/ 下存在非 classic 目录: ${d}`)
    }
  }
}

// 2) 壳层 wxml 不应引用非 classic 组件
for (const page of ['pages/index/index.wxml', 'pages/setting/setting.wxml']) {
  const p = path.join(MP_DIR, page)
  if (!fs.existsSync(p)) continue
  const text = fs.readFileSync(p, 'utf-8')
  for (const tag of NON_CLASSIC_TAGS) {
    if (text.includes(tag)) fail(`${page} 引用非 classic 组件: ${tag}`)
  }
}

// 3) app.wxss 不应含非 classic 主题命名空间选择器
const wxssPath = path.join(MP_DIR, 'app.wxss')
if (fs.existsSync(wxssPath)) {
  const text = fs.readFileSync(wxssPath, 'utf-8')
  for (const ns of NON_CLASSIC_STYLES) {
    if (text.includes(`.${ns}`)) fail(`app.wxss 含非 classic 命名空间: .${ns}`)
  }
}

// 4) classic 主题应保留（theme-yellow 是 MP 端唯一可用变量块）
const classicOk =
  fs.existsSync(path.join(MP_DIR, 'views', 'classic', 'HomeClassic.wxml')) &&
  fs.existsSync(path.join(MP_DIR, 'views', 'classic', 'SettingClassic.wxml'))
if (!classicOk) fail('classic 主题组件产物缺失（HomeClassic/SettingClassic）')

const wxss = fs.existsSync(wxssPath) ? fs.readFileSync(wxssPath, 'utf-8') : ''
if (!wxss.includes('theme-yellow')) fail('app.wxss 缺少 theme-yellow（classic 在 MP 端唯一可用变量块）')

if (process.exitCode) {
  console.error('❌ MP 产物隔离校验失败：非经典主题泄漏进小程序包')
  process.exit(1)
}
console.log('✅ MP 产物隔离校验通过：非 classic 组件/样式零残留，classic 完整保留')
