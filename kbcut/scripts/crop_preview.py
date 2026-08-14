#!/usr/bin/env python3
"""Render crop-anchor previews and post-crop keyframes for the KB Cut entry gate.

Two jobs, one crop maths implementation:

  1. `--compare`  Render the same source frame at every crop anchor so the user
                  can SEE what picking 3:4 or 9:16 does to their footage before
                  confirming. "Your video will be cut like this" is a picture,
                  not a sentence.

  2. `--frames`   Extract keyframes with the confirmed crop applied, for shot
                  profile analysis. Placing overlays against an uncropped frame
                  means laying out against a picture that will never exist.

Only ffmpeg/ffprobe are required; no Python packages beyond the stdlib.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


ANCHORS = ("top", "center", "bottom")


def require_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise SystemExit(f"{name} not found on PATH; KB Cut requires ffmpeg tools")


def probe(video: Path) -> dict:
    out = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(video),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    data = json.loads(out.stdout)
    stream = data["streams"][0]
    return {
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "duration": float(data["format"]["duration"]),
    }


def parse_aspect(value: str) -> tuple[int, int]:
    if ":" not in value:
        raise SystemExit(f"aspect must look like 3:4, got {value!r}")
    left, right = value.split(":", 1)
    return int(left), int(right)


def target_size(aspect: str, width: int | None, height: int | None) -> tuple[int, int]:
    if width and height:
        return width, height
    aw, ah = parse_aspect(aspect)
    # KB Cut's aspect table is 1080-wide for every portrait/square ratio and
    # 1920-wide for landscape; mirror that so previews match the real output.
    if aw > ah:
        w = 1920
        h = round(w * ah / aw)
    else:
        w = 1080
        h = round(w * ah / aw)
    return w - (w % 2), h - (h % 2)


def crop_filter(src_w: int, src_h: int, out_w: int, out_h: int, anchor: str) -> str:
    """Build an ffmpeg crop+scale chain matching the template's object-fit: cover."""
    src_ratio = src_w / src_h
    out_ratio = out_w / out_h

    if src_ratio > out_ratio:
        # Source is wider: keep full height, cut the sides.
        crop_w = round(src_h * out_ratio)
        crop_h = src_h
        x = {"top": 0, "center": (src_w - crop_w) // 2, "bottom": src_w - crop_w}[anchor]
        y = 0
    else:
        # Source is taller: keep full width, cut top/bottom. This is the common
        # 9:16 -> 3:4 case, and the anchor decides whose headroom survives.
        crop_w = src_w
        crop_h = round(src_w / out_ratio)
        x = 0
        y = {"top": 0, "center": (src_h - crop_h) // 2, "bottom": src_h - crop_h}[anchor]

    crop_w -= crop_w % 2
    crop_h -= crop_h % 2
    return f"crop={crop_w}:{crop_h}:{x}:{y},scale={out_w}:{out_h}:flags=lanczos"


def resolve_timestamp(value: str, duration: float) -> float:
    text = value.strip()
    if text.endswith("%"):
        return duration * float(text[:-1]) / 100.0
    return float(text)


def extract(video: Path, at: float, vf: str, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            f"{at:.3f}",
            "-i",
            str(video),
            "-vf",
            vf,
            "-frames:v",
            "1",
            "-y",
            str(out),
        ],
        check=True,
    )


def contact_sheet(images: list[Path], out: Path) -> bool:
    """Stack previews side by side. Best effort — the individual PNGs are the
    real deliverable, so a failure here is not fatal."""
    if len(images) < 2:
        return False
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error"]
    for image in images:
        args += ["-i", str(image)]
    args += [
        "-filter_complex",
        f"hstack=inputs={len(images)}",
        "-y",
        str(out),
    ]
    try:
        subprocess.run(args, check=True)
        return True
    except subprocess.CalledProcessError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--video", type=Path, required=True)
    parser.add_argument("--aspect", default="3:4", help="Target aspect ratio, e.g. 3:4")
    parser.add_argument("--width", type=int, help="Explicit output width (overrides --aspect)")
    parser.add_argument("--height", type=int, help="Explicit output height")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--compare",
        action="store_true",
        help="Render one frame at every crop anchor for the 0.4 confirmation gate",
    )
    parser.add_argument(
        "--frames",
        help="Comma-separated timestamps ('10%%,50%%,90%%' or seconds) to extract with the confirmed crop",
    )
    parser.add_argument(
        "--anchor",
        choices=ANCHORS,
        default="center",
        help="Confirmed crop anchor, used by --frames",
    )
    parser.add_argument("--at", default="50%", help="Source timestamp for --compare")
    args = parser.parse_args()

    require_tool("ffmpeg")
    require_tool("ffprobe")

    video = args.video.expanduser().resolve()
    if not video.is_file():
        raise SystemExit(f"video not found: {video}")

    info = probe(video)
    out_w, out_h = target_size(args.aspect, args.width, args.height)
    output = args.output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)

    src_ratio = info["width"] / info["height"]
    out_ratio = out_w / out_h
    loss = 1 - min(src_ratio, out_ratio) / max(src_ratio, out_ratio)

    result = {
        "video": str(video),
        "source": {"width": info["width"], "height": info["height"]},
        "target": {"width": out_w, "height": out_h, "aspect_ratio": args.aspect},
        "discarded_fraction": round(loss, 4),
        "needs_crop": loss > 0.001,
        "previews": {},
        "frames": [],
    }

    if not result["needs_crop"]:
        print(
            f"源画幅 {info['width']}×{info['height']} 与目标 {out_w}×{out_h} 比例一致，无需裁切。",
            file=sys.stderr,
        )

    if args.compare:
        at = resolve_timestamp(args.at, info["duration"])
        images = []
        for anchor in ANCHORS:
            vf = crop_filter(info["width"], info["height"], out_w, out_h, anchor)
            target = output / f"crop_{anchor}.png"
            extract(video, at, vf, target)
            result["previews"][anchor] = str(target)
            images.append(target)
        sheet = output / "crop_compare.png"
        if contact_sheet(images, sheet):
            result["previews"]["contact_sheet"] = str(sheet)

    if args.frames:
        vf = crop_filter(info["width"], info["height"], out_w, out_h, args.anchor)
        for index, token in enumerate(args.frames.split(",")):
            at = resolve_timestamp(token, info["duration"])
            target = output / f"shot_{index:02d}_at_{at:.1f}s.png"
            extract(video, at, vf, target)
            result["frames"].append({"at": round(at, 3), "path": str(target)})

    manifest = output / "crop_preview.json"
    manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf8")

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if loss > 0.35:
        print(
            f"\n⚠ 该组合会裁掉约 {round(loss * 100)}% 的画面，人物可能装不下。"
            f"确认裁切前请先看预览图，必要时换画幅。",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
