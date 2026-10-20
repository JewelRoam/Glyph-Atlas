/**
 * 一张「图版」：没有字库、也没有 Unicode 编码的书写体系（印度河、玛雅、
 * 朗格朗日……）排不出逐字字表，只能拿一两幅有代表性的实物照片或摹本，
 * 说明这套文字长什么样。
 */
export interface GlyphPlate {
  /** public/ 下的相对路径（渲染时再拼 Vite 的 BASE_URL） */
  src: string;
  /** 图注：这张图拍的是什么 */
  caption: string;
  credit: string;
  license: string;
  /** 出处链接 */
  home?: string;
}

/**
 * 图版清单。
 *
 * 这些书写体系既没有可用的开源字库，也没有（或几乎没有）Unicode 编码，
 * 排不出逐字字表，只能用一两幅有代表性的实物照片或摹本来显示它长什么样。
 * 每一幅的出处、作者与授权都逐条写清楚，并同步登记在
 * public/glyphs/CREDITS.md；来源不明或授权不清的图不进仓库。
 */
export const glyphPlates: Record<string, GlyphPlate[]> = {
  'libyco-berber': [
    {
      src: 'glyphs/libyco-berber/sbeitla-funerary-stele.jpg',
      caption: '突尼斯西迪·阿里·巴赫卢勒出土的古代利比亚—柏柏尔墓碑，现存斯贝特拉博物馆。竖排刻文是提非纳文之前的古柏柏尔字母实例。',
      credit: 'DrRachT / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Libyco-berber_alphabet_funerary_stele_of_Tunisia_Sbeitla_Museum.jpg',
    },
    {
      src: 'glyphs/libyco-berber/dougga-bilingual-plate.jpg',
      caption: '道加（Dougga）利比亚—布匿双语铭文的早期图录（Gesenius, 1837）。上方是利比亚字母的摹写，可与下方布匿文对照。',
      credit: 'Wilhelm Gesenius / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Dougga_Libyan-Punic_inscription_in_Gesenius%27s_1837_Scripturae_Linguaeque_Phoeniciae_Monumenta.jpg',
    },
  ],
  indus: [
    {
      src: 'glyphs/indus/seal-bm.jpg',
      caption: '哈拉帕文明的石碑质印章与印痕，上面一行就是印度河文字。巴基斯坦西北部出土，大英博物馆 1912,0629.1。',
      credit: 'Zunkir / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Steatite_stamp_seal_Indus_script_-_BM_1912_0629_1.jpg',
    },
    {
      src: 'glyphs/indus/seals-mohenjo-daro.jpg',
      caption: '摩亨佐-达罗出土的两枚印章摹本。印度河文字约四千五百年前就在这类印章上出现，至今未解读。',
      credit: 'Wikimedia Commons（佚名）',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Mohenjo-Daro_Seals.png',
    },
  ],
  'proto-elamite': [
    {
      src: 'glyphs/proto-elamite/tablet-vigneron.jpg',
      caption: '原始埃兰泥板，约公元前 3000 年。数字与符号混写，是埃兰文字最早的一层。',
      credit: 'VIGNERON / Wikimedia Commons',
      license: 'CC BY 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Proto-Elamite_tablet.jpg',
    },
    {
      src: 'glyphs/proto-elamite/tablets-shahr-i-sokhta.jpg',
      caption: '沙赫里索赫塔出土的原始埃兰泥板：左侧实物，右侧是符号的线摹。',
      credit: 'S. M. S. Sajjadi & H. Moradi / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Proto-Elamite_Tablets.jpg',
    },
  ],
  olmec: [
    {
      src: 'glyphs/olmec/cascajal-block-drawing.png',
      caption: '卡斯卡哈尔石块的摹本：62 个符号排成 28 组，是奥尔梅克有"成串符号"的最强证据。',
      credit: 'Michael Everson 摹本，Kwamikagami 矢量重绘 / Wikimedia Commons',
      license: 'CC BY 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Cascajal-text.svg',
    },
    {
      src: 'glyphs/olmec/glyphs-san-andres.svg',
      caption: '圣安德烈斯遗址出土器物上的三组符号，被认为是奥尔梅克符号系统的一部分。',
      credit: 'Madman2001 / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Proposed_Olmec_glyphs_(San_Andres).svg',
    },
    {
      src: 'glyphs/olmec/cylinder-seal-san-andres.svg',
      caption: '圣安德烈斯圆筒印章滚出的图案，鸟与符号交替排列。',
      credit: 'Madman2001 / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:San_Andres_Cylinder_Seal_print_1.svg',
    },
  ],
  rethra: [
    {
      src: 'glyphs/rethra/knossos-144883.jpg',
      caption: '克诺索斯出土的克里特象形文字印章，约公元前 2100—1700 年，伊拉克利翁考古博物馆藏。',
      credit: 'Zde / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Cretan_hieroglyphs,_Knossos_2100-1700_BC,_AMH,_144883.jpg',
    },
    {
      src: 'glyphs/rethra/sign-37.jpg',
      caption: '克里特象形文字第 37 号符号（牛角）的几种写法。',
      credit: 'ShlomoKatzav / Wikimedia Commons',
      license: 'CC0 1.0',
      home: 'https://commons.wikimedia.org/wiki/File:Cretan_hieroglyph_37.jpg',
    },
  ],
  rongorongo: [
    {
      src: 'glyphs/rongorongo/tablet-r-atua-mata-riri.jpg',
      caption: '朗格朗日木牌 R（Atua-Mata-Riri）的一面。现存这类木牌只有二十余件，文字尚未解读。',
      credit: 'Wikimedia Commons（佚名）',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Rongorongo_R-a_Atua-Mata-Riri.jpg',
    },
    {
      src: 'glyphs/rongorongo/signs-guy.png',
      caption: '朗格朗日符号与可能的释义（Jacques B. M. Guy 整理）。右栏的解释只是描述性的猜测。',
      credit: 'Jacques B. M. Guy',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Rongorongo-sample-en.png',
    },
  ],
  'proto-sinaitic': [
    {
      src: 'glyphs/proto-sinaitic/inscription-351.png',
      caption: '西奈第 351 号铭文摹本（Gardiner, 1916）。狮身人面像上刻着十几个原始西奈字母，是字母表最早的实物之一。',
      credit: 'Alan H. Gardiner',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Proto-Sinaitic_inscription_number_351_(cropped).jpg',
    },
  ],
  pahlavi: [
    {
      src: 'glyphs/pahlavi/kottayam-cross.jpg',
      caption: '印度喀拉拉邦科塔亚姆教堂的十字架石刻，环刻巴列维字母（Book Pahlavi），是这种文字传播到南印度的实物。',
      credit: 'Wikimedia Commons（佚名）',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Stone_cross_with_Pahlavi_inscription.jpg',
    },
    {
      src: 'glyphs/pahlavi/inscription-met.jpg',
      caption: '萨珊时期巴列维铭文残石，纽约大都会艺术博物馆 52.74.2。',
      credit: 'The Met（开放素材）',
      license: 'CC0 1.0',
      home: 'https://commons.wikimedia.org/wiki/File:Fragment_of_a_Pahlavi_inscription_using_Middle_Persian_script_MET_ME52_74_2.jpg',
    },
  ],
  pallava: [
    {
      src: 'glyphs/pallava/aksharamala.png',
      caption: '帕拉瓦字母表：9 个元音、35 个辅音、9 个元音符号，再加上标点。南印度与东南亚诸文字的字母表几乎都长成这个样子。',
      credit: 'Symphonicallyu / Wikimedia Commons',
      license: 'CC0 1.0',
      home: 'https://commons.wikimedia.org/wiki/File:Pallava_aksharamala.png',
    },
  ],
  kadamba: [
    {
      src: 'glyphs/kadamba/edakkal-kerala.png',
      caption: '喀拉拉邦埃达卡尔出土的卡丹巴时期铭文拓本，约 5—6 世纪。',
      credit: 'E. Hultzsch & W. Griggs',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Kadamba_inscription_from_Kerala.jpg',
    },
  ],
  siddham: [
    {
      src: 'glyphs/siddham/faulmann-kutila.jpg',
      caption: 'Faulmann《文字之书》第 145 页的 Kuṭila 与阿萨姆书体对照表。左列 Kuṭila 字形取自 10 世纪铭文，右列用于比较阿萨姆书体。',
      credit: 'Carl Faulmann / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Das_Buch_der_Schrift_(Faulmann)_145.jpg',
    },
  ],
  nagari: [
    {
      src: 'glyphs/nagari/consonant-table.png',
      caption: '城文辅音表。天城文、孟加拉文等一批南亚文字都是从这里长出来的。',
      credit: 'Benedettou / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Nagari_Script_01.jpg',
    },
  ],
  'khitan-large': [
    {
      src: 'glyphs/khitan-large/dorlipun-epitaph.png',
      caption: '辽代《多里本墓志》碑阳拓本，1081 年，契丹大字。契丹大字借汉字形体而表意，与后来女真文的造字路子不同。',
      credit: 'Ci Jianu',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Epitaph_for_Court_Attendant_Dorlipun_in_Khitan_large_script_(obverse).jpg',
    },
  ],
  jurchen: [
    {
      src: 'glyphs/jurchen/stele-1224-rubbing.jpg',
      caption: '金代女真进士题名碑拓本局部，1224 年。这一面刻的是女真文，另一面刻汉文。',
      credit: 'Stephen Wootton Bushell',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Rubbing_of_Jurchen_stele_of_1224_XCERPT.jpg',
    },
    {
      src: 'glyphs/jurchen/serven-khaalga.jpg',
      caption: '蒙古肯特省色尔文哈勒嘎的女真摩崖，1196 年，与汉文石刻相隔约 18 米。',
      credit: 'Yastanovog / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Serven_Khaalga_Jurchen_inscription.jpg',
    },
  ],
  zapotec: [
    {
      src: 'glyphs/zapotec/monte-alban-12-13.jpg',
      caption: '蒙特阿尔班 12、13 号石碑，刻着萨波特克文字与历法符号。',
      credit: 'HJPD / Wikimedia Commons',
      license: 'CC BY 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Monte_Alban_Stela_12%2B13.jpg',
    },
  ],
  'epi-olmec': [
    {
      src: 'glyphs/epi-olmec/la-mojarra-stela-1.jpg',
      caption: '拉莫哈拉石碑 1 号与长纪年日期。地峡文字是美洲最早能读出整段话的文字之一。',
      credit: 'Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:La_Mojarra_Inscription_and_Long_Count_date.jpg',
    },
  ],
  aztec: [
    {
      src: 'glyphs/aztec/codex-mendoza-65r.jpg',
      caption: '《门多萨抄本》第 65 正面：纳瓦图画文字记年与贡赋，旁边的西班牙文是殖民时期的注记。',
      credit: 'Bodleian Libraries, University of Oxford',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Codex_Mendoza_folio_65r.png',
    },
  ],
  mixtec: [
    {
      src: 'glyphs/mixtec/codex-colombino.png',
      caption: '《科隆比诺抄本》的一页：米斯特克图画文字按年代编排，记录八鹿美洲虎爪的征战。',
      credit: 'World Digital Library / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Codex_Colombino_WDL3245.jpg',
    },
  ],
  nsibidi: [
    {
      src: 'glyphs/nsibidi/bamboo-scroll.jpg',
      caption: '竹简上的恩西比迪文。恩西比迪在尼日利亚东南部由埃克佩社使用，一部分符号可以直接表音。',
      credit: 'Jujuman778 / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Bamboo_Nsibidi_Scroll.jpg',
    },
  ],
  mandombe: [
    {
      src: 'glyphs/mandombe/reading-manual-sample.jpg',
      caption: '曼多姆贝识字课本的一页。这套文字 1978 年由 Wabeladio Payi 创制，字形按 2×3 的方格系统组合。',
      credit: 'Moyogo / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Mandombe_Sample.jpg',
    },
  ],
  khipu: [
    {
      src: 'glyphs/khipu/ancient-quipu-plate-xxii.jpg',
      caption: '《古代奇普》图版 22（Locke, 1912）。奇普用绳结的位置、方向与颜色记录，不是图形文字，但同样是编码系统。',
      credit: 'Leslie Leland Locke',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:The_Ancient_Quipu_Plate_XXII.jpg',
    },
  ],
  hieratic: [
    {
      src: 'glyphs/hieratic/edwin-smith-papyrus.jpg',
      caption: '《艾德温·史密斯纸草》：现存最早的外科文献之一，正文用僧侣体书写，约公元前 1600 年。',
      credit: 'Jeff Dahl / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Edwin_Smith_Papyrus_v2.jpg',
    },
  ],
  demotic: [
    {
      src: 'glyphs/demotic/turin-payment-contracts.jpg',
      caption: '都灵埃及博物馆藏世俗体纸草，一份纸草上写着几份付款契约。世俗体是僧侣体再草写的结果，笔画连成一体。',
      credit: 'Museo Egizio, Torino',
      license: 'CC0 1.0',
      home: 'https://commons.wikimedia.org/wiki/File:Demotic_papyrus_containing_two_payment_contracts_-_Museo_Egizio_Turin_S_6074_p01.jpg',
    },
  ],
  'chinese-clerical': [
    {
      src: 'glyphs/chinese-clerical/peicen-stele-rubbing.jpg',
      caption: '东汉《裴岑碑》拓本。隶书把篆书的圆转写成方折，笔画末尾带波磔，汉字从此定型为今天熟悉的方块结构。',
      credit: 'Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:%E8%A3%B4%E5%B2%91%E7%A2%91%E6%8B%93%E6%9C%AC.jpg',
    },
  ],
  dongba: [
    {
      src: 'glyphs/dongba/lijiang-wall-sample.jpg',
      caption: '丽江古城墙面上的东巴文，每一格是一幅小画，下面附汉译。',
      credit: 'BrokenSphere / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Dongba_script_sample_1.JPG',
    },
  ],
  maya: [
    {
      src: 'glyphs/maya/dresden-codex-p09.jpg',
      caption: '《德累斯顿抄本》第 9 页。玛雅文字是美洲唯一发展完整、能逐字记录语言的书写体系。',
      credit: 'Wikimedia Commons（佚名）',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Dresden_Codex_p09.jpg',
    },
    {
      src: 'glyphs/maya/copan-hieroglyphic-stairway.jpg',
      caption: '科潘的象形文字阶梯，两千多个字块连缀成一段完整的王朝史。',
      credit: 'Arian Zwegers / Wikimedia Commons',
      license: 'CC BY 2.0',
      home: 'https://commons.wikimedia.org/wiki/File:Copan,_Hieroglyphic_Stairway_(15958739725).jpg',
    },
  ],
  'southwestern-iberian': [
    {
      src: 'glyphs/southwestern-iberian/southwest-signary.png',
      caption: '西南伊比利亚文符号表（Valerio 2008）。这套文字通常从右向左书写，也出现牛耕式与螺旋式行文；符号释读仍有不少分歧。',
      credit: 'Valerio / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Southwest_Iberian_script_(Valerio_2008).png',
    },
    {
      src: 'glyphs/southwestern-iberian/fonte-velha.jpg',
      caption: '葡萄牙阿尔莫多瓦的丰特韦利亚（Fonte Velha）墓碑摹本。此类石碑是西南伊比利亚文最常见的实物载体。',
      credit: 'Papix / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:I_tarteso.jpg',
    },
  ],
  'southeastern-iberian': [
    {
      src: 'glyphs/southeastern-iberian/correa-2004-signary.jpg',
      caption: '东南伊比利亚文符号表（Correa 2004）。红色标记的可能音值仍属争议部分；这套文字只在前 4 至前 2 世纪的铭文中使用。',
      credit: 'Tautintanes / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Un_signari_ib%C3%A8ric_sud-oriental_(Correa_2004).jpg',
    },
  ],
  'northeastern-iberian': [
    {
      src: 'glyphs/northeastern-iberian/iberian-signary.png',
      caption: '东北伊比利亚文的基础符号表，约 28 个符号。塞音按后续元音分写，其余辅音与元音单写，构成半岛特有的半音节制度。',
      credit: 'Siteve77 / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Paleohispanic_(Iberian)_script.png',
    },
    {
      src: 'glyphs/northeastern-iberian/paleohispanic-origin.png',
      caption: '伊比利亚半音节文字与腓尼基字母的来源对照。颜色标出可能借用的字形，具体形成过程仍是研究问题。',
      credit: 'Eavoldisely / Wikimedia Commons',
      license: 'CC0 1.0',
      home: 'https://commons.wikimedia.org/wiki/File:Paleohispanic_script_origin.png',
    },
  ],
  celtiberian: [
    {
      src: 'glyphs/celtiberian/western-signary.jpg',
      caption: '凯尔特伊比利亚文西部变体的符号表。它直接改编自东北伊比利亚文，并省略了后者的一个颤音符号和一个鼻音符号。',
      credit: 'Tautintanes / Wikimedia Commons',
      license: 'CC BY 2.5',
      home: 'https://commons.wikimedia.org/wiki/File:Un_signari_celtib%C3%A8ric_occidental.jpg',
    },
    {
      src: 'glyphs/celtiberian/luzaga-bronze.jpg',
      caption: '卢萨加铜板（Bronce de Luzaga）拓片，凯尔特伊比利亚文的重要长铭之一。',
      credit: 'Papix / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Bronce_luzaga.jpg',
    },
  ],
  'greco-iberian': [
    {
      src: 'glyphs/greco-iberian/alphabet.jpg',
      caption: '希腊—伊比利亚字母表。蓝红两色分别标出希腊字母原型与伊比利亚语的音值；它不是半音节文字，而是直接改编的爱奥尼亚式全音素字母。',
      credit: 'Tautintanes / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Un_alfabet_greco-ib%C3%A8ric.jpg',
    },
  ],
  gupta: [
    {
      src: 'glyphs/gupta/mandsaur-532.jpg',
      caption: '曼达索尔石刻铭文（532 年），笈多书体用于书写梵语。笈多文承自婆罗米文，又分化出悉昙文、夏拉达文等支系。',
      credit: 'J. F. Fleet / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Sanskrit_Samskrita_in_the_Mandsaur_stone_inscription_of_Yashodharman-Vishnuvardhana_532_CE.jpg',
    },
    {
      src: 'glyphs/gupta/kushan-signet.jpg',
      caption: '贵霜印章上的婆罗米书体铭文，展示 3 世纪前后向笈多书体过渡的字形形态。',
      credit: 'CNG Coins / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Kushan_signet_in_Gupta_Brahmi_script_3rd_century_CE.jpg',
    },
  ],
  bactrian: [
    {
      src: 'glyphs/bactrian/alphabet.jpg',
      caption: '巴克特里亚字母的碑铭体与草写体对照。它以希腊字母为基础，并用新增的 Ϸ/ϸ sho 表示 /ʃ/。',
      credit: 'Drdpw、Dcoetzee、Flanker、पाटलिपुत्र / Wikimedia Commons',
      license: 'CC BY-SA 3.0',
      home: 'https://commons.wikimedia.org/wiki/File:Bactrian_alphabet_(block_and_cursive_letters).jpg',
    },
    {
      src: 'glyphs/bactrian/document-4c.jpg',
      caption: '阿富汗北部出土的 4 世纪巴克特里亚语文书。日常草写字形与钱币、石刻上的碑铭体差异明显。',
      credit: 'Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Bactrian_document_Northern_Afghanistan_4th_century.jpg',
    },
  ],
  pyu: [
    {
      src: 'glyphs/pyu/alphabet.jpg',
      caption: '博物馆展出的骠文字母表。骠文以婆罗米系字母书写骠语，约在 2 至 6 世纪逐渐形成。',
      credit: 'Ninjastrikers / Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      home: 'https://commons.wikimedia.org/wiki/File:Pyu_Alphabets.jpg',
    },
    {
      src: 'glyphs/pyu/myazedi.jpg',
      caption: '妙齐提碑上的骠文部分。碑铭以骠文、孟文、巴利文与缅甸文并刻，是研究骠文与缅甸文字传统的重要材料。',
      credit: 'Hybernator / Wikimedia Commons',
      license: '公有领域',
      home: 'https://commons.wikimedia.org/wiki/File:Myazedi-Inscription-Pyu.JPG',
    },
  ],
};
