# Change Report

This report explains the current workspace state so another AI agent can continue safely.

Project root:

```text
项目目录\ziwuliuzhu-uniapp
```

## Current Product Decisions

The user wants these constraints preserved:

1. The original app appearance must remain available and unchanged as the default `classic` theme.
2. Theme switching is enabled on H5 and App.
3. WeChat Mini Program must keep the original/default theme and must not show the theme-switching entry.
4. App packaging icons are managed manually by the user. Do not create or edit App packaging icons.
5. TabBar UI icons under `src/static/tabbar` are allowed because they are in-app tabBar assets, not packaging icons.
6. Changes should be simple and surgical. Do not refactor unrelated code.

## Important User Coding Preference

The user provided explicit guidelines:

- Think before coding.
- State assumptions and ambiguity.
- Keep code minimal.
- Touch only lines required by the task.
- Do not delete unrelated comments or code.
- Avoid speculative abstractions.
- Verify with concrete checks.

Future agents should follow these strictly.

## Theme Switching Final State

Theme IDs now are:

```text
classic    古典宣纸
ink        玄黑金篆
celadon    青瓷天青
vermilion  朱砂丹霞
```

Old temporary theme IDs were removed:

```text
herbal
night
```

Do not reintroduce `herbal` or `night` unless the user explicitly asks.

## Theme Platform Rules

In `src/stores/app.js`:

- `classic` is always present.
- Extra themes are conditionally compiled only for H5 and App:

```js
// #ifdef H5 || APP-PLUS
```

- `supportsThemeSwitch` is true only on H5 and App.
- `activeTheme` returns `classic` on unsupported platforms or if persisted storage contains an old/unknown theme ID.
- This protects Mini Program from old persisted values such as `herbal` or `night`.
- `setTheme()` does nothing except reset to `classic` when theme switching is not supported.
- `applyThemeChrome()` returns immediately when theme switching is not supported.
- App (`APP-PLUS`) supports following the system dark theme. `manifest.json` has `app-plus.darkmode: true`, `App.vue` syncs `uni.getSystemInfoSync().theme`, and listens through `uni.onThemeChange` when available.
- `themeMode` is persisted. Default is `system`, so App shows `ink` when the phone system theme is dark. Once the user taps a concrete theme, `setTheme()` changes `themeMode` to `manual` and stops automatic overriding.

Pages should bind their root class with:

```vue
:class="`theme-${store.activeTheme}`"
```

Do not switch this back to `store.theme`, because Mini Program and stale persisted theme IDs need the `activeTheme` guard.

## Theme Files

Main files involved:

```text
src/stores/app.js
src/styles/themes.scss
src/styles/index.scss
src/pages/index/index.vue
src/pages/setting/setting.vue
src/pages/about/about.vue
src/pages/methods/methods.vue
src/components/AppNavbar.vue
```

`src/styles/themes.scss` defines runtime CSS variables for:

- `classic`
- `ink`
- `celadon`
- `vermilion`

The original SCSS variables remain in place. Runtime themes override common classes through CSS variables. This was chosen to avoid a broad styling-system refactor.

The extra theme CSS is wrapped with:

```scss
/* #ifndef MP-WEIXIN */
```

So the Mini Program build only keeps the harmless `theme-classic` variable block and does not include the H5/App-only theme override rules.

After visual screenshot QA, two extra theme override gaps were fixed:

- `.method-tab.active .method-icon` and `.method-tab.active .method-name` now use the theme surface color so active method cards remain readable.
- `.toggle-btn.active .toggle-text` now uses the theme surface color so the auto/manual segmented control remains readable.
- `.section-title` now uses themed secondary text, fixing the nearly invisible merged 反克法 section title in the dark theme.

Later visual feedback found the dark theme still used too much gold. The intended `ink` direction is now:

- Components remain dark/black.
- Gold is used as a small accent for text, borders, selected tabBar color, and key tags.
- Large surfaces such as navbar, panel header, selected method tab, selected auto/manual toggle, and primary buttons should not become large gold blocks in `theme-ink`.

Dark theme capsule controls were also adjusted:

- `ganzhi-toggle` and `nazi-mode-switch` use dark backgrounds with subtle gold borders in `theme-ink`.
- Inactive segmented options stay transparent/dark.
- Setting page switches use `themeSwitchColor`; in `theme-ink` this returns the dark control color instead of gold.
- H5 `uni-switch` internals are overridden in `theme-ink` so the off/on track no longer appears as a white capsule.

## Settings Page Theme Entry

In `src/pages/setting/setting.vue`, the "外观主题" card is wrapped with:

```vue
<!-- #ifndef MP-WEIXIN -->
```

This means H5 and App show theme switching, while WeChat Mini Program does not.

The theme selector uses:

```vue
store.themes
store.activeTheme
store.setTheme(theme.id)
```

On App only, settings also show "跟随系统深色模式". This calls `store.toggleFollowSystemTheme()` and lets users return to system-follow behavior.

Switch controls on the settings page bind their color to:

```vue
:color="store.themePrimaryColor"
```

This prevents the old brown/yellow color from remaining visible after switching themes.

## TabBar Theme Assets

Current tabBar assets:

```text
src/static/tabbar/home.png
src/static/tabbar/home-active.png
src/static/tabbar/home-active-ink.png
src/static/tabbar/home-active-celadon.png
src/static/tabbar/home-active-vermilion.png
src/static/tabbar/setting.png
src/static/tabbar/setting-active.png
src/static/tabbar/setting-active-ink.png
src/static/tabbar/setting-active-celadon.png
src/static/tabbar/setting-active-vermilion.png
```

Removed old generated assets:

```text
src/static/tabbar/home-active-herbal.png
src/static/tabbar/home-active-night.png
src/static/tabbar/setting-active-herbal.png
src/static/tabbar/setting-active-night.png
```

`applyThemeChrome()` uses absolute `/static/...` paths and passes both `iconPath` and `selectedIconPath`. This was done because relative selected icon paths caused broken-image placeholders after tab clicks in at least one environment.

## True Solar Time Fix

Problem fixed:

Before the fix, true solar time correction affected `getGanZhi()` but the hour index used for point calculation still came from the uncorrected device clock.

Files:

```text
src/services/ganzhi.js
src/stores/app.js
src/pages/index/index.vue
```

Current behavior:

- `getTrueSolarDate(date, longitude, useTrueSolarTime)` centralizes correction.
- `updateCurrentTime()` calculates `currentHour` from corrected effective time only when true solar time is enabled.
- `effectiveCurrentTime` is used for display in auto mode.
- Manual mode still disables true solar time correction intentionally:

```js
getGanZhi(date, 116.407, false)
```

When `useTrueSolarTime` is false, no true solar correction is triggered.

## WeChat Mini Program Capsule Fix

File:

```text
src/composables/useSystemInfo.js
```

Fixed a scope bug where system info was declared inside one `try` block and referenced later from another block. The code now keeps `systemInfo` in outer scope and safely falls back to `screenWidth.value`.

## Najia Closed + Fanke Empty Display Rule

Files:

```text
src/components/ResultPanel.vue
src/pages/index/index.vue
```

Current rule:

- If 纳甲法 itself has no `openPoints`, but 反克法 or 合日互用 has open points, do not show 纳甲法's "当前时辰为闭穴" warning box.
- Show only the available fallback取穴 sections: 反克法 and/or 合日互用.
- If 纳甲法、反克法、合日互用 all have no open points, then show the closed warning.
- Do not show an empty 反克法 supplement area.
- This applies to merged mode and separate supplement mode.

## CityPicker Theme Fix (修复.1, 2026-05-17)

Problem: `CityPicker.vue` had all colors hardcoded (`#FFFDF5`, `#2C2C2C`, `#666`, `#999`, etc.), causing extremely low contrast under dark themes like `ink`.

Fix: Replaced all hardcoded colors with `var(--theme-*)` CSS variables:

| Hardcoded | Replaced with |
|-----------|--------------|
| `#FFFDF5` (popup bg) | `var(--theme-surface)` |
| `#2C2C2C` (text) | `var(--theme-text)` |
| `#666` (secondary text) | `var(--theme-text-secondary)` |
| `#999` (hint text) | `var(--theme-text-hint)` |
| `#fff` (input/province bg) | `var(--theme-surface)` |
| `rgba(139,69,19,...)` borders | `var(--theme-border)` |
| `rgba(139,69,19,0.06)` close btn | `var(--theme-surface-muted)` |
| `#F8F4EF` cancel btn bg | `var(--theme-surface-muted)` |
| `#8B4513`/`#6B3410` confirm gradient | `var(--theme-primary)`/`var(--theme-primary-dark)` |

