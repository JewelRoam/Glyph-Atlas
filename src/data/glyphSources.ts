import type { WritingSystem } from './types';
import { localFont } from './localFonts';

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
const OVERRIDES: Record<string, GlyphSource> = {
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
  'chinese-clerical': {
    kind: 'none',
    note: '隶书由小篆草写演变而来，笔画有波磔。目前没有授权明确、字形可靠的隶书字库，这里留空，不以宋体、楷体等现代字体顶替。',
  },
  hieratic: {
    kind: 'none',
    note: '僧侣体是圣书体的草写体，Unicode 未单独编码，也没有可用的开源字体或字形图。留在空位，不拿圣书体符号顶替。',
  },
  demotic: {
    kind: 'none',
    note: '世俗体是僧侣体进一步草写的结果，Unicode 未单独编码，暂无可靠字形来源。留在空位，不拿圣书体符号顶替。',
  },
};

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
