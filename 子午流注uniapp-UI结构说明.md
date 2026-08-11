# 子午流注取穴 UI 结构说明

> 文档状态：2026-08-11 已按当前 App/H5 代码补全。本文同时描述经典四色、六套独立外观、主题切换动画、穴位编码开关、动物岛详情场景、平台边界和维护约定；若历史段落与后文“当前实现”冲突，以后文和仓库代码为准。

## 一、整体架构

### 1.1 页面层级

```
App.vue (应用入口)
├── pages/index/index.vue (取穴主界面 - TabBar首页)
│   ├── AppNavbar (导航栏)
│   ├── ResultPanel (主结果面板)
│   ├── PointDetail (穴位详情弹窗)
│   │   └── AnimalMascot (动物主题静态随机角色)
│   ├── DatePicker (日历面板)
│   ├── TimePicker (时辰面板)
│   └── 手动查询确认弹窗
│
└── pages/setting/setting.vue (设置页 - TabBar第二页)
    ├── AppNavbar (导航栏)
    ├── CityPicker (城市选择弹窗)
    ├── ThemeTransitionOverlay (动物/水墨主题切换遮罩)
    ├── 取穴方法说明全屏弹窗
    └── 关于全屏弹窗
```

### 1.2 组件依赖关系

| 组件 | 被引用页面 | 功能 |
|------|-----------|------|
| AppNavbar | index.vue, setting.vue | 自定义导航栏，适配状态栏高度 |
| ResultPanel | index.vue | 取穴结果展示，支持5种方法 |
| PointDetail | index.vue | 穴位详情弹窗，store控制显示 |
| DatePicker | index.vue | 日历面板选择器（三端统一） |
| TimePicker | index.vue | 时辰列表选择器（三端统一） |
| CityPicker | setting.vue | 城市选择弹窗，支持搜索+省份分组 |
| AnimalMascot | PointDetail.vue | 动物主题六种静态 SVG 守护角色，由详情弹窗打开时随机选择 |
| ThemeTransitionOverlay | setting.vue | 动物岛欢迎、水墨入境两种主题切换加载动画 |

### 1.3 状态管理（stores/app.js）

核心状态：

| 类别 | 状态 | 说明 |
|------|------|------|
| 时间 | currentTime, currentHour | 自动模式：当前时间和时辰索引 |
| 时间 | selectedDate, selectedHour | 手动模式：选择的日期和时辰 |
| 时间 | isManualMode | 模式切换：自动/手动 |
| 方法 | activeMethod | 当前取穴方法：najia/nazi/lingui/feiteng |
| 方法 | naziMode | 纳子法子模式：daily(六十六穴)/bumu(补母泻子) |
| 方法 | fankeDisplayMode | 反克法显示：merged(合并)/separate(单独) |
| 方法 | useHeRiHuYong | 合日互用开关，默认 false；仅在纳甲法闭穴时启用替代穴位 |
| UI | showDetail, selectedPoint | 穴位详情弹窗状态 |
| UI | theme | 当前主题：yellow/black/green/red |
| UI | uiStyle | 独立外观：classic/modern/ink/morandi/watercolor/animal/pixel |
| UI | showPointCode | 是否显示穴位编码，默认开启并持久化 |
| UI | visualClock | 只驱动水墨时段背景，不参与取穴计算 |
| 真太阳时 | useTrueSolarTime, longitude, selectedCity | 真太阳时校正设置 |

数据流（声明式 computed）：
```
用户操作 → 修改状态 → currentGanZhi 自动重算 → results 自动重算 → ResultPanel 响应式更新
```

### 1.4 合日互用的计算与显示边界

- `calculateNajia(ganzhi, hourIndex, options)` 通过 `options.enableHeRiHuYong` 接收开关，默认值为 `false`。
- 纳甲法本身有开穴时，无论开关状态如何都不会计算合日互用，避免同屏混淆本日穴与替代穴。
- 纳甲法闭穴且开关开启时，才计算配对天干同一时辰的流注序列，并将结果写入 `alternativePoints`。
- `ResultPanel` 只依据 `alternativePoints.openPoints` 渲染“合日互用开穴”，不重复读取设置开关，避免视图状态与计算结果瞬间不同步。
- 穴位跨时辰去重必须使用稳定的 `point.code`。特定穴数据并不保证存在 `point.id`，禁止再次直接以 `id` 作为 Set 键。

---

## 二、样式系统

### 2.1 全局SCSS变量（variables.scss）

