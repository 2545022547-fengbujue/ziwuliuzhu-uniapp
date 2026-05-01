# 子午流注取穴 uni-app 移动端 — 开发文档

> 最后更新：2026-05-01（新增：查询确认弹窗、真太阳时自动弹窗、免责声明、应用图标、代码注释更新）
> 项目路径：`D:\WorkBuddyWorkspaces\ziwuliuzhu-uniapp`
> 桌面版（Vue3 + Electron）路径：`D:\WorkBuddyWorkspaces\子午流注取穴`

---

## 一、项目概况

### 1.1 技术栈

| 项目 | 说明 |
|------|------|
| 框架 | uni-app Vue 3 + Vite |
| @dcloudio 版本 | `3.0.0-alpha-5000820260430001`（2026-04-30 最新） |
| 状态管理 | Pinia + pinia-plugin-persist-uni（本地持久化） |
| 样式 | SCSS，全局变量在 `src/styles/variables.scss` |
| 目标平台 | H5（浏览器预览）→ 后续打包 App（Android/iOS） |
| 开发语言 | JavaScript（非 TypeScript） |

### 1.2 项目结构

```
ziwuliuzhu-uniapp/
├── DEV-README.md              # 本开发文档
├── start-server.vbs           # Windows 启动脚本（GBK 编码）
├── manifest.json              # uni-app 全局配置（端口在此设置）
├── pages.json                 # 页面路由配置
├── uni.scss                   # uni-app 全局样式变量（被所有页面自动导入）
├── vite.config.js             # Vite 配置
│
├── src/
│   ├── App.vue                # 根组件（页面可见性事件）
│   ├── main.js                # 入口文件（创建 Pinia 实例）
│   │
│   ├── components/            # 公共组件
│   │   ├── AppNavbar.vue      # 自定义导航栏（适配状态栏高度）
│   │   ├── ResultPanel.vue    # 取穴结果面板 ★核心组件
│   │   ├── PointDetail.vue    # 穴位详情弹窗
│   │   └── CityPicker.vue     # 城市选择弹窗 ★核心组件
│   │
│   ├── pages/
│   │   ├── index/index.vue    # 首页 ★核心页面
│   │   ├── setting/setting.vue # 设置页
│   │   └── about/about.vue    # 关于页
│   │
│   ├── stores/
│   │   └── app.js             # Pinia 全局状态 ★核心文件
│   │
│   ├── services/              # 算法层（从桌面版直接复制，未修改）
│   │   ├── najia.js           # 纳甲法 + 反克法（calculateNajia, calculateFanke）
│   │   ├── nazi.js            # 纳子法（calculateNazi）
│   │   ├── lingui.js          # 灵龟八法（calculateLingui）
│   │   ├── feiteng.js         # 飞腾八法（calculateFeiteng）
│   │   ├── ganzhi.js          # 干支计算（getGanZhi，含真太阳时校正）
│   │   ├── wushi.js           # 五输穴数据查询
│   │   └── lunar-javascript.js # 农历库（第三方）
│   │
│   ├── data/                  # 数据层（从桌面版直接复制，未修改）
│   │   ├── city-coordinates.js # 城市经纬度数据（CITIES 数组 + searchCities 函数）
│   │   ├── point-details.js   # 穴位详细信息（定位、功能、主治等）
│   │   └── ...其他数据文件
│   │
│   ├── styles/
│   │   ├── variables.scss     # 全局 SCSS 变量（颜色、字号、间距、圆角）
│   │   └── index.scss         # 全局样式（卡片、按钮、标签等通用样式）
│   │
│   ├── composables/
│   │   └── useSystemInfo.js   # 获取系统信息（状态栏高度、屏幕高度、安全区）
│   │
│   └── utils/
│       └── date.js            # 日期工具（formatDate、getHourIndexFromDate、HOUR_OPTIONS）
```

---

## 二、启动与调试

### 2.1 启动 H5 开发服务器（推荐方式）

**用 PowerShell Start-Process 启动（独立后台进程，不会被回收）**：

```powershell
powershell -Command "Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'node_modules\vite\bin/vite.js','--host','0.0.0.0' -WorkingDirectory 'D:\WorkBuddyWorkspaces\ziwuliuzhu-uniapp' -WindowStyle Hidden"
```

