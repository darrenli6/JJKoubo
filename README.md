# JJ Koubo Skills

[中文说明](README-zh.md)

JJ Koubo is a local-first collection of video editing Skills for talking-head, interview, knowledge-sharing, and other videos centered on spoken content. The Skills can be used through Codex or other compatible Agent environments.

## Introduction

This repository currently contains two Skills:

- [`kbcut`](kbcut/SKILL.md): the main editing workflow for local transcription, talking-head recuts, hook selection, HyperFrames motion captions, and cover delivery.
- [`kbcut-style`](kbcut-style/SKILL.md): parses `frame.md` style presets and font roles. `kbcut` calls it before creating visual packaging and covers.

The project uses an extensible `kbcut-*` Skill family structure. When adding a new capability, create a new sibling directory instead of continuing to place every feature in the main Skill. Examples include `kbcut-vlog`, `kbcut-podcast`, and `kbcut-export`.

## Installation

Copy or symlink the Skill directories into the skills directory used by your Agent environment:

```text
skills/
├── kbcut/
└── kbcut-style/
```

In Codex, these usually correspond to:

```text
~/.codex/skills/kbcut
~/.codex/skills/kbcut-style
```

Each Skill's `SKILL.md`, `agents/` metadata, and referenced `assets/`, `references/`, and `scripts/` must remain in the same directory.

## Usage

Start a complete editing task with `kbcut`. During startup it automatically resolves `kbcut-style`, asks you to confirm the aspect ratio, and then proceeds with transcription, editing, and visual packaging.

### Workflow

![KB Cut workflow](./pic/kbcut%20使用流程.png)

1. Prepare a talking-head, interview, or knowledge-sharing video and place the source material in a local project directory.
2. Call `kbcut` in a compatible Agent environment such as Doubao, WorkBuddy, Claude Code, or Codex, providing the material path and editing goals.
3. `kbcut` calls `kbcut-style` to determine the `frame.md` style, font roles, and cover specifications. After the aspect ratio is confirmed, it performs local transcription, content recutting, hook optimization, and visual packaging.
4. The local project directory receives the optimized edit, packaged versions in the selected aspect ratio, cover image, and reviewable working files.

`kbcut-style` is the visual-specification entry point for the complete workflow and does not need to be run manually. You can also call it separately when you need to browse, parse, or test a style preset.

To list or parse `frame.md` style presets directly:

```bash
python3 kbcut-style/scripts/resolve_style.py --list
python3 kbcut-style/scripts/resolve_style.py founder-interview --project-root .
```

The workflow is local-first. Source material, transcripts, working files, previews, and final deliverables should remain in the user's project directory; source videos are not uploaded by default.

## Repository Structure

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
```

## Adding a Skill

Create a top-level directory named `kbcut-<capability>`, with at least a complete `SKILL.md`. Add sibling `agents/`, `assets/`, `references/`, and `scripts/` directories as needed.

Each Skill should have a clear responsibility and a trigger description in its frontmatter. When a new Skill is published, update this README's Skill list and repository structure at the same time.

## Project Status

This is the reinitialized version of the original `starboom/kbcut` project. The project has changed from a user-facing “AI video editing tool” code repository into a local video-creation Skill family made up of multiple `kbcut-*` Skills.

The Skill directories in this repository are the single source of truth.

## Features

### `kbcut`

- Local Whisper transcription without uploading video or audio by default.
- Automatic detection and handling of breaths, filler words, repeated phrasing, self-corrections, and verbal slips.
- Finds stronger opening hooks in the full talking-head content and moves them forward while preserving the original meaning.
- Uses FFmpeg to create an optimized talking-head edit while preserving the subject's original color and natural delivery rhythm.
- Creates HyperFrames motion-caption packaging and a separate cover after the aspect ratio is confirmed.
- Reviews transcription, edit joins, caption placement, subject-safe areas, color, and output specifications before delivery.

### `kbcut-style`

- Provides unified parsing for the `frame.md` style specifications used by KB Cut.
- Supports built-in styles, project-level styles, and an explicitly supplied `frame.md`.
- Manages motion captions, cover design, font roles, colors, spacing, and safe-area rules.
- Copies style presets and their font resources into a specific editing project.
- Provides a unified visual-specification entry point for future `kbcut-*` Skills.

## FAB Overview

### Feature

KB Cut organizes local video transcription, talking-head recutting, hook optimization, motion-caption packaging, and cover creation into a callable Skill workflow. `kbcut-style` manages styles, fonts, and cover rules separately.

### Advantage

It is not an editing tool with every feature hard-coded into a single script. It is a Skill family that can continuously grow with new `kbcut-*` capabilities. Content processing and visual styling are separated, so editing and design rules can be reused, replaced, and traced. The local-first workflow also keeps source material, transcripts, and deliverables in the user's own project directory.

### Benefit

Talking-head creators, knowledge creators, interview editors, and content teams can use one consistent entry point to move quickly from raw material to publishable video while retaining control over editing decisions, visual style, font resources, and final files. As new `kbcut-*` Skills are added, the same workflow can expand to vlogs, podcasts, courses, and other video types.

## Contact and Collaboration

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./assets/darren.png" alt="Author contact QR code" width="280">
      <br>
      Author contact
    </td>
  </tr>
</table>

## License

This project is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), with copyright belonging to the `starboom/kbcut` project.

Personal use, learning, research, and non-commercial projects are permitted. Please credit the source when publishing derivative works. Commercial use requires separate authorization; contact the author for details.
