#!/usr/bin/env python3
"""生成 src/data/fontCoverage.ts —— 每个字族到底收录了哪些码位。

两个来源：
  · 自托管字体：直接读 public/fonts/ 下 woff2 的 cmap；
  · Google Fonts：拉 css2 样式表，累加每条 @font-face 的 unicode-range。

前端拿这张表判断"某个字符在这个字族里有没有字形"。没有就留空——
浏览器在缺字时会悄悄回退到系统字体，甲骨文、小篆就是这样被画成宋体的。

用法：work/.venv/bin/python tools/build-font-coverage.py
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src/data/fontCoverage.ts"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
)


def used_families() -> list[str]:
    """站点用到的全部字族：writingSystems.ts 的 fontFamily ＋ 自托管字体。"""
    families: list[str] = []
    text = (ROOT / "src/data/writingSystems.ts").read_text(encoding="utf8")
    for m in re.finditer(r"fontFamily: '([^']+)'", text):
        if m.group(1) not in families:
            families.append(m.group(1))
    local = (ROOT / "src/data/localFonts.ts").read_text(encoding="utf8")
    for m in re.finditer(r"family: '([^']+)'", local):
        if m.group(1) not in families:
            families.append(m.group(1))
    return sorted(families)


def local_ranges(family: str) -> list[tuple[int, int]] | None:
    """自托管字体：读 cmap。"""
    for path in (ROOT / "public/fonts").glob("*.woff2"):
        font = TTFont(path)
        names = {rec.toUnicode() for rec in font["name"].names if rec.nameID in (1, 16)}
        if family in names:
            return merge(sorted((cp, cp) for cp in font.getBestCmap()))
    return None


def parse_unicode_range(value: str) -> list[tuple[int, int]]:
    out = []
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        m = re.fullmatch(r"[Uu]\+([0-9A-Fa-f?]+)(?:-([0-9A-Fa-f]+))?", part)
        if not m:
            continue
        start_raw, end_raw = m.group(1), m.group(2)
        if "?" in start_raw:
            start = int(start_raw.replace("?", "0"), 16)
            end = int(start_raw.replace("?", "F"), 16)
        else:
            start = int(start_raw, 16)
            end = int(end_raw, 16) if end_raw else start
        out.append((start, end))
    return out


def google_ranges(family: str) -> list[tuple[int, int]]:
    url = (
        "https://fonts.googleapis.com/css2?family="
        + urllib.parse.quote_plus(family)
        + "&display=swap"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                css = res.read().decode("utf8")
            ranges: list[tuple[int, int]] = []
            for value in re.findall(r"unicode-range:\s*([^;]+);", css):
                ranges.extend(parse_unicode_range(value))
            return merge(sorted(ranges))
        except (urllib.error.URLError, TimeoutError) as exc:  # 网络抖动重试
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise SystemExit(f"取 {family} 的样式表失败：{last}")


def merge(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    merged: list[list[int]] = []
    for start, end in ranges:
        if merged and start <= merged[-1][1] + 1:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return [(a, b) for a, b in merged]


def main() -> int:
    families = used_families()
    table: dict[str, list[int]] = {}
    for family in families:
        ranges = local_ranges(family)
        origin = "自托管"
        if ranges is None:
            ranges = google_ranges(family)
            origin = "Google Fonts"
        flat: list[int] = []
        for start, end in ranges:
            flat += [start, end]
        table[family] = flat
        print(f"{family}\t{origin}\t{len(ranges)} 段", file=sys.stderr)

    lines = [
        "// 由 tools/build-font-coverage.py 生成，请勿手工编辑。",
        "// 每个字族收录的码位区间，扁平存放：[起点, 终点, 起点, 终点, …]。",
        "",
        "export const fontCoverage: Record<string, number[]> = {",
    ]
    for family in sorted(table):
        flat = ", ".join(f"0x{cp:X}" for cp in table[family])
        lines.append(f"  {json.dumps(family)}: [{flat}],")
    lines += ["};", ""]
    OUT.write_text("\n".join(lines), encoding="utf8")
    print(f"写入 {OUT.relative_to(ROOT)}：{len(table)} 个字族")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
