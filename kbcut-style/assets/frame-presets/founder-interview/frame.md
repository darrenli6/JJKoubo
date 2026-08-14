---
version: alpha
id: founder-interview
name: Founder Interview — Founder Typeface Authority Frame
description: >
  A vertical short-form interview overlay preset reverse-engineered from a founder/teacher interview
  sample. The filmed person stays dominant; the frame adds a persistent upper-left topic lockup,
  a compact speaker credential stack, and bundled FounderBody speech-synced captions with white base text and restrained yellow keyword emphasis.
  Best for founder interviews, expert commentary, education sales clips, and trust-building talking
  heads.
unit: the vertical frame — 1080x1920 primary; adapts to 1080x1440 3:4, 1260x2736 capture, and 1:1 crops
principle: filmed person first · topic anchored above · authority proved once · white captions carry the spoken logic · yellow marks only decisive words

colors:
  text-primary: "#FFFFFF"
  text-secondary: "rgba(255,255,255,0.76)"
  text-tertiary: "rgba(255,255,255,0.58)"
  caption-base: "rgba(255,255,255,0.78)"
  caption-emphasis: "#FFD21F"
  accent-primary: "#FFD21F"
  accent-soft: "rgba(255,210,31,0.84)"
  progress-track: "rgba(255,255,255,0.30)"
  progress-fill: "#FFD21F"
  shadow-strong: "rgba(255,255,255,0)"
  shadow-soft: "rgba(255,255,255,0)"
  scrim-top: "rgba(255,255,255,0)"
  scrim-side: "rgba(255,255,255,0)"
  scrim-bottom: "rgba(255,255,255,0)"
  rule: "rgba(255,210,31,0.82)"

radii:
  none: "0px"
  tiny: "4px"

fonts:
  cover-title: "fonts/优设标题黑.ttf"
  body-normal: "fonts/ChillDuanHeiSongMedium.otf"
  body-bold: "fonts/ChillDuanHeiSongBold.otf"

typography:
  display-strong: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 8.8, weight: 700, lineHeight: 0.98, tracking: "0" }
  display-light: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 7.2, weight: 400, lineHeight: 1.02, tracking: "0" }
  display-mid: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 7.4, weight: 400, lineHeight: 1.02, tracking: "0" }
  speaker-name: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 3.6, weight: 700, lineHeight: 1.1, tracking: "0" }
  speaker-detail: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 2.75, weight: 400, lineHeight: 1.18, tracking: "0" }
  caption-base: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 3.5, weight: 400, lineHeight: 1.08, tracking: "0" }
  caption-emphasis: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 3.95, weight: 700, lineHeight: 1.02, tracking: "0" }
  micro-ui: { fontFamily: "FounderBody, Noto Serif CJK SC, serif", cqw: 2.2, weight: 400, lineHeight: 1.2, tracking: "0" }

spacing:
  edge-flush: "0cqw"
  safe-x: "4.8cqw"
  title-top: "4.8cqh"
  title-gap: "0.8cqh"
  title-rule-width: "17cqw"
  title-rule-height: "0.18cqw"
  credentials-top: "18.8cqh"
  credentials-gap: "2.2cqh"
  caption-zone-top: "60cqh"
  caption-zone-bottom: "76cqh"
  caption-zone-3x4-top: "74cqh"
  caption-zone-3x4-bottom: "88cqh"
  caption-max-width: "94cqw"
  progress-gap: "2.2cqh"
  progress-height: "0.34cqh"
  progress-width: "94cqw"
  platform-bottom-reserve-9x16: "18cqh"
  platform-bottom-reserve-3x4: "8cqh"
  subject-clearance: "4cqh"

