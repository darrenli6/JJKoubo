---
version: alpha
name: Broadside：视频画面规范
description: >
  Broadside 在视频画面层的中文版规范。基本单位是单帧。核心原子保持不变：墨黑与火橙
  两种表面、宋体中文内容、超大拉丁展示字、IBM Plex Mono 结构标签、唯一火橙强调色、
  纯平面构图和 1px 发丝线。本文覆盖 16:9、9:16 和 1:1；动效规则另行处理。
unit: 单帧；主规格 1920×1080，同时说明 9:16 与 1:1
principle: 原子固定，构图自由，所有数字来自真实脚本

colors:
  ink-black: "#111111"
  ink-black-alt: "#1A1A18"
  fire-orange: "#E85D26"
  cream: "#F0ECE5"
  cream-muted: "#888880"
  cream-hint: "#505048"
  border-dark: "#282826"
  ink-on-orange-muted: "rgba(17,17,17,0.75)"
  ink-on-orange-hint: "rgba(17,17,17,0.55)"
  ink-on-orange-faint: "rgba(17,17,17,0.40)"
  ink-on-orange-border: "rgba(17,17,17,0.20)"

typography:
  # 阅读字号阶梯
  body:       { fontFamily: "Barlow", cqw: 1.2, weight: 400, lineHeight: 1.6 }
  lead:       { fontFamily: "Barlow", cqw: 1.6, weight: 400, lineHeight: 1.5 }
  caption:    { fontFamily: "Barlow", cqw: 0.9, weight: 400, lineHeight: 1.5 }
  caption-cn: { fontFamily: "Songti SC", cqw: 7.0, weight: 700, lineHeight: 1.18 }
  label:      { fontFamily: "IBM Plex Mono", cqw: 0.72, weight: 500, tracking: "0", upper: true }
  # 纯拉丁展示字号阶梯；中文展示内容使用 Songti SC
  h3:             { fontFamily: "Barlow", cqw: 2.8, weight: 600, lineHeight: 1.2, lower: true }
  quote-text:     { fontFamily: "Barlow", cqw: 3.8, weight: 700, lineHeight: 1.15, tracking: "0", lower: true }
  h2:             { fontFamily: "Barlow", cqw: 4.5, weight: 700, lineHeight: 1.1, tracking: "0", lower: true }
  stat-value:     { fontFamily: "Barlow", cqw: 5.5, weight: 900, lineHeight: 1.0, tracking: "0" }
  h1:             { fontFamily: "Barlow", cqw: 7.5, weight: 800, lineHeight: 0.9, tracking: "0", lower: true }
  fadelist-item:  { fontFamily: "Barlow", cqw: 7.5, weight: 900, lineHeight: 1.0, tracking: "0", lower: true }
  quote-mark:     { fontFamily: "Barlow", cqw: 10.0, weight: 900, lineHeight: 0.6 }
  fadelist-title: { fontFamily: "Barlow", cqw: 10.5, weight: 900, lineHeight: 0.9, tracking: "0", lower: true }
  display:        { fontFamily: "Barlow", cqw: 13.0, weight: 900, lineHeight: 0.88, tracking: "0", lower: true }

spacing:
  pad-x: "5.5cqw"
  pad-y: "5.5cqw"
  gap-lg: "3.5cqw"
  gap-md: "2cqw"
  gap-sm: "1cqw"

components:
  registers:
    dark: "底色 {colors.ink-black}，文字 {colors.cream}，强调 {colors.fire-orange}"
    orange: "底色 {colors.fire-orange}，文字 {colors.ink-black}"
    description: "只允许两种表面，每帧只能使用一种。"
  slide-chrome:
    rule: "深色表面使用 1px {colors.border-dark}；橙色表面使用 20% 墨黑"
    placement: "顶部与底部结构线；左侧标签，右侧编号"
    description: "封面、章节、陈述、引语和结尾帧不使用上下结构线。"
  kicker:
    typography: "{typography.label}"
    color: "深色表面用 {colors.fire-orange}；橙色表面用 55% 墨黑"
    description: "大写等宽眉题。"
  rule:
    backgroundColor: "深色表面用 {colors.fire-orange}；橙色表面用 {colors.ink-black}"
    size: "36×2px"
    description: "短强调线，系统中唯一的装饰元素。"
  broadside-num:
    typography: "{typography.label}"
    placement: "橙色封面或章节帧左上角，低透明度"
    description: "等宽目录编号。"
  stat-card:
    borderTop: "1px solid {colors.border-dark}"
    typography: "{typography.stat-value} + {typography.body} + {typography.label}"
    description: "只有顶部边线，不添加完整边框。"
  bullet:
    marker: "通过 ::before 放置橙色等宽 `/`"
    typography: "{typography.lead}"
    description: "最多三项。"
  bar-track:
    borderLeft: "1px solid {colors.border-dark}"
    bars: "{colors.cream-hint}，其中一条使用 {colors.fire-orange}"
    typography: "{typography.label} 轴标签"
    description: "竖向柱状图，只保留左轴。"
  compare-panel:
    layout: "两个等宽面板，中间用 1px 竖线分隔"
    payoff: "右侧结论面板可填充 {colors.fire-orange}"
    description: "用于前后或正反对比。"
  fadelist:
    typography: "三个 {typography.fadelist-item}，透明度 1.0/0.5/0.22，配一个 {typography.fadelist-title}"
    description: "三行递减词语与一个超大标题。"
---

# Broadside：视频画面规范

> 本项目覆盖规则：Broadside 的颜色、表面、间距和结构继续生效。中文口播的动态字幕、
> 中文封面标题、副标题和署名统一使用本地 `Songti SC`，主要字重 700，普通字幕颜色为
> 米白 `#F0ECE5`。火橙 `#E85D26` 仍是唯一强调色。IBM Plex Mono 只用于小型结构标签。
> 视频与封面必须使用同一份中文字体声明，不得一个用黑体、另一个用宋体。

## 设计概述

Broadside 是一种抗议海报式画面系统：文字大到不只是被阅读，也成为主要图形。系统只运行在
两种表面上：墨黑底配米白文字，用于说明；火橙底配墨黑文字，用于宣告。火橙是唯一色彩信号。
画面保持纯平，层级只来自字重、字号、负空间和 1px 发丝线。

中文内容由 **Songti SC** 承担，依靠 700 字重、尺寸和留白形成气质。纯拉丁展示文字在可用时
使用 **Barlow**；**IBM Plex Mono** 只承担编号、眉题、标签、坐标轴和 `/` 项目标记，保持大写，
但所有字距统一为 0。不要因为中文改用宋体而引入第三套正文或装饰字体。

画面层的关键特征：

- **两种表面**：墨黑配米白，或火橙配墨黑；没有米白纸张底。
- **中文宋体大字**：视频字幕与封面共享 `Songti SC` 700。
- **纯拉丁超大字**：需要时使用 Barlow 900 和小写。
- **唯一火橙**：深色表面用作强调，宣告画面用作整张环境色。
- **等宽结构标签**：IBM Plex Mono、大写、字距为 0。
- **纯平画面**：无阴影、无渐变、无装饰圆角，结构由 1px 线完成。
- **低密度**：每帧只讲一个重点，项目最多三项。

## 单帧规则

### 三个目测门槛

- **眯眼测试**：必须只有一个视觉重点，并比其他信息大约 3 至 6 倍。
- **静默测试**：宣告画面保留约 45% 至 55% 空白；数据网格是唯一高密度例外。
- **克制测试**：每帧只用一种表面、一个强调色、一个展示重点，项目最多三项。
- **参考气质**：接近大字报印刷、SPACE10 报告或 Wim Crouwel 网格；不要做成多强调色的企业幻灯片。

规格：

- 主规格：1920×1080（16:9）。
- 竖屏：1080×1920（9:16）。
- 方形：1080×1080（1:1）。
- 安全边距：`pad-x` 与 `pad-y` 均为 5.5cqw，让大字有压近边缘的张力。

**容器法则**：每个画面根节点设置 `container-type: size`。所有与画面相关的尺寸使用
`cqw` 或 `cqh`，不要使用 `vw`。发丝线始终保持 1px。

## 色彩

深色表面使用 `{colors.ink-black}` 底、`{colors.cream}` 字和 `{colors.fire-orange}` 强调。
橙色表面使用 `{colors.fire-orange}` 底和 `{colors.ink-black}` 字，次要信息只通过 75%、55%、
40% 或 20% 墨黑透明度区分。每帧选定一种表面后坚持到底。不要增加第二强调色，也不要在橙色底
上使用米白正文。

## 字体

阅读字号用于正文和结构标签；展示字号用于观点。中文动态字幕与中文封面内容默认使用
`Songti SC` 700。主要字幕不低于约 7cqw，并根据字数分级。结构标签可以小于正文，但不能承担
关键信息。

- 承担信息的文字不得小于 1.4cqw。
- 标题块宽度不超过 78cqw；文本越长，字号越低。
- 一帧只允许一个展示级文字重点。
- 所有文字统一使用 `letter-spacing: 0`，不使用负字距或额外宽字距。
- 纯拉丁 Barlow 展示字使用 700 至 900 和小写；不要把这一规则强加给中文。
- 中文内容必须在视频和封面中复用同一个 `@font-face`。

## 深度与表面

只允许纯平面。层级来源：

- 字重与字号对比；
- 1px 结构线；
- 火橙、墨黑和米白之间的切换；
- 有意保留的大面积负空间。

禁止阴影、悬浮、高光玻璃、渐变背景和装饰性圆角。除导航圆点外，所有形状圆角均为 0。

## 组件

