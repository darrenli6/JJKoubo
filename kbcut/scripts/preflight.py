#!/usr/bin/env python3
"""检查知识口播剪辑所需的本地依赖与媒体信息。"""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parent.parent


def create_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description, add_help=False)
    parser._positionals.title = "位置参数"
    parser._optionals.title = "可选参数"
    parser.add_argument("-h", "--help", action="help", help="显示本帮助并退出")
    return parser


def probe(path: Path) -> dict:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        str(path),
    ]
    return json.loads(subprocess.run(command, check=True, capture_output=True, text=True).stdout)


def resolve_model(value: str) -> Path | None:
    direct = Path(value).expanduser()
    if direct.is_file():
        return direct.resolve()

    cache_roots = [
        Path.home() / ".cache" / "whisper",
        Path.home() / "Library" / "Caches" / "whisper",
    ]
    names = [f"{value}.pt", value]
    for root in cache_roots:
        for name in names:
            candidate = root / name
            if candidate.is_file():
                return candidate.resolve()
    return None


def songti_available() -> bool:
    known_files = [
        Path("/System/Library/Fonts/Supplemental/Songti.ttc"),
        Path("/Library/Fonts/Songti.ttc"),
    ]
    if any(path.is_file() for path in known_files):
        return True
    matcher = shutil.which("fc-match")
    if not matcher:
        return False
    result = subprocess.run(
        [matcher, "-f", "%{family}", "Songti SC"],
        check=False,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0 and "songti" in result.stdout.lower()


def resolve_hyperframes() -> str | None:
    direct = shutil.which("hyperframes")
    if direct:
        return direct
    cache_root = Path.home() / ".npm" / "_npx"
    candidates = list(cache_root.glob("*/node_modules/.bin/hyperframes"))
    candidates = [path for path in candidates if path.is_file()]
    if not candidates:
        return None
    return str(max(candidates, key=lambda path: path.stat().st_mtime).resolve())


def main() -> int:
    parser = create_parser("检查口播素材、本地模型、字体和渲染工具。")
    parser.add_argument("input", type=Path, help="输入视频路径")
    parser.add_argument("--model", default="medium", help="本地 Whisper 模型名称或文件路径")
    parser.add_argument("--frame", type=Path, help="自定义 frame.md 路径；省略时使用内置版本")
    parser.add_argument(
        "--transcription-mode",
        choices=("local", "api"),
        default="local",
        help="转写方式：本地模型或用户已配置的 API",
    )
    args = parser.parse_args()

    source = args.input.expanduser().resolve()
    frame = (
        args.frame.expanduser().resolve()
        if args.frame
        else SKILL_ROOT / "assets" / "frame.md"
    )
    tools = {name: shutil.which(name) for name in ("ffmpeg", "ffprobe")}
    tools["hyperframes"] = resolve_hyperframes()

    report: dict = {
        "input": str(source),
        "input_exists": source.is_file(),
        "tools": tools,
        "frame": str(frame),
        "frame_exists": frame.is_file(),
        "transcription_mode": args.transcription_mode,
        "model_requested": args.model,
        "model_path": None,
        "python_whisper": importlib.util.find_spec("whisper") is not None,
        "font": {"family": "Songti SC", "available": songti_available()},
        "media": None,
        "errors": [],
        "warnings": [],
    }

    if not source.is_file():
        report["errors"].append("输入视频不存在")
    if not tools["ffmpeg"]:
        report["errors"].append("PATH 中未找到 ffmpeg")
    if not tools["ffprobe"]:
        report["errors"].append("PATH 中未找到 ffprobe")
    if not frame.is_file():
        report["errors"].append("未找到 frame.md")

    if args.transcription_mode == "local":
        model = resolve_model(args.model)
        report["model_path"] = str(model) if model else None
        if not model:
            report["errors"].append(
                "缺少本地 Whisper 模型；请提供模型路径、配置 API，或明确允许下载"
            )
        if not report["python_whisper"]:
            report["errors"].append("未安装 Python 包 whisper")

    if source.is_file() and tools["ffprobe"]:
        try:
            metadata = probe(source)
            streams = metadata.get("streams", [])
            video = next((item for item in streams if item.get("codec_type") == "video"), None)
            audio = next((item for item in streams if item.get("codec_type") == "audio"), None)
            side_data = [item.get("side_data_type") for item in (video or {}).get("side_data_list", [])]
            report["media"] = {
                "format": metadata.get("format", {}).get("format_name"),
                "duration": metadata.get("format", {}).get("duration"),
                "video": {
                    key: video.get(key)
                    for key in (
                        "codec_name",
                        "profile",
                        "width",
                        "height",
                        "pix_fmt",
                        "r_frame_rate",
                        "color_range",
                        "color_space",
                        "color_transfer",
                        "color_primaries",
                    )
                }
                if video
                else None,
                "audio": {
                    key: audio.get(key)
                    for key in ("codec_name", "sample_rate", "channels", "channel_layout")
                }
                if audio
                else None,
                "video_side_data": side_data,
            }
            if not video:
                report["errors"].append("素材中没有视频流")
            if not audio:
                report["errors"].append("素材中没有音频流")
            if "DOVI configuration record" in side_data:
                report["warnings"].append(
                    "检测到 Dolby Vision 元数据；请保留 HDR 兼容层，并对比渲染前后的同一帧"
                )
        except (subprocess.CalledProcessError, json.JSONDecodeError) as error:
            report["errors"].append(f"ffprobe 检查失败：{error}")

    if not tools["hyperframes"]:
        report["warnings"].append(
            "未找到 HyperFrames CLI；包装前请使用已安装或缓存的版本，必要时再安装"
        )
    if not report["font"]["available"]:
        report["warnings"].append(
            "系统中没有 Songti SC；包装前请确认并配置视频与封面共用的中文字体"
        )

    report["ready"] = not report["errors"]
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ready"] else 2


if __name__ == "__main__":
    sys.exit(main())