**主色调（中医古典棕色系）**：
| 变量 | 值 | 说明 |
|------|-----|------|
| $tcm-primary | #8B4513 | 棕色主色 |
| $tcm-primary-light | #A0522D | 浅棕 |
| $tcm-primary-dark | #6B3410 | 深棕 |
| $tcm-secondary | #5B8C3E | 草绿辅助色 |
| $tcm-jade | #2E8B57 | 翠玉绿 |
| $tcm-water | #1565C0 | 藏青蓝（五行水） |

**背景色**：
| 变量 | 值 | 说明 |
|------|-----|------|
| $tcm-bg | #F8F4EF | 宣纸底色 |
| $tcm-bg-light | #FFFDF5 | 卡片底色 |
| $tcm-bg-dark | #F0E6D8 | 深底色 |

**文字色**：
| 变量 | 值 | 说明 |
|------|-----|------|
| $tcm-text | #2C2C2C | 主文字 |
| $tcm-text-secondary | #666 | 辅助文字 |
| $tcm-text-hint | #999 | 提示文字 |

**五行配色**：
| 五行 | 颜色 | 说明 |
|------|------|------|
| 木 | #2E7D32 | 青绿 |
| 火 | #D32F2F | 朱红 |
| 土 | #F57C00 | 琥珀 |
| 金 | #B8860B | 暗金 |
| 水 | #1565C0 | 藏青 |

**间距（rpx单位）**：
- xs: 10rpx, sm: 18rpx, md: 28rpx, lg: 36rpx, xl: 52rpx

**圆角**：
- sm: 8rpx, md: 16rpx, lg: 24rpx, xl: 32rpx

**字号**：
- xs: 22rpx, sm: 26rpx, base: 30rpx, md: 34rpx, lg: 38rpx, xl: 48rpx

### 2.2 经典四色主题 CSS 变量（themes.scss）

#### Yellow - 古典宣纸（默认主题）

```scss
.theme-yellow {
  --theme-primary: #8B4513;          // 棕色主色
  --theme-primary-dark: #6B3410;     // 深棕
  --theme-secondary: #5B8C3E;        // 草绿
  --theme-bg: #F9F2E0;               // 宣纸白 CMYK(4,6,15,0)
  --theme-surface: #FFFDF5;          // 卡片底色
  --theme-surface-muted: #F8F4EF;    // 次背景
  --theme-text: #2C2C2C;             // 主文字
  --theme-text-secondary: #666;
  --theme-text-hint: #999;
  --theme-border: rgba(139, 69, 19, 0.12);
  --theme-shadow: rgba(139, 69, 19, 0.08);
}
```

#### Black - 暗夜幽光（OLED纯黑 + 磨砂玻璃）

```scss
.theme-black {
  --theme-primary: #0080FF;          // 电蓝色
  --theme-bg: #000000;               // OLED纯黑
  --theme-surface: #000000;
  --theme-text: #FFFFFF;             // 纯白（7:1+对比度）
  --theme-border: rgba(255, 255, 255, 0.35);
}
```

**磨砂玻璃效果**：
```scss
.ganzhi-card, .result-panel, .popup {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(15px);
  border: 1rpx solid rgba(255, 255, 255, 0.35);
}
```

#### Green - 青瓷天青（宋代青瓷釉面质感）

```scss
.theme-green {
  --theme-primary: #2F7D73;          // 青瓷主色
  --theme-bg: #E8F4EC;               // 青瓷釉面底色
  --theme-surface: #F5FAF7;          // 温润白
  --theme-text: #14302C;             // 深青文字
}
```

**釉面光泽效果**：内阴影模拟釉面光泽
```scss
box-shadow: 0 4rpx 16rpx rgba(47, 125, 115, 0.08),
            0 1rpx 4rpx rgba(255, 255, 255, 0.60) inset;
```

#### Red - 朱砂丹霞

```scss
.theme-red {
  --theme-primary: #B83A2E;          // 朱砂红
  --theme-bg: #FFF7F1;               // 丹霞底色
  --theme-text: #35221E;             // 深朱文字
}
// 穴位名称强制红色
.point-name { color: #B83A2E; }
```

### 2.3 主题切换机制

- **条件编译**：black/green/red 仅 H5/App 可用（`#ifndef MP-WEIXIN`）
- **动态应用**：页面根节点绑定 `:class="'theme-${store.activeTheme}'"`
- **TabBar同步**：`applyThemeChrome()` 动态修改 TabBar 样式和图标
- **持久化**：theme 状态存储到 uni.storage