**为什么不用 `npx uni`**：
- bash 后台启动 (`npx uni &`) 的进程会在命令结束后被回收，服务器频繁挂掉
- PowerShell 的 `Start-Process` 创建独立进程，不会被回收

**为什么不用 npx**：
- PowerShell 环境中 `npm`/`npx` 命令可能因中文用户名路径乱码而失败
- 直接用 `node.exe` + vite.js 路径绕过 npm 脚本

### 2.2 检查服务器状态

```bash
# 检查 localhost
curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/

# 检查局域网（手机访问用这个）
curl -s -o /dev/null -w "%{http_code}" http://10.170.178.224:5174/
```

- 返回 `200`：正常运行
- 返回 `000`：服务器已停止，需要重启

### 2.3 手机预览

1. 电脑和手机连同一个 WiFi（或手机开热点给电脑）
2. 获取电脑 IP：PowerShell 执行 `Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq 'Up' } | Select-Object -ExpandProperty IPv4Address`
3. 当前电脑 IP：`10.170.178.224`（手机热点分配，可能变化）
4. 手机浏览器访问：`http://10.170.178.224:5174/`

**重要**：启动时必须加 `--host 0.0.0.0`，否则只监听 localhost，手机无法访问。

### 2.4 端口问题

- 默认端口 5174（在 `manifest.json` 的 `h5.devServer.port` 中配置）
- 如果 5174 被占用，Vite 会自动递增到 5175、5176...
- 清理被占用的端口：

```powershell
# 查看占用端口的进程
Get-NetTCPConnection -LocalPort 5174 | Select-Object OwningProcess

# 杀掉进程
Stop-Process -Id <PID> -Force
```

### 2.5 npm install 失败

如果 `esbuild EBUSY` 错误：
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 三、核心组件详解

### 3.1 CityPicker.vue — 城市选择弹窗

**功能**：弹窗式城市选择器，支持省份分组展开/收起、搜索城市名称/拼音/首字母。

**调用方式**：
```vue
<template>
  <CityPicker ref="cityPickerRef" />
</template>

<script>
function openCityPicker() {
  cityPickerRef.value.open((cityData) => {
    // cityData = { name, province, longitude, pinyin, abbr }
    store.updateLongitude(cityData.longitude, cityData.name)
  })
}
</script>
```

**内部逻辑**：
- `open(callback)`：显示弹窗，传入确认回调函数
- `close()`：关闭弹窗，重置所有状态
- `handleConfirm()`：用户点确定后，查找城市数据，调用回调，关闭弹窗
- `searchCities(text)`：在 `city-coordinates.js` 中定义，支持中文名、拼音、首字母搜索

**已知坑（非常重要）**：

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 搜索框无法输入 | uni-app `<input>` 在 H5 弹窗中，`@tap.stop` 会阻止 input 的交互事件 | 去掉 `@tap.stop`，改用 `popupTapped` 标记机制 |
| 搜索框无法聚焦 | `v-if`/`v-show` 控制的弹窗中，input 的 focus 状态管理不完整 | 用 `:focus="inputFocused"` + `nextTick + setTimeout` 延迟聚焦 |
| 提示框背景溢出 | `<scroll-view>` 内部元素超出容器宽度 | 所有容器加 `box-sizing: border-box; width: 100%; overflow: hidden` |
| CSS 用 rpx 异常 | rpx 在某些 H5 浏览器上计算不准 | CityPicker 的 CSS 全部用 px 单位 |

**聚焦生命周期管理**：
```
1. 用户点击搜索框 → handleInputTap()
2. 先设置 inputFocused = false（重置状态）
3. nextTick 等 DOM 更新
4. setTimeout 50ms 后设 inputFocused = true（触发聚焦）
5. 用户输入后失焦 → onInputBlur() 设 inputFocused = false
6. 弹窗打开时 → open() 中延迟 300ms 自动聚焦
```

### 3.2 ResultPanel.vue — 取穴结果面板

**功能**：根据取穴方法显示计算结果。

**Props**：
- `method`（String，必填）：取穴方法标识
  - `'najia'` 纳甲法 | `'nazi'` 纳子法 | `'lingui'` 灵龟八法 | `'feiteng'` 飞腾八法 | `'fanke'` 反克法
- `compact`（Boolean，默认 false）：紧凑模式，去掉外边距和阴影