components:
  footage-grade:
    treatment: "Keep the interview footage natural and bright; do not add scrims or darkening overlays unless the user explicitly requests them."
    background: "Filmed person remains the primary visual; do not cover the face with graphic blocks."
  topic-lockup:
    position: "Upper left; x 0-2cqw, y about 5cqh. It may feel nearly flush to the edge."
    structure: "Two lines, mixed-weight FounderBody spans. Heavy white terms carry the promise; lighter translucent terms complete the phrase."
    typography: "{typography.display-strong} + {typography.display-light} + {typography.display-mid}"
    color: "{colors.text-primary} for all spans; {colors.caption-emphasis} for emphasized spans"
    shadow: "none"
    rule: "A thin horizontal yellow rule may precede the second line."
    function: "Persistent topic anchor and hook. It explains the clip before the viewer parses the spoken caption."
  speaker-credentials:
    position: "Upper left, aligned to the topic-lockup axis, beginning around 19cqh."
    structure: "One bold name line, then 2-4 compact credential lines."
    typography: "{typography.speaker-name} + {typography.speaker-detail}"
    color: "{colors.text-primary} for name; {colors.text-primary} for details"
    shadow: "none"
    function: "Authority proof. It tells the viewer why this person is worth listening to."
  live-caption:
    position: "Aspect-dependent and subject-aware: 9:16 uses 60-76cqh; 3:4 uses the bottom band 74-88cqh. Keep above platform UI and never over the face, eyes, mouth, head, or primary subject area."
    structure: "One spoken phrase per line. Base FounderBody text wraps the sentence; 1-2 key terms become emphasized spans."
    typography: "{typography.caption-base}; emphasized spans use {typography.caption-emphasis}"
    color: "{colors.caption-base}; emphasized spans use {colors.caption-emphasis}"
    shadow: "none"
    maxWidth: "{spacing.caption-max-width}"
    background: "none"
    function: "Comprehension and retention. The emphasis marks the phrase the viewer should remember."
  progress-bar:
    position: "Directly under the caption band, centred, matching the caption safe width. It rides with the captions as one group and stays above the platform UI reserve."
    structure: "A thin track with an accent fill that advances with playback."
    color: "{colors.progress-track} for the track; {colors.progress-fill} for the fill"
    function: "Retention cue. It tells the viewer how much of the clip is left, which is the one piece of information the captions cannot carry."
  cover-design:
    priority: "User's current explicit request > project .kbcut and cover/design principle files > this cover-design component > this frame's general layout rules > generic defaults."
    independence: "The cover is an independent HyperFrames composition, not a reused process frame, dynamic-caption frame, or debug frame."
    title: "Extract the video's core idea into a 6-8 Chinese-character title, split evenly across 3 lines; never stack raw subtitle sentences on the cover. Line length follows from the character count — do not impose a separate per-line count."
    typography: "Bundled 优设标题黑 cover-title face, primary weight 400, white, and as large as the safe area allows. The size is derived from the longest line and the title block's height budget, not fixed per aspect ratio."
    subjectRelation: "The title is the cover's primary read and MAY sit over the filmed person. Overlap is not a defect here — unlike the in-video caption band, which must never cover the face."
    copyLimit: "Do not add explanatory subtitles, labels, badges, or decorative copy unrelated to the core point."
    mask: "Do not darken the cover with a vignette or shadow. Keep the background clean and focus the composition through crop, spacing, and type placement instead."
    verification: "Before delivery, inspect a clean PNG snapshot with no debug marks: the title sits fully inside the safe area, reads as large white type, and stays within 6-8 characters."

templates:
  package:
    file: "template.html"
    placeholders: [TOPIC_LINE_1, TOPIC_LINE_2, SPEAKER_NAME, SPEAKER_CREDENTIALS, CAPTION_SEGMENTS_JSON]
  cover:
    file: "cover.html"
    placeholders: [COVER_TITLE_LINES]

