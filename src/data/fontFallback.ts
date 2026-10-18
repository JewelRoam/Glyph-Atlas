/**
 * 没有显式声明字族的书写体系，用哪款字体取字形。
 *
 * 数据里给 fontFamily 的书写体系（腓尼基、阿拉伯、天城文……）用自己那款 Noto；
 * 希腊、拉丁、西里尔、天城文之外的一些体系没有写 fontFamily，靠这张表兜底。
 *
 * 这份表和 tools/build-glyph-paths.py 里的 FALLBACK_FAMILY 是同一份数据的两个
 * 使用者：Python 用它取字形轮廓，前端用它渲染同一批字形。两边必须一致，
 * 否则"矢量形变"与"字体渲染"会画出两种不同的字面。
 */
export const fontFallback: Record<string, string> = {
  greek: 'Noto Sans',
  latin: 'Noto Sans',
  cyrillic: 'Noto Sans',
  devanagari: 'Noto Sans Devanagari',
  bengali: 'Noto Sans Bengali',
  gujarati: 'Noto Sans Gujarati',
  gurmukhi: 'Noto Sans Gurmukhi',
  odia: 'Noto Sans Oriya',
  tamil: 'Noto Sans Tamil',
  telugu: 'Noto Sans Telugu',
  kannada: 'Noto Sans Kannada',
  malayalam: 'Noto Sans Malayalam',
  sinhala: 'Noto Sans Sinhala',
  tibetan: 'Noto Serif Tibetan',
  khmer: 'Noto Sans Khmer',
  thai: 'Noto Sans Thai',
  lao: 'Noto Sans Lao',
  burmese: 'Noto Sans Myanmar',
  arabic: 'Noto Sans Arabic',
  'chinese-regular': 'LXGW WenKai TC',
  hiragana: 'Noto Serif JP',
  katakana: 'Noto Serif JP',
};

/** 某书写体系实际用来画字形的字族 */
export function familyFor(scriptId: string, declared?: string): string | undefined {
  return declared ?? fontFallback[scriptId];
}