- `registers`：两种表面系统。
- `slide-chrome`：可选的上下发丝线；宣告类画面关闭。
- `kicker`：等宽眉题。
- `rule`：36×2px 短强调线。
- `broadside-num`：目录编号。
- `stat-card`：只有顶部边线的数据块。
- `bullet`：橙色 `/` 标记，最多三项。
- `bar-track`：只有左轴且只有一条火橙强调柱。
- `compare-panel`：墨黑说明与火橙结论的对照。
- `fadelist`：1.0/0.5/0.22 透明度递减词组。

## 画面类型

### 1. 封面

使用火橙底、左对齐。组合目录编号、短线、眉题、主标题和副标题。中文主标题使用
`Songti SC` 700，并与视频字幕共享字体声明；纯拉丁标题才使用 Barlow。墨黑字直接在橙色底上
形成冲击，副标题使用 75% 墨黑。保留约 45% 空白，不使用上下结构线。

### 2. 观点陈述

使用墨黑底、左对齐。组合眉题和单一大标题。中文使用米白宋体，其中只允许一个短语使用火橙。
保留约 55% 空白，不使用上下结构线。

### 3. 数据网格

使用墨黑底和上下结构线。三个数据块横排或在竖屏中纵向排列，每块只有顶部边线。数值使用火橙，
标签使用米白，注释使用等宽字体。这是唯一允许高密度的画面类型。所有数字必须来自脚本。

### 4. 递减词组

使用墨黑底。三个词按 1.0、0.5、0.22 透明度堆叠，旁边或下方放一个火橙大标题。竖屏中采用
上下关系，避免左右挤压。

### 5. 引语

使用墨黑底，不使用结构线。上方放超大火橙引号，下方放中文宋体引语，归属信息使用等宽小字。
引语块宽度不超过 78cqw，保留约 50% 空白。

### 6. 对比

16:9 使用左右分栏，9:16 使用上下分区。说明区为墨黑底配米白字，结论区为火橙底配墨黑字，
中间用 1px 线分隔。每侧只保留一个核心观点。

## 构图规则

应该：

- 让中文宋体内容在视频和封面中保持完全一致。
- 让火橙成为唯一环境色或强调色。
- 让 IBM Plex Mono 只承担大写结构标签和 `/` 标记。
- 每帧只表达一个重点，项目最多三项。
- 封面、章节、观点、引语和结尾帧关闭上下结构线。
- 大多数画面左倾，让文字本身成为构图。

不要：

- 不要增加第二强调色或第三套内容字体。
- 不要在橙色底上使用米白正文。
- 不要添加阴影、渐变、装饰圆角或漂浮卡片。
- 不要在一帧中放两个同等级展示重点。
- 不要为了塞下一行长字而突破安全边距，应降低字号或重新断行。
- 不要让封面回退到黑体而视频继续使用宋体。

## 不同比例的行为

| 画面类型 | 16:9 | 9:16 | 1:1 |
|---|---|---|---|
| 封面 | 标题在左，副标题在下 | 标题在上，副标题在下 | 主标题居中 |
| 观点 | 大字左对齐 | 大字纵向堆叠 | 大字居中 |
| 数据网格 | 三列 | 三行 | 2+1 |
| 递减词组 | 词组与标题并排 | 词组在上，标题在下 | 词组在上，标题在下 |
| 引语 | 引号与引语靠左 | 引号在上，引语在下 | 整体居中 |
| 对比 | 左右分栏 | 上下分区 | 上下分区 |

短边方向继续使用 `pad-x`。重新断行或降低字号，确保展示块不超过 78cqw，关键信息不低于
1.4cqw。等宽结构标签只使用拉丁字母和数字。

## 实体与数字

本规范没有预设真实客户、品牌或供应商。若脚本没有提供对应素材，使用占位符，不得虚构品牌标识。

不得编造数字、百分比、日期或统计数量。缺失数值时使用 `— 数值 —`、`{metric}` 或 `NN%`。
数据块和柱状图必须等脚本提供真实数据后再填充。`No. 01` 之类目录编号只属于装饰结构，可以顺序生成。

## 渲染前自检

- **重点**：眯眼后是否只有一个展示重点？
- **留白**：宣告画面是否保留约 45% 至 55% 空白？
- **表面**：是否每帧只使用一种表面和一个强调色？
- **字体**：中文视频与封面是否都使用 Songti SC 700？
- **层级**：是否只靠字号、字重、颜色和 1px 线建立层级？
- **项目**：是否最多三项，并使用橙色 `/` 标记？
- **真实性**：每个数字是否都能追溯到脚本？
- **色彩**：人物视频是否只改变大小和位置，没有滤镜或色调映射？

## 已知边界

- 本文件只规定静态画面构成；具体动效遵循 HyperFrames 动效技能。
- Songti SC 使用本地字体。Barlow 和 IBM Plex Mono 若不可用，必须先声明可靠本地替代或取得下载许可。
- 9:16 和 1:1 是构图指导，仍需逐帧检查换行、字号、留白和安全边距。
- 图表、对比面板和占位符可用 CSS 制作，不需要额外装饰素材。
