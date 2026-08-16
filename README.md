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

**经典四色**（按 `theme` 切换，微信小程序仅支持宣纸色）：

| 主题 | 名称 | 适用平台 |
|------|------|----------|
| yellow | 古典宣纸 | 全平台 |
| black | 暗夜幽光 | H5/App |
| green | 青瓷天青 | H5/App |
| red | 朱砂丹霞 | H5/App |

**六套独立 UI 风格**（按 `uiStyle` 切换，仅 H5/App）：现代简约、水墨意境、莫兰迪、水彩画风、动物岛、像素冒险。主题目录统一在 `src/config/themes.js`，视觉差异由 `src/styles/ui-*.scss` 命名空间覆盖实现。

- **微信小程序**：仅经典四色中的宣纸色，不显示风格切换入口
- **H5/App**：8 种外观运行时切换（含过渡动画，毫秒级，见 `docs/performance-notes.md`）

## 字体方案：楷题宋文

传统中医排版风格：标题用楷体，正文用宋体。

| 字体 | 用途 | 加载方式 |
|------|------|----------|
| 楷体_GB2312（子集化约375KB） | 标题、穴位名、干支标签 | 小程序: `font-loader.js` 从生成的 base64 模块加载；H5/App: @font-face |
| 文源宋体（子集化约843KB） | 弹窗正文、经络/类别/五行 | 小程序: `font-loader.js` 从生成的 base64 模块加载；H5/App: @font-face |
| 文源宋体Bold（子集化约848KB） | 正文加粗区域 | 小程序: 未单独动态加载，回退到常规宋体/系统字体；H5/App: @font-face |
| LXGW ZhenKai Slab GB（子集化约820KB） | 水墨/莫兰迪/水彩主题标题 | H5/App: @font-face（小程序端仅作回退） |
| 华文行楷（子集化约610KB） | 水墨主题主展示字体 | H5/App: @font-face |

## 开发与验证

```bash
npm install
pip install -r requirements-dev.txt   # 字体回归门禁需要 Python fonttools（受管控环境建议用 venv）
npm run dev:h5            # 开发预览 → http://localhost:5174
npm run build:h5          # H5 构建（构建前先 rm -rf dist/build/h5）
npm run build:mp-weixin   # 微信小程序构建
npm run test:builds       # 三端构建 + MP 产物隔离校验（h5 → mp-weixin → app）
npm test                  # vitest 269 条单测 + 数据门禁（算法/数据/字体回归）
npm run fonts:base64      # 修改字体 TTF 后同步小程序 base64 字体模块
```

### 常见环境问题

- **Alpine/musl 容器报 `Cannot find module @rollup/rollup-linux-x64-musl`**：npm 的 optionalDependencies 安装缺陷，临时安装一次即可：`npm install --no-save @rollup/rollup-linux-x64-musl@4.14.3`。
- **`pip install fonttools` 报 externally-managed-environment（PEP 668）**：创建项目内虚拟环境：
  `python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt`；运行测试时用 `PATH="$(pwd)/.venv/bin:$PATH" npm test`。
- **`npm test` 的字体门禁缺依赖时会直接给出安装命令**，不再输出裸 `ModuleNotFoundError`。
- **开发服务器默认监听 `0.0.0.0`**（`vite.config.js`），会把页面暴露到局域网；仅在可信网络使用，或临时改为 `host: '127.0.0.1'`。

