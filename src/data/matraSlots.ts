/**
 * 婆罗米系「依附式元音」（元音附标 / matra）的槽位表。
 *
 * 婆罗米字母表的元音有两套写法：一套是独立成字的元音字母（अ आ इ，见
 * svaraSlots.ts），另一套是写在辅音上的元音符号（का कि की）。后者才是这类
 * 文字日常用到的元音——泰文的 ะ า ิ ี ุ ู เ แ โ ใ ไ、高棉的 ា ិ ី ុ ូ ើ េ ៃ ោ ៅ、
 * 爪哇的 ꦴ ꦶ ꦷ ꦸ ꦹ ꦺ ꦻ ꦼ 都属这一套。
 *
 * 这些符号离开辅音就只剩一道小钩或一个小点，单独立格看不出读音，也没法和别家
 * 的对应符号比较。所以：
 *  · 槽位存的是**符号本身**（一个码位），与 svara / varga 两套槽位同一个写法；
 *  · 取轮廓时把它挂在 MATRA_BASE 里这一家的代表基字上，交给 HarfBuzz 整形，
 *    取整段连写的轮廓（का 而不是 ा）。字体本来就会把前置元音排到基字前面
 *    （泰文 เ + ก → เก），整形之后拿到的就是这一家文字里它真正的样子。
 *  · 轮廓的键因此不能按"单字符"取，改用 `${文字}#${槽位}`，见 letterSlots.ts
 *    的 glyphKey()。
 *
 * 表里 '-' 表示这一家没有这个元音符号：要么它的 a 是内在元音（写辅音就够了），
 * 要么这个音位根本不在这家文字的音系里。走字母场时空格就是"消失"，回程再飞入。
 *
 * 各家自己的元音符号（高棉的 ួ ឿ ៀ、巴厘的 ᭃ、泰文的 ๅ、藏文的反写 i）不在这
 * 二十三个共享音位里，单独列在 MATRA_EXTRA_SLOTS：它们只在一家出现，走到那
 * 一站时整格飞入。
 */

export interface MatraSlot {
  id: string;
  label: string;
}

/**
 * 共享音位的次序：a ā i ī u ū r̥ r̥̄ l̥ l̥̄ ɯ ɯː ĕ e ai aiꦼ ŏ o au æ ǣ ɔ aṃ。
 *
 * 中间夹的 ɯ 与 ɯː 是东南亚那几家共有的音位（泰文的 ึ ื、老挝的 ຶ ື、高棉的
 * ឹ ឺ），梵语字音表里没有，但在这一片文字里位置固定，所以给它一格。
 */
export const MATRA_SLOTS: MatraSlot[] = [
  { id: 'matra-a', label: 'a ะ（短 a 的符号，写在辅音后）' },
  { id: 'matra-aa', label: 'ā ा（长 a）' },
  { id: 'matra-i', label: 'i ि（短 i）' },
  { id: 'matra-ii', label: 'ī ी（长 i）' },
  { id: 'matra-u', label: 'u ु（短 u）' },
  { id: 'matra-uu', label: 'ū ू（长 u）' },
  { id: 'matra-r', label: 'r̥ ृ（元音 r）' },
  { id: 'matra-rr', label: 'r̥̄ ॄ（长元音 r）' },
  { id: 'matra-l', label: 'l̥ ॢ（元音 l）' },
  { id: 'matra-ll', label: 'l̥̄ ॣ（长元音 l）' },
  { id: 'matra-ue', label: 'ɯ ึ（不圆唇的 u，泰老高棉共有）' },
  { id: 'matra-uee', label: 'ɯː ื（长 ɯ）' },
  { id: 'matra-e-short', label: 'ĕ ॆ（短 e；僧伽罗、爪哇、巴厘的 e 读中央元音）' },
  { id: 'matra-e', label: 'e े（长 e）' },
  { id: 'matra-ai', label: 'ai ै' },
  { id: 'matra-ai-muan', label: 'ai ใ（泰文 ใ 与老挝文 ໃ，与 ไ / ໄ 同音的另一种写法）' },
  { id: 'matra-o-short', label: 'ŏ ॊ（短 o）' },
  { id: 'matra-o', label: 'o ो（长 o）' },
  { id: 'matra-au', label: 'au ौ' },
  { id: 'matra-ae', label: 'æ ැ（僧伽罗的 æ、泰文的 แ、天城文的 ॅ）' },
  { id: 'matra-aae', label: 'ǣ ෑ（僧伽罗的长 æ）' },
  { id: 'matra-oe', label: 'ɔ ॉ（candra o：印地语的 ॉ、古吉拉特文的 ૉ）' },
  { id: 'matra-am', label: 'aṃ ं（随韵 anusvara，写在辅音后的鼻音）' },
];

