---
name: kbcut
description: 使用本地 FFmpeg、Whisper、HyperFrames 完成 KB Cut 知识口播视频剪辑：去气口、去废话、修口误、删除重复内容、寻找并前置钩子、保持原始人物色彩，制作竖屏或指定画幅的动态字幕包装版与同视觉封面；启动前读取本地 `.kbcut` 约束，并通过 `$kbcut-style` 解析包含包装与封面规则的 `frame.md`。适用于用户输入 MP4、MOV、M4V、MKV 等口播素材，并要求“剪辑口播”“KB Cut”“kbcut”“知识博主口播 AI 剪辑”“去废话并优化开头”“做成动态字幕成片”“用某个 frame.md 风格包装”。
---

# KB Cut 知识口播 AI 剪辑

把一条以讲话为主的原始视频制作成经过复核的口播优化版、用户确认画幅的包装成片和配套封面。剪辑环节直接使用 FFmpeg 与 Whisper；包装环节使用 HyperFrames。除非用户明确要求 ChatCut，否则不要使用 ChatCut，也不要把 ChatCut 与 HyperFrames 关联或互相代替。

`$kbcut` 是 KB Cut 的主入口。`$kbcut-style` 是它启动时必须调用的子技能，负责解析和落位包含包装与封面风格规则的 `frame.md`，不负责转写、剪辑或渲染。任何 KB Cut 任务都必须从 `$kbcut` 进入，并按“本地规则探测 → 依赖 Skill 自举 → 调用 `$kbcut-style` → 画幅确认 → 裁切与机位确认 → 写入入口记录 → 环境检测/转写/剪辑/HyperFrames 包装生成”的顺序执行。

## 默认配置

- 在本地使用 Whisper `medium`、中文、词级时间戳，不上传云端。
- 在任何耗时环境检测、转写、剪辑或创意包装前，先完成 `$kbcut-style` 风格解析门：确定风格 ID、`frame.md` 来源、工作目录副本路径，并把该 `frame.md` 作为包装与封面设计规则来源。用户未提供风格时，也要记录使用默认 `assets/frame.md`。
- 中文动态字幕和封面内容优先使用所选 `frame.md` 定义的字体角色；若风格未声明字体角色，再回退到 `字由简宋`，本地缺失时回退到 `Songti SC Bold` / `Songti SC Black`，主要字重为 700-900，禁止使用宋体 Light 或细 Regular 作为动态字幕。
- 画幅不能静默默认：用户未明确选择时，必须在启动前展示画幅列表并等待确认。
- 画幅确认后，按选定比例确定输出尺寸、裁切方式、人物构图和字幕安全区；不能先按 9:16 做完再事后改比例。
- 所有转写、工作文件、预览快照和最终交付必须保存在用户本地项目目录内；不得把素材或成片上传云端，也不得把最终文件只留在临时目录。
- 工作文件与最终交付文件分目录保存。
- 保持人物原始色彩。下层视频只能缩放或裁切，禁止添加滤镜、调色、曝光变化、LUT 或色调映射。

Whisper `medium`、中文、词级时间戳和人物原始色彩视为默认值，不要把它们变成阻塞性提问。风格与画幅是创作入口的例外：两项都必须明确，不能靠默认值绕过。

## 必须执行的工作流

### 0. 启动前双选择门与依赖自举

这是 KB Cut 的第一道入口硬门，必须在环境检测、依赖探测、`preflight.py`、Whisper、剪辑判断、HyperFrames 技能加载和任何创意设计之前完成。先完成依赖自举、本地规则探测、风格和画幅确认，才能开始创作。

#### 0.0 本地规则探测与入口提醒

先确定 `PROJECT_ROOT`：优先使用用户明确指定的工作目录；否则使用输入素材所在的项目目录。只在这个项目目录及其明确的父级项目目录内寻找规则，不扫描整个用户目录，也不联网查找。

- 检查 `PROJECT_ROOT/.kbcut/` 是否存在；也检查输入素材目录到 `PROJECT_ROOT` 之间的同名目录，按距离项目根目录最近的规则目录优先。
- `.kbcut/` 是用户自定义约束和已确认创作偏好的入口。若存在，优先读取 `config.json`，再读取按文件名表达原则的纯文本文件，优先读取 `rules.md`、`principles.md`、`constraints.md`、`keywords.txt`；必要时再读取其他 `.md`、`.txt`、`.yaml`、`.yml`、`.json` 文件。忽略媒体、二进制和无关缓存文件。
- 从 `.kbcut/config.json` 加载上次已确认的剪辑风格、IP 简介、字体计划、画幅偏好和用户确认时间。历史配置只作为本次交互的预填建议，不得替代本次用户确认；用户当前明确要求、本地项目规则优先级高于历史配置。
- 在项目目录内寻找与当前任务相关的 `COVER.md`、`cover.md`、`cover-principles.md`、`DESIGN.md`、`design.md`、`BRIEF.md` 和其他明确的设计约束文件。不要把普通业务文档或素材内容误当成设计原则。
- 将实际找到的规则目录和文件按绝对路径记录；如果没有 `.kbcut/`，记录 `kbcut_rules_dir: null`、`kbcut_rules_files: []`，不要自动创建目录。
- 启动时用一句话提醒用户探测结果，例如：`本地规则：未找到 .kbcut，使用 KB Cut 内置原则；所有文件保存在本地项目目录。` 找到规则时，列出规则目录和将优先执行的文件。
- 本地文件规则只在不违反系统指令和用户当前明确要求时生效；它们是项目级约束，不是上传或外部服务授权。

#### 0.1 依赖 Skill 自举与安装

`kbcut` 是主入口，对它声明的必需子 Skill 负有初始化责任。用户只安装了 `$kbcut`、但没有安装 `$kbcut-style` 时，不得直接跳过风格门、假设一个风格或继续进入剪辑；必须先尝试完成依赖安装。

当前必需依赖：

| Skill | GitHub 来源 | 仓库内路径 |
| --- | --- | --- |
| `kbcut-style` | `https://github.com/starboom/kbcut` | `kbcut-style/` |

按以下顺序执行：

1. **发现本地安装**：在当前 Agent 已配置的 Skill 根目录，以及常见的 `~/.codex/skills/`、`~/.agents/skills/` 中查找 `kbcut-style/SKILL.md`。若当前仓库本身包含 `kbcut-style/`，优先使用当前仓库的本地副本。不要扫描整个用户目录，也不要联网搜索同名 Skill。
2. **确认安装授权**：发现依赖缺失时，明确告诉用户：`kbcut-style` 是 KB Cut 的必需子 Skill，需要从 `starboom/kbcut` 获取；询问用户是否允许联网下载或是否会手动安装。未经用户允许，不得下载、覆盖或修改用户 Skill 目录。
3. **优先 Git 获取**：用户允许联网且环境有 Git 时，从仓库的 `main` 分支获取 `kbcut-style/`。可以使用稀疏检出减少无关内容：

   ```bash
   TEMP_DIR="$(mktemp -d)"
   git clone --depth 1 --filter=blob:none --sparse --branch main \
     https://github.com/starboom/kbcut.git "$TEMP_DIR/kbcut"
   git -C "$TEMP_DIR/kbcut" sparse-checkout set kbcut-style
   ```

   将得到的完整 `kbcut-style/` 目录复制到当前 Agent 的 Skill 根目录。不得只复制 `SKILL.md`；必须保留 `agents/`、`assets/`（包括字体和 `frame.md`）与 `scripts/`。
