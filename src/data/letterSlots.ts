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
 *  · 阿拉伯字母的扩展：阿拉伯字母表自带的 28 个之外，波斯、乌尔都、信德、
 *    普什图、库尔德、维吾尔、柯尔克孜、克什米尔各用阿拉伯字母写自己的语言，
 *    又在字母上加笔画造了本语要用的音位（پ چ ژ گ ٹ ڈ ڑ ں ھ ے ې ۆ ۇ ۈ ۋ
 *    等等），另加 hamza ء、teh marbuta ة、alef maksura ى、alef wasla ٱ 这四个
 *    本是同一字母的变体字。它们各占一格，槽位紧跟母字，走到阿拉伯那一站
 *    一起飞入，共 72 个字母；
 *  · 叙利亚字母的扩展：迦尔舒尼文、波斯语与粟特语借用叙利亚字母来写自己的
 *    语言时另添了十字（ܔ ܜ ܞ ܧ ܭ ܮ ܯ ݍ ݎ ݏ），也各占一格，紧跟母字；
 *  · 希腊—罗马：希腊、拉丁；
 *  · 意大利半岛：伊特鲁里亚、古意大利字母（伊特鲁里亚的 27 个字母，
 *    加上法利希、奥斯坎、翁布里亚、南皮切努姆、维内蒂、雷蒂亚各家添的字）；
 *  · 希腊的东支：科普特、西里尔；
 *  · 希腊的两条支流：哥特（斯堪的纳维亚—黑海）、格拉哥里（斯拉夫）；
 *  · 日耳曼的北支：卢恩字母（futhark，从古意大利—拉丁一类的字母长出来，
 *    老弗萨克的 24 个里 19 个能接回拉丁槽位，其余各代添的字见 run-* 槽位）；
 *  · 阿拉米东支：粟特、回鹘、碑铭巴列维、诗篇巴列维；
 *  · 阿拉米西支的延伸：摩尼字母（叙利亚字母的后身，多出 14 个分音字面）；
 *  · 北非：提非纳文（布匿字母的后身，中经利比亚—古提非纳文）；
 *  · 非洲之角：吉兹字母（古南阿拉伯字母的后身，取 26 个辅音的第一式）；
 *  · 回鹘的下游：蒙古字母；
 *  · 阿维斯陀：巴列维的经书后身，字母从 22 个扩到 54 个（见 av-* 槽位）；
 *  · 安纳托利亚两支：吕基亚、吕底亚（希腊字母的地方化分支；卡里亚的音值
 *    对应没有定论，不建整表）；
 *  · 婆罗米系（独立元音 svara 的 18 个元音位 + 梵语字音表 varga 的 33 个
 *    辅音位，外加孩子们自己添的卷舌边音 ḷa/ḻa、闪音 ṟa、齿龈鼻音 ṉa）：
 *    婆罗米、悉昙、格兰塔、天城、孟加拉、古吉拉特、果鲁穆奇、奥里亚、泰米尔、
 *    泰卢固、卡纳达、马拉雅拉姆、僧伽罗、藏文、爪哇、巴厘、高棉、缅文、泰文、
 *    老挝文。元音那一半的字面与取舍在 src/data/svaraSlots.ts。
 *  · 夏拉达支系：夏拉达、塔克里、马哈贾尼、霍杰基、穆尔塔尼、胡达瓦迪、多格拉
 *    ——同一套元音位与梵语音位表，外加信德内爆音与几个地方卷舌音、古写 kha；
 *    这几家丢掉的元音位同样按消失处理（例如穆尔塔尼只剩 a i u e 四个）。
 *  · 尼瓦尔文：梵语音位表 33 格与那套独立元音，外加尼泊尔巴沙语的六个浊送音
 *    （ṅha ñha nha mha rha lha，见 varga- 末尾那五格与其后的映射）。
 *  · 东南亚本语字母：泰、老两文把 ข ค ผ พ ห 加一笔分出的 /f/ /h/ 一系，加上
 *    从印度 ḍ/d、b 一系来的 ฎ ด บ，以及泰、老、高棉三家都有的元音载体 อ/ອ/អ，
 *    另占一格（见 varga- 的最后一批）；泰文的 ฤ ฦ 落在 svara 的 r̥ / l̥ 两格。
 *  · 缅文区块的邻语字母：Unicode 的 Myanmar 区块还收了孟文、掸文（傣耶）、
 *    斯高克伦文、东西波克伦文、勃欧文（儒玛瑞）自己的字母。它们不是一个字形
 *    的异体，而是各语言按本语音位另造的字；孟文 5 个、斯高克伦文 1 个、西波
 *    克伦文 2 个、东波克伦文 3 个、掸文 15 个、勃欧文 1 个，共 27 格（见
 *    varga-mran-* 槽位），只在缅甸字母表这一站出现并成组飞入。
 *  · 外缘支流：高加索阿尔巴尼亚、古彼尔姆、埃尔巴桑、维特库奇——按音位
 *    位次与上面各表对齐，多出来的音位另立一格（见 per 系与 perm 系槽位）。
 *  · 假名：汉字借字、平假名、片假名三套——一个音节一格（见 kana-* 槽位），
 *    汉字一列是万叶假名给这个音用的借字，浊音半浊音在汉字一列是空的、飞入。
 *
 * 三套槽位各管各的：开头是闪米特—希腊的字母位（ʾālep → Α → A 那条线），
 * 中间 av-* 是阿维斯陀自己新造的字母，mong-* 是蒙古在回鹘之上分出的字母
 * （这两组都只在各自那条轨道上用得到），
 * 末尾的 svara-* 与 varga-* 是婆罗米系的元音位与辅音位（婆罗米 𑀅 → 天城 अ、
 * 婆罗米 ka → 天城 क → 泰文 ก 那两条线），两者总是成对出现，所以并在一包。
 * 一条轨道上只会出现其中一套或两套相邻的字母位，格子不会混。
 *
 * 暂不收录：拉丁 J / U / W。它们是中世纪以后从 I / V 分出来的，
 * 与希腊字母不是一对一的对应关系，放进对照表反而会误导，故排除。
 */

