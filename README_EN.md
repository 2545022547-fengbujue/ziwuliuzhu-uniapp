# Ziwu Liuzhu Acupuncture Point Selection System

[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

简体中文 | [English](README_EN.md)

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

- **True Solar Time Correction** — Adjusts time based on city longitude/latitude. Optional in automatic mode
- **Manual Query** — Query opening points for any specified date and time period (Shichen)
- **Acupuncture Point Details** — Popup showing location, indications, operation method, precautions, etc.

## Theme System

4 themes via CSS variables for runtime switching:

| Theme | Name | Platform |
|-------|------|----------|
| classic | Classic Default | All platforms |
| ink | Black & Gold | H5/App |
| celadon | Celadon Green | H5/App |
| vermilion | Vermilion Red | H5/App |

- **WeChat Mini Program**: Only classic theme, no theme switcher UI
- **H5/App**: Full 4-theme support + App follows system dark mode

## Typography: Kaiti for Titles, Songti for Body

Traditional Chinese medical text style: Kaiti (楷体) for titles, Songti (宋体) for body text.

| Font | Usage | Loading Method |
|------|-------|----------------|
| Kaiti GB2312 (subset 415 chars) | Titles, point names, Gan-Zhi labels | Mini Program: base64 inline; H5/App: @font-face |
| WenYuan Serif (subset 471 chars) | Popup body text, meridian/category/element | Mini Program: base64 inline; H5/App: @font-face |
| WenYuan Serif Bold (subset 53 chars) | Bold body text areas | Mini Program: base64 inline; H5/App: @font-face |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | uni-app (Vue 3 + Vite) |
| State Management | Pinia + pinia-plugin-persist-uni |
| Styling | SCSS + CSS Variables (runtime theme switching) |
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
│   └ app.js         # Persisted: timezone / theme / Na Zi mode / Fan Ke display mode
├── pages/           # Pages
│   ├── index/       # Main page (time selection + results display)
│   └ setting/       # Settings page (fullscreen popup: methods, about)
├── components/      # Components
│   ├── ResultPanel.vue     # Acupuncture result cards (with closed-point warning)
│   ├── PointDetail.vue     # Point detail popup (Kaiti-Songti typography)
│   ├── CityPicker.vue      # City picker (for true solar time)
│   └ AppNavbar.vue         # Bottom navigation bar
├── styles/          # Global Styles
│   ├── variables.scss      # SCSS variables
│   ├── themes.scss         # Theme CSS variable definitions
│   └ index.scss            # Global styles + font declarations
└── static/          # Static Assets
    ├── fonts/              # Font files (subset TTF)
    └ tabbar/               # TabBar icons (4 theme variants)
```

## Author

- **Feng Bu Jue**
- GitHub: [@2545022547-fengbujue](https://github.com/2545022547-fengbujue)

## License

This project is licensed under [GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later).

> **AGPL-3.0 Core Requirement**: If you modify this project and deploy it as a network service, you must provide the complete source code to all users.