/**
 * themes.js - 主题 / 外观风格目录（纯数据，零依赖）
 *
 * ============================================================
 * 设计定位（给后来者/AI 的说明）
 * ============================================================
 * 1. 本文件是「外观体系」的单一事实来源（Single Source of Truth）。
 *    此前这些常量散落在 stores/app.js 顶部（约 140 行），与状态逻辑混在一起；
 *    抽取后 store 只负责「读取 + 应用」，新增一套外观的改动点收敛为：
 *       ① 本文件注册目录（1 处）
 *       ② 新建 src/views/<id>/Home<X>.vue + Setting<X>.vue（复制模板改根 class）
 *       ③ 新建 src/styles/ui-<id>.scss，并在 index.scss 末尾 @use（注意顺序）
 *       ④ 两个壳层（pages/index、pages/setting）加 v-else-if 分支（MP 侧加条件编译）
 *       ⑤ tabbar 图标资源 /static/tabbar/*-<id>.png
 *    与外观强相关的运行时逻辑（applyThemeChrome 等）仍在 store 中，因为它们调用 uni.*。
 *
 * 2. 外观体系是「双层模型」：
 *   - 经典四色（THEME_OPTIONS，id 无前缀，持久化键 store.theme）
 *     仅换配色变量（--theme-*），布局/组件不变；其中仅 yellow 兼容微信小程序，
 *     black/green/red 在 H5/App 才提供（条件编译）。
 *   - 独立 UI 风格（UI_STYLE_OPTIONS，id 带 style- 前缀，持久化键 store.uiStyle）
 *     每套拥有完整排版/组件/交互（对应全局 ui-*.scss 命名空间覆盖）。
 *
 * 3. 与样式体系的对应关系（重要）：
 *   - THEME_CHROME / UI_STYLE_CHROME → 原生 tabBar 配色（uni.setTabBarStyle），
 *     由 store.applyThemeChrome() 应用，只在 H5/App 生效（小程序无 tabBar 定制）。
 *   - UI_STYLE_PRIMARY → switch 等原生组件的主题色（store.themeSwitchColor）。
 *   - 页面内视觉（--theme-* 变量）由 src/styles/themes.scss + ui-*.scss 定义，
 *     本文件不重复持有色值，避免双源漂移。
 *
 * 4. 条件编译说明：THEME_OPTIONS 中 black/green/red 用 // #ifdef H5 || APP-PLUS
 *    包裹。uni-app 会对 src 下所有 js 做条件编译预处理，故迁移到本文件后行为不变；
 *    小程序端 activeTheme 由 store 强制回退 'yellow'（见 app.js 内注释）。
 * ============================================================
 */

// === 经典四色（theme）===
// id 与 themes.scss 的 .theme-<id> 类名一一对应；swatch 字段复用 UI_STYLE 的色板样式。
export const THEME_OPTIONS = [
  { id: 'yellow', name: '古典宣纸', desc: '温润沉稳，经典默认风格' },
  // #ifdef H5 || APP-PLUS
  { id: 'black', name: '暗夜幽光', desc: '静谧深邃，适合夜间使用' },
  { id: 'green', name: '青瓷天青', desc: '清润舒展，适合白天使用' },
  { id: 'red', name: '朱砂丹霞', desc: '温暖醒目，适合重点查阅' }
  // #endif
]

// === 经典四色 → 原生 tabBar 配色 ===
// 路径约定：/static/tabbar/<name>[-active].png，与 tabbar-svg-to-themed-png 技能产出一致。
export const THEME_CHROME = {
  yellow: {
    backgroundColor: '#FFFFFF',
    color: '#999999',
    selectedColor: '#8B4513',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-yellow.png',
    homeSelectedIconPath: '/static/tabbar/home-yellow-active.png',
    settingIconPath: '/static/tabbar/setting-yellow.png',
    settingSelectedIconPath: '/static/tabbar/setting-yellow-active.png'
  },
  black: {
    backgroundColor: '#000000',
    color: '#9B9B9B',
    selectedColor: '#0080FF',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-black.png',
    homeSelectedIconPath: '/static/tabbar/home-black-active.png',
    settingIconPath: '/static/tabbar/setting-black.png',
    settingSelectedIconPath: '/static/tabbar/setting-black-active.png'
  },
  green: {
    backgroundColor: '#F7FBF8',
    color: '#71827B',
    selectedColor: '#2F7D73',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-green.png',
    homeSelectedIconPath: '/static/tabbar/home-green-active.png',
    settingIconPath: '/static/tabbar/setting-green.png',
    settingSelectedIconPath: '/static/tabbar/setting-green-active.png'
  },
  red: {
    backgroundColor: '#FFF8F2',
    color: '#8A756B',
    selectedColor: '#B83A2E',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-red.png',
    homeSelectedIconPath: '/static/tabbar/home-red-active.png',
    settingIconPath: '/static/tabbar/setting-red.png',
    settingSelectedIconPath: '/static/tabbar/setting-red-active.png'
  }
}

