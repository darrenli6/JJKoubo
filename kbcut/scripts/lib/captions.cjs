"use strict";

/**
 * Caption processing for KB Cut packaging: SRT parsing, Chinese-aware line
 * breaking, reveal chunking, and keyword emphasis.
 *
 * Style-agnostic on purpose. Nothing here knows what a topic lockup is; the
 * only inputs are text, timings, and numbers derived from the active frame.md.
 */

const BREAK_PUNCTUATION = "，。！？；：、,.!?;:";
const TRAILING_PUNCTUATION = "，。！？；：、,.!?;:”’」』）)】》";

// Chinese has no spaces, so a naive cut at the character limit splits words —
// "搞钱的时|间" instead of "搞钱的|时间". Without a segmentation dependency the
// cheap approximation is positional: these particles reliably END a phrase, so
// breaking right after one is nearly always safe.
const SAFE_TAIL = "的地得了着过吧呢啊吗呀嘛哦呗啦";
// …and these reliably START one, so breaking right before one is safe too.
const SAFE_HEAD = "我你他她它这那就都还也很但所因如比然其可最更真好每没有";

// Characters that carry no standalone meaning. An auto-extracted keyword
// containing any of these is rejected, which is what keeps frequency-based
// n-grams from surfacing junk like "的时候" without a segmentation dependency.
const FUNCTION_CHARS = new Set(
  ("的了是我你他她它们这那就都很和与及也还要会能可以什么怎么为因所以但然后个一二三四五六七八九十" +
    "有没在不上下来去到过着吧呢啊嘛把被让给对从向于自其之而且或如果只把再又更最太真好多少大小")
    .split(""),
);

function timeToSeconds(stamp) {
  const match = stamp.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) throw new Error(`Unparsable SRT timestamp: ${stamp}`);
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;
}

/** Parse an SRT file into [{index, start, end, text}]. */
function parseSrt(content) {
  const blocks = content.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  const segments = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) continue;

    const timingLine = lines.find((line) => line.includes("-->"));
    if (!timingLine) continue;

    const [startRaw, endRaw] = timingLine.split("-->");
    const textLines = lines.slice(lines.indexOf(timingLine) + 1);
    const text = textLines.join("").trim();
    if (!text) continue;

    segments.push({
      index: segments.length,
      start: timeToSeconds(startRaw),
      end: timeToSeconds(endRaw),
      text,
    });
  }

  return segments;
}

function isAscii(char) {
  return /[A-Za-z0-9]/.test(char);
}

/**
 * Break one caption into lines of at most `maxChars`.
 *
 * Preference order: a punctuation boundary near the target, then the last
 * boundary that does not split a run of Latin letters or digits. "2024年" and
 * "AI" therefore stay intact instead of being cut mid-token.
 */
function breakLine(text, maxChars) {
  const chars = [...text];
  if (chars.length <= maxChars) return [text];

  const lines = [];
  let cursor = 0;

  while (cursor < chars.length) {
    const remaining = chars.length - cursor;
    if (remaining <= maxChars) {
      lines.push(chars.slice(cursor).join(""));
      break;
    }

    // Score every candidate cut and take the best, rather than accepting the
    // first tolerable one. Filling the line matters, but not enough to justify
    // splitting a word, so the fill bonus is small next to the structural ones.
    // Reach back far enough that a strong boundary earlier in the line can win
    // against a flush-but-word-splitting cut at the limit.
    const floor = Math.max(2, Math.ceil(maxChars * 0.45));
    let cut = maxChars;
    let best = -Infinity;

    for (let candidate = maxChars; candidate >= floor; candidate -= 1) {
      const prev = chars[cursor + candidate - 1];
      const next = chars[cursor + candidate];
      let score = -(maxChars - candidate) * 4;

      if (BREAK_PUNCTUATION.includes(prev)) score += 100;
      else if (/\s/.test(prev)) score += 90;
      else if (SAFE_TAIL.includes(prev)) score += 50;
      if (SAFE_HEAD.includes(next)) score += 30;
      // Never cut through a run of Latin letters or digits.
      if (isAscii(prev) && isAscii(next)) score -= 200;

      if (score > best) {
        best = score;
        cut = candidate;
      }
    }

    // Never start a line with punctuation: pull a boundary mark that landed
    // just past the cut back onto the line it belongs to.
    while (
      cursor + cut < chars.length &&
      TRAILING_PUNCTUATION.includes(chars[cursor + cut])
    ) {
      cut += 1;
    }

    lines.push(chars.slice(cursor, cursor + cut).join(""));
    cursor += cut;
  }

  return lines.map((line) => line.trim()).filter(Boolean);
}

