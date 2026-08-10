# 项目字体来源技术鉴定

鉴定日期：2026-08-10

## 结论

项目当前使用的宋体子集确定来自 **文渊字体项目的文渊宋体（WenYuan Serif SC）**，不是文津宋体（WenJin Mincho）。

说明：该项目在 2026 年正式版发布前将中文名称由“文源字体”更名为“文渊字体”。英文名称及字体内部兼容性元数据仍保留 `WenYuan Serif`，部分现有字体的版权字段仍写旧中文名称“文源宋体”。本文采用现行中文名称“文渊宋体”。

其中：

- `src/assets/fonts/wenjinmincho-subset-v6.ttf`：文渊宋体 SC Medium，字重 500。
- `src/assets/fonts/WenYuanSerifSC-Bold-subset-v2.ttf`：文渊宋体 SC Bold，字重 700。
- `src/assets/fonts/kaiti-gb2312.ttf`：楷体 GB2312，字重 400。

`wenjinmincho-subset-v*.ttf` 中的 `wenjinmincho` 是项目从文津宋体迁移到文渊宋体后沿用的旧文件名，不代表当前文件的实际字体来源。

## 证据一：字体内部元数据

### 常规宋体子集

文件：`wenjinmincho-subset-v6.ttf`

- SHA-256：`a51615b1c1ff1c0115bde7fb86ca8fd07521c6407d8044fe12cea275a3eafc4e`
- Unicode 字符：680 个
- Copyright：包含 `WenYuan Serif` 和更名前的旧中文名称 `文源宋体`
- Family：`WenYuan Serif SC Medium`
- Full name：`WenYuan Serif SC Medium`
- PostScript name：`WenYuanSerifSC-Medium`
- Version：`0.904`
- OS/2 字重：500
- Vendor ID：`TKSW`

### 粗体宋体子集

文件：`WenYuanSerifSC-Bold-subset-v2.ttf`

- SHA-256：`6d493cd716b168758ddcc6148ba8b57353c883c281f587d6e9a93d15cc49744a`
- Unicode 字符：63 个
- Copyright：包含 `WenYuan Serif` 和更名前的旧中文名称 `文源宋体`
- Family：`WenYuan Serif SC`
- Subfamily：`Bold`
- Full name：`WenYuan Serif SC Bold`
- PostScript name：`WenYuanSerifSC-Bold`
- Version：`0.904`
- OS/2 字重：700
- Vendor ID：`TKSW`

### 楷体子集

文件：`kaiti-gb2312.ttf`

- SHA-256：`a31908cb8a77383d854b1c620d3c2ef04d3ebea9036ca6560383cff68c2939bd`
- Unicode 字符：415 个
- Family / Full name / PostScript name：`KaiTi_GB2312`
- Version：`2.00`
- OS/2 字重：400
- Vendor ID：`GWIN`

## 证据二：字形轮廓逐字比对

使用 FontTools 读取 Unicode cmap、横向度量和 TrueType 矢量轮廓，展开复合字形后比较轮廓操作与坐标。

### 常规宋体各历史子集

| 项目文件 | 与 `WenYuanSerifSC-Medium.ttf` | 与 `WenJinMinchoP0-Regular.ttf` |
|---|---:|---:|
| `wenjinmincho-subset-v3.ttf` | 471/471 完全一致 | 0/471 一致 |
| `wenjinmincho-subset-v4.ttf` | 419/419 完全一致 | 0/419 一致 |
| `wenjinmincho-subset-v5.ttf` | 抽检 600/600 完全一致 | 0/600 一致 |
| `wenjinmincho-subset-v6.ttf` | 抽检 600/600 完全一致 | 0/600 一致 |

匹配文渊宋体时，字形轮廓和横向度量均 100% 一致。匹配文津宋体时，没有一个被比较的字形轮廓一致。

### 粗体子集

`WenYuanSerifSC-Bold-subset-v2.ttf` 与 `<FONT_SOURCE_DIR>\WenYuanSerifSC-Bold.ttf`：

- 字形轮廓：63/63 完全一致。
- 横向度量：63/63 完全一致。

因此粗体来源同样可以确定为文渊宋体 Bold。

## 证据三：官方项目结构

- 文津宋体官方仓库使用 `WenJinMinchoP#-Regular.ttf`，按 Unicode 平面拆分为 P0、P2、P3 等文件。
- 文渊字体官方仓库说明：中文名称已由“文源”调整为“文渊”，英文名称和 PostScript 名称继续使用 `WenYuan Serif` / `WenYuanSerifSC-*`。
- 项目子集的 PostScript 名称、版权保留名称、版本号及字形数据都与后者一致。

## 证据四：项目迁移历史

Git 提交 `647f256` 中的项目 `CHANGELOG.md` 已明确记录（可用 `git show 647f256:CHANGELOG.md` 复核）：

> Replaced the previous WenJinMincho font with WenYuanSerifSC-Medium, subset to 439 characters (143KB).

同一段还记录了：

- 为解决 H5 浏览器字体缓存，继续使用带版本号的文件名，例如 `wenjinmincho-subset-v2.ttf`。
- 当时生成宋体子集所使用的源文件是 `<FONT_SOURCE_DIR>/WenYuanSerifSC-Medium.ttf`。

Git 历史进一步表明：

- 2026-05-17 的记录已经说明字体方案从 WenJinMincho 切换为 WenYuanSerifSC-Medium。
- 后续 v3、v4、v5、v6 都沿用了 `wenjinmincho-subset-*` 这一旧文件名前缀。
- v3–v6 的实际字形均与文渊宋体 Medium 完全一致。

因此准确表述不是“文件名一开始就写错”，而是：**项目早期确实使用过文津宋体；切换为文渊宋体后，为兼容已有引用和浏览器缓存版本策略，保留了原来的 `wenjinmincho` 文件名前缀。**

官方来源：

- https://github.com/takushun-wu/WenJinMincho
- https://github.com/takushun-wu/WenYuanFonts

## 项目 CSS 注册情况

项目把常规字体注册为：

```css
font-family: 'WenYuanSerifSC';
src: url('@/assets/fonts/wenjinmincho-subset-v6.ttf');
font-weight: normal;
```

这里有两个需要注意的地方：

1. `WenYuanSerifSC` 是项目自行设置的 CSS 别名，可以正常调用字体，不影响实际字形来源判断。
2. 字体内部真实字重为 500，但 CSS 声明为 `normal`（400）。这不会把字体变成 400，只是浏览器匹配时把该文件当作 normal 使用。

## 最终命名建议

后续若整理文件名，建议：

- `wenjinmincho-subset-v6.ttf` → `WenYuanSerifSC-Medium-subset-v6.ttf`
- CSS family 可继续使用兼容别名 `WenYuanSerifSC`，或统一为 `WenYuan Serif SC`。
- 不应把该字体标记为文津宋体。

本报告只做来源鉴定，尚未重命名字体文件或修改 CSS，以免影响已有 H5、App 和微信小程序字体加载路径。

## 2.1.0 字体子集重建

已新增 `scripts/build-font-subsets.py`，从 `src/`、`pages.json`、`manifest.json` 和字体字符清单中自动汇总项目实际字符。

- 汇总运行时字符：1341 个（自动排除源码注释和开发说明，控制小程序主包体积）。
- 文渊宋体 Medium 子集：1324 个可用字符，约 825KB。
- 文渊宋体 Bold 子集：1324 个可用字符，约 830KB。
- 楷体 GB2312 保留核心字符：415 个，约 120KB。
- 文渊宋体未覆盖的字符均为 emoji 或图标符号，交由系统字体回退。
- 文渊宋体已经覆盖项目内全部中文字符。
- 楷体 GB2312 完整源字体本身缺少 11 个扩展/异体汉字，因此在 CSS 楷体链后增加 `WenYuanSerifSC` 逐字回退。

微信小程序 Base64 字体包已通过 `npm run fonts:base64` 同步更新。

微信小程序构建产物总量约 1.89MB，保持在 2MB 主包限制以内。
