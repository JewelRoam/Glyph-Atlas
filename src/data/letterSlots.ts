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
 * 暂不收录：拉丁 J / U / W。它们是中世纪以后从 I / V 分出来的，
 * 与希腊字母不是一对一的对应关系，放进对照表反而会误导，故排除。
 */

export interface LetterSlot {
  id: string;
  /** 槽位名（中文 + 转写），鼠标悬停时显示 */
  label: string;
}

/** 槽位的全局顺序：先闪米特 22 个祖形，再希腊—罗马的后起字母 */
export const SLOTS: LetterSlot[] = [
  { id: 'aleph', label: '牛头 ʾālep' },
  { id: 'beth', label: '房子 bēt' },
  { id: 'gimel', label: '骆驼 gīml' },
  { id: 'daleth', label: '门 dālet' },
  { id: 'dhal', label: 'ذ（د 加点）' },
  { id: 'he', label: '窗 hē' },
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
  { id: 'digamma', label: 'Ϝ / F（wāw 的另一支）' },
  { id: 'upsilon', label: 'Y（借自希腊 Υ）' },
  { id: 'phi', label: 'Φ（希腊新造）' },
  { id: 'chi', label: 'Χ / X（希腊新造）' },
  { id: 'psi', label: 'Ψ（希腊新造）' },
  { id: 'omega', label: 'Ω（希腊新造）' },
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
