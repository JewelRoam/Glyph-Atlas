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
    id: 'anatolian-alpha',
    nameZh: '希腊 alpha → 安纳托利亚 a',
    nameEn: 'Greek alpha → Anatolian a',
    mode: 'cognate',
    description:
      '希腊字母向安纳托利亚传播后，吕底亚、吕基亚和卡里亚各自改造出一套地方字母。' +
      '三家的 alpha 都还读 /a/，笔画收束与书写方向却分道扬镳：吕底亚一行从右到左，' +
      '吕基亚与卡里亚另有自己的取舍。吕底亚、吕基亚两站能接出整套字母表的对照，' +
      '卡里亚与希腊的音值对应至今没有定论，所以最后一站只做单字形展示。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'lydian', char: '𐤠', label: '吕底亚 a', phonetic: 'a' },
      { script: 'lycian', char: '𐊀', label: '吕基亚 a', phonetic: 'a' },
      { script: 'carian', char: '𐊠', label: '卡里亚 a', phonetic: 'a' },
    ],
  },

  {
    id: 'peripheral-alpha',
    nameZh: '希腊 alpha → 高加索与巴尔干 a',
    nameEn: 'Greek alpha → Caucasian and Balkan a',
    mode: 'cognate',
    description:
      '希腊字母的模型不只进入西欧：高加索阿尔巴尼亚字母、古彼尔姆字母，' +
      '以及阿尔巴尼亚人的埃尔巴桑、维特库奇字母，都把 A 音写成各自的本地骨架。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'caucasian-albanian', char: '𐔰', label: '高加索阿尔巴尼亚 alt', phonetic: 'a' },
      { script: 'old-permic', char: '𐍐', label: '古彼尔姆 an', phonetic: 'a' },
      { script: 'elbasan', char: '𐔀', label: '埃尔巴桑 a', phonetic: 'a' },
      { script: 'vithkuqi', char: '𐕰', label: '维特库奇 a', phonetic: 'a' },
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
    id: 'aramaic-pahlavi',
    nameZh: '阿拉米 ʾālep → 巴列维支系',
    nameEn: 'Aramaic ʾālep → Pahlavi branch',
    mode: 'cognate',
    description:
      '阿拉米字母进入伊朗高原后笔画被压扁、粘连，成了书写中古波斯语的巴列维字母。' +
      '同一套骨架下分出几支后身：萨珊王朝石壁上的碑铭体、吐鲁番写本里的诗篇体，' +
      '以及借它记经书的阿维斯陀字母——到最后一站，ʾālep 已经收成一个规整的 /a/。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'inscriptional-pahlavi', char: '𐭠', label: '碑铭巴列维 aleph', phonetic: 'ʔ' },
      { script: 'psalter-pahlavi', char: '𐮀', label: '诗篇巴列维 aleph', phonetic: 'ʔ' },
      { script: 'avestan', char: '𐬀', label: '阿维斯陀 a', phonetic: 'a' },
    ],
  },

  {
    id: 'greek-diaspora',
    nameZh: '希腊 Α → 各地的 a',
    nameEn: 'Greek Α → regional a',
    mode: 'cognate',
    description:
      '希腊字母的模型向四方扩散，被不同语言借去时都留下了各自的 /a/：' +
      '尼罗河谷的科普特 Ⲁ、巴尔干半岛的哥特 𐌰，' +
      '以及高加索的亚美尼亚 Ա 与格鲁吉亚 ა。共用一个起点，笔画却毫无相似。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'coptic', char: 'Ⲁ', label: '科普特 alfa', phonetic: 'a' },
      { script: 'gothic', char: '𐌰', label: '哥特 aza', phonetic: 'a' },
      { script: 'armenian', char: 'Ա', label: '亚美尼亚 ayb', phonetic: 'a' },
      { script: 'georgian', char: 'ა', label: '格鲁吉亚 ani', phonetic: 'a' },
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

  {
    id: 'aramaic-west',
    nameZh: '阿拉米 ʾālep → 西支诸字母',
    nameEn: 'Aramaic ʾālep → western branches',
    mode: 'cognate',
    description:
      '阿拉米字母西传后，帕尔米拉、哈特拉和叙利亚各自发展出地方字母。' +
      '四站都以 ʾālep 为祖形，却分别收束成不同骨架：帕尔米拉与哈特拉留下石刻的棱角，' +
      '叙利亚字母则长出连写与变体传统。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'palmyrene', char: '𐡠', label: '帕尔米拉 ʾālep', phonetic: 'ʔ' },
      { script: 'hatran', char: '𐣠', label: '哈特拉 ʾālep', phonetic: 'ʔ' },
      { script: 'syriac', char: 'ܐ', label: '叙利亚 ʾālep', phonetic: 'ʔ' },
    ],
  },

  {
    id: 'slavic-alphabet',
    nameZh: '希腊 Α → 格拉哥里与西里尔',
    nameEn: 'Greek Α → Glagolitic and Cyrillic',
    mode: 'cognate',
    description:
      '九世纪，君士坦丁—基里尔为斯拉夫语创制格拉哥里字母；不久，保加利亚第一帝国' +
      '以希腊安色尔体为骨架，并受格拉哥里影响形成西里尔字母。' +
      '两套字母都从希腊 Α 的模型出发，却各自长成不同的笔画秩序。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'glagolitic', char: 'Ⰰ', label: '格拉哥里 azъ', phonetic: 'a' },
      { script: 'cyrillic', char: 'А', label: '西里尔 azъ', phonetic: 'a' },
    ],
  },

  {
    id: 'aramaic-mandaic',
    nameZh: '阿拉米 ʾālep → 曼达 a',
    nameEn: 'Aramaic ʾālep → Mandaic a',
    mode: 'chain',
    description:
      '阿拉米字母东传的一支在美索不达米亚南部发展为曼达字母。' +
      '第一个字母仍对应 /a/，字形却已变成弯曲的 halqa——' +
      '同一条字母血统，在宗教写本里留下了另一种走向。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'mandaic', char: 'ࡀ', label: '曼达 halqa', phonetic: 'a' },
    ],
  },

  {
    id: 'hebrew-squared',
    nameZh: '阿拉米 ʾālep → 希伯来 alef',
    nameEn: 'Aramaic ʾālep → Hebrew alef',
    mode: 'chain',
    description:
      '今天写的方形希伯来字母并不是古希伯来字母的直系延续。巴比伦之囚以后，' +
      '流亡社群改用阿拉米字母抄写经文，字母名与音值照旧，字形却整体换成了' +
      '另一套骨架。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'hebrew', char: 'א', label: '希伯来 alef', phonetic: 'ʔ' },
    ],
  },

  {
    id: 'samaritan-line',
    nameZh: '腓尼基 ʾālep → 撒玛利亚 alaf',
    nameEn: 'Phoenician ʾālep → Samaritan alaf',
    mode: 'chain',
    description:
      '撒玛利亚人没有跟着改用方形希伯来字母，而是守着古希伯来书体一路写下来，' +
      '成为后来的撒玛利亚字母——《撒玛利亚五经》到今天仍用它抄写。' +
      '二十二个字母的骨架都能追回腓尼基。',
    stops: [
      { script: 'phoenician', char: '𐤀', label: '腓尼基 ʾālep', phonetic: 'ʔ' },
      { script: 'samaritan', char: 'ࠀ', label: '撒玛利亚 alaf', phonetic: 'ʔ' },
    ],
  },

  {
    id: 'cyrillic-line',
    nameZh: '希腊 Α → 西里尔 А',
    nameEn: 'Greek Α → Cyrillic А',
    mode: 'cognate',
    description:
      '九世纪末，保加利亚第一帝国的书手以希腊安色尔体为骨架、又参照格拉哥里字母，' +
      '拼出了西里尔字母。数字值暴露了这层血缘：И 占 8（Η）、Ѕ 占 6（Ϝ/Ϛ）、' +
      'У 占 400（Υ）、Ф 占 500（Φ）、Ѡ 占 800（Ω），都和希腊字母表一一对上。' +
      '斯拉夫语特有的音——ж ц ч ш щ ъ ы ь ѣ ю ѧ ѫ——则另立新字，在字母场里飞入。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'cyrillic', char: 'А', label: '西里尔 azъ', phonetic: 'a' },
    ],
  },
]