### 2.4 六套独立外观（当前实现）

独立外观使用 `uiStyle`，与经典四色的 `theme` 分离。页面根节点只挂一套主类：经典模式使用 `theme-*`，独立外观使用 `ui-*`，防止旧主题选择器串色。

| 外观 | 根类 | 主样式文件 | 设计语言 | 关键资源/组件 |
|------|------|------------|----------|---------------|
| 现代简约 | `.ui-modern` | `styles/modern.scss` | 浅灰同色基底、明暗双向浮雕、新拟物交互 | 无额外大图 |
| 水墨意境 | `.ui-ink` | `styles/ui-ink.scss` | 白宣纸、墨池晕染、朱砂点睛、时段山水 | `assets/ink/*`、`utils/ink-backgrounds.js` |
| 莫兰迪奶油 | `.ui-morandi` | `styles/ui-morandi.scss` | 尘粉、鼠尾草、燕麦和雾蓝的低饱和分层 | 无额外大图 |
| 水彩画风 | `.ui-watercolor` | `styles/ui-watercolor.scss` | 暖白纸面、透明色洗、随机详情晕染 | PointDetail 六种 wash class |
| 动物森友会 | `.ui-animal` | `styles/ui-animal.scss` | 奶油纸面、岛屿青绿、暖黄木牌、圆润组件 | 双狸图、纸纹、`AnimalMascot.vue` |
| 复古像素 | `.ui-pixel` | `styles/ui-pixel.scss` | 4rpx 网格、硬边轮廓、有限色板、阶梯阴影 | Pixelium 规范、像素 TabBar 图标 |

独立外观仅面向 H5 和 App。`supportsThemeSwitch` 在其它平台为 false，读取到独立外观持久化值时统一回退经典界面；新增资源和复杂动画不以小程序兼容为设计目标。

### 2.5 样式入口与覆盖顺序

`src/styles/index.scss` 是总入口。维护时需保持以下层级关系：

1. 字体、变量和基础页面结构；
2. 经典主题与通用组件样式；
3. 六套独立外观覆盖；
4. `ui-point-code.scss` 最后处理编码关闭后的主题化排版。

主题文件大量使用 `.ui-* .component` 的限定选择器和少量 `!important`，目的不是任意提高优先级，而是压过页面 scoped 样式生成的属性选择器。新增覆盖前应先确认是否真的存在 scoped 优先级冲突。

---

## 三、字体方案（楷题宋文）

### 3.1 字体文件

| 字体 | 文件路径 | 大小 | 用途 |
|------|---------|------|------|
| KaitiGB2312 | src/assets/fonts/kaiti-gb2312.ttf | 122KB | 标题、穴位名 |
| WenYuanSerifSC | src/assets/fonts/wenjinmincho-subset-v6.ttf | 226KB | 正文、说明 |
| WenYuanSerifSC-Bold | src/assets/fonts/WenYuanSerifSC-Bold-subset-v2.ttf | 23KB | 加粗正文 |

### 3.2 加载方式

**App端/H5**：@font-face 加载 ttf 文件
```scss
@font-face {
  font-family: 'KaitiGB2312';
  src: url('@/assets/fonts/kaiti-gb2312.ttf') format('truetype');
}
```

**微信小程序**：`App.vue` 调用 `src/utils/font-loader.js`，使用 `uni.loadFontFace + data URI` 动态加载 KaitiGB2312 和 WenYuanSerifSC 常规体；base64 模块由 `npm run fonts:base64` 从 TTF 生成。Bold 未单独动态加载，会回退到常规宋体/系统字体。

### 3.3 应用场景

| 场景 | 字体族 |
|------|--------|
| 导航栏标题 | KaitiGB2312, KaiTi, STKaiti, serif |
| 穴位名称（详情弹窗） | KaitiGB2312, KaiTi, 楷体, STKaiti, serif |
| 干支标签 | WenYuanSerifSC, SimSun, 宋体 |
| 结果面板标题 | KaitiGB2312 |
| 穴位详情正文 | WenYuanSerifSC-Bold（经络五行）+ 宋体（定位说明） |

---

## 四、页面详解

### 4.1 首页 - 取穴主界面（pages/index/index.vue）