**调用方式**：
```vue
<!-- 主面板（首页） -->
<ResultPanel :method="store.activeMethod" />

<!-- 反克法面板（纳甲法闭穴时显示） -->
<ResultPanel method="fanke" />

<!-- 对比面板（底部其他方法） -->
<ResultPanel :method="m" :compact="true" />
```

**显示内容**（按顺序）：
1. 干支时间行（日期 + 时辰标签）
2. 闭穴警告（红色提示框）
3. 合日互用开穴（闭穴时的替代穴位）
4. 值日/值时经络标签
5. 当前开穴列表（可点击打开详情）
6. 九宫信息（灵龟八法专用）
7. 补泻手法建议

**已知坑**：
- ResultPanel 自带 `margin: 0 $spacing-md $spacing-md`，在反克法卡片中需要覆盖为 `margin: 0`

### 3.3 PointDetail.vue — 穴位详情弹窗

**功能**：显示穴位完整信息。

**调用方式**：通过 store 控制
```js
store.selectPoint(point)  // 打开弹窗
store.closeDetail()       // 关闭弹窗
```

**显示内容**：
1. 头部：穴位名称（楷体）+ 穴位代码（右对齐，小字号），间距 gap: 0px
2. 基本信息：所属经络、穴位类别（去除顿号显示）、五行属性（彩色，20px 加粗）
   - 三个信息栏的内容文字居中，标题（label）左对齐
   - 穴位类别中的顿号在模板层通过 `formatCategory()` 去除，不修改原数据
3. 定位：穴位位置描述
4. 功能主治：功能标签（绿色）+ 主治标签（蓝色）
5. 操作方法：针刺、艾灸
6. 注意事项（红色警告框）

**已知坑**：
- 定位文字换行不美观：用 `word-break: normal; overflow-wrap: break-word` 避免在文字中间断行
- 穴位代码右对齐：用 `align-self: flex-end` + `margin-right: -28px`
- 字体：安卓不支持 KaiTi，font-family 需加 `'KaiTi', '楷体', 'STKaiti', 'FangSong', 'SimSun', serif`
- 五行属性加大加粗：`.wuxing-value { font-size: 20px; font-weight: 700; }`
- 去顿号：`formatCategory(category) { return category.replace(/、/g, ' ') }`

### 3.4 AppNavbar.vue — 导航栏

**功能**：自定义导航栏，适配状态栏高度。Props：`title`（页面标题）。

---

## 四、全局状态管理（stores/app.js）

### 4.1 数据流

```
用户操作 → 修改 Pinia state → 触发计算函数 → 更新 results → 各 ResultPanel 响应式更新
```

### 4.2 状态字段

```js
{
  // === 时间状态 ===
  currentTime: Date,          // 当前系统时间
  currentHour: number,        // 当前时辰索引（0=子时...11=亥时）
  selectedDate: Date,         // 手动模式选择的日期
  selectedHour: number,       // 手动模式选择的时辰索引
  isManualMode: false,        // 是否手动模式（false=自动跟踪当前时间）

  // === 取穴方法 ===
  activeMethod: 'najia',      // 当前主方法（纳甲/纳子/灵龟/飞腾）

  // === 计算结果 ===
  results: {
    najia: null,              // 纳甲法结果
    nazi: null,               // 纳子法结果
    lingui: null,             // 灵龟八法结果
    feiteng: null,            // 飞腾八法结果
    fanke: null               // 反克法结果
  },

  // === 穴位详情 ===
  showDetail: false,          // 是否显示穴位详情弹窗
  selectedPoint: null,        // 当前查看的穴位对象

  // === 真太阳时 ===
  useTrueSolarTime: false,    // 是否启用真太阳时校正
  longitude: 104,             // 当前经度（默认104°，中国大陆中心）
  selectedCity: '北京'        // 当前城市名
}
```

### 4.3 持久化

使用 `pinia-plugin-persist-uni` 持久化到 uni.storage：
- 持久化字段：`useTrueSolarTime`、`longitude`、`selectedCity`、`activeMethod`
- 存储 key：`ziwuliuzhu-app`

### 4.4 关键方法

