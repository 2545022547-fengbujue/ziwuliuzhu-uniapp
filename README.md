# 子午流注取穴系统

[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

基于中医时间医学的智能化取穴辅助工具，跨平台支持 Android、iOS、微信小程序及 H5。

> ⚠️ **免责声明**：本软件仅供中医学习与研究参考，不构成医疗建议。针灸治疗请在专业医师指导下进行，切勿自行施针。

## 功能

- **纳甲法** — 根据日干支和时干支推算开穴，支持返本还原、合日互用
- **纳子法** — 按十二经气血流注时辰推算补母泻子取穴，支持虚证/实证切换
- **灵龟八法** — 按日时干支推算九宫八卦配穴
- **飞腾八法** — 按日天干和时天干推算八脉交会穴
- **真太阳时校正** — 根据用户所在城市经纬度校准真太阳时，可选启用
- **手动查询** — 支持指定任意日期和时辰查询开穴

## 技术栈

| 类别 | 技术 | 版本/说明 |
|------|------|-----------|
| 框架 | uni-app (Vue 3 + Vite) | 3.0.0-alpha-5000820260430001 |
| 状态管理 | Pinia + pinia-plugin-persist-uni | ^2.1.0 / ^1.2.0 |
| UI 组件 | uview-plus | ^3.3.0 |
| 样式 | SCSS (sass) | ^1.70.0 |
| 日期计算 | lunar-javascript | ^1.6.0 |
| 构建工具 | Vite | ^5.0.0（实际锁定 5.2.8） |

## 系统要求

- Android 5.0+ / iOS 9.0+
- 微信小程序基础库 2.30.0+
- Node.js 18+

## 项目结构

```
.
├── src/
│   ├── services/        # 算法层（干支、纳甲、纳子、灵龟八法、飞腾八法）
│   ├── data/            # 数据层（常量、穴位数据、八脉交会穴）
│   ├── stores/          # Pinia 状态管理
│   ├── pages/           # 页面（取穴、结果、设置、关于）
│   ├── components/      # 组件（导航栏、结果面板、详情弹窗、城市选择器）
│   ├── composables/     # 组合式函数
│   ├── utils/           # 工具函数
│   ├── config/          # 应用配置
│   ├── static/          # 静态资源（图标、字体）
│   └── styles/          # 全局样式
├── manifest.json        # 应用配置（AppID、权限、图标等）
├── pages.json           # 页面路由与导航栏配置
├── vite.config.js       # Vite 构建配置
└── package.json         # 依赖管理
```

## 开发

### 安装依赖

```bash
npm install
```

### 启动 H5 开发服务器

```bash
npm run dev:h5
```

> **Windows 环境提示**：如果在 PowerShell 中 `npm` 命令无法直接执行，可使用以下方式启动：
> ```powershell
> node.exe "node_modules/@dcloudio/vite-plugin-uni/bin/uni.js"
> ```

### 编译微信小程序

```bash
npm run build:mp-weixin
```

### 编译 H5

```bash
npm run build:h5
```

> **注意**：由于 `@dcloudio/vite-plugin-uni` 精确锁定 Vite 5.2.8，请不要手动升级 Vite 版本，否则可能导致构建失败。

## 作者

- **疯不觉**
- GitHub: [@2545022547-fengbujue](https://github.com/2545022547-fengbujue)

## 许可

本项目采用 [GNU Affero General Public License v3.0 or later](LICENSE)（AGPL-3.0-or-later）开源许可。

> **AGPL-3.0 核心要求**：如果你基于本项目修改并部署为网络服务，必须向所有用户提供完整源代码。详见 LICENSE 文件第 13 条（Remote Network Interaction）。
