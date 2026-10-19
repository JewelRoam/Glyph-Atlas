/**
 * 本站自托管的字形字体。
 *
 * 进这张表的门槛只有一条：字面画的就是那套书写体系本身的样子。
 * 甲骨文不许用楷体顶替，小篆不许用宋体顶替——宁可留空，也不拿现代字体充数。
 * 字体文件按详情面板要展示的字做子集后放在 public/fonts/ 下，授权与出处见
 * THIRD_PARTY.md。
 */
export interface LocalFont {
  /** 站内使用的字族名（子集改名后不再使用原字体的保留名称） */
  family: string;
  /** public/ 下的字体文件 */
  files: string[];
  /** 版权与出处 */
  credit: string;
  /** 授权 */
  license: string;
  /** 出处链接 */
  home: string;
}

export const localFonts: LocalFont[] = [
  {
    family: 'Glyph Atlas Oracle Bone',
    files: ['fonts/glyph-atlas-oracle-bone.woff2'],
    credit: 'Oracular 鏡原甲骨文（Peichao Qin）子集',
    license: 'SIL OFL 1.1',
    home: 'https://github.com/Ivan666jjj/yigezi',
  },
  {
    family: 'Glyph Atlas Small Seal',
    files: ['fonts/glyph-atlas-small-seal.woff2'],
    credit: '開元小篆（frankslin）＋全字庫《說文解字》子集',
    license: 'SIL OFL 1.1 / OGDL-Taiwan-1.0',
    home: 'https://github.com/frankslin/kaiyuan-small-seal-font',
  },
  {
    // Google Fonts 当前子集仍缺 U+11241（Khojki 依附式 r），上游 Noto 字体已收录；
    // 自托管同名字族，字形来源与 Google Fonts 一致，只补上这一批缺字。
    family: 'Noto Sans Khojki',
    files: ['fonts/glyph-atlas-khojki.woff2'],
    credit: 'Noto Sans Khojki 2.005（Noto Project Authors）Khojki 区段子集',
    license: 'SIL OFL 1.1',
    home: 'https://github.com/notofonts/khojki',
  },
];

export function localFont(family?: string): LocalFont | undefined {
  return family ? localFonts.find((f) => f.family === family) : undefined;
}