| 方法 | 说明 |
|------|------|
| `updateCurrentTime()` | 更新当前时间，自动计算所有方法的结果 |
| `queryTime(date, hour)` | 手动查询指定日期和时辰 |
| `switchToAutoMode()` | 切换回自动模式，立即更新 |
| `updateLongitude(longitude, city)` | 更新经度和城市，重新计算 |
| `toggleTrueSolarTime(enabled)` | 开关真太阳时，关闭时重置经度为104 |
| `setActiveMethod(method)` | 切换主显示方法 |
| `selectPoint(point)` | 打开穴位详情弹窗 |
| `closeDetail()` | 关闭穴位详情弹窗 |

### 4.5 干支计算逻辑

`buildGanZhi(date, hourIndex)` 函数：
1. 调用 `getGanZhi(date, longitude, useTrueSolarTime)` 获取年/月/日干支（含真太阳时校正）
2. 用五鼠遁（日上起时法）推算时辰天干：
   - 甲己日起甲子时（索引0）
   - 乙庚日起丙子时（索引2）
   - 丙辛日起戊子时（索引4）
   - 丁壬日起庚子时（索引6）
   - 戊癸日起壬子时（索引8）
3. 返回完整的年/月/日/时干支对象

---

## 五、首页（index.vue）详解

### 5.1 页面结构

```
┌─ AppNavbar（导航栏）
├─ 干支信息卡片（年/月/日/时 标签）
│   ├─ 时间切换区（自动/手动模式切换 + 日期时辰选择）
│   └─ 手动查询需确认后才更新（确认弹窗）
├─ 取穴方法标签栏（纳甲/纳子/灵龟/飞腾）
├─ 主 ResultPanel（当前选中方法的结果）
├─ 反克法补充区（纳甲法闭穴时自动显示）
├─ 其他方法对比区（底部显示其余3种方法）
└─ 穴位详情弹窗 PointDetail（通过 store 控制，默认隐藏）
    手动查询确认弹窗（v-if 控制，默认隐藏）
```

**注意**：真太阳时校正功能已移至设置页，CityPicker 仅在设置页使用。

### 5.2 自动更新机制

```js
// 每秒更新时间显示（仅自动模式下生效）
// 当时辰变动时（如 08:59→09:00），才重新计算取穴结果
onMounted(() => {
  timer = setInterval(() => {
    if (!store.isManualMode) {
      const now = new Date()
      const newHour = getHourIndexFromDate(now)
      store.currentTime = now
      if (newHour !== store.currentHour) {
        store.currentHour = newHour
        store.updateCurrentTime()
      }
    }
  }, 1000)
})
```

**时辰变动检测**：每秒通过 `getHourIndexFromDate(now)` 计算时辰索引（0-11），与 `store.currentHour` 比较。当时钟跨越边界（如 08:59→09:00），索引从 4 变为 5，触发重新计算。

### 5.3 手动查询确认机制

手动模式下，用户选择日期和时辰后，需点击"查询"→弹出确认弹窗→确认后才更新显示和结果。

**核心变量**：
- `selectedDateStr` / `selectedHourIdx`：选择器的当前值（未确认，可随时修改）
- `confirmedDateStr` / `confirmedHourIdx`：已确认的参数（用于显示和计算）
- `showQueryConfirm`：确认弹窗显示状态

**流程**：选择器改动 → 点"查询" → 弹窗确认 → confirmedXxx 更新 → 时间/干支/取穴结果更新

**作用**：防止用户在选择过程中触发实时计算，确保查询结果的准确性。

### 5.3 干支独立计算

首页独立计算 `currentGanZhi`（不直接用 store 的 results），原因：
- store 的 results 只保存各方法的取穴结果
- 首页需要显示完整的干支信息（年/月/日/时），这在 store 中没有单独保存
- 计算逻辑照搬桌面版 TimePicker 的 `currentGanZhi` 计算逻辑

### 5.4 反克法显示逻辑

```js
// 仅纳甲法闭穴时显示反克法补充
const showFankeSupplement = computed(() => {
  return store.activeMethod === 'najia' && store.results.najia?.isClosed
})
```

反克法面板样式用 `:deep()` 穿透覆盖 ResultPanel 的默认样式，增大字号和间距。

---

## 六、已知问题与解决方案

### 6.1 uni-app input 在弹窗中无法聚焦 ★重要

**现象**：CityPicker 弹窗中的搜索框点击无反应，无法输入。PC 和手机都有此问题。

