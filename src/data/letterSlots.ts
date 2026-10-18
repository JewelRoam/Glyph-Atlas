/**
 * 字母槽位表 —— 让不同文字的"同一个字母"能对上号。
 *
 * MICRO 的字母场要把一整套字母表从一种文字变形到另一种文字。前提是知道
 * "谁是谁的后代"：𐤀 (ʾālep) 对应希腊 Α、拉丁 A；而不是按下标把第 1 个
 * 对第 1 个——希腊 Γ 表面上挨着拉丁 C，其实 C 对应的是 Γ，而拉丁 F 对应的是
 * 希腊 Ϝ 而不是 Ζ。按 Unicode 顺序硬对会写出错误的谱系，所以对应关系必须
 * 手工给出，落在下面这张表里。
 *
 * 结构：
 *  · SLOTS    —— 槽位的全局顺序（字母场的格子顺序按它排，跨文字保持稳定）；
 *  · letterMaps —— 文字 → (槽位 → 该文字里代表这个槽位的字符)。
 *
 * 三种特殊写法：
 *  · 同一个字符可以出现在两个槽位里，用来表示"一个祖形分出两支"。
 *    例如腓尼基 𐤅 (wāw) 同时进 waw 槽（→ 希腊 Υ → 拉丁 V）和 digamma 槽
 *    （→ 希腊 Ϝ → 拉丁 F）。字母场里它就会出现两次，各自变形成后代。
 *  · 两个槽位也可以指向同一个字符，表示两支合流成一个字形——哈特拉字母的
 *    d 与 r 就是这样（Unicode 名就叫 DALETH-RESH）。走到它的时候两格会
 *    收成同一种笔画。
 *  · 后起的字母（希腊 Φ，罗马 G，阿拉伯 ث）单独占一个槽位。它们在字母场里
 *    没有祖先格，移动到相邻文字时按"新增"处理，飞入/飞出。
 *
 * 已建表的书写体系：
 *  · 西闪米特：腓尼基、阿拉米、纳巴泰、希伯来、叙利亚、撒玛利亚、曼达、
 *    帕尔米拉、哈特拉、阿拉伯；
 *  · 希腊—罗马：希腊、拉丁；
 *  · 希腊的东支：科普特、西里尔；
 *  · 希腊的两条支流：哥特（斯堪的纳维亚—黑海）、格拉哥里（斯拉夫）；
 *  · 阿拉米东支：粟特、回鹘、碑铭巴列维、诗篇巴列维。
 *
 * 暂不收录：拉丁 J / U / W。它们是中世纪以后从 I / V 分出来的，
 * 与希腊字母不是一对一的对应关系，放进对照表反而会误导，故排除。
 */

export interface LetterSlot {
  id: string;
  /** 槽位名（中文 + 转写），鼠标悬停时显示 */
  label: string;
}

/**
 * 槽位的全局顺序：先闪米特 22 个祖形，再希腊—罗马的后起字母，
 * 最后是科普特与西里尔各自新立的字母。格子只按这个顺序排，
 * 具体某一段字母场里出现哪几格，由两端文字的对照表取并集决定。
 */
