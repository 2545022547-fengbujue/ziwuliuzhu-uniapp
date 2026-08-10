# 子午流注取穴 UI 结构说明

## 一、整体架构

### 1.1 页面层级

```
App.vue (应用入口)
├── pages/index/index.vue (取穴主界面 - TabBar首页)
│   ├── AppNavbar (导航栏)
│   ├── ResultPanel (主结果面板)
│   ├── PointDetail (穴位详情弹窗)
│   ├── DatePicker (日历面板)
│   ├── TimePicker (时辰面板)
│   └── 手动查询确认弹窗
│
└── pages/setting/setting.vue (设置页 - TabBar第二页)
    ├── AppNavbar (导航栏)
    ├── CityPicker (城市选择弹窗)
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
| UI | showDetail, selectedPoint | 穴位详情弹窗状态 |
| UI | theme | 当前主题：yellow/black/green/red |
| 真太阳时 | useTrueSolarTime, longitude, selectedCity | 真太阳时校正设置 |

数据流（声明式 computed）：
```
用户操作 → 修改状态 → currentGanZhi 自动重算 → results 自动重算 → ResultPanel 响应式更新
```

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

### 2.2 四套主题CSS变量（themes.scss）

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