**布局结构**：
```
.page (flex column, 100vh)
├── AppNavbar (fixed top, z-index:100)
├── .nav-placeholder (占位 = statusBarHeight + 44px)
├── scroll-view.page-scroll (flex:1, height:0)
│   ├── .ganzhi-card (干支信息卡片)
│   │   ├── .ganzhi-header (标题 + 自动/手动切换胶囊)
│   │   ├── .manual-controls (手动模式：日期+时辰+查询按钮)
│   │   ├── .current-datetime (当前日期时间)
│   │   └── .ganzhi-display (年/月/日/时干支标签)
│   ├── .method-tabs (方法切换栏 - 4个Tab)
│   ├── .result-wrapper (主结果面板)
│   ├── .fanke-supplement (反克法补充 - 条件显示)
│   ├── .compare-section (其他方法对比)
│   └── 底部安全区占位
├── PointDetail (穴位详情弹窗)
├── .confirm-overlay (手动查询确认弹窗)
├── DatePicker
└── TimePicker
```

**核心功能**：

| 功能 | 说明 |
|------|------|
| 自动模式 | 每分钟检查时辰变化，变动时重算取穴结果 |
| 手动模式 | 选择日期+时辰 → 查询 → 确认弹窗 → 计算 |
| 方法切换 | 纳甲法、纳子法、灵龟八法、飞腾八法 |
| 反克法补充 | 纳甲法闭穴时，独立模式下显示反克法面板 |
| 其他方法对比 | 底部显示其他3种方法的紧凑结果面板 |

**关键样式**：

| 元素 | 样式特点 |
|------|---------|
| .ganzhi-card | 宣纸背景 + 32rpx大圆角 + 柔和阴影 |
| .ganzhi-toggle | 胶囊式切换按钮，激活项渐变背景 |
| .method-tabs | 卡片式Tab，选中项 scale(1.02) + 渐变背景 |
| .point-btn | 穴位按钮：圆角卡片 + 五行标签 |

### 4.2 设置页（pages/setting/setting.vue）

**布局结构**：
```
.page
├── AppNavbar
├── scroll-view.page-scroll
│   ├── .setting-card (真太阳时：开关+城市+经度)
│   ├── .setting-card (外观主题) ← 条件编译
│   ├── .setting-card (反克法显示模式)
│   ├── .setting-card (取穴方法说明入口)
│   ├── .setting-card (关于入口)
├── CityPicker
├── .fullscreen-overlay (方法说明弹窗)
└── .fullscreen-overlay (关于弹窗)
```

**主题切换组件**：
- `.theme-current`：当前主题折叠面板，点击展开
- `.theme-swatch`：主题色预览圆形
- `.theme-options`：其他主题列表

**全屏弹窗**：
- z-index: 999
- `.fullscreen-panel`：flex column，占满屏幕
- `.fullscreen-body`：scroll-view，flex:1 + height:0

---

## 五、组件详解

### 5.1 AppNavbar - 导航栏

**布局**：
```
.navbar (fixed, z-index:100)
├── .navbar-content (flex, height:44px)
│   ├── .navbar-left (slot)
│   ├── .navbar-title (absolute居中)
│   └── .navbar-right (slot)
```

**特点**：
- 自动适配 statusBarHeight
- 默认渐变背景：primary → primary-dark
- 标题 absolute 定位居中

### 5.2 ResultPanel - 取穴结果面板

**布局**：
```
.result-panel
├── .panel-header (渐变背景)
│   ├── .header-icon (方法图标)
│   └── .header-title (方法名)
├── .panel-body
│   ├── .result-ganzhi-row (日期+时辰干支)
│   ├── .warning-box (闭穴提示)
│   ├── .fanke-merged (反克法合并显示)
│   ├── .section (合日互用穴位)
│   ├── .meridian-row (值日/值时经络 + 纳子法模式切换)
│   ├── .section (补母泻子/开穴列表)
│   ├── .bumu-tip (补母泻子提示)
│   ├── .palace-box (九宫信息)
│   ├── .suggestion-box (补泻建议)
│   └── .empty-state (无结果)
```

**Props**：
- `method`：取穴方法标识
- `compact`：紧凑模式（去掉边距阴影）

**纳子法模式切换**：
- `.nazi-mode-switch`：胶囊式切换
- 六十六穴 / 补母泻子

**穴位排序**：按名字字数（两字在前、三字在后）

### 5.3 PointDetail - 穴位详情弹窗

