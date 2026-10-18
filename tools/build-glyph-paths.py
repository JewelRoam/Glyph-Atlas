#!/usr/bin/env python3
"""生成 src/data/glyphPaths.ts：血统轨道站点的真实矢量轮廓。

为什么需要它：轨道上只有手绘 path 的站点能做"点对点"形变，其余站点原本只能
交叉淡入淡出。这里把 Google Fonts 上对应 Noto 字体里的单个字形轮廓取出来，
归一化到 100x100 的坐标盒，让每一站都能参与真正的矢量形变。

流程：
  1. node --experimental-strip-types tools/dump-lineage-stops.mjs
     拿到轨道上所有站点及其字体（需要 Node 22.6+ 的类型剥离）。
  2. 按 codepoint 命中 css2 返回的 unicode-range 子集，只下载那一个 woff2。
  3. fontTools 取轮廓，等比缩放居中到 88x88、Y 轴翻转成 SVG 方向。

依赖（只在需要重新生成轮廓时才安装，不进 package.json）：
  python3 -m venv work/.venv
  work/.venv/bin/pip install fonttools brotli

用法：
  work/.venv/bin/python tools/build-glyph-paths.py
"""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'work' / 'glyph-outline-cache'
OUT = ROOT / 'src' / 'data' / 'glyphPaths.ts'
OUT_ALPHA = ROOT / 'src' / 'data' / 'glyphAlphabets.ts'
OUT_ALPHA_VARGA = ROOT / 'src' / 'data' / 'glyphAlphabetsVarga.ts'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

