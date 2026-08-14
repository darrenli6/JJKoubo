---
name: kbcut-style
description: 选择、列出、解析或安装 KB Cut 使用的 HyperFrames `frame.md` 风格预设与风格字体角色。适用于用户要求“用某个 frame.md”“切换 KB Cut 风格”“列出 kbcut 可用风格”“使用 founder-interview / 创始人访谈风格”“把风格复制到剪辑项目”，也作为 `$kbcut` 的子技能在包装、封面和字体落位前确定视觉规范来源。
---

# KB Cut Style

为 KB Cut 解析一个确定可用的 `frame.md` 和配套 `template.html`。本技能只处理视觉规格选择、包装模板归属、封面风格规则归属和文件落位，不转写、不剪辑、不渲染视频。

一个风格预设由三个文件共同定义：`frame.md` 是人读的视觉规范，`template.html` 是视频从里面看的可执行形态（片内三层结构），`cover.html` 是它从外面看的可执行形态（封面）。**一个完整的风格必须同时定义这两个模板**——只有包装没有封面，或者只有封面没有包装，都不算完整。模板不得引入 `frame.md` 未声明的层级、颜色或动效。

## 工作流

1. 识别用户输入：
   - 显式 `frame.md` 路径：验证文件存在，直接返回该路径。
   - 风格名：在内置预设和项目预设中解析。例如 `founder-interview`、`单人访谈`、`创始人访谈`、`创始人 IP`、`个人 IP`、`创始人访谈风格` 都映射到 `founder-interview`。
   - 风格 ID 以预设目录名为准，内置 `frame.md` 必须在 frontmatter 中声明同名 `id`。
   - 只要求“列出风格”：列出可用预设，不选择。
2. 运行 `scripts/resolve_style.py` 解析路径。传入当前项目根目录，以便优先发现项目里的 `frame-presets/<style>/frame.md`。
3. 确认 `frame.md` 同时承载动态包装、封面风格规则和字体角色映射。封面的具体审美、标题规则、蒙版/压暗策略、排版结构、字体落位和验收要点属于风格预设，不写在 `$kbcut` 主入口里。
4. 解析同目录的 `template.html` 和 `cover.html`。找到就返回绝对路径；找不到就返回 `null`，**必须显式告知调用方**，不得静默让 `$kbcut` 回退到从零手写 HTML。调用方要求模板必须存在时，使用 `--require-template` 让脚本在任一模板缺失时直接失败。
5. 若 KB Cut 工作项目需要独立副本，使用脚本的 `--copy-to WORK_DIR/frame.md`，脚本会把 `frame.md`、同级 `fonts/`、`template.html` 和 `cover.html` 一并复制后再传给 `$kbcut`。
6. 把结果记录为：风格 ID、来源层级、原始 `frame.md` 绝对路径、两个模板的绝对路径（或 null）、复制后的目标路径（如果有）。

## 内置风格

- `founder-interview` / `创始人访谈`：创始人、老师、顾问、专家口播采访。上方固定话题与资历，正文与正常文字使用 `ChillDuanHeiSongMedium`，需要加粗时切到 `ChillDuanHeiSongBold`，封面标题使用 `优设标题黑`；封面使用同一风格文件中的独立封面规则，默认提炼 6-8 个汉字、3 行排版，并采用 100% 羽化镜面蒙版形成中心聚焦。

## 解析优先级

1. 用户显式提供的 `frame.md`。
2. 当前项目的 `frame-presets/<style>/frame.md`。
3. 当前项目的 `frame-presets/<style>/FRAME.md`。
4. 本技能内置的 `assets/frame-presets/<style>/frame.md`。

## 输出约定

返回一个简洁结果，不要复述完整 `frame.md` 或 `template.html`：

```text
style: founder-interview
frame: /absolute/path/to/frame.md
template: /absolute/path/to/template.html
cover: /absolute/path/to/cover.html
source: project
```

风格缺少任一模板时，必须把这件事说出来，而不是省略该行：

```text
style: some-style
frame: /absolute/path/to/frame.md
template: /absolute/path/to/template.html
cover: null（该风格未提供封面模板，$kbcut 无法自动生成封面）
source: project
```

若找不到匹配风格，列出已知风格并要求用户提供明确的 `frame.md` 或选择一个可用风格。

## 风格预设目录结构

```text
frame-presets/<style-id>/
├── frame.md          # 必需：视觉规范 + 封面规则 + 字体角色 + templates 契约
├── template.html     # 必需：片内三层结构的 HyperFrames 包装模板
├── cover.html        # 必需：封面的 HyperFrames 组合模板
└── fonts/            # 风格自带字体
```

`frame.md` 的 frontmatter `templates` 块是机器可读的占位符契约：

```yaml
templates:
  package:
    file: "template.html"
    placeholders: [TOPIC_LINE_1, TOPIC_LINE_2, SPEAKER_NAME, SPEAKER_CREDENTIALS, CAPTION_SEGMENTS_JSON]
  cover:
    file: "cover.html"
    placeholders: [COVER_TITLE_LINES]
```

`make-package.cjs` 和 `make-cover.cjs` 会在生成前双向校验：模板用了未声明的占位符直接报错，声明了模板不用的占位符给出警告。技术类占位符（`COMPOSITION_*`、`LAYOUT_VARS`、`FONT_*`、`VIDEO_SRC`、`COVER_BACKGROUND_SRC`、`DURATION_SECONDS`）由脚本提供，不需要声明。

新增风格时，两个模板都要写。只做包装不做封面的风格是不完整的——用户拿不到能发布的成品。