cover-spacing:
  safe-x: "7.2cqw"
  title-block-top: "13cqh"
  title-line-gap: "1.1cqh"
  title-line-height: 1.02
  # The title is deliberately NOT a fixed size. make-cover.cjs derives the
  # largest size that fits both bounds below, so "as large as the safe area
  # allows" is computed rather than guessed. title-size-max is only a ceiling.
  title-max-width: "86cqw"
  title-block-max-height: "62cqh"
  title-size-max: "30cqw"
  # Background brightness varies per shoot and the cover may not be darkened to
  # compensate, so the title colour is a per-video tunable rather than a fixed
  # brand value. White is the default; switch to text-inverse over bright frames.
  title-color: "#FFFFFF"
  cover-anchor-x: "50%"
  cover-anchor-y: "50%"
  cover-scale: 1

cover-aspect-variants:
  "9:16":
    title-block-top: "15cqh"
    title-block-max-height: "58cqh"
  "3:4":
    title-block-top: "12cqh"
    title-block-max-height: "62cqh"
  "4:5":
    title-block-top: "12cqh"
    title-block-max-height: "62cqh"
  "1:1":
    title-block-top: "10cqh"
    title-block-max-height: "60cqh"
    title-size-max: "26cqw"
  "4:3":
    title-block-top: "10cqh"
    title-block-max-height: "62cqh"
    title-size-max: "18cqw"
  "16:9":
    title-block-top: "9cqh"
    title-block-max-height: "62cqh"
    title-size-max: "16cqw"

aspect-variants:
  "9:16":
    type-scale: 1.0
    caption-zone-top: "60cqh"
    caption-zone-bottom: "76cqh"
    caption-max-width: "94cqw"
    title-max-width: "62cqw"
    credentials-max-width: "56cqw"
  "3:4":
    type-scale: 1.0
    caption-zone-top: "74cqh"
    caption-zone-bottom: "88cqh"
    caption-max-width: "94cqw"
    title-max-width: "62cqw"
    credentials-max-width: "56cqw"
  "4:5":
    type-scale: 1.0
    caption-zone-top: "72cqh"
    caption-zone-bottom: "87cqh"
    caption-max-width: "94cqw"
    title-max-width: "62cqw"
    credentials-max-width: "56cqw"
  "1:1":
    type-scale: 0.74
    caption-zone-top: "70cqh"
    caption-zone-bottom: "86cqh"
    caption-max-width: "88cqw"
    title-max-width: "52cqw"
    credentials-max-width: "48cqw"
  "4:3":
    type-scale: 0.62
    caption-zone-top: "68cqh"
    caption-zone-bottom: "85cqh"
    caption-max-width: "80cqw"
    title-max-width: "44cqw"
    credentials-max-width: "40cqw"
  "16:9":
    type-scale: 0.56
    caption-zone-top: "66cqh"
    caption-zone-bottom: "84cqh"
    caption-max-width: "72cqw"
    title-max-width: "40cqw"
    credentials-max-width: "36cqw"

shot-profiles:
  subject-centered:
    label: "人物居中，头顶留白正常"
    video-anchor-y: "50%"
  subject-headroom-tight:
    label: "近景顶天，头顶留白很少"
    video-anchor-y: "20%"
    title-top: "3.4cqh"
  subject-low:
    label: "人物偏下，上方背景空"
    video-anchor-y: "72%"
    title-top: "5.6cqh"
  subject-wide:
    label: "半身远景，人物小、下方空间大"
    video-anchor-y: "42%"
    caption-zone-top: "78cqh"
    caption-zone-bottom: "90cqh"

