"use strict";

/**
 * Shared plumbing for the KB Cut template generators.
 *
 * Both make-package.cjs (in-video three-layer packaging) and make-cover.cjs
 * (cover) fill a style-owned template from a style-owned frame.md. Everything
 * that is the same between them lives here; everything that differs is the
 * style's business, not this file's.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const { collectPlaceholders } = require("./frame_md.cjs");

/**
 * Placeholders the scripts supply themselves. A style never declares these in
 * frame.md's `templates` block, but a template may use them freely.
 */
const RESERVED_PLACEHOLDERS = new Set([
  "COMPOSITION_ID",
  "COMPOSITION_WIDTH",
  "COMPOSITION_HEIGHT",
  "DURATION_SECONDS",
  "LAYOUT_VARS",
  "VIDEO_SRC",
  "COVER_BACKGROUND_SRC",
  "FONT_BODY_NORMAL",
  "FONT_BODY_BOLD",
  "FONT_COVER_TITLE",
]);

function fail(message, hint) {
  const lines = [`${path.basename(process.argv[1] || "kbcut")}: ${message}`];
  if (hint) lines.push(`  → ${hint}`);
  console.error(lines.join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`cannot read JSON from ${file}`, error.message);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Parse "60cqh" / "4.8cqw" / 1.0 into a number, dropping the unit. */
function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === undefined || value === null) return null;
  const match = String(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function ffprobeJson(video, extra) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", ...extra, "-of", "json", video],
      { encoding: "utf8" },
    );
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function probeDimensions(video) {
  const data = ffprobeJson(video, [
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
  ]);
  const stream = data && data.streams && data.streams[0];
  if (!stream || !stream.width || !stream.height) return null;
  return { width: stream.width, height: stream.height };
}

function hasAudioStream(media) {
  const data = ffprobeJson(media, ["-select_streams", "a", "-show_entries", "stream=index"]);
  return Boolean(data && Array.isArray(data.streams) && data.streams.length > 0);
}

function probeDuration(video) {
  const data = ffprobeJson(video, ["-show_entries", "format=duration"]);
  const value = data && data.format && Number(data.format.duration);
  return Number.isFinite(value) ? value : null;
}

/**
 * Warn when the reframe throws away most of the picture. Not fatal: the user
 * may have confirmed exactly this crop at the 0.4.1 gate.
 */
function warnOnHeavyCrop(source, width, height) {
  if (!source) return null;
  const sourceRatio = source.width / source.height;
  const targetRatio = width / height;
  const loss = 1 - Math.min(sourceRatio, targetRatio) / Math.max(sourceRatio, targetRatio);
  if (loss > 0.35) {
    console.warn(
      `⚠ 把 ${source.width}×${source.height} 裁进 ${width}×${height} 会丢掉约 ` +
        `${Math.round(loss * 100)}% 的画面，人物可能装不下。渲染前请确认裁切方案。`,
    );
  }
  return loss;
}

/**
 * Validate a template against the style's declared contract.
 *
 * `kind` selects the entry in frame.md's `templates` block. Errors when the
 * template uses a placeholder the style never declared; warns when the style
 * declares one the template ignores. Reserved placeholders are exempt.
 */
function validateContract(frame, templateText, kind) {
  const entry = ((frame.templates || {})[kind] || {});
  const declared = new Set(entry.placeholders || []);
  if (declared.size === 0) {
    console.warn(
      `frame.md declares no templates.${kind}.placeholders; skipping the contract check. ` +
        `Add the block so a mistyped placeholder fails loudly instead of rendering blank.`,
    );
    return;
  }

  const used = collectPlaceholders(templateText);
  const undeclared = used.filter(
    (name) => !declared.has(name) && !RESERVED_PLACEHOLDERS.has(name),
  );
  const unused = [...declared].filter((name) => !used.includes(name));

  if (undeclared.length > 0) {
    fail(
      `${kind} template uses placeholders frame.md does not declare: ${undeclared.join(", ")}`,
      `Add them to templates.${kind}.placeholders in frame.md, or remove them from the template.`,
    );
  }
  if (unused.length > 0) {
    console.warn(
      `frame.md declares ${kind} placeholders the template never uses: ${unused.join(", ")}`,
    );
  }
}