export const SLOTS: LetterSlot[] = [
  { id: 'aleph', label: '牛头 ʾālep' },
  { id: 'beth', label: '房子 bēt' },
  { id: 'vede', label: 'в / В（与 б 同出希腊 Β，斯拉夫分写）' },
  { id: 'gimel', label: '骆驼 gīml' },
  { id: 'daleth', label: '门 dālet' },
  { id: 'dhal', label: 'ذ（د 加点）' },
  { id: 'he', label: '窗 hē' },
  { id: 'zhe', label: 'ж / Ж（斯拉夫新造）' },
  { id: 'waw', label: '钩 wāw' },
  { id: 'zayin', label: '武器 zayin' },
  { id: 'heth', label: '篱笆 ḥēt' },
  { id: 'kha', label: 'خ（ح 加点）' },
  { id: 'teth', label: '轮 ṭēt' },
  { id: 'zah', label: 'ظ（ط 加点）' },
  { id: 'yodh', label: '手 yōd' },
  { id: 'kaph', label: '掌心 kāp' },
  { id: 'lamedh', label: '赶牛棒 lāmed' },
  { id: 'mem', label: '水 mēm' },
  { id: 'nun', label: '鱼 nūn' },
  { id: 'samekh', label: '支柱 sāmek' },
  { id: 'ayin', label: '眼睛 ʿayin' },
  { id: 'ghayn', label: 'غ（ع 加点）' },
  { id: 'pe', label: '嘴 pē' },
  { id: 'sadhe', label: '弓 ṣādē' },
  { id: 'dad', label: 'ض（ص 加点）' },
  { id: 'qoph', label: 'qōp' },
  { id: 'resh', label: '头 rēš' },
  { id: 'shin', label: '牙 šīn' },
  { id: 'taw', label: '记号 tāw' },
  { id: 'tha', label: 'ث（ت 加点）' },
  // 粟特在阿拉米之上分出的两个擦音字母：feth 由 pē 分化，leš 表示 ž；
  // 回鹘只继承了 leš。只出现在这两家的字母场里，别的对照表不建这一格。
  { id: 'feth', label: '𐽃 feth（粟特由 pē 分出的擦音）' },
  { id: 'lesh', label: '𐽄 leš（粟特/回鹘的 ž）' },
  { id: 'digamma', label: 'Ϝ / F（wāw 的另一支）' },
  { id: 'upsilon', label: 'Y（借自希腊 Υ）' },
  { id: 'phi', label: 'Φ（希腊新造）' },
  { id: 'chi', label: 'Χ / X（希腊新造）' },
  { id: 'psi', label: 'Ψ（希腊新造）' },
  { id: 'omega', label: 'Ω（希腊新造）' },
  // 科普特从世俗体借来的七个字母，排在希腊字母之后
  { id: 'shei', label: 'Ϣ šai（源自世俗体）' },
  { id: 'fei', label: 'Ϥ fai（源自世俗体）' },
  { id: 'khei', label: 'Ϧ ḫai（源自世俗体）' },
  { id: 'hori', label: 'Ϩ hori（源自世俗体）' },
  { id: 'gangia', label: 'Ϫ ḏanja（源自世俗体）' },
  { id: 'shima', label: 'Ϭ čima（源自世俗体）' },
  { id: 'dei', label: 'Ϯ dei（源自世俗体）' },
  // 西里尔为斯拉夫语音位另立的字母：希腊字母表里没有对应项
  { id: 'tse', label: 'ц / Ц' },
  { id: 'che', label: 'ч / Ч' },
  { id: 'sha', label: 'ш / Ш' },
  { id: 'shcha', label: 'щ / Щ' },
  { id: 'er', label: 'ъ（硬符号）' },
  { id: 'ery', label: 'ы' },
  { id: 'erj', label: 'ь（软符号）' },
  { id: 'jat', label: 'ѣ / Ѣ' },
  { id: 'yu', label: 'ю / Ю' },
  { id: 'ya', label: 'Ꙗ / Я（iotated a）' },
  { id: 'ye', label: 'ѥ / Ѥ' },
  { id: 'yus-small', label: 'ѧ / Ѧ（小尤斯）' },
  { id: 'yus-big', label: 'ѫ / Ѫ（大尤斯）' },
  { id: 'yus-iot-small', label: 'ѩ / Ѩ（iotated 小尤斯）' },
  { id: 'yus-iot-big', label: 'ѭ / Ѭ（iotated 大尤斯）' },
  { id: 'izhitsa', label: 'ѵ / Ѵ（希腊 Υ，借词用）' },
  { id: 'gai', label: 'G（罗马新造，由 C 分化）' },
];