/**
 * Score candidate keywords across the whole transcript.
 *
 * Frequency over 2-4 character CJK n-grams, rejecting any n-gram that contains
 * a function character. Used only when the caller supplies no explicit list.
 */
function extractKeywords(fullText, limit) {
  const counts = new Map();
  const cleaned = fullText.replace(/[^一-鿿A-Za-z0-9]/g, " ");

  for (const run of cleaned.split(/\s+/)) {
    const chars = [...run];
    for (let size = 2; size <= 4; size += 1) {
      for (let i = 0; i + size <= chars.length; i += 1) {
        const gram = chars.slice(i, i + size);
        if (gram.some((char) => FUNCTION_CHARS.has(char))) continue;
        const term = gram.join("");
        counts.set(term, (counts.get(term) || 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([term]) => term);
}

/**
 * Split one line into reveal chunks, marking emphasis spans.
 *
 * Emphasis keywords become their own chunk; the surrounding text is grouped
 * into short runs so the reveal reads left-to-right without animating per
 * character, which frame.md's motion section rules out as too kinetic.
 */
function chunkLine(line, keywords, chunkSize) {
  // Matched case-insensitively: transcription capitalises Latin terms
  // inconsistently ("KBcut" vs "kbcut"), and the emphasis list should not have
  // to guess which spelling Whisper produced. The line's own casing is kept.
  const haystack = line.toLowerCase();
  const hits = [];
  for (const keyword of keywords) {
    const needle = String(keyword).toLowerCase();
    if (!needle) continue;
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      hits.push({ start: at, end: at + needle.length, text: line.slice(at, at + needle.length) });
      from = at + needle.length;
    }
  }

  // Keep the longest non-overlapping hits.
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const accepted = [];
  let guard = -1;
  for (const hit of hits) {
    if (hit.start >= guard) {
      accepted.push(hit);
      guard = hit.end;
    }
  }

  const chunks = [];
  let cursor = 0;

  const pushPlain = (text) => {
    const chars = [...text];
    for (let i = 0; i < chars.length; i += chunkSize) {
      const piece = chars.slice(i, i + chunkSize).join("");
      if (piece) chunks.push({ text: piece, emphasis: false });
    }
  };

  for (const hit of accepted) {
    if (hit.start > cursor) pushPlain(line.slice(cursor, hit.start));
    chunks.push({ text: hit.text, emphasis: true });
    cursor = hit.end;
  }
  if (cursor < line.length) pushPlain(line.slice(cursor));

  return chunks;
}

/**
 * Turn parsed SRT segments into the template's caption data structure.
 *
 * Returns { segments, warnings, keywords } where each segment is
 * { start, end, lines: [[{text, emphasis}]] }.
 */
function buildCaptions(srtSegments, options) {
  const { maxChars, maxLines = 2, chunkSize = 2, emphasisPerSegment = 1 } = options;

  const explicit = options.keywords && options.keywords.length > 0;
  const keywords = explicit
    ? options.keywords
    : extractKeywords(srtSegments.map((segment) => segment.text).join(""), 24);

  const warnings = [];
  const segments = srtSegments.map((segment) => {
    let text = segment.text.trim();
    while (text.length > 1 && TRAILING_PUNCTUATION.includes(text[text.length - 1])) {
      text = text.slice(0, -1);
    }

    const rawLines = breakLine(text, maxChars);
    if (rawLines.length > maxLines) {
      warnings.push({
        index: segment.index,
        start: segment.start,
        text,
        lines: rawLines.length,
        reason: `wraps to ${rawLines.length} lines; frame.md allows ${maxLines}`,
      });
    }

    // Emphasis budget is per segment, not per line.
    let budget = emphasisPerSegment;
    const lines = rawLines.map((line) => {
      const active = budget > 0 ? keywords : [];
      const chunks = chunkLine(line, active, chunkSize);
      const used = chunks.filter((chunk) => chunk.emphasis).length;
      if (used > budget) {
        let excess = used - budget;
        for (let i = chunks.length - 1; i >= 0 && excess > 0; i -= 1) {
          if (chunks[i].emphasis) {
            chunks[i].emphasis = false;
            excess -= 1;
          }
        }
      }
      budget -= chunks.filter((chunk) => chunk.emphasis).length;
      return chunks;
    });

    return { start: segment.start, end: segment.end, lines };
  });

  return { segments, warnings, keywords, keywordSource: explicit ? "explicit" : "extracted" };
}

module.exports = { parseSrt, breakLine, extractKeywords, chunkLine, buildCaptions };