import { SVARA_SLOTS, svaraMaps } from './svaraSlots.ts';

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
  { id: 'hamza', label: 'ء hamza（声门塞音，在阿拉伯字母表里单独成字）' },
  { id: 'alef-wasla', label: 'ٱ（alef wasla，hamza 坐在 alif 上）' },
  { id: 'beth', label: '房子 bēt' },
  { id: 'persian-bheth', label: 'ܭ（persian bheth，叙利亚字母为波斯语添的 b）' },
  { id: 'peh', label: 'پ（ب 加三点，波斯语 /p/）' },
  { id: 'veh', label: 'ڤ（ف 加三点，库尔德语、维吾尔语的 /v/）' },
  { id: 'beeh', label: 'ٻ（ب 加两点朝下，信德语内爆 /ɓ/）' },
  { id: 'beheh', label: 'ڀ（ب 加四点，信德语送气 /bʰ/）' },
  { id: 'vede', label: 'в / В（与 б 同出希腊 Β，斯拉夫分写）' },
  { id: 'gimel', label: '骆驼 gīml' },
  { id: 'gamal-garshuni', label: 'ܔ（gāmal garshuni，迦尔舒尼文用来写阿拉伯语的 ǧ）' },
  { id: 'persian-ghamal', label: 'ܮ（persian ghamal，叙利亚字母为波斯语添的 g）' },
  { id: 'tcheh', label: 'چ（ج 加三点，波斯语 /tʃ/）' },
  { id: 'tcheheh', label: 'ڇ（چ 的送气形，信德语）' },
  { id: 'dyeh', label: 'ڄ（信德语的 /ʄ/ 一类内爆音）' },
  { id: 'daleth', label: '门 dālet' },
  { id: 'persian-dhalath', label: 'ܯ（persian dhalath，叙利亚字母为波斯语添的 δ／dh）' },
  { id: 'ddal', label: 'ڈ（د 的卷舌形，乌尔都语 /ɖ/）' },
  { id: 'dahal', label: 'ڌ（د 加两点朝下，信德语送气 /dʰ/）' },
  { id: 'ddahal', label: 'ڍ（ڌ 加一撇，信德语）' },
  { id: 'dul', label: 'ڎ（د 的变体形）' },
  { id: 'dhal', label: 'ذ（د 加点）' },
  { id: 'he', label: '窗 hē' },
  { id: 'heh-doachashmee', label: 'ھ（乌尔都语的送气符号 h）' },
  { id: 'heh-goal', label: 'ہ（乌尔都语的 h，也写收尾的 ə）' },
  { id: 'ae', label: 'ە（库尔德语 /ɛ/）' },
  { id: 'zhe', label: 'ж / Ж（斯拉夫新造）' },
  { id: 'waw', label: '钩 wāw' },
  { id: 'u', label: 'ۇ（维吾尔语 /u/，wāw 上加一撇）' },
  { id: 'oe', label: 'ۆ（库尔德语 /o/）' },
  { id: 'waw-yu', label: 'ۈ（维吾尔语 /y/）' },
  { id: 've', label: 'ۋ（维吾尔语 /v/）' },
  { id: 'kirghiz-oe', label: 'ۅ（柯尔克孜语 /ø/）' },
  { id: 'kirghiz-yu', label: 'ۉ（柯尔克孜语 /y/）' },
  { id: 'zayin', label: '武器 zayin' },
  { id: 'sogdian-zhain', label: 'ݍ（sogdian zhain，叙利亚字母写粟特语时添的 /ʒ/）' },
  { id: 'jeh', label: 'ژ（ز 加三点，波斯语 /ʒ/）' },
  { id: 'heth', label: '篱笆 ḥēt' },
  { id: 'kha', label: 'خ（ح 加点）' },
  { id: 'teth', label: '轮 ṭēt' },
  { id: 'teth-garshuni', label: 'ܜ（ṭēt garshuni，迦尔舒尼文的 emphatic t）' },
  { id: 'zah', label: 'ظ（ط 加点）' },
  { id: 'yodh', label: '手 yōd' },
  { id: 'yudh-he', label: 'ܞ（yudh he，叙利亚文写 ē 元音的字）' },
  { id: 'alef-maksura', label: 'ى（alef maksura，形似 ي 而不带两点）' },
  { id: 'farsi-yeh', label: 'ی（波斯语的 yeh 写法，不带下两点）' },
  { id: 'e', label: 'ې（普什图语 /e/）' },
  { id: 'yeh-barree', label: 'ے（乌尔都语收尾的 e）' },
  { id: 'kashmiri-yeh', label: 'ؠ（克什米尔语 yeh）' },
  { id: 'kaph', label: '掌心 kāp' },
  { id: 'sogdian-khaph', label: 'ݎ（sogdian khaph，叙利亚字母写粟特语时添的 /x/）' },
  { id: 'keheh', label: 'ک（波斯语的 kāf 写法，不与 lām 连写成字）' },
  { id: 'swash-kaf', label: 'ڪ（信德语 kāf）' },
  { id: 'gaf', label: 'گ（ک 加一横，波斯语 /g/）' },
  { id: 'gueh', label: 'ڳ（گ 加一圈，信德语内爆 /ɠ/）' },
  { id: 'lamedh', label: '赶牛棒 lāmed' },
  { id: 'mem', label: '水 mēm' },
  { id: 'nun', label: '鱼 nūn' },
  { id: 'nyeh', label: 'ڃ（信德语 /ɲ/）' },
  { id: 'ng', label: 'ڭ（维吾尔语、哈萨克语 /ŋ/）' },
  { id: 'ngoeh', label: 'ڱ（信德语 /ŋ/）' },
  { id: 'noon-ghunna', label: 'ں（nūn ghunna，鼻化元音的收尾）' },
  { id: 'rnoon', label: 'ڻ（ن 的卷舌形，信德语 /ɳ/）' },
  { id: 'samekh', label: '支柱 sāmek' },
  { id: 'ayin', label: '眼睛 ʿayin' },
  { id: 'ghayn', label: 'غ（ع 加点）' },
  { id: 'pe', label: '嘴 pē' },
  { id: 'reversed-pe', label: 'ܧ（reversed pe，叙利亚字母的另写形）' },
  { id: 'sogdian-fe', label: 'ݏ（sogdian fē，叙利亚字母写粟特语时添的 /f/）' },
  { id: 'peheh', label: 'ڦ（پ 加两点朝下，信德语送气 /pʰ/）' },
  { id: 'sadhe', label: '弓 ṣādē' },
  { id: 'dad', label: 'ض（ص 加点）' },
  { id: 'qoph', label: 'qōp' },
  { id: 'resh', label: '头 rēš' },
  { id: 'rreh', label: 'ڑ（ر 的卷舌形，乌尔都语 /ɽ/）' },
  { id: 'shin', label: '牙 šīn' },
  { id: 'taw', label: '记号 tāw' },
  { id: 'tha', label: 'ث（ت 加点）' },
  { id: 'teh-marbuta', label: 'ة（teh marbuta，词尾的 t 音）' },
  { id: 'teh-marbuta-goal', label: 'ۃ（teh marbuta 的另一种写法，乌尔都语）' },
  { id: 'tteh', label: 'ٹ（ت 的卷舌形，乌尔都语 /ʈ/）' },
  { id: 'tteheh', label: 'ٺ（ت 的卷舌送气形，信德语）' },
  { id: 'teheh', label: 'ٿ（ت 加四点，信德语送气 /tʰ/）' },
  // 南闪米特与乌加里特多出来的辅音位。北方的腓尼基—阿拉米把 *ḫ *ḏ *ġ *ṯ *ẓ *ḍ
  // 并进了 ḥ z / ġ→ʿ / š ṣ d 里，南阿拉伯与乌加里特却把它们分写；s¹（Ś，边音）
  // 也只有南边保留。这些格子只在南闪米特那一串字母场里出现（阿拉伯的加点字母
  // 用的就是上面那六格）。
  { id: 'sate', label: '𐩪 s¹（南阿拉伯的三组咝音之一）' },
  { id: 'ugarit-i', label: '𐎛 ʾi（乌加里特的 i 形 ʾ）' },
  { id: 'ugarit-u', label: '𐎜 ʾu（乌加里特的 u 形 ʾ）' },
  { id: 'ugarit-ssu', label: '𐎝 ssu（乌加里特为胡里特语补的咝音）' },
  // 粟特在阿拉米之上分出的两个擦音字母：feth 由 pē 分化，leš 表示 ž；
  // 回鹘只继承了 leš。只出现在这两家的字母场里，别的对照表不建这一格。
  { id: 'feth', label: '𐽃 feth（粟特由 pē 分出的擦音）' },
  { id: 'lesh', label: '𐽄 leš（粟特/回鹘的 ž）' },

  // ── 蒙古字母在回鹘之上分出的格子 ─────────────────────────────────────
  // 回鹘字母的字母数比蒙古少，而且一个字形常管几个读音：aleph 兼写 a/e，
  // waw 兼写 u/o/ü/ö/w，yodh 兼写 i/y，tāw 兼写 t/d。蒙古人把这些读音分写成
  // 不同的字母（靠短画与钩区别），于是这些格子只在蒙古这一站出现，在字母场
  // 里从回鹘那一格飞入。末尾十格是 16 世纪为转写藏文、梵文补入的字母，
  // 回鹘那一站同样没有对应字形。
  { id: 'mong-e', label: 'ᠡ e（回鹘 aleph 的另一读）' },
  { id: 'mong-y', label: 'ᠶ y（回鹘 yodh 的辅音读法）' },
  { id: 'mong-o', label: 'ᠣ o（回鹘 waw 的圆唇一读）' },
  { id: 'mong-oe', label: 'ᠥ ö' },
  { id: 'mong-ue', label: 'ᠦ ü' },
  { id: 'mong-d', label: 'ᠳ d（回鹘 tāw 的浊音一读）' },
  { id: 'mong-ang', label: 'ᠩ ang ŋ（蒙古在 n 上补的一格）' },
  { id: 'mong-ee', label: 'ᠧ ee（转写用元音）' },
  { id: 'mong-f', label: 'ᠹ f（转写补入）' },
  { id: 'mong-k', label: 'ᠺ k（转写补入）' },
  { id: 'mong-kh', label: 'ᠻ kh（转写补入）' },
  { id: 'mong-ts', label: 'ᠼ ts（转写补入）' },
  { id: 'mong-dz', label: 'ᠽ dz（转写补入）' },
  { id: 'mong-h', label: 'ᠾ h（转写补入）' },
  { id: 'mong-zhr', label: 'ᠿ zhr（转写补入）' },
  { id: 'mong-lh', label: 'ᡀ lh（转写补入）' },
  { id: 'mong-zhi', label: 'ᡁ zhi（转写补入）' },
  { id: 'mong-chi', label: 'ᡂ chi（转写补入）' },
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
  // ── 安纳托利亚两支：吕基亚与吕底亚 ─────────────────────────────────
  // 两套字母都以希腊字母为模型（与卡里亚同源；卡里亚与希腊的音值对应至今
  // 没有定论，那条轨道只做单字形展示、不建整表）。能按音值接回希腊的字母
  // 直接接回上面的槽位；安纳托利亚本地特有的音——鼻化元音、清化流音、
  // 第二个 t / k、擦音——在这里各占一格，走到这一站时从下方飞入。
  { id: 'nasal-an', label: '𐊙 / 𐤵（鼻化 a）' },
  { id: 'nasal-en', label: '𐊚 / 𐤶（鼻化 e）' },
  { id: 'lyc-bh', label: '𐊃 bh β（吕基亚的浊擦音）' },
  { id: 'lyc-j', label: '𐊊 j（吕基亚的半元音）' },
  { id: 'lyc-mm', label: '𐊐 mm m̥（清化 m）' },
  { id: 'lyc-nn', label: '𐊑 nn n̥（清化 n）' },
  { id: 'lyc-kk', label: '𐊔 kk（吕基亚的第二个 k）' },
  { id: 'lyc-tt', label: '𐊘 tt（吕基亚的第二个 t）' },
  { id: 'lyd-v', label: '𐤥 v（吕底亚的唇齿擦音）' },
  { id: 'lyd-y', label: '𐤧 y（吕底亚的滑音）' },
  { id: 'lyd-ss', label: '𐤮 ś（吕底亚的第二个咝音）' },
  { id: 'lyd-tt', label: '𐤴 τ tʷ（圆唇的 t）' },
  { id: 'lyd-ly', label: '𐤷 λ（吕底亚的边音）' },
  { id: 'lyd-nn', label: '𐤸 ν（吕底亚的鼻音）' },
  { id: 'lyd-c', label: '𐤹 c（吕底亚的塞擦音）' },
  // ── 意大利半岛：伊特鲁里亚与古意大利字母 ────────────────────────────
  // 那不勒斯湾的优卑亚希腊字母北上后先成为伊特鲁里亚字母；半岛上其余各家
  // （法利希、奥斯坎、翁布里亚、南皮切努姆、维内蒂、雷蒂亚）的本地字母又都
  // 从伊特鲁里亚一套出发。他们共享的 26 个字母能一路接回希腊，各家添的字
  // 则在这里占格，走到"古意大利字母"这一站时从下方飞入（Unicode 第 8 章
  // Old Italic 一节逐个列了各家的增补）：
  //  · EF 𐌚 —— 伊特鲁里亚与法利希添的 /f/；
  //  · ERS 𐌛、CHE 𐌜 —— 翁布里亚添的两个字母；
  //  · II 𐌝、UU 𐌞 —— 奥斯坎添的 /i/ /u/；
  //  · ESS 𐌟 —— 南皮切努姆的咝音；
  //  · YE 𐌭、NORTHERN TSE 𐌮、SOUTHERN TSE 𐌯 —— 北意大利的维内蒂与
  //    雷蒂亚添的三个字母。
  { id: 'ital-ef', label: '𐌚 EF（伊特鲁里亚 · 法利希的 /f/）' },
  { id: 'ital-ers', label: '𐌛 ERS（翁布里亚添的字母）' },
  { id: 'ital-che', label: '𐌜 CHE（翁布里亚添的字母）' },
  { id: 'ital-ii', label: '𐌝 II（奥斯坎的 i）' },
  { id: 'ital-uu', label: '𐌞 UU（奥斯坎的 u）' },
  { id: 'ital-ess', label: '𐌟 ESS（南皮切努姆的咝音）' },
  { id: 'ital-ye', label: '𐌭 YE（维内蒂添的字母）' },
  { id: 'ital-n-tse', label: '𐌮 NORTHERN TSE（雷蒂亚添的字母）' },
  { id: 'ital-s-tse', label: '𐌯 SOUTHERN TSE（雷蒂亚添的字母）' },
  // ── 卢恩字母：日耳曼人的 futhark ────────────────────────────────────
  // 卢恩字母从古意大利／拉丁一类字母的早期形态里长出来。Unicode 第 8 章把
  // 这层关系说得直白："多数卢恩字母的形状能对上某个拉丁大写字母，但未必
  // 对得上读音相同的那个字母。" 所以下面只把形状与读音确实对得上的 19 格
  // 接回古意大利—拉丁那套槽位——f u a r k g h n i p z s t b e m l d o；
  // þ w j ï ŋ 这五个音拉丁字母表里没有，另占一格。其余 59 格是盎格鲁-撒克逊
  // futhorc、北欧 younger futhark 与中世纪卢恩陆续添的字母（Unicode 把各时
  // 代的字面收在同一条区块里），长枝／短枝、加点这类同一字母的不同字面也各
  // 自占格，走到卢恩这一站时整批从下方飞入，把字母表补成一个全：
  { id: 'run-thurisaz', label: 'ᚦ thurisaz þ（/θ/）' },
  { id: 'run-wunjo', label: 'ᚹ wunjo w（/w/）' },
  { id: 'run-jeran', label: 'ᛃ jeran j（/j/）' },
  { id: 'run-iwaz', label: 'ᛇ iwaz ï（日耳曼语的 ee 音）' },
  { id: 'run-ingwaz', label: 'ᛜ ingwaz ŋ（/ŋ/）' },
  { id: 'run-v', label: 'ᚡ V（古英语的 v）' },
  { id: 'run-yr', label: 'ᚣ yr（古英语的 y）' },
  { id: 'run-y', label: 'ᚤ Y（y 的另一个字面）' },
  { id: 'run-w', label: 'ᚥ W（w 的另一个字面）' },
  { id: 'run-eth', label: 'ᚧ eth ð' },
  { id: 'run-os', label: 'ᚩ os（古英语的 o）' },
  { id: 'run-ac', label: 'ᚪ ac（古英语的 a）' },
  { id: 'run-aesc', label: 'ᚫ aesc æ' },
  { id: 'run-oss-lb', label: 'ᚬ oss（长枝，younger futhark 的 o）' },
  { id: 'run-oss-st', label: 'ᚭ oss（短枝，同一字母的另一字面）' },
  { id: 'run-o', label: 'ᚮ O（o）' },
  { id: 'run-oe', label: 'ᚯ oe ø' },
  { id: 'run-on', label: 'ᚰ on ą' },
  { id: 'run-cen', label: 'ᚳ cen（古英语的 c）' },
  { id: 'run-kaun', label: 'ᚴ kaun（younger futhark 的 k）' },
  { id: 'run-g', label: 'ᚵ G（g）' },
  { id: 'run-eng', label: 'ᚶ eng ŋ（古英语的 ŋ）' },
  { id: 'run-gar', label: 'ᚸ gar（古英语的 g）' },
  { id: 'run-haegl', label: 'ᚻ haegl（古英语的 h）' },
  { id: 'run-hagall-lb', label: 'ᚼ hagall（长枝，younger futhark 的 h）' },
  { id: 'run-hagall-st', label: 'ᚽ hagall（短枝）' },
  { id: 'run-naud-st', label: 'ᚿ naud（短枝，younger futhark 的 n）' },
  { id: 'run-n-dotted', label: 'ᛀ dotted n（中世纪加点的 n）' },
  { id: 'run-e', label: 'ᛂ E（e）' },
  { id: 'run-ger', label: 'ᛄ ger（古英语的 j）' },
  { id: 'run-ar-lb', label: 'ᛅ ar（长枝，younger futhark 的 a）' },
  { id: 'run-ar-st', label: 'ᛆ ar（短枝）' },
  { id: 'run-sigel', label: 'ᛋ sigel（古英语的 s）' },
  { id: 'run-sol-st', label: 'ᛌ sol（短枝）' },
  { id: 'run-c', label: 'ᛍ C（c）' },
  { id: 'run-z', label: 'ᛎ Z（z）' },
  { id: 'run-tyr-st', label: 'ᛐ tyr（短枝，younger futhark 的 t）' },
  { id: 'run-d', label: 'ᛑ D（d）' },
  { id: 'run-bjarkan-st', label: 'ᛓ bjarkan（短枝，younger futhark 的 b）' },
  { id: 'run-p-dotted', label: 'ᛔ dotted p（中世纪加点的 p）' },
  { id: 'run-p-open', label: 'ᛕ open p（开口的 p）' },
  { id: 'run-madr-lb', label: 'ᛘ maðr（长枝，younger futhark 的 m）' },
  { id: 'run-madr-st', label: 'ᛙ maðr（短枝）' },
  { id: 'run-l-dotted', label: 'ᛛ dotted l（中世纪加点的 l）' },
  { id: 'run-ing', label: 'ᛝ ing（younger futhark 的 ŋ）' },
  { id: 'run-ear', label: 'ᛠ ear（古英语添的字母）' },
  { id: 'run-ior', label: 'ᛡ ior（古英语添的字母）' },
  { id: 'run-cweorth', label: 'ᛢ cweorth（古英语添的字母）' },
  { id: 'run-calc', label: 'ᛣ calc（古英语的 k）' },
  { id: 'run-cealc', label: 'ᛤ cealc（古英语的 k）' },
  { id: 'run-stan', label: 'ᛥ stan（古英语的 st）' },
  { id: 'run-yr-lb', label: 'ᛦ ýr（长枝，younger futhark 的 ʀ）' },
  { id: 'run-yr-st', label: 'ᛧ ýr（短枝）' },
  { id: 'run-yr-ice', label: 'ᛨ ýr（冰岛写法）' },
  { id: 'run-q', label: 'ᛩ Q（q）' },
  { id: 'run-x', label: 'ᛪ X（x）' },
  { id: 'run-k', label: 'ᛱ K（中世纪加点的 k）' },
  { id: 'run-sh', label: 'ᛲ SH（中世纪添的 sh）' },
  { id: 'run-oo', label: 'ᛳ OO（中世纪添的 ø）' },
  { id: 'run-fc-os', label: 'ᛴ 弗兰克斯小箱 os（单篇铭文专用）' },
  { id: 'run-fc-is', label: 'ᛵ 弗兰克斯小箱 is（单篇铭文专用）' },
  { id: 'run-fc-eh', label: 'ᛶ 弗兰克斯小箱 eh（单篇铭文专用）' },
  { id: 'run-fc-ac', label: 'ᛷ 弗兰克斯小箱 ac（单篇铭文专用）' },
  { id: 'run-fc-aesc', label: 'ᛸ 弗兰克斯小箱 aesc（单篇铭文专用）' },
  // ── 提非纳文：柏柏尔人的字母 ────────────────────────────────────────
  // Unicode 区块 U+2D30–U+2D7F 收 56 个字母加一个唇化符号。基本盘是摩洛哥
  // 皇家阿马齐格文化学院（IRCAM）整理的新提非纳文，其余是柏柏尔学院、图阿
  // 雷格、阿哈加尔、阿耶尔、塔韦莱梅特各家还在用的字面。新提非纳文把 u 与 w、
  // z 与 ẓ 分写成两套字母，多出来的那一半和各家自己的变体一样各占一格，走到
  // 提非纳文这一站时从下方飞入：
  { id: 'tif-yabh', label: 'ⴲ yabh（β）' },
  { id: 'tif-yaghh', label: 'ⴴ yaghh（ɣ 的一个字面）' },
  { id: 'tif-yaj-acad', label: 'ⴵ 柏柏尔学院 yaj（dʒ）' },
  { id: 'tif-yaj', label: 'ⴶ yaj（ʒ）' },
  { id: 'tif-schwa', label: 'ⴻ yey（中性元音 ə）' },
  { id: 'tif-yak-tuareg', label: 'ⴾ 图阿雷格 yak（k 的图阿雷格字面）' },
  { id: 'tif-yakhh', label: 'ⴿ yakhh（χ）' },
  { id: 'tif-yah-acad', label: 'ⵁ 柏柏尔学院 yah' },
  { id: 'tif-yah-tuareg', label: 'ⵂ 图阿雷格 yah' },
  { id: 'tif-yakh-tuareg', label: 'ⵆ 图阿雷格 yakh' },
  { id: 'tif-yaq-tuareg', label: 'ⵈ 图阿雷格 yaq' },
  { id: 'tif-yazh', label: 'ⵊ yazh（ʒ）' },
  { id: 'tif-yazh-ahaggar', label: 'ⵋ 阿哈加尔 yazh' },
  { id: 'tif-yazh-tuareg', label: 'ⵌ 图阿雷格 yazh' },
  { id: 'tif-yagn', label: 'ⵐ 图阿雷格 yagn' },
  { id: 'tif-yang', label: 'ⵑ 图阿雷格 yang' },
  { id: 'tif-yap', label: 'ⵒ yap（p，借词用）' },
  { id: 'tif-yarr', label: 'ⵕ yarr（咽化的 r）' },
  { id: 'tif-yagh-tuareg', label: 'ⵗ 图阿雷格 yagh' },
  { id: 'tif-yagh-ayer', label: 'ⵘ 阿耶尔 yagh' },
  { id: 'tif-yach', label: 'ⵞ yach（tʃ）' },
  { id: 'tif-yav', label: 'ⵠ yav（v）' },
  { id: 'tif-yaw', label: 'ⵡ yaw（w）' },
  { id: 'tif-yay', label: 'ⵢ yay（j）' },
  { id: 'tif-yaz-tawellemet', label: 'ⵤ 塔韦莱梅特 yaz' },
  { id: 'tif-yazz', label: 'ⵥ yazz（咽化的 z）' },
  { id: 'tif-ye', label: 'ⵦ ye（e）' },
  { id: 'tif-yo', label: 'ⵧ yo（o）' },
  { id: 'tif-labialization', label: 'ⵯ 唇化符号（ⴳⵯ gʷ、ⴽⵯ kʷ）' },
  // ── 摩尼字母自己添的字母 ────────────────────────────────────────────
  // 摩尼字母是摩尼教为抄写中古伊朗语与回鹘语造的书体，骨架承自叙利亚字母：
  // 阿拉米的 22 个字母都能对上号（见下面的对照表）。它又多造了 14 个字面，
  // 用来区分叙利亚字母里不分的音——b 与 β、g 与 ɣ、z 与 ʒ、j 与 dʒ、k 与 x、
  // d 与 ð、p 与 f、q 与 x、š 与 ɕ。这些在摩尼字母一站从下方飞入。
  { id: 'mani-bheth', label: '𐫂 bheth（β）' },
  { id: 'mani-ghimel', label: '𐫄 ghimel（ɣ）' },
  { id: 'mani-zhayin', label: '𐫊 zhayin（ʒ）' },
  { id: 'mani-jayin', label: '𐫋 jayin（dʒ）' },
  { id: 'mani-jhayin', label: '𐫌 jhayin（dʒʰ）' },
  { id: 'mani-xaph', label: '𐫑 xaph（x）' },
  { id: 'mani-khaph', label: '𐫒 khaph（x，与 xaph 分工）' },
  { id: 'mani-dhamedh', label: '𐫔 dhamedh（ð）' },
  { id: 'mani-thamedh', label: '𐫕 thamedh（θ）' },
  { id: 'mani-aayin', label: '𐫚 aayin（ʕ 的另一种字面）' },
  { id: 'mani-fe', label: '𐫜 fe（f）' },
  { id: 'mani-xoph', label: '𐫟 xoph（x）' },
  { id: 'mani-qhoph', label: '𐫠 qhoph（qʰ）' },
  { id: 'mani-sshin', label: '𐫣 sshin（ɕ）' },
  // ── 吉兹字母自己的三格 ──────────────────────────────────────────────
  // 吉兹字母（Ethiopic）从古南阿拉伯字母演变而来，字形的来路清楚，字母次序
  // 后来却重排过，齿音三套（s ś ṣ）与边音在传播中换过位。所以这条对照按音值
  // 接格：h l ḥ m r s q b t ḫ n ʾ k w ʿ z y d g ṭ ṣ ḍ 各接南阿拉伯的同音格，
  // p 在吉兹里擦化成 f，也接 pe。剩下三个音南阿拉伯体系里没有可以对应的格，
  // 各立一格：边音 ś、强音 p̣、为外来词补的 p。
  { id: 'gez-sza', label: 'ሠ ś（边音，Unicode 名 SZA）' },
  { id: 'gez-pha', label: 'ጰ p̣（强音 p，Unicode 名 PHA）' },
  { id: 'gez-pa', label: 'ፐ p（为外来词添的 p，Unicode 名 PA）' },
  // ── 阿维斯陀字母自己新造的字母 ──────────────────────────────────────
  // 阿维斯陀字母是为逐音记录《阿维斯陀》经文造的，3—4 世纪成书时把字母表
  // 从巴列维的 22 个扩到了 54 个。能接回巴列维的 17 格写在下面的对照表里，
  // 其余 37 格——长音符、θ δ x f β 这些巴列维没有的音——都是新造的字，
  // 在字母场里没有祖先格，走到阿维斯陀这一站时飞入。
  { id: 'av-aa', label: '𐬁 aa（a 的长音）' },
  { id: 'av-ao', label: '𐬂 ao' },
  { id: 'av-aao', label: '𐬃 aao（长音 ao）' },
  { id: 'av-an', label: '𐬄 an（鼻化 a）' },
  { id: 'av-aan', label: '𐬅 aan（鼻化长音 a）' },
  { id: 'av-ae', label: '𐬆 ae（央元音）' },
  { id: 'av-aee', label: '𐬇 aee（长音 ae）' },
  { id: 'av-e', label: '𐬈 e' },
  { id: 'av-ee', label: '𐬉 ee（长音 e）' },
  { id: 'av-o', label: '𐬊 o' },
  { id: 'av-oo', label: '𐬋 oo（长音 o）' },
  { id: 'av-i', label: '𐬌 i' },
  { id: 'av-ii', label: '𐬍 ii（长音 i）' },
  { id: 'av-u', label: '𐬎 u' },
  { id: 'av-uu', label: '𐬏 uu（长音 u）' },
  { id: 'av-xe', label: '𐬑 xe x' },
  { id: 'av-xye', label: '𐬒 xye x́' },
  { id: 'av-xve', label: '𐬓 xve xʷ' },
  { id: 'av-gge', label: '𐬕 gge ġ' },
  { id: 'av-ghe', label: '𐬖 ghe γ' },
  { id: 'av-ce', label: '𐬗 ce c' },
  { id: 'av-je', label: '𐬘 je j' },
  { id: 'av-the', label: '𐬚 the θ' },
  { id: 'av-dhe', label: '𐬜 dhe δ' },
  { id: 'av-tte', label: '𐬝 tte t̰' },
  { id: 'av-fe', label: '𐬟 fe f' },
  { id: 'av-bhe', label: '𐬡 bhe β' },
  { id: 'av-nge', label: '𐬢 nge ŋ' },
  { id: 'av-ngye', label: '𐬣 ngye ŋ́' },
  { id: 'av-ngve', label: '𐬤 ngve ŋʷ' },
  { id: 'av-nye', label: '𐬦 nye ń' },
  { id: 'av-nne', label: '𐬧 nne（腭鼻音）' },
  { id: 'av-hme', label: '𐬩 hme m̨' },
  { id: 'av-yye', label: '𐬪 yye ẏ' },
  { id: 'av-zhe', label: '𐬲 zhe ž' },
  { id: 'av-shye', label: '𐬳 shye š́' },
  { id: 'av-sshe', label: '𐬴 sshe ṣ̌' },
  // ── 高加索两支：亚美尼亚与格鲁吉亚 ──────────────────────────────────
  // 两套字母表都借希腊字母的模型，却各自把高加索语系的音位补了进来。
  // 能按音值接回闪米特—希腊的格子直接接回去（见下面的对照表），接不上的
  // ——挤喉音、送气音、擦音、dz/tʃ 这些——在这里各占一格，走过去时飞入。
  // 高加索两支都单立了 /h/：亚美尼亚 Հ、格鲁吉亚 ჰ。
  //    * 闪米特的 hē 在希腊变成了元音 Ε，字母表里没有留给 /h/ 的正位。
  { id: 'h', label: 'Հ / ჰ / 𐊛（清喉擦音 h）' },
  // 亚美尼亚的第八个字母，希腊字母表里没有对应的音。
  { id: 'schwa', label: 'Ը（央元音 ə）' },
  // 亚美尼亚的 /j/；格鲁吉亚没有这个字母，写到那边时消失。
  { id: 'yod-cons', label: 'Յ（半元音 j）' },
  // 亚美尼亚在颤音 Ռ 之外另立了一个轻弹音 Ր。
  { id: 'r-tap', label: 'Ր（轻弹音 ɾ）' },
  { id: 'dze', label: 'Ձ / ძ（dz）' },
  { id: 'gha', label: 'Ղ / ღ（浊擦音 ʁ / ɣ）' },
  { id: 'je', label: 'Ջ / ჯ（dʒ）' },
  { id: 'kha-asp', label: 'Ք / ქ（送气 kʰ）' },
  { id: 'tse-asp', label: 'Ց / ც（送气 tsʰ）' },
  { id: 'che-asp', label: 'Չ / ჩ（送气 tʃʰ）' },
  // 12 世纪才补进来的字母，专门用来转写外来词里的 /f/。
  { id: 'ef', label: 'Ֆ（f）' },
  // 格鲁吉亚保留了高加索语系的挤喉音（ejective），
  //    * 于是 /k/ 一分为三：კ kʼ、ქ kʰ、ხ x——分别占三格。
  { id: 'k-ejective', label: 'კ（挤喉音 kʼ）' },
  { id: 'p-ejective', label: 'პ（挤喉音 pʼ）' },
  { id: 'tse-ejective', label: 'წ（挤喉音 tsʼ）' },
  { id: 'che-ejective', label: 'ჭ（挤喉音 tʃʼ）' },
  // ── 外缘支流：高加索阿尔巴尼亚、古彼尔姆、埃尔巴桑、维特库奇 ─────────
  // 这四套字母都在希腊字母的辐射圈里，却不是彼此的直系后代：
  //   · 高加索阿尔巴尼亚字母（N4131）——5 世纪为高加索阿尔巴尼亚语造的 52
  //     个字母，按希腊式数值次序排（1-9、10-90、100-900、1000-9000……）；
  //   · 古彼尔姆字母（N4263）——1372 年 Stefan 创制时把希腊／西里尔的次序
  //     连同字母位一起搬过来（提案 §1 说"看字母次序就知道"），字形多取科米
  //     印记符号；
  //   · 埃尔巴桑（N3985）与维特库奇（N5138）——18、19 世纪为阿尔巴尼亚语
  //     造的两套字母，按现代阿尔巴尼亚字母表排，一个音位一个字，字形以新造
  //     为主、带希腊笔调。
  // 所以这条轨道上的格子按"音位位次"排：同一个音位在四套字母里占同一格，
  // 与 varga-* 的做法一致。只有这四套字母自己多出来的音位（挤喉音、擦音、
  // 腭化辅音、央元音……）才在下面另立一格，走过去时从下方飞入。
  // 能接回上面已有槽位的一律接回去——ale（希腊 Α 位）、zhe（西里尔 Ж 位）、
  // schwa（亚美尼亚 Ը 位）、yod-cons（半元音 j 位）、gha（浊擦音 ɣ 位）、
  // chi（希腊 Χ 位）……它们讲的都是"该音位占哪一格"。
  { id: 'per-dzh', label: 'dž（dzhoi / 送气塞擦音）' },
  { id: 'per-dz', label: 'x（dz 的塞擦音位）' },
  { id: 'per-cha', label: '𐔹 ć（cha，硬腭塞擦音）' },
  { id: 'per-zha', label: '𐔻 ź（zha）' },
  { id: 'per-ayn', label: '𐔽 ʕ（sha，咽音）' },
  { id: 'per-inya', label: '𐔿 n’（inya，腭化的 n）' },
  { id: 'per-dyan', label: '𐕁 d’（dyan，腭化的 d）' },
  { id: 'per-lyit', label: '𐕅 l’（lyit，腭化的 l）' },
  { id: 'per-qay', label: '𐕇 x̣（qay，紧喉的 x）' },
  { id: 'per-aor', label: '𐕈 å（aor）' },
  { id: 'per-choy', label: '𐕉 ć（choy，第二个 ć）' },
  { id: 'per-cyay', label: '𐕋 c’（cyay，音值未定）' },
  { id: 'per-dzyay', label: '𐕏 ʒ’（dzyay，音值未定）' },
  { id: 'per-jayn', label: '𐕑 ž（jayn，音值未定）' },
  { id: 'per-tyay', label: '𐕓 ṭ’（tyay）' },
  { id: 'per-dzay', label: '𐕕 ʒ（dzay）' },
  { id: 'per-chat', label: '𐕖 č（chat）' },
  { id: 'per-pen', label: '𐕗 ṗ（pen，第二个 p）' },
  { id: 'per-gheys', label: '𐕘 ġ（gheys）' },
  { id: 'per-shoy', label: '𐕝 ś（shoy，第二个咝音）' },
  { id: 'per-iwn', label: '𐕞 ü（iwn）' },
  { id: 'per-cyaw', label: '𐕟 c’（cyaw，第二个 c’）' },
  { id: 'per-cayn', label: '𐕠 c（cayn，第二个 c）' },
  { id: 'per-piwr', label: '𐕢 p（piwr，第二个 p 字母）' },
  { id: 'per-kiw', label: '𐕣 k（kiw，第二个 k 字母）' },
  { id: 'per-nd', label: '𐔅 nd（前鼻化的 d）' },
  { id: 'per-dh', label: '𐔆 / 𐖝 dh（ð）' },
  { id: 'per-gj', label: '𐔋 / 𐖦 gj（ɟ）' },
  { id: 'per-ll', label: '𐔑 / 𐖪 ll（ɫ）' },
  { id: 'per-n2', label: '𐔔 na（第二个 n，前鼻化位置用）' },
  { id: 'per-nj', label: '𐔕 / 𐖭 nj（ɲ）' },
  { id: 'per-q', label: '𐔘 / 𐖰 q（c）' },
  { id: 'per-rr', label: '𐔚 rr（颤音）' },
  { id: 'per-y', label: '𐔢 / 𐖻 y（圆唇前元音）' },
  { id: 'per-ghamma', label: '𐔦 γ（ghe 之外的第二个 ɣ）' },
  { id: 'per-hha', label: '𐖤 ħ（hha）' },
  { id: 'per-bbe', label: '𐖘 ƀ（bbe，第二个 b 字母）' },
  { id: 'perm-ver', label: '𐍮 v（ver，第二个 v 字母）' },
  { id: 'perm-yeru', label: '𐍨 yeru（yry 的从属形）' },
  // ── 婆罗米系独立元音（svara）───────────────────────────────────────
  // 字音表之前先排元音字母：a ā i ī u ū r̥ r̥̄ l̥ l̥̄ e ai o au 一路下来。
  // 这 18 格在各家的字面与取舍见 src/data/svaraSlots.ts——泰米尔文没有
  // 元音 r、藏文只有 ཨ 一个独立元音，走到那些站时空格就是「消失」。
  ...SVARA_SLOTS,

  // ── 婆罗米系（梵语字音表 varga）─────────────────────────────────────
  // 婆罗米文把梵语的 33 个辅音按发音部位排成五组（五处）：软腭、硬腭、
  // 卷舌、齿、唇，每组五个（鼻音收尾），后面接 4 个半元音、3 个咝音和 ha。
  // 天城文、孟加拉文、泰米尔文、藏文、泰文、缅文……都从这一套字位出发，
  // 逐格对应——泰米尔文缺的、藏文缺的都是它们自己丢掉的音，走"消失"动画。
  { id: 'varga-ka', label: 'ka क（不送气清音）' },
  { id: 'varga-kha', label: 'kha ख（送气清音）' },
  { id: 'varga-ga', label: 'ga ग（不送气浊音）' },
  { id: 'varga-gha', label: 'gha घ（送气浊音）' },
  { id: 'varga-nga', label: 'nga ङ（软腭鼻音）' },
  { id: 'varga-ca', label: 'ca च（硬腭不送气清音）' },
  { id: 'varga-cha', label: 'cha छ（硬腭送气清音）' },
  { id: 'varga-ja', label: 'ja ज（硬腭不送气浊音）' },
  { id: 'varga-jha', label: 'jha झ（硬腭送气浊音）' },
  { id: 'varga-nya', label: 'ña ञ（硬腭鼻音）' },
  { id: 'varga-tta', label: 'ṭa ट（卷舌不送气清音）' },
  { id: 'varga-ttha', label: 'ṭha ठ（卷舌送气清音）' },
  { id: 'varga-dda', label: 'ḍa ड（卷舌不送气浊音）' },
  { id: 'varga-ddha', label: 'ḍha ढ（卷舌送气浊音）' },
  { id: 'varga-nna', label: 'ṇa ण（卷舌鼻音）' },
  { id: 'varga-ta', label: 'ta त（齿不送气清音）' },
  { id: 'varga-tha', label: 'tha थ（齿送气清音）' },
  { id: 'varga-da', label: 'da द（齿不送气浊音）' },
  { id: 'varga-dha', label: 'dha ध（齿送气浊音）' },
  { id: 'varga-na', label: 'na न（齿鼻音）' },
  { id: 'varga-pa', label: 'pa प（唇不送气清音）' },
  { id: 'varga-pha', label: 'pha फ（唇送气清音）' },
  { id: 'varga-ba', label: 'ba ब（唇不送气浊音）' },
  { id: 'varga-bha', label: 'bha भ（唇送气浊音）' },
  { id: 'varga-ma', label: 'ma म（唇鼻音）' },
  { id: 'varga-ya', label: 'ya य（半元音 y）' },
  { id: 'varga-ra', label: 'ra र（半元音 r）' },
  { id: 'varga-la', label: 'la ल（半元音 l）' },
  { id: 'varga-va', label: 'va व（半元音 v）' },
  { id: 'varga-sha', label: 'śa श（硬腭咝音）' },
  { id: 'varga-ssa', label: 'ṣa ष（卷舌咝音）' },
  { id: 'varga-sa', label: 'sa स（齿咝音）' },
  { id: 'varga-ha', label: 'ha ह（浊喉擦音）' },

  // 梵语 33 音之外的边音与 r 类音位：这是一格"各家自己添的音"。
  // 南印诸文在这里放 ḷa（ள）、ḻa（ழ）、ṟa（ற）、ṉa（ன）；僧伽罗、高棉、
  // 泰、老、缅放巴利的 ḷa（ළ ឡ ฬ ຬ ဠ）；天城、古吉拉特各补一个 ळ；信德诸支
  // 放的是内爆音与地方卷舌音。婆罗米文本里这四格直接有编码，名字就叫
  // Old Tamil LLA / LLLA / RRA / NNNA——所以从婆罗米一路走到南印、暹罗诸文，
  // 有的格逐格变形，没有的格走增删动画。
  { id: 'varga-lla', label: 'ḷa ळ（卷舌边音）' },
  { id: 'varga-llla', label: 'ḻa ழ（卷舌边擦音，泰米尔—马拉雅拉姆的 ழ）' },
  { id: 'varga-rra', label: 'ṛa / ṟa ड़（r 之外另立的闪音或颤音）' },
  { id: 'varga-nnna', label: 'ṉa ன（齿龈鼻音，泰米尔的 ன）' },
  // 夏拉达—信德诸支自己添的字母位：夏拉达与它的后身（塔克里、多格拉、
  // 霍杰基、穆尔塔尼、胡达瓦迪、马哈贾尼）在梵语 33 音之外还留了几个字母，
  // 大多是信德语特有的内爆音（ɓ ɗ ɠ ʄ，写成在基字下加小钩）与地方卷舌音。
  { id: 'varga-gga', label: 'ɠa（信德内爆音，g 加钩）' },
  { id: 'varga-jja', label: 'ʄa（信德内爆音，j 加钩）' },
  { id: 'varga-ddda', label: 'ɗa（信德内爆音，d 加钩）' },
  { id: 'varga-bba', label: 'ɓa（信德内爆音，b 加钩）' },
  { id: 'varga-rha', label: 'ṛha ढ़（卷舌送气闪音）' },
  { id: 'varga-qa', label: 'qa क़（借自波斯语的外来音）' },
  { id: 'varga-khaa', label: 'kha 古体（塔克里的古写 kha）' },
  // 尼瓦尔文为尼泊尔巴沙语留的浊送音（murmured）：nga、nya、na、ma、la
  // 各自分出一个带气声的字面，另外五个槽位。带气声的卷舌闪音 rha 用的
  // 就是上面那个 varga-rha，不再另立。
  { id: 'varga-ngha', label: 'ṅha（尼瓦尔语的浊送鼻音）' },
  { id: 'varga-nyha', label: 'ñha（尼瓦尔语的浊送鼻音）' },
  { id: 'varga-nha', label: 'nha（尼瓦尔语的浊送鼻音）' },
  { id: 'varga-mha', label: 'mha（尼瓦尔语的浊送鼻音）' },
  { id: 'varga-lha', label: 'lha（尼瓦尔语的浊送边音）' },

  // ── 东南亚本语字母：泰、老、高棉、缅在梵语 33 音之外自己添的字 ────────
  // 泰文与老挝文的字母表比梵语音位表长：两文把 ข ค ผ พ ห 一类的字加一笔或换
  // 一个部件，分出 /s/ /f/ /d/ /b/ /h/ 这些本语要用的音；ฎ ด บ 三字来自印度的
  // ḍa、da、ba，但在两文里与 ฏ ต ป 清浊成对、另占一格。高棉的 អ、泰的 อ、
  // 老的 ອ 都是婆罗米独立元音 a 的后身，在本族文字里既当声门塞音又当元音载体；
  // 泰文另有两个写开来的元音字母 ฤ ฦ（见 svaraSlots.ts）。这些字母在别的
  // 婆罗米系文字里没有对应格，走到泰文／老挝文这一站时从下方飞入。
  { id: 'varga-khuat', label: 'ฃ xo khuat（泰文的古 kha，由 ข 派生，今已废弃）' },
  { id: 'varga-khon', label: 'ฅ xo khon（泰文的古 kha，由 ค 派生，今已废弃）' },
  { id: 'varga-so-so', label: 'ซ so so（泰文的 /s/，由 ช 派生）' },
  { id: 'varga-do-chada', label: 'ฎ do chada（泰文的 /d/，与 ฏ 清浊成对）' },
  { id: 'varga-do-dek', label: 'ด do dek（泰文的 /d/）· ດ do（老挝文）' },
  { id: 'varga-bo-baimai', label: 'บ bo baimai（泰文的 /b/）· ບ bo（老挝文）' },
  { id: 'varga-fo-ta', label: 'ฝ fo ta（泰文高调 /f/，由 ผ 派生）· ຝ fo tam（老挝文）' },
  { id: 'varga-fo-fan', label: 'ฟ fo fan（泰文低调 /f/，由 พ 派生）· ຟ fo sung（老挝文）' },
  { id: 'varga-o-ang', label: 'อ o ang（泰文）· ອ o（老挝文）· អ QA（高棉文）——婆罗米独立元音 a 的后身，兼作声门塞音与元音载体' },
  { id: 'varga-ho-nokhuk', label: 'ฮ ho nokhuk（泰文低调 /h/，由 ห 派生）· ຮ ho tam（老挝文）' },
  { id: 'varga-nyo', label: 'ຍ nyo（老挝文的 /ɲ/）· ည nnya（缅文）——与巴利系列的 ຎ / ဉ 分工' },

  // ── 缅文字母系统为其他语言添的字 ────────────────────────────────
  // 缅文用的是 Unicode 的 Myanmar 区块，同一区块里还收了孟语、掸语（傣耶）、
  // 斯高克伦语、西波与东波克伦语、勃欧语（儒玛瑞）自己的字母——它们不是
  // 缅文的词形变体，而是各语言按本语音位另造的字。这些格子只在缅文这一站
  // 出现，走到它时一并飞入。
  { id: 'varga-mran-mon-nga', label: 'ၚ mon nga（孟语的 ŋa，与缅文的 င 分工）' },
  { id: 'varga-mran-mon-jha', label: 'ၛ mon jha（孟语读巴利语借词用的 jha）' },
  { id: 'varga-mran-mon-bba', label: 'ၜ mon bba（孟语的 bba）' },
  { id: 'varga-mran-mon-bbe', label: 'ၝ mon bbe（孟语的 bbe）' },
  { id: 'varga-mran-mon-e', label: 'ဨ mon e（孟语的 e）' },
  { id: 'varga-mran-great-sa', label: 'ဿ great sa（孟语与古缅语合写的 ssa）' },
  { id: 'varga-mran-karen-sha', label: 'ၡ sgaw karen sha（斯高克伦语的 sha）' },
  { id: 'varga-mran-karen-tha', label: 'ၥ western pwo karen tha（西波克伦语的 tha）' },
  { id: 'varga-mran-karen-pwa', label: 'ၦ western pwo karen pwa（西波克伦语的 pwa）' },
  { id: 'varga-mran-pwo-nna', label: 'ၮ eastern pwo karen nna（东波克伦语的 nna）' },
  { id: 'varga-mran-pwo-ywa', label: 'ၯ eastern pwo karen ywa（东波克伦语的 ywa）' },
  { id: 'varga-mran-pwo-ghwa', label: 'ၰ eastern pwo karen ghwa（东波克伦语的 ghwa）' },
  { id: 'varga-mran-shan-a', label: 'ဢ shan a（掸语的 a，兼作声门塞音与元音载体）' },
  { id: 'varga-mran-shan-ka', label: 'ၵ shan ka（掸语的 ka）' },
  { id: 'varga-mran-shan-kha', label: 'ၶ shan kha（掸语的 kha）' },
  { id: 'varga-mran-shan-ga', label: 'ၷ shan ga（掸语的 ga）' },
  { id: 'varga-mran-shan-ca', label: 'ၸ shan ca（掸语的 ca）' },
  { id: 'varga-mran-shan-za', label: 'ၹ shan za（掸语的 za）' },
  { id: 'varga-mran-shan-nya', label: 'ၺ shan nya（掸语的 nya）' },
  { id: 'varga-mran-shan-da', label: 'ၻ shan da（掸语的 da）' },
  { id: 'varga-mran-shan-na', label: 'ၼ shan na（掸语的 na）' },
  { id: 'varga-mran-shan-pha', label: 'ၽ shan pha（掸语的 pha）' },
  { id: 'varga-mran-shan-fa', label: 'ၾ shan fa（掸语的 fa）' },
  { id: 'varga-mran-shan-ba', label: 'ၿ shan ba（掸语的 ba）' },
  { id: 'varga-mran-shan-tha', label: 'ႀ shan tha（掸语的 tha）' },
  { id: 'varga-mran-shan-ha', label: 'ႁ shan ha（掸语的 ha）' },
  { id: 'varga-mran-palaung-fa', label: 'ႎ rumai palaung fa（勃欧语的 fa）' },

  // ── 南亚与海岛文字在梵语字音表之外自己添的字母 ─────────────────────
  // 这些是各文字字母表里真实存在、但与梵语 33 个音位对不上的字：藏文的
  // 塞擦音 ཙ ཚ ཛ 与擦音 ཞ ཟ、元音载体 འ，马拉雅拉姆文的九个 chillu
  // （词末辅音写法），僧伽罗语的鼻化浊音与 ෆ，爪哇语、巴厘语为古爪哇语与
  // 萨萨克语另造的字母。它们在别的文字里没有对应格，走到那一站时成组飞入。
  // 藏文的 jha 是组合字 ཛྷ，Unicode 没有单字，仍留空。
  { id: 'varga-tsa', label: 'tsa ཙ（藏文的塞擦音，梵语 च 的转写字面）' },
  { id: 'varga-tsha', label: 'tsha ཚ（藏文的送气塞擦音，梵语 छ 的转写字面）' },
  { id: 'varga-dza', label: 'dza ཛ（藏文的浊塞擦音，梵语 ज 的转写字面）' },
  { id: 'varga-zha', label: 'zha ཞ（藏文的浊擦音）' },
  { id: 'varga-za', label: 'za ཟ（藏文的浊齿擦音）' },
  { id: 'varga-a-chung', label: "a-chung འ（藏文的 -a，兼作元音载体）" },
  { id: 'varga-kka', label: 'kka ཫ（藏文为外来音添的 ka）' },
  { id: 'varga-rra-tib', label: 'rra ཬ（藏文为外来音添的 ra）' },
  { id: 'varga-chillu-nn', label: 'chillu nn ൺ（马拉雅拉姆词的末 ṇa 写法）' },
  { id: 'varga-chillu-n', label: 'chillu n ൻ（马拉雅拉姆词的末 na 写法）' },
  { id: 'varga-chillu-rr', label: 'chillu rr ർ（马拉雅拉姆词的末 ra 写法）' },
  { id: 'varga-chillu-l', label: 'chillu l ൽ（马拉雅拉姆词的末 la 写法）' },
  { id: 'varga-chillu-ll', label: 'chillu ll ൾ（马拉雅拉姆词的末 ḷa 写法）' },
  { id: 'varga-chillu-k', label: 'chillu k ൿ（马拉雅拉姆词的末 ka 写法）' },
  { id: 'varga-chillu-m', label: 'chillu m ൔ（马拉雅拉姆词的末 ma 写法）' },
  { id: 'varga-chillu-y', label: 'chillu y ൕ（马拉雅拉姆词的末 ya 写法）' },
  { id: 'varga-chillu-lll', label: 'chillu lll ൖ（马拉雅拉姆词的末 ḻa 写法）' },
  { id: 'varga-sinhala-gga', label: 'n̆ga ඟ（僧伽罗语的鼻化浊 g）' },
  { id: 'varga-sinhala-jnya', label: 'jña ඥ（僧伽罗语合写的 ña+ja）' },
  { id: 'varga-sinhala-jja', label: 'n̆ja ඦ（僧伽罗语的鼻化浊 j）' },
  { id: 'varga-sinhala-dda', label: 'n̆ḍa ඬ（僧伽罗语的鼻化浊 ḍ）' },
  { id: 'varga-sinhala-da', label: 'n̆da ඳ（僧伽罗语的鼻化浊 d）' },
  { id: 'varga-sinhala-ba', label: 'm̆ba ඹ（僧伽罗语的鼻化浊 b）' },
  { id: 'varga-sinhala-fa', label: 'fa ෆ（僧伽罗语为外来音添的 f）' },
  { id: 'varga-java-i-kawi', label: 'i kawi ꦅ（古爪哇语与爪哇语分写的 i）' },
  { id: 'varga-java-pa-cerek', label: 'pa cerek ꦉ（爪哇语的 /rə/ 字面）' },
  { id: 'varga-java-nga-lelet', label: 'nga lelet ꦊ（爪哇语的 /lə/ 字面）' },
  { id: 'varga-java-nga-lelet-raswadi', label: 'nga lelet raswadi ꦋ（爪哇语的 /l̥/ 字面）' },
  { id: 'varga-java-ka-sasak', label: 'ka sasak ꦐ（爪哇语为萨萨克语添的 ka）' },
  { id: 'varga-java-ra-agung', label: 'ra agung ꦬ（爪哇语的 re 字面）' },
  { id: 'varga-balinese-kaf-sasak', label: 'kaf sasak ᭅ（巴厘文为萨萨克语添的 k）' },
  { id: 'varga-balinese-khot-sasak', label: 'khot sasak ᭆ（巴厘文为萨萨克语添的 kh）' },
  { id: 'varga-balinese-tzir-sasak', label: 'tzir sasak ᭇ（巴厘文为萨萨克语添的 ts）' },
  { id: 'varga-balinese-ef-sasak', label: 'ef sasak ᭈ（巴厘文为萨萨克语添的 f）' },
  { id: 'varga-balinese-ve-sasak', label: 've sasak ᭉ（巴厘文为萨萨克语添的 v）' },
  { id: 'varga-balinese-zal-sasak', label: 'zal sasak ᭊ（巴厘文为萨萨克语添的 z）' },
  { id: 'varga-balinese-asyura-sasak', label: 'asyura sasak ᭋ（巴厘文为萨萨克语添的 ʕ）' },


  // ── 假名（五十音）：汉字借字 → 平假名 → 片假名 ───────────────────
  // 格子的身份是"音节"而不是字源：一个音占一格，三种写法在同一格里换。
  // 这与上面 varga-* 的做法一致——读音对得上就同格，读音对不上才另立。
  // 平假名出自借字的整字草书，片假名出自借字的一个部件，两边常常挑的不是
  // 同一个汉字（え 取「衣」、エ 取「江」），所以格子名把两种借字都记下来。
  { id: 'kana-a', label: 'あ / ア（安 · 阿）' },
  { id: 'kana-i', label: 'い / イ（以 · 伊）' },
  { id: 'kana-u', label: 'う / ウ（宇）' },
  { id: 'kana-e', label: 'え / エ（衣 · 江）' },
  { id: 'kana-o', label: 'お / オ（於）' },
  { id: 'kana-ka', label: 'か / カ（加）' },
  { id: 'kana-ki', label: 'き / キ（幾）' },
  { id: 'kana-ku', label: 'く / ク（久）' },
  { id: 'kana-ke', label: 'け / ケ（計 · 介）' },
  { id: 'kana-ko', label: 'こ / コ（己）' },
  { id: 'kana-sa', label: 'さ / サ（左 · 散）' },
  { id: 'kana-shi', label: 'し / シ（之）' },
  { id: 'kana-su', label: 'す / ス（寸 · 須）' },
  { id: 'kana-se', label: 'せ / セ（世）' },
  { id: 'kana-so', label: 'そ / ソ（曽）' },
  { id: 'kana-ta', label: 'た / タ（太 · 多）' },
  { id: 'kana-chi', label: 'ち / チ（知 · 千）' },
  { id: 'kana-tsu', label: 'つ / ツ（川）' },
  { id: 'kana-te', label: 'て / テ（天）' },
  { id: 'kana-to', label: 'と / ト（止）' },
  { id: 'kana-na', label: 'な / ナ（奈）' },
  { id: 'kana-ni', label: 'に / ニ（仁 · 二）' },
  { id: 'kana-nu', label: 'ぬ / ヌ（奴）' },
  { id: 'kana-ne', label: 'ね / ネ（祢）' },
  { id: 'kana-no', label: 'の / ノ（乃）' },
  { id: 'kana-ha', label: 'は / ハ（波 · 八）' },
  { id: 'kana-hi', label: 'ひ / ヒ（比）' },
  { id: 'kana-fu', label: 'ふ / フ（不）' },
  { id: 'kana-he', label: 'へ / ヘ（部）' },
  { id: 'kana-ho', label: 'ほ / ホ（保）' },
  { id: 'kana-ma', label: 'ま / マ（末 · 万）' },
  { id: 'kana-mi', label: 'み / ミ（美 · 三）' },
  { id: 'kana-mu', label: 'む / ム（武 · 牟）' },
  { id: 'kana-me', label: 'め / メ（女）' },
  { id: 'kana-mo', label: 'も / モ（毛）' },
  { id: 'kana-ya', label: 'や / ヤ（也）' },
  { id: 'kana-yu', label: 'ゆ / ユ（由）' },
  { id: 'kana-yo', label: 'よ / ヨ（与）' },
  { id: 'kana-ra', label: 'ら / ラ（良）' },
  { id: 'kana-ri', label: 'り / リ（利）' },
  { id: 'kana-ru', label: 'る / ル（留 · 流）' },
  { id: 'kana-re', label: 'れ / レ（礼）' },
  { id: 'kana-ro', label: 'ろ / ロ（呂）' },
  { id: 'kana-wa', label: 'わ / ワ（和）' },
  { id: 'kana-wi', label: 'ゐ / ヰ（為 · 井）' },
  { id: 'kana-we', label: 'ゑ / ヱ（恵）' },
  { id: 'kana-wo', label: 'を / ヲ（遠 · 乎）' },
  { id: 'kana-n', label: 'ん / ン（无 · 尓）' },
  // 浊音与半浊音是给假名加符号造出来的，没有各自的借字：走到假名那一步时
  // 它们从下方飞入，被看作这套音节表的"新增字母"。
  { id: 'kana-ga', label: 'が / ガ（か + 濁点）' },
  { id: 'kana-gi', label: 'ぎ / ギ（き + 濁点）' },
  { id: 'kana-gu', label: 'ぐ / グ（く + 濁点）' },
  { id: 'kana-ge', label: 'げ / ゲ（け + 濁点）' },
  { id: 'kana-go', label: 'ご / ゴ（こ + 濁点）' },
  { id: 'kana-za', label: 'ざ / ザ（さ + 濁点）' },
  { id: 'kana-ji', label: 'じ / ジ（し + 濁点）' },
  { id: 'kana-zu', label: 'ず / ズ（す + 濁点）' },
  { id: 'kana-ze', label: 'ぜ / ゼ（せ + 濁点）' },
  { id: 'kana-zo', label: 'ぞ / ゾ（そ + 濁点）' },
  { id: 'kana-da', label: 'だ / ダ（た + 濁点）' },
  { id: 'kana-di', label: 'ぢ / ヂ（ち + 濁点）' },
  { id: 'kana-du', label: 'づ / ヅ（つ + 濁点）' },
  { id: 'kana-de', label: 'で / デ（て + 濁点）' },
  { id: 'kana-do', label: 'ど / ド（と + 濁点）' },
  { id: 'kana-ba', label: 'ば / バ（は + 濁点）' },
  { id: 'kana-bi', label: 'び / ビ（ひ + 濁点）' },
  { id: 'kana-bu', label: 'ぶ / ブ（ふ + 濁点）' },
  { id: 'kana-be', label: 'べ / ベ（へ + 濁点）' },
  { id: 'kana-bo', label: 'ぼ / ボ（ほ + 濁点）' },
  { id: 'kana-pa', label: 'ぱ / パ（は + 濁点）' },
  { id: 'kana-pi', label: 'ぴ / ピ（ひ + 濁点）' },
  { id: 'kana-pu', label: 'ぷ / プ（ふ + 濁点）' },
  { id: 'kana-pe', label: 'ぺ / ペ（へ + 濁点）' },
  { id: 'kana-po', label: 'ぽ / ポ（ほ + 濁点）' },
];