/**
 * 只在一家文字里成立的元音符号。
 *
 * 它们对不上任何一个共享音位——高棉的 uə / ɨə / iə 三个双元音、巴厘语的长
 * 中央元音、泰文写在 ฤ 之后的长 a、藏文梵语转写里的反写 i——所以各占一格，
 * 走到这一站时飞入、离开时飞出。
 */
export const MATRA_EXTRA_SLOTS: { id: string; label: string; script: string; char: string }[] = [
  { id: 'matra-thai-lakkha', label: 'ๅ lakkhangyao（写在 ฤ / ฦ 后，把它读成长 a）', script: 'thai', char: 'ๅ' },
  { id: 'matra-khmer-ua', label: 'ួ ua（高棉语的 uə）', script: 'khmer', char: 'ួ' },
  { id: 'matra-khmer-ya', label: 'ឿ ya（高棉语的 ɨə）', script: 'khmer', char: 'ឿ' },
  { id: 'matra-khmer-ie', label: 'ៀ ie（高棉语的 iə）', script: 'khmer', char: 'ៀ' },
  { id: 'matra-bali-pepet-tedung', label: 'ᭃ pepet tedung（巴厘语的长中央元音）', script: 'balinese', char: 'ᭃ' },
  { id: 'matra-tib-reversed-i', label: 'ྀ 反写 i（藏文转写梵语时的短 i）', script: 'tibetan', char: 'ྀ' },
];

/**
 * 取轮廓时挂在哪一个基字上。
 *
 * 一律取这一家字音表的 ka：它是各家都有的音，字形也最规整。元音符号的轮廓
 * 要连基字一起取，所以这份表同时说明了"那一格画的是哪一个音节"。
 */
export const MATRA_BASE: Record<string, string> = {
  brahmi: '𑀓',
  siddham: '𑖎',
  grantha: '𑌕',
  devanagari: 'क',
  newa: '𑐎',
  bengali: 'ক',
  gujarati: 'ક',
  gurmukhi: 'ਕ',
  odia: 'କ',
  sharada: '𑆑',
  takri: '𑚊',
  dogra: '𑠊',
  khojki: '𑈊',
  khudawadi: '𑊺',
  tamil: 'க',
  telugu: 'క',
  kannada: 'ಕ',
  malayalam: 'ക',
  sinhala: 'ක',
  tibetan: 'ཀ',
  marchen: '𑱲',
  khmer: 'ក',
  burmese: 'က',
  thai: 'ก',
  lao: 'ກ',
  java: 'ꦏ',
  balinese: 'ᬓ',
};

/**
 * 一家一行的元音符号。顺序与 MATRA_SLOTS 一一对应，'-' 表示没有。
 *
 * 几点取舍：
 *  · a 那一列只有泰文与老挝文有专门的符号（ะ / ະ）——其余各家的 a 都是内在
 *    元音，光写辅音就是这个音；
 *  · 达罗毗荼四家（泰米尔、泰卢固、卡纳达、马拉雅拉姆）的短 e / 长 ē 与短 o /
 *    长 ō 分成两格，短的那两格接在 ĕ / ŏ 上；
 *  · 僧伽罗的 ෙ / ේ 是短 e 与长 ē，ැ / ෑ 是短 æ 与长 æ，ෘ / ෲ 是元音 r 的
 *    长短两式；
 *  · 玛哈贾尼与穆尔塔尼（信德记账体）不写元音符号，不出现在这张表里；
 *  · 泰文与老挝文的元音符号在 Unicode 里多半归在"字母"（Lo）而不是"记号"，
 *    它们由这张表接管之后不再单独占自动补位的格子。
 */
