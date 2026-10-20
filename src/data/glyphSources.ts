import type { WritingSystem } from './types';
import { localFont } from './localFonts';
import { glyphPlates, type GlyphPlate } from './glyphPlates';

/**
 * 字形来源解析。
 *
 * 详情面板里的每一格字形都必须能回答"它到底从哪来"。这里把来源分成三种：
 *  · font  —— 有字面确实对得上该书写体系的字体（自托管或 Google Fonts）；
 *  · image —— 该字形的位图 / 矢量图，通常来自碑帖、拓片、古籍扫描；
 *  · none  —— 暂时没有可靠来源，字形位留空并写明原因。
 *
 * 规则：字形渲染成什么样，只能由这里说了算。declared family 不覆盖某个字符时
 * 直接留空，绝不回退到系统字体——系统字体会把甲骨文画成楷体。
 *
 * kind === 'image' 的体系，逐字图片放在 public/glyphs/<scriptId>/ 下，键是字符
 * 本身（组合字用码位十六进制）。图片的授权必须写进 credit / license / home，
 * 并同步登记到 public/glyphs/CREDITS.md；来源不明或授权不清的图一律不进仓库。
 * 只有出现在 images 里的字才会画出图，其余留空。
 */
export interface GlyphSource {
  kind: 'font' | 'image' | 'none';
  /** kind === 'font' 时的字族名 */
  family?: string;
  /** 字形的版权与出处 */
  credit?: string;
  license?: string;
  /** 出处链接 */
  home?: string;
  /** 逐字图片字形：字符 → public/ 下的路径 */
  images?: Record<string, string>;
  /** 整幅图版：没有字符集可排时的代替物 */
  plates?: GlyphPlate[];
  /** 给读者的说明 */
  note?: string;
}

/**
 * 需要改掉默认字体的书写体系。
 *
 * 默认字体是中性的 Google Fonts Noto 系列：它画的是该文字本身的字面，
 * 所以对绝大多数体系来说正合适。下面这些是例外——历史书体（甲骨、篆、隶）
 * 或没有 Unicode 编码的草写体（僧侣、世俗），默认字体画的是别的东西。
 */
/**
 * 以图版为字形来源的体系：没有可用字库，也没有（或几乎不设）Unicode 编码，
 * 排不出逐字字表，就在详情里铺一两幅有出处的实物图 / 摹本。
 */
function plateSource(id: string, note: string): GlyphSource {
  return { kind: 'image', plates: glyphPlates[id], note };
}

function plateSources(...ids: string[]): Record<string, GlyphSource> {
  const out: Record<string, GlyphSource> = {};
  for (const id of ids) out[id] = { kind: 'image', plates: glyphPlates[id] };
  return out;
}

const OVERRIDES: Record<string, GlyphSource> = {
  siddham: {
    kind: 'font',
    family: 'Noto Sans Siddham',
    credit: 'Noto Sans Siddham（Google Fonts）',
    license: 'SIL OFL 1.1',
    home: 'https://fonts.google.com/?query=Noto%20Sans%20Siddham',
    plates: glyphPlates.siddham,
  },
  gaudi: plateSource('gaudi',
    '高迪文没有独立 Unicode 编码，也没有可靠的开源字库；这里用 11 世纪《八千颂般若经》写本图版展示其书体，不以孟加拉文或悉昙文字体代替。',
  ),
  'chinese-oracle': {
    kind: 'font',
    family: 'Glyph Atlas Oracle Bone',
    credit: 'Oracular 鏡原甲骨文（Peichao Qin）子集',
    license: 'SIL OFL 1.1',
    home: 'https://github.com/Ivan666jjj/yigezi',
    note: '字面为甲骨文原刻写法，出自镜原甲骨数字平台的甲骨文字库；字库未收的字不列出。',
  },
  'chinese-seal': {
    kind: 'font',
    family: 'Glyph Atlas Small Seal',
    credit: '開元小篆（frankslin）＋全字庫《說文解字》子集',
    license: 'SIL OFL 1.1 / OGDL-Taiwan-1.0',
    home: 'https://github.com/frankslin/kaiyuan-small-seal-font',
    note: '字面自《說文解字》刻本描摹；《說文》未收的字没有小篆字形，不列出。',
  },
  'chinese-clerical': plateSource( 'chinese-clerical',
    '隶书把篆书的圆转改写成方折；没有授权明确、字形可靠的隶书字库，所以用东汉碑刻拓本代替，不以宋体、楷体等现代字体顶替。',
  ),
  hieratic: plateSource('hieratic',
    '僧侣体是圣书体的草写体，Unicode 未单独编码，也没有可靠的开源字库；这里用真实的僧侣体纸草代替逐字字表。',
  ),
  demotic: plateSource('demotic',
    '世俗体是僧侣体进一步草写的结果，Unicode 未单独编码；这里用真实的世俗体纸草代替逐字字表。',
  ),
  'libyco-berber': plateSource('libyco-berber',
    '古代利比亚—柏柏尔字母没有统一编码，也没有可靠的开源历史字库；这里用突尼斯出土墓碑实拍和道加双语铭文早期图录展示，不用现代提非纳字体冒充古书体。',
  ),
  ...plateSources(
    'indus',
    'proto-elamite',
    'olmec',
    'rethra',
    'rongorongo',
    'proto-sinaitic',
    'pahlavi',
    'pallava',
    'kadamba',
    'nagari',
    'khitan-large',
    'jurchen',
    'zapotec',
    'epi-olmec',
    'aztec',
    'mixtec',
    'nsibidi',
    'mandombe',
    'khipu',
    'dongba',
    'maya',
    'southwestern-iberian',
    'southeastern-iberian',
    'northeastern-iberian',
    'celtiberian',
    'greco-iberian',
    'gupta',
    'bactrian',
    'pyu',
  ),
};

/**
 * 某个字符的图片字形（kind === 'image' 或混排体系逐字覆盖时用）。
 * 键优先按字符本身，其次按码位十六进制。
 */
export function imageFor(source: GlyphSource, char: string): string | undefined {
  const images = source.images;
  if (!images) return undefined;
  return images[char] ?? images[char.codePointAt(0)?.toString(16) ?? ''] ?? undefined;
}

/** 这套文字是不是以图片为主 */
export function isImageSource(source: GlyphSource): boolean {
  return source.kind === 'image';
}

/** 某个书写体系在详情面板里的字形来源 */
export function glyphSourceFor(system: WritingSystem): GlyphSource {
  const override = OVERRIDES[system.id];
  if (override) return override;
  if (system.fontFamily) {
    const local = localFont(system.fontFamily);
    return {
      kind: 'font',
      family: system.fontFamily,
      credit: local?.credit ?? `${system.fontFamily}（Google Fonts）`,
      license: local?.license ?? 'SIL OFL 1.1',
      home: local?.home ?? `https://fonts.google.com/?query=${encodeURIComponent(system.fontFamily)}`,
    };
  }
  return { kind: 'none' };
}
