# JJ Koubo Skills

[English README](README.md)

JJ Koubo 是一组本地优先的视频剪辑 Skill，面向口播、访谈、知识分享等以人声表达为核心的视频内容，可通过 Codex 或其他兼容的 Agent 运行环境使用。

## 介绍

本仓库目前包含两个 Skill：

- [`kbcut`](kbcut/SKILL.md)：主剪辑流程，负责本地转写、口播重剪、钩子选择、HyperFrames 动态字幕包装和封面交付。
- [`kbcut-style`](kbcut-style/SKILL.md)：`frame.md` 风格预设与字体角色解析。`kbcut` 在开始包装和封面设计前会调用它。

本项目采用可扩展的 `kbcut-*` Skill 集合结构。后续新增能力时，应创建新的同级目录，而不是把所有功能继续堆进主 Skill。例如：`kbcut-vlog`、`kbcut-podcast` 或 `kbcut-export`。

## 口播产出展示

下面是使用 `founder-interview` 风格完成的一次口播产出示例：

| 口播包装帧 | 独立封面 |
| --- | --- |
| ![口播包装帧](./assets/prd/1.png) | ![口播独立封面](./assets/prd/2.png) |

口播包装帧保留人物作为第一视觉，在画面上方固定展示主题和身份信息，并在安全区域同步显示字幕。独立封面从视频核心观点提炼标题，使用同一套风格字体和视觉规范，但不复用视频内字幕布局。

## 一次剪辑会得到什么

完成一次 KB Cut 任务后，项目目录中通常会得到：

- `*_口播优化版.mp4`：去除无效停顿、废话、重复表达和明显口误后的基础成片。
- `*_9x16_包装版.mp4`：带动态字幕、主题信息、身份信息和进度条的发布版；画幅也可以确认使用 `3:4`、`1:1` 等比例。
- `*_9x16_封面.png`：独立封面图，不直接截取带字幕的过程帧。
- `kbcut工作文件/`：转写文件、剪辑计划、风格副本、HyperFrames 项目、快照和验收记录，便于复核与再次调整。

整个流程默认在本地完成：源视频、Whisper 转写、FFmpeg 重剪、HyperFrames 包装和最终文件都保存在用户指定的项目目录中。

## 安装

将 Skill 目录复制或软链接到 Agent 运行环境使用的 skills 目录：

```text
skills/
├── kbcut/
└── kbcut-style/
```

在 Codex 中，通常对应以下路径：

```text
~/.codex/skills/kbcut
~/.codex/skills/kbcut-style
```

每个 Skill 的 `SKILL.md`、`agents/` 元数据，以及它引用的 `assets/`、`references/` 和 `scripts/` 都必须保持在同一个目录中。

## 使用

完整剪辑任务从 `kbcut` 开始。它会在启动阶段自动解析 `kbcut-style`，然后要求确认画幅，再进入转写、剪辑和视觉包装流程。

### 使用流程

1. 准备拍摄完成的口播、访谈或知识分享视频，并将素材放在本地项目目录中。
2. 在豆包、WorkBuddy、Claude Code、Codex 等兼容的 Agent 环境中调用 `kbcut`，提交素材路径和剪辑目标。
3. `kbcut` 调用 `kbcut-style`，确定 `frame.md` 风格、字体角色与封面规范；确认输出画幅后，开始本地转写、内容重剪、钩子优化和视觉包装。
4. 在本地项目目录中获得口播优化版、指定画幅包装版、封面图片及可复核的工作文件。

`kbcut-style` 是完整流程中的视觉规范入口，不需要用户手动重复执行。需要浏览、解析或测试某个风格预设时，也可以单独调用它。

如果只需要列出或解析 `frame.md` 风格预设，可以直接使用 `kbcut-style`：

```bash
python3 kbcut-style/scripts/resolve_style.py --list
python3 kbcut-style/scripts/resolve_style.py --style founder-interview --project . --require-template
```

