# 子午流注取穴系统

[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

简体中文 | [English](README_EN.md)

基于中医时间医学的智能化取穴辅助工具，跨平台支持 Android、iOS、微信小程序及 H5。

> ⚠️ **免责声明**：本软件仅供中医学习与研究参考，不构成医疗建议。针灸治疗请在专业医师指导下进行，切勿自行施针。

## 功能特性

### 取穴方法

| 方法 | 说明 |
|------|------|
| **纳甲法** | 按日干支+时干支推算开穴，支持返本还原、合日互用 |
| **纳子法** | 按十二经气血流注时辰推算，支持两种模式：一日六十六穴 / 补母泻子 |
| **灵龟八法** | 按日时干支代数取八脉交会穴（后天八卦） |
| **飞腾八法** | 按日时天干取八脉交会穴（先天八卦） |
| **反克法** | 纳甲法闭穴时的替代方案，支持合并/单独显示模式 |

### 其他功能

- **真太阳时校正** — 根据城市经度与均时差校准地方真太阳时，自动模式可选启用
- **手动查询** — 支持指定任意日期和时辰查询开穴
- **穴位详情** — 弹窗展示定位、操作方法、注意事项等

## 主题系统

4套主题按组件适配当前主题，H5/App 运行时切换：

| 主题 | 名称 | 适用平台 |
|------|------|----------|
| yellow | 古典宣纸 | 全平台 |
| black | 暗夜幽光 | H5/App |
| green | 青瓷天青 | H5/App |
| red | 朱砂丹霞 | H5/App |

- **微信小程序**：仅支持 yellow，不显示主题切换入口
- **H5/App**：支持4主题切换

## 字体方案：楷题宋文

传统中医排版风格：标题用楷体，正文用宋体。

| 字体 | 用途 | 加载方式 |
|------|------|----------|
| 楷体_GB2312（子集化122KB） | 标题、穴位名、干支标签 | 小程序: `font-loader.js` 从生成的 base64 模块加载；H5/App: @font-face |
| 文源宋体（子集化226KB） | 弹窗正文、经络/类别/五行 | 小程序: `font-loader.js` 从生成的 base64 模块加载；H5/App: @font-face |
| 文源宋体Bold（子集化23KB） | 正文加粗区域 | 小程序: 未单独动态加载，回退到常规宋体/系统字体；H5/App: @font-face |

## 开发与验证

```bash
npm install
npm run dev:h5
npm run build:h5
npm run build:mp-weixin
npm run fonts:base64
node tests/verify-lingui-fix.js
node tests/verify-algorithms.js
```

- App 产品版本以 `src/manifest.json` 的 `versionName` / `versionCode` 为准；`package.json` 版本保持同步。
- `patches/*.patch` 由 `patch-package` 在 `postinstall` 阶段自动应用，用于修复小程序端依赖中的废弃 API 调用。
- 修改字体 TTF 后先运行 `npm run fonts:base64`，同步小程序端 `loadFontFace` 使用的 base64 生成模块。
- 当前 DCloud Vue3 工具链将 `@dcloudio/vite-plugin-uni` 的 peer 依赖精确锁定为 `vite@5.2.8`（2026-06 核验，新版 alpha 仍锁定 5.2.8）。`npm audit` 中 Vite/esbuild 相关项主要属于开发服务器与构建链风险；不要直接运行 `npm audit fix --force`，优先限制 dev server 只在本机/可信网络使用，并等待 DCloud 放宽或升级 Vite。
- 仓库目前没有 `npm test` 脚本，算法校验需直接运行上面的 `node tests/...` 脚本。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | uni-app (Vue 3 + DCloud 锁定的 Vite 5.2.8) |
| 状态管理 | Pinia + pinia-plugin-persist-uni |
| 样式 | SCSS + 组件主题适配（H5/App 运行时切换） |
| 日期计算 | lunar-javascript（农历/干支） |

## 系统要求

- Android 5.0+ / iOS 9.0+
- 微信小程序基础库 2.30.0+
- Node.js 18+

## 项目结构

```
src/
├── services/        # 算法层
│   ├── ganzhi.js    # 干支计算（真太阳时校正、子时翻转）
│   ├── najia.js     # 纳甲法（返本还原、合日互用、反克法）
│   ├── nazi.js      # 纳子法（六十六穴、补母泻子）
│   ├── lingui.js    # 灵龟八法（后天八卦）
│   └── feiteng.js   # 飞腾八法（先天八卦）
├── data/            # 数据层
│   ├── constants.js         # 天干地支/五行/经脉常量
│   ├── eight-points.js      # 八脉八穴共享数据
│   ├── fanke-points.js      # 反克特殊穴位
│   ├── special-points.js    # 五输穴数据
│   └ acupuncture-points-gb2021.json # 穴位库（GB/T 2021）
├── stores/          # Pinia 状态管理
│   └ app.js         # 真太阳时/主题/纳子法模式/反克显示模式持久化
├── pages/           # 页面
│   ├── index/       # 取穴页（时间选择 + 结果展示）
│   └ setting/       # 设置页（全屏弹窗：方法说明、关于）
├── components/      # 组件
│   ├── ResultPanel.vue     # 取穴结果卡片（含闭穴警告）
│   ├── PointDetail.vue     # 穴位详情弹窗（楷题宋文）
│   ├── CityPicker.vue      # 城市选择器（真太阳时）
│   ├── DatePicker.vue      # 日历面板（三端统一）
│   ├── TimePicker.vue      # 时辰选择面板（三端统一）
│   └ AppNavbar.vue         # 顶部自定义导航栏
├── styles/          # 全局样式
│   ├── variables.scss      # SCSS变量
│   ├── themes.scss         # 主题CSS变量定义
│   └ index.scss            # 全局样式 + 字体声明
├── assets/fonts/    # 字体文件（子集化TTF）与小程序base64中间产物
└── static/tabbar/   # TabBar图标（4组主题图标）
```

根目录还包含 `scripts/`（字体重建、资源处理脚本）、`patches/`（patch-package 补丁）和 `tests/`（算法校验脚本）。

## 作者

- **疯不觉**
- GitHub: [@2545022547-fengbujue](https://github.com/2545022547-fengbujue)

## 许可

本项目采用 [GNU Affero General Public License v3.0 or later](LICENSE)（AGPL-3.0-or-later）开源许可。

> **AGPL-3.0 核心要求**：如果你基于本项目修改并部署为网络服务，必须向所有用户提供完整源代码。