**布局**：
```
.overlay (fixed, z-index:200)
└── .popup (居中弹窗, 92%宽度)
    ├── .popup-header
    │   ├── .header-icon-wrap (圆形图标)
    │   ├── .header-name-layer (absolute定位)
    │   │   ├── .point-name (楷体76rpx)
    │   │   └── .point-code (monospace 20rpx)
    │   └── .close-btn
    ├── scroll-view.popup-body
    │   ├── .info-section (基本信息)
    │   │   ├── .info-grid (经络/类别/五行胶囊)
    │   ├── .info-section (定位)
    │   ├── .info-section (操作方法：针刺/艾灸)
    │   ├── .caution-box (注意事项)
    │   └── .nazi-bumu-tip (纳子法说明)
```

**经络框宽度逻辑**：
- 默认：`flex: 1.15`（加长15%）
- 经络6字+有五行：`flex: 1.3`

**字体**：
- 穴位名：楷体 76rpx 加粗
- 正文：宋体 + line-height: 2

### 5.4 DatePicker - 日历面板

**布局**：
```
.date-picker-overlay (z-index:500)
└── .date-picker-panel
    ├── .year-header (◀ 年份 ▶)
    ├── .month-row (◀ 月份日期 ▶)
    ├── .calendar-grid
    │   ├── .week-header (一二三四五六日)
    │   └── .day-grid (7列网格)
    └── .action-row (取消/确定)
```

**日历算法**：
- JS getDay()：0=周日 → 转换为周日放最后
- 空格数 = `(getDay() - 1 + 7) % 7`

**选中样式**：圆形渐变背景

### 5.5 TimePicker - 时辰面板

**布局**：
```
.time-picker-overlay (z-index:500)
└── .time-picker-panel
    ├── .picker-title
    ├── scroll-view.hour-list (12时辰)
    └── .action-row
```

**暗夜幽光特殊处理**：
- 选中项：电蓝色边框替代渐变背景（提高对比度）

### 5.6 CityPicker - 城市选择弹窗

**布局**：
```
.overlay (z-index:200)
└── .popup
    ├── .popup-header
    ├── .search-section (搜索输入)
    ├── scroll-view.popup-body
    │   ├── .tip-box (隐私提示)
    │   ├── 搜索模式：city-item列表
    │   ├── 省份分组模式：
    │       └── .province-group (折叠展开)
    └── .popup-footer (取消/确定)
```

**搜索功能**：
- 支持城市名、拼音、首字母
- 防抖300ms

**省份排序**：硬编码顺序（直辖市优先 → 特别行政区最后）

---

## 六、布局技巧

### 6.1 scroll-view高度计算

关键技巧：`flex:1` + `height:0` + `overflow:hidden`

```scss
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-scroll {
  flex: 1;
  height: 0;  // 关键
}
```

### 6.2 安全区域适配

```vue
<view :style="{ height: safeBottom + 60 + 'px' }"></view>
```

### 6.3 导航栏高度

```js
const navHeight = statusBarHeight + 44  // 44px标准导航栏高度
```

### 6.4 弹窗层级

| 弹窗 | z-index |
|------|---------|
| AppNavbar | 100 |
| PointDetail/CityPicker | 200 |
| 确认弹窗 | 300 |
| DatePicker/TimePicker | 500 |
| 全屏弹窗 | 999 |

### 6.5 条件编译

| 条件 | 用途 |
|------|------|
| `#ifdef APP-PLUS` | App端字体加载 |
| `#ifndef MP-WEIXIN` | 排除微信小程序 |
| `#ifdef H5` | H5端滚动条隐藏 |

---

## 七、关键交互逻辑

### 7.1 时间状态管理

数据流：
```
用户操作 → 修改状态
         → currentGanZhi computed重算（含真太阳时）
         → results computed重算（5种方法）
         → ResultPanel响应式更新
```

### 7.2 手动模式查询流程

```
选择日期 → onDatePickerChange()
选择时辰 → onTimePickerChange()
点击查询 → handleQuery() → showQueryConfirm=true
确认 → confirmQuery() → store.queryTime()
```

### 7.3 返回键拦截优先级

**首页**：DatePicker > TimePicker > 确认弹窗 > 穴位弹窗

**设置页**：CityPicker > 方法说明 > 关于 > 跳转取穴页

### 7.4 真太阳时交互

```
打开开关 → 延迟100ms弹出CityPicker
选择城市 → updateLongitude() → 强制更新时间
关闭开关 → longitude重置为116.407（北京）
```

---

## 八、配置文件

### 8.1 pages.json

- 双TabBar：取穴、设置
- navigationStyle: "custom"（自定义导航栏）
- 默认背景色：#F8F4EF

### 8.2 config/index.js

| 配置项 | 值 | 说明 |
|--------|-----|------|
| defaultCity | 北京 | 真太阳时默认城市 |
| defaultLongitude | 116.407 | 北京经度 |
| timerInterval | 60000 | 定时器间隔1分钟 |

---

## 九、已知坑与解决方案

| 问题 | 来源 | 真实解决方案 |
|------|------|-------------|
| **弹窗右边截断** | PointDetail.vue注释 | 所有卡片容器加 `box-sizing: border-box; width: 100%; overflow: hidden`。原因是 uni-app H5 模式下盒模型计算异常，不加这三条会导致右边被截断。 |
| **定位文字换行不美观** | PointDetail.vue注释 | `.location-text` 用 `word-break: normal; overflow-wrap: break-word` 避免在词中间断开；`.info-value` 用 `word-break: keep-all` 保持整体不换行；`.method-value`/`.caution-text` 用 `word-break: break-all` 允许任意位置换行。不同场景用不同策略。 |
| **Android不支持楷体** | PointDetail.vue注释说fallback，但**真正的方案是打包内置字体** | **真实方案**：打包内置楷体字体文件 `kaiti-gb2312.ttf`（子集化122KB），通过 `@font-face` 加载。App端用 `#ifdef APP-PLUS` 条件编译；微信小程序由 `font-loader.js` 用 `uni.loadFontFace + data URI` 动态加载楷体与常规宋体。fallback 只是兜底，不是主方案。详见 `index.scss` 字体声明和 `font-loader.js`。 |
| **scroll-view高度计算失败** | 首页/设置页实践 | 父容器 `display:flex; flex-direction:column; height:100vh; overflow:hidden`，scroll-view 设 `flex:1; height:0`。`height:0` 是关键，让 flex 分配剩余高度生效。 |
| **H5弹窗中input无法聚焦** | CityPicker.vue注释 | 用 `:focus="inputFocused"` 绑定状态，配合 `nextTick` + `setTimeout` 延迟触发聚焦。不能用 `@tap.stop` 阻止事件冒泡，否则 input 也无法交互。代码见 CityPicker.vue 第221-225行。 |
| **微信小程序不支持backdrop-filter** | DatePicker/TimePicker注释 | 用 `#ifndef MP-WEIXIN` 条件编译排除磨砂玻璃效果。微信小程序端回退到普通背景色。 |
| **暗夜幽光选中项对比度低** | TimePicker.vue注释 | 选中项用电蓝色边框 + 半透明背景替代渐变背景。代码：`background: rgba(0, 128, 255, 0.25); border: 1px solid rgba(0, 128, 255, 0.6)`。 |
| **CSS单位不一致导致布局异常** | CityPicker/DatePicker/TimePicker注释 | 这三个选择器弹窗**全部使用 px 单位**（不用 rpx），否则部分设备布局异常。其他组件（如首页、PointDetail）使用 rpx。原因是弹窗类组件在不同平台渲染引擎差异较大，px 更稳定。 |
| **JS getDay()周日问题** | DatePicker.vue注释 | JS `getDay()` 返回 0=周日，需求是周日放最后。转换公式：空格数 = `(getDay() - 1 + 7) % 7`，周日(0)→空格6（放第7列），周一(1)→空格0（放第1列）。代码见 DatePicker.vue 第163行。 |
| **三角符号视觉不居中** | DatePicker.vue注释 | `◀▶` 在圆形背景内视觉不对称，用 `transform: translateX(-1px)` / `translateX(1px)` 微调。 |

---

## 十、当前外观状态与持久化

### 10.1 `theme` 与 `uiStyle` 的职责

- `theme` 只保存经典四色：`yellow / black / green / red`。
- `uiStyle` 保存界面体系：`classic / modern / ink / morandi / watercolor / animal / pixel`。
- 当 `uiStyle === 'classic'` 时，页面使用 `theme-${activeTheme}`；否则只使用 `ui-${activeUiStyle}`。
- `setTheme()` 会自动把 `uiStyle` 切回 `classic`；`setUiStyle()` 不删除经典主题值，用户回到经典模式时可恢复上次经典配色。
- `appearanceOptions` 把两组状态合并为设置页的一份外观列表，页面不直接拼装选项。

持久化键为 `ziwuliuzhu-app`，当前保存：真太阳时、经度、城市、取穴方法、纳子模式、反克法显示模式、穴位编码开关、经典主题和独立外观。新增 UI 状态前应判断它是否属于用户偏好；弹窗开关、过渡动画等瞬时状态不能持久化。

### 10.2 TabBar 同步

