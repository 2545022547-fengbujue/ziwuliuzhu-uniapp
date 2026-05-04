# 子午流注取穴系统

基于中医时间医学的智能化取穴辅助工具，跨平台支持 Android、iOS 和微信小程序。

## 功能

- **纳甲法** — 根据日干支和时干支推算开穴，支持返本还原、合日互用
- **纳子法** — 按日干支推算十二经补母泻子，支持虚证/实证切换
- **灵龟八法** — 按日时干支推算九宫配穴
- **飞腾八法** — 按日天干和时天干推算八卦配穴
- **真太阳时校正** — 根据用户所在城市经纬度校准时间，可选启用
- **手动查询** — 支持指定任意日期和时辰查询开穴

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | uni-app 3 (Vue 3) |
| 状态管理 | Pinia + pinia-plugin-persist-uni |
| 样式 | SCSS + uview-plus |
| 日期计算 | lunar-javascript |
| 构建 | Vite 5.2 (由 @dcloudio/vite-plugin-uni 锁定) |

## 项目结构

```
src/
├── services/        # 算法层（干支、纳甲、纳子、灵龟八法、飞腾八法）
├── data/            # 数据层（常量、穴位数据）
├── stores/          # Pinia 状态管理
├── pages/           # 页面（取穴、结果、设置、关于）
├── components/      # 组件（导航栏、结果面板、详情弹窗、城市选择器）
├── composables/     # 组合式函数
├── utils/           # 工具函数
├── config/          # 配置
├── static/          # 静态资源（图标、字体）
└── styles/          # 样式
```

## 开发

```bash
# 安装依赖
npm install

# 启动 H5 开发服务器（端口 5174）
npm run dev:h5

# 编译微信小程序
npm run build:mp-weixin

# 编译 H5
npm run build:h5
```

> 注意：由于 `@dcloudio/vite-plugin-uni` 锁定 Vite 5.2.8，请不要手动升级 Vite 版本。

## 许可

Apache-2.0
