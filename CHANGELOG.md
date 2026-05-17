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