**根因**：
1. uni-app 的 `<input>` 在 H5 模式下编译为 `<uni-input>` 自定义元素
2. 父元素的 `@tap.stop` 会阻止内部所有元素的点击事件传播（包括 input）
3. `v-if`/`v-show` 控制的弹窗中，input 的 focus 状态不会自动重置

**解决方案**（三步）：
1. 去掉 `@tap.stop`，改用 `popupTapped` 标记机制阻止 overlay 关闭
2. 搜索框外层加 `@tap="handleInputTap"` 手动触发聚焦
3. 聚焦生命周期：`false → nextTick → setTimeout(50ms) → true`

**参考来源**：CSDN《uniapp input框聚焦避坑指南》

### 6.2 弹窗背景框右边截断

**现象**：弹窗中的卡片背景框右边被截断，看起来像溢出屏幕。

**根因**：uni-app 的 `<scroll-view>` 在 H5 模式下，内部元素可能超出容器宽度。

**解决方案**：所有卡片容器加 `box-sizing: border-box; width: 100%; overflow: hidden`。

### 6.3 ResultPanel 自带 margin 导致反克法卡片偏小

**现象**：反克法卡片看起来比预期小。

**根因**：ResultPanel 组件有 `margin: 0 $spacing-md $spacing-md` 自带两侧间距。

**解决方案**：在父组件用 `:deep(.result-panel) { margin: 0; }` 覆盖。

### 6.4 字体在不同平台显示差异

**现象**：Android 和 iOS/PC 上字体渲染不同，楷体在 Android 上不可用。

**解决方案**：font-family 加多个 fallback：
```scss
font-family: 'KaiTi', '楷体', 'STKaiti', 'FangSong', 'SimSun', serif;
```

### 6.5 定位文字换行不美观

**现象**：长句在任意字符处换行，导致阅读体验差。

**解决方案**：
```css
word-break: normal;
overflow-wrap: break-word;
line-height: 2;
letter-spacing: 0.5px;
```

### 6.6 开发服务器频繁挂掉

**现象**：服务器运行一段时间后自动停止。

**根因**：bash 后台启动的进程会在命令结束后被回收。

**解决方案**：用 PowerShell `Start-Process node.exe` 启动独立后台进程。

---

## 七、SCSS 变量速查

```scss
// === 主色调（中医古典风格）===
$tcm-primary: #8B4513;        // 棕色 - 主色
$tcm-primary-light: #A0522D;  // 浅棕
$tcm-primary-dark: #6B3410;   // 深棕

// === 辅助色 ===
$tcm-secondary: #5B8C3E;      // 草绿 - 辅助色
$tcm-jade: #2E8B57;           // 翠玉绿
$tcm-water: #1565C0;          // 藏青蓝
$tcm-red: #D32F2F;            // 警告/闭穴
$tcm-gold: #B8860B;           // 金色

// === 背景色 ===
$tcm-bg: #F8F4EF;             // 宣纸底色（页面背景）
$tcm-bg-light: #FFFDF5;       // 卡片底色
$tcm-bg-dark: #F0E6D8;        // 深底色

// === 文字色 ===
$tcm-text: #2C2C2C;           // 主文字
$tcm-text-secondary: #666;    // 辅助文字
$tcm-text-hint: #999;         // 提示文字

// === 五行配色 ===
$wuxing-wood: #2E7D32;        // 木 - 青绿
$wuxing-fire: #D32F2F;        // 火 - 朱红
$wuxing-earth: #F57C00;       // 土 - 琥珀
$wuxing-metal: #B8860B;       // 金 - 暗金
$wuxing-water: #1565C0;       // 水 - 藏青

// === 字号（手机端适调，比桌面版大2-4rpx）===
$font-size-xs: 22rpx;         // 最小（标签、提示）
$font-size-sm: 26rpx;         // 小（辅助文字）
$font-size-base: 30rpx;       // 正文
$font-size-md: 34rpx;         // 中等
$font-size-lg: 38rpx;         // 大（标题）
$font-size-xl: 48rpx;         // 最大

// === 间距（手机端适调）===
$spacing-xs: 10rpx;
$spacing-sm: 18rpx;
$spacing-md: 28rpx;
$spacing-lg: 36rpx;
$spacing-xl: 52rpx;

// === 圆角 ===
$radius-sm: 8rpx;
$radius-md: 16rpx;
$radius-lg: 24rpx;
$radius-xl: 32rpx;
```

