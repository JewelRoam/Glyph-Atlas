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
 *  · 阿拉米东支：粟特、回鹘、碑铭巴列维、诗篇巴列维；
 *  · 回鹘的下游：蒙古字母；
 *  · 阿维斯陀：巴列维的经书后身，字母从 22 个扩到 54 个（见 av-* 槽位）；
 *  · 安纳托利亚两支：吕基亚、吕底亚（希腊字母的地方化分支；卡里亚的音值
 *    对应没有定论，不建整表）；
 *  · 婆罗米系（梵语字音表 varga 的 33 个辅音位）：婆罗米、悉昙、格兰塔、
 *    天城、孟加拉、古吉拉特、果鲁穆奇、奥里亚、泰米尔、泰卢固、卡纳达、
 *    马拉雅拉姆、僧伽罗、藏文、爪哇、巴厘、高棉、泰文、老挝文、缅文。
 *  · 外缘支流：高加索阿尔巴尼亚、古彼尔姆、埃尔巴桑、维特库奇——按音位
 *    位次与上面各表对齐，多出来的音位另立一格（见 per 系与 perm 系槽位）。
 *
 * 三套槽位各管各的：开头是闪米特—希腊的字母位（ʾālep → Α → A 那条线），
 * 中间 av-* 是阿维斯陀自己新造的字母，mong-* 是蒙古在回鹘之上分出的字母
 * （这两组都只在各自那条轨道上用得到），
 * 末尾的 varga-* 是梵语字音表的辅音位（婆罗米 ka → 天城 क → 泰文 ก 那条线）。
 * 一条轨道上只会出现其中一套或两套相邻的字母位，格子不会混。
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
  },  // 马拉雅拉姆文：33/33
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
  },  // 僧伽罗文：33/33
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
  },  // 藏文：32/33
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
    'varga-nya': 'ꦘ',
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
  },  // 爪哇文：33/33
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
  },  // 巴厘文：33/33
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
  },  // 高棉文：33/33
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
  },  // 泰文：33/33
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
  },  // 老挝文：33/33
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
  },  // 缅文：33/33

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
