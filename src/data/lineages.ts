import type { Lineage } from './types';

/**
 * 血统轨道：一条穿越多个书写体系的"同源字位"路径。
 *
 * 只收有文字学依据的传承关系：每条轨道都带 source，说明依据哪份资料
 * （多为 Wikipedia 条目正文或 Unicode 提案的对照表），核对不了的链条一律
 * 不收——宁可少一条，也不拿"长得像"当成"演变成"。
 *
 * 数组顺序 = MICRO 页的标签顺序：字形直系、逐笔能对得上的排前面，
 * 中间隔了几百年或只剩轮廓相似（但有据）的排后面。
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
    id: 'italy',
    nameZh: '希腊 Α → 伊特鲁里亚 → 半岛各家 → 罗马',
    nameEn: 'Greek Α → Etruscan → Old Italic → Latin',
    mode: 'chain',
    source: 'Wikipedia《Etruscan alphabet》《Old Italic scripts》：希腊 → 伊特鲁里亚 → 半岛各家 → 拉丁',
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
    id: 'aleph',
    nameZh: '牛头 → 字母 A',
    nameEn: 'Ox head → A',
    mode: 'chain',
    source: 'Wikipedia《Proto-Sinaitic script》《Phoenician alphabet》：F1 牛头 → ʾalp 的通说',
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
    id: 'arabic-alef',
    nameZh: '阿拉米 ʾālep → 阿拉伯 ا',
    nameEn: "Aramaic ʾālep → Arabic alif",
    mode: 'chain',
    source: 'Wikipedia《Nabataean script》《Arabic alphabet》：阿拉米 → 纳巴泰 → 阿拉伯',
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
    id: 'hebrew-squared',
    nameZh: '阿拉米 ʾālep → 希伯来 alef',
    nameEn: 'Aramaic ʾālep → Hebrew alef',
    mode: 'chain',
    source: 'Wikipedia《Hebrew alphabet》：方形希伯来字母承自阿拉米字母',
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
    source: 'Wikipedia《Samaritan script》《Paleo-Hebrew alphabet》',
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
    id: 'aramaic-mandaic',
    nameZh: '阿拉米 ʾālep → 曼达 a',
    nameEn: 'Aramaic ʾālep → Mandaic a',
    mode: 'chain',
    source: 'Wikipedia《Mandaic alphabet》：承自阿拉米字母',
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
    id: 'aramaic-west',
    nameZh: '阿拉米 ʾālep → 西支诸字母',
    nameEn: 'Aramaic ʾālep → western branches',
    mode: 'cognate',
    source: 'Wikipedia《Palmyrene alphabet》《Hatran alphabet》《Syriac alphabet》《Manichaean alphabet》',
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
    id: 'aramaic-pahlavi',
    nameZh: '阿拉米 ʾālep → 巴列维支系',
    nameEn: 'Aramaic ʾālep → Pahlavi branch',
    mode: 'cognate',
    source: 'Wikipedia《Avestan alphabet》：阿维斯陀字母以巴列维为底，𐬀 近书体巴列维',
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
    source: 'Wikipedia《Parthian script》《Elymaic script》《Chorasmian script》《Sogdian alphabet》',
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
    id: 'silk-road',
    nameZh: '阿拉米 ʾālep → 蒙古 a',
    nameEn: "Aramaic aleph → Mongolian a",
    mode: 'chain',
    source: 'Wikipedia《Sogdian alphabet》《Old Uyghur alphabet》《Mongolian script》',
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
    id: 'cyrillic-line',
    nameZh: '希腊 Α → 西里尔 А',
    nameEn: 'Greek Α → Cyrillic А',
    mode: 'cognate',
    source: 'Wikipedia《Cyrillic script》：以希腊安色尔体为骨架',
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

  {
    id: 'slavic-alphabet',
    nameZh: '希腊 Α → 格拉哥里与西里尔',
    nameEn: 'Greek Α → Glagolitic and Cyrillic',
    mode: 'cognate',
    source: 'Wikipedia《Glagolitic script》《Cyrillic script》',
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
    id: 'greek-diaspora',
    nameZh: '希腊 Α → 科普特与哥特 a',
    nameEn: 'Greek Α → Coptic and Gothic a',
    mode: 'cognate',
    source: 'Wikipedia《Gothic alphabet》（乌尔菲拉以希腊字母为底）、《Coptic alphabet》',
    description:
      '希腊字母往南、往北各留下一支自己的 /a/：' +
      '尼罗河谷用希腊字母记写埃及语，科普特 alfa Ⲁ 直接沿用了希腊的字面；' +
      '四世纪的乌尔菲拉为哥特语造字母，aza 𐌰 也是照希腊 alpha 的骨架立的。' +
      '这一站只收字形上真能对回希腊的两家——亚美尼亚、格鲁吉亚的字母表另有来路，' +
      '不作为希腊 alpha 的后身列在这里。',
    stops: [
      { script: 'greek', char: 'Α', label: '希腊 alpha', phonetic: 'a' },
      { script: 'coptic', char: 'Ⲁ', label: '科普特 alfa', phonetic: 'a' },
      { script: 'gothic', char: '𐌰', label: '哥特 aza', phonetic: 'a' },
    ],
  },

  {
    id: 'anatolian-alpha',
    nameZh: '希腊 alpha → 安纳托利亚 a',
    nameEn: 'Greek alpha → Anatolian a',
    mode: 'cognate',
    source: 'Wikipedia《Lydian alphabet》《Lycian alphabet》《Carian alphabet》：安纳托利亚诸字母源自希腊',
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
    id: 'greek-gothic',
    nameZh: '希腊 Α → 哥特 \u{10330}',
    nameEn: 'Greek \u{0391} \u2192 Gothic \u{10330}',
    mode: 'chain',
    source: 'Wikipedia《Gothic alphabet》：多数字母与希腊字母一一对应（形、音、数值相同）；乌尔菲拉 4 世纪创制',
    description:
      '哥特字母是现存最早为日耳曼语定制的字母表：四世纪时，卡帕多西亚希腊裔主教乌尔菲拉' +
      '为把圣经译成哥特语而造了它，27 个字母排下来，顺序、音值与数字用法都对着希腊字母走。' +
      '大多数哥特字母因此与希腊字母一一对应——alpha 对 a、beta 对 b、gamma 对 g。' +
      '争议在少数几个字：r、s、f 更像拉丁字母，q、h、o 的来路各家说法不一，' +
      '卢恩字母到底有没有参与，学界至今没有定论。这条轨道走的是对应关系最没有疑问的第一对。',
    stops: [
      { script: 'greek', char: '\u{0391}', label: '希腊 alpha', phonetic: 'a' },
      { script: 'gothic', char: '\u{10330}', label: '哥特 a', phonetic: 'a' },
    ],
  },

  {
    id: 'northern-runes',
    nameZh: '古意大利字母 → 卢恩字母',
    nameEn: 'Old Italic → Runic',
    mode: 'chain',
    source: 'Wikipedia《Runic alphabet》：多数意见认为承自古意大利一类字母',
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
    id: 'ethiopic-line',
    nameZh: '古南阿拉伯 alef → 吉兹 hä',
    nameEn: 'Old South Arabian alef → Ethiopic hä',
    mode: 'chain',
    source: 'Wikipedia《Geʽez script》《Ancient South Arabian script》',
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
    id: 'semitic-south',
    nameZh: 'ʾālep → 南方闪米特诸字母',
    nameEn: 'ʾālep → South Semitic alphabets',
    mode: 'cognate',
    source: 'Wikipedia《Ugaritic alphabet》《Ancient South Arabian script》：与腓尼基字母同源并列',
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
    id: 'kana',
    nameZh: '汉字「安」→ 平假名「あ」',
    nameEn: 'Kanji 安 → hiragana あ',
    mode: 'pair',
    source: 'Wikipedia《Hiragana》《Katakana》《Man\'yōgana》：あ 出「安」，ア 出「阿」',
    description:
      '平假名与片假名都从汉字借来：整字的草书一路简省成平假名，' +
      '整字的一个部件截下来当片假名。汉字一列写的是万叶假名给这个音用的借字——' +
      'あ 取「安」、い 取「以」、ア 取「阿」。两套假名的母字并不一致，' +
      '所以这里摆的是平假名「あ」；片假名「ア」与它同占一个音节格，但另有母字，' +
      '不是「あ」变来的。浊音、半浊音是后来在假名上加符号造出来的，走过去时飞入。',
    stops: [
      { script: 'chinese-regular', char: '安', label: '汉字「安」', phonetic: 'an' },
      { script: 'hiragana', char: 'あ', label: '平假名「あ」', phonetic: 'a' },
      { script: 'katakana', char: 'ア', label: '片假名「ア」（母字「阿」）', phonetic: 'a' },
    ],
  },

  {
    id: 'ka',
    nameZh: '婆罗米 ka → 各国 ka',
    nameEn: 'Brahmi ka → modern ka',
    mode: 'cognate',
    source: 'Wikipedia《Brahmi script》及各家现代文字的条目：婆罗米系共同后身',
    description:
      '同一个辅音音节 ka，从公元前三世纪的婆罗米文出发，' +
      '散落到天城文、尼瓦尔文、泰米尔文、藏文、高棉文、泰文、缅文……' +
      '两千三百年后，它们仍共享同一个音值和一个隐约可辨的骨架。',
    stops: [
      { script: 'brahmi', char: '𑀓', label: '婆罗米文', phonetic: 'ka' },
      { script: 'siddham', char: '𑖎', label: '悉昙文', phonetic: 'ka' },
      { script: 'grantha', char: '𑌕', label: '格兰塔文', phonetic: 'ka' },
      { script: 'devanagari', char: 'क', label: '天城文', phonetic: 'ka' },
      { script: 'newa', char: '𑐎', label: '尼瓦尔文', phonetic: 'ka' },
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
    id: 'brahmi-sinhala',
    nameZh: '婆罗米文 \u2192 僧伽罗文',
    nameEn: 'Brahmi \u2192 Sinhala',
    mode: 'chain',
    source: 'Wikipedia《Sinhala script》：僧伽罗文是古印度婆罗米文的后裔，中世纪又与南印度格兰塔文合流',
    description:
      '僧伽罗语是印欧语，却写在印度系字母上——这层关系是公元前三世纪随佛教一起上岛的：' +
      '阿努拉德普勒的陶片与石刻上，婆罗米文被借来记僧伽罗语，此后一千多年里没有断过。' +
      '岛上写字的笔一路圆转下去，到中世纪又受南印度格兰塔文影响，把婆罗米那种方硬的骨架' +
      '改成了一圈圈贴近棕榈叶纹理的弧线。字母表里 ka 的位置从头到尾没动，笔画却已经换了一副样子。',
    stops: [
      { script: 'brahmi', char: '\u{11013}', label: '婆罗米 ka', phonetic: 'ka' },
      { script: 'sinhala', char: '\u{0D9A}', label: '僧伽罗 ka', phonetic: 'ka' },
    ],
  },

  {
    id: 'sharada-branch',
    nameZh: '夏拉达文 a → 塔克里与兰达诸文',
    nameEn: 'Sharada a → Takri and Landa a',
    mode: 'cognate',
    source: 'Wikipedia《Takri script》（「承自夏拉达，与兰达诸文为姊妹」）《Landa script》',
    description:
      '夏拉达文是八世纪克什米尔一带的书体，往下分出塔克里一支与兰达一族。' +
      '塔克里再变出多格拉；霍杰基、胡达瓦迪、穆尔塔尼与马哈贾尼属兰达一族，' +
      '与塔克里并列，不是塔克里的后代。这几家都按梵语字音表排字母，' +
      '所以同一个 ka、同一个 ma 能逐格对上；分野在于各自添的字：' +
      '信德三文（霍杰基、胡达瓦迪、穆尔塔尼）从信德语借来四个内爆音——' +
      'ɓ ɗ ɠ ʄ，写成在基字下加小钩的 ॺ 形；塔克里与多格拉添卷舌边音 ḷa、' +
      '闪音 ṛa，穆尔塔尼再添一个 ṛha，霍杰基借来波斯语的 qa；' +
      '记账体马哈贾尼图快，把 ya 与三个咝音连同 nga 一起丢掉了，' +
      '走到那一站时这四格会消失，下一站又飞回来。',
    stops: [
      { script: 'sharada', char: '𑆃', label: '夏拉达 a', phonetic: 'a' },
      { script: 'takri', char: '𑚀', label: '塔克里 a', phonetic: 'a' },
      { script: 'mahajani', char: '𑅐', label: '马哈贾尼 a', phonetic: 'a' },
      { script: 'dogra', char: '𑠀', label: '多格拉 a', phonetic: 'a' },
      { script: 'khojki', char: '𑈀', label: '霍杰基 a', phonetic: 'a' },
      { script: 'multani', char: '𑊀', label: '穆尔塔尼 a', phonetic: 'a' },
      { script: 'khudawadi', char: '𑊰', label: '胡达瓦迪 a', phonetic: 'a' },
    ],
  },

  {
    id: 'islands-ka',
    nameZh: '卡维 ka → 群岛诸文 ka',
    nameEn: 'Kawi ka → island scripts',
    mode: 'cognate',
    source: 'Wikipedia《Kawi script》（列出巴厘、爪哇、Lontara、Baybayin 等后身）《Lontara script》',
    description:
      '东南亚海岛的这几套字母表，多半从爪哇一带的卡维文散开：' +
      '布吉、巽他、哈努诺、布希德、塔格班瓦、望加锡各自把同一个 ka 写成了不同骨架。' +
      '它们都是元音附标文字，基字自带 a 音，另加符号改写元音；' +
      '菲律宾的哈努诺、布希德、塔格班瓦如今在岛上被重新使用，' +
      '布吉与巽他则仍是各自语言的日常文字。',
    stops: [
      { script: 'kawi', char: '𑼄', label: '卡维文', phonetic: 'ka' },
      { script: 'buginese', char: 'ᨀ', label: '布吉文', phonetic: 'ka' },
      { script: 'sundanese', char: 'ᮊ', label: '巽他文', phonetic: 'ka' },
      { script: 'hanunoo', char: 'ᜣ', label: '哈努诺文', phonetic: 'ka' },
      { script: 'buhid', char: 'ᝃ', label: '布希德文', phonetic: 'ka' },
      { script: 'tagbanwa', char: 'ᝣ', label: '塔格班瓦文', phonetic: 'ka' },
      { script: 'makasar', char: '𑻠', label: '望加锡文', phonetic: 'ka' },
    ],
  },

  {
    id: 'pallava-branch',
    nameZh: '帕拉瓦文 ka → 东南亚诸文 ka',
    nameEn: 'Pallava ka → Southeast Asian ka',
    mode: 'cognate',
    source: 'Wikipedia《Pallava script》《Cham script》：占文「最先从帕拉瓦分出」（约 350 年）',
    description:
      '南印度的帕拉瓦文（帕拉瓦格兰塔）是东南亚多数文字的直系祖先，四世纪起随僧侣、' +
      '学者与商人渡海：同一个 ka，占人、孟人、高棉人、爪哇人与巴厘人各写各的骨架——' +
      '占文与孟文保留南印度式的圆转，高棉文把头部拉出一道竖笔，' +
      '爪哇与巴厘把笔画收进更密的方形结构里。' +
      '同期同出南印度的卡丹巴文不是帕拉瓦的后代：它是另一支，长成了后来的卡纳达与泰卢固文，' +
      '所以这条轨道不收它。帕拉瓦文没有独立字库，首站放的是有登记的字母表图版。',
    stops: [
      { script: 'pallava', image: 'glyphs/pallava/aksharamala.png', label: '帕拉瓦字母表（南印度，7 世纪）' },
      { script: 'cham', char: 'ꨆ', label: '占文 ka', phonetic: 'ka' },
      { script: 'mon', char: 'က', label: '孟文 ka', phonetic: 'ka' },
      { script: 'khmer', char: 'ក', label: '高棉文 ka', phonetic: 'ka' },
      { script: 'java', char: 'ꦏ', label: '爪哇文 ka', phonetic: 'ka' },
      { script: 'balinese', char: 'ᬓ', label: '巴厘文 ka', phonetic: 'ka' },
    ],
  },

  {
    id: 'grantha-malayalam',
    nameZh: '帕拉瓦文 \u2192 格兰塔文 \u2192 马拉雅拉姆文',
    nameEn: 'Pallava \u2192 Grantha \u2192 Malayalam',
    mode: 'chain',
    source: 'Wikipedia《Grantha script》：格兰塔出自帕拉瓦文，「现代马拉雅拉姆文是格兰塔文的直系后裔」',
    description:
      '喀拉拉这一支是南印度字母最清楚的一段传承：帕拉瓦文先分出一支格兰塔文，' +
      '专用来写梵语；八九世纪，东海岸的格兰塔字母被带到马拉巴尔海岸，' +
      '在长期与东海岸往来不便的处境里独自长开，成了当地人说的「雅利安字」（Arya-eḻuttu）。' +
      '它原本只为写梵语，缺马拉雅拉姆语要用的 ḷa、ḻa、ṟa，这几个字从本地的瓦特卢图文补进来；' +
      '十九世纪中叶，传教士格温特又补上长短 e、o 的分别，才是今天这副样子。' +
      '字母表上 ka 到 nga 一排排对得严丝合缝，正是这段关系的底气。',
    stops: [
      { script: 'pallava', image: 'glyphs/pallava/aksharamala.png', label: '帕拉瓦字母表（南印度，7 世纪）' },
      { script: 'grantha', char: '\u{11315}', label: '格兰塔 ka', phonetic: 'ka' },
      { script: 'malayalam', char: '\u{0D15}', label: '马拉雅拉姆 ka', phonetic: 'ka' },
    ],
  },

  {
    id: 'chinese-evolution',
    nameZh: '甲骨文 → 小篆 → 隶书 → 楷书',
    nameEn: 'Oracle bone → seal → clerical → regular',
    mode: 'chain',
    source: '汉字通行流变：甲骨文 → 小篆 → 隶书 → 楷书',
    description:
      '汉字三千多年的主线，用一个「日」字走一遍：商代刻在龟甲兽骨上的甲骨文，' +
      '笔画瘦硬、象形直白；秦统一文字后的小篆把字形拉长、线条匀圆；' +
      '隶书把圆转改写成方折，横画末尾带一波磔，方块结构就在这一步定型；' +
      '楷书再磨平波磔，成为沿用至今的标准体。隶书没有授权明确、字形可靠的' +
      '字库，这一站放的是东汉《裴岑碑》拓本，不用现代字体顶替。',
    stops: [
      { script: 'chinese-oracle', char: '日', label: '甲骨文「日」', phonetic: 'ri' },
      { script: 'chinese-seal', char: '日', label: '小篆「日」', phonetic: 'ri' },
      {
        script: 'chinese-clerical',
        image: 'glyphs/chinese-clerical/peicen-stele-rubbing.jpg',
        label: '隶书（东汉《裴岑碑》拓本）',
      },
      { script: 'chinese-regular', char: '日', label: '楷书「日」', phonetic: 'ri' },
    ],
  },

  {
    id: 'egypt-cursive',
    nameZh: '圣书体 → 僧侣体 → 世俗体 → 科普特',
    nameEn: 'Hieroglyphs → hieratic → demotic → Coptic',
    mode: 'chain',
    source: 'Wikipedia《Coptic alphabet》字母表：šay 一栏列出圣书体 → 僧侣体 → 世俗体 → Ϣ',
    description:
      '同一套埃及语，写了四千年的三种面孔：刻在神庙与墓碑上的圣书体，' +
      '祭司用芦苇笔写在纸草上的僧侣体，以及更晚、更潦草也更日常的世俗体。' +
      '公元前后改用希腊字母记写埃及语，希腊字母表没有的音另从世俗体借了七个字面。' +
      '这条轨道走其中第一个：科普特 Ϣ 从圣书体的 S29「折叠布」经僧侣体、世俗体一路收束而来。' +
      '僧侣体与世俗体没有独立的 Unicode 编码，也没有可靠的开源字库，' +
      '两站放的是同期纸草的实物图版，不用现代字体顶替。',
    stops: [
      { script: 'egyptian', char: '𓋴', label: '圣书体「折叠布」（S29）', phonetic: 's' },
      {
        script: 'hieratic',
        image: 'glyphs/hieratic/edwin-smith-papyrus.jpg',
        label: '僧侣体（《艾德温·史密斯纸草》）',
      },
      {
        script: 'demotic',
        image: 'glyphs/demotic/turin-payment-contracts.jpg',
        label: '世俗体（都灵纸草）',
      },
      { script: 'coptic', char: 'Ϣ', label: '科普特 šay（世俗体来）', phonetic: 'ʃ' },
    ],
  },

  {
    id: 'meroitic-line',
    nameZh: '圣书体 → 麦罗埃文',
    nameEn: 'Egyptian → Meroitic',
    mode: 'chain',
    source: 'Unicode 麦罗埃文提案 L2/09-250（N3665）字形对照表：𐦀 ← 𓀀（A1）',
    description:
      '尼罗河上游的库施王国把埃及圣书体的符号借来，简化成一套自己的音节文字：' +
      '碑铭体刻在神庙与石碑上，草书体写在纸草与陶片上。这条轨道走麦罗埃字母表的第 1 个字母，' +
      'Unicode 的麦罗埃提案把碑铭体 a（𐦀）直接对到圣书体的 A1「人」（𓀀）——' +
      '借的是埃及的符号，读的却是麦罗埃语的 /a/。' +
      '麦罗埃文是撒哈拉以南非洲最早的本地书写体系之一，至今没有完全读通，' +
      '已知的音值主要靠与埃及文对照。',
    stops: [
      { script: 'egyptian', char: '𓀀', label: '圣书体「人」（A1）', phonetic: 'a' },
      { script: 'meroitic', char: '𐦀', label: '麦罗埃碑铭体', phonetic: 'a' },
      { script: 'meroitic-cursive', char: '𐦠', label: '麦罗埃草书体', phonetic: 'a' },
    ],
  },

  {
    id: 'aegean-line',
    nameZh: '克里特象形文字 → 线形文字 A → 线形文字 B → 塞浦路斯',
    nameEn: 'Cretan hieroglyphs → Linear A → Linear B → Cypriot',
    mode: 'chain',
    source: 'Wikipedia《Linear A》《Linear B》《Cypriot syllabary》：A／B 两系 AB 08 的轮廓可对合',
    description:
      '爱琴海是字母表之外另一处独立发明文字的地方。克里特岛上的克里特象形文字' +
      '（约公元前两千年）往下派生出线形文字 A，米诺斯人用它记账；' +
      '迈锡尼人把这套符号借去写希腊语，就是线形文字 B——' +
      '它 1952 年被文特里斯破读，是这批文字里唯一留下可读文本的一支。' +
      '同一个元音 a，线形文字 A 记作 AB 08、线形文字 B 记作 B 08，' +
      '两边的字形到今天仍能严丝合缝地叠在一起（两支字库的轮廓可以直接对合）。' +
      '末站塞浦路斯音节文字走的是另一条支流：线形文字 A 传到塞浦路斯先成了' +
      '塞浦路斯-米诺斯文，再演成这套音节文字，一直用到古典时代，' +
      '同一个 a 到那边已经改写成星形的骨架。' +
      '克里特象形文字至今没有可用的字库，那一站放的是克诺索斯出土的印章实物。',
    stops: [
      {
        script: 'rethra',
        image: 'glyphs/rethra/knossos-144883.jpg',
        label: '克里特象形文字（克诺索斯印章，约前 2100—1700 年）',
      },
      { script: 'linear-a', char: '𐘇', label: '线形文字 A（AB 08）', phonetic: 'a' },
      { script: 'linear-b', char: '𐀀', label: '线形文字 B（B 08 a）', phonetic: 'a' },
      { script: 'cypriot', char: '𐠀', label: '塞浦路斯音节文字 a', phonetic: 'a' },
    ],
  },
]