`applyThemeChrome()` 同步背景色、普通文字色、选中文字色和两页普通/选中图标。十套外观图标位于 `src/static/tabbar/`，由 `scripts/generate-theme-tabbar-icons.py` 统一生成。

新增外观时必须同时完成：

1. Store 中的外观选项、主色和 TabBar chrome；
2. 四张图标：`home-*`、`home-*-active`、`setting-*`、`setting-*-active`；
3. 设置页色样；
4. 页面、弹窗和选择器的根类传递；
5. H5/App 构建与真实页面验证。

---

## 十一、穴位编码显示开关

### 11.1 数据与渲染

`showPointCode` 默认 `true`。设置页开关调用 `togglePointCode()`，状态持久化后同时影响：

- `ResultPanel.vue`：编码开启时显示中文名与编码；关闭时只显示中文名并增加 `point-btn-code-hidden`。
- `PointDetail.vue`：编码开启时标题右下显示编码；关闭时移除编码并增加 `point-name-code-hidden`。

编码仅是显示偏好。穴位查找、列表 key、详情数据和算法结果仍使用原始 code，关闭显示不能改变业务逻辑。

### 11.2 排版约束

`styles/ui-point-code.scss` 为十套外观分别调整字号、字距和按钮留白。列表采用三列网格后，编码关闭态不得再设置会撑破网格的固定最小宽度；详情标题关闭编码后只允许调整中文名字号，`header-name-layer` 的左侧位置不变，避免标题突然居中或与定位图标重叠。

### 11.3 三列穴位网格

`ResultPanel.vue` 的 `.points-grid` 固定使用 `grid-template-columns: repeat(3, minmax(0, 1fr))`。穴位按钮占满单元格并居中，五个穴位会排成前三后二，而不是由内容宽度决定的前二、中二、末一。

按钮内部按“中文名—可选编码—可选五行”横向排列。手机视口下通过较小间距、编码字号和标签 padding 保证三字穴位名可用；不得改回 `flex-wrap`，也不要给按钮增加大于单列宽度的 `min-width`。

---

## 十二、穴位详情弹窗当前结构

### 12.1 固定头部与滚动正文

- `.popup` 使用纵向 flex，最大高度为 `85vh`。
- `.popup-header` 固定在顶部，包含定位图标、绝对定位的穴位名/编码和关闭按钮。
- `.popup-body` 单独滚动，基本信息、定位、针刺/艾灸、注意事项不会推动头部离开视口。
- 打开详情时隐藏 TabBar，组件卸载时恢复，避免原生 TabBar 穿透模态层。

### 12.2 动物主题底部场景

动物主题在正文之后追加无边框场景：透明天空渐变、太阳、云朵、两棵树、草地和双层海浪铺满弹窗宽度。`AnimalMascot` 固定在右下角，每次打开详情随机选择兔、猫、犬、鹿、松鼠或猫头鹰。

角色属于纯装饰：无文字、无点击、无穴位语义、无循环动画。随机值只在详情组件创建时确定，同一次弹窗内不会因滚动或响应式更新而变化。

### 12.3 水墨关闭按钮

水墨主题使用 `src/static/themes/ink/close-brush.svg` 作为朱砂干笔背景。素材按用户参考图的中心厚墨、外圈多层干笔、分段飞白和少量墨点结构原创重绘，不直接打包带图库水印的参考文件。白色叉号由两条绝对定位笔画绘制，不能直接依赖“✕”字符居中，因为 Android、Windows 和不同 WebView 的字体基线不同，会出现背景与叉号错位。原文字仍保留在 DOM 中供其它主题使用，水墨样式把字号和颜色隐藏，触控容器继续保留约 78rpx 尺寸及 `aria-label`。

---

## 十三、主题切换动画

### 13.1 触发条件

设置页选择动物森友会或水墨意境时挂载 `ThemeTransitionOverlay.vue`。切换其它外观直接生效；重复选择当前外观不播放动画；动画进行中忽略新的主题选择，防止定时器和 TabBar 状态交叉。

### 13.2 时间线

1. 立即显示遮罩并隐藏 TabBar；
2. 120ms 后切换底层外观，避免底层先闪色；
3. 1380ms 后设置 `closing`，遮罩开始淡出；
4. 1720ms 后卸载遮罩、重新应用 TabBar chrome 并显示 TabBar。

父组件持有应用、淡出和结束三个定时器。页面卸载时必须统一清理，并在遮罩仍存在时恢复 TabBar，防止用户快速返回造成底栏永久隐藏。

### 13.3 两套动画语言