// === 独立 UI 风格（uiStyle）===
// id 与全局样式 ui-<id>.scss 的 .ui-<id> 命名空间一一对应；
// swatch 字段对应 setting-base.scss 中 .theme-swatch.<swatch> 的取色样式。
// 注释统一说明设计意图，避免把「主色替换」误当成一套完整风格。
export const UI_STYLE_OPTIONS = [
  // 现代简约：实际采用柔和新拟物语言，通过明暗双阴影塑造轻浮雕层次。
  { id: 'modern', name: '现代简约', desc: '柔和浮雕，轻盈有序', swatch: 'modern' },
  // 水墨意境：白宣纸、墨色笔触与克制的印色点睛，并按时段切换山水背景。
  { id: 'ink', name: '水墨意境', desc: '宣纸墨色，东方留白', swatch: 'ink' },
  // 莫兰迪奶油：以低饱和灰粉、灰绿和奶油纸色形成安静柔和的观感。
  { id: 'morandi', name: '莫兰迪奶油', desc: '低饱和灰调，温柔治愈', swatch: 'morandi' },
  // 水彩画风：使用透明色层与纸面晕染，不使用生硬的纯色矩形堆叠。
  { id: 'watercolor', name: '水彩画风', desc: '纸面晕染，柔和诗意', swatch: 'watercolor' },
  // 动物森友会：参考 Animal Island UI 的奶油纸面、岛屿青绿和暖黄木牌语言。
  { id: 'animal', name: '动物森友会', desc: '双狸迎宾，悠闲岛屿生活', swatch: 'animal' },
  // 复古像素：遵循 Pixelium Design 的硬边轮廓、有限色板和 4px 像素节奏。
  { id: 'pixel', name: '复古像素', desc: '掌机像素，怀旧冒险', swatch: 'pixel' }
]

// === 每种新风格的主色（用于 switch 等原生组件着色）===
// 与 store.themeSwitchColor 联动；页面内主色走 --theme-primary 变量，不在此重复。
export const UI_STYLE_PRIMARY = {
  modern: '#4F46E5',
  ink: '#2F4A48',
  morandi: '#A98282',
  watercolor: '#4A6FA5',
  animal: '#19AFA2',
  pixel: '#5B6EE1'
}

// === 每种新风格的 TabBar 配色；可按风格同时覆盖普通与选中图标 ===
export const UI_STYLE_CHROME = {
  modern: {
    backgroundColor: '#FFFFFF',
    color: '#9CA3AF',
    selectedColor: '#4F46E5',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-modern.png',
    homeSelectedIconPath: '/static/tabbar/home-modern-active.png',
    settingIconPath: '/static/tabbar/setting-modern.png',
    settingSelectedIconPath: '/static/tabbar/setting-modern-active.png'
  },
  ink: {
    backgroundColor: '#FDFDFA',
    color: '#7A817D',
    selectedColor: '#2F4A48',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-ink.png',
    homeSelectedIconPath: '/static/tabbar/home-ink-active.png',
    settingIconPath: '/static/tabbar/setting-ink.png',
    settingSelectedIconPath: '/static/tabbar/setting-ink-active.png'
  },
  morandi: {
    backgroundColor: '#F6F1EB',
    color: '#8F8880',
    selectedColor: '#A98282',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-morandi.png',
    homeSelectedIconPath: '/static/tabbar/home-morandi-active.png',
    settingIconPath: '/static/tabbar/setting-morandi.png',
    settingSelectedIconPath: '/static/tabbar/setting-morandi-active.png'
  },
  watercolor: {
    backgroundColor: '#FAF8F5',
    color: '#8A9DB3',
    selectedColor: '#4A6FA5',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-watercolor.png',
    homeSelectedIconPath: '/static/tabbar/home-watercolor-active.png',
    settingIconPath: '/static/tabbar/setting-watercolor.png',
    settingSelectedIconPath: '/static/tabbar/setting-watercolor-active.png'
  },
  animal: {
    backgroundColor: '#F7F3DF',
    color: '#8A7B66',
    selectedColor: '#19AFA2',
    borderStyle: 'white',
    homeIconPath: '/static/tabbar/home-animal.png',
    homeSelectedIconPath: '/static/tabbar/home-animal-active.png',
    settingIconPath: '/static/tabbar/setting-animal.png',
    settingSelectedIconPath: '/static/tabbar/setting-animal-active.png'
  },
  pixel: {
    backgroundColor: '#F7E7B7',
    color: '#6B5B53',
    selectedColor: '#5B6EE1',
    borderStyle: 'black',
    homeIconPath: '/static/tabbar/home-pixel.png',
    homeSelectedIconPath: '/static/tabbar/home-pixel-active.png',
    settingIconPath: '/static/tabbar/setting-pixel.png',
    settingSelectedIconPath: '/static/tabbar/setting-pixel-active.png'
  }
}