- App 产品版本以 `src/manifest.json` 的 `versionName` / `versionCode` 为准；`package.json` 版本保持同步。
- `patches/*.patch` 由 `patch-package` 在 `postinstall` 阶段自动应用，用于修复小程序端依赖中的废弃 API 调用。
- 修改字体 TTF 后先运行 `npm run fonts:base64`，同步小程序端 `loadFontFace` 使用的 base64 生成模块。
- 当前 DCloud Vue3 工具链将 `@dcloudio/vite-plugin-uni` 的 peer 依赖精确锁定为 `vite@5.2.8`（2026-06 核验，新版 alpha 仍锁定 5.2.8）。`npm audit` 中 Vite/esbuild 相关项主要属于开发服务器与构建链风险；不要直接运行 `npm audit fix --force`，优先限制 dev server 只在本机/可信网络使用，并等待 DCloud 放宽或升级 Vite。
- 算法正确性由五层防护保证（黄金用例/结构不变量/数据契约/权威范例/教材论文公式），详见 `docs/` 文档导航与 AGENTS.md。

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
│   ├── ganzhi.js    # 干支计算（真太阳时校正、子时翻转、五鼠遁）
│   ├── najia.js     # 纳甲法（返本还原、遇输过原、合日互用、反克法）
│   ├── nazi.js      # 纳子法（六十六穴、补母泻子）
│   ├── lingui.js    # 灵龟八法（后天八卦）
│   └── feiteng.js   # 飞腾八法（先天八卦）
├── composables/     # 页面共享逻辑（useHomePage/useSettingPage/useRootClasses/useSystemInfo）
├── data/            # 数据层
│   ├── constants.js         # 天干地支/五行/经脉常量
│   ├── eight-points.js      # 八脉八穴共享数据
│   ├── fanke-points.js      # 反克特殊穴位
│   ├── special-points.js    # 五输穴数据
│   └── acupuncture-points-gb2021.json # 穴位库（GB/T 2021）
├── config/          # 主题目录单一事实来源（themes.js）
├── stores/          # Pinia 状态管理（app.js：算法编排 + 外观 + 持久化 schema 版本化）
├── pages/           # 页面壳层（v-if 分发主题组件 + provide 注入）
├── views/           # 14 个主题薄壳组件 + _shared/ 公共布局（HomeLayout/SettingLayout/ThemeSwitch）
├── components/      # 共享业务组件（ResultPanel/PointGrid/PointDetail/DatePicker/TimePicker/CityPicker/AppNavbar/ThemeTransitionOverlay）
├── styles/          # 全局样式（themes.scss + ui-*.scss 命名空间覆盖，index.scss 控制 @use 顺序）
├── assets/fonts/    # 字体文件（子集化TTF）与小程序base64中间产物
└── static/tabbar/   # TabBar图标（各外观主题图标）
```

根目录还包含 `scripts/`（字体重建、资源处理、校验脚本）、`patches/`（patch-package 补丁）、`tests/`（vitest 测试与数据校验）、`docs/`（文档）。

## 文档导航

| 文档 | 内容 |
|------|------|
| `docs/architecture/UI结构说明.md` | UI 结构与组件体系详解（经典四色+六套外观、主题切换、平台边界） |
| `docs/design-history/2026-08-12设计与优化.md` | 2026-08-10~12 设计/实现/验证历史记录 |
| `docs/guides/AI快速入手指南.md` | AI/开发者快速上手（技术栈、结构、约定速览） |
| `docs/performance-notes.md` | 性能优化量化与决策（主题切换毫秒级、异步预取、lunar 裁剪评估） |
| `docs/references/` | 算法验证权威论文（佟佳恒纳甲四定律、张雨辰干支公式） |
| `docs/dev-environment/国内镜像源使用教程.md` | 国内开发环境/镜像配置 |
| `docs/code-snapshots/` | Repomix 代码打包产物（旧版归档；最新版由 git hook 生成于 `项目目录/20260426183326/`） |
| `CHANGELOG.md` | 版本变更记录 |
| `AGENTS.md` | 面向 AI 的完整协作文档（算法概念、测试体系、工程教训；本地文件不推送） |

## 作者

- **疯不觉**
- GitHub: [@2545022547-fengbujue](https://github.com/2545022547-fengbujue)

## 许可

本项目采用 [GNU Affero General Public License v3.0 or later](LICENSE)（AGPL-3.0-or-later）开源许可。

> **AGPL-3.0 核心要求**：如果你基于本项目修改并部署为网络服务，必须向所有用户提供完整源代码。