/** 文字的字母表顺序 → 槽位。键是槽位 id，值是这一文字里的字符。 */
const coreLetterMaps: Record<string, Record<string, string>> = {
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

  // 古希伯来字母：Unicode 与腓尼基共用 U+10900 一节，22 个字母逐一对应。
  // 撒玛利亚人与圣殿时期的犹太人守着这套字面，没有改用后来从阿拉米长出来的
  // 方形希伯来字母，所以这一站与腓尼基几乎重合，分歧要到撒玛利亚那一站才出现。
  'paleo-hebrew': {
    aleph: '𐤀',
    beth: '𐤁',
    gimel: '𐤂',
    daleth: '𐤃',
    he: '𐤄',
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

  // 叙利亚字母：22 个字母与阿拉米一一对应，取孤立形（词首、词中、词尾还有
  // 各自的连写形，是同一字母的变体，不进对照表）。此外还有十字：迦尔舒尼文
  // （用叙利亚字母写阿拉伯语）添了 ܔ ܜ ܞ ܧ，波斯语添了 ܭ ܮ ܯ，写粟特语时
  // 添了 ݍ ݎ ݏ——它们各占一格，槽位紧跟母字，走到叙利亚这一站时飞入。
  syriac: {
    aleph: 'ܐ',
    beth: 'ܒ',
    'persian-bheth': 'ܭ',
    gimel: 'ܓ',
    'gamal-garshuni': 'ܔ',
    'persian-ghamal': 'ܮ',
    daleth: 'ܕ',
    'persian-dhalath': 'ܯ',
    he: 'ܗ',
    waw: 'ܘ',
    digamma: 'ܘ',
    zayin: 'ܙ',
    'sogdian-zhain': 'ݍ',
    heth: 'ܚ',
    teth: 'ܛ',
    'teth-garshuni': 'ܜ',
    yodh: 'ܝ',
    'yudh-he': 'ܞ',
    kaph: 'ܟ',
    'sogdian-khaph': 'ݎ',
    lamedh: 'ܠ',
    mem: 'ܡ',
    nun: 'ܢ',
    samekh: 'ܣ',
    ayin: 'ܥ',
    pe: 'ܦ',
    'reversed-pe': 'ܧ',
    'sogdian-fe': 'ݏ',
    sadhe: 'ܨ',
    qoph: 'ܩ',
    resh: 'ܪ',
    shin: 'ܫ',
    taw: 'ܬ',
  },

  // 摩尼字母：摩尼教为抄写中古伊朗语、回鹘语造的书体，骨架承自叙利亚字母。
  // 22 个阿拉米字母都能对上叙利亚，只是摩尼把它们分写得更细，另造 14 个
  // 字面（见 mani-* 槽位）。Unicode 的 Manichaean 区块一共 36 个字母。
  manichaean: {
    aleph: '𐫀',
    beth: '𐫁',
    gimel: '𐫃',
    daleth: '𐫅',
    he: '𐫆',
    waw: '𐫇',
    digamma: '𐫇',
    zayin: '𐫉',
    heth: '𐫍',
    teth: '𐫎',
    yodh: '𐫏',
    kaph: '𐫐',
    lamedh: '𐫓',
    mem: '𐫖',
    nun: '𐫗',
    samekh: '𐫘',
    ayin: '𐫙',
    pe: '𐫛',
    sadhe: '𐫝',
    qoph: '𐫞',
    resh: '𐫡',
    shin: '𐫢',
    taw: '𐫤',
    'mani-bheth': '𐫂',
    'mani-ghimel': '𐫄',
    'mani-zhayin': '𐫊',
    'mani-jayin': '𐫋',
    'mani-jhayin': '𐫌',
    'mani-xaph': '𐫑',
    'mani-khaph': '𐫒',
    'mani-dhamedh': '𐫔',
    'mani-thamedh': '𐫕',
    'mani-aayin': '𐫚',
    'mani-fe': '𐫜',
    'mani-xoph': '𐫟',
    'mani-qhoph': '𐫠',
    'mani-sshin': '𐫣',
  },

  // 吉兹字母：古南阿拉伯字母的后身，今用于阿姆哈拉语、提格里尼亚语等。
  // Unicode 的 Ethiopic 区块把字母排成 43 辅音 × 8 元音的音节矩阵，这里只取
  // 26 个辅音的第一式（辅音 + ä）——元音式是同一字母的附标变化，不算新字母。
  // 对照按音值走（见 gez-* 槽位的说明），不主张一处一处的字形承袭。
  geez: {
    he: 'ሀ',
    lamedh: 'ለ',
    heth: 'ሐ',
    mem: 'መ',
    resh: 'ረ',
    samekh: 'ሰ',
    qoph: 'ቀ',
    beth: 'በ',
    taw: 'ተ',
    kha: 'ኀ',
    nun: 'ነ',
    aleph: 'አ',
    kaph: 'ከ',
    waw: 'ወ',
    ayin: 'ዐ',
    zayin: 'ዘ',
    yodh: 'የ',
    daleth: 'ደ',
    gimel: 'ገ',
    teth: 'ጠ',
    sadhe: 'ጸ',
    dad: 'ፀ',
    pe: 'ፈ',
    'gez-sza': 'ሠ',
    'gez-pha': 'ጰ',
    'gez-pa': 'ፐ',
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
  // 阿拉伯字母表：28 个字母，外加各语言在阿拉伯字母上加笔画造的字。
  // 波斯、乌尔都、信德、普什图、库尔德、维吾尔、柯尔克孜、克什米尔都用阿拉伯
  // 字母写自己的语言，各自补了本语要用的音位；这些字占的槽位紧跟它们的母字
  // （پ 跟在 ب 后、چ ژ 跟在 ج ز 后、گ 跟在 ک 后，诸如此类），走到阿拉伯这一站
  // 时一起飞入。同一个字母的词首／词中／词尾写法不进表。
  arabic: {
    aleph: 'ا',
    hamza: 'ء',
    'alef-wasla': 'ٱ',
    beth: 'ب',
    peh: 'پ',
    veh: 'ڤ',
    beeh: 'ٻ',
    beheh: 'ڀ',
    gimel: 'ج',
    tcheh: 'چ',
    tcheheh: 'ڇ',
    dyeh: 'ڄ',
    daleth: 'د',
    ddal: 'ڈ',
    dahal: 'ڌ',
    ddahal: 'ڍ',
    dul: 'ڎ',
    dhal: 'ذ',
    he: 'ه',
    'heh-doachashmee': 'ھ',
    'heh-goal': 'ہ',
    ae: 'ە',
    waw: 'و',
    u: 'ۇ',
    oe: 'ۆ',
    'waw-yu': 'ۈ',
    ve: 'ۋ',
    'kirghiz-oe': 'ۅ',
    'kirghiz-yu': 'ۉ',
    zayin: 'ز',
    jeh: 'ژ',
    heth: 'ح',
    kha: 'خ',
    teth: 'ط',
    zah: 'ظ',
    yodh: 'ي',
    'alef-maksura': 'ى',
    'farsi-yeh': 'ی',
    e: 'ې',
    'yeh-barree': 'ے',
    'kashmiri-yeh': 'ؠ',
    kaph: 'ك',
    keheh: 'ک',
    'swash-kaf': 'ڪ',
    gaf: 'گ',
    gueh: 'ڳ',
    lamedh: 'ل',
    mem: 'م',
    nun: 'ن',
    nyeh: 'ڃ',
    ng: 'ڭ',
    ngoeh: 'ڱ',
    'noon-ghunna': 'ں',
    rnoon: 'ڻ',
    samekh: 'س',
    ayin: 'ع',
    ghayn: 'غ',
    pe: 'ف',
    peheh: 'ڦ',
    sadhe: 'ص',
    dad: 'ض',
    qoph: 'ق',
    resh: 'ر',
    rreh: 'ڑ',
    shin: 'ش',
    taw: 'ت',
    tha: 'ث',
    'teh-marbuta': 'ة',
    'teh-marbuta-goal': 'ۃ',
    tteh: 'ٹ',
    tteheh: 'ٺ',
    teheh: 'ٿ',
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
  // 吕基亚字母：29 个，字母表模型来自希腊（多利安—罗得岛一带），
  // 又为安纳托利亚语补了本地字母。音值照 Melchert 2004 与 Swiggers &
  // Jenniges 1996 的对照表：a e b β g d i w z θ j k q l m n m̥ n̥ u p k r s t t ã ẽ h χ。
  // 接得回希腊的 20 个写在希腊槽位里——W /w/ 接的是 Ϝ（digamma），U /u/ 接
  // 的是 Υ，TH /θ/ 接 Θ，X /χ/ 接 Χ，H /h/ 接上面那个 h 槽（希腊字母表里
  // 本来没有给 /h/ 留正位）。其余 9 个是本地新造的字，各占一格。
  lycian: {
    aleph: '𐊀', // A a
    he: '𐊁', // E e
    beth: '𐊂', // B b
    'lyc-bh': '𐊃', // BH β
    gimel: '𐊄', // G g
    daleth: '𐊅', // D d
    yodh: '𐊆', // I i
    digamma: '𐊇', // W w
    zayin: '𐊈', // Z z
    teth: '𐊉', // TH θ
    'lyc-j': '𐊊', // J j
    kaph: '𐊋', // K k
    qoph: '𐊌', // Q q
    lamedh: '𐊍', // L l
    mem: '𐊎', // M m
    nun: '𐊏', // N n
    'lyc-mm': '𐊐', // MM m̥
    'lyc-nn': '𐊑', // NN n̥
    waw: '𐊒', // U u
    pe: '𐊓', // P p
    'lyc-kk': '𐊔', // KK k
    resh: '𐊕', // R r
    shin: '𐊖', // S s
    taw: '𐊗', // T t
    'lyc-tt': '𐊘', // TT t
    'nasal-an': '𐊙', // AN ã
    'nasal-en': '𐊚', // EN ẽ
    h: '𐊛', // H h
    chi: '𐊜', // X χ
  },

  // 吕底亚字母：26 个，同样以希腊字母为模型，书写方向从右到左。
  // Unicode 的字母名与 Melchert 2004c 的音值列不完全对应，音值照后者：
  // a b g d(/ð/) e v i y k l m n o r ś t u f q(/kʷ/) s τ(/tʷ/) ã ẽ λ ν c。
  // 两点要留意：
  //  · F 的音值是 /f/，接的却是 Ϝ（digamma）：这支字母在吕底亚从 /w/ 转成
  //    了 /f/，与拉丁 F、古意大利 EF 同一条线索（N3019R 提案里也这么说）；
  //  · 两个咝音里，<s> 𐤳 接希腊 Σ，<ś> 𐤮 另立一格。Melchert 的音值列把
  //    [s] 挂在 ś 上、把 [ç] 挂在 s 上，但字母是逐个对着希腊模型借来的，
  //    这里按字母位次而不是按音值对接。
  lydian: {
    aleph: '𐤠', // A a
    beth: '𐤡', // B b
    gimel: '𐤢', // G g
    daleth: '𐤣', // D d
    he: '𐤤', // E e
    'lyd-v': '𐤥', // V v
    yodh: '𐤦', // I i
    'lyd-y': '𐤧', // Y y
    kaph: '𐤨', // K k
    lamedh: '𐤩', // L l
    mem: '𐤪', // M m
    nun: '𐤫', // N n
    ayin: '𐤬', // O o
    resh: '𐤭', // R r
    'lyd-ss': '𐤮', // SS ś
    taw: '𐤯', // T t
    waw: '𐤰', // U u
    digamma: '𐤱', // F f（digamma 的后身）
    qoph: '𐤲', // Q q
    shin: '𐤳', // S s
    'lyd-tt': '𐤴', // TT τ
    'nasal-an': '𐤵', // AN ã
    'nasal-en': '𐤶', // EN ẽ
    'lyd-ly': '𐤷', // LY λ
    'lyd-nn': '𐤸', // NN ν
    'lyd-c': '𐤹', // C c
  },

  // 伊特鲁里亚字母：Unicode 把伊特鲁里亚收在 Old Italic 区块最靠前的 27 个
  // 码位上。它是罗马字母的直接来源——拉丁的 a b c d e f 骨架就落在这套字母
  // 上。能接回希腊的 26 格写进希腊槽位，另有两点要留意：
  //  · EKS 𐌗 接希腊 Χ、KHE 𐌙 接希腊 Ψ。优卑亚的西方希腊字母里 Χ 读 /ks/、
  //    Ψ 读 /kʰ/，与东方（雅典）用法互换；伊特鲁里亚照西方读法借走，音值
  //    也就照西方记（Unicode 第 8 章 Old Italic 一节的原话）；
  //  · EF 𐌚 是伊特鲁里亚自己添的 /f/ 字，希腊字母表里没有这一位，另占一格，
  //    走到这一站时飞入；
  //  · 伊特鲁里亚没有希腊 Ω 的位置，omega 一格在这一站消失。
  etruscan: {
    aleph: '𐌀',
    beth: '𐌁',
    gimel: '𐌂',
    daleth: '𐌃',
    he: '𐌄',
    digamma: '𐌅',
    zayin: '𐌆',
    heth: '𐌇',
    teth: '𐌈',
    yodh: '𐌉',
    kaph: '𐌊',
    lamedh: '𐌋',
    mem: '𐌌',
    nun: '𐌍',
    samekh: '𐌎',
    ayin: '𐌏',
    pe: '𐌐',
    sadhe: '𐌑',
    qoph: '𐌒',
    resh: '𐌓',
    shin: '𐌔',
    taw: '𐌕',
    waw: '𐌖',
    chi: '𐌗',
    phi: '𐌘',
    psi: '𐌙',
    'ital-ef': '𐌚',
  },

  // 古意大利字母：Unicode 把半岛各家的字母收进同一个区块，一共 35 个字母。
  // 它与伊特鲁里亚共用码位，所以两站之间同源的 27 格笔画不再变（Unicode
  // 明文要求，同一个字形要按语言换用对应字体的变体字面），变的只是各家新添
  // 的那 8 格——它们从下方飞入，把整套字母表补到一个全。
  'old-italic': {
    aleph: '𐌀',
    beth: '𐌁',
    gimel: '𐌂',
    daleth: '𐌃',
    he: '𐌄',
    digamma: '𐌅',
    zayin: '𐌆',
    heth: '𐌇',
    teth: '𐌈',
    yodh: '𐌉',
    kaph: '𐌊',
    lamedh: '𐌋',
    mem: '𐌌',
    nun: '𐌍',
    samekh: '𐌎',
    ayin: '𐌏',
    pe: '𐌐',
    sadhe: '𐌑',
    qoph: '𐌒',
    resh: '𐌓',
    shin: '𐌔',
    taw: '𐌕',
    waw: '𐌖',
    chi: '𐌗',
    phi: '𐌘',
    psi: '𐌙',
    'ital-ef': '𐌚',
    'ital-ers': '𐌛',
    'ital-che': '𐌜',
    'ital-ii': '𐌝',
    'ital-uu': '𐌞',
    'ital-ess': '𐌟',
    'ital-ye': '𐌭',
    'ital-n-tse': '𐌮',
    'ital-s-tse': '𐌯',
  },

  // 卢恩字母：Unicode 区块 U+16A0–U+16F8 一共 83 个字母（另有 3 个标点、
  // 3 个数字符号不在字母表内）。开头 24 个是老弗萨克（Elder Futhark），
  // 其中 19 格按转写接回上面已经有的槽位：f u a r k g h n i p z s t b e m
  // l d o 一路对上 digamma / waw / aleph / resh / kaph / gai / heth / nun /
  // yodh / pe / zayin / shin / taw / beth / he / mem / lamedh / daleth / ayin。
  // 剩下 þ w j ï ŋ 五个音拉丁字母表里没有，另立 run-* 槽位；再往后是 futhorc、
  // younger futhark 与中世纪卢恩添的 59 个字面，也是各占一格。走到卢恩这一
  // 站时它们整批从下方飞入。
  runic: {
    digamma: 'ᚠ', // f fehu
    waw: 'ᚢ', // u uruz
    'run-thurisaz': 'ᚦ', // þ thurisaz
    aleph: 'ᚨ', // a ansuz
    resh: 'ᚱ', // r raido
    kaph: 'ᚲ', // k kauna
    gai: 'ᚷ', // g gebo
    'run-wunjo': 'ᚹ', // w wunjo
    heth: 'ᚺ', // h hagalaz
    nun: 'ᚾ', // n naudiz
    yodh: 'ᛁ', // i isaz
    'run-jeran': 'ᛃ', // j jeran
    'run-iwaz': 'ᛇ', // ï iwaz
    pe: 'ᛈ', // p pertho
    zayin: 'ᛉ', // z algiz
    shin: 'ᛊ', // s sowilo
    taw: 'ᛏ', // t tiwaz
    beth: 'ᛒ', // b berkanan
    he: 'ᛖ', // e ehwaz
    mem: 'ᛗ', // m mannaz
    lamedh: 'ᛚ', // l laukaz
    'run-ingwaz': 'ᛜ', // ŋ ingwaz
    daleth: 'ᛞ', // d dagaz
    ayin: 'ᛟ', // o othalan
    'run-v': 'ᚡ',
    'run-yr': 'ᚣ',
    'run-y': 'ᚤ',
    'run-w': 'ᚥ',
    'run-eth': 'ᚧ',
    'run-os': 'ᚩ',
    'run-ac': 'ᚪ',
    'run-aesc': 'ᚫ',
    'run-oss-lb': 'ᚬ',
    'run-oss-st': 'ᚭ',
    'run-o': 'ᚮ',
    'run-oe': 'ᚯ',
    'run-on': 'ᚰ',
    'run-cen': 'ᚳ',
    'run-kaun': 'ᚴ',
    'run-g': 'ᚵ',
    'run-eng': 'ᚶ',
    'run-gar': 'ᚸ',
    'run-haegl': 'ᚻ',
    'run-hagall-lb': 'ᚼ',
    'run-hagall-st': 'ᚽ',
    'run-naud-st': 'ᚿ',
    'run-n-dotted': 'ᛀ',
    'run-e': 'ᛂ',
    'run-ger': 'ᛄ',
    'run-ar-lb': 'ᛅ',
    'run-ar-st': 'ᛆ',
    'run-sigel': 'ᛋ',
    'run-sol-st': 'ᛌ',
    'run-c': 'ᛍ',
    'run-z': 'ᛎ',
    'run-tyr-st': 'ᛐ',
    'run-d': 'ᛑ',
    'run-bjarkan-st': 'ᛓ',
    'run-p-dotted': 'ᛔ',
    'run-p-open': 'ᛕ',
    'run-madr-lb': 'ᛘ',
    'run-madr-st': 'ᛙ',
    'run-l-dotted': 'ᛛ',
    'run-ing': 'ᛝ',
    'run-ear': 'ᛠ',
    'run-ior': 'ᛡ',
    'run-cweorth': 'ᛢ',
    'run-calc': 'ᛣ',
    'run-cealc': 'ᛤ',
    'run-stan': 'ᛥ',
    'run-yr-lb': 'ᛦ',
    'run-yr-st': 'ᛧ',
    'run-yr-ice': 'ᛨ',
    'run-q': 'ᛩ',
    'run-x': 'ᛪ',
    'run-k': 'ᛱ',
    'run-sh': 'ᛲ',
    'run-oo': 'ᛳ',
    'run-fc-os': 'ᛴ',
    'run-fc-is': 'ᛵ',
    'run-fc-eh': 'ᛶ',
    'run-fc-ac': 'ᛷ',
    'run-fc-aesc': 'ᛸ',
  },

  // 提非纳文（柏柏尔语）：按新提非纳文（IRCAM 正字法）的实际音值接回腓尼基／
  // 布匿那一套槽位——a b g d ḍ f k h ħ ʕ x q i l m n u r s ṣ š t θ ṭ z 逐格
  // 对上；ⴸ /ð/ 与 ⴺ /ðˤ/ 接 dhal 与 zah，γ 接 ghayn。布匿的 p 在柏柏尔语里
  // 擦化成 f，所以 yaf ⴼ 接 pe，与阿拉伯 ف 走的是同一步。剩下 29 格——新提
  // 非纳文另外分出来的 w j 与咽化 z、图阿雷格等各家的自家字面、还有唇化符号
  // ——各占一格，走到提非纳文这一站时飞入。
  tifinagh: {
    aleph: 'ⴰ', // a ya
    beth: 'ⴱ', // b yab
    gimel: 'ⴳ', // g yag
    daleth: 'ⴷ', // d yad
    dhal: 'ⴸ', // ð yadh
    dad: 'ⴹ', // ḍ yadd
    zah: 'ⴺ', // ðˤ yaddh
    pe: 'ⴼ', // f yaf
    kaph: 'ⴽ', // k yak
    he: 'ⵀ', // h yah
    heth: 'ⵃ', // ħ yahh
    ayin: 'ⵄ', // ʕ yaa
    kha: 'ⵅ', // x yakh
    qoph: 'ⵇ', // q yaq
    yodh: 'ⵉ', // i yi
    lamedh: 'ⵍ', // l yal
    mem: 'ⵎ', // m yam
    nun: 'ⵏ', // n yan
    waw: 'ⵓ', // u yu
    resh: 'ⵔ', // r yar
    ghayn: 'ⵖ', // ɣ yagh
    samekh: 'ⵙ', // s yas
    sadhe: 'ⵚ', // ṣ yass
    shin: 'ⵛ', // š yash
    taw: 'ⵜ', // t yat
    tha: 'ⵝ', // θ yath
    teth: 'ⵟ', // ṭ yatt
    zayin: 'ⵣ', // z yaz
    'tif-yabh': 'ⴲ',
    'tif-yaghh': 'ⴴ',
    'tif-yaj-acad': 'ⴵ',
    'tif-yaj': 'ⴶ',
    'tif-schwa': 'ⴻ',
    'tif-yak-tuareg': 'ⴾ',
    'tif-yakhh': 'ⴿ',
    'tif-yah-acad': 'ⵁ',
    'tif-yah-tuareg': 'ⵂ',
    'tif-yakh-tuareg': 'ⵆ',
    'tif-yaq-tuareg': 'ⵈ',
    'tif-yazh': 'ⵊ',
    'tif-yazh-ahaggar': 'ⵋ',
    'tif-yazh-tuareg': 'ⵌ',
    'tif-yagn': 'ⵐ',
    'tif-yang': 'ⵑ',
    'tif-yap': 'ⵒ',
    'tif-yarr': 'ⵕ',
    'tif-yagh-tuareg': 'ⵗ',
    'tif-yagh-ayer': 'ⵘ',
    'tif-yach': 'ⵞ',
    'tif-yav': 'ⵠ',
    'tif-yaw': 'ⵡ',
    'tif-yay': 'ⵢ',
    'tif-yaz-tawellemet': 'ⵤ',
    'tif-yazz': 'ⵥ',
    'tif-ye': 'ⵦ',
    'tif-yo': 'ⵧ',
    'tif-labialization': 'ⵯ',
  },
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

  // 粟特字母：阿拉米字母随丝路东传后留下的直系后代。Unicode 第 14 章说它
  // "the repertoire corresponds to that of Old Sogdian"：早期粟特字母里 r / ʿ / d
  // 已合成一个字面，晚期的 U+10F40 SOGDIAN LETTER RESH-AYIN 沿用它，所以这里
  // daleth 与 resh 两格都指向 𐽀；ayin 另有自己的写法 𐼽，仍单占一格。
  // 𐽃 feth 与 𐽄 leš 是粟特在阿拉米之上分出的擦音字母，另立两格。
  // 𐽅 是 š 的独立形（词尾写法），与叙利亚字母的处理一样，同一字母只取一个字形，
  // 不进对照表。
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
    daleth: '𐽀',
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

  // 蒙古字母：回鹘字母随蒙古人北上，1204 年前后成为蒙古语的官方文字。
  // 25 个字母接在回鹘的 19 格上，其中两组是"两支合流进一个字"——
  // 回鹘的 ḥēt（q 那一路）与 kāp 在蒙古都写 ᠬ，zayin 与 leš 都写 ᠵ，
  // 所以这两格在字母场里会看到两个回鹘字形收成同一个蒙古字母。
  // 另有 18 格是蒙古自己立起来的（见上面 mong-* 的说明），走到蒙古这里飞入。
  mongolian: {
    aleph: 'ᠠ',
    'mong-e': 'ᠡ',
    yodh: 'ᠢ',
    'mong-y': 'ᠶ',
    'mong-o': 'ᠣ',
    waw: 'ᠤ',
    'mong-oe': 'ᠥ',
    'mong-ue': 'ᠦ',
    'mong-ee': 'ᠧ',
    nun: 'ᠨ',
    'mong-ang': 'ᠩ',
    beth: 'ᠪ',
    pe: 'ᠫ',
    heth: 'ᠬ',
    kaph: 'ᠬ',
    gimel: 'ᠭ',
    mem: 'ᠮ',
    lamedh: 'ᠯ',
    samekh: 'ᠰ',
    shin: 'ᠱ',
    taw: 'ᠲ',
    'mong-d': 'ᠳ',
    sadhe: 'ᠴ',
    zayin: 'ᠵ',
    lesh: 'ᠵ',
    resh: 'ᠷ',
    digamma: 'ᠸ',
    'mong-f': 'ᠹ',
    'mong-k': 'ᠺ',
    'mong-kh': 'ᠻ',
    'mong-ts': 'ᠼ',
    'mong-dz': 'ᠽ',
    'mong-h': 'ᠾ',
    'mong-zhr': 'ᠿ',
    'mong-lh': 'ᡀ',
    'mong-zhi': 'ᡁ',
    'mong-chi': 'ᡂ',
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
  // 阿维斯陀字母：骨架取自巴列维字母，字母数却涨到 54。
  // 能按音值对回巴列维的只有 17 个（a b g d h v z y k l m n s p r š t），
  // 其余 37 个是阿维斯陀为记经文新造的字——长音符、擦音、鼻音各占一格——
  // 因此走到这一站时的"新增"特别多，那正是这套字母的特点。
  // 对不上的巴列维字母（ṭ ʿ ṣ q）在这里空着，走"消失"动画。
  avestan: {
    aleph: '𐬀',
    beth: '𐬠',
    gimel: '𐬔',
    daleth: '𐬛',
    he: '𐬵',
    waw: '𐬬',
    zayin: '𐬰',
    yodh: '𐬫',
    kaph: '𐬐',
    lamedh: '𐬮',
    mem: '𐬨',
    nun: '𐬥',
    samekh: '𐬯',
    pe: '𐬞',
    resh: '𐬭',
    shin: '𐬱',
    taw: '𐬙',
    'av-aa': '𐬁',
    'av-ao': '𐬂',
    'av-aao': '𐬃',
    'av-an': '𐬄',
    'av-aan': '𐬅',
    'av-ae': '𐬆',
    'av-aee': '𐬇',
    'av-e': '𐬈',
    'av-ee': '𐬉',
    'av-o': '𐬊',
    'av-oo': '𐬋',
    'av-i': '𐬌',
    'av-ii': '𐬍',
    'av-u': '𐬎',
    'av-uu': '𐬏',
    'av-xe': '𐬑',
    'av-xye': '𐬒',
    'av-xve': '𐬓',
    'av-gge': '𐬕',
    'av-ghe': '𐬖',
    'av-ce': '𐬗',
    'av-je': '𐬘',
    'av-the': '𐬚',
    'av-dhe': '𐬜',
    'av-tte': '𐬝',
    'av-fe': '𐬟',
    'av-bhe': '𐬡',
    'av-nge': '𐬢',
    'av-ngye': '𐬣',
    'av-ngve': '𐬤',
    'av-nye': '𐬦',
    'av-nne': '𐬧',
    'av-hme': '𐬩',
    'av-yye': '𐬪',
    'av-zhe': '𐬲',
    'av-shye': '𐬳',
    'av-sshe': '𐬴',
  },
  // 亚美尼亚字母：405 年创制，38 个字母，按音值接回希腊—闪米特的格子。
  // 接得上的：ա(A) բ(B) գ(G) դ(D) ե(E) զ(Z) է(Η) թ(Θ) ի(I) լ(Λ) խ(Χ)
  // ծ(ц) կ(Κ) մ(Μ) ն(Ν) ո(Ο) պ(Π) ռ(Ρ) ս(Σ) տ(Τ) ւ(Υ) փ(Φ)——
  // 接不上的（ը ə、հ h、ձ dz、ղ ʁ、յ j、շ š 之外的送气音与挤喉音）另立槽位。
  // 注释里写的是希腊字母表的对应位，不是希腊语的音值：希腊 Η 早已读作 /i/，
  // 字母场只看"是不是同一个字母位"。
  armenian: {
    aleph: 'Ա',
    beth: 'Բ',
    gimel: 'Գ',
    daleth: 'Դ',
    he: 'Ե',
    zayin: 'Զ',
    heth: 'Է',
    schwa: 'Ը',
    teth: 'Թ',
    zhe: 'Ժ',
    yodh: 'Ի',
    lamedh: 'Լ',
    chi: 'Խ',
    tse: 'Ծ',
    kaph: 'Կ',
    h: 'Հ',
    dze: 'Ձ',
    gha: 'Ղ',
    che: 'Ճ',
    mem: 'Մ',
    'yod-cons': 'Յ',
    nun: 'Ն',
    sha: 'Շ',
    ayin: 'Ո',
    'che-asp': 'Չ',
    pe: 'Պ',
    je: 'Ջ',
    resh: 'Ռ',
    shin: 'Ս',
    digamma: 'Վ',
    taw: 'Տ',
    'r-tap': 'Ր',
    'tse-asp': 'Ց',
    waw: 'Ւ',
    phi: 'Փ',
    'kha-asp': 'Ք',
    omega: 'Օ',
    ef: 'Ֆ',
  },

  // 格鲁吉亚字母：姆赫德鲁利体的 33 个字母。与亚美尼亚相邻、音位相似，
  // 所以两套字母表能对上 28 格；格鲁吉亚多出的是它的挤喉音——
  // /k/ 分 კ kʼ、ქ kʰ、ხ x 三格，/ts/ 分 ც tsʰ、წ tsʼ、ძ dz 三格，
  // 亚美尼亚少一个 /q/，格鲁吉亚的 ყ 接在 qōp 上。
  georgian: {
    aleph: 'ა',
    beth: 'ბ',
    gimel: 'გ',
    daleth: 'დ',
    he: 'ე',
    digamma: 'ვ',
    zayin: 'ზ',
    teth: 'თ',
    yodh: 'ი',
    'k-ejective': 'კ',
    lamedh: 'ლ',
    mem: 'მ',
    nun: 'ნ',
    ayin: 'ო',
    'p-ejective': 'პ',
    zhe: 'ჟ',
    resh: 'რ',
    shin: 'ს',
    taw: 'ტ',
    waw: 'უ',
    phi: 'ფ',
    'kha-asp': 'ქ',
    gha: 'ღ',
    qoph: 'ყ',
    sha: 'შ',
    'che-asp': 'ჩ',
    'tse-asp': 'ც',
    dze: 'ძ',
    'tse-ejective': 'წ',
    'che-ejective': 'ჭ',
    chi: 'ხ',
    je: 'ჯ',
    h: 'ჰ',
  },
  // ── 婆罗米系 20 种文字（梵语字音表的 33 个辅音位）────────────────────
  // 对照关系来自各文字的梵语/Pali 字音对应表，字符按 Unicode 名逐个核对
  // （tools/build-glyph-paths.py 取轮廓、src/data/glyphAlphabets.ts 落盘）。
  // 泰国、老挝、高棉、爪哇、巴厘的字母名是本地读音，配的仍是梵语字音：
  // 例如高棉 ព 的名叫 PO、在梵语里就是 pa，泰文 ฑ 在梵语里是 ḍa。
  brahmi: {
    'varga-ka': '𑀓',
    'varga-kha': '𑀔',
    'varga-ga': '𑀕',
    'varga-gha': '𑀖',
    'varga-nga': '𑀗',
    'varga-ca': '𑀘',
    'varga-cha': '𑀙',
    'varga-ja': '𑀚',
    'varga-jha': '𑀛',
    'varga-nya': '𑀜',
    'varga-tta': '𑀝',
    'varga-ttha': '𑀞',
    'varga-dda': '𑀟',
    'varga-ddha': '𑀠',
    'varga-nna': '𑀡',
    'varga-ta': '𑀢',
    'varga-tha': '𑀣',
    'varga-da': '𑀤',
    'varga-dha': '𑀥',
    'varga-na': '𑀦',
    'varga-pa': '𑀧',
    'varga-pha': '𑀨',
    'varga-ba': '𑀩',
    'varga-bha': '𑀪',
    'varga-ma': '𑀫',
    'varga-ya': '𑀬',
    'varga-ra': '𑀭',
    'varga-la': '𑀮',
    'varga-va': '𑀯',
    'varga-sha': '𑀰',
    'varga-ssa': '𑀱',
    'varga-sa': '𑀲',
    'varga-ha': '𑀳',
    'varga-lla': '𑀴',
    'varga-llla': '𑀵',
    'varga-rra': '𑀶',
    'varga-nnna': '𑀷',
  },  // 婆罗米文：33/33
  siddham: {
    'varga-ka': '𑖎',
    'varga-kha': '𑖏',
    'varga-ga': '𑖐',
    'varga-gha': '𑖑',
    'varga-nga': '𑖒',
    'varga-ca': '𑖓',
    'varga-cha': '𑖔',
    'varga-ja': '𑖕',
    'varga-jha': '𑖖',
    'varga-nya': '𑖗',
    'varga-tta': '𑖘',
    'varga-ttha': '𑖙',
    'varga-dda': '𑖚',
    'varga-ddha': '𑖛',
    'varga-nna': '𑖜',
    'varga-ta': '𑖝',
    'varga-tha': '𑖞',
    'varga-da': '𑖟',
    'varga-dha': '𑖠',
    'varga-na': '𑖡',
    'varga-pa': '𑖢',
    'varga-pha': '𑖣',
    'varga-ba': '𑖤',
    'varga-bha': '𑖥',
    'varga-ma': '𑖦',
    'varga-ya': '𑖧',
    'varga-ra': '𑖨',
    'varga-la': '𑖩',
    'varga-va': '𑖪',
    'varga-sha': '𑖫',
    'varga-ssa': '𑖬',
    'varga-sa': '𑖭',
    'varga-ha': '𑖮',
  },  // 悉昙文：33/33
  grantha: {
    'varga-ka': '𑌕',
    'varga-kha': '𑌖',
    'varga-ga': '𑌗',
    'varga-gha': '𑌘',
    'varga-nga': '𑌙',
    'varga-ca': '𑌚',
    'varga-cha': '𑌛',
    'varga-ja': '𑌜',
    'varga-jha': '𑌝',
    'varga-nya': '𑌞',
    'varga-tta': '𑌟',
    'varga-ttha': '𑌠',
    'varga-dda': '𑌡',
    'varga-ddha': '𑌢',
    'varga-nna': '𑌣',
    'varga-ta': '𑌤',
    'varga-tha': '𑌥',
    'varga-da': '𑌦',
    'varga-dha': '𑌧',
    'varga-na': '𑌨',
    'varga-pa': '𑌪',
    'varga-pha': '𑌫',
    'varga-ba': '𑌬',
    'varga-bha': '𑌭',
    'varga-ma': '𑌮',
    'varga-ya': '𑌯',
    'varga-ra': '𑌰',
    'varga-la': '𑌲',
    'varga-va': '𑌵',
    'varga-sha': '𑌶',
    'varga-ssa': '𑌷',
    'varga-sa': '𑌸',
    'varga-ha': '𑌹',
    'varga-lla': '𑌳',
  },  // 格兰塔文：33/33
  devanagari: {
    'varga-ka': 'क',
    'varga-kha': 'ख',
    'varga-ga': 'ग',
    'varga-gha': 'घ',
    'varga-nga': 'ङ',
    'varga-ca': 'च',
    'varga-cha': 'छ',
    'varga-ja': 'ज',
    'varga-jha': 'झ',
    'varga-nya': 'ञ',
    'varga-tta': 'ट',
    'varga-ttha': 'ठ',
    'varga-dda': 'ड',
    'varga-ddha': 'ढ',
    'varga-nna': 'ण',
    'varga-ta': 'त',
    'varga-tha': 'थ',
    'varga-da': 'द',
    'varga-dha': 'ध',
    'varga-na': 'न',
    'varga-pa': 'प',
    'varga-pha': 'फ',
    'varga-ba': 'ब',
    'varga-bha': 'भ',
    'varga-ma': 'म',
    'varga-ya': 'य',
    'varga-ra': 'र',
    'varga-la': 'ल',
    'varga-va': 'व',
    'varga-sha': 'श',
    'varga-ssa': 'ष',
    'varga-sa': 'स',
    'varga-ha': 'ह',
    'varga-lla': 'ळ',
  },  // 天城文：33/33
  // 孟加拉文把 v 并进了 b（ব 一字两用），va 一格空着走"消失"
  bengali: {
    'varga-ka': 'ক',
    'varga-kha': 'খ',
    'varga-ga': 'গ',
    'varga-gha': 'ঘ',
    'varga-nga': 'ঙ',
    'varga-ca': 'চ',
    'varga-cha': 'ছ',
    'varga-ja': 'জ',
    'varga-jha': 'ঝ',
    'varga-nya': 'ঞ',
    'varga-tta': 'ট',
    'varga-ttha': 'ঠ',
    'varga-dda': 'ড',
    'varga-ddha': 'ঢ',
    'varga-nna': 'ণ',
    'varga-ta': 'ত',
    'varga-tha': 'থ',
    'varga-da': 'দ',
    'varga-dha': 'ধ',
    'varga-na': 'ন',
    'varga-pa': 'প',
    'varga-pha': 'ফ',
    'varga-ba': 'ব',
    'varga-bha': 'ভ',
    'varga-ma': 'ম',
    'varga-ya': 'য',
    'varga-ra': 'র',
    'varga-la': 'ল',
    'varga-sha': 'শ',
    'varga-ssa': 'ষ',
    'varga-sa': 'স',
    'varga-ha': 'হ',
    'varga-rra': 'ড়',
  },  // 孟加拉文：32/33
  gujarati: {
    'varga-ka': 'ક',
    'varga-kha': 'ખ',
    'varga-ga': 'ગ',
    'varga-gha': 'ઘ',
    'varga-nga': 'ઙ',
    'varga-ca': 'ચ',
    'varga-cha': 'છ',
    'varga-ja': 'જ',
    'varga-jha': 'ઝ',
    'varga-nya': 'ઞ',
    'varga-tta': 'ટ',
    'varga-ttha': 'ઠ',
    'varga-dda': 'ડ',
    'varga-ddha': 'ઢ',
    'varga-nna': 'ણ',
    'varga-ta': 'ત',
    'varga-tha': 'થ',
    'varga-da': 'દ',
    'varga-dha': 'ધ',
    'varga-na': 'ન',
    'varga-pa': 'પ',
    'varga-pha': 'ફ',
    'varga-ba': 'બ',
    'varga-bha': 'ભ',
    'varga-ma': 'મ',
    'varga-ya': 'ય',
    'varga-ra': 'ર',
    'varga-la': 'લ',
    'varga-va': 'વ',
    'varga-sha': 'શ',
    'varga-ssa': 'ષ',
    'varga-sa': 'સ',
    'varga-ha': 'હ',
    'varga-lla': 'ળ',
  },  // 古吉拉特文：33/33
  // 果鲁穆奇文没有卷舌咝音 ṣa（只有 ਸ਼），ssa 一格空着
  gurmukhi: {
    'varga-ka': 'ਕ',
    'varga-kha': 'ਖ',
    'varga-ga': 'ਗ',
    'varga-gha': 'ਘ',
    'varga-nga': 'ਙ',
    'varga-ca': 'ਚ',
    'varga-cha': 'ਛ',
    'varga-ja': 'ਜ',
    'varga-jha': 'ਝ',
    'varga-nya': 'ਞ',
    'varga-tta': 'ਟ',
    'varga-ttha': 'ਠ',
    'varga-dda': 'ਡ',
    'varga-ddha': 'ਢ',
    'varga-nna': 'ਣ',
    'varga-ta': 'ਤ',
    'varga-tha': 'ਥ',
    'varga-da': 'ਦ',
    'varga-dha': 'ਧ',
    'varga-na': 'ਨ',
    'varga-pa': 'ਪ',
    'varga-pha': 'ਫ',
    'varga-ba': 'ਬ',
    'varga-bha': 'ਭ',
    'varga-ma': 'ਮ',
    'varga-ya': 'ਯ',
    'varga-ra': 'ਰ',
    'varga-la': 'ਲ',
    'varga-va': 'ਵ',
    'varga-sha': 'ਸ਼',
    'varga-sa': 'ਸ',
    'varga-ha': 'ਹ',
    'varga-rra': 'ੜ',
  },  // 果鲁穆奇文：32/33
  odia: {
    'varga-ka': 'କ',
    'varga-kha': 'ଖ',
    'varga-ga': 'ଗ',
    'varga-gha': 'ଘ',
    'varga-nga': 'ଙ',
    'varga-ca': 'ଚ',
    'varga-cha': 'ଛ',
    'varga-ja': 'ଜ',
    'varga-jha': 'ଝ',
    'varga-nya': 'ଞ',
    'varga-tta': 'ଟ',
    'varga-ttha': 'ଠ',
    'varga-dda': 'ଡ',
    'varga-ddha': 'ଢ',
    'varga-nna': 'ଣ',
    'varga-ta': 'ତ',
    'varga-tha': 'ଥ',
    'varga-da': 'ଦ',
    'varga-dha': 'ଧ',
    'varga-na': 'ନ',
    'varga-pa': 'ପ',
    'varga-pha': 'ଫ',
    'varga-ba': 'ବ',
    'varga-bha': 'ଭ',
    'varga-ma': 'ମ',
    'varga-ya': 'ଯ',
    'varga-ra': 'ର',
    'varga-la': 'ଲ',
    'varga-va': 'ଵ',
    'varga-sha': 'ଶ',
    'varga-ssa': 'ଷ',
    'varga-sa': 'ସ',
    'varga-ha': 'ହ',
    'varga-lla': 'ଳ',
    'varga-rra': 'ଡ଼',
  },  // 奥里亚文：33/33
  // 泰米尔文不分送气/清浊，ச 系之后只留各发一个音的字，其余 14 格全空
  tamil: {
    'varga-ka': 'க',
    'varga-nga': 'ங',
    'varga-ca': 'ச',
    'varga-ja': 'ஜ',
    'varga-nya': 'ஞ',
    'varga-tta': 'ட',
    'varga-nna': 'ண',
    'varga-ta': 'த',
    'varga-na': 'ந',
    'varga-pa': 'ப',
    'varga-ma': 'ம',
    'varga-ya': 'ய',
    'varga-ra': 'ர',
    'varga-la': 'ல',
    'varga-va': 'வ',
    'varga-sha': 'ஶ',
    'varga-ssa': 'ஷ',
    'varga-sa': 'ஸ',
    'varga-ha': 'ஹ',
    'varga-lla': 'ள',
    'varga-llla': 'ழ',
    'varga-rra': 'ற',
    'varga-nnna': 'ன',
  },  // 泰米尔文：19/33
  telugu: {
    'varga-ka': 'క',
    'varga-kha': 'ఖ',
    'varga-ga': 'గ',
    'varga-gha': 'ఘ',
    'varga-nga': 'ఙ',
    'varga-ca': 'చ',
    'varga-cha': 'ఛ',
    'varga-ja': 'జ',
    'varga-jha': 'ఝ',
    'varga-nya': 'ఞ',
    'varga-tta': 'ట',
    'varga-ttha': 'ఠ',
    'varga-dda': 'డ',
    'varga-ddha': 'ఢ',
    'varga-nna': 'ణ',
    'varga-ta': 'త',
    'varga-tha': 'థ',
    'varga-da': 'ద',
    'varga-dha': 'ధ',
    'varga-na': 'న',
    'varga-pa': 'ప',
    'varga-pha': 'ఫ',
    'varga-ba': 'బ',
    'varga-bha': 'భ',
    'varga-ma': 'మ',
    'varga-ya': 'య',
    'varga-ra': 'ర',
    'varga-la': 'ల',
    'varga-va': 'వ',
    'varga-sha': 'శ',
    'varga-ssa': 'ష',
    'varga-sa': 'స',
    'varga-ha': 'హ',
    'varga-lla': 'ళ',
    'varga-llla': 'ఴ',
    'varga-rra': 'ఱ',
  },  // 泰卢固文：33/33
  kannada: {
    'varga-ka': 'ಕ',
    'varga-kha': 'ಖ',
    'varga-ga': 'ಗ',
    'varga-gha': 'ಘ',
    'varga-nga': 'ಙ',
    'varga-ca': 'ಚ',
    'varga-cha': 'ಛ',
    'varga-ja': 'ಜ',
    'varga-jha': 'ಝ',
    'varga-nya': 'ಞ',
    'varga-tta': 'ಟ',
    'varga-ttha': 'ಠ',
    'varga-dda': 'ಡ',
    'varga-ddha': 'ಢ',
    'varga-nna': 'ಣ',
    'varga-ta': 'ತ',
    'varga-tha': 'ಥ',
    'varga-da': 'ದ',
    'varga-dha': 'ಧ',
    'varga-na': 'ನ',
    'varga-pa': 'ಪ',
    'varga-pha': 'ಫ',
    'varga-ba': 'ಬ',
    'varga-bha': 'ಭ',
    'varga-ma': 'ಮ',
    'varga-ya': 'ಯ',
    'varga-ra': 'ರ',
    'varga-la': 'ಲ',
    'varga-va': 'ವ',
    'varga-sha': 'ಶ',
    'varga-ssa': 'ಷ',
    'varga-sa': 'ಸ',
    'varga-ha': 'ಹ',
    'varga-lla': 'ಳ',
    'varga-llla': 'ೞ',  // Unicode 名字误写成 FA，实为 ḻa（见 NamesList）
    'varga-rra': 'ಱ',
  },  // 卡纳达文：33/33
  malayalam: {
    'varga-ka': 'ക',
    'varga-kha': 'ഖ',
    'varga-ga': 'ഗ',
    'varga-gha': 'ഘ',
    'varga-nga': 'ങ',
    'varga-ca': 'ച',
    'varga-cha': 'ഛ',
    'varga-ja': 'ജ',
    'varga-jha': 'ഝ',
    'varga-nya': 'ഞ',
    'varga-tta': 'ട',
    'varga-ttha': 'ഠ',
    'varga-dda': 'ഡ',
    'varga-ddha': 'ഢ',
    'varga-nna': 'ണ',
    'varga-ta': 'ത',
    'varga-tha': 'ഥ',
    'varga-da': 'ദ',
    'varga-dha': 'ധ',
    'varga-na': 'ന',
    'varga-pa': 'പ',
    'varga-pha': 'ഫ',
    'varga-ba': 'ബ',
    'varga-bha': 'ഭ',
    'varga-ma': 'മ',
    'varga-ya': 'യ',
    'varga-ra': 'ര',
    'varga-la': 'ല',
    'varga-va': 'വ',
    'varga-sha': 'ശ',
    'varga-ssa': 'ഷ',
    'varga-sa': 'സ',
    'varga-ha': 'ഹ',
    'varga-lla': 'ള',
    'varga-llla': 'ഴ',
    'varga-rra': 'റ',
    'varga-nnna': 'ഩ',
    // 词末辅音写法（chillu）：Unicode 单列九个，另加三个历史写法
    'varga-chillu-nn': 'ൺ',
    'varga-chillu-n': 'ൻ',
    'varga-chillu-rr': 'ർ',
    'varga-chillu-l': 'ൽ',
    'varga-chillu-ll': 'ൾ',
    'varga-chillu-k': 'ൿ',
    'varga-chillu-m': 'ൔ',
    'varga-chillu-y': 'ൕ',
    'varga-chillu-lll': 'ൖ',
  },  // 马拉雅拉姆文：62/67（33 音位 + 九个 chillu）
  sinhala: {
    'varga-ka': 'ක',
    'varga-kha': 'ඛ',
    'varga-ga': 'ග',
    'varga-gha': 'ඝ',
    'varga-nga': 'ඞ',
    'varga-ca': 'ච',
    'varga-cha': 'ඡ',
    'varga-ja': 'ජ',
    'varga-jha': 'ඣ',
    'varga-nya': 'ඤ',
    'varga-tta': 'ට',
    'varga-ttha': 'ඨ',
    'varga-dda': 'ඩ',
    'varga-ddha': 'ඪ',
    'varga-nna': 'ණ',
    'varga-ta': 'ත',
    'varga-tha': 'ථ',
    'varga-da': 'ද',
    'varga-dha': 'ධ',
    'varga-na': 'න',
    'varga-pa': 'ප',
    'varga-pha': 'ඵ',
    'varga-ba': 'බ',
    'varga-bha': 'භ',
    'varga-ma': 'ම',
    'varga-ya': 'ය',
    'varga-ra': 'ර',
    'varga-la': 'ල',
    'varga-va': 'ව',
    'varga-sha': 'ශ',
    'varga-ssa': 'ෂ',
    'varga-sa': 'ස',
    'varga-ha': 'හ',
    'varga-lla': 'ළ',
    // 僧伽罗语自己的鼻化浊音一系与外来音 ෆ
    'varga-sinhala-gga': 'ඟ',
    'varga-sinhala-jnya': 'ඥ',
    'varga-sinhala-jja': 'ඦ',
    'varga-sinhala-dda': 'ඬ',
    'varga-sinhala-da': 'ඳ',
    'varga-sinhala-ba': 'ඹ',
    'varga-sinhala-fa': 'ෆ',
  },  // 僧伽罗文：全部（33 音位 + 七个本语字母）
  // 藏文梵转写的 jha 写成 ཛྷ 组合字，Unicode 无单字，jha 一格空着
  tibetan: {
    'varga-ka': 'ཀ',
    'varga-kha': 'ཁ',
    'varga-ga': 'ག',
    'varga-gha': 'གྷ',
    'varga-nga': 'ང',
    'varga-ca': 'ཅ',
    'varga-cha': 'ཆ',
    'varga-ja': 'ཇ',
    'varga-nya': 'ཉ',
    'varga-tta': 'ཊ',
    'varga-ttha': 'ཋ',
    'varga-dda': 'ཌ',
    'varga-ddha': 'ཌྷ',
    'varga-nna': 'ཎ',
    'varga-ta': 'ཏ',
    'varga-tha': 'ཐ',
    'varga-da': 'ད',
    'varga-dha': 'དྷ',
    'varga-na': 'ན',
    'varga-pa': 'པ',
    'varga-pha': 'ཕ',
    'varga-ba': 'བ',
    'varga-bha': 'བྷ',
    'varga-ma': 'མ',
    'varga-ya': 'ཡ',
    'varga-ra': 'ར',
    'varga-la': 'ལ',
    'varga-va': 'ཝ',
    'varga-sha': 'ཤ',
    'varga-ssa': 'ཥ',
    'varga-sa': 'ས',
    'varga-ha': 'ཧ',
    // 藏文在梵语 33 音之外还有自己的塞擦音一系与 -a 载体：
    'varga-tsa': 'ཙ',
    'varga-tsha': 'ཚ',
    'varga-dza': 'ཛ',
    'varga-zha': 'ཞ',
    'varga-za': 'ཟ',
    'varga-a-chung': 'འ',
    'varga-kka': 'ཫ',
    'varga-rra-tib': 'ཬ',
  },  // 藏文：41/50（余下多为祭仪符号；jha 是组合字，留空）
  java: {
    'varga-ka': 'ꦏ',
    'varga-kha': 'ꦑ',
    'varga-ga': 'ꦒ',
    'varga-gha': 'ꦓ',
    'varga-nga': 'ꦔ',
    'varga-ca': 'ꦕ',
    'varga-cha': 'ꦖ',
    'varga-ja': 'ꦗ',
    'varga-jha': 'ꦙ',
    // ꦚ 是正体 nya；ꦘ（nya murda）是同一字母的敬体变体，不入表
    'varga-nya': 'ꦚ',
    'varga-tta': 'ꦛ',
    'varga-ttha': 'ꦜ',
    'varga-dda': 'ꦝ',
    'varga-ddha': 'ꦞ',
    'varga-nna': 'ꦟ',
    'varga-ta': 'ꦠ',
    'varga-tha': 'ꦡ',
    'varga-da': 'ꦢ',
    'varga-dha': 'ꦣ',
    'varga-na': 'ꦤ',
    'varga-pa': 'ꦥ',
    'varga-pha': 'ꦦ',
    'varga-ba': 'ꦧ',
    'varga-bha': 'ꦨ',
    'varga-ma': 'ꦩ',
    'varga-ya': 'ꦪ',
    'varga-ra': 'ꦫ',
    'varga-la': 'ꦭ',
    'varga-va': 'ꦮ',
    'varga-sha': 'ꦯ',
    'varga-ssa': 'ꦰ',
    'varga-sa': 'ꦱ',
    'varga-ha': 'ꦲ',
    // 爪哇语在梵语 33 音之外的独立字面
    'varga-java-i-kawi': 'ꦅ',
    'varga-java-pa-cerek': 'ꦉ',
    'varga-java-nga-lelet': 'ꦊ',
    'varga-java-nga-lelet-raswadi': 'ꦋ',
    'varga-java-ka-sasak': 'ꦐ',
    'varga-java-ra-agung': 'ꦬ',
  },  // 爪哇文：46/48（余下两个是敬体变体与缩写符号）
  balinese: {
    'varga-ka': 'ᬓ',
    'varga-kha': 'ᬔ',
    'varga-ga': 'ᬕ',
    'varga-gha': 'ᬖ',
    'varga-nga': 'ᬗ',
    'varga-ca': 'ᬘ',
    'varga-cha': 'ᬙ',
    'varga-ja': 'ᬚ',
    'varga-jha': 'ᬛ',
    'varga-nya': 'ᬜ',
    'varga-tta': 'ᬝ',
    'varga-ttha': 'ᬞ',
    'varga-dda': 'ᬟ',
    'varga-ddha': 'ᬠ',
    'varga-nna': 'ᬡ',
    'varga-ta': 'ᬢ',
    'varga-tha': 'ᬣ',
    'varga-da': 'ᬤ',
    'varga-dha': 'ᬥ',
    'varga-na': 'ᬦ',
    'varga-pa': 'ᬧ',
    'varga-pha': 'ᬨ',
    'varga-ba': 'ᬩ',
    'varga-bha': 'ᬪ',
    'varga-ma': 'ᬫ',
    'varga-ya': 'ᬬ',
    'varga-ra': 'ᬭ',
    'varga-la': 'ᬮ',
    'varga-va': 'ᬯ',
    'varga-sha': 'ᬰ',
    'varga-ssa': 'ᬱ',
    'varga-sa': 'ᬲ',
    'varga-ha': 'ᬳ',
    // 巴厘文为萨萨克语添的七个字母
    'varga-balinese-kaf-sasak': 'ᭅ',
    'varga-balinese-khot-sasak': 'ᭆ',
    'varga-balinese-tzir-sasak': 'ᭇ',
    'varga-balinese-ef-sasak': 'ᭈ',
    'varga-balinese-ve-sasak': 'ᭉ',
    'varga-balinese-zal-sasak': 'ᭊ',
    'varga-balinese-asyura-sasak': 'ᭋ',
  },  // 巴厘文：全部（33 音位 + 七个萨萨克字母）
  khmer: {
    'varga-ka': 'ក',
    'varga-kha': 'ខ',
    'varga-ga': 'គ',
    'varga-gha': 'ឃ',
    'varga-nga': 'ង',
    'varga-ca': 'ច',
    'varga-cha': 'ឆ',
    'varga-ja': 'ជ',
    'varga-jha': 'ឈ',
    'varga-nya': 'ញ',
    'varga-tta': 'ដ',
    'varga-ttha': 'ឋ',
    'varga-dda': 'ឌ',
    'varga-ddha': 'ឍ',
    'varga-nna': 'ណ',
    'varga-ta': 'ត',
    'varga-tha': 'ថ',
    'varga-da': 'ទ',
    'varga-dha': 'ធ',
    'varga-na': 'ន',
    'varga-pa': 'ព',
    'varga-pha': 'ផ',
    'varga-ba': 'ប',
    'varga-bha': 'ភ',
    'varga-ma': 'ម',
    'varga-ya': 'យ',
    'varga-ra': 'រ',
    'varga-la': 'ល',
    'varga-va': 'វ',
    'varga-sha': 'ឝ',
    'varga-ssa': 'ឞ',
    'varga-sa': 'ស',
    'varga-ha': 'ហ',
    'varga-lla': 'ឡ',
    // អ 是高棉字母表的第 33 个辅音，也是写元音的载体，独立元音 a 的后身
    'varga-o-ang': 'អ',
  },  // 高棉文：35/35（梵语字音表 33 音 + ឡ + អ）
  thai: {
    'varga-ka': 'ก',
    'varga-kha': 'ข',
    'varga-ga': 'ค',
    'varga-gha': 'ฆ',
    'varga-nga': 'ง',
    'varga-ca': 'จ',
    'varga-cha': 'ฉ',
    'varga-ja': 'ช',
    'varga-jha': 'ฌ',
    'varga-nya': 'ญ',
    'varga-tta': 'ฏ',
    'varga-ttha': 'ฐ',
    'varga-dda': 'ฑ',
    'varga-ddha': 'ฒ',
    'varga-nna': 'ณ',
    'varga-ta': 'ต',
    'varga-tha': 'ถ',
    'varga-da': 'ท',
    'varga-dha': 'ธ',
    'varga-na': 'น',
    'varga-pa': 'ป',
    'varga-pha': 'ผ',
    'varga-ba': 'พ',
    'varga-bha': 'ภ',
    'varga-ma': 'ม',
    'varga-ya': 'ย',
    'varga-ra': 'ร',
    'varga-la': 'ล',
    'varga-va': 'ว',
    'varga-sha': 'ศ',
    'varga-ssa': 'ษ',
    'varga-sa': 'ส',
    'varga-ha': 'ห',
    'varga-lla': 'ฬ',
    // 泰文自己添的十个字母：梵语 33 音之外，这些格子别的婆罗米系文字没有
    'varga-khuat': 'ฃ',
    'varga-khon': 'ฅ',
    'varga-so-so': 'ซ',
    'varga-do-chada': 'ฎ',
    'varga-do-dek': 'ด',
    'varga-bo-baimai': 'บ',
    'varga-fo-ta': 'ฝ',
    'varga-fo-fan': 'ฟ',
    'varga-o-ang': 'อ',
    'varga-ho-nokhuk': 'ฮ',
  },  // 泰文：44/44（梵语字音表 33 音 + 巴利 ḷa + 10 个本语字母）
  lao: {
    'varga-ka': 'ກ',
    'varga-kha': 'ຂ',
    'varga-ga': 'ຄ',
    'varga-gha': 'ຆ',
    'varga-nga': 'ງ',
    'varga-ca': 'ຈ',
    'varga-cha': 'ຉ',
    'varga-ja': 'ຊ',
    'varga-jha': 'ຌ',
    'varga-nya': 'ຎ',
    'varga-tta': 'ຏ',
    'varga-ttha': 'ຐ',
    'varga-dda': 'ຑ',
    'varga-ddha': 'ຒ',
    'varga-nna': 'ຓ',
    'varga-ta': 'ຕ',
    'varga-tha': 'ຖ',
    'varga-da': 'ທ',
    'varga-dha': 'ຘ',
    'varga-na': 'ນ',
    'varga-pa': 'ປ',
    'varga-pha': 'ຜ',
    'varga-ba': 'ພ',
    'varga-bha': 'ຠ',
    'varga-ma': 'ມ',
    'varga-ya': 'ຢ',
    'varga-ra': 'ຣ',
    'varga-la': 'ລ',
    'varga-va': 'ວ',
    'varga-sha': 'ຨ',
    'varga-ssa': 'ຩ',
    'varga-sa': 'ສ',
    'varga-ha': 'ຫ',
    'varga-lla': 'ຬ',
    // 老挝文比梵语字音表多出的七个常用辅音：/ɲ/ /d/ /b/ /f/ /ʔ/ /h/
    'varga-nyo': 'ຍ',
    'varga-do-dek': 'ດ',
    'varga-bo-baimai': 'ບ',
    'varga-fo-ta': 'ຝ',
    'varga-fo-fan': 'ຟ',
    'varga-o-ang': 'ອ',
    'varga-ho-nokhuk': 'ຮ',
  },  // 老挝文：41/41（梵语字音表 33 音 + 巴利 ḷa + 7 个本语字母）
  burmese: {
    'varga-ka': 'က',
    'varga-kha': 'ခ',
    'varga-ga': 'ဂ',
    'varga-gha': 'ဃ',
    'varga-nga': 'င',
    'varga-ca': 'စ',
    'varga-cha': 'ဆ',
    'varga-ja': 'ဇ',
    'varga-jha': 'ဈ',
    'varga-nya': 'ဉ',
    'varga-tta': 'ဋ',
    'varga-ttha': 'ဌ',
    'varga-dda': 'ဍ',
    'varga-ddha': 'ဎ',
    'varga-nna': 'ဏ',
    'varga-ta': 'တ',
    'varga-tha': 'ထ',
    'varga-da': 'ဒ',
    'varga-dha': 'ဓ',
    'varga-na': 'န',
    'varga-pa': 'ပ',
    'varga-pha': 'ဖ',
    'varga-ba': 'ဗ',
    'varga-bha': 'ဘ',
    'varga-ma': 'မ',
    'varga-ya': 'ယ',
    'varga-ra': 'ရ',
    'varga-la': 'လ',
    'varga-va': 'ဝ',
    'varga-sha': 'ၐ',
    'varga-ssa': 'ၑ',
    'varga-sa': 'သ',
    'varga-ha': 'ဟ',
    'varga-lla': 'ဠ',
    // 缅文与巴利系列的 ဉ 分工：日常的 ñ 写作 ည，ဉ 只用于巴利梵语转写
    'varga-nyo': 'ည',
    // 缅文字母系统里为孟语、掸语、克伦语、勃欧语添的字（Myanmar 区块中段）
    'varga-mran-mon-nga': 'ၚ',
    'varga-mran-mon-jha': 'ၛ',
    'varga-mran-mon-bba': 'ၜ',
    'varga-mran-mon-bbe': 'ၝ',
    'varga-mran-mon-e': 'ဨ',
    'varga-mran-great-sa': 'ဿ',
    'varga-mran-karen-sha': 'ၡ',
    'varga-mran-karen-tha': 'ၥ',
    'varga-mran-karen-pwa': 'ၦ',
    'varga-mran-pwo-nna': 'ၮ',
    'varga-mran-pwo-ywa': 'ၯ',
    'varga-mran-pwo-ghwa': 'ၰ',
    'varga-mran-shan-a': 'ဢ',
    'varga-mran-shan-ka': 'ၵ',
    'varga-mran-shan-kha': 'ၶ',
    'varga-mran-shan-ga': 'ၷ',
    'varga-mran-shan-ca': 'ၸ',
    'varga-mran-shan-za': 'ၹ',
    'varga-mran-shan-nya': 'ၺ',
    'varga-mran-shan-da': 'ၻ',
    'varga-mran-shan-na': 'ၼ',
    'varga-mran-shan-pha': 'ၽ',
    'varga-mran-shan-fa': 'ၾ',
    'varga-mran-shan-ba': 'ၿ',
    'varga-mran-shan-tha': 'ႀ',
    'varga-mran-shan-ha': 'ႁ',
    'varga-mran-palaung-fa': 'ႎ',
  },  // 缅文：62/62（梵语字音表 33 音 + 本语与邻语字母 29 格）

  // ── 夏拉达支系：夏拉达 → 塔克里 → 马哈贾尼 → 霍杰基 → 穆尔塔尼 →
  //    胡达瓦迪 → 多格拉 ─────────────────────────────────────────────
  // 这一家都排在梵语字音表的 33 个辅音位上，另外各自留着几个本地字母：
  // 塔克里与多格拉的卷舌边音 ḷa、闪音 ṛa，信德三文（霍杰基、胡达瓦迪、
  // 穆尔塔尼）从信德语借来的四个内爆音（ɓ ɗ ɠ ʄ），塔克里的古写 kha，
  // 霍杰基的 qa 与穆尔塔尼的 ṛha。它们只在有的那一站出现，走过去时飞入。
  sharada: {
    'varga-ka': '𑆑',
    'varga-kha': '𑆒',
    'varga-ga': '𑆓',
    'varga-gha': '𑆔',
    'varga-nga': '𑆕',
    'varga-ca': '𑆖',
    'varga-cha': '𑆗',
    'varga-ja': '𑆘',
    'varga-jha': '𑆙',
    'varga-nya': '𑆚',
    'varga-tta': '𑆛',
    'varga-ttha': '𑆜',
    'varga-dda': '𑆝',
    'varga-ddha': '𑆞',
    'varga-nna': '𑆟',
    'varga-ta': '𑆠',
    'varga-tha': '𑆡',
    'varga-da': '𑆢',
    'varga-dha': '𑆣',
    'varga-na': '𑆤',
    'varga-pa': '𑆥',
    'varga-pha': '𑆦',
    'varga-ba': '𑆧',
    'varga-bha': '𑆨',
    'varga-ma': '𑆩',
    'varga-ya': '𑆪',
    'varga-ra': '𑆫',
    'varga-la': '𑆬',
    'varga-va': '𑆮',
    'varga-sha': '𑆯',
    'varga-ssa': '𑆰',
    'varga-sa': '𑆱',
    'varga-ha': '𑆲',
    'varga-lla': '𑆭',
  },  // 夏拉达文：34/34（33 个梵语音位 + ḷa）
  takri: {
    'varga-ka': '𑚊',
    'varga-kha': '𑚋',
    'varga-ga': '𑚌',
    'varga-gha': '𑚍',
    'varga-nga': '𑚎',
    'varga-ca': '𑚏',
    'varga-cha': '𑚐',
    'varga-ja': '𑚑',
    'varga-jha': '𑚒',
    'varga-nya': '𑚓',
    'varga-tta': '𑚔',
    'varga-ttha': '𑚕',
    'varga-dda': '𑚖',
    'varga-ddha': '𑚗',
    'varga-nna': '𑚘',
    'varga-ta': '𑚙',
    'varga-tha': '𑚚',
    'varga-da': '𑚛',
    'varga-dha': '𑚜',
    'varga-na': '𑚝',
    'varga-pa': '𑚞',
    'varga-pha': '𑚟',
    'varga-ba': '𑚠',
    'varga-bha': '𑚡',
    'varga-ma': '𑚢',
    'varga-ya': '𑚣',
    'varga-ra': '𑚤',
    'varga-la': '𑚥',
    'varga-va': '𑚦',
    'varga-sha': '𑚧',
    'varga-ssa': '𑚨', // 塔克里把 ssa 写成 sa 的变体，Unicode 只收一个 SA
    'varga-sa': '𑚨',
    'varga-ha': '𑚩',
    'varga-rra': '𑚪',
    'varga-khaa': '𑚸',
  },  // 塔克里文：35/35（ssa 与 sa 共用一个字形）
  mahajani: {
    'varga-ka': '𑅕',
    'varga-kha': '𑅖',
    'varga-ga': '𑅗',
    'varga-gha': '𑅘',
    'varga-ca': '𑅙',
    'varga-cha': '𑅚',
    'varga-ja': '𑅛',
    'varga-jha': '𑅜',
    'varga-nya': '𑅝',
    'varga-tta': '𑅞',
    'varga-ttha': '𑅟',
    'varga-dda': '𑅠',
    'varga-ddha': '𑅡',
    'varga-nna': '𑅢',
    'varga-ta': '𑅣',
    'varga-tha': '𑅤',
    'varga-da': '𑅥',
    'varga-dha': '𑅦',
    'varga-na': '𑅧',
    'varga-pa': '𑅨',
    'varga-pha': '𑅩',
    'varga-ba': '𑅪',
    'varga-bha': '𑅫',
    'varga-ma': '𑅬',
    'varga-ra': '𑅭',
    'varga-la': '𑅮',
    'varga-va': '𑅯',
    'varga-sa': '𑅰',
    'varga-ha': '𑅱',
    'varga-rra': '𑅲',
  },  // 马哈贾尼文：30/30（记账体丢掉了 ya 与三个咝音，nga 也没有专字）
  khojki: {
    'varga-ka': '𑈈',
    'varga-kha': '𑈉',
    'varga-ga': '𑈊',
    'varga-gga': '𑈋',
    'varga-gha': '𑈌',
    'varga-nga': '𑈍',
    'varga-ca': '𑈎',
    'varga-cha': '𑈏',
    'varga-ja': '𑈐',
    'varga-jja': '𑈑',
    'varga-nya': '𑈓',
    'varga-tta': '𑈔',
    'varga-ttha': '𑈕',
    'varga-dda': '𑈖',
    'varga-ddda': '𑈜',
    'varga-ddha': '𑈗',
    'varga-nna': '𑈘',
    'varga-ta': '𑈙',
    'varga-tha': '𑈚',
    'varga-da': '𑈛',
    'varga-dha': '𑈝',
    'varga-na': '𑈞',
    'varga-pa': '𑈟',
    'varga-pha': '𑈠',
    'varga-ba': '𑈡',
    'varga-bba': '𑈢',
    'varga-bha': '𑈣',
    'varga-ma': '𑈤',
    'varga-ya': '𑈥',
    'varga-ra': '𑈦',
    'varga-la': '𑈧',
    'varga-lla': '𑈫',
    'varga-va': '𑈨',
    'varga-sa': '𑈩',
    'varga-ha': '𑈪',
    'varga-qa': '𑈿',
  },  // 霍杰基文：36/36（信德内爆音四个 + ḷa + qa）
  multani: {
    'varga-ka': '𑊄',
    'varga-kha': '𑊅',
    'varga-ga': '𑊆',
    'varga-gha': '𑊈',
    'varga-ca': '𑊊',
    'varga-cha': '𑊋',
    'varga-ja': '𑊌',
    'varga-jja': '𑊍',
    'varga-nya': '𑊏',
    'varga-tta': '𑊐',
    'varga-ttha': '𑊑',
    'varga-dda': '𑊒',
    'varga-ddda': '𑊓',
    'varga-ddha': '𑊔',
    'varga-nna': '𑊕',
    'varga-ta': '𑊖',
    'varga-tha': '𑊗',
    'varga-da': '𑊘',
    'varga-dha': '𑊙',
    'varga-na': '𑊚',
    'varga-pa': '𑊛',
    'varga-pha': '𑊜',
    'varga-ba': '𑊝',
    'varga-bha': '𑊟',
    'varga-ma': '𑊠',
    'varga-ya': '𑊡',
    'varga-ra': '𑊢',
    'varga-la': '𑊣',
    'varga-va': '𑊤',
    'varga-sa': '𑊥',
    'varga-ha': '𑊦',
    'varga-rra': '𑊧',
    'varga-rha': '𑊨',
  },  // 穆尔塔尼文：33/33（丢了 nga 与三个咝音，添了 ṛa 与 ṛha）
  khudawadi: {
    'varga-ka': '𑊺',
    'varga-kha': '𑊻',
    'varga-ga': '𑊼',
    'varga-gga': '𑊽',
    'varga-gha': '𑊾',
    'varga-nga': '𑊿',
    'varga-ca': '𑋀',
    'varga-cha': '𑋁',
    'varga-ja': '𑋂',
    'varga-jja': '𑋃',
    'varga-jha': '𑋄',
    'varga-nya': '𑋅',
    'varga-tta': '𑋆',
    'varga-ttha': '𑋇',
    'varga-dda': '𑋈',
    'varga-ddda': '𑋉',
    'varga-rra': '𑋊',
    'varga-ddha': '𑋋',
    'varga-nna': '𑋌',
    'varga-ta': '𑋍',
    'varga-tha': '𑋎',
    'varga-da': '𑋏',
    'varga-dha': '𑋐',
    'varga-na': '𑋑',
    'varga-pa': '𑋒',
    'varga-pha': '𑋓',
    'varga-ba': '𑋔',
    'varga-bba': '𑋕',
    'varga-bha': '𑋖',
    'varga-ma': '𑋗',
    'varga-ya': '𑋘',
    'varga-ra': '𑋙',
    'varga-la': '𑋚',
    'varga-va': '𑋛',
    'varga-sha': '𑋜',
    'varga-sa': '𑋝',
    'varga-ha': '𑋞',
  },  // 胡达瓦迪文：37/37（信德内爆音四个 + ṛa）
  dogra: {
    'varga-ka': '𑠊',
    'varga-kha': '𑠋',
    'varga-ga': '𑠌',
    'varga-gha': '𑠍',
    'varga-nga': '𑠎',
    'varga-ca': '𑠏',
    'varga-cha': '𑠐',
    'varga-ja': '𑠑',
    'varga-jha': '𑠒',
    'varga-nya': '𑠓',
    'varga-tta': '𑠔',
    'varga-ttha': '𑠕',
    'varga-dda': '𑠖',
    'varga-ddha': '𑠗',
    'varga-nna': '𑠘',
    'varga-ta': '𑠙',
    'varga-tha': '𑠚',
    'varga-da': '𑠛',
    'varga-dha': '𑠜',
    'varga-na': '𑠝',
    'varga-pa': '𑠞',
    'varga-pha': '𑠟',
    'varga-ba': '𑠠',
    'varga-bha': '𑠡',
    'varga-ma': '𑠢',
    'varga-ya': '𑠣',
    'varga-ra': '𑠤',
    'varga-la': '𑠥',
    'varga-va': '𑠦',
    'varga-sha': '𑠧',
    'varga-ssa': '𑠨',
    'varga-sa': '𑠩',
    'varga-ha': '𑠪',
    'varga-rra': '𑠫',
  },  // 多格拉文：34/34（33 个梵语音位 + ṛa）

  // ── 尼瓦尔文（尼泊尔巴沙语） ────────────────────────────────────
  // 尼瓦尔文排在梵语字音表的 33 个辅音位上，外加它自己的六个"浊送音"
  // （murmured）：ṅha、ñha、nha、mha 是带气声的鼻音，lha 是带气声的边音，
  // rha 是带气声的卷舌闪音——最后这个音与夏拉达支系的 ṛha（Devanagari ढ़）
  // 是同一个槽位，所以它接回既有的 varga-rha，另外五个各立一格。
  newa: {
    'varga-ka': '𑐎',
    'varga-kha': '𑐏',
    'varga-ga': '𑐐',
    'varga-gha': '𑐑',
    'varga-nga': '𑐒',
    'varga-ngha': '𑐓',
    'varga-ca': '𑐔',
    'varga-cha': '𑐕',
    'varga-ja': '𑐖',
    'varga-jha': '𑐗',
    'varga-nya': '𑐘',
    'varga-nyha': '𑐙',
    'varga-tta': '𑐚',
    'varga-ttha': '𑐛',
    'varga-dda': '𑐜',
    'varga-ddha': '𑐝',
    'varga-nna': '𑐞',
    'varga-ta': '𑐟',
    'varga-tha': '𑐠',
    'varga-da': '𑐡',
    'varga-dha': '𑐢',
    'varga-na': '𑐣',
    'varga-nha': '𑐤',
    'varga-pa': '𑐥',
    'varga-pha': '𑐦',
    'varga-ba': '𑐧',
    'varga-bha': '𑐨',
    'varga-ma': '𑐩',
    'varga-mha': '𑐪',
    'varga-ya': '𑐫',
    'varga-ra': '𑐬',
    'varga-rha': '𑐭',
    'varga-la': '𑐮',
    'varga-lha': '𑐯',
    'varga-va': '𑐰',
    'varga-sha': '𑐱',
    'varga-ssa': '𑐲',
    'varga-sa': '𑐳',
    'varga-ha': '𑐴',
  },  // 尼瓦尔文：39/39（33 个梵语音位 + 6 个浊送音）

  // ── 外缘支流：高加索阿尔巴尼亚、古彼尔姆、埃尔巴桑、维特库奇 ─────────
  // 四套字母的音值分别照 N4131（高加索阿尔巴尼亚，Sinai 重写本转写表）、
  // N4263（古彼尔姆，Lytkin 1952 的字母序与西里尔从属对照）、N3985（埃尔巴桑，
  // 字名即现代阿尔巴尼亚字母表，§3 说明 ç 写作 CH、e 写作 EI、ë 写作 E）、
  // N5138（维特库奇，字名同样取自阿尔巴尼亚字母表）。对接原则：
  // 音值能落到上面某个槽位的就接过去，落不到的（挤喉音、擦音、腭化辅音、
  // 央元音、双写的第二个字母）各立一格，走过去时飞入。

  // 高加索阿尔巴尼亚字母：52 个，按希腊式数值次序排。头七个字母
  // （a b g d e z ē）与希腊 α β γ δ ε ζ η 位置、音值都对得上；
  // 其余字母按音值接（i l n x h o f r s v w……），本地音位另立格子。
  'caucasian-albanian': {
    aleph: '𐔰', // 1 ALT a
    beth: '𐔱', // 2 BET b
    gimel: '𐔲', // 3 GIM g
    daleth: '𐔳', // 4 DAT d
    he: '𐔴', // 5 EB e
    zayin: '𐔵', // 6 ZARL z
    heth: '𐔶', // 7 EYN ē：第 7 位、长 e，与希腊 Η 同位
    zhe: '𐔷', // 8 ZHIL ž
    teth: '𐔸', // 9 TAS ṭ：第 9 位、字母名近闪米特 tēt／希腊 Θ，接 teth
    'per-cha': '𐔹', // 10 CHA ć
    'yod-cons': '𐔺', // 11 YOWD y（半元音 j）
    'per-zha': '𐔻', // 12 ZHA ź
    yodh: '𐔼', // 13 IRB i
    'per-ayn': '𐔽', // 14 SHA ʕ（咽音）
    lamedh: '𐔾', // 15 LAN l
    'per-inya': '𐔿', // 16 INYA n’
    chi: '𐕀', // 17 XEYN x
    'per-dyan': '𐕁', // 18 DYAN d’
    tse: '𐕂', // 19 CAR c̣（塞擦音 c）
    je: '𐕃', // 20 JHOX ʒ́（浊塞擦音）
    kaph: '𐕄', // 21 KAR ḳ
    'per-lyit': '𐕅', // 22 LYIT l’
    h: '𐕆', // 23 HEYT h
    'per-qay': '𐕇', // 24 QAY x̣
    'per-aor': '𐕈', // 25 AOR å
    'per-choy': '𐕉', // 26 CHOY ć（第二个 ć）
    che: '𐕊', // 27 CHI č̣
    'per-cyay': '𐕋', // 28 CYAY c’：N4131 明说音值未定，不硬接
    mem: '𐕌', // 29 MAQ m
    qoph: '𐕍', // 30 QAR q̇
    nun: '𐕎', // 31 NOWC n
    'per-dzyay': '𐕏', // 32 DZYAY ʒ’：音值未定
    sha: '𐕐', // 33 SHAK š
    'per-jayn': '𐕑', // 34 JAYN ž：音值未定，另立一格
    ayin: '𐕒', // 35 ON o
    'per-tyay': '𐕓', // 36 TYAY ṭ’
    phi: '𐕔', // 37 FAM f
    'per-dzay': '𐕕', // 38 DZAY ʒ
    'per-chat': '𐕖', // 39 CHAT č
    'per-pen': '𐕗', // 40 PEN ṗ
    'per-gheys': '𐕘', // 41 GHEYS ġ
    resh: '𐕙', // 42 RAT r
    shin: '𐕚', // 43 SEYK s
    vede: '𐕛', // 44 VEYZ v（与西里尔 В 同位）
    taw: '𐕜', // 45 TIWR ṭ：与 TAS 同写作 ṭ，按字名近亚美尼亚 տիւն（t）接 taw
    'per-shoy': '𐕝', // 46 SHOY ś
    'per-iwn': '𐕞', // 47 IWN ü
    'per-cyaw': '𐕟', // 48 CYAW c’
    'per-cayn': '𐕠', // 49 CAYN c
    digamma: '𐕡', // 50 YAYD w（希腊 Ϝ 的音位）
    'per-piwr': '𐕢', // 51 PIWR p
    'per-kiw': '𐕣', // 52 KIW k
  },

  // 古彼尔姆字母：38 个，字母次序照 Lytkin 1952（1-24 主字母、25-34 补充、
  // 末尾四对从属形）。模型是希腊＋西里尔，所以能接西里尔槽位的一律接过去
  // （ž→zhe、č→che、š→sha、šč→shcha、ъ→er、ь→erj、ы→ery、ѣ→jat、е→ye、
  // ю→yu、я→ya、ѧ→yus-small、ѡ→omega），只有 Cyrillic 也没有的 dž 与
  // 两个"第二个字母"另立格子。
  'old-permic': {
    aleph: '𐍐', // 1 AN a
    beth: '𐍑', // 2 BUR b
    gimel: '𐍒', // 3 GAI g
    daleth: '𐍓', // 4 DOI d
    he: '𐍔', // 5 E e
    zhe: '𐍕', // 6 ZHOI ž
    'per-dzh': '𐍖', // 7 DZHOI dž（西里尔没有这个音位）
    zayin: '𐍗', // 8 ZATA z
    'per-dz': '𐍘', // 9 DZITA dz
    yodh: '𐍙', // 10 I i
    kaph: '𐍚', // 11 KOKE k
    lamedh: '𐍛', // 12 LEI l
    mem: '𐍜', // 13 MENOE m
    nun: '𐍝', // 14 NENOE n
    vede: '𐍞', // 15 VOOI v
    pe: '𐍟', // 16 PEEI p
    resh: '𐍠', // 17 REI r
    shin: '𐍡', // 18 SII s
    taw: '𐍢', // 19 TAI t
    waw: '𐍣', // 20 U u
    che: '𐍤', // 21 CHERY č
    sha: '𐍥', // 22 SHOOI š
    shcha: '𐍦', // 22a SHCHOOI šč
    ery: '𐍧', // 23 YRY ы
    'perm-yeru': '𐍨', // 23a YERU：YRY 的从属形，另立一格
    ayin: '𐍩', // 24 O o
    omega: '𐍪', // 24a OO ѡ
    phi: '𐍫', // 25 EF f
    h: '𐍬', // 26 HA h
    tse: '𐍭', // 27 TSIU c
    'perm-ver': '𐍮', // 28 VER：第二个 v 字母
    er: '𐍯', // 29 YER ъ
    erj: '𐍰', // 30 YERI ь
    jat: '𐍱', // 31 YAT ѣ
    ye: '𐍲', // 32 IE е
    yu: '𐍳', // 33 YU ю
    ya: '𐍴', // 34 YA я
    'yus-small': '𐍵', // 34a IA ѧ
  },

  // 埃尔巴桑字母：40 个，字名就是现代阿尔巴尼亚字母表（N3985 §3：ç 写作 CH、
  // e 写作 EI、ë 写作 E），所以音值可靠。能接希腊／西里尔槽位的接过去，
  // 阿尔巴尼亚语特有的音位（ç、dh、gj、ll、nj、q、rr、x、y、ë、γ 的第二个
  // 字母……）另立格子。
  elbasan: {
    aleph: '𐔀', // A a
    beth: '𐔁', // BE b
    tse: '𐔂', // CE c（塞擦音）
    che: '𐔃', // CHE ç
    daleth: '𐔄', // DE d
    'per-nd': '𐔅', // NDE 前鼻化的 nd
    'per-dh': '𐔆', // DHE dh（ð）
    he: '𐔇', // EI e
    schwa: '𐔈', // E ë（央元音）
    phi: '𐔉', // FE f
    gimel: '𐔊', // GE g
    'per-gj': '𐔋', // GJE gj（ɟ）
    h: '𐔌', // HE h
    yodh: '𐔍', // I i
    'yod-cons': '𐔎', // JE j
    kaph: '𐔏', // KE k
    lamedh: '𐔐', // LE l
    'per-ll': '𐔑', // LLE ll
    mem: '𐔒', // ME m
    nun: '𐔓', // NE n
    'per-n2': '𐔔', // NA：专用于前鼻化位置的第二个 n
    'per-nj': '𐔕', // NJE nj（ɲ）
    ayin: '𐔖', // O o
    pe: '𐔗', // PE p
    'per-q': '𐔘', // QE q（c）
    resh: '𐔙', // RE r
    'per-rr': '𐔚', // RRE rr
    shin: '𐔛', // SE s
    sha: '𐔜', // SHE sh
    taw: '𐔝', // TE t
    teth: '𐔞', // THE th（θ）
    waw: '𐔟', // U u
    vede: '𐔠', // VE v
    'per-dz': '𐔡', // XE x（dz）
    'per-y': '𐔢', // Y y（圆唇前元音）
    zayin: '𐔣', // ZE z
    zhe: '𐔤', // ZHE zh
    gha: '𐔥', // GHE ɣ
    'per-ghamma': '𐔦', // GHAMMA：第二个 ɣ
    chi: '𐔧', // KHE khe（x）
  },

  // 维特库奇字母：Unicode 收录的是 Veqilharxhi 1844 年那 35 个字母（大小写各
  // 一套，这里统一取小写），音值照 N5138 §6 的对应表。它按阿尔巴尼亚字母表
  // 排，与埃尔巴桑是同一套音位，所以两站之间大部分格子能原地变形；
  // 缺的字母（gj、rr、xh、zh）是 19 世纪原本就没造、现代才补的，
  // 走到它这一站时按"消失"处理。
  vithkuqi: {
    aleph: '𐖗', // A a
    'per-bbe': '𐖘', // BBE ƀ：与 BE 并存的第二个 b 字母
    beth: '𐖙', // BE b
    tse: '𐖚', // CE c
    che: '𐖛', // CHE ç
    daleth: '𐖜', // DE d
    'per-dh': '𐖝', // DHE dh
    he: '𐖞', // EI e
    schwa: '𐖟', // E ë
    phi: '𐖠', // FE f
    gimel: '𐖡', // GA g
    h: '𐖣', // HA h
    'per-hha': '𐖤', // HHA ħ
    yodh: '𐖥', // I i
    'per-gj': '𐖦', // IJE：写成 g / j 之后带一个 ĩ，记的就是 gj 这个音
    'yod-cons': '𐖧', // JE j
    kaph: '𐖨', // KA k
    lamedh: '𐖩', // LA l
    'per-ll': '𐖪', // LLA ll
    mem: '𐖫', // ME m
    nun: '𐖬', // NE n
    'per-nj': '𐖭', // NJE nj
    ayin: '𐖮', // O o
    pe: '𐖯', // PE p
    'per-q': '𐖰', // QA q
    resh: '𐖱', // RE r
    shin: '𐖳', // SE s
    sha: '𐖴', // SHE sh
    taw: '𐖵', // TE t
    teth: '𐖶', // THE th
    waw: '𐖷', // U u
    vede: '𐖸', // VE v
    'per-dz': '𐖹', // XE x（dz）
    'per-y': '𐖻', // Y y
    zayin: '𐖼', // ZE z
  },

  // ── 假名：汉字借字 → 平假名 → 片假名 ──────────────────────────────
  // 一个音节一格。汉字一列是万叶假名里给这个音用的借字（平假名那一套），
  // 平假名取整字的草书，片假名取整字的一个部件；两边挑了不同汉字的音，
  // 格子里只能放一个，这里放平假名的借字，片假名的借字写在槽位名里。
  // 浊音、半浊音没有借字：它们在这张表里是纯新增，走过去时飞入。
  'chinese-regular': {
    'kana-a': '安', // 安（片假名作「阿」）
    'kana-i': '以', // 以（片假名作「伊」）
    'kana-u': '宇', // 宇
    'kana-e': '衣', // 衣（片假名作「江」）
    'kana-o': '於', // 於
    'kana-ka': '加', // 加
    'kana-ki': '幾', // 幾
    'kana-ku': '久', // 久
    'kana-ke': '計', // 計（片假名作「介」）
    'kana-ko': '己', // 己
    'kana-sa': '左', // 左（片假名作「散」）
    'kana-shi': '之', // 之
    'kana-su': '寸', // 寸（片假名作「須」）
    'kana-se': '世', // 世
    'kana-so': '曽', // 曽
    'kana-ta': '太', // 太（片假名作「多」）
    'kana-chi': '知', // 知（片假名作「千」）
    'kana-tsu': '川', // 川
    'kana-te': '天', // 天
    'kana-to': '止', // 止
    'kana-na': '奈', // 奈
    'kana-ni': '仁', // 仁（片假名作「二」）
    'kana-nu': '奴', // 奴
    'kana-ne': '祢', // 祢
    'kana-no': '乃', // 乃
    'kana-ha': '波', // 波（片假名作「八」）
    'kana-hi': '比', // 比
    'kana-fu': '不', // 不
    'kana-he': '部', // 部
    'kana-ho': '保', // 保
    'kana-ma': '末', // 末（片假名作「万」）
    'kana-mi': '美', // 美（片假名作「三」）
    'kana-mu': '武', // 武（片假名作「牟」）
    'kana-me': '女', // 女
    'kana-mo': '毛', // 毛
    'kana-ya': '也', // 也
    'kana-yu': '由', // 由
    'kana-yo': '与', // 与
    'kana-ra': '良', // 良
    'kana-ri': '利', // 利
    'kana-ru': '留', // 留（片假名作「流」）
    'kana-re': '礼', // 礼
    'kana-ro': '呂', // 呂
    'kana-wa': '和', // 和
    'kana-wi': '為', // 為（片假名作「井」）
    'kana-we': '恵', // 恵
    'kana-wo': '遠', // 遠（片假名作「乎」）
    'kana-n': '无', // 无（片假名作「尓」）
  },  // 汉字借字：48

  hiragana: {
    'kana-a': 'あ', // 安
    'kana-i': 'い', // 以
    'kana-u': 'う', // 宇
    'kana-e': 'え', // 衣
    'kana-o': 'お', // 於
    'kana-ka': 'か', // 加
    'kana-ki': 'き', // 幾
    'kana-ku': 'く', // 久
    'kana-ke': 'け', // 計
    'kana-ko': 'こ', // 己
    'kana-sa': 'さ', // 左
    'kana-shi': 'し', // 之
    'kana-su': 'す', // 寸
    'kana-se': 'せ', // 世
    'kana-so': 'そ', // 曽
    'kana-ta': 'た', // 太
    'kana-chi': 'ち', // 知
    'kana-tsu': 'つ', // 川
    'kana-te': 'て', // 天
    'kana-to': 'と', // 止
    'kana-na': 'な', // 奈
    'kana-ni': 'に', // 仁
    'kana-nu': 'ぬ', // 奴
    'kana-ne': 'ね', // 祢
    'kana-no': 'の', // 乃
    'kana-ha': 'は', // 波
    'kana-hi': 'ひ', // 比
    'kana-fu': 'ふ', // 不
    'kana-he': 'へ', // 部
    'kana-ho': 'ほ', // 保
    'kana-ma': 'ま', // 末
    'kana-mi': 'み', // 美
    'kana-mu': 'む', // 武
    'kana-me': 'め', // 女
    'kana-mo': 'も', // 毛
    'kana-ya': 'や', // 也
    'kana-yu': 'ゆ', // 由
    'kana-yo': 'よ', // 与
    'kana-ra': 'ら', // 良
    'kana-ri': 'り', // 利
    'kana-ru': 'る', // 留
    'kana-re': 'れ', // 礼
    'kana-ro': 'ろ', // 呂
    'kana-wa': 'わ', // 和
    'kana-wi': 'ゐ', // 為
    'kana-we': 'ゑ', // 恵
    'kana-wo': 'を', // 遠
    'kana-n': 'ん', // 无
    'kana-ga': 'が', // か 加浊点
    'kana-gi': 'ぎ', // き 加浊点
    'kana-gu': 'ぐ', // く 加浊点
    'kana-ge': 'げ', // け 加浊点
    'kana-go': 'ご', // こ 加浊点
    'kana-za': 'ざ', // さ 加浊点
    'kana-ji': 'じ', // し 加浊点
    'kana-zu': 'ず', // す 加浊点
    'kana-ze': 'ぜ', // せ 加浊点
    'kana-zo': 'ぞ', // そ 加浊点
    'kana-da': 'だ', // た 加浊点
    'kana-di': 'ぢ', // ち 加浊点
    'kana-du': 'づ', // つ 加浊点
    'kana-de': 'で', // て 加浊点
    'kana-do': 'ど', // と 加浊点
    'kana-ba': 'ば', // は 加浊点
    'kana-bi': 'び', // ひ 加浊点
    'kana-bu': 'ぶ', // ふ 加浊点
    'kana-be': 'べ', // へ 加浊点
    'kana-bo': 'ぼ', // ほ 加浊点
    'kana-pa': 'ぱ', // は 加浊点
    'kana-pi': 'ぴ', // ひ 加浊点
    'kana-pu': 'ぷ', // ふ 加浊点
    'kana-pe': 'ぺ', // へ 加浊点
    'kana-po': 'ぽ', // ほ 加浊点
  },  // 平假名：48 + 25

  katakana: {
    'kana-a': 'ア', // 阿
    'kana-i': 'イ', // 伊
    'kana-u': 'ウ', // 宇
    'kana-e': 'エ', // 江
    'kana-o': 'オ', // 於
    'kana-ka': 'カ', // 加
    'kana-ki': 'キ', // 幾
    'kana-ku': 'ク', // 久
    'kana-ke': 'ケ', // 介
    'kana-ko': 'コ', // 己
    'kana-sa': 'サ', // 散
    'kana-shi': 'シ', // 之
    'kana-su': 'ス', // 須
    'kana-se': 'セ', // 世
    'kana-so': 'ソ', // 曽
    'kana-ta': 'タ', // 多
    'kana-chi': 'チ', // 千
    'kana-tsu': 'ツ', // 川
    'kana-te': 'テ', // 天
    'kana-to': 'ト', // 止
    'kana-na': 'ナ', // 奈
    'kana-ni': 'ニ', // 二
    'kana-nu': 'ヌ', // 奴
    'kana-ne': 'ネ', // 祢
    'kana-no': 'ノ', // 乃
    'kana-ha': 'ハ', // 八
    'kana-hi': 'ヒ', // 比
    'kana-fu': 'フ', // 不
    'kana-he': 'ヘ', // 部
    'kana-ho': 'ホ', // 保
    'kana-ma': 'マ', // 万
    'kana-mi': 'ミ', // 三
    'kana-mu': 'ム', // 牟
    'kana-me': 'メ', // 女
    'kana-mo': 'モ', // 毛
    'kana-ya': 'ヤ', // 也
    'kana-yu': 'ユ', // 由
    'kana-yo': 'ヨ', // 与
    'kana-ra': 'ラ', // 良
    'kana-ri': 'リ', // 利
    'kana-ru': 'ル', // 流
    'kana-re': 'レ', // 礼
    'kana-ro': 'ロ', // 呂
    'kana-wa': 'ワ', // 和
    'kana-wi': 'ヰ', // 井
    'kana-we': 'ヱ', // 恵
    'kana-wo': 'ヲ', // 乎
    'kana-n': 'ン', // 尓
    'kana-ga': 'ガ', // か 加浊点
    'kana-gi': 'ギ', // き 加浊点
    'kana-gu': 'グ', // く 加浊点
    'kana-ge': 'ゲ', // け 加浊点
    'kana-go': 'ゴ', // こ 加浊点
    'kana-za': 'ザ', // さ 加浊点
    'kana-ji': 'ジ', // し 加浊点
    'kana-zu': 'ズ', // す 加浊点
    'kana-ze': 'ゼ', // せ 加浊点
    'kana-zo': 'ゾ', // そ 加浊点
    'kana-da': 'ダ', // た 加浊点
    'kana-di': 'ヂ', // ち 加浊点
    'kana-du': 'ヅ', // つ 加浊点
    'kana-de': 'デ', // て 加浊点
    'kana-do': 'ド', // と 加浊点
    'kana-ba': 'バ', // は 加浊点
    'kana-bi': 'ビ', // ひ 加浊点
    'kana-bu': 'ブ', // ふ 加浊点
    'kana-be': 'ベ', // へ 加浊点
    'kana-bo': 'ボ', // ほ 加浊点
    'kana-pa': 'パ', // は 加浊点
    'kana-pi': 'ピ', // ひ 加浊点
    'kana-pu': 'プ', // ふ 加浊点
    'kana-pe': 'ペ', // へ 加浊点
    'kana-po': 'ポ', // ほ 加浊点
  },  // 片假名：48 + 25

  // ── 南闪米特与乌加里特：保留 29/30 个辅音的那几套字母 ─────────────
  // 这三套都不走腓尼基—阿拉米的 22 字母合并路线：*ḫ *ḏ *ġ *ṯ *ẓ *ḍ 各自分写，
  // 南阿拉伯还多一个 s¹。前 22 格按字母名接回闪米特祖形，多出来的接上面那几格。
  ugaritic: {
    aleph: '𐎀',   // alpa
    beth: '𐎁',    // beta
    gimel: '𐎂',   // gamla
    daleth: '𐎄',  // delta
    he: '𐎅',      // ho
    waw: '𐎆',     // wo
    zayin: '𐎇',   // zeta
    heth: '𐎈',    // hota
    teth: '𐎉',    // tet
    yodh: '𐎊',    // yod
    kaph: '𐎋',    // kaf
    lamedh: '𐎍',  // lamda
    mem: '𐎎',     // mem
    nun: '𐎐',     // nun
    samekh: '𐎒',  // samka
    ayin: '𐎓',    // ain
    pe: '𐎔',      // pu
    sadhe: '𐎕',   // sade
    qoph: '𐎖',    // qopa
    resh: '𐎗',    // rasha
    shin: '𐎌',    // shin
    taw: '𐎚',     // to
    kha: '𐎃',     // kha
    dhal: '𐎏',    // dhal
    zah: '𐎑',     // zu（ẓ）
    tha: '𐎘',     // thanna（ṯ）
    ghayn: '𐎙',   // ghain（ġ）
    'ugarit-i': '𐎛',
    'ugarit-u': '𐎜',
    'ugarit-ssu': '𐎝',
  },  // 乌加里特字母：30/30
  'old-south-arabian': {
    aleph: '𐩱',
    beth: '𐩨',
    gimel: '𐩴',
    daleth: '𐩵',
    he: '𐩠',
    waw: '𐩥',
    zayin: '𐩸',
    heth: '𐩢',
    teth: '𐩷',
    yodh: '𐩺',
    kaph: '𐩫',
    lamedh: '𐩡',
    mem: '𐩣',
    nun: '𐩬',
    samekh: '𐩯',
    ayin: '𐩲',
    pe: '𐩰',
    sadhe: '𐩮',
    qoph: '𐩤',
    resh: '𐩧',
    shin: '𐩦',
    taw: '𐩩',
    kha: '𐩭',
    dad: '𐩳',
    ghayn: '𐩶',
    dhal: '𐩹',
    tha: '𐩻',
    zah: '𐩼',
    sate: '𐩪',
  },  // 古南阿拉伯字母：29/29
  'old-north-arabian': {
    aleph: '𐪑',
    beth: '𐪈',
    gimel: '𐪔',
    daleth: '𐪕',
    he: '𐪀',
    waw: '𐪅',
    zayin: '𐪘',
    heth: '𐪂',
    teth: '𐪗',
    yodh: '𐪚',
    kaph: '𐪋',
    lamedh: '𐪁',
    mem: '𐪃',
    nun: '𐪌',
    samekh: '𐪏',
    ayin: '𐪒',
    pe: '𐪐',
    sadhe: '𐪎',
    qoph: '𐪄',
    resh: '𐪇',
    shin: '𐪆',
    taw: '𐪉',
    kha: '𐪍',
    dad: '𐪓',
    ghayn: '𐪖',
    dhal: '𐪙',
    tha: '𐪛',
    zah: '𐪜',
    sate: '𐪊',
  },  // 古北阿拉伯字母：29/29

  // ── 阿拉米东支的中古伊朗与中亚字母 ────────────────────────────
  // 这四套都是阿拉米字母的地方后身，字母名和 22 个字母的次序照旧（Unicode 的
  // 字名直接写的就是 aleph … taw），所以整表接在闪米特那 22 个槽位上。
  // 花剌子模字母丢了 teth、sadhe、qoph 三个字母，粟特字母丢了 teth 和 qoph：
  // 走到那两站时，对应的格子会把字母送出去。词尾形是同一个字母的位置变体，
  // 不另占格子。
  parthian: {
    aleph: '𐭀',
    beth: '𐭁',
    gimel: '𐭂',
    daleth: '𐭃',
    he: '𐭄',
    waw: '𐭅',
    zayin: '𐭆',
    heth: '𐭇',
    teth: '𐭈',
    yodh: '𐭉',
    kaph: '𐭊',
    lamedh: '𐭋',
    mem: '𐭌',
    nun: '𐭍',
    samekh: '𐭎',
    ayin: '𐭏',
    pe: '𐭐',
    sadhe: '𐭑',
    qoph: '𐭒',
    resh: '𐭓',
    shin: '𐭔',
    taw: '𐭕',
  },  // 帕提亚字母：22/22
  elymaic: {
    aleph: '𐿠',
    beth: '𐿡',
    gimel: '𐿢',
    daleth: '𐿣',
    he: '𐿤',
    waw: '𐿥',
    zayin: '𐿦',
    heth: '𐿧',
    teth: '𐿨',
    yodh: '𐿩',
    kaph: '𐿪',
    lamedh: '𐿫',
    mem: '𐿬',
    nun: '𐿭',
    samekh: '𐿮',
    ayin: '𐿯',
    pe: '𐿰',
    sadhe: '𐿱',
    qoph: '𐿲',
    resh: '𐿳',
    shin: '𐿴',
    taw: '𐿵',
  },  // 埃利迈字母：22/22
  chorasmian: {
    aleph: '𐾰',
    beth: '𐾲',
    gimel: '𐾳',
    daleth: '𐾴',
    he: '𐾵',
    waw: '𐾶',
    zayin: '𐾸',
    heth: '𐾹',
    yodh: '𐾺',
    kaph: '𐾻',
    lamedh: '𐾼',
    mem: '𐾽',
    nun: '𐾾',
    samekh: '𐾿',
    ayin: '𐿀',
    pe: '𐿁',
    resh: '𐿂',
    shin: '𐿃',
    taw: '𐿄',
  },  // 花剌子模字母：22 个字母里少了 teth / sadhe / qoph
  // 粟特字母（早期）：阿拉米 22 个字母里少了 teth 与 qoph；r / ʿ / d 在《古代
  // 书信》里写成同一个字面，Unicode 也就只收了一个 U+10F18 RESH-AYIN-DALETH，
  // 所以 daleth 与 resh 两格都指向它——两个槽位合流成一个字形（同哈特拉的
  // daleth-resh）。Unicode 第 14 章把它说得很明白："In the Ancient Letters, the
  // usual glyph for resh is identical to the glyph for daleth and for ayin."
  'old-sogdian': {
    aleph: '𐼀',
    beth: '𐼂',
    gimel: '𐼄',
    daleth: '𐼘',
    he: '𐼅',
    waw: '𐼇',
    digamma: '𐼇',
    zayin: '𐼈',
    heth: '𐼉',
    yodh: '𐼊',
    kaph: '𐼋',
    lamedh: '𐼌',
    mem: '𐼍',
    nun: '𐼎',
    samekh: '𐼑',
    ayin: '𐼒',
    pe: '𐼔',
    sadhe: '𐼕',
    resh: '𐼘',
    shin: '𐼙',
    taw: '𐼚',
  },
};

/**
 * 字母表对照表 = 上面这套手工核过的对照（闪米特—希腊—拉丁一线与婆罗米系的
 * varga 辅音位），再并上婆罗米系各家的独立元音（src/data/svaraSlots.ts）。
 * 同一条轨道上的两面在同一个槽位上有字面，字母场就在那一格做形变；只在一面
 * 有的格子按字母表的增删处理，飞入或飞出。
 */
export const letterMaps: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(coreLetterMaps).map(([id, map]) => [id, { ...map, ...(svaraMaps[id] ?? {}) }]),
);

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
