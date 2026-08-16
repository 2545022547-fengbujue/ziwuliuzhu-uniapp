# Ziwu Liuzhu Acupuncture Point Selection System

[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

[简体中文](README.md) | English

An intelligent acupuncture point selection assistant based on Traditional Chinese Medicine (TCM) time-based theories. Cross-platform support for Android, iOS, WeChat Mini Program, and H5.

> ⚠️ **Disclaimer**: This software is for TCM learning and research purposes only, not medical advice. Acupuncture treatment should be performed under professional physician guidance.

## Features

### Acupuncture Methods

| Method | Description |
|--------|-------------|
| **Na Jia Fa** | Calculates opening points based on day/time Gan-Zhi (stem-branch). Supports "Fan Ben Huan Yuan" (returning to source) and "He Ri Hu Yong" (mutual use on combined days) |
| **Na Zi Fa** | Calculates points based on the 12 meridians' Qi-blood circulation cycle. Two modes: Daily 66 Points / Tonifying Mother & Sedating Child |
| **Ling Gui Ba Fa** | Selects 8 Extra Meridian Confluence Points based on day/time Gan-Zhi numerology (Later Heaven Bagua) |
| **Fei Teng Ba Fa** | Selects 8 Extra Meridian Confluence Points based on day/time Heavenly Stems (Earlier Heaven Bagua) |
| **Fan Ke Fa** | Alternative method when Na Jia Fa has no opening points. Supports merged/separate display modes |

### Other Features

- **True Solar Time Correction** — Adjusts time based on city longitude and the equation of time. Optional in automatic mode
- **Manual Query** — Query opening points for any specified date and time period (Shichen)
- **Acupuncture Point Details** — Popup showing location, operation method, precautions, etc.

## Theme System

4 themes are adapted at component level, with runtime switching on H5/App:

| Theme | Name | Platform |
|-------|------|----------|
| yellow | Classic Paper | All platforms |
| black | Dark Night Glow | H5/App |
| green | Celadon Blue | H5/App |
| red | Vermilion Red | H5/App |

- **WeChat Mini Program**: Only yellow theme, no theme switcher UI
- **H5/App**: Full 4-theme support

## Typography: Kaiti for Titles, Songti for Body

Traditional Chinese medical text style: Kaiti (楷体) for titles, Songti (宋体) for body text.

| Font | Usage | Loading Method |
|------|-------|----------------|
| Kaiti GB2312 (subset 122KB) | Titles, point names, Gan-Zhi labels | Mini Program: `font-loader.js` loads the generated base64 module; H5/App: @font-face |
| WenYuan Serif (subset 226KB) | Popup body text, meridian/category/element | Mini Program: `font-loader.js` loads the generated base64 module; H5/App: @font-face |
| WenYuan Serif Bold (subset 23KB) | Bold body text areas | Mini Program: not loaded separately and falls back to regular serif/system fonts; H5/App: @font-face |

## Development And Verification

```bash
npm install
npm run dev:h5            # Dev preview → http://localhost:5174
npm run build:h5          # H5 build
npm run build:mp-weixin   # WeChat Mini Program build
npm run test:builds       # Dual-end build + MP isolation check + app build
npm test                  # 273 vitest unit tests + data gates (algorithms/data/fonts)
npm run fonts:base64      # Sync Mini Program base64 font module after TTF changes
```

- The App product version is sourced from `versionName` / `versionCode` in `src/manifest.json`; keep `package.json` in sync.
- `patches/*.patch` files are applied by `patch-package` during `postinstall` to patch deprecated API usage in Mini Program dependencies.
- After changing TTF files, run `npm run fonts:base64` to sync the generated base64 module used by Mini Program `loadFontFace`.
- The current DCloud Vue3 toolchain pins the `@dcloudio/vite-plugin-uni` peer dependency to exactly `vite@5.2.8` (verified in 2026-06; newer alpha builds still pin 5.2.8). Vite/esbuild findings from `npm audit` are mainly dev-server/build-tooling risks; do not run `npm audit fix --force`. Keep the dev server limited to local/trusted networks and wait for DCloud to relax or upgrade Vite.
- Algorithm correctness is guarded by a five-layer verification system (golden cases / structural invariants / data contracts / authoritative examples / textbook & paper formulas). See `docs/` navigation and AGENTS.md.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | uni-app (Vue 3 + DCloud-pinned Vite 5.2.8) |
| State Management | Pinia + pinia-plugin-persist-uni |
| Styling | SCSS + component-level theme adaptation (H5/App runtime switching) |
| Date Calculation | lunar-javascript (lunar calendar / Gan-Zhi) |

## System Requirements

- Android 5.0+ / iOS 9.0+
- WeChat Mini Program base library 2.30.0+
- Node.js 18+

## Project Structure

```
src/
├── services/        # Algorithm Layer
│   ├── ganzhi.js    # Gan-Zhi calculation (true solar time, Zi-hour rollover)
│   ├── najia.js     # Na Jia Fa (returning to source, mutual use, Fan Ke)
│   ├── nazi.js      # Na Zi Fa (66 points, tonifying/sedating)
│   ├── lingui.js    # Ling Gui Ba Fa (Later Heaven Bagua)
│   └── feiteng.js   # Fei Teng Ba Fa (Earlier Heaven Bagua)
├── data/            # Data Layer
│   ├── constants.js         # Gan-Zhi / Five Elements / Meridian constants
│   ├── eight-points.js      # 8 Extra Meridian confluence points
│   ├── fanke-points.js      # Fan Ke special points
│   ├── special-points.js    # Five Shu points data
│   └ acupuncture-points-gb2021.json # Acupuncture points library (GB/T 2021)
├── stores/          # Pinia State Management
│   └ app.js         # Persisted: true solar time / theme / Na Zi mode / Fan Ke display mode
├── pages/           # Pages
│   ├── index/       # Main page (time selection + results display)
│   └ setting/       # Settings page (fullscreen popup: methods, about)
├── components/      # Components
│   ├── ResultPanel.vue     # Acupuncture result cards (with closed-point warning)
│   ├── PointDetail.vue     # Point detail popup (Kaiti-Songti typography)
│   ├── CityPicker.vue      # City picker (for true solar time)
│   ├── DatePicker.vue      # Calendar panel (cross-platform unified)
│   ├── TimePicker.vue      # Time period picker (cross-platform unified)
│   └ AppNavbar.vue         # Custom top navigation bar
├── styles/          # Global Styles
│   ├── variables.scss      # SCSS variables
│   ├── themes.scss         # Theme CSS variable definitions
│   └ index.scss            # Global styles + font declarations
├── assets/fonts/    # Font files (subset TTF) and Mini Program base64 intermediates
└── static/tabbar/   # TabBar icons (4 theme variants)
```

The repository root also contains `scripts/` (font rebuild and asset scripts), `patches/` (patch-package patches), and `tests/` (algorithm verification scripts).

## Author

- **Feng Bu Jue**
- GitHub: [@2545022547-fengbujue](https://github.com/2545022547-fengbujue)

## License

This project is licensed under [GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later).

> **AGPL-3.0 Core Requirement**: If you modify this project and deploy it as a network service, you must provide the complete source code to all users.