4. **下载兜底**：如果 Git 不可用但可以通过浏览器或 HTTP 下载，使用 [KB Cut main 分支压缩包](https://github.com/starboom/kbcut/archive/refs/heads/main.zip)，解压后将其中的 `kbcut-style/` 复制到 Skill 根目录。下载的压缩包只是传输手段，安装后的目录结构仍必须是 `kbcut-style/SKILL.md`。
5. **失败时人工引导**：如果 GitHub 访问失败、网络不可用、没有写入权限、用户拒绝联网，或下载内容校验失败，立即暂停 KB Cut 创作并给出以下信息，不要伪装成已安装：

   ```text
   缺少必需的子 Skill：kbcut-style
   请打开 https://github.com/starboom/kbcut/tree/main/kbcut-style
   点击 Code → Download ZIP，解压后将 kbcut-style 文件夹放入当前 Agent 的 skills 目录。
   安装完成后重新调用 $kbcut。
   ```

   同时根据当前环境给出实际检测到的 Skill 根目录；如果无法确定，就明确要求用户将 `kbcut-style/` 放到与 `kbcut/` 同级的 `skills/` 目录。不得让用户把 `kbcut-style` 的内容直接混入 `kbcut` 目录。
6. **安装后复检**：安装或手动放置完成后，重新发现 `kbcut-style/SKILL.md`，验证其 `name: kbcut-style`、`scripts/resolve_style.py`、至少一个 `assets/frame-presets/*/frame.md` 和对应字体资源都存在。复检失败则继续暂停，并指出缺失路径。

只有依赖复检通过后，才能进入下面的风格解析步骤。每次自举尝试都应记录 `skill_bootstrap`、来源 URL、分支、目标 Skill 根目录、结果（`local`、`git`、`archive`、`manual` 或 `failed`）和失败原因；不要把凭据写入记录。

#### 0.2 交互规则：风格、IP 资料与字体

启动某次素材剪辑时，严禁直接进入环境检测、转写、剪辑判断、生成文件或任何 HyperFrames 创作。必须在对话中完成下面的交互确认，并在用户明确确认前暂停。

**宿主交互能力优先级**：如果当前 Agent 宿主提供结构化提问、表单或 `request_user_input` 类工具，必须优先使用该工具生成真正可点击的单选/多选项；选项的值应与下面的编号和 `input_choices.json` 字段一致。如果宿主没有这类工具，才使用下面的 Markdown 编号列表作为兼容降级方案。`SKILL.md` 本身不能强制 Codex、Claude Code、豆包或其他 Agent 宿主生成原生按钮。

无论使用点击选择还是文本回复，都必须等待用户完成当前问题后再进入下一步。不能在一次回复中替用户补全尚未确认的选项，也不能把默认值当作用户确认结果。

##### 0.2.1 选择剪辑风格

先向用户输出清晰的数字选项，并等待回复，不得替用户静默选择：

> 请问您希望采用哪种剪辑风格？
>
> 1. **默认风格**：使用 KB Cut 内置的 Broadside `assets/frame.md`，适合一般知识口播、观点表达和信息型视频。
> 2. **个人 IP 风格**：使用 `founder-interview` `frame.md`，适合创始人、老师、顾问、专家和需要建立个人信任感的口播。
> 3. **自定义风格**：提供一个本地 `frame.md` 的绝对路径，或说明需要安装/解析的项目风格。

用户回复后：

- `1` 映射到 `style_id: broadside`，来源为 `kbcut/assets/frame.md`。
- `2` 映射到 `style_id: founder-interview`，来源为 `kbcut-style/assets/frame-presets/founder-interview/frame.md`。
- `3` 必须先验证用户提供的 `frame.md`，找不到或无法读取时暂停并要求补充路径。
- 用户直接输入风格名称或路径时，按等价选项处理，但仍要明确回显最终采用的风格并等待确认。

##### 0.2.2 个人 IP 资料追问

如果用户选择 `个人 IP 风格`，必须继续追问并等待一段可用于画面上方 topic lockup 和 speaker credentials 的个人简介。至少收集：

- 名称或对外称呼；
- 身份、领域或主要业务；
- 取得的成绩、代表性经历、客户/作品结果或可公开背书；
- 用户希望在视频中展示的简短版本。

向用户提问：

> 请提供一段您的个人 IP 简介，包含名称、身份/领域，以及取得的成绩或代表性经历。内容会用于视频中的身份介绍和权威信息展示；没有公开依据的成绩不要填写。也可以直接粘贴一段现成简介。

没有提供成绩时，不得编造或用泛化荣誉替代；可以记录为空，并在后续画面中省略成绩模块。简介过长时，只请求用户确认一个可展示的短版本，不要擅自改写成未经确认的事实。

##### 0.2.3 展示字体计划并确认

在 `$kbcut-style` 完成 `frame.md` 解析后，必须把当前风格声明的字体按“字体文件 → 使用场景 → 当前状态”展示给用户，并等待确认。至少使用以下格式：

```text
当前风格：{style_id}
字体计划：
1. {font_name}（{font_file}）
   场景：{scenes}
   状态：{available_or_missing}
2. ...

请回复“确认”，或按场景修改，例如：
“动态字幕改用 /absolute/path/Caption.otf，封面标题仍使用当前字体。”
```

默认 Broadside 风格至少展示：

- `Songti SC`：中文动态字幕、中文封面标题和正文内容；主要使用 700 字重。
- `Barlow`：纯拉丁展示级标题或英文内容。
- `IBM Plex Mono`：编号、眉题、标签、坐标轴和结构性小字。

`founder-interview` 风格至少展示：

- `优设标题黑`（`assets/frame-presets/founder-interview/fonts/优设标题黑.ttf`）：独立封面标题。
- `ChillDuanHeiSongMedium`（`assets/frame-presets/founder-interview/fonts/ChillDuanHeiSongMedium.otf`）：普通动态字幕、话题文字、身份介绍和正文。
- `ChillDuanHeiSongBold`（`assets/frame-presets/founder-interview/fonts/ChillDuanHeiSongBold.otf`）：动态字幕关键词、姓名和需要强调的身份文字。

允许用户逐项输入其他场景的字体名称或本地绝对路径。用户自定义字体时必须提醒：字体文件需要由用户自行准备并授权使用；`kbcut` 不自动下载商业字体，也不因为用户只提供字体名称就假设字体文件存在。只有验证文件存在后，才能把该字体写入字体计划。没有可用字体时，暂停包装和封面创作，不能悄悄替换成未经确认的字体。

##### 0.2.4 交互确认结果

将最终确认的风格、IP 资料、字体计划、画幅和 3 秒钩子策略写入工作目录的 `input_choices.json`。在这些项目完成前：

- 不运行 `preflight.py`、Whisper、`render_recut.py` 或任何剪辑脚本；
- 不创建 HyperFrames 项目、字幕布局、封面或预览快照；
- 不生成或覆盖任何交付文件；
- 如果用户修改风格、IP 资料、字体、画幅或钩子策略，回到对应问题重新确认，并更新记录。

##### 0.2.5 确认 3 秒钩子编排策略

在启动授权前，必须单独确认是否允许对素材的开头和叙事顺序进行主动编排。寻找高光时刻、金句并将其前置到开头，属于对原始素材的侵入性修改，不能静默执行。

向用户输出以下选项并等待回复：

> 关于视频开头的 3 秒钩子，请选择处理方式：
>
> 1. **由 KB Cut 自行寻找并前置**：通读完整素材，寻找最有冲突、信息密度最高或最能代表核心回报的高光/金句，将它编排到开头；如果正文中重复出现，再删除原位置的重复段落。
> 2. **保留我拍摄时的开头**：不主动寻找或前置高光，不改变原始叙事顺序；只按已确认的规则处理气口、废话、口误和重复表达。
> 3. **先分析后确认**：先通读并列出 2-3 个钩子候选及其时间点，但不移动、不删除、不渲染，等我确认后再编排。

用户没有明确选择时，必须暂停。选择 `1` 时，用户授权了开头钩子前置和必要的非时间顺序编排；选择 `2` 时，禁止做钩子搜索和顺序重排；选择 `3` 时，只允许生成候选分析，不得生成剪辑计划或成片。将结果记录为 `hook_strategy`、`hook_reorder_authorized` 和 `hook_confirmation_required`。

#### 0.3 风格解析

不得因为环境体检耗时或依赖探测方便而跳过风格解析。

- 每次 `$kbcut` 启动都必须调用 `$kbcut-style`；即使用户没有指定风格，也要让它解析技能内置默认 `assets/frame.md` 并返回明确结果。不能只在用户说出风格名时才调用。
- 若用户提供显式 `frame.md` 路径，验证文件存在，并记录绝对路径。
- 若用户提供风格名、参考风格、或说“用某某风格”，立即调用 `$kbcut-style` 解析为确定的 `frame.md`。
- 若用户没有指定风格，使用技能内置 `assets/frame.md`，但仍要把结果记为明确风格来源。
- KB Cut 工作项目需要独立副本时，使用 `$kbcut-style` 的 `--copy-to WORK_DIR/frame.md`，并把 `style_resolution.json` 写入工作目录。
- 记录 `style_id`、原始 `frame.md` 绝对路径、工作目录副本路径（如有）和来源层级。

#### 0.4 画幅选择

画幅必须单独向用户确认。用户已经明确给出比例时，将其规范化为下表中的 `aspect_ratio` 和输出尺寸并记录，无需重复询问；只说“横版”“竖版”而没有具体比例时，仍要让用户从列表中选定。

向用户展示以下选项，不能静默套用默认画幅：

| 选项 | 画幅 | 建议输出尺寸 | 适用方向 |
| --- | --- | --- | --- |
| A | 16:9 | 1920×1080 | 横版 |
| B | 4:3 | 1440×1080 | 横版 |
| C | 1:1 | 1080×1080 | 方版 |
| D | 4:5 | 1080×1350 | 竖版 |
| E | 3:4 | 1080×1440 | 竖版 |
| F | 9:16 | 1080×1920 | 竖版 |
| G | 自定义 | 用户指定 | 用户指定 |

- 选择结果至少记录 `aspect_ratio`、`width`、`height`、方向和用户原始表述。
- 画幅选择会直接影响原始视频的缩放/裁切、人物头顶和身体留白、字幕轨道位置、封面构图和安全区；先选比例，再开始视觉设计。
- 未确认画幅时，不得生成 HyperFrames 项目、决定字幕布局、渲染封面或导出任何创意包装成片。必要时可以先做纯媒体信息读取，但不能进入创作判断。

#### 0.4.1 裁切确认

选定比例只完成了一半。源画幅与目标画幅不一致时，**必须继续确认怎么裁**，因为这是一个不可逆的构图决策：9:16 素材放进 3:4 要砍掉 25% 的高度，砍顶还是砍底决定了人脸最终落在画面的什么位置，也决定了后面三层文字能放哪儿。不确认就默认居中裁切，属于替用户做构图决定，禁止。

源画幅与目标画幅比例一致时，整段跳过，不要拿这个问题打扰用户。

**必须让用户看图选，不能只给文字选项。** 运行：

```bash
python3 $KBCUT/scripts/crop_preview.py \
  --video <原始素材> --aspect <已确认比例> \
  --compare --at 40% --output <工作目录>/裁切预览
```

输出 `crop_top.png`、`crop_center.png`、`crop_bottom.png` 和并排对比图 `crop_compare.png`。把这几张图展示给用户，让其从下表选择：

| 选项 | 锚点 | 效果 |
| --- | --- | --- |
| A | `top` | 保住头顶留白，砍掉下半身 |
| B | `center` | 上下各砍一半 |
| C | `bottom` | 砍掉头顶，人物顶天 |
| D | `custom` | 用户指定偏移，如 `35%` |

- 为了生成这几张预览图，允许在入口门内读取媒体并抽帧。这是画幅确认的必要组成部分，属于媒体信息读取的延伸，不算进入创作判断；但除抽帧外仍不得生成任何 HyperFrames 项目、字幕布局或封面。
- `crop_preview.py` 报告 `discarded_fraction > 0.35` 时，必须主动告知用户这个组合会丢掉超过三分之一的画面、人物大概率装不下，并建议改画幅，不能默默裁出一张人头特写。
- 裁切在包装阶段用 CSS 完成，不在 FFmpeg 重剪阶段裁死。这样预览发现裁错了改一个数字重出快照即可，不必重跑重剪。

#### 0.4.2 机位确认

裁切锚点确认后，用同一脚本抽取**裁切后**的关键帧，判断人物在成片里的实际构图：

```bash
python3 $KBCUT/scripts/crop_preview.py \
  --video <原始素材> --aspect <比例> --anchor <已确认锚点> \
  --frames 10%,50%,90% --output <工作目录>/机位分析
```

读取这几张图，判断头顶位置、人物偏左还是偏右、脸部下沿高度、哪一侧背景是空的，然后从当前 `frame.md` 的 `shot-profiles` 中选一个最接近的档位。必须从风格声明的档位里选，不要自由填数——档位收敛决策空间，也保证同一创作者的多条视频构图一致。

把脸部下沿记为 `face_bottom_pct`（占画面高度的百分比）。`make-package.cjs` 会用它对照 `frame.md` 的 `subject-clearance` 硬校验字幕是否会压到脸，不满足直接报错。这条替代了原来只能靠肉眼复核的做法。

顺序不能颠倒：**比例 → 裁切锚点 → 抽裁切后的帧 → 机位档位**。先定文字位置再裁切，等于对着一张不会存在的画面排版。

同一创作者机位通常不变。已确认的 `crop_plan` 与 `shot_profile` 应写入项目 `.kbcut/`，后续视频直接复用并跳过本节确认，仅在用户表示换了机位时重做。

#### 0.5 交互确认记录

把四项确认合并写入工作目录的 `input_choices.json`，至少包含：

```json
{
  "style_id": "founder-interview",
  "frame_source": "/absolute/path/to/frame.md",
  "frame_copy": "/absolute/path/to/work/frame.md",
  "editing_style": "personal_ip",
  "ip_profile": {
    "name": "",
    "identity_or_domain": "",
    "achievements": "",
    "display_version": ""
  },
  "font_plan": [
    {
      "role": "body-normal",
      "font_name": "ChillDuanHeiSongMedium",
      "font_file": "/absolute/path/to/ChillDuanHeiSongMedium.otf",
      "scenes": ["dynamic captions", "speaker credentials"],
      "source": "style",
      "confirmed": true
    }
  ],
  "hook_strategy": "auto_find_and_prepend",
  "hook_reorder_authorized": true,
  "hook_confirmation_required": false,
  "aspect_ratio": "3:4",
  "width": 1080,
  "height": 1440,
  "orientation": "portrait",
  "user_aspect_request": "3:4",
  "source_media": {
    "width": 1080,
    "height": 1920,
    "aspect_ratio": "9:16"
  },
  "crop_plan": {
    "mode": "crop",
    "anchor": "top",
    "offset_y": null,
    "offset_x": null,
    "scale": null,
    "confirmed": true,
    "preview_frame": "/absolute/path/to/裁切预览/crop_top.png"
  },
  "shot_profile": {
    "profile": "subject-centered",
    "face_bottom_pct": 52,
    "source": "keyframe_analysis"
  },
  "layout_overrides": {},
  "package_content": {
    "topic_line_1": [
      { "text": "内容", "weight": "accent" },
      { "text": "永远大于", "weight": "light" }
    ],
    "topic_line_2": [{ "text": "技术", "weight": "strong" }],
    "speaker_name": "",
    "speaker_credentials": [],
    "caption_emphasis": []
  },
  "project_root": "/absolute/path/to/project",
  "kbcut_rules_dir": null,
  "kbcut_rules_files": [],
  "local_principle_files": []
}
```

字段说明：

- `source_media`：原始素材的实际画幅，由 `crop_preview.py` 探测，用于判断是否需要裁切。
- `crop_plan`：0.4.1 的裁切确认结果。`mode` 目前只支持 `crop`；`founder-interview` 的 `frame.md` 禁止黑边，因此 `pad` 不可选。`anchor` 为 `custom` 时必须填 `offset_y`。
- `shot_profile`：0.4.2 的机位判断结果。`profile` 必须是当前 `frame.md` 的 `shot-profiles` 中已声明的档位名。
- `layout_overrides`：预览回路里对 CSS 变量的最终微调，如 `{"--caption-zone-top": "76cqh"}`。这是唯一允许手改布局的入口，改不动 DOM 结构和动效。
- `package_content`：包装文案。字段名与所选 `frame.md` 的 `Content Inputs` 契约一一对应。`topic_line_*` 使用结构化 span 数组（`weight` 取 `strong` / `light` / `accent`），不要写裸 HTML。

只有 `input_choices.json` 中的风格、个人 IP（如果适用）、字体计划、画幅、裁切方案、机位档位和钩子策略字段完整，并且本地规则探测结果已经记录，才算通过入口门。源画幅与目标画幅一致时，`crop_plan` 记为 `{"mode": "none", "confirmed": true}`，不需要向用户提问。没有 `.kbcut/` 也是有效结果，不得为了满足记录而创建空目录。若风格、个人 IP 资料、字体、画幅、钩子策略或项目规则在后续发生变化，必须更新记录，并重新检查构图、安全区和封面，不得只改文件名。

- HyperFrames 是独立渲染框架：从已安装的 `hyperframes` skill 及其本地资源查找和执行；不得把缺失或定位中的 HyperFrames 误路由到 ChatCut。

#### 0.6 编导确认：剪辑任务报告与启动授权

当风格、个人 IP（如果适用）、字体、画幅和 3 秒钩子策略全部确认后，必须先以“编导确认”身份向用户汇总计划，不能直接开始剪辑。此阶段的目标是让用户清楚知道接下来会发生什么，并给用户一次整体纠错机会。

生成工作目录内的 `剪辑任务报告.md`。它是启动前的计划文件，不是成片交付物，至少包含：

- 输入素材路径和项目根目录；
- 本次剪辑风格、`frame.md` 来源和 IP 简介；
- 输出画幅、分辨率、人物构图和字幕安全区；
- 已确认的字体角色、字体文件路径和自定义字体授权提醒；
- 剪辑范围：转写、去气口、去废话、修口误、删除重复内容，以及经用户授权的钩子候选和开头重排；
- 包装范围：动态字幕、人物信息、封面和 HyperFrames 验收；
- 预计交付文件；
- 预计耗时区间和影响耗时的条件；
- 本地规则、历史配置和本次用户覆写项；
- `skill_bootstrap` 和依赖检查结果。

报告中必须包含一个流程画布。优先使用 Mermaid；不支持 Mermaid 的宿主使用同样内容的纯文本流程：

```mermaid
flowchart LR
    A[素材与本地规则] --> B[确认风格/IP/字体/画幅]
    B --> C[生成剪辑任务报告]
    C --> D{用户确认启动}
    D -->|修改| B
    D -->|同意| E[本地转写与逐字稿]
    E --> F[编导剪辑计划与钩子重排]
    F --> G[FFmpeg 口播优化版]
    G --> H[复核转写与剪辑接缝]
    H --> I[HyperFrames 字幕包装]
    I --> J[独立封面与最终验收]
    J --> K[本地交付与工作文件]
```

向用户说明报告内容时，必须用编导口吻明确表达：`接下来我会先转写逐字稿，通读并制定剪辑计划；根据您确认的 3 秒钩子策略决定是否寻找高光并调整开头，然后使用已确认的字体和画幅设计字幕与封面，最后完成复核和本地交付。`

预计耗时只能作为区间，不得承诺固定完成时间。没有实际媒体信息时可使用以下估算，并在报告中标注“预估”：

| 阶段 | 预估耗时 |
| --- | --- |
| 媒体检查与本地规则读取 | 1-3 分钟 |
| Whisper 转写（取决于视频时长和本地硬件） | 通常为素材时长的 0.5-2 倍 |
| 通读逐字稿与剪辑计划 | 5-20 分钟 |
| FFmpeg 重剪与复核 | 2-10 分钟 |
| HyperFrames 字幕、封面、快照和验收 | 10-30 分钟 |

报告完成后，必须暂停并询问：

> 以上是本次 KB Cut 的剪辑任务报告。请回复“确认启动”开始执行；如果需要修改风格、IP 信息、字体、画幅、3 秒钩子策略或剪辑范围，请直接指出要修改的项目。

只有用户明确回复“确认启动”“同意启动”或等价表达，才可以进入第 1 步。用户要求修改时，更新交互记录和任务报告，重新展示受影响的计划，并再次等待启动授权。不得把沉默、模糊回复或仅提供素材路径视为授权。

首次执行完成信息采集后，必须追加询问：

> 这是您第一次使用 KB Cut。是否将本次确认的风格、IP 简介、字体计划和画幅偏好保存为当前项目的默认配置，供后续任务预填使用？

只有用户明确同意持久化，才在当前项目根目录创建 `.kbcut/`，并写入 `.kbcut/config.json`。用户拒绝时不创建该目录。持久化配置不得包含视频、音频、转写文本、凭据或临时绝对路径，只保存可复用的偏好和来源信息。

`.kbcut/config.json` 至少包含：`schema_version`、`style_id`、`frame_source`、`editing_style`、`ip_profile`、`font_plan`、`hook_strategy`、`hook_reorder_authorized`、`aspect_ratio`、`width`、`height`、`orientation`、`created_at`、`updated_at` 和 `confirmed_by_user: true`。后续任务加载配置时，必须再次展示预填值并允许用户修改；不能因为存在 `.kbcut` 就跳过交互确认。

### 1. 解析输入

只有在 `input_choices.json` 完整、`剪辑任务报告.md` 已生成，并且用户明确授权“确认启动”后，才能进入本步骤。否则必须停留在第 0 步，不得读取媒体元信息以外的创作内容，也不得生成任何剪辑或包装产物。

把输入素材解析为绝对路径，使用 `ffprobe` 检查媒体信息。建立项目内的工作目录和交付目录，绝不覆盖原始素材。

使用第 0 步得到的 `frame.md`、本地规则探测结果和已确认的 `input_choices.json` 决定画幅、构图与项目约束。若风格、画幅或规则探测记录缺失，停止当前动作并回到第 0 步补齐，不要继续做包装判断。

运行：

```bash
python3 scripts/preflight.py INPUT_VIDEO --model medium --frame FRAME_MD
```

未指定 `--frame` 时使用技能内置规范。若体检显示本地 medium 模型缺失，询问用户选择本地模型路径、已有 Whisper 兼容 API，或是否允许下载。未经许可不得下载模型或上传媒体。

### 2. 本地转写

使用确认后的模型运行 `scripts/transcribe_local.py`。只有专有名词确实需要辅助时，才传入简短领域词表；不要把预期文案作为提示词灌入模型。

```bash
python3 scripts/transcribe_local.py INPUT_VIDEO \
  --model medium \
  --language zh \
  --output-dir WORK_DIR/transcript
```

保留 JSON、带时间戳 TXT、词级 TSV、SRT 和 16 kHz WAV。若用户选择 API，也要生成同样的文件集合，并确保凭据不写入文件或命令输出。

### 3. 制定剪辑计划

选择剪辑点前，完整阅读 `references/workflow.md`。必须通读整份转写，不能只看开头。生成 `edit_plan.json`，其中保留片段使用原素材时间，排列顺序就是最终播放顺序。

- 删除纯气口、无效停顿、只含语气词的片段、错误开头、重复词句和废弃版本。
- 保留原意、语法、情绪节奏，以及自然辅音起止所需的余量。
- 只有 `input_choices.json.hook_strategy` 为 `auto_find_and_prepend` 时，才从完整素材中寻找钩子候选，并优先把最强的完整观点、冲突、反转或好奇缺口放进前三秒。
- 只有用户授权前置时，才能删除钩子在正文中的原始重复位置；`preserve_original_opening` 时禁止顺序重排，`analyze_then_confirm` 时只输出候选及时间点，等待用户二次确认。
- 不得编造话语、把论点重排成错误逻辑，或删除会改变讲述者立场的内容。
- 每个保留片段都写一条简短 `note`，保证剪辑决策可追溯。

### 4. 渲染口播优化版

运行：

```bash
python3 scripts/render_recut.py WORK_DIR/edit_plan.json
```

脚本会读取并延续原片的色彩基色、传递函数、矩阵、范围、位深和方向信息。默认保留源帧率，但 10-bit VideoToolbox HEVC 为兼容性默认输出 30fps；必须交付 60fps 时改用软件 HEVC。不得凭肉眼硬编码 BT.709、HLG、PQ 或像素格式。

### 5. 复核口播优化版

使用相同 medium 模型重新转写口播优化版。对照计划文本检查重复内容、音节截断、缺失音频、音画漂移和生硬接缝。重点试听钩子与正文的非顺序连接，以及短于一秒的剪辑点。发现问题就修改计划并重新渲染。

### 6. 使用 HyperFrames 包装

包装版由脚本从风格模板生成，**不是每条视频现场手写 HTML**。风格预设的 `template.html` 已经固化了 DOM 结构、字体、颜色、层级和字幕动效；每条视频变化的只有文案、字幕数据和一组 CSS 变量。

制作封面时使用 `hyperframes-creative`；封面是独立组合，不走本节的模板流程。需要新增或修改风格模板本身时（不是某一条视频），才读取 `hyperframes-core`、`hyperframes-animation`、`motion-doctrine`。

#### 6.0 生成包装项目

```bash
node $KBCUT/scripts/make-package.cjs \
  --input-choices <工作目录>/input_choices.json \
  --srt <工作目录>/复核转写/<stem>_口播优化版.srt \
  --video <工作目录>/<stem>_口播优化版.mp4 \
  --output <工作目录>/hyperframes/package
```

`frame.md` 和 `template.html` 默认从 `input_choices.json` 的 `frame_copy` / `template_source` 读取，也可以用 `--frame` / `--template` 覆盖。

脚本负责这些机械环节，不要手工重做：

- 字幕 JSON 转义（用 `JSON.stringify` 作为唯一转义边界）
- 中文智能换行（按 `caption-max-width ÷ caption-size` 推导每行字数，画幅一变自动跟随）
- 字号按画幅缩放（读 `frame.md` 的 `aspect-variants.type-scale`）
- 裁切锚点换算成 `object-position`
- 关键词强调（优先用 `package_content.caption_emphasis`；未指定时按词频提取并在输出里列出所选词，便于用户覆盖）
- 字体复制与 `@font-face` 路径
- 占位符契约校验（模板占位符与 `frame.md` 的 `Content Inputs` 对不上直接报错）
- 字幕压脸硬校验（`caption-zone-top` 对照 `shot_profile.face_bottom_pct` + `subject-clearance`）

脚本会输出 `build-report.json` 和一份控制台摘要。**必须读摘要**，尤其这两类提示：

- 字幕超过 2 行的段落：说明该句在剪辑计划里就该拆开，回第 2 步改计划，不要靠缩字号硬塞。
- 裁切丢弃比例过高的警告：说明画幅选择本身有问题，回 0.4 重新确认。

风格没有 `template.html` 时脚本会直接失败并说明原因。此时不要退回手写 HTML —— 那正是这套流程要消除的环节。应当先为该风格补模板，或改用已有模板的风格。

#### 6.0.1 预览回路

调整布局用快照，不要用整片渲染。快照 2 秒出图，渲染要 1-2 分钟。

```bash
npx hyperframes snapshot <包装项目> --at 2s --at <中段> --at <末段> -o <工作目录>/快照
```

看图发现位置需要微调时，改 `input_choices.json` 的 `layout_overrides`（如 `{"--caption-zone-top": "76cqh"}`）或换一个 `shot_profile` 档位，重跑 `make-package.cjs`，再出快照。只调数字，不改模板结构和动效。

只有在快照确认构图正确后，才进入完整渲染。

#### 6.0.2 首版视觉防漂移硬检查

生成后、导出前，先把 `frame.md` 的允许项、禁止项和本地 `.kbcut` 约束整理成工作文件中的视觉检查记录。技术检查通过不等于视觉方向正确，必须先过这道视觉门再导出。

- 模板已经按 `frame.md` 的禁止项构建：不含颗粒、噪声、脏纹理、厚重字幕阴影、大面积黑色块、渐变文字、霓虹/发光、彩色字幕底板、贴纸图形。**不要为某一条视频往生成结果里手加这些东西**；确有需要就改风格模板，让所有视频一起变。
- 黑色压暗、阴影或渐变只有在 `frame.md`、本地规则或用户当前要求明确支持时才能使用；用户明确要求的 100% 羽化镜面蒙版属于允许的结构性效果，不等同于装饰性渐变。
- 至少生成一张无调试标记的首版快照，并检查人物是否仍是主视觉、字幕是否干净、背景是否被压黑、是否出现颗粒感或大块遮挡。发现任一项偏离，先判断是数据问题（文案、字幕、布局变量）还是模板问题；数据问题改 `input_choices.json` 重跑脚本，模板问题改风格预设。不能用“HyperFrames check 通过”代替视觉复核。
- **`check` 的 Contrast 项在本风格下是参考项，不是阻塞项。** `frame.md` 明确禁止用黑色蒙版、描边、底板换可读性，所以浅色或中间调背景上白字必然低于 WCAG 阈值。已实测确认：白墙背景下左上文字栏约 2.5:1，低于 3:1 标准，但人眼观感完全可用。判定标准是无调试标记快照上的实际观感，不是对比度数值。**不得为了让 Contrast 变绿而加底板、阴影、描边或压暗**——那会破坏风格本身。字号越小 WCAG 阈值越严（正文要 4.5:1），因此小字幕方案下 Contrast 报错数量增加属于正常现象。
- 若确实出现人眼也读不清的情况，按 `frame.md` 的解法处理：换背景帧、调裁切锚点、改文字落位，而不是加遮蔽层。

- 保持口播优化版的内容、顺序、原声和总时长不变。
- 严格使用 `input_choices.json` 中的 `width`、`height` 和 `aspect_ratio`；脚本已按此生成，不要在生成后手改画布尺寸。
- 字幕时间轴以复核后的成片转写为准。
- 视频元素只能调整尺寸、裁切和构图位置。禁止 CSS `filter`、混合模式、透明色罩、视频转画布或任何颜色转换。
- 用户提供或 `$kbcut-style` 解析出的 `frame.md` 优先使用；否则把 `assets/frame.md` 复制到 HyperFrames 项目。
- 使用已安装的 HyperFrames skill 完成检查、浏览器预览和渲染。不要调用 ChatCut 插件、ChatCut 技能或 ChatCut 项目概念，除非用户明确把交付目标改成 ChatCut 可编辑项目。

### 6.1 字幕位置与人物避让硬准则

字幕位置必须在完成画幅裁切、人物构图和平台 UI 预留之后决定，不能把同一组 `top` 坐标复制到所有画幅。字幕框是一个整体进行避让判断，不能只检查文字基线。

下面的安全带由所选 `frame.md` 的 `aspect-variants` 声明，`make-package.cjs` 按已确认画幅自动落位，正常情况下不需要手动指定。本节是判断依据和验收标准，也是 `frame.md` 缺少某个画幅变体时的兜底原则。`input_choices.json` 记录了 `shot_profile.face_bottom_pct` 时，脚本会硬校验字幕带是否压脸并在不满足时拒绝生成。

- `3:4`（1080×1440）：字幕放在画布底部安全带 `74%-88%`（`74-88cqh`），底部至少预留约 `8%` 给平台 UI；短句也不能回到中间遮住脸。
- `9:16`（1080×1920）：字幕放在中下部安全区 `60%-76%`（`60-76cqh`），底部至少预留约 `18%` 给平台 UI；不能因为画布更高就把字幕推到人物脸部所在高度。
- 其他画幅：沿用“靠近底部、避开平台 UI、避开人物脸部”的原则，先按实际画布建立安全带，再落字幕。
- 任何画幅都禁止字幕框覆盖人物的脸、眼睛、嘴、头部或主要识别区域。若字幕与人物冲突，按顺序尝试：移到同一安全带内的空白侧、缩短或重新分行文案、调整人物裁切；不能先缩小字号或用大黑块解决。
- 通过代表帧检查字幕框与人物区域的关系；如果字幕遮住人物，视为布局失败，即使 HyperFrames 的技术检查通过也不能交付。

### 7. 制作封面

封面是所选 `$kbcut-style` 风格的一部分。**一个完整的风格同时定义片内三层结构和封面**：`template.html` 决定视频从里面看是什么样，`cover.html` 决定它从外面看是什么样，两者缺一不可。具体封面审美、标题规则、蒙版/压暗策略和排版结构写在风格预设里，而不是硬编码在 `$kbcut` 主入口里。

封面规则优先级为：用户当前明确要求 > 项目本地 `.kbcut/` 与相关原则文件 > 所选 `frame.md` 的封面章节 > 所选 `frame.md` 的一般布局建议 > 通用默认值。若本地规则与风格封面规则冲突，执行本地规则并把冲突记录到工作文件。

标题从真实钩子或核心观点提炼，不能创造素材中不存在的结论。写好后填入 `input_choices.json` 的 `package_content.cover_title`，然后运行：

```bash
node $KBCUT/scripts/make-cover.cjs \
  --input-choices <工作目录>/input_choices.json \
  --video <工作目录>/<stem>_口播优化版.mp4 --at <关键帧秒数> \
  --output <工作目录>/hyperframes/cover \
  --png <工作目录>/交付文件/<stem>_<aspect>_封面.png
```

也可以用 `--background <已选好的静帧.png>` 替代 `--video --at`。脚本负责：抽取干净静帧、按 6-8 字规则分成 3 行、套用 `frame.md` 的 `cover-spacing` 与 `cover-aspect-variants`、复制封面标题字体、生成组合并快照成 PNG。

封面与动态字幕使用同一份 `frame.md` 的字体来源和品牌约束，**但封面是独立组合，不复用包装布局**：它有自己的间距块、自己的画幅变体和自己的裁切锚点（`input_choices.json` 的 `cover` 字段）。任何情况下都不得把带字幕、资历栏或调试标记的包装帧当封面。

封面构图微调走 `input_choices.json` 的 `cover.anchor` / `cover.layout_overrides`，与包装版是同一套"只改数字"的机制。

标题字号不写死，由脚本按安全区推导：取"最长行塞进 `title-max-width`"和"所有行塞进 `title-block-max-height`"两个约束里更紧的那个，再受 `title-size-max` 封顶。控制台会打印实际字号和是哪个约束在起作用。觉得标题偏小时，改 `frame.md` 的标题块预算，而不是给某一条视频硬写一个字号——前者让这个风格的所有视频一起变。

标题字数为 6-8 字、默认均分成 3 行。**不存在独立的"每行几字"规则**：6-8 字分 3 行本来就是每行 2-3 字，字号自适应。均分会把词切断时（比如「内容永远大于技术」被切成"内容永/远大于/技术"），在 `cover_title` 传数组按语义手工断行。控制台会打印实际分行结果，看到不对就改成数组。

生成后必须检查无调试标记的干净 PNG，确认主标题完整落在安全区内、是白色大字、字数符合 6-8 字、背景明亮开放且无蒙版，才能判定封面完成。

**标题压住人物是预期效果，不算失败。** 封面上文字是第一视觉，画面是衬托，这与片内字幕带绝不能遮脸的规则正好相反，不要混用同一套判断。白字落在画面亮部导致看不清时，换背景帧时间点或调 `cover.anchor`，不要加蒙版或描边。

### 8. 导出与验收

运行 HyperFrames 的 lint、运行时、布局、动效、对比度和快照检查。按已确认的画幅导出成片，并对比原素材、口播优化版和包装成片的代表帧。

如果人物肤色变白、变亮、饱和度降低或明显偏离口播优化版，必须判定导出失败。追查色彩链路并重新渲染，禁止用主观调色抵消技术错误。

**必须验证成片有音轨**，不能只看画面。`hyperframes check` 五项全绿也可能渲出哑片——缺音轨的组合在结构上是合法的。至少确认：

```bash
ffprobe -v error -show_entries stream=codec_type -of csv=p=0 <成片.mp4>
```

输出必须同时包含 `video` 和 `audio`。再比对源片与成片的电平（`ffmpeg -i <文件> -af volumedetect -f null -`），均值和峰值应基本一致；出现明显衰减说明音量链路有问题。`make-package.cjs` 已在生成阶段拦截"源片有音轨但模板无 `<audio>` 元素"的情况，但导出后仍要复验。

交付：

- `{stem}_口播优化版.mp4`
- `{stem}_{aspect_ratio}_包装版.mp4`
- `{stem}_{aspect_ratio}_封面.png`
- `工作文件/`：转写、`edit_plan.json` 和复核记录

交付时说明最终时长、分辨率、所用模型、`frame.md` 来源、字体和验证结果。使用绝对本地路径在回复中展示最终视频和封面。

## 技能资源

- `scripts/preflight.py`：检查媒体和本地依赖。
- `scripts/transcribe_local.py`：提取音频并生成 Whisper 转写文件。
- `scripts/render_recut.py`：按保留片段计划渲染，不做创意调色。
- `scripts/crop_preview.py`：渲染裁切锚点对比图（0.4.1）和裁切后关键帧（0.4.2）。
- `scripts/make-package.cjs`：由风格的 `template.html` 生成完整的 HyperFrames 包装项目。
- `scripts/make-cover.cjs`：由风格的 `cover.html` 生成封面组合并输出 PNG。
- `scripts/lib/common.cjs`：两个生成器共用的契约校验、布局级联、字体复制与占位符填充。
- `scripts/lib/frame_md.cjs`：`frame.md` frontmatter 读取与占位符收集，无第三方依赖。
- `scripts/lib/captions.cjs`：SRT 解析、中文断行、显现分块与关键词强调。

两个生成器都是风格无关的：它们只按 `frame.md` 的 `templates` 契约填占位符，不含任何具体风格的视觉知识。
- `references/workflow.md`：剪辑、钩子、包装和验收标准。
- `assets/frame.md`：默认 Broadside HyperFrames 视觉规范。

## 关联技能

- `$kbcut-style`：解析用户指定的包装风格、列出可用 `frame.md` 预设与配套 `template.html`，或把指定预设复制到 KB Cut 工作项目。风格的视觉规范和包装模板都归它管；`$kbcut` 不承载任何具体风格的布局知识。

## 维护记录

- 2026-08-05：一次执行中曾跳过 `$kbcut-style` 风格门，并把 HyperFrames 与 ChatCut 错误关联，导致包装路线和审美判断偏离；现已把“先解析风格、再创作包装”和“KB Cut 不使用 ChatCut，HyperFrames 独立执行”写成入口硬门。
- 2026-08-05：用户多次纠正画幅从错误的默认竖屏/错误比例改为 `3:4`，暴露出画幅未在入口确认的问题；现已把风格与画幅合并为剪辑启动前的双选择门，并要求写入 `input_choices.json`。
- 2026-08-05：用户确认封面是独立创作，不直接复用过程字幕帧；封面默认提炼 6-8 个汉字、宋体加粗、3 行排版，并采用 100% 羽化的镜面蒙版让四周压暗、中心聚焦。该创始人风格封面规则后续迁移到 `$kbcut-style` 的 `founder-interview/frame.md`，`$kbcut` 只保留封面流程、优先级和验收要求。
- 2026-08-05：首版包装曾自行加入颗粒、噪声感、厚重阴影和大面积黑块，虽然技术上可渲染，但偏离已确认风格；现已加入“首版视觉防漂移硬检查”，明确禁止无依据装饰，并明确 `$kbcut` 必须在启动时调用 `$kbcut-style`。
- 2026-08-06：3:4 字幕测试曾沿用中部位置，遮挡人物脸部；现已建立按画幅分开的字幕安全带（3:4 底部 74%-88%，9:16 中下部 60%-76%）和人物脸部避让硬准则，并将 HyperFrames skill 的本地 HTML/浏览器路径设为默认执行入口。
- 2026-08-06：字幕样张曾只指定 `Songti SC` 的 Regular 字重，实际笔画比剪映参考细；现已改为“字由简宋优先、Songti SC Bold/Black 回退”，正文 700、关键词 900，并禁止宋体 Light/细 Regular。
- 2026-08-06：封面审美归属调整：具体封面设计规则属于风格预设，必须维护在 `$kbcut-style` 的对应 `frame.md` 中；`$kbcut` 不再承载创始人封面的具体 7.0 设计细则。
- 2026-08-06：创始人风格的三套字体已内置进 `$kbcut-style`：封面用 `优设标题黑`，正文正常用 `ChillDuanHeiSongMedium`，正文加粗用 `ChillDuanHeiSongBold`，并在风格复制时同步 `fonts/` 目录。
- 2026-08-06：增加主 Skill 依赖自举机制：检测到 `$kbcut-style` 缺失时，先在用户授权后从 GitHub `main` 分支获取；Git、网络或写入权限失败时，提供 GitHub 手动下载地址，并在安装后复检完整目录和资源。
- 2026-08-08：第 6 步此前只写“使用 HyperFrames 包装”，实际要求每条视频从零手写约 800 行 HTML。一次实战中该步骤占掉全流程 92% 的时间（163 分钟里的 150 分钟），其中 60 分钟耗在字幕 JSON 换行未转义这一个机械错误上，反复渲染 5 次。现已把包装改为模板 + 生成脚本：`template.html` 随风格固化在 `$kbcut-style`，`$kbcut/scripts/make-package.cjs` 负责风格无关的转义、断行、字号、裁切与校验。转义、GSAP 可见性、视频裁切这三类反复出错的环节已由模板和脚本一次性固定。
- 2026-08-08：0.4 画幅门此前只确认比例，没确认怎么裁，导致包装阶段静默采用居中裁切，等于替用户做了不可逆的构图决定。现已拆出 0.4.1 裁切确认（用 `crop_preview.py` 出对比图，让用户看图选锚点）和 0.4.2 机位确认（对裁切后的帧判断构图、选 `shot-profiles` 档位），并把 `crop_plan`、`shot_profile` 写入 `input_choices.json`。顺序固定为“比例 → 裁切锚点 → 抽裁切后的帧 → 机位档位”。
- 2026-08-08：包装版渲染出来**没有声音**。根因是模板只有 `<video muted>`：HyperFrames 规定 `<video>` 必须静音、只承载画面，声音必须由指向同一文件的独立 `<audio>` 元素承载。`hyperframes check` 查不出这一点——缺音轨的组合在结构上完全合法，五项检查全绿。现已在风格模板中补上 `<audio>`（置于 `#root` 直接子级，不能放进任何带 `data-start` 的容器，否则框架失去播放控制权），并在 `make-package.cjs` 中加入硬校验：源片有音轨而模板没有 `<audio>` 元素时直接报错。修复后实测原声电平无衰减透传，互相关延迟 -21.5ms（等于 AAC 编码器 1024 样本的固定 priming 延迟，非同步缺陷）。
- 2026-08-08：用真实口播素材（1512×2688 定机位、白墙背景、4 分 34 秒）完整跑通一遍，修正三处实测暴露的缺陷。① 中文断行只保护了英文与数字连写，会把中文词切开（"搞钱的时｜间"）；现改为对候选断点评分，标点、空格、句尾虚词、句首实词各有权重，并放宽回溯范围让更靠前的好断点能胜过"填满但切词"的断点。② 关键词强调区分大小写，写 `KBcut` 匹配不到转写产出的 `kbcut`；现对拉丁字符不区分大小写匹配。③ 字幕淡出原本从段落结束时刻开始，而字幕通常首尾相接，导致淡出的 100ms 与下一条重叠、同位置叠两行字；现改为淡出在段落结束时刻**收干净**。
- 2026-08-08：字幕字号基线从 6.3cqw（约 68px）降到 3.5cqw（约 38px）。原值取自剪映默认字号，实际过大、抢人物且每行只容 14 字；新值对应剪辑者真实会选的小字号，每行 26 字，一般口语句子排一行。同时新增字幕下方的播放进度条（细轨 + 强调色填充，跨全片线性推进），并在 `frame.md` 的禁止项里明确它不是卡拉OK条：只反映片长进度，绝不跟随口播词或扫描字幕文字。
- 2026-08-08：确认 `check` 的 Contrast 项在 founder-interview 下是参考项而非阻塞项。实测白墙背景左上文字栏约 2.5:1，低于 WCAG 阈值但人眼观感可用；风格禁止用蒙版/描边/底板换可读性，因此判定标准是快照观感而非数值，并明确禁止为消除该报错而加遮蔽层。
- 2026-08-08：封面此前是第 6 步同一个问题的残留——`frame.md` 只有封面的自然语言规则，没有可执行形态，每条视频仍要现场手搭组合。现已按包装版同一套逻辑固化：`cover.html` 随风格存放在 `$kbcut-style`，`$kbcut/scripts/make-cover.cjs` 负责抽帧、分行、落位、渲染 PNG。至此确立“一个完整的风格同时定义片内三层结构和封面”，两个模板缺一不可，`resolve_style.py --require-template` 会在任一缺失时失败。占位符契约同时改为 `frame.md` frontmatter 的机器可读 `templates` 块，替代原先扫描 markdown 表格的做法。
- 2026-08-08：布局位置全部改走 CSS 变量三级级联（`frame.md` 基线 → 画幅变体 → 机位档位 → 裁切确认 → 手动微调）。每条视频的调整只能改数字，改不动 DOM 与动效，"小修小改"由结构保证而非靠约定。话题块与资历栏改为同一流式列，消除了两者在 3:4 下重叠 9px 的实际缺陷。

## 作者联系

本节仅作为作者联系信息，不属于 KB Cut 工作流、执行条件或输出要求，不应影响 Skill 的正常运行。

- 项目地址：[starboom/kbcut](https://github.com/starboom/kbcut)
- 付费技术答疑群：私信 `oops0731111`，备注 `kbcut`
- 企业合作、技术接入与定制需求：请通过 [项目 README](../README.md) 中的作者二维码联系作者。