也可以在 Agent 中直接调用：

```text
使用 $kbcut 剪辑 /绝对路径/视频.mp4
风格：founder-interview
画幅：9:16
```

启动后，`kbcut` 会依次确认风格、个人 IP 信息、字体、画幅、裁切/机位和开头钩子策略，再开始转写与生成文件。

整个工作流以本地处理为原则。原始素材、转写结果、工作文件、预览和最终交付物都应保存在用户项目目录中，默认不上传源视频。

## 仓库结构

```text
kbcut/
├── SKILL.md
├── agents/openai.yaml
├── assets/frame.md
├── references/workflow.md
└── scripts/

kbcut-style/
├── SKILL.md
├── agents/openai.yaml
├── assets/frame-presets/
└── scripts/resolve_style.py

assets/prd/
├── 1.png                         # 口播包装帧示例
└── 2.png                         # 独立封面示例
```

## 新增 Skill

创建新的顶层目录 `kbcut-<能力名称>`，并至少提供完整的 `SKILL.md`。根据需要添加同级的 `agents/`、`assets/`、`references/` 和 `scripts/` 目录。

每个 Skill 都应保持职责清晰，在 frontmatter 中写明触发描述；当新 Skill 对外发布后，同时更新本 README 中的 Skill 列表和仓库结构说明。

## 项目状态

这是原 `starboom/kbcut` 项目的重新初始化版本。项目已经从面向用户的“视频 AI 剪辑工具”代码仓库，转变为由多个 `kbcut-*` Skill 组成的本地视频创作 Skill 集合。

当前仓库中的 Skill 目录是项目的唯一事实来源。

## 技能特性

### `kbcut`

- 本地 Whisper 转写，不默认上传视频或音频素材。
- 自动识别并处理气口、废话、重复表达、自我纠正和口误。
- 从完整口播内容中寻找更有力的开头钩子，并在保持原意的前提下前置。
- 使用 FFmpeg 生成口播优化版，保留人物原始色彩和自然表达节奏。
- 根据确认后的画幅制作 HyperFrames 动态字幕包装和独立封面。
- 在交付前复核转写、剪辑接缝、字幕位置、人物避让、色彩和输出规格。

### `kbcut-style`

- 统一解析 KB Cut 使用的 `frame.md` 风格规范。
- 支持内置风格、项目级风格和用户显式提供的 `frame.md`。
- 管理动态字幕、封面设计、字体角色、颜色、间距和安全区规则。
- 支持将风格预设及其字体资源复制到具体剪辑项目。
- 为后续 `kbcut-*` Skill 提供统一的视觉规范入口。

## FAB 介绍

### Feature｜功能

KB Cut 将本地视频转写、口播内容重剪、钩子优化、动态字幕包装和封面制作组织成一套可调用的 Skill 工作流；`kbcut-style` 则把风格、字体和封面规则独立管理。

### Advantage｜优势

它不是一个把所有功能写死在单一脚本里的剪辑工具，而是一个可以持续增加 `kbcut-*` 能力的 Skill family。内容处理与视觉风格分离，剪辑规则和设计规则都能被复用、替换和追溯；本地优先的工作方式也让素材、转写和交付文件留在用户自己的项目目录中。

### Benefit｜收益

口播博主、知识创作者、访谈剪辑师和内容团队可以用统一入口快速完成从原始素材到可发布成片的流程，同时保留对剪辑决策、视觉风格、字体资源和最终文件的控制。随着新的 `kbcut-*` Skill 加入，同一套工作方式可以扩展到 vlog、播客、课程和其他视频类型。

## 联系与合作

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./assets/zsxq.png" alt="作者联系二维码" width="280">
      <br>
      作者联系
    </td>
    
  </tr>
</table>

## 许可证

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可证，版权归 `starboom/kbcut` 项目所有。

个人使用、学习、研究与非商业项目可以直接使用。公开发布衍生作品时，请注明来源。商业用途需要单独授权，请联系作者。
