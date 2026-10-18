#!/usr/bin/env python3
"""把完整字库子集化成 public/fonts/ 下的 Web 字体。

输入是上游原始字库（体积大、字形远超本站需要），输出只留详情面板要展示的字。
子集化同时改名，不再使用上游的保留名称（OFL 对修改版的要求）。

用法：
    work/.venv/bin/python tools/subset-fonts.py

原始字库不随仓库分发，获取方式见 THIRD_PARTY.md。
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
GLYPH_SETS = ROOT / "src/data/glyphSets.ts"
OUT_DIR = ROOT / "public/fonts"

# 站点自托管字体：上游文件 → 输出文件 → 字形样本取自哪个书写体系
JOBS = [
    {
        "src": ROOT / "work/fonts/orac.woff2",
        "out": OUT_DIR / "glyph-atlas-oracle-bone.woff2",
        "family": "Glyph Atlas Oracle Bone",
        "style": "Regular",
        "systems": ["chinese-oracle"],
    },
    {
        "src": ROOT / "work/fonts/seal.woff2",
        "out": OUT_DIR / "glyph-atlas-small-seal.woff2",
        "family": "Glyph Atlas Small Seal",
        "style": "Regular",
        "systems": ["chinese-seal"],
    },
]

NAME_IDS = {
    1: "family",
    2: "style",
    3: "unique",
    4: "full",
    6: "postscript",
    16: "family",
    17: "style",
}


def sample_chars(system_ids: list[str]) -> str:
    """从 glyphSets.ts 里取出这些书写体系的样本字符。"""
    text = GLYPH_SETS.read_text(encoding="utf8")
    chars: list[str] = []
    for sid in system_ids:
        m = re.search(rf'"{re.escape(sid)}": \{{ chars: \[\.\.\.("(?:[^"\\]|\\.)*")\]', text)
        if not m:
            raise SystemExit(f"glyphSets.ts 里找不到 {sid} 的 chars")
        for ch in json.loads(m.group(1)):
            if ch not in chars:
                chars.append(ch)
    return "".join(chars)


def rename(font: TTFont, family: str, style: str) -> None:
    ps = f"{family.replace(' ', '')}-{style}"
    values = {
        1: family,
        2: style,
        3: f"{ps};subset",
        4: f"{family} {style}",
        6: ps,
        16: family,
        17: style,
    }
    for rec in list(font["name"].names):
        if rec.nameID in values:
            font["name"].setName(values[rec.nameID], rec.nameID, rec.platformID, rec.platEncID, rec.langID)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    failed = False
    for job in JOBS:
        if not job["src"].exists():
            print(f"跳过 {job['family']}：缺少 {job['src']}", file=sys.stderr)
            failed = True
            continue

        wanted = sample_chars(job["systems"])
        font = TTFont(job["src"])
        available = font.getBestCmap()

        options = Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.notdef_outline = True
        options.recalc_bounds = True
        options.drop_tables += ["vhea", "vmtx"]  # 网站只横向排版
        subsetter = Subsetter(options=options)
        subsetter.populate(text=wanted)
        subsetter.subset(font)

        kept = [c for c in wanted if ord(c) in font.getBestCmap()]
        dropped = [c for c in wanted if ord(c) not in font.getBestCmap()]
        rename(font, job["family"], job["style"])
        font.flavor = "woff2"
        font.save(job["out"])
        size = job["out"].stat().st_size / 1024
        print(
            f"{job['out'].relative_to(ROOT)}  {size:.0f} KB  "
            f"字形 {len(kept)}/{len(wanted)}"
            + (f"，上游缺字：{''.join(dropped)}" if dropped else "")
        )
        # 覆盖表由 build-font-coverage.py 依据产物重新生成，这里只报个数
        _ = available
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