const MATRA_TABLE: Record<string, string> = {
  brahmi: '- 𑀸 𑀺 𑀻 𑀼 𑀽 𑀾 𑀿 𑁀 𑁁 - - 𑁳 𑁂 𑁃 - 𑁴 𑁄 𑁅 - - - 𑀁',
  siddham: '- 𑖯 𑖰 𑖱 𑖲 𑖳 𑖴 𑖵 - - - - - 𑖸 𑖹 - - 𑖺 𑖻 - - - 𑖽',
  grantha: '- 𑌾 𑌿 𑍀 𑍁 𑍂 𑍃 𑍄 𑍢 𑍣 - - - 𑍇 𑍈 - - 𑍋 𑍌 - - - 𑌂',
  devanagari: '- ा ि ी ु ू ृ ॄ ॢ ॣ - - ॆ े ै - ॊ ो ौ ॅ - ॉ ं',
  newa: '- 𑐵 𑐶 𑐷 𑐸 𑐹 𑐺 𑐻 𑐼 𑐽 - - - 𑐾 𑐿 - - 𑑀 𑑁 - - - 𑑄',
  bengali: '- া ি ী ু ূ ৃ ৄ ৢ ৣ - - - ে ৈ - - ো ৌ - - - ং',
  gujarati: '- ા િ ી ુ ૂ ૃ ૄ ૢ ૣ - - - ે ૈ - - ો ૌ ૅ - ૉ ં',
  gurmukhi: '- ਾ ਿ ੀ ੁ ੂ - - - - - - - ੇ ੈ - - ੋ ੌ - - - ਂ',
  odia: '- ା ି ୀ ୁ ୂ ୃ ୄ ୢ ୣ - - - େ ୈ - - ୋ ୌ - - - ଂ',
  sharada: '- 𑆳 𑆴 𑆵 𑆶 𑆷 𑆸 𑆹 𑆺 𑆻 - - - 𑆼 𑆽 - - 𑆾 𑆿 - - - 𑆁',
  takri: '- 𑚭 𑚮 𑚯 𑚰 𑚱 - - - - - - - 𑚲 𑚳 - - 𑚴 𑚵 - - - 𑚁',
  dogra: '- 𑠬 𑠭 𑠮 𑠯 𑠰 𑠱 𑠲 - - - - - 𑠳 𑠴 - - 𑠵 𑠶 - - - 𑠷',
  khojki: '- 𑈬 𑈭 𑈮 𑈯 - 𑉁 - - - - - - 𑈰 𑈱 - - 𑈲 𑈳 - - - 𑈴',
  khudawadi: '- 𑋠 𑋡 𑋢 𑋣 𑋤 - - - - - - - 𑋥 𑋦 - - 𑋧 𑋨 - - - 𑋟',
  tamil: '- ா ி ீ ு ூ - - - - - - ெ ே ை - ொ ோ ௌ - - - ஂ',
  telugu: '- ా ి ీ ు ూ ృ ౄ ౢ ౣ - - ె ే ై - ొ ో ౌ - - - ం',
  kannada: '- ಾ ಿ ೀ ು ೂ ೃ ೄ ೢ ೣ - - ೆ ೇ ೈ - ೊ ೋ ೌ - - - ಂ',
  malayalam: '- ാ ി ീ ു ൂ ൃ ൄ ൢ ൣ - - െ േ ൈ - ൊ ോ ൌ - - - ം',
  sinhala: '- ා ි ී ු ූ ෘ ෲ ෟ ෳ - - ෙ ේ ෛ - ො ෝ ෞ ැ ෑ - ං',
  tibetan: '- ཱ ི ཱི ུ ཱུ ྲྀ ཷ ླྀ ཹ - - - ེ ཻ - - ོ ཽ - - - ཾ',
  marchen: '- 𑲰 𑲱 - 𑲲 - - - - - - - - 𑲳 - - - 𑲴 - - - - 𑲵',
  khmer: '- ា ិ ី ុ ូ - - - - ឹ ឺ ើ េ ៃ - - ោ ៅ ែ - - ំ',
  burmese: '- ာ ိ ီ ု ူ ၖ ၗ ၘ ၙ - - - ေ ဲ - - - - - - - ံ',
  thai: 'ะ า ิ ี ุ ู - - - - ึ ื - เ ไ ใ - โ - แ - - ำ',
  lao: 'ະ າ ິ ີ ຸ ູ - - - - ຶ ື - ເ ໄ ໃ ົ ໂ - ແ - - ຳ',
  java: '- ꦴ ꦶ ꦷ ꦸ ꦹ - - - - - - ꦼ ꦺ ꦻ - - - - - - - -',
  balinese: '- ᬵ ᬶ ᬷ ᬸ ᬹ ᬺ ᬻ ᬼ ᬽ - - ᭂ ᬾ ᬿ - - ᭀ ᭁ - - - -',
};

/** 文字 → (元音符号槽位 → 字符)。行里留空的位置不会进表，字母场按"消失"处理。 */
export const matraMaps: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(MATRA_TABLE).map(([script, row]) => {
    const chars = row.trim().split(/\s+/);
    if (chars.length !== MATRA_SLOTS.length) {
      throw new Error(`MATRA_TABLE 的 ${script} 有 ${chars.length} 列，应为 ${MATRA_SLOTS.length} 列`);
    }
    const map: Record<string, string> = {};
    for (let i = 0; i < MATRA_SLOTS.length; i += 1) {
      const char = chars[i];
      if (char && char !== '-') map[MATRA_SLOTS[i].id] = char;
    }
    return [script, map];
  }),
);

// 各家的独有符号并进同一张表：它们各自只在一家出现，走到那一站时飞入。
for (const extra of MATRA_EXTRA_SLOTS) {
  const map = matraMaps[extra.script];
  if (!map) throw new Error(`MATRA_EXTRA_SLOTS 的 ${extra.id} 指向了没有元音符号表的 ${extra.script}`);
  map[extra.id] = extra.char;
}