/** 文字的字母表顺序 → 槽位。键是槽位 id，值是这一文字里的字符。 */
export const letterMaps: Record<string, Record<string, string>> = {
  // 腓尼基字母：22 个，全部是字母表里的祖形
  phoenician: {
    aleph: '𐤀',
    beth: '𐤁',
    gimel: '𐤂',
    daleth: '𐤃',
    he: '𐤄',
    // 𐤅 同时是 Υ 与 Ϝ 的祖先，所以在两个槽位里各出现一次
    waw: '𐤅',
    digamma: '𐤅',
    zayin: '𐤆',
    heth: '𐤇',
    teth: '𐤈',
    yodh: '𐤉',
    kaph: '𐤊',
    lamedh: '𐤋',
    mem: '𐤌',
    nun: '𐤍',
    samekh: '𐤎',
    ayin: '𐤏',
    pe: '𐤐',
    sadhe: '𐤑',
    qoph: '𐤒',
    resh: '𐤓',
    shin: '𐤔',
    taw: '𐤕',
  },

  // 阿拉米字母：与腓尼基同序，字面已经开始连写化
  aramaic: {
    aleph: '𐡀',
    beth: '𐡁',
    gimel: '𐡂',
    daleth: '𐡃',
    he: '𐡄',
    waw: '𐡅',
    digamma: '𐡅',
    zayin: '𐡆',
    heth: '𐡇',
    teth: '𐡈',
    yodh: '𐡉',
    kaph: '𐡊',
    lamedh: '𐡋',
    mem: '𐡌',
    nun: '𐡍',
    samekh: '𐡎',
    ayin: '𐡏',
    pe: '𐡐',
    sadhe: '𐡑',
    qoph: '𐡒',
    resh: '𐡓',
    shin: '𐡔',
    taw: '𐡕',
  },

  // 纳巴泰字母：Unicode 把词尾形与基本形分开编码，字母场只取基本形
  nabataean: {
    aleph: '𐢁',
    beth: '𐢃',
    gimel: '𐢄',
    daleth: '𐢅',
    he: '𐢇',
    waw: '𐢈',
    digamma: '𐢈',
    zayin: '𐢉',
    heth: '𐢊',
    teth: '𐢋',
    yodh: '𐢍',
    kaph: '𐢏',
    lamedh: '𐢑',
    mem: '𐢓',
    nun: '𐢕',
    samekh: '𐢖',
    ayin: '𐢗',
    pe: '𐢘',
    sadhe: '𐢙',
    qoph: '𐢚',
    resh: '𐢛',
    shin: '𐢝',
    taw: '𐢞',
  },

  // 希伯来字母：今用的方形体承自阿拉米，排序与音值照传统的 abjad 不变
  hebrew: {
    aleph: 'א',
    beth: 'ב',
    gimel: 'ג',
    daleth: 'ד',
    he: 'ה',
    waw: 'ו',
    digamma: 'ו',
    zayin: 'ז',
    heth: 'ח',
    teth: 'ט',
    yodh: 'י',
    kaph: 'כ',
    lamedh: 'ל',
    mem: 'מ',
    nun: 'נ',
    samekh: 'ס',
    ayin: 'ע',
    pe: 'פ',
    sadhe: 'צ',
    qoph: 'ק',
    resh: 'ר',
    shin: 'ש',
    taw: 'ת',
  },

  // 叙利亚字母：22 个字母与阿拉米一一对应；这里取孤立形（词首、词中、词尾
  // 还有各自的连写形，那是同一字母的变体，不进对照表）
  syriac: {
    aleph: 'ܐ',
    beth: 'ܒ',
    gimel: 'ܓ',
    daleth: 'ܕ',
    he: 'ܗ',
    waw: 'ܘ',
    digamma: 'ܘ',
    zayin: 'ܙ',
    heth: 'ܚ',
    teth: 'ܛ',
    yodh: 'ܝ',
    kaph: 'ܟ',
    lamedh: 'ܠ',
    mem: 'ܡ',
    nun: 'ܢ',
    samekh: 'ܣ',
    ayin: 'ܥ',
    pe: 'ܦ',
    sadhe: 'ܨ',
    qoph: 'ܩ',
    resh: 'ܪ',
    shin: 'ܫ',
    taw: 'ܬ',
  },

  // 撒玛利亚字母：古希伯来字母在撒玛利亚社群里的延续，至今用于《撒玛利亚五经》。
  // 字母名（alaf、bit、gaman、dalat、iy、baa…）与希伯来传统一一对应
  samaritan: {
    aleph: 'ࠀ',
    beth: 'ࠁ',
    gimel: 'ࠂ',
    daleth: 'ࠃ',
    he: 'ࠄ',
    waw: 'ࠅ',
    digamma: 'ࠅ',
    zayin: 'ࠆ',
    heth: 'ࠇ',
    teth: 'ࠈ',
    yodh: 'ࠉ',
    kaph: 'ࠊ',
    lamedh: 'ࠋ',
    mem: 'ࠌ',
    nun: 'ࠍ',
    samekh: 'ࠎ',
    ayin: 'ࠏ',
    pe: 'ࠐ',
    sadhe: 'ࠑ',
    qoph: 'ࠒ',
    resh: 'ࠓ',
    shin: 'ࠔ',
    taw: 'ࠕ',
  },

  // 曼达字母：名称为 halqa、ab、ag、ad、ah、ushenna、az、it、att、aksa、ak…
  // 编码提案把它们按字母表顺序排列，也就是西闪米特 abjad 的常规顺序
  mandaic: {
    aleph: 'ࡀ',
    beth: 'ࡁ',
    gimel: 'ࡂ',
    daleth: 'ࡃ',
    he: 'ࡄ',
    waw: 'ࡅ',
    digamma: 'ࡅ',
    zayin: 'ࡆ',
    heth: 'ࡇ',
    teth: 'ࡈ',
    yodh: 'ࡉ',
    kaph: 'ࡊ',
    lamedh: 'ࡋ',
    mem: 'ࡌ',
    nun: 'ࡍ',
    samekh: 'ࡎ',
    ayin: 'ࡏ',
    pe: 'ࡐ',
    sadhe: 'ࡑ',
    qoph: 'ࡒ',
    resh: 'ࡓ',
    shin: 'ࡔ',
    taw: 'ࡕ',
  },

  // 帕尔米拉字母：Unicode 把词尾 nun 单列一个码位，对照表只取基本形 𐡮
  palmyrene: {
    aleph: '𐡠',
    beth: '𐡡',
    gimel: '𐡢',
    daleth: '𐡣',
    he: '𐡤',
    waw: '𐡥',
    digamma: '𐡥',
    zayin: '𐡦',
    heth: '𐡧',
    teth: '𐡨',
    yodh: '𐡩',
    kaph: '𐡪',
    lamedh: '𐡫',
    mem: '𐡬',
    nun: '𐡮',
    samekh: '𐡯',
    ayin: '𐡰',
    pe: '𐡱',
    sadhe: '𐡲',
    qoph: '𐡳',
    resh: '𐡴',
    shin: '𐡵',
    taw: '𐡶',
  },

  // 哈特拉字母：d 与 r 在石碑上已经合流，Unicode 也只有一个字符 DALETH-RESH
  // (U+108E3)。所以 d、r 两个槽位放同一个字符——字形合并也是演变的一种。
  hatran: {
    aleph: '𐣠',
    beth: '𐣡',
    gimel: '𐣢',
    daleth: '𐣣',
    he: '𐣤',
    waw: '𐣥',
    digamma: '𐣥',
    zayin: '𐣦',
    heth: '𐣧',
    teth: '𐣨',
    yodh: '𐣩',
    kaph: '𐣪',
    lamedh: '𐣫',
    mem: '𐣬',
    nun: '𐣭',
    samekh: '𐣮',
    ayin: '𐣯',
    pe: '𐣰',
    sadhe: '𐣱',
    qoph: '𐣲',
    resh: '𐣣',
    shin: '𐣴',
    taw: '𐣵',
  },

  // 阿拉伯字母：22 个承自阿拉米，另加 6 个用加点分出来的新字母
  arabic: {
    aleph: 'ا',
    beth: 'ب',
    gimel: 'ج',
    daleth: 'د',
    dhal: 'ذ',
    he: 'ه',
    waw: 'و',
    zayin: 'ز',
    heth: 'ح',
    kha: 'خ',
    teth: 'ط',
    zah: 'ظ',
    yodh: 'ي',
    kaph: 'ك',
    lamedh: 'ل',
    mem: 'م',
    nun: 'ن',
    samekh: 'س',
    ayin: 'ع',
    ghayn: 'غ',
    pe: 'ف',
    sadhe: 'ص',
    dad: 'ض',
    qoph: 'ق',
    resh: 'ر',
    shin: 'ش',
    taw: 'ت',
    tha: 'ث',
  },

  // 希腊字母：24 个古典字母 + 3 个早期废弃字母（Ϝ Ϙ Ϻ）
  // 科普特字母：前 24 个直接照搬希腊，末尾 7 个取自埃及世俗体的符号。
  // 希腊 Υ 在希腊那一行落在 waw 槽，所以科普特 Ⲩ 也进 waw 槽，两边的 Υ 才对得上。
  coptic: {
    aleph: 'Ⲁ',
    beth: 'Ⲃ',
    gimel: 'Ⲅ',
    daleth: 'Ⲇ',
    he: 'Ⲉ',
    // Ⲋ 是希腊 Ϝ（digamma）的数字 6 之位，音值已变成 /s/
    digamma: 'Ⲋ',
    zayin: 'Ⲍ',
    // Ⲏ 就是希腊 Η
    heth: 'Ⲏ',
    teth: 'Ⲑ',
    yodh: 'Ⲓ',
    kaph: 'Ⲕ',
    lamedh: 'Ⲗ',
    mem: 'Ⲙ',
    nun: 'Ⲛ',
    samekh: 'Ⲝ',
    ayin: 'Ⲟ',
    pe: 'Ⲡ',
    resh: 'Ⲣ',
    shin: 'Ⲥ',
    taw: 'Ⲧ',
    waw: 'Ⲩ',
    phi: 'Ⲫ',
    chi: 'Ⲭ',
    psi: 'Ⲯ',
    omega: 'Ⲱ',
    shei: 'Ϣ',
    fei: 'Ϥ',
    khei: 'Ϧ',
    hori: 'Ϩ',
    gangia: 'Ϫ',
    shima: 'Ϭ',
    dei: 'Ϯ',
  },

  // 西里尔字母：以希腊安色尔体为骨架，24 个希腊字母大多原样搬了过来。
  // 数字值能对上希腊的，就直接进那个槽：И 是 8（Η）、Ѕ 是 6（Ϝ/Ϛ）、
  // У 是 400（Υ）、Ф 500（Φ）、Х 600（Χ）、Ѯ 60（Ξ）、Ѱ 700（Ψ）、
  // Ѳ 9（Θ）、Ѡ 800（Ω）。斯拉夫语特有的音另立新字，飞入而不假装有希腊祖形。
  cyrillic: {
    aleph: 'А',
    beth: 'Б',
    vede: 'В',
    gimel: 'Г',
    daleth: 'Д',
    he: 'Е',
    zhe: 'Ж',
    digamma: 'Ѕ',
    zayin: 'З',
    heth: 'И',
    yodh: 'І',
    kaph: 'К',
    lamedh: 'Л',
    mem: 'М',
    nun: 'Н',
    ayin: 'О',
    pe: 'П',
    resh: 'Р',
    shin: 'С',
    taw: 'Т',
    waw: 'У',
    phi: 'Ф',
    chi: 'Х',
    omega: 'Ѡ',
    teth: 'Ѳ',
    samekh: 'Ѯ',
    psi: 'Ѱ',
    tse: 'Ц',
    che: 'Ч',
    sha: 'Ш',
    shcha: 'Щ',
    er: 'Ъ',
    ery: 'Ы',
    erj: 'Ь',
    jat: 'Ѣ',
    yu: 'Ю',
    ya: 'Ꙗ',
    ye: 'Ѥ',
    'yus-small': 'Ѧ',
    'yus-big': 'Ѫ',
    'yus-iot-small': 'Ѩ',
    'yus-iot-big': 'Ѭ',
    izhitsa: 'Ѵ',
  },

  greek: {
    aleph: 'Α',
    beth: 'Β',
    gimel: 'Γ',
    daleth: 'Δ',
    he: 'Ε',
    waw: 'Υ',
    digamma: 'Ϝ',
    zayin: 'Ζ',
    heth: 'Η',
    teth: 'Θ',
    yodh: 'Ι',
    kaph: 'Κ',
    lamedh: 'Λ',
    mem: 'Μ',
    nun: 'Ν',
    samekh: 'Ξ',
    ayin: 'Ο',
    pe: 'Π',
    sadhe: 'Ϻ',
    qoph: 'Ϙ',
    resh: 'Ρ',
    shin: 'Σ',
    taw: 'Τ',
    phi: 'Φ',
    chi: 'Χ',
    psi: 'Ψ',
    omega: 'Ω',
  },

  // 拉丁字母：古罗马的 23 个字母（J / U / W 见文件头说明）
  latin: {
    aleph: 'A',
    beth: 'B',
    gimel: 'C',
    gai: 'G',
    daleth: 'D',
    he: 'E',
    waw: 'V',
    digamma: 'F',
    zayin: 'Z',
    heth: 'H',
    yodh: 'I',
    kaph: 'K',
    lamedh: 'L',
    mem: 'M',
    nun: 'N',
    ayin: 'O',
    pe: 'P',
    qoph: 'Q',
    resh: 'R',
    shin: 'S',
    taw: 'T',
    chi: 'X',
    upsilon: 'Y',
  },

  // 哥特字母：乌尔菲拉（4 世纪）以希腊安色尔体为骨架，给哥特语补了几个字母。
  // 对照表按"数码"排：哥特字母的数值序列（1 2 3 4 5 6 7 8 9 10 20 … 800）
  // 照抄希腊，所以数值相同的两格就是同一段血统。90 位（希腊 Ϙ）哥特没有造字，
  // 走到这一格时会看到 Ϙ 消失。
  gothic: {
    aleph: '𐌰',
    beth: '𐌱',
    gimel: '𐌲',
    daleth: '𐌳',
    he: '𐌴',
    digamma: '𐌵',
    zayin: '𐌶',
    heth: '𐌷',
    teth: '𐌸',
    yodh: '𐌹',
    kaph: '𐌺',
    lamedh: '𐌻',
    mem: '𐌼',
    nun: '𐌽',
    samekh: '𐌾',
    ayin: '𐌿',
    pe: '𐍀',
    resh: '𐍂',
    shin: '𐍃',
    taw: '𐍄',
    waw: '𐍅',
    phi: '𐍆',
    chi: '𐍇',
    psi: '𐍈',
    omega: '𐍉',
  },

  // 格拉哥里字母：康斯坦丁（西里尔）863 年为斯拉夫语创制，字形全新，
  // 字母的次序与音值却照着希腊排。对照表按音值与西里尔一栏对齐，
  // 于是"希腊 → 格拉哥里 → 西里尔"这条轨道上每一格都是同一段血统。
  // 不列 Ⰺ Ⰻ Ⰼ Ⱊ Ⱒ Ⱕ Ⱖ Ⱜ Ⱝ：这一批是格拉哥里自有或来源尚有争议的字母，
  // 强行塞进希腊的槽位反而会编出一段不存在的关系。
  glagolitic: {
    aleph: 'Ⰰ',
    beth: 'Ⰱ',
    vede: 'Ⰲ',
    gimel: 'Ⰳ',
    daleth: 'Ⰴ',
    he: 'Ⰵ',
    zhe: 'Ⰶ',
    // Ⰷ dzělo 与西里尔 Ѕ 同源，占希腊 Ϝ（数字 6）那一格
    digamma: 'Ⰷ',
    zayin: 'Ⰸ',
    yodh: 'Ⰹ',
    kaph: 'Ⰽ',
    lamedh: 'Ⰾ',
    mem: 'Ⰿ',
    nun: 'Ⱀ',
    ayin: 'Ⱁ',
    pe: 'Ⱂ',
    resh: 'Ⱃ',
    shin: 'Ⱄ',
    taw: 'Ⱅ',
    waw: 'Ⱆ',
    phi: 'Ⱇ',
    chi: 'Ⱈ',
    omega: 'Ⱉ',
    tse: 'Ⱌ',
    che: 'Ⱍ',
    sha: 'Ⱎ',
    shcha: 'Ⱋ',
    er: 'Ⱏ',
    erj: 'Ⱐ',
    jat: 'Ⱑ',
    yu: 'Ⱓ',
    'yus-small': 'Ⱔ',
    'yus-big': 'Ⱘ',
    'yus-iot-small': 'Ⱗ',
    'yus-iot-big': 'Ⱙ',
    teth: 'Ⱚ',
    izhitsa: 'Ⱛ',
  },

  // 粟特字母：阿拉米字母随丝路东传后留下的直系后代，22 个字母与阿拉米一一对应。
  // 𐽀 是 resh 与 ayin 合流后的写法，所以只占 resh 一格；𐽃 feth 与 𐽄 leš 是
  // 粟特自己在阿拉米之上分出的擦音字母，另立两格。𐽅 是 š 的独立形（词尾写法），
  // 与叙利亚字母的处理一样，同一字母只取一个字形，不进对照表。
  sogdian: {
    aleph: '𐼰',
    beth: '𐼱',
    gimel: '𐼲',
    he: '𐼳',
    waw: '𐼴',
    digamma: '𐼴',
    zayin: '𐼵',
    heth: '𐼶',
    yodh: '𐼷',
    kaph: '𐼸',
    lamedh: '𐼹',
    mem: '𐼺',
    nun: '𐼻',
    samekh: '𐼼',
    ayin: '𐼽',
    pe: '𐼾',
    sadhe: '𐼿',
    resh: '𐽀',
    shin: '𐽁',
    taw: '𐽂',
    feth: '𐽃',
    lesh: '𐽄',
  },

  // 回鹘字母：从粟特字母继承，字母数少了一截——he、heth、teth、ayin、qoph 都在
  // 回鹘语里消失，g 与 h 并成一个字形。Unicode 把 g/h 合体写作 GIMEL-HETH
  // (U+10F72)，另有词尾专用的 FINAL HETH (U+10F75)；对照表里 g 与 h 都取
  // GIMEL-HETH，因为那正是回鹘人写这个字母时用的形体（同一字符占两格，
  // 与哈特拉字母 d/r 的处理相同）。
  'old-uyghur': {
    aleph: '𐽰',
    beth: '𐽱',
    gimel: '𐽲',
    waw: '𐽳',
    digamma: '𐽳',
    zayin: '𐽴',
    heth: '𐽲',
    yodh: '𐽶',
    kaph: '𐽷',
    lamedh: '𐽸',
    mem: '𐽹',
    nun: '𐽺',
    samekh: '𐽻',
    pe: '𐽼',
    sadhe: '𐽽',
    resh: '𐽾',
    shin: '𐽿',
    taw: '𐾀',
    lesh: '𐾁',
  },

  // 碑铭巴列维字母：阿拉米字母在伊朗高原收窄成 19 形，waw/ayin/resh 三个字母
  // 在石碑上写同一个字，mem 与 qoph 也合流；teth 在巴列维里已经不用。
  // 于是它的字母场里能看到多格收成同一笔画的"合流"，以及 teth 的消失。
  'inscriptional-pahlavi': {
    aleph: '𐭠',
    beth: '𐭡',
    gimel: '𐭢',
    daleth: '𐭣',
    he: '𐭤',
    waw: '𐭥',
    digamma: '𐭥',
    ayin: '𐭥',
    resh: '𐭥',
    zayin: '𐭦',
    heth: '𐭧',
    teth: '𐭨',
    yodh: '𐭩',
    kaph: '𐭪',
    lamedh: '𐭫',
    mem: '𐭬',
    qoph: '𐭬',
    nun: '𐭭',
    samekh: '𐭮',
    pe: '𐭯',
    sadhe: '𐭰',
    shin: '𐭱',
    taw: '𐭲',
  },

  // 诗篇巴列维字母：碑铭体的草写体，字母表几乎照旧，只是 teth 一格空了。
  'psalter-pahlavi': {
    aleph: '𐮀',
    beth: '𐮁',
    gimel: '𐮂',
    daleth: '𐮃',
    he: '𐮄',
    waw: '𐮅',
    digamma: '𐮅',
    ayin: '𐮅',
    resh: '𐮅',
    zayin: '𐮆',
    heth: '𐮇',
    yodh: '𐮈',
    kaph: '𐮉',
    lamedh: '𐮊',
    mem: '𐮋',
    qoph: '𐮋',
    nun: '𐮌',
    samekh: '𐮍',
    pe: '𐮎',
    sadhe: '𐮏',
    shin: '𐮐',
    taw: '𐮑',
  },
};

/** 槽位在字母场格子里的固定次序 */
const slotIndex = new Map(SLOTS.map((slot, i) => [slot.id, i]));

/** 某个文字有没有字母槽位表 */
export function hasLetterMap(scriptId: string): boolean {
  return Boolean(letterMaps[scriptId]);
}

/** 一对文字共用的槽位，按全局顺序返回（两边的并集） */
export function sharedSlots(a: string, b: string): string[] {
  const ma = letterMaps[a] ?? {};
  const mb = letterMaps[b] ?? {};
  const ids = new Set([...Object.keys(ma), ...Object.keys(mb)]);
  return [...ids].sort((x, y) => (slotIndex.get(x) ?? 99) - (slotIndex.get(y) ?? 99));
}

/** 槽位名的查表 */
export const slotLabel: Record<string, string> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s.label]),
);
