#!/usr/bin/env python3
"""Resolve a KB Cut frame.md style preset."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parent.parent
ALIASES = {
    "founder": "founder-interview",
    "founder-interview": "founder-interview",
    "founder_interview": "founder-interview",
    "创始人访谈": "founder-interview",
    "创始人访谈风格": "founder-interview",
    "创始人采访": "founder-interview",
    "创始人": "founder-interview",
}


def normalize(value: str) -> str:
    key = value.strip()
    return ALIASES.get(key, key.lower().replace("_", "-").replace(" ", "-"))


# A complete style defines both halves: how the video looks from the inside
# (template.html) and how it looks from the outside (cover.html).
TEMPLATE_FILES = {"template": "template.html", "cover": "cover.html"}


def find_templates(frame: Path) -> dict[str, Path | None]:
    """Locate the HyperFrames templates shipped beside a frame.md."""
    found: dict[str, Path | None] = {}
    for key, filename in TEMPLATE_FILES.items():
        candidate = frame.parent / filename
        found[key] = candidate.resolve() if candidate.is_file() else None
    return found


def available(project: Path | None) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    roots = []
    if project:
        roots.append(project / "frame-presets")
    roots.append(SKILL_ROOT / "assets" / "frame-presets")

    for root in roots:
        if not root.is_dir():
            continue
        source = "project" if project and root == project / "frame-presets" else "builtin"
        for child in sorted(root.iterdir()):
            if not child.is_dir():
                continue
            frame = child / "frame.md"
            if not frame.is_file():
                frame = child / "FRAME.md"
            if not frame.is_file():
                continue
            entry = result.setdefault(
                child.name, {"sources": [], "template": False, "cover": False}
            )
            entry["sources"].append(source)
            found = find_templates(frame)
            if found["template"]:
                entry["template"] = True
            if found["cover"]:
                entry["cover"] = True
    return result


def resolve(style: str, project: Path | None) -> tuple[str, Path, str]:
    style_id = normalize(style)
    candidates: list[tuple[Path, str]] = []
    if project:
        candidates.extend(
            [
                (project / "frame-presets" / style_id / "frame.md", "project"),
                (project / "frame-presets" / style_id / "FRAME.md", "project"),
            ]
        )
    candidates.append((SKILL_ROOT / "assets" / "frame-presets" / style_id / "frame.md", "builtin"))

    for path, source in candidates:
        if path.is_file():
            return style_id, path.resolve(), source
    raise FileNotFoundError(style_id)


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve a KB Cut frame.md style preset.")
    parser.add_argument("--style", help="Style id or alias, such as founder-interview")
    parser.add_argument("--frame", type=Path, help="Explicit frame.md path")
    parser.add_argument("--project", type=Path, help="Project root to search for frame-presets/")
    parser.add_argument("--copy-to", type=Path, help="Copy the resolved frame.md to this path")
    parser.add_argument("--list", action="store_true", help="List available styles")
    parser.add_argument(
        "--require-template",
        action="store_true",
        help="Fail when the style ships no template.html instead of reporting template: null",
    )
    args = parser.parse_args()

    project = args.project.expanduser().resolve() if args.project else None
    if args.list:
        print(json.dumps({"styles": available(project)}, ensure_ascii=False, indent=2))
        return 0

    if args.frame:
        frame = args.frame.expanduser().resolve()
        if not frame.is_file():
            raise FileNotFoundError(f"frame.md not found: {frame}")
        style_id, source = frame.parent.name, "explicit"
    elif args.style:
        style_id, frame, source = resolve(args.style, project)
    else:
        raise SystemExit("Provide --frame, --style, or --list")

    found = find_templates(frame)
    if args.require_template:
        missing = [TEMPLATE_FILES[key] for key, value in found.items() if value is None]
        if missing:
            raise SystemExit(
                f"style '{style_id}' ships no {', '.join(missing)} beside {frame}. "
                "A complete style owns both its packaging template and its cover template. "
                "Add the missing file to the preset, or drop --require-template."
            )

    copied_to = None
    copied_templates: dict[str, str] = {}
    if args.copy_to:
        target = args.copy_to.expanduser().resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(frame, target)
        fonts_dir = frame.parent / "fonts"
        if fonts_dir.is_dir():
            shutil.copytree(fonts_dir, target.parent / "fonts", dirs_exist_ok=True)
        for key, path in found.items():
            if path is None:
                continue
            destination = target.parent / TEMPLATE_FILES[key]
            shutil.copy2(path, destination)
            copied_templates[key] = str(destination)
        copied_to = str(target)

    print(
        json.dumps(
            {
                "style": style_id,
                "frame": str(frame),
                "template": str(found["template"]) if found["template"] else None,
                "cover": str(found["cover"]) if found["cover"] else None,
                "source": source,
                "copied_to": copied_to,
                "template_copied_to": copied_templates.get("template"),
                "cover_copied_to": copied_templates.get("cover"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