# 数据里没有写 fontFamily 的书写体系，用这里指定的 Noto 字体取轮廓。
# 选择原则：Google Fonts 上有这个字族的版本，且字形风格与该体系的代表字体一致
# （汉字取宋体骨架，假名取日文明朝体，藏文只有 Serif 版本，天城文等取 Noto Sans）。
FALLBACK_FAMILY = {
  'greek': 'Noto Sans',
  'devanagari': 'Noto Sans Devanagari',
  'bengali': 'Noto Sans Bengali',
  'gujarati': 'Noto Sans Gujarati',
  'gurmukhi': 'Noto Sans Gurmukhi',
  'odia': 'Noto Sans Oriya',
  'tamil': 'Noto Sans Tamil',
  'telugu': 'Noto Sans Telugu',
  'kannada': 'Noto Sans Kannada',
  'malayalam': 'Noto Sans Malayalam',
  'sinhala': 'Noto Sans Sinhala',
  'tibetan': 'Noto Serif Tibetan',
  'khmer': 'Noto Sans Khmer',
  'thai': 'Noto Sans Thai',
  'lao': 'Noto Sans Lao',
  'burmese': 'Noto Sans Myanmar',
  'arabic': 'Noto Sans Arabic',
  'chinese-regular': 'LXGW WenKai TC',
  'hiragana': 'Noto Serif JP',
  'katakana': 'Noto Serif JP',
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def css_for(family: str) -> str:
    """取字族的 css2 样式表（带缓存）。"""
    cached = CACHE / f'{family.replace(" ", "-").lower()}.css'
    if cached.exists():
        return cached.read_text()
    url = f'https://fonts.googleapis.com/css2?family={family.replace(" ", "+")}&display=swap'
    css = fetch(url).decode('utf-8', 'replace')
    CACHE.mkdir(parents=True, exist_ok=True)
    cached.write_text(css)
    return css


def parse_ranges(text: str) -> list[tuple[int, int]]:
    ranges = []
    for part in text.split(','):
        part = part.strip().removeprefix('U+')
        if not part:
            continue
        if '-' in part:
            lo, hi = part.split('-')
            ranges.append((int(lo, 16), int(hi, 16)))
        else:
            ranges.append((int(part, 16), int(part, 16)))
    return ranges


def subset_url(family: str, codepoint: int) -> str:
    """按 unicode-range 命中该码位所在的子集，避免下载整套字族。"""
    blocks = re.findall(r'@font-face\s*\{(.*?)\}', css_for(family), re.S)
    urls = []
    for block in blocks:
        match = re.search(r'url\((https://[^)]+)\)', block)
        if not match:
            continue
        urls.append(match.group(1))
        rng = re.search(r'unicode-range:\s*([^;]+);', block)
        if not rng:
            continue
        if any(lo <= codepoint <= hi for lo, hi in parse_ranges(rng.group(1))):
            return match.group(1)
    if len(urls) == 1:
        return urls[0]
    raise LookupError(f'{family} 的 unicode-range 里没有 U+{codepoint:X}')


def download(url: str) -> Path:
    path = CACHE / (url.rsplit('/', 1)[-1] + '.woff2')
    if not path.exists():
        path.write_bytes(fetch(url))
    return path


# 坐标保留一位小数：轮廓先归一化到 100x100 的盒子，0.1 个坐标单位换算到
# 字母场的 46px 格子里是 0.05px，肉眼分不出来，但整包能省掉一成多的体积。
FMT = '{:.1f}'


def fmt(value: float) -> str:
    return FMT.format(value).rstrip('0').rstrip('.')


# SVGPathPen 会用到 M/L/H/V/C/Q/Z：H 只有 x，V 只有 y，其余都是成对坐标。
PAIR_COMMANDS = 'MLCQST'
SINGLE_X = 'H'
SINGLE_Y = 'V'


def transform(path_data: str, scale: float, cx: float, cy: float) -> str:
    """把字体坐标（Y 轴向上、原点在基线）搬进 100x100 的 SVG 坐标盒。"""
    out = []
    for command, args in re.findall(r'([MLHVCQSTZ])([^MLHVCQSTZ]*)', path_data):
        if command == 'Z':
            out.append('Z')
            continue
        numbers = [float(n) for n in re.findall(r'-?\d*\.?\d+(?:e-?\d+)?', args, re.I)]
        points = []
        if command in PAIR_COMMANDS:
            for i in range(0, len(numbers) - 1, 2):
                x = 50 + (numbers[i] - cx) * scale
                y = 50 - (numbers[i + 1] - cy) * scale
                points.append(f'{fmt(x)} {fmt(y)}')
        elif command in SINGLE_X:
            points = [fmt(50 + (x - cx) * scale) for x in numbers]
        elif command in SINGLE_Y:
            points = [fmt(50 - (y - cy) * scale) for y in numbers]
        out.append(command + ' '.join(points))
    return ''.join(out)


# 站点自托管的历史书体字体：直接从 public/fonts/ 取轮廓，
# 不去 Google Fonts 找同名（同名字族在那边并不存在）。
LOCAL_FONTS = {
    'Glyph Atlas Oracle Bone': ROOT / 'public/fonts/glyph-atlas-oracle-bone.woff2',
    'Glyph Atlas Small Seal': ROOT / 'public/fonts/glyph-atlas-small-seal.woff2',
}


def open_font(family: str, codepoint: int) -> TTFont:
    local = LOCAL_FONTS.get(family)
    if local is not None:
        return TTFont(local, fontNumber=0, lazy=True)
    return TTFont(download(subset_url(family, codepoint)), fontNumber=0, lazy=True)


def outline(family: str, char: str) -> str:
    codepoint = ord(char)
    font = open_font(family, codepoint)
    glyph_name = font.getBestCmap().get(codepoint)
    if not glyph_name:
        raise LookupError(f'{family} 的子集里没有 U+{codepoint:X}')
    glyphs = font.getGlyphSet()
    pen, bounds = SVGPathPen(glyphs), BoundsPen(glyphs)
    glyphs[glyph_name].draw(pen)
    glyphs[glyph_name].draw(bounds)
    if not bounds.bounds:
        raise LookupError(f'{family} 的 U+{codepoint:X} 是空轮廓')
    x0, y0, x1, y1 = bounds.bounds
    scale = 88.0 / max(x1 - x0, y1 - y0, 1e-6)
    return transform(pen.getCommands(), scale, (x0 + x1) / 2, (y0 + y1) / 2)


def dump(script_name: str) -> list[dict]:
    raw = subprocess.run(
        ['node', '--experimental-strip-types', f'tools/{script_name}'],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(raw)


def stops() -> list[dict]:
    return dump('dump-lineage-stops.mjs')


def letter_slots() -> list[dict]:
    return dump('dump-letter-slots.mjs')


def write_alphabets() -> int:
    """字母槽位表里每个字符的轮廓，供 MICRO 字母场做整套字母表的形变。

    分成两包：闪米特—希腊—拉丁那条线（core）与婆罗米系的梵语字音表
    （varga）。字母场只按当前这一段轨道需要的包去取，走闪米特轨道的读者
    不必先下载印度那 600 多个轮廓。
    """
    groups: dict[str, dict[str, str]] = {'core': {}, 'varga': {}}
    sources: dict[str, str] = {}
    failures: list[str] = []

    for item in letter_slots():
        family = item.get('family')
        if not family:
            failures.append(f"{item['script']}/{item['slot']} 没有可用字体")
            continue
        key = f"{item['script']}:{item['char']}"
        group = 'varga' if item['slot'].startswith('varga-') else 'core'
        if key in groups[group]:
            continue
        try:
            groups[group][key] = outline(family, item['char'])
            sources[key] = family
        except Exception as error:  # noqa: BLE001
            failures.append(f"{item['script']} {item['slot']} {item['char']} ({family}): {error}")

    for group, path, exported, title in (
        ('core', OUT_ALPHA, 'alphabetPaths', '闪米特—希腊—拉丁一线'),
        ('varga', OUT_ALPHA_VARGA, 'alphabetPathsVarga', '婆罗米系（梵语字音表 varga）'),
    ):
        entries = groups[group]
        lines = [
            '/**',
            f' * 字母槽位的矢量轮廓（{title}）—— 由 tools/build-glyph-paths.py 生成，请勿手工编辑。',
            ' *',
            ' * MICRO 的字母场要把一整套字母表从一种文字形变到另一种文字，所以每个',
            ' * 参与对照的字母都需要自己的轮廓。字形取自各书写体系声明的字体',
            ' * （见 src/data/fontFallback.ts），缩放居中到 100x100 坐标盒。',
            ' *',
            ' * 键为 `${scriptId}:${char}`；按组拆包是因为这组字只在这几条轨道上用得到，',
            ' * 让 lib/alphabetPaths.ts 按需取。',
            ' *',
            ' * 字形来源（Noto 系列，SIL OFL 1.1）：',
        ]
        for key in sorted(entries):
            lines.append(f' *   {key} → {sources[key]}')
        lines += [
            ' *',
            ' * 重新生成：',
            ' *   work/.venv/bin/python tools/build-glyph-paths.py',
            ' */',
        ]
        lines.append(f'export const {exported}: Record<string, string> = {{')
        for key in sorted(entries):
            lines.append(f"  {json.dumps(key, ensure_ascii=False)}: {json.dumps(entries[key])},")
        lines.append('};')
        lines.append('')
        path.write_text('\n'.join(lines))
        print(f'写入 {path.relative_to(ROOT)}：{len(entries)} 个字母轮廓，{path.stat().st_size / 1024:.1f} KB')

    for message in failures:
        print(f'  ✗ {message}')
    return 1 if failures else 0


def main() -> int:
    entries: dict[str, str] = {}
    sources: dict[str, str] = {}
    failures: list[str] = []

    for stop in stops():
        char = stop['char']
        if not char or stop['handPath']:
            continue
        family = stop.get('family') or stop['fontFamily'] or FALLBACK_FAMILY.get(stop['script'])
        if not family:
            failures.append(f"{stop['lineage']}/{stop['script']} 没有可用字体")
            continue
        try:
            entries[f"{stop['script']}:{char}"] = outline(family, char)
            sources[f"{stop['script']}:{char}"] = family
        except Exception as error:  # noqa: BLE001
            failures.append(f"{stop['lineage']}/{stop['script']} {char} ({family}): {error}")

    lines = [
        '/**',
        ' * 血统轨道站点的矢量轮廓，由 tools/build-glyph-paths.py 生成，请勿手工编辑。',
        ' *',
        ' * 每个字形取自 Google Fonts 上对应 Noto 字体的实际轮廓，等比缩放居中到',
        ' * 100x100 坐标盒后再把 Y 轴翻成 SVG 方向，因此任意两站之间都能做',
        ' * 点对点的矢量形变，而不只是交叉淡出。键为 `${scriptId}:${char}`。',
        ' *',
        ' * 字形来源（Noto 系列，SIL OFL 1.1）：',
    ]
    for key in sorted(entries):
        lines.append(f' *   {key} → {sources[key]}')
    lines += [
        ' *',
        ' * 重新生成：',
        ' *   python3 -m venv work/.venv && work/.venv/bin/pip install fonttools brotli',
        ' *   work/.venv/bin/python tools/build-glyph-paths.py',
        ' */',
    ]
    lines.append('export const glyphPaths: Record<string, string> = {')
    for key in sorted(entries):
        lines.append(f"  {json.dumps(key, ensure_ascii=False)}: {json.dumps(entries[key])},")
    lines.append('};')
    lines.append('')
    OUT.write_text('\n'.join(lines))

    size = OUT.stat().st_size
    print(f'写入 {OUT.relative_to(ROOT)}：{len(entries)} 个字形轮廓，{size / 1024:.1f} KB')
    for message in failures:
        print(f'  ✗ {message}')

    alphabet_status = write_alphabets()
    return 1 if failures or alphabet_status else 0


if __name__ == '__main__':
    sys.exit(main())
