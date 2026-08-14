#!/usr/bin/env node
"use strict";

/**
 * Generate the cover composition from a style's cover.html.
 *
 * The mirror of make-package.cjs: same contract, same layout cascade, same
 * style ownership. A style owns how its videos look from the inside
 * (template.html) and from the outside (cover.html); neither script carries
 * any style-specific visual knowledge.
 *
 * Usage:
 *   node make-cover.cjs \
 *     --input-choices <work>/input_choices.json \
 *     --video <work>/<stem>_口播优化版.mp4 --at 52.5 \
 *     --output <work>/hyperframes/cover \
 *     --png <work>/交付文件/<stem>_3x4_封面.png
 *
 * Pass --background <file.png> instead of --video/--at to use a still you
 * already picked.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const { parseFrameMd } = require("./lib/frame_md.cjs");
const {
  anchorToPosition,
  buildLayoutCss,
  copyFonts,
  escapeHtml,
  fail,
  fillTemplate,
  parseArgs,
  probeDimensions,
  probeDuration,
  readJson,
  resolveLayoutVars,
  resolveStyleFiles,
  syncFile,
  toNumber,
  validateContract,
} = require("./lib/common.cjs");

const COMPOSITION_ID = "kbcut-cover";
const DURATION_SECONDS = "1.000";
const TITLE_LINES = 3;

/**
 * Split a 6-8 character title across three lines as evenly as possible.
 *
 * frame.md wants the core idea in three short lines; an explicit array in
 * input_choices always wins, because a human breaking on meaning beats an even
 * split on count.
 */
function splitTitle(title) {
  const chars = [...String(title)];
  const base = Math.floor(chars.length / TITLE_LINES);
  const extra = chars.length % TITLE_LINES;

  const lines = [];
  let cursor = 0;
  for (let i = 0; i < TITLE_LINES; i += 1) {
    const size = base + (i < extra ? 1 : 0);
    if (size === 0) continue;
    lines.push(chars.slice(cursor, cursor + size).join(""));
    cursor += size;
  }
  return lines;
}

/**
 * Derive the largest title size that still fits the safe area.
 *
 * frame.md asks for the title to be "as large as the safe area allows", which
 * is a computation, not a constant. Two bounds apply:
 *
 *   width  — the longest line must fit `title-max-width`. CJK glyphs are ~1em
 *            wide, so the bound is simply that width divided by the character
 *            count.
 *   height — all lines plus their gaps must fit `title-block-max-height`.
 *
 * Sizes are cqw (a share of composition width) while the height budget is cqh
 * (a share of composition height), so the vertical bound is resolved in pixels
 * and converted back. Deriving this is also what removes the old contradiction
 * between "6-8 characters total" and a fixed per-line count: the line length
 * follows from the title, and the size follows from the line length.
 */
function deriveTitleSize(lines, vars, width, height) {
  const maxWidthCqw = toNumber(vars["--title-max-width"]) ?? 86;
  const maxHeightCqh = toNumber(vars["--title-block-max-height"]) ?? 62;
  const lineHeight = toNumber(vars["--title-line-height"]) ?? 1.02;
  const gapCqh = toNumber(vars["--title-line-gap"]) ?? 1.1;
  const capCqw = toNumber(vars["--title-size-max"]) ?? 30;

  const longest = Math.max(...lines.map((line) => [...line].length), 1);
  const byWidth = (maxWidthCqw / longest) * 0.98;

  const budgetPx = (maxHeightCqh / 100) * height;
  const gapPx = (gapCqh / 100) * height;
  const perLinePx = (budgetPx - (lines.length - 1) * gapPx) / (lines.length * lineHeight);
  const byHeight = (perLinePx / width) * 100;

  const chosen = Math.min(byWidth, byHeight, capCqw);
  return {
    size: `${Math.max(4, chosen).toFixed(2)}cqw`,
    bound: chosen === capCqw ? "cap" : byWidth < byHeight ? "width" : "height",
  };
}

function extractStill(video, at, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    execFileSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        String(at),
        "-i",
        video,
        "-frames:v",
        "1",
        "-y",
        target,
      ],
      { stdio: "inherit" },
    );
  } catch (error) {
    fail(`could not extract a cover still at ${at}s from ${video}`, error.message);
  }
}