- 动物岛：太阳弹入、云朵漂移、小岛升起、双狸入场、双层海浪和三色加载点。
- 水墨：墨迹扩散、前后山形升起、墨印呼吸旋转、落笔横线和标题显现。

两套动画都提供 `prefers-reduced-motion` 降级。主题动画只承担切换反馈，不参与页面业务状态，也不复用穴位详情角色。

---

## 十四、独立外观维护要点

### 14.1 水墨意境

- 页面背景由 `inkBackgroundPeriod` 按设备当地时间切换，视觉时钟不触发取穴算法重算。
- 日期和时辰弹窗使用专门重构图素材，不直接照搬页面长图。
- 标题使用真楷/楷体，正文保持文渊宋体或系统可读字体；朱砂只作重点和印记，不大面积铺色。
- H5/App 启用山水资源和复杂滤镜，其它平台不承担这套资源。

### 14.2 动物森友会

- 双狸与岛屿纸纹来自 MIT 参考项目并记录在 `THIRD_PARTY_NOTICES.md`。
- 主交互参考 Animal Island UI 的按钮阶梯阴影：悬浮轻抬、按下回落；方法标签选中时图标轻弹，外观列表展开时短促错峰入场。
- 角色本身保持静止。动效集中在主题切换和用户主动操作，避免页面长期存在多个循环动画。

### 14.3 复古像素

- 依据 Pixelium Design 采用 4rpx 像素节奏、硬边、有限色板和实体阶梯阴影。
- uni-app 页面继续使用 `view/text/switch`，不直接引入只面向标准 Vue Web DOM 的 Pixelium 组件。
- 不使用模糊阴影和任意圆角；按下态通过位移和缩短阴影模拟掌机按键。

### 14.4 莫兰迪、水彩与现代

- 莫兰迪依靠低饱和色之间的分层，不是整页统一灰粉。
- 水彩依靠透明晕染、暖白纸面和详情随机 wash，避免高饱和实色块。
- 现代简约实际采用新拟物语言，核心是同色基底与明暗双阴影，不应重新退化为普通白卡片加靛蓝按钮。

---

## 十五、资源与许可

| 资源 | 目录 | 打包范围 | 说明 |
|------|------|----------|------|
| 水墨页面背景 | `src/assets/ink/` | H5/App | 七时段背景与选择器重构图 |
| 动物双狸和纸纹 | `src/static/themes/animal/` | H5/App | MIT 素材，许可见第三方声明 |
| 主题 TabBar | `src/static/tabbar/` | 对应平台 | 十套外观普通态/选中态 |
| 字体子集 | `src/assets/fonts/` | 按现有条件编译 | 楷题宋文与像素字体回退 |

新增第三方素材时必须同时记录来源、许可证、作者版权和本项目使用范围。不得因为素材在参考仓库中可见就默认可复制。

---

## 十六、注释和代码维护规范

- 组件文件头注释说明职责、数据来源、生命周期和平台边界；不要只写“某某组件”。
- 复杂 computed/action 注释必须解释为什么存在，尤其是视觉时钟与业务时间分离、主题状态双轨、随机角色固定周期等非直觉设计。
- 样式注释按“设计目的—技术手段—不能破坏的约束”描述，避免逐行翻译 CSS 属性。
- 条件编译注释明确资源或能力为何只用于 H5/App；不能只留下孤立的 `#ifdef`。
- 修复视觉偏移时记录根因，例如字符基线、盒模型、原生 TabBar 层级，而不是只记录最终像素值。
- 修改外观后同步维护本 UI 说明、`260810设计与优化.md` 和 `CHANGELOG.md`，并在写入后重新读取确认。

---

## 十七、验收清单

每次主题或公共组件调整至少检查：

1. H5 使用 390×844 主手机视口，并用 360×800 窄屏补测：首页、设置页、详情、日期、时辰、城市选择器；
2. App 构建，确认无 Vue/Sass 编译错误；
3. 十套外观切换后页面根类和 TabBar 图标同步；
4. 穴位编码开/关后列表和详情排版，不改变穴位点击与查询；
5. 动物详情角色静止、右下角不遮正文，底部场景自然融入；
6. 动物与水墨主题切换动画结束后 TabBar 恢复且可操作；
7. 弹窗关闭按钮在不同字体环境下视觉居中，触控面积不小于约 44px；
8. 页面控制台无新增运行时错误；
9. `npm run build:h5` 与 `npm run build:app` 通过；
10. 设计文档、更新日志和 UI 结构说明与代码一致。
