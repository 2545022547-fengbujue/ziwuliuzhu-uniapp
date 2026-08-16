/**
 * generate-setting-icons.cjs - 设置页卡片图标 SVG → 主题色 PNG（审查报告 2.3）
 *
 * 背景：6 套非经典设置页内联 SVG（stroke="currentColor"）在部分旧 Android WebView
 *       不渲染；H5 端 SVG 正常，故仅 App 端换用 PNG（见 components/SettingIcon.vue）。
 *
 * 实现：
 *  1. 从任意一套设置页提取 5 个 slot 的内联 SVG（6 页内容一致，已校验）；
 *  2. 主题色从 src/config/themes.js 的 UI_STYLE_PRIMARY 正则提取（防双源漂移）；
 *  3. 用 @resvg/resvg-js 渲染为透明背景 PNG（512px，viewBox 256 → 2x 清晰度）；
 *  4. 输出 src/static/icons/setting-<icon>-<theme>.png。
 *
 * 重新生成：node scripts/generate-setting-icons.cjs
 */
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const THEMES = ['modern', 'ink', 'morandi', 'watercolor', 'animal', 'pixel']
const SLOTS = ['solar', 'style', 'personal', 'methods', 'about']
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'src', 'static', 'icons')

// 1) 主题主色：从 themes.js 的 UI_STYLE_PRIMARY 正则提取（与运行时单源一致）
const themesJs = fs.readFileSync(path.join(ROOT, 'src', 'config', 'themes.js'), 'utf8')
const colors = {}
for (const t of THEMES) {
  const m = themesJs.match(new RegExp(`\\b${t}:\\s*'#([0-9A-Fa-f]{6})'`))
  if (!m) {
    console.warn(`[warn] themes.js 未找到 ${t} 主色，回退 #444444`)
  }
  colors[t] = m ? `#${m[1]}` : '#444444'
}

// 2) 提取每个 slot 的内联 SVG（6 页内容一致，取第一页）
const samplePath = path.join(ROOT, 'src', 'views', THEMES[0], `Setting${THEMES[0][0].toUpperCase()}${THEMES[0].slice(1)}.vue`)
const sample = fs.readFileSync(samplePath, 'utf8')
const svgs = {}
for (const slot of SLOTS) {
  const re = new RegExp(`#icon-${slot}><view[^>]*>(<svg.*?</svg>)</view>`, 's')
  const m = sample.match(re)
  if (!m) throw new Error(`未在 ${samplePath} 找到 icon-${slot}`)
  // resvg 需要明确尺寸；viewBox 为 0 0 256 256
  svgs[slot] = m[1].replace(/<svg /, '<svg width="256" height="256" ')
}

// 3) 渲染 PNG
fs.mkdirSync(OUT_DIR, { recursive: true })
let count = 0
for (const slot of SLOTS) {
  for (const theme of THEMES) {
    const svg = svgs[slot].replace(/stroke="currentColor"/g, `stroke="${colors[theme]}"`)
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } })
    const png = resvg.render().asPng()
    fs.writeFileSync(path.join(OUT_DIR, `setting-${slot}-${theme}.png`), png)
    count++
  }
}
console.log(`✅ 生成 ${count} 个 PNG → ${OUT_DIR}`)
console.log('配色：', JSON.stringify(colors))