function main() {
  const args = parseArgs(process.argv);

  if (!args["input-choices"]) fail("--input-choices is required");
  if (!args.output) fail("--output is required");
  if (!args.video && !args.background) {
    fail("provide --video (with --at) or --background");
  }

  const choicesPath = path.resolve(args["input-choices"]);
  const choices = readJson(choicesPath);

  const { framePath, templatePath } = resolveStyleFiles(choices, args, "cover", "cover.html");
  const frame = parseFrameMd(fs.readFileSync(framePath, "utf8"));
  const template = fs.readFileSync(templatePath, "utf8");

  validateContract(frame, template, "cover");

  const width = choices.width;
  const height = choices.height;
  if (!width || !height) fail("input_choices.json is missing width/height");

  const outputDir = path.resolve(args.output);
  fs.mkdirSync(outputDir, { recursive: true });

  /* --- background still --- */
  const backgroundName = "cover-background.png";
  const backgroundTarget = path.join(outputDir, backgroundName);
  let backgroundAt = null;

  if (args.background) {
    syncFile(path.resolve(args.background), backgroundTarget);
  } else {
    const video = path.resolve(args.video);
    if (!fs.existsSync(video)) fail(`video not found: ${video}`);
    const duration = probeDuration(video);
    backgroundAt = args.at !== undefined ? Number(args.at) : (duration ?? 2) / 2;
    if (!Number.isFinite(backgroundAt)) fail(`--at must be a number of seconds, got ${args.at}`);
    extractStill(video, backgroundAt, backgroundTarget);
  }

  const backgroundSize = probeDimensions(backgroundTarget);

  /* --- title --- */
  const content = choices.package_content || {};
  const rawTitle = content.cover_title;
  if (!rawTitle) {
    fail(
      "input_choices.package_content.cover_title is missing",
      "Extract the clip's core idea into 6-8 Chinese characters before building the cover.",
    );
  }

  const lines = Array.isArray(rawTitle) ? rawTitle.filter(Boolean) : splitTitle(rawTitle);
  const titleLength = Array.isArray(rawTitle)
    ? rawTitle.join("").length
    : [...String(rawTitle)].length;

  if (titleLength < 6 || titleLength > 8) {
    console.warn(
      `⚠ 封面标题 ${titleLength} 字，frame.md 规定 6-8 字。` +
        `字数超出会挤压安全区，请回到核心观点重新提炼。`,
    );
  }
  if (lines.length > TITLE_LINES) {
    console.warn(`⚠ 封面标题 ${lines.length} 行，frame.md 规定 3 行。`);
  }

  const titleHtml = lines
    .map((line) => `<div class="cover-title-line">${escapeHtml(line)}</div>`)
    .join("\n        ");

  /* --- layout cascade --- */
  const coverChoices = choices.cover || {};
  const anchorLayer = {};
  if (coverChoices.anchor) {
    anchorLayer["cover-anchor-y"] = anchorToPosition(coverChoices.anchor, coverChoices.offset_y);
  }
  if (coverChoices.offset_x) anchorLayer["cover-anchor-x"] = coverChoices.offset_x;
  if (coverChoices.scale) anchorLayer["cover-scale"] = String(coverChoices.scale);

  const variants = frame["cover-aspect-variants"] || {};
  if (!variants[choices.aspect_ratio]) {
    console.warn(
      `make-cover: frame.md declares no cover-aspect-variant for ${choices.aspect_ratio}; ` +
        `using the style baseline.`,
    );
  }

  const vars = resolveLayoutVars([
    frame["cover-spacing"],
    variants[choices.aspect_ratio],
    anchorLayer,
    coverChoices.layout_overrides,
  ]);

  // Derived after the cascade so it respects any overridden budget, but before
  // an explicit --title-size override, which still wins if the caller set one.
  const derived = deriveTitleSize(lines, vars, width, height);
  if (!vars["--title-size"]) vars["--title-size"] = derived.size;

  /* --- fonts --- */
  const fontFiles = copyFonts(frame, framePath, outputDir, {
    "cover-title": "FONT_COVER_TITLE",
  });

  /* --- write --- */
  const html = fillTemplate(template, {
    COMPOSITION_ID,
    COMPOSITION_WIDTH: String(width),
    COMPOSITION_HEIGHT: String(height),
    DURATION_SECONDS,
    COVER_BACKGROUND_SRC: backgroundName,
    COVER_TITLE_LINES: titleHtml,
    LAYOUT_VARS: buildLayoutCss(vars),
    ...fontFiles,
  });

  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
  syncFile(framePath, path.join(outputDir, "frame.md"));

  const report = {
    generated_from: {
      input_choices: choicesPath,
      frame: framePath,
      template: templatePath,
      background: args.background ? path.resolve(args.background) : path.resolve(args.video),
      background_at: backgroundAt,
    },
    composition: { width, height },
    background_size: backgroundSize,
    title: {
      lines,
      characters: titleLength,
      size: vars["--title-size"],
      size_bound: vars["--title-size"] === derived.size ? derived.bound : "override",
    },
    layout_vars: vars,
  };
  fs.writeFileSync(
    path.join(outputDir, "build-report.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.log(`✓ ${path.join(outputDir, "index.html")}`);
  console.log(`  画幅      ${width}×${height} (${choices.aspect_ratio})`);
  console.log(`  标题      ${lines.join(" / ")}  (${titleLength} 字，${lines.length} 行)`);
  console.log(
    `  字号      ${vars["--title-size"]}` +
      (vars["--title-size"] === derived.size
        ? `（按安全区推导，受${{ width: "行宽", height: "块高", cap: "上限" }[derived.bound]}约束）`
        : "（layout_overrides 指定）"),
  );
  console.log(`  背景      ${backgroundName}${backgroundAt !== null ? ` @ ${backgroundAt}s` : ""}`);
  console.log(`  裁切锚点  ${vars["--cover-anchor-x"]} ${vars["--cover-anchor-y"]}`);

  /* --- optional PNG --- */
  if (args.png) {
    const png = path.resolve(args.png);
    fs.mkdirSync(path.dirname(png), { recursive: true });
    const staging = path.join(outputDir, ".snapshot");
    try {
      execFileSync(
        "npx",
        ["hyperframes", "snapshot", outputDir, "--at", "0.5s", "-o", staging],
        { stdio: "inherit" },
      );
    } catch (error) {
      fail("hyperframes snapshot failed", error.message);
    }
    const produced = fs
      .readdirSync(staging)
      .filter((name) => name.startsWith("frame-") && name.endsWith(".png"));
    if (produced.length === 0) fail(`snapshot produced no PNG in ${staging}`);
    fs.copyFileSync(path.join(staging, produced[0]), png);
    console.log(`\n✓ 封面 PNG  ${png}`);
    console.log("  交付前请检查：标题完整落在安全区内、白色大字、6-8 字、背景明亮无蒙版。");
    console.log("  标题压住人物是预期效果，不算失败。");
  } else {
    console.log(`\n下一步：npx hyperframes snapshot ${outputDir} --at 0.5s -o <目录>`);
  }
}

main();
