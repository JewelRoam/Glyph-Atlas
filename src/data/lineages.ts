import type { Lineage } from './types';

/**
 * 血统轨道：一条穿越多个书写体系的"同源字位"路径。
 *
 * 两种渲染模式：
 *  - path 模式：站点带 SVG path（viewBox 0 0 100 100），走真·矢量形变。
 *  - font 模式：站点只有 char，按 script 取字体，走平滑淡变 + 缩放平移。
 *
 * 说明：带 path 的古字形为"示意性重构"，用于演示演变机制，
 * 不等同于严格的古文字学摹本；后续可逐步替换为精确轮廓。
 */
export const lineages: Lineage[] = [
  {
    id: 'aleph',
    nameZh: '牛头 → 字母 A',
    nameEn: 'Ox head → A',
    mode: 'chain',
    description:
      '字母表最著名的一条血统：埃及圣书体的"牛头"符号被西奈半岛的闪米特人借去表音，' +
      '经腓尼基、希腊一路演变，最终成为拉丁字母 A。约四千年间，它从一幅图画变成了一组笔画。',
    stops: [
      {
        script: 'egyptian',
        label: '牛头（圣书体 F1）',
        phonetic: 'pr / 牛',
        path:
          'M50 8 C42 8 34 13 30 21 C25 15 16 12 8 16 C3 26 9 36 19 39 ' +
          'C15 52 17 70 25 84 C31 94 40 97 50 94 C60 97 69 94 75 84 ' +
          'C83 70 85 52 81 39 C91 36 97 26 92 16 C84 12 75 15 70 21 ' +
          'C66 13 58 8 50 8 Z',
      },
      {
        script: 'proto-sinaitic',
        label: 'ʾalp（牛）',
        phonetic: 'ʔ',
        path:
          'M50 10 C43 10 37 15 33 23 C27 17 18 15 10 20 C6 29 12 38 21 41 ' +
          'C17 54 20 72 28 84 C34 93 42 96 50 93 C58 96 66 93 72 84 ' +
          'C80 72 83 54 79 41 C88 38 94 29 90 20 C82 15 73 17 67 23 ' +
          'C63 15 57 10 50 10 Z',
      },
      {
        script: 'phoenician',
        label: 'ʾālep',
        phonetic: 'ʔ',
        path:
          'M30 8 L48 8 L48 38 L78 8 L94 24 L58 52 L94 80 L78 96 L48 66 ' +
          'L48 92 L30 92 Z',
      },
      {
        script: 'greek',
        label: 'alpha（早期）',
        phonetic: 'a',
        path: 'M50 8 L94 94 L72 94 L50 46 L28 94 L6 94 Z',
      },
      {
        script: 'latin',
        label: 'A',
        phonetic: 'a',
        path:
          'M50 4 L98 96 L74 96 L62 76 L38 76 L26 96 L2 96 Z ' +
          'M50 28 L58 66 L42 66 Z',
      },
    ],
  },

  {
    id: 'ka',
    nameZh: '婆罗米 ka → 各国 ka',
    nameEn: 'Brahmi ka → modern ka',
    mode: 'cognate',
    description:
      '同一个辅音音节 ka，从公元前三世纪的婆罗米文出发，' +
      '散落到天城文、泰米尔文、藏文、高棉文、泰文、缅文……' +
      '两千三百年后，它们仍共享同一个音值和一个隐约可辨的骨架。',
    stops: [
      { script: 'brahmi', char: '𑀓', label: '婆罗米文', phonetic: 'ka' },
      { script: 'siddham', char: '𑖎', label: '悉昙文', phonetic: 'ka' },
      { script: 'grantha', char: '𑌕', label: '格兰塔文', phonetic: 'ka' },
      { script: 'devanagari', char: 'क', label: '天城文', phonetic: 'ka' },
      { script: 'bengali', char: 'ক', label: '孟加拉文', phonetic: 'ka' },
      { script: 'gujarati', char: 'ક', label: '古吉拉特文', phonetic: 'ka' },
      { script: 'gurmukhi', char: 'ਕ', label: '果鲁穆奇文', phonetic: 'ka' },
      { script: 'odia', char: 'କ', label: '奥里亚文', phonetic: 'ka' },
      { script: 'tamil', char: 'க', label: '泰米尔文', phonetic: 'ka' },
      { script: 'telugu', char: 'క', label: '泰卢固文', phonetic: 'ka' },
      { script: 'kannada', char: 'ಕ', label: '卡纳达文', phonetic: 'ka' },
      { script: 'malayalam', char: 'ക', label: '马拉雅拉姆文', phonetic: 'ka' },
      { script: 'sinhala', char: 'ක', label: '僧伽罗文', phonetic: 'ka' },
      { script: 'tibetan', char: 'ཀ', label: '藏文', phonetic: 'ka' },
      { script: 'java', char: 'ꦏ', label: '爪哇文', phonetic: 'ka' },
      { script: 'balinese', char: 'ᬓ', label: '巴厘文', phonetic: 'ka' },
      { script: 'khmer', char: 'ក', label: '高棉文', phonetic: 'ka' },
      { script: 'thai', char: 'ก', label: '泰文', phonetic: 'ka' },
      { script: 'lao', char: 'ກ', label: '老挝文', phonetic: 'ka' },
      { script: 'burmese', char: 'က', label: '缅文', phonetic: 'ka' },
    ],
  },

  {
    id: 'arabic-alef',
    nameZh: '阿拉米 ʾālep → 阿拉伯 ا',
    nameEn: "Aramaic ʾālep → Arabic alif",
    mode: 'chain',
    description:
      '阿拉伯字母并不是无源之水：它的字形可沿纳巴泰、阿拉米一路追到腓尼基。' +
      '这条轨道只走北方主线，展示同一个辅音 ʾ 如何从西奈—黎凡特的古老字母，' +
      '收束成今天阿拉伯文的 ا。',
    stops: [
      { script: 'phoenician', char: '𐤀', label: '腓尼基 ʾālep', phonetic: 'ʔ' },
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'nabataean', char: '𐢀', label: '纳巴泰 ʾālep', phonetic: 'ʔ' },
      { script: 'arabic', char: 'ا', label: '阿拉伯 ʾalif', phonetic: 'ʔ / aː' },
    ],
  },

  {
    id: 'silk-road',
    nameZh: '阿拉米 ʾālep → 蒙古 a',
    nameEn: "Aramaic aleph → Mongolian a",
    mode: 'chain',
    description:
      '字母沿丝绸之路向东传播的一条主干：阿拉米字母的 ʾālep 被粟特人借去，' +
      '再由回鹘人继承，最后进入蒙古字母。语言换了，音值也变了，' +
      '但纵向书写的骨架仍能一路辨认。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'sogdian', char: '𐼰', label: '粟特 ʾālep', phonetic: 'ʔ' },
      { script: 'old-uyghur', char: '𐽰', label: '回鹘 aleph', phonetic: 'a / ʔ' },
      { script: 'mongolian', char: 'ᠠ', label: '蒙古 a', phonetic: 'a' },
    ],
  },

  {
    id: 'kana',
    nameZh: '汉字 → 平假名',
    nameEn: 'Kanji → hiragana',
    mode: 'pair',
    description:
      '平假名并非凭空发明：每个假名都是某个汉字的草书简省。' +
      '安→あ、以→い、宇→う、衣→え、於→お。' +
      '这是"文字被借去记音"的又一个典型样本，与字母表的诞生如出一辙。',
    stops: [
      { script: 'chinese-regular', char: '安', label: '汉字「安」', phonetic: 'an' },
      { script: 'hiragana', char: 'あ', label: '平假名「あ」', phonetic: 'a' },
      { script: 'chinese-regular', char: '宇', label: '汉字「宇」', phonetic: 'u' },
      { script: 'hiragana', char: 'う', label: '平假名「う」', phonetic: 'u' },
      { script: 'chinese-regular', char: '衣', label: '汉字「衣」', phonetic: 'i' },
      { script: 'hiragana', char: 'え', label: '平假名「え」', phonetic: 'e' },
      { script: 'chinese-regular', char: '加', label: '汉字「加」', phonetic: 'ka' },
      { script: 'katakana', char: 'カ', label: '片假名「カ」', phonetic: 'ka' },
    ],
  },
];