Also fixed: removed `overflow-y: auto` from `.popup-body` (was causing duplicate scrollbars).

Files changed:

```text
src/components/CityPicker.vue
```

## Settings Page Theme Collapsible Panel (修复.1, 2026-05-17)

Problem: The four theme options were always fully visible, taking up vertical space.

Fix: Added a collapsible panel — default state shows only the current theme (swatch + name + description + expand arrow), click to expand all four options.

Changes in `src/pages/setting/setting.vue`:

- Added `themeExpanded` ref (default `false`)
- Added `activeThemeName` and `activeThemeDesc` computed properties
- New `.theme-current` row (swatch + copy + expand arrow) shown by default
- Existing `.theme-options` wrapped in `v-if="themeExpanded"`
- Arrow rotates 90° when expanded

New CSS classes:

```text
.theme-current       — current theme display row
.theme-current-left  — left side (swatch + copy)
.theme-expand-arrow  — expand/collapse arrow
```

Updated `src/styles/themes.scss`:

- `.theme-current` added to `background: var(--theme-surface-muted)` override list
- `.theme-expand-arrow` added to `color: var(--theme-text-hint)` override list

## Agent Attribution

- GPT (prior sessions): theme switching system, SCSS variable definitions, TabBar assets, true solar time fix, najia/fanke display rules
- 修复.1 (2026-05-17): CityPicker theme fix, settings page collapsible theme panel

## Verification

The following builds passed after the latest changes:

```bash
npm run build:h5
npm run build:mp-weixin
```

Known warnings still appear:

```text
os - Alias not found.
DEPRECATION WARNING [legacy-js-api]: The legacy JS API is deprecated...
```

These warnings are pre-existing project/toolchain warnings and were not introduced by the changes.

## What Not To Do

Do not:

- Replace the whole SCSS system with CSS variables.
- Recreate App packaging icons.
- Reintroduce `herbal` or `night`.
- Change Mini Program to show theme switching.
- Bind page classes to `store.theme` instead of `store.activeTheme`.
- Change acupuncture algorithms while working on themes.
- Remove unrelated comments or "clean up" adjacent code.

## Suggested Manual QA

If continuing this work, manually check:

1. H5 settings page shows four themes.
2. H5 theme switching changes page, navbar, capsule switch, settings switches, and bottom tabBar colors.
3. App settings page shows four themes and tabBar selected icons do not show broken placeholders.
4. WeChat Mini Program settings page does not show "外观主题".
5. WeChat Mini Program keeps the original classic appearance.
6. CityPicker popup has correct contrast under `ink` and `celadon` themes (no dark-on-dark text).
7. CityPicker popup has no duplicate scrollbars.
8. Settings page theme options default to collapsed; click to expand/collapse works.

## Font System: WenYuanSerifSC Subset (修复.1, 2026-05-17)

Replaced the previous WenJinMincho font with WenYuanSerifSC-Medium, subset to 439 characters (143KB).

**Subset character set composition**:
- Base 380 chars: point names, meridians, point categories, wuxing, tiangan/dizhi, etc.
- UI label chars: "基信定位功能主治操作方法注意事项所属经络穴类别五行属性针刺艾灸"
- Nazi tip chars: "此穴为母子经脉虚实证在经气方衰时取行补泻法当前辰"
- Method name chars: "纳甲法子灵龟八飞腾反克"
- Punctuation

**Font loading**:
- H5/App: `@font-face` in `src/styles/index.scss`, conditional compiled `#ifndef MP-WEIXIN`
- WeChat Mini Program: base64 inline in `src/App.vue` `onLaunch`, loaded via `uni.loadFontFace({ family: 'WenYuanSerifSC' })`

**⚠️ Font Update Iron Rule** (must follow every time subsetting changes):
1. Generate new `.ttf` file
2. Update App.vue base64 string (Mini Program reads base64, not ttf file)
3. Change @font-face filename to include version number (e.g., `wenjinmincho-subset-v2.ttf`) to bust H5 browser cache
4. Delete old `.ttf` file

**Bug: App.vue base64 not synced**:
- Symptom: Some characters appear thin/light (falling back to system font) while others appear bold (custom font)
- Root cause: After regenerating the ttf, the base64 in App.vue was still the old version (148960 chars vs new 195776 chars)
- Fix: Regenerate base64 from current ttf and replace in App.vue

**Bug: H5 browser cache**:
- Symptom: Same as above on H5 even though ttf file was correct
- Root cause: Vite dev server @font-face URL has no hash, browser caches old font file
- Fix: Renamed font file from `wenjinmincho-subset.ttf` to `wenjinmincho-subset-v2.ttf`
- Note: Vite strips `?v=xxx` query params from @font-face URLs, so query-string busting doesn't work

**PointDetail font-family**:
```scss
$font-songti: 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;
```
- `.location-text` uses `inherit` (system default), not `$font-songti`
- All other text sections use `$font-songti`

**PointDetail formatCategory**:
```js
function formatCategory(category, wuxing) {
  if (!category) return ''
  return category.replace(/、/g, wuxing ? ' ' : '，')
}
```
- With wuxing: "络穴、八脉交会穴" → "络穴 八脉交会穴" (horizontal layout with space)
- Without wuxing: "络穴、八脉交会穴" → "络穴，八脉交会穴" (comma separated)

## NaziMode Persistence (修复.1, 2026-05-17)

Added `naziMode` to Pinia persistence paths so the "六十六穴 / 补母泻子" switch state survives app restarts.

Before:
```js
paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod', 'fankeDisplayMode', 'theme', 'themeMode']
```

After:
```js
paths: ['useTrueSolarTime', 'longitude', 'selectedCity', 'activeMethod', 'naziMode', 'fankeDisplayMode', 'theme', 'themeMode']
```

## Agent Attribution (Updated)

- GPT (prior sessions): theme switching system, SCSS variable definitions, TabBar assets, true solar time fix, najia/fanke display rules
- 修复.1 (2026-05-17): CityPicker theme fix, settings page collapsible theme panel, WenYuanSerifSC font subsetting, base64 sync fix, browser cache bust, naziMode persistence
- 修复 (2026-05-17): font character set expansion completion (App.vue base64 update, three-platform build verification), ganzhi-tag font change (KaitiGB2312 → WenYuanSerifSC due to missing kern table)

## Font Character Set Expansion: Tiangan/Dizhi + Year/Month/Day/Hour (修复.1 → 修复, 2026-05-17)

### Problem

User feedback: Current time bar "某某年某某月某某日某某时" (GanZhi labels) showed inconsistent font thickness — some characters bold (custom font), some thin (system fallback).

**Root cause**: Both KaitiGB2312 and WenYuanSerifSC subsets lacked tiangan/dizhi and year/month/day/hour characters.

### Solution

Expanded character sets for both fonts:

| Font | Before | After | File Size | New Characters |
|------|--------|-------|-----------|----------------|
| KaitiGB2312 (楷体) | 370 chars | 410 chars | 118.1KB | Tiangan/Dizhi + year/month/day/hour related |
| WenYuanSerifSC (宋体) | 439 chars (v2) | 471 chars (v3) | 151.7KB | Same |

**Added characters**: `丙丁戊己庚辛壬癸丑寅卯巳午未酉戌亥年时零一七八九十百千万分秒初正刻闰周季度季节春夏秋冬当前查询间`

### Files Changed

**New files**:
- `src/static/fonts/wenjinmincho-subset-v3.ttf` (宋体新版本)

**Deleted files**:
- `src/static/fonts/wenjinmincho-subset-v2.ttf` (宋体旧版本)
- `src/static/fonts/wenjinmincho-subset.ttf` (宋体更早版本)

**Modified files**:
- `src/static/fonts/kaiti-gb2312.ttf` (扩充字符集)
- `src/styles/index.scss` 第35行：@font-face引用从v2改为v3
- `src/App.vue`：更新楷体和宋体的base64字符串（小程序loadFontFace）

### Key Technical Points

