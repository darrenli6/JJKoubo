#!/usr/bin/env python3
"""使用本地 Whisper 为媒体文件生成词级时间戳转写。"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def create_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description, add_help=False)
    parser._positionals.title = "位置参数"
    parser._optionals.title = "可选参数"
    parser.add_argument("-h", "--help", action="help", help="显示本帮助并退出")
    return parser


def timestamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def resolve_model(value: str, download_root: Path | None) -> Path:
    direct = Path(value).expanduser()
    if direct.is_file():
        return direct.resolve()

    roots = [download_root] if download_root else []
    roots.extend(
        [
            Path.home() / ".cache" / "whisper",
            Path.home() / "Library" / "Caches" / "whisper",
        ]
    )
    for root in roots:
        if root is None:
            continue
        candidate = root.expanduser() / f"{value}.pt"
        if candidate.is_file():
            return candidate.resolve()
    raise FileNotFoundError(
        f"未找到本地 Whisper 模型“{value}”。未经用户允许不得自动下载。"
    )


def main() -> None:
    parser = create_parser("使用本地 Whisper 转写口播素材。")
    parser.add_argument("input", type=Path, help="输入视频或音频路径")
    parser.add_argument("--model", default="medium", help="本地模型名称或 .pt 文件路径")
    parser.add_argument("--language", default="zh", help="转写语言代码")
    parser.add_argument("--output-dir", type=Path, required=True, help="转写文件输出目录")
    parser.add_argument("--initial-prompt", default="", help="可选的简短领域词表")
    parser.add_argument("--device", default="cpu", help="运行设备，例如 cpu 或 cuda")
    parser.add_argument("--download-root", type=Path, help="本地模型缓存目录")
    args = parser.parse_args()

    source = args.input.expanduser().resolve()
    if not source.is_file():
        raise FileNotFoundError(f"输入媒体不存在：{source}")

    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    prefix = output_dir / source.stem
    audio = prefix.with_name(f"{prefix.name}_16k.wav")

    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "warning",
            "-y",
            "-i",
            str(source),
            "-map",
            "0:a:0",
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            str(audio),
        ],
        check=True,
    )

    import whisper

    model_path = resolve_model(args.model, args.download_root)
    model = whisper.load_model(str(model_path), device=args.device)
    result = model.transcribe(
        str(audio),
        language=args.language,
        task="transcribe",
        fp16=args.device.startswith("cuda"),
        verbose=True,
        word_timestamps=True,
        temperature=0,
        initial_prompt=args.initial_prompt or None,
    )

    with prefix.with_suffix(".json").open("w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)

    with prefix.with_suffix(".txt").open("w", encoding="utf-8") as handle:
        for segment in result.get("segments", []):
            handle.write(
                f"[{segment['start']:8.2f} --> {segment['end']:8.2f}] "
                f"{segment['text'].strip()}\n"
            )

    with prefix.with_suffix(".words.tsv").open("w", encoding="utf-8") as handle:
        handle.write("start\tend\tprobability\tword\n")
        for segment in result.get("segments", []):
            for word in segment.get("words", []):
                handle.write(
                    f"{word['start']:.3f}\t{word['end']:.3f}\t"
                    f"{word.get('probability', 0):.4f}\t{word['word'].strip()}\n"
                )

    with prefix.with_suffix(".srt").open("w", encoding="utf-8") as handle:
        for index, segment in enumerate(result.get("segments", []), start=1):
            handle.write(f"{index}\n")
            handle.write(f"{timestamp(segment['start'])} --> {timestamp(segment['end'])}\n")
            handle.write(f"{segment['text'].strip()}\n\n")

    print(
        json.dumps(
            {
                "model": str(model_path),
                "audio": str(audio),
                "json": str(prefix.with_suffix(".json")),
                "txt": str(prefix.with_suffix(".txt")),
                "words": str(prefix.with_suffix(".words.tsv")),
                "srt": str(prefix.with_suffix(".srt")),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