---

## 八、从桌面版迁移的注意事项

| 项目 | 桌面版（Vue3 + Electron） | 移动端（uni-app） |
|------|---------------------------|-------------------|
| CSS | Tailwind CSS | 手写 SCSS |
| 存储 | localStorage | uni.getStorageSync / setStorageSync |
| 事件 | @click | @tap（uni-app 推荐） |
| 弹窗 | Teleport + fixed | fixed 定位 + v-if |
| 算法层 | 直接复制，无需修改 | 直接复制，无需修改 |
| 数据层 | 直接复制，无需修改 | 直接复制，无需修改 |
| 单位 | rem / px | rpx（组件用），px（弹窗用） |
| 字体 | 随意使用 | 需要多平台 fallback |

---

## 九、应用图标

### 9.1 图标说明

应用使用仿 Electron Forge 默认的原子轨道图标：
- 黑色圆形背景 + 白色三轨道原子 + 白色原子核
- 用 Python Pillow 生成（1024×1024 像素）

### 9.2 图标文件位置

| 路径 | 说明 |
|------|------|
| `src/static/icons/atom.svg` | 矢量源文件 |
| `src/static/icons/atom.png` | 1024×1024 原图 |
| `src/static/icons/icon.png` | uni-app 应用图标 |
| `src/static/icons/logo.png` | logo 副本 |
| `src/static/logo.png` | H5 页面用（uni-app 默认读取路径） |

### 9.3 如需修改图标

用 Python Pillow 重新生成即可，生成脚本参考 2026-05-01 日记忆。图标需重新云打包才能在 APK 中生效。

---

## 十、Android APK 打包

### 10.1 打包方式

使用 HBuilderX CLI 云端打包，无需本地安装 Android SDK。

### 10.2 打包命令

```bash
"D:/WorkBuddyWorkspaces/HBuilderX/cli" pack \
  --project "D:/WorkBuddyWorkspaces/ziwuliuzhu-uniapp" \
  --platform android \
  --android.packagename "com.ziwuliuzhu.acupuncture" \
  --android.androidpacktype 3
```

- `--android.androidpacktype 3`：使用 DCloud 云端证书
- 包名：`com.ziwuliuzhu.acupuncture`
- AppID：`__UNI__D99F77B`

### 10.3 打包前提

1. DCloud 账号必须绑定手机号
2. AppID 必须在 DCloud 开发者中心创建
3. 项目必须先通过 `cli project open` 导入 HBuilderX
4. HBuilderX 主程序必须在运行中

### 10.4 APK 输出位置

打包完成后 APK 下载到：`C:\Users\黄文路\Downloads\子午流注取穴.apk`

---

## 十一、免责声明

关于页面底部显示免责声明：

> 免责声明：软件所提供的取穴结果仅供参考，不作为任何临床诊疗依据。实际应用中应以临床实际为准，因时、因地、因人，结合患者具体情况进行辨证施治。

---

## 十二、已完成与后续待完成

### 已完成

- [x] 项目骨架搭建（uni-app Vue3 + Vite）
- [x] 算法层/数据层迁移（从桌面版）
- [x] 手机端 UI 适配（字号、间距、弹窗布局）
- [x] 城市选择弹窗优化（input 聚焦、scroll-view、布局溢出）
- [x] 穴位详情弹窗优化（背景截断、排版、五行加粗、去顿号）
- [x] 取穴界面移除真太阳时（仅保留设置页）
- [x] 手动查询确认弹窗机制
- [x] 设置页开启真太阳时自动弹出城市选择
- [x] 应用原子图标生成（黑色背景 + 白色轨道）
- [x] 时间自动更新（每秒刷新，时辰变动时重新计算）
- [x] 代码注释完善
- [x] Git 备份推送到 GitHub
- [x] Android APK 云打包

### 待完成

- [ ] 微信小程序适配（待办 #22）
- [ ] uview-plus 组件库集成（按需使用）
- [ ] 页面切换动画
- [ ] 性能优化（懒加载、分包）
- [ ] 深色模式支持
- [ ] 穴位搜索功能
- [ ] 收藏穴位功能