- Kaiti source font changed: from system `simkai.ttf` to user-specified `系统目录\字体库\楷体_GB2312.ttf` (原字体缺"辰"字)
- Songti source font: `<FONT_SOURCE_DIR>/WenYuanSerifSC-Medium.ttf`
- WeChat Mini Program font loading: `uni.loadFontFace({ source: 'url("data:font/ttf;base64,...")' })` — must update base64
- H5 font loading: @font-face reads ttf file, version bump v2→v3 to bust browser cache

### Affected Display Code

`src/pages/index/index.vue` 第72-81行：
```vue
{{ store.currentGanZhi.year.ganZhi }}年
{{ store.currentGanZhi.month.ganZhi }}月
{{ store.currentGanZhi.day.ganZhi }}日
{{ store.currentGanZhi.hour.ganZhi }}时
```
CSS class: `.ganzhi-tag-text`, font-family: `'KaitiGB2312'`

### ⚠️ Font Update Iron Rule (MUST follow)

Every time subsetting ttf, must sync ALL 4 steps:
1. ✅ Generate new ttf file
2. ✅ Update App.vue base64 string (Mini Program reads base64, not ttf file)
3. ✅ Change @font-face filename version number (bust H5 browser cache)
4. ✅ Delete old ttf file

### Bug: Binary replacement truncation

- Symptom: `Unexpected token, expected "," (19:161368)`, `success()` callbacks dropped from 2 to 0
- Root cause: Python regex `data.find(b"')", b64_start)` matched a `')` sequence inside base64 itself, truncating the code
- Fix: Use regex `[^A-Za-z0-9+/=]` to precisely locate base64 end position

### Bug: Git version missing Songti loadFontFace

- Found: git App.vue only had Kaiti loadFontFace, Songti was added in previous session but not committed
- Fix: Use Python string concatenation to insert Songti loadFontFace block after Kaiti `})`, before `// #endif`

### Bug: Kaiti missing "辰" character

- Cause: `<WINDOWS_DIR>/Fonts/simkai.ttf` does not contain "辰"
- User specified: Use `系统目录\字体库\楷体_GB2312.ttf`
- Fix: Re-subset with user-specified source font

## scroll-view Flex Layout Fix (修复, 2026-05-17)

### Problem

- `index.vue` (取穴页) 飞腾八法底部内容截断
- `setting.vue` 弹窗滚动区底部截断
- H5 iframe 环境 `screenHeight` ≠ `windowHeight`，JS计算scrollHeight总是不准
- scroll-view `show-scrollbar` 属性在H5端无效，滚动条仍然可见

### Solution

**废弃 JS 计算，改用 flex 布局**：

```scss
// 页面容器
.page-scroll-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// scroll-view
.scroll-view {
  flex: 1;
  height: 0;  // 关键：防止内容撑开，严格按flex分配
  overflow: hidden;
}
```

**全局隐藏滚动条**（H5必须用CSS）：
```scss
::-webkit-scrollbar { display: none; width: 0!important; height: 0!important; }
html, body { scrollbar-width: none; -ms-overflow-style: none; }
```

### Files Changed

```text
src/pages/index/index.vue      — 删除scrollHeight计算，改用flex
src/pages/setting/setting.vue  — 删除scrollAreaHeight计算，改用flex
src/styles/index.scss          — 全局滚动条隐藏
src/composables/useSystemInfo.js — 移除screenHeight/windowHeight导出
```

## Fullscreen Popup for Settings (修复, 2026-05-17)

### Problem

点击"取穴方法说明"/"关于"跳转页面时有白闪（H5 iframe环境）。

### Solution

从 `navigateTo` 跳转改为设置页内全屏弹窗：
- `showMethods`/`showAbout` ref 控制 `v-if` 显示
- `.fullscreen-overlay` 遮罩 + `.fullscreen-panel` 内容面板
- 方法说明内容（methodDescs数据）和关于内容直接内联
- 返回键拦截：弹窗打开时关闭弹窗，否则跳转取穴页

### Files Changed

```text
src/pages/setting/setting.vue  — 添加fullscreen弹窗结构+返回键拦截
src/styles/themes.scss         — 补充fullscreen-panel/header/title覆盖
pages.json                     — setting页面补充backgroundColor
```

## Close Button Platform Differentiation (修复, 2026-05-17)