/**
 * Resolve the CSS custom properties a template reads.
 *
 * Layers are applied lowest precedence first. Each is a plain object of
 * unprefixed keys ("title-top") or already-prefixed ones ("--title-top");
 * both forms are accepted so callers can pass frame.md blocks directly.
 */
function resolveLayoutVars(layers) {
  const vars = {};
  for (const layer of layers) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined || value === null) continue;
      vars[key.startsWith("--") ? key : `--${key}`] = value;
    }
  }
  return vars;
}

function buildLayoutCss(vars, indent = "        ") {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(`\n${indent}`);
}

/** Map a confirmed crop anchor onto an object-position value. */
function anchorToPosition(anchor, offset) {
  if (anchor === "custom" && offset) return String(offset);
  return { top: "0%", center: "50%", bottom: "100%" }[anchor] ?? "50%";
}

/** Copy when absent or changed; skip identical files so re-runs stay cheap. */
function syncFile(source, target) {
  if (!fs.existsSync(source)) fail(`missing file: ${source}`);
  if (fs.existsSync(target)) {
    const a = fs.statSync(source);
    const b = fs.statSync(target);
    if (a.size === b.size && Math.abs(a.mtimeMs - b.mtimeMs) < 1000) return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

/**
 * Copy the font files a template needs out of the style preset.
 * `roles` maps a frame.md fonts key to the reserved placeholder that carries
 * its filename, e.g. { "cover-title": "FONT_COVER_TITLE" }.
 */
function copyFonts(frame, framePath, outputDir, roles) {
  const fonts = frame.fonts || {};
  const fontDir = path.join(path.dirname(framePath), "fonts");
  const result = {};

  for (const [role, placeholder] of Object.entries(roles)) {
    const declared = fonts[role];
    if (!declared) fail(`frame.md must declare fonts.${role}`);
    const file = path.basename(declared);
    const source = path.join(fontDir, file);
    if (!fs.existsSync(source)) {
      fail(
        `font file missing: ${source}`,
        "Copy the style preset with kbcut-style --copy-to so fonts/ travels with frame.md.",
      );
    }
    syncFile(source, path.join(outputDir, "fonts", file));
    result[placeholder] = file;
  }
  return result;
}

/** Substitute every {{NAME}} and fail loudly if any survive. */
function fillTemplate(template, replacements) {
  let output = template.replace(/<!--@template-doc[\s\S]*?-->\n?/, "");
  for (const [name, value] of Object.entries(replacements)) {
    output = output.split(`{{${name}}}`).join(value);
  }
  const leftover = collectPlaceholders(output);
  if (leftover.length > 0) {
    fail(`unfilled placeholders remain: ${leftover.join(", ")}`);
  }
  return output;
}

/** Locate frame.md and one of the style's templates from input_choices.json. */
function resolveStyleFiles(choices, args, kind, defaultFile) {
  const framePath = path.resolve(
    args.frame || choices.frame_copy || choices.frame_source || fail("no frame.md in input_choices"),
  );
  if (!fs.existsSync(framePath)) fail(`frame.md not found: ${framePath}`);

  const key = kind === "cover" ? "cover_template_source" : "template_source";
  const templatePath = path.resolve(
    args.template || choices[key] || path.join(path.dirname(framePath), defaultFile),
  );
  if (!fs.existsSync(templatePath)) {
    fail(
      `style "${choices.style_id}" ships no ${defaultFile}`,
      `expected at ${templatePath}. A style owns both its packaging template and its ` +
        `cover template; add the missing one to the preset rather than hand-building this video's.`,
    );
  }
  return { framePath, templatePath };
}

module.exports = {
  RESERVED_PLACEHOLDERS,
  anchorToPosition,
  buildLayoutCss,
  copyFonts,
  escapeHtml,
  fail,
  fillTemplate,
  hasAudioStream,
  parseArgs,
  probeDimensions,
  probeDuration,
  readJson,
  resolveLayoutVars,
  resolveStyleFiles,
  syncFile,
  toNumber,
  validateContract,
  warnOnHeavyCrop,
};
