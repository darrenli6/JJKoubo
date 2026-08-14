"use strict";

/**
 * Minimal YAML frontmatter reader for frame.md style presets.
 *
 * Deliberately not a general YAML parser. It covers exactly the subset the
 * frame.md contract uses: nested maps, quoted/bare scalars, inline flow maps,
 * and folded (`>` / `|`) prose blocks, which are skipped as plain text.
 *
 * Avoiding a YAML dependency keeps make-package.cjs runnable with a bare
 * `node` on a machine that has never run `npm install`.
 */

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function coerce(value) {
  const raw = value.trim();
  if (raw === "") return "";
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null" || raw === "~") return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return stripQuotes(raw);
}

/** Split an inline flow map body on commas that sit outside quotes and braces. */
function splitFlowEntries(body) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";

  for (const char of body) {
    if (quote) {
      if (char === quote) quote = null;
      current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "{" || char === "[") depth += 1;
    if (char === "}" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseFlowMap(text) {
  const body = text.trim().replace(/^\{/, "").replace(/\}$/, "");
  const result = {};
  for (const entry of splitFlowEntries(body)) {
    const idx = entry.indexOf(":");
    if (idx === -1) continue;
    const key = stripQuotes(entry.slice(0, idx));
    result[key] = coerce(entry.slice(idx + 1));
  }
  return result;
}

function parseFlowSequence(text) {
  const body = text.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (body.trim() === "") return [];
  return splitFlowEntries(body).map((entry) => coerce(entry));
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

function parseBlock(lines, start, indent) {
  const result = {};
  let i = start;

  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith("#")) {
      i += 1;
      continue;
    }

    const current = indentOf(raw);
    if (current < indent) break;
    if (current > indent) {
      i += 1;
      continue;
    }

    const line = raw.trim();
    const match = line.match(/^("[^"]*"|'[^']*'|[^:]+):\s*(.*)$/);
    if (!match) {
      i += 1;
      continue;
    }

    const key = stripQuotes(match[1]);
    const rest = match[2].trim();

    if (rest === ">" || rest === "|" || rest === ">-" || rest === "|-") {
      // Folded prose block: consume every deeper-indented line as text.
      const chunk = [];
      i += 1;
      while (i < lines.length && (!lines[i].trim() || indentOf(lines[i]) > indent)) {
        chunk.push(lines[i].trim());
        i += 1;
      }
      result[key] = chunk.join(" ").trim();
      continue;
    }

    if (rest === "") {
      // Nested map: recurse at the next deeper indent level.
      let j = i + 1;
      while (j < lines.length && (!lines[j].trim() || lines[j].trim().startsWith("#"))) j += 1;
      if (j < lines.length && indentOf(lines[j]) > indent) {
        const [child, next] = parseBlock(lines, j, indentOf(lines[j]));
        result[key] = child;
        i = next;
      } else {
        result[key] = {};
        i += 1;
      }
      continue;
    }

    if (rest.startsWith("{")) {
      result[key] = parseFlowMap(rest);
    } else if (rest.startsWith("[")) {
      result[key] = parseFlowSequence(rest);
    } else {
      result[key] = coerce(rest);
    }
    i += 1;
  }

  return [result, i];
}

/** Read the YAML frontmatter of a frame.md into a plain object. */
function parseFrameMd(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error("frame.md has no YAML frontmatter (expected a leading --- block)");
  }
  const [value] = parseBlock(match[1].split(/\r?\n/), 0, 0);
  return value;
}

/** Collect every {{PLACEHOLDER}} token in a string, in stable sorted order. */
function collectPlaceholders(text) {
  const found = new Set();
  const pattern = /\{\{([A-Z0-9_]+)\}\}/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    found.add(match[1]);
  }
  return [...found].sort();
}

module.exports = { parseFrameMd, collectPlaceholders };
