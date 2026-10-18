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
    id: 'italy',
    nameZh: '希腊 Α → 伊特鲁里亚 → 半岛各家 → 罗马',
    nameEn: 'Greek Α → Etruscan → Old Italic → Latin',
    mode: 'chain',
    description:
      '那不勒斯湾的优卑亚希腊字母北上，先被伊特鲁里亚人借去：希腊 Γ 在那边读 /k/，' +
      '于是成了拉丁 C；希腊 Χ 与 Ψ 照西方希腊的读法给了伊特鲁里亚的 /ks/ 与 /kʰ/。' +
      '罗马字母的整套骨架就是从伊特鲁里亚落下来的。半岛上其余各家又都从伊特鲁里亚' +
      '字母出发，各自添字：伊特鲁里亚与法利希添 EF，翁布里亚添 ERS 与 CHE，' +
      '奥斯坎添 II 与 UU，南皮切努姆添 ESS，北边的维内蒂与雷蒂亚添 YE 与两个 TSE；' +
      'Unicode 把这些收成一节"古意大利字母"。伊特鲁里亚没有希腊 Ω 的位置，' +
      '走到那一站时 omega 会消失。最后一站是罗马从南伊特鲁里亚一支定下来的拉丁' +
      '字母表——半岛各家添的那些字，它又收了回去。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'etruscan', char: '𐌀', label: '伊特鲁里亚 a', phonetic: 'a' },
      { script: 'old-italic', char: '𐌀', label: '古意大利字母 a', phonetic: 'a' },
      { script: 'latin', char: 'A', label: '拉丁 A', phonetic: 'a' },
    ],
  },

  {
    id: 'northern-runes',
    nameZh: '古意大利字母 → 卢恩字母',
    nameEn: 'Old Italic → Runic',
    mode: 'chain',
    description:
      '阿尔卑斯山北麓的日耳曼人借走了一套古意大利—拉丁类型的字母：F 还是那根竖钩、' +
      'R 还是那个弯头、O 还是那个圈，骨架认得出，读音却按自己的语言重排了一遍，还添了' +
      '拉丁字母表里根本没有的音——þ w j ï ŋ。头六个字母是 f u þ a r k，这张表因此叫' +
      '"futhark"。往后英格兰人与北欧人各自添字改形：盎格鲁-撒克逊的 futhorc、北欧的' +
      'younger futhark、中世纪加点的卢恩，Unicode 把各代的字面都收在 U+16A0 一节的' +
      '83 个字母里，走到卢恩这一站时整批飞入，字母表一次补成一个全。',
    stops: [
      { script: 'old-italic', char: '𐌀', label: '古意大利字母 a', phonetic: 'a' },
      { script: 'runic', char: 'ᚨ', label: '卢恩 ansuz a', phonetic: 'a' },
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
    id: 'iranian-aramaic',
    nameZh: '阿拉米 ʾālep → 中古伊朗与中亚诸字母',
    nameEn: 'Aramaic ʾālep → Middle Iranian & Central Asian alphabets',
    mode: 'cognate',
    description:
      '阿拉米字母东传之后，帕提亚、埃利迈、花剌子模与粟特各自把这套字母搬进本地语言，' +
      '字母名从 aleph 一路排到 taw 都没改。格子按字母名对齐：' +
      '花剌子模丢了 teth、sadhe、qoph 三个，粟特丢了 teth 和 qoph，' +
      '走到那两站时对应的格子会把字母送出去，其余的原地变形。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'parthian', char: '𐭀', label: '帕提亚 aleph', phonetic: 'ʔ' },
      { script: 'elymaic', char: '𐿠', label: '埃利迈 aleph', phonetic: 'ʔ' },
      { script: 'chorasmian', char: '𐾰', label: '花剌子模 aleph', phonetic: 'ʔ' },
      { script: 'old-sogdian', char: '𐼀', label: '古粟特 aleph', phonetic: 'ʔ' },
    ],
  },

  {
    id: 'semitic-south',
    nameZh: 'ʾālep → 南方闪米特诸字母',
    nameEn: 'ʾālep → South Semitic alphabets',
    mode: 'cognate',
    description:
      '腓尼基—阿拉米那条线把辅音并成了 22 个字母：西北闪米特的 ḫ 并进 ḥ、ḏ 并进 z、' +
      'ġ 并进 ʿ、ẓ 并进 ṣ、ḍ 并进 d。乌加里特与南、北阿拉伯却把这些音分写，' +
      '字母表停在 29 到 30 个字母上，南阿拉伯还多保留一个边音 s¹。' +
      '三站是同一祖形的平行后身，不是互相演变的链条。',
    stops: [
      { script: 'ugaritic', char: '𐎀', label: '乌加里特 alpa', phonetic: 'ʔ' },
      { script: 'old-south-arabian', char: '𐩱', label: '古南阿拉伯 alef', phonetic: 'ʔ' },
      { script: 'old-north-arabian', char: '𐪑', label: '古北阿拉伯 alef', phonetic: 'ʔ' },
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
      '字母沿丝绸之路向东传播的一条主干：阿拉米字母先在中亚落地成古粟特文，' +
      '再长成连写的粟特字母，回鹘人从粟特的草体接过它，最后进入蒙古字母。' +
      '阿拉米 22 个字母走到古粟特时已经缩了一圈：ṭ 与 q 并掉了，r / ʿ / d 三音' +
      '合成一个字面（Unicode 把它收作 RESH-AYIN-DALETH），所以那几格会飞出或合拢；' +
      '粟特自己添的 feth 与 leš 则从下方飞入。语言换了，音值也变了，' +
      '但纵向书写的骨架仍能一路辨认。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'old-sogdian', char: '𐼀', label: '古粟特 ʾālep', phonetic: 'ʔ' },
      { script: 'sogdian', char: '𐼰', label: '粟特 ʾālep', phonetic: 'ʔ' },
      { script: 'old-uyghur', char: '𐽰', label: '回鹘 aleph', phonetic: 'a / ʔ' },
      { script: 'mongolian', char: 'ᠠ', label: '蒙古 a', phonetic: 'a' },
    ],
  },

  {
    id: 'kana',
    nameZh: '汉字 → 假名',
    nameEn: 'Kanji → kana',
    mode: 'pair',
    description:
      '平假名与片假名都从汉字借来：整字的草书一路简省成平假名，' +
      '整字的一个部件截下来当片假名。格子里一个音节一格，' +
      '汉字一列写的是万叶假名给这个音用的借字——安→あ、以→い、宇→う、加→カ。' +
      '浊音、半浊音是后来在假名上加符号造出来的，走过去时飞入。',
    stops: [
      { script: 'chinese-regular', char: '安', label: '汉字「安」', phonetic: 'an' },
      { script: 'hiragana', char: 'あ', label: '平假名「あ」', phonetic: 'a' },
      { script: 'katakana', char: 'ア', label: '片假名「ア」', phonetic: 'a' },
    ],
  },

  {
    id: 'aramaic-west',
    nameZh: '阿拉米 ʾālep → 西支诸字母',
    nameEn: 'Aramaic ʾālep → western branches',
    mode: 'cognate',
    description:
      '阿拉米字母西传后，帕尔米拉、哈特拉和叙利亚各自发展出地方字母，' +
      '叙利亚字母又长出了摩尼字母。五站都以 ʾālep 为祖形，却分别收束成不同骨架：' +
      '帕尔米拉与哈特拉留下石刻的棱角，叙利亚字母生出连写与变体传统，' +
      '摩尼字母为记录中古伊朗语的辅音，在叙利亚的 22 个字母之外另造了 14 个分音字面。',
    stops: [
      { script: 'aramaic', char: '𐡀', label: '阿拉米 ʾālep', phonetic: 'ʔ' },
      { script: 'palmyrene', char: '𐡠', label: '帕尔米拉 ʾālep', phonetic: 'ʔ' },
      { script: 'hatran', char: '𐣠', label: '哈特拉 ʾālep', phonetic: 'ʔ' },
      { script: 'syriac', char: 'ܐ', label: '叙利亚 ʾālep', phonetic: 'ʔ' },
      { script: 'manichaean', char: '𐫀', label: '摩尼 ʾālep', phonetic: 'ʔ' },
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
    id: 'ethiopic-line',
    nameZh: '古南阿拉伯 alef → 吉兹 hä',
    nameEn: 'Old South Arabian alef → Ethiopic hä',
    mode: 'chain',
    description:
      '古南阿拉伯字母随商路越过红海，在阿克苏姆长成了吉兹字母。字形还能认出南阿拉伯的来路，' +
      '写法却换了一种思路：它不再只记辅音，而是把辅音与元音配成一个音节矩阵——' +
      '一个辅音配上八种元音式，各占一个码位。走到吉兹这一站，字母场只取 26 个辅音的' +
      '第一式（辅音 + ä）：h l ḥ m r s q b t ḫ n ʾ k w ʿ z y d g ṭ ṣ ḍ 接回南阿拉伯的同音格，' +
      'p 在吉兹里擦化成 f；南阿拉伯的 ġ ḏ ṯ ẓ 与 š 没有留下后代，走到这里飞出，' +
      '边音 ś、强音 p̣ 与为外来词添的 p 三个新字母飞入。',
    stops: [
      { script: 'old-south-arabian', char: '𐩱', label: '古南阿拉伯 alef', phonetic: 'ʔ' },
      { script: 'geez', char: 'ሀ', label: '吉兹 hä', phonetic: 'h' },
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
      '中间那一站是圣殿时期犹太人刻在钱币与印章上的古希伯来字母，' +
      '它与腓尼基共用 Unicode U+10900 一节，二十二个字母逐一对应；' +
      '走到撒玛利亚字母，字面才换成圆转的连写体——二十二字位一脉相承，' +
      '元音另外用标号记，不进字母表。',
    stops: [
      { script: 'phoenician', char: '𐤀', label: '腓尼基 ʾālep', phonetic: 'ʔ' },
      { script: 'paleo-hebrew', char: '𐤀', label: '古希伯来 ʾālep', phonetic: 'ʔ' },
      { script: 'samaritan', char: 'ࠀ', label: '撒玛利亚 alaf', phonetic: 'ʔ' },
    ],
  },

  {
    id: 'berber-tifinagh',
    nameZh: '腓尼基 ʾālep → 提非纳 ya',
    nameEn: 'Phoenician ʾālep → Tifinagh ya',
    mode: 'chain',
    description:
      '腓尼基商人在迦太基一带留下的布匿字母，被北非的柏柏尔人借去写自己的语言，' +
      '长成利比亚—古提非纳文。二十世纪，柏柏尔学院把它整理成一套规范字母，' +
      'Unicode 收在 U+2D30 一节的 57 个字形里：第 1 个字母 ⴰ（ya）正接腓尼基的牛头，' +
      'r / ɣ / ʕ 这些骨架也还认得出布匿的来路；而 ə / e / o 这类腓尼基没有的音，' +
      '以及图阿雷格、阿哈加尔等地方字面，走到提非纳这一站时整批飞入。',
    stops: [
      { script: 'phoenician', char: '𐤀', label: '腓尼基 ʾālep', phonetic: 'ʔ' },
      { script: 'tifinagh', char: 'ⴰ', label: '提非纳 ya', phonetic: 'a' },
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