motion:
  title-enter: "On the first beat, fade 0->1 and translate y 10px->0 over 280-420ms. Then remain fixed."
  credentials-enter: "Follow title by 80-140ms; fade 0->1 and translate y 8px->0 over 260-360ms. Then remain fixed."
  caption-reveal: "Speech-synced left-to-right reveal by character or short token. Each new chunk fades 0->1 over 80-140ms with y 6px->0."
  emphasis-reveal: "Emphasized chunks appear directly as bold yellow using {colors.accent-primary}; optional scale 0.98->1 over 100-160ms. No color sweep."
  caption-exit: "Replace at phrase boundaries with a quick 80-120ms opacity drop, or hard cut on a breath."
  progress-advance: "Fill scales x 0->1 linearly across the whole clip. Strictly linear, no easing, no pulse, no colour change at completion — it reports elapsed time and nothing else."
  prohibited: "No bounce captions, sticker pop, colored word plates, karaoke highlight bars, neon glow, heavy type stroke, grain, particle noise, thick subtitle shadow, large black blocks, or unrequested decorative gradients. The progress bar is not a karaoke bar: it tracks clip elapsed time, never the spoken word, and must never highlight or wipe the caption text itself."
---

# Founder Interview — Founder Typeface Authority Frame

## Overview

This preset is a premium short-form interview overlay. It should feel like a knowledgeable founder
or expert speaking in a clipped social feed, but without the noisy sticker language of generic
short-video templates. The frame is built from trust: the speaker stays visible, the topic is locked
in the upper left, credentials establish authority, and captions make the spoken argument readable
without muting the person.

Use it for founder interviews, course advisors, expert explainers, investor clips, teacher clips,
consultant commentary, or any talking-head video where the viewer needs to trust the speaker quickly.

## The Frame

Primary output is 9:16. Author frame-relative sizes in `cqw`/`cqh` against the composition
container. The preset assumes a filmed portrait background and overlays text only; it is not a card,
dashboard, or illustrated scene preset.

The speaker's face must remain the first read. Place the subject center or center-right when
possible, leaving the upper-left and lower-middle text zones clean. If the footage is already busy,
solve it with crop, spacing, or line breaks rather than adding dark overlays.

## Captions

The caption line is the main active graphic:

- Every caption must use the bundled FounderBody family: `FounderBody` via `ChillDuanHeiSongMedium` for normal text and `ChillDuanHeiSongBold` for emphasis; do not substitute a sans-serif, generic UI font, or a thin regular face.
- Base words are white, using `{colors.caption-base}` and `{typography.caption-base}`.
- One or two decisive keywords per caption use `{colors.accent-primary}` and `{typography.caption-emphasis}`. Yellow is the keyword signal; never color the whole sentence.
- Captions are aspect-dependent: use the 9:16 safe zone `60cqh` to `76cqh`; use the 3:4 bottom band `74cqh` to `88cqh`. Keep the full caption box above platform UI.
- Before finalizing position, inspect the cropped frame. The caption box must not cover the speaker's face, eyes, mouth, head, or primary recognition area; move within the safe band or reframe the subject when it does.
- Size baseline is `3.5cqw` for base text and `3.95cqw` for emphasized spans — about `38px` and `43px` at 1080px composition width, matching the small caption size a CapCut editor actually picks rather than CapCut's oversized default. Captions support the speaker; they do not compete with the person or the topic lockup.
- Keep to one line for short phrases, and wrap longer phrases into at most two compact lines while preserving the emphasized spans. At this size a normal spoken phrase fits on one line.
- Do not add a background pill, colored highlighter, thick stroke, or decorative icon.

The dynamic effect is speech-led. Reveal the text from left to right as the speaker says it; small
token or character chunks are enough. Emphasized terms enter already bold and yellow. Phrase changes
should feel clean and documentary, not like a kinetic typography bumper.

## Floating Text

The upper-left topic lockup is persistent. It functions as the feed hook: a viewer should know the
clip's promise from this text alone. Use two short FounderBody lines, with mixed weights:

- Heavy spans: decisive nouns, product/category terms, rankings, or the strongest promise.
- Light spans: connective wording and supporting context. The strongest one or two terms may use `{colors.accent-primary}` rather than adding another decoration.
- Optional thin rule: place before or through the second line to add structure.

The speaker credential stack sits under the topic lockup. It proves authority, not decoration. Use a
bold name followed by 2-4 short credential lines. Keep the copy factual and compact: domain, years,
role, certification, notable track record.

