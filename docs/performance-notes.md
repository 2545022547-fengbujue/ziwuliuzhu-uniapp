# 性能与架构审计笔记（ziwuliuzhu-uniapp）

> 维护者：工程保障（SeniorDeveloper）
> 更新时间：2026-08-14
> 本文档记录**可复用的审计结论**，供后续迭代对照，避免重复排查。

---

## 1. H5 主题异步化收益量化（commit f82276b 实测）

### 数据（dist/build/h5/assets，2026-08-14 构建）

| 项 | 原始 | gzip |
| --- | --- | --- |
| 主 chunk `index-*.js`（含 vue/pinia/lunar-javascript/全部业务） | 618.3 KB | 196.8 KB |
| 主题异步 12 个 chunk 合计（薄壳后每 chunk 0.2~4.4 KB） | 28.46 KB | 7.34 KB |
| **异步化首屏收益** | **省 28.46 KB，占首屏 JS 4.4%** | 省 7.34 KB |

### 结论（诚实版）
1. **首屏体积收益有限（≈4.4%）**。真正的大头是 `lunar-javascript` 干支库（index chunk 内 152 处特征），与主题无关。
2. 异步化的**真实价值在「按需解析与隔离」**：首次切到某主题才加载对应 SFC 编译产物；主题代码互不进入彼此执行路径。
3. 若要继续瘦首屏，下一步应评估 `lunar-javascript` 的按需/裁剪加载（需验证 Lunar 对象图的可拆性，风险中等，收益最大）。
4. CSS 未按主题拆分（全局 ui-*.scss 全部进 index.css，合计约 212 KB）——这是「主题变量 + 全局覆盖」架构的固有结果，已在 §3 决策保留。

---

## 2. 依赖图与生命周期审计（2026-08-14）

- **循环依赖**：src 下 54 个模块 DFS 检测 = **0 环** ✓
  依赖方向：views（仅 inject）→ 壳层 → composable → store → services → data；App.vue → store；services 不反向依赖。
- **watch**：仅 App.vue 1 处（theme/uiStyle → applyThemeChrome，已防抖 clearTimeout+50ms）；store 内 **0 个 watch**（纯 computed + action 驱动，无隐式副作用）✓
- **定时器全量清理** ✓
  - CityPicker：tapTimer/focusTimer/openTimer/debounceTimer 4 个，onUnmounted 全清
  - useSettingPage：visualClockTimer（setInterval）+ solarPickerTimer + 3 个过渡 timer，onUnmounted 全清
  - useHomePage：分钟 tick，onHide 停/onShow 恢复幂等
- **响应式重算**：`updateCurrentTime` 仅在时辰变化或 forceUpdate 时重算 5 种方法（2 小时内省约 118 次）；`results` 为单个 computed，naziMode 切换会连带重建整个 results 对象（5 方法毫秒级，可接受，未拆分）。

---

## 3. `!important` 覆盖体系规模与决策（2026-08-14 复核）

### 规模
| 文件 | !important 数 |
| --- | --- |
| ui-ink.scss | 322 |
| ui-morandi.scss | 284 |
| ui-watercolor.scss | 271 |
| modern.scss | 263 |
| themes.scss | 180 |
| ui-animal.scss | 182 |
| ui-pixel.scss | 104 |
| **合计（约）** | **1343** |

### 决策
- **不批量删除**。这是「scoped 基线 + 全局 .ui-* 命名空间覆盖」的体系性机制，跨 scoped 作用域必须靠 !important 取胜；批量删在无视觉验证手段下风险不可控。
- 已完成的降依赖工作（实质收益）：
  1. `home-base.scss`/`setting-base.scss` 的 `$tcm-*` → `var(--theme-*, fallback)`（基线跟随主题变量）
  2. 组件 scoped 的 `$tcm-*` → `var(--theme-*)`（PointDetail 7 处 / ResultPanel 21 处，2026-08-14；`$tcm-red`/`$tcm-jade` 语义色保留）
- 未来若做 #13B 收尾：只删「有 var() 等价且已确认各主题一致的规则」，逐条对照 + 真机目测，不与缺陷修复混批。

---

## 4. 共享组件收敛记录（2026-08-14）

- 新建 `src/components/PointGrid.vue`：穴位网格按钮组（穴名+编码+五行标签+点击开详情）。
  ResultPanel 中「合日互用 / 补母泻子 / 普通开穴」三处逐字重复的网格块收敛为 `<PointGrid :points key-prefix>`；
  `bumuPoints` computed 由 `{ point }` 包装改为平铺 point 列表。
  全局 ui-*.scss 对 `.point-btn` 的覆盖均为后代选择器，DOM 结构未变仍可命中。
- `PointDetail.vue`：空态/正常态双 popup（约 17 行×2）合并为单骨架 + 内部 `v-if="point"`；
  `formatCategory` 删未使用参数；`getSecureRandomIndex` 补 `Number.isInteger` 除零防御。

---

## 5. 已知边界与待办

- [ ] `lunar-javascript` 按需裁剪评估（首屏最大收益点，需验证可拆性）
- [ ] `results` 按 method 拆分 computed（当前 naziMode 切换连带全量重建，毫秒级，低优先）
- [ ] CI 恢复（git 历史显示曾按用户要求移除 workflow，恢复前需确认）
