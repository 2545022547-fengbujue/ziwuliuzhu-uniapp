# 子午流注取穴系统

[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

基于中医时间医学的智能化取穴辅助工具，跨平台支持 Android、iOS、微信小程序及 H5。

> ⚠️ **免责声明**：本软件仅供中医学习与研究参考，不构成医疗建议。针灸治疗请在专业医师指导下进行，切勿自行施针。

## 功能

- **纳甲法** — 根据日干支和时干支推算开穴，支持返本还原、合日互用
- **纳子法** — 按十二经气血流注时辰推算补母泻子取穴，支持虚证/实证切换
- **灵龟八法** — 按日时干支推算九宫八卦配穴（后天八卦）
- **飞腾八法** — 按日天干和时天干推算八脉交会穴（先天八卦）
- **反克法** — 纳甲法闭穴时的替代取穴方案，支持合并/单独显示模式
- **真太阳时校正** — 根据用户所在城市经纬度校准真太阳时，可选启用
- **手动查询** — 支持指定任意日期和时辰查询开穴

## 主题系统

4套主题通过CSS变量实现运行时切换：

| 主题 | 名称 | 适用平台 |
|------|------|----------|
| classic | 经典默认 | 全平台 |
| ink | 玄黑金篆 | H5/App |
| celadon | 青瓷天青 | H5/App |
| vermilion | 朱砂丹霞 | H5/App |

微信小程序仅支持 classic 主题，H5/App 可自由切换并支持跟随系统深色模式。

## 字体方案：楷题宋文

传统中医排版风格：标题用楷体，正文用宋体。

| 字体 | 用途 | 加载方式 |
|------|------|----------|
| 楷体_GB2312 | 标题、穴位名、干支标签 | 小程序: base64内联；H5/App: @font-face |
| 文源宋体（子集化） | 弹窗正文、经络/类别/五行 | 小程序: base64内联；H5/App: @font-face |

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | uni-app (Vue 3 + Vite) | 3.0.0-alpha |
| 状态管理 | Pinia + pinia-plugin-persist-uni | ^2.1.0 / ^1.2.0 |
| 样式 | SCSS | ^1.70.0 |
| 日期计算 | lunar-javascript | ^1.6.0 |

## 系统要求

- Android 5.0+ / iOS 9.0+
- 微信小程序基础库 2.30.0+
- Node.js 18+

## 项目结构

```
src/
├── services/        # 算法层（干支、纳甲、纳子、灵龟八法、飞腾八法）
├── data/            # 数据层（常量、穴位数据、八脉交会穴、反克穴位）
├── stores/          # Pinia 状态管理（时区/主题/纳子法模式/反克显示模式）
├── pages/           # 页面（取穴、设置、关于、方法说明）
├── components/      # 组件（导航栏、结果面板、穴位详情、城市选择器）
├── composables/     # 组合式函数
├── utils/           # 工具函数（五行生克、日期格式化）
├── config/          # 应用配置（默认经度等）
├── static/          # 静态资源（字体、TabBar图标）
└── styles/          # 全局样式（变量、主题定义、字体声明）
```

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# H5
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin

# App
npm run dev:app
```

> **Windows PowerShell 提示**：如果 `npm` 命令无法直接执行，可使用：
> ```powershell
> node.exe "node_modules/@dcloudio/vite-plugin-uni/bin/uni.js"
> ```

### 构建

```bash
# H5
npm run build:h5

# 微信小程序
npm run build:mp-weixin

# App
npm run build:app
```

## 作者

- **疯不觉**
- GitHub: [@2545022547-fengbujue](https://github.com/2545022547-fengbujue)

## 许可

本项目采用 [GNU Affero General Public License v3.0 or later](LICENSE)（AGPL-3.0-or-later）开源许可。

> **AGPL-3.0 核心要求**：如果你基于本项目修改并部署为网络服务，必须向所有用户提供完整源代码。