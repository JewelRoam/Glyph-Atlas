#!/usr/bin/env python3
"""逐个字符核对"这个字在这款字体里到底有没有"。

为什么不能只看 css2 的 unicode-range：那是子集的"声明范围"，一个字体可以声明
U+0100–024F 却只收其中几个字。范围说"有"、字库其实没有时，浏览器会悄悄换成
系统字体——甲骨文、泰文、西里尔都可能被画成宋体或思源。所以这里按真实字体文件
核对：找 Google Fonts 要回"只含这些字符"的子集，直接读它的 cmap。

用法（先跑 dump 生成待核对清单）：
  node --import ./tools/register-ts.mjs tools/dump-need-chars.mjs
  work/.venv/bin/python tools/verify-font-coverage.py

输出：work/font-coverage-report.json，列出每个字族缺哪些字、字母场里哪些格子会空。
"""
from __future__ import annotations

import hashlib
import io
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
NEED = ROOT / "work/need-chars.json"
REPORT = ROOT / "work/font-coverage-report.json"
CACHE = ROOT / "work/fontcache"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
)
# 一次要太多字符时 Google 会截断，90 个一批稳妥
CHUNK = 90


def get(url: str, timeout: int = 40) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def woff2_cmap(data: bytes) -> set[int]:
    try:
        return set(TTFont(io.BytesIO(data)).getBestCmap())
    except Exception as exc:  # noqa: BLE001
        print(f"  ! 读字体失败 {exc}", file=sys.stderr)
        return set()


def google_coverage(family: str, chars: str) -> tuple[set[int], list[str]]:
    """返回（字体确实收录的码位，出错说明）"""
    covered: set[int] = set()
    problems: list[str] = []
    items = list(chars)
    for i in range(0, len(items), CHUNK):
        chunk = "".join(items[i : i + CHUNK])
        key = hashlib.sha1(f"{family}\u0000{chunk}".encode()).hexdigest()[:16]
        path = CACHE / f"{key}.woff2"
        if not path.exists():
            url = (
                "https://fonts.googleapis.com/css2?family="
                + urllib.parse.quote(family)
                + "&text="
                + urllib.parse.quote(chunk)
            )
            try:
                css = get(url).decode("utf8")
            except urllib.error.HTTPError as exc:
                # 整段都不支持时 Google 直接 400，这一批就没有字形
                problems.append(f"{family}: HTTP {exc.code}")
                continue
            except Exception as exc:  # noqa: BLE001
                problems.append(f"{family}: {exc}")
                continue
            m = re.search(r"url\(([^)]+)\)", css)
            if not m:
                problems.append(f"{family}: css 里没有字体地址")
                continue
            path.write_bytes(get(m.group(1)))
            time.sleep(0.15)
        covered |= woff2_cmap(path.read_bytes())
    return covered, problems


def local_coverage(family: str) -> set[int]:
    for path in (ROOT / "public/fonts").glob("*.woff2"):
        font = TTFont(path)
        names = {rec.toUnicode() for rec in font["name"].names if rec.nameID in (1, 16)}
        if family in names:
            return set(font.getBestCmap())
    return set()


def main() -> None:
    if not NEED.exists():
        sys.exit("先跑 node --import ./tools/register-ts.mjs tools/dump-need-chars.mjs")
    need = json.loads(NEED.read_text("utf8"))
    meta = need.pop("__meta")
    local = set(re.findall(r"family: '([^']+)'", (ROOT / "src/data/localFonts.ts").read_text("utf8")))

    report: dict = {"families": {}, "rosterMissing": {}, "problems": []}
    for family, chars in sorted(need.items()):
        if family in local:
            cov = local_coverage(family)
        else:
            cov, problems = google_coverage(family, chars)
            report["problems"] += problems
        missing = "".join(c for c in chars if ord(c) not in cov)
        report["families"][family] = {
            "asked": len(chars),
            "missing": len(missing),
            "missingChars": missing[:600],
        }
        print(f"{family:36s} 字表 {len(chars):5d}  缺 {len(missing):4d}")

    for script, chars in meta["rosterChars"].items():
        family = meta["rosterFamily"].get(script)
        miss = set(report["families"].get(family, {}).get("missingChars", ""))
        bad = [c for c in chars if c in miss]
        if bad:
            report["rosterMissing"][script] = {
                "family": family,
                "total": len(chars),
                "missing": len(bad),
                "chars": "".join(bad),
            }

    CACHE.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=1), "utf8")

    print("\n== 字母场里没有字形的字 ==")
    if not report["rosterMissing"]:
        print("  无：每个格子都能在对应字族的真实字库里找到字形")
    for script, info in report["rosterMissing"].items():
        print(f"  {script:24s} {info['missing']:3d}/{info['total']:<4d} {info['family']} {info['chars'][:24]}")
    if report["problems"]:
        print("\n== 请求问题 ==")
        for p in report["problems"][:20]:
            print("  " + p)
    print(f"\n报告写到 {REPORT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