### Problem

设置页弹窗关闭按钮和微信胶囊重叠，无法点击。

### Solution

**CSS 条件编译方案**（比模板条件编译更简洁）：

```scss
.close-btn {
  /* #ifndef MP-WEIXIN */
  margin-left: auto;  // H5/App：推到右侧
  /* #endif */
}
```

- 微信小程序：关闭按钮在左侧（避开胶囊）
- H5/App：关闭按钮在右侧（符合常规习惯）
- DOM 结构统一，视觉位置由CSS控制

## Najia Closed Warning Logic Fix (修复, 2026-05-17)

### Problem

点击"单独显示反克法"后，纳甲法闭穴红框警告消失。

### Root Cause

`showClosedWarning` computed 不区分合并/单独模式：
```js
// 原逻辑：只要有fanke或alternative开穴就不显示警告
if (fankeHasOpenPoints || alternativeHasOpenPoints) return false
```

### Solution

区分 `store.fankeDisplayMode`：
```js
const showClosedWarning = computed(() => {
  if (!result.value?.isClosed) return false
  if (isNajia.value) {
    if (store.fankeDisplayMode === 'separate') {
      // 单独模式：只看纳甲法本身和合日互用
      return !alternativeHasOpenPoints.value
    }
    // 合并模式：看反克法+合日互用
    return !(fankeHasOpenPoints.value || alternativeHasOpenPoints.value)
  }
  return true
})
```

## Return Key Interception (修复, 2026-05-17)

### Implementation

使用 `onBackPress` 生命周期钩子：

**取穴页(index.vue)**：
```js
onBackPress(() => {
  if (store.selectedPoint) {
    store.closeDetail()  // 穴位弹窗打开时关闭弹窗
    return true
  }
  return false  // 不拦截（退出应用或不做处理）
})
```

**设置页(setting.vue)**：
```js
onBackPress(() => {
  if (cityPickerRef.value?.isOpen) {
    cityPickerRef.value.close()
    return true
  }
  if (showMethods.value) { showMethods.value = false; return true }
  if (showAbout.value) { showAbout.value = false; return true }
  uni.switchTab({ url: '/pages/index/index' })  // 跳转取穴页
  return true
})
```

**CityPicker组件**：暴露 `isOpen` computed 供父页面判断。

## Other UI Fixes (修复, 2026-05-17)

| Issue | Fix |
|-------|-----|
| CityPicker双滚动条 | 删除 `.popup-body` 的 `overflow-y: auto` |
| 主题展开列表重复显示当前主题 | 用 `otherThemes` computed 过滤掉当前已选主题 |
| classic主题描述 | "保留当前默认外观" → "经典默认风格" |
| 穴位弹窗五行属性条件显示 | `v-if="point?.wuxing"` + `info-grid-center` class居中 |
| 弹窗顶部白色 | `fullscreen-overlay` 改为实色背景 `$tcm-bg` |
| 首页导航栏标题居中 | `left: 50% + transform: translateX(-50%)` + 移除胶囊预留逻辑 |
| 楷体缺字"取方说于流" | 补充字符 410→415字，App.vue base64更新 |

## Agent Attribution (Final)

| Agent | Contributions |
|-------|---------------|
| GPT (prior) | theme switching system, SCSS variables, TabBar assets, true solar time, najia/fanke display |
| 修复.1 | CityPicker theme fix, collapsible theme panel, WenYuanSerifSC font subsetting, base64 sync |
| 修复 (2026-05-17) | scroll-view flex布局, fullscreen弹窗, 返回键拦截, close-btn平台差异化, najia闭穴警告逻辑, 楷体字符补充 |

## Key Lessons Learned

1. **uni-app 平台差异化**：CSS 条件编译比模板条件编译更简洁可靠（例：close-btn位置）
2. **scroll-view 高度**：用 flex + `height:0`，不要用 JS 计算 scrollHeight
3. **H5 iframe 环境**：`screenHeight` ≠ `windowHeight`，JS计算总是不准
4. **字体更新铁律**：ttf → base64 → @font-face版本号 → 删除旧ttf（四步必须同步）
5. **反克法显示模式**：影响纳甲法闭穴警告逻辑，需区分 merged/separate