## Cover Design

The cover belongs to this style. KB Cut should read this section from the selected `frame.md`; it
should not hard-code founder cover aesthetics in the main `$kbcut` entry skill.

Priority for cover decisions:

1. The user's current explicit request.
2. Project-local `.kbcut/` rules and related cover/design principle files.
3. This `Cover Design` section.
4. This frame's general layout rules.
5. Generic defaults.

The cover is an independent HyperFrames composition. Do not use a process packaging frame, dynamic
caption frame, or any frame with edit/debug marks as the cover. When the cover needs the person or
the room as its background, use clean footage or a clean still and compose it specifically for the
cover.

Write the cover title after reading the whole clip and extracting its core idea. The Chinese main
title is 6-8 characters total, split evenly across 3 lines. **There is no separate per-line
character rule** — with 6-8 characters over 3 lines, each line simply holds 2-3, and the type size
adapts. Break on meaning rather than on count when the even split would cut a word: pass the lines
explicitly instead of a single string. Do not pile raw subtitle sentences onto the cover, and do
not create a claim that the source material does not support.

Use the bundled `优设标题黑` face for the main title, in white. The title is the cover's loudest
element: `make-cover.cjs` derives the largest size that fits both `title-max-width` (from the
longest line) and `title-block-max-height` (from the line count), capped by `title-size-max`. Do not
hard-code a size per video — if the title looks too small, the title block's budget in `frame.md`
is what to change, and it changes for every video in that style at once.

The title may overlap the filmed person. On the cover the type leads and the picture supports it;
that is the opposite of the in-video caption band, which must never cover the face. What the title
must not do is leave the safe area. Where white type lands on a bright part of the frame, fix it by
choosing a different background timestamp or moving the crop anchor — never by adding a scrim.

Do not add explanatory subtitles, badges, labels, or decorative copy that does not serve the core
point.

Use a bright, open cover composition: no vignette, no dark scrim, no shadow mask, no hard black
block. Focus the composition through crop, spacing, title placement, and line breaks instead.

Before delivery, inspect a clean PNG snapshot with no debug marks. The cover passes when the title
sits fully inside the safe area, reads as large white type, follows the 6-8 character rule, and the
background stays bright and open with no scrim. The title crossing the person is expected and does
not fail the check.

## Composition Rules

### Do

- Keep the filmed person dominant; overlays should explain, not compete.
- Use upper-left text as the persistent topic hook.
- Use the credential stack once, compactly, to establish trust.
- Make only the most important caption terms bold yellow; keep the rest white.
- Do not use black shadow/scrim for readability over footage.
- Preserve safe area for bottom platform UI when exporting for social apps.
- Keep the caption box below the face/head region; a caption over the speaker is a layout failure, not a readability problem.

### Don't

- Do not put subtitles in a card, pill, or colored rectangle.
- Do not cover the speaker's face with topic text or captions.
- Do not animate every word with bounce, scale punches, or sticker effects.
- Do not use negative letter spacing; Chinese text should keep `tracking: 0`.
- Do not use yellow for a full sentence, decorative bars, or large blocks; reserve it for the one or two decisive keywords.

## Content Inputs

This preset ships two templates, and the style owns both: `template.html` is what the
video looks like from the inside, `cover.html` is what it looks like from the outside.
A style is not complete with only one of them.

The machine-readable contract lives in the `templates` block of the frontmatter.
`make-package.cjs` and `make-cover.cjs` validate their template against it in both
directions and refuse to generate when the two sides disagree. The tables below are the
human-readable form of that same contract.

Packaging template (`template.html`) placeholders:

| Field | Placeholder | Form |
| --- | --- | --- |
| `topic_line_1` | `{{TOPIC_LINE_1}}` | HTML fragment with `.t-strong` / `.t-light` / `.t-accent` spans |
| `topic_line_2` | `{{TOPIC_LINE_2}}` | HTML fragment with `.t-strong` / `.t-light` / `.t-accent` spans |
| `speaker_name` | `{{SPEAKER_NAME}}` | plain text |
| `speaker_credentials` | `{{SPEAKER_CREDENTIALS}}` | 2-4 `<div class="credential">` lines |
| `caption_segments` | `{{CAPTION_SEGMENTS_JSON}}` | JSON array of `{start, end, lines}` |
| `caption_highlights` | — | carried inside `caption_segments`, as `chunk.emphasis` |

Cover template (`cover.html`) placeholders:

| Field | Placeholder | Form |
| --- | --- | --- |
| `cover_title` | `{{COVER_TITLE_LINES}}` | 3 `<div class="cover-title-line">` lines, 3-4 characters each |
| `cover_background` | — | supplied as `{{COVER_BACKGROUND_SRC}}`, a still extracted by `make-cover.cjs` |

The cover stays an **independent composition**: it shares this preset's fonts, colors and
brand constraints, but not the packaging layout. It has its own spacing block
(`cover-spacing`), its own aspect variants (`cover-aspect-variants`), and its own crop
anchor. Never render a cover by screenshotting a packaged frame.

Reserved technical placeholders, supplied by the scripts rather than by content:
`{{COMPOSITION_ID}}`, `{{COMPOSITION_WIDTH}}`, `{{COMPOSITION_HEIGHT}}`,
`{{DURATION_SECONDS}}`, `{{LAYOUT_VARS}}`, `{{VIDEO_SRC}}`, `{{COVER_BACKGROUND_SRC}}`,
`{{FONT_BODY_NORMAL}}`, `{{FONT_BODY_BOLD}}`, `{{FONT_COVER_TITLE}}`.

## Layout Variables

Every position in `template.html` resolves through a CSS custom property. Per-video
adjustment changes these numbers and nothing else — the DOM, motion, and colors stay frozen.

Resolution order: this frame's `spacing` baseline → aspect-ratio variant → shot profile override.

| Variable | Baseline source | Adjusted per video? |
| --- | --- | --- |
| `--safe-x` | `{spacing.safe-x}` | rarely |
| `--title-top` | `{spacing.title-top}` | yes — headroom varies by framing |
| `--title-gap` | `{spacing.title-gap}` | no |
| `--title-rule-width` / `--title-rule-height` | `{spacing.title-rule-*}` | no |
| `--credentials-top` | `{spacing.credentials-top}` | yes — follows the topic block |
| `--caption-zone-top` / `--caption-zone-bottom` | `{spacing.caption-zone-*}` | yes — must clear the subject |
| `--caption-max-width` | `{spacing.caption-max-width}` | rarely |
| `--video-anchor-x` / `--video-anchor-y` | crop plan | yes — this is the crop anchor |
| `--video-scale` | `1` | yes — optional push-in |
| `--title-size` / `--speaker-name-size` / `--speaker-detail-size` / `--caption-size` / `--caption-emphasis-size` | `typography` `cqw` values | derived from aspect ratio |

## Aspect-Ratio Behavior

| Treatment | 9:16 | 3:4 | 1:1 | 16:9 |
| --- | --- | --- | --- | --- |
| Topic lockup | Upper left, large, nearly edge-flush | Upper left, keep inside safe-x and leave title breathing room | Upper left, scale down to 70-78% | Upper left, reduce to 52-60% and keep inside safe-x |
| Speaker credentials | Under topic, 2-4 lines | Under topic, 2-3 tighter lines | Under topic or top-right if the face needs space | Under topic, smaller and tighter |
| Captions | Safe zone, 60-76cqh; never over face/head | Bottom band, 74-88cqh; max two lines; never over face/head | Lower third, centered, avoid subject | Lower third, centered, max width 72cqw, avoid subject |
| Footage | Portrait center/right | Portrait center/right, preserve headroom | Face centered, crop shoulders | Interview split or medium shot |
