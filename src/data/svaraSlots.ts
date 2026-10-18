/**
 * 婆罗米系独立元音（svara）的槽位表。
 *
 * 婆罗米字母表分两块：前面是独立写出来的元音字母（svara-*），后面是按发音
 * 部位排成五处的辅音（varga-*，见 letterSlots.ts）。南亚和东南亚的这几十种
 * 文字都从同一套婆罗米字位长出来，所以同一个元音位在每家都占同一格——
 * 天城的 अ 对应泰米尔的 அ、藏文的 ཨ、高棉的 ឣ，走字母场时它们原地变形。
 *
 * 各家丢掉的音位留空：泰米尔文没有 ऋ 一类的元音 r，藏文把元音都写成附加
 * 符号（只有 ཨ 一个独立元音字母），老挝文与泰文同样没有独立元音字母。
 * 走到这些站时，空着的格子就是"消失"，回程再从下方飞入。
 *
 * 表格写法：一家一行，按下面 SVARA_SLOTS 的顺序写字符，' - ' 表示这家
 * 文字没有这个元音位。行里的字数必须与槽位数相同。
 */

/** 元音槽位的次序：a ā i ī u ū r̥ r̥̄ l̥ l̥̄ ĕ e ai ŏ o au æ ǣ */
export const SVARA_SLOTS: { id: string; label: string }[] = [
  { id: 'svara-a', label: 'a अ（独立元音 a）' },
  { id: 'svara-aa', label: 'ā आ（长 a）' },
  { id: 'svara-i', label: 'i इ（短 i）' },
  { id: 'svara-ii', label: 'ī ई（长 i）' },
  { id: 'svara-u', label: 'u उ（短 u）' },
  { id: 'svara-uu', label: 'ū ऊ（长 u）' },
  { id: 'svara-r', label: 'r̥ ऋ（元音 r）' },
  { id: 'svara-rr', label: 'r̥̄ ॠ（长元音 r）' },
  { id: 'svara-l', label: 'l̥ ऌ（元音 l）' },
  { id: 'svara-ll', label: 'l̥̄ ॡ（长元音 l）' },
  { id: 'svara-e-short', label: 'ĕ ऎ（短 e，达罗毗荼语诸家）' },
  { id: 'svara-e', label: 'e ए（长 e）' },
  { id: 'svara-ai', label: 'ai ऐ' },
  { id: 'svara-o-short', label: 'ŏ ऒ（短 o）' },
  { id: 'svara-o', label: 'o ओ（长 o）' },
  { id: 'svara-au', label: 'au औ' },
  { id: 'svara-ae', label: 'æ ඇ（僧伽罗的 æ，天城文用 ऍ 记马拉地语）' },
  { id: 'svara-aae', label: 'ǣ ඈ（僧伽罗的长 æ）' },
];

/**
 * 一家一行的元音字面。顺序同 SVARA_SLOTS，'-' 表示没有独立元音字母。
 *
 * 几点取舍：
 *  · 天城文的 ऎ ऒ 是给达罗毗荼语转写用的短 e / 短 o，与南边的 ఎ / ஒ 同格；
 *  · 果鲁穆奇文的 ਏ 读长 e、ਓ 读长 o，所以接在 ĕ / ŏ 之后的 e / o 两格；
 *  · 藏文只有 ཨ 一个独立元音字母，其余元音都写成上下加的符号（元音附标）；
 *  · 爪哇、巴厘两家只留 ꦄ ꦆ ꦈ ꦌ ꦎ 一类常用的独立元音；
 *  · 高棉文取 ឣ（QAQ）作 a：字母 អ（QA）是写元音的载体，不算元音位。
 *  · 泰文、老挝文不给整表：两家的元音全都写在辅音上（อ / ອ 是载体本身），
 *    没有独立元音字母，等做"依附式元音"的槽位时再另立一套。
 */
const SVARA_TABLE: Record<string, string> = {
  brahmi: '𑀅 𑀆 𑀇 𑀈 𑀉 𑀊 𑀋 𑀌 𑀍 𑀎 - 𑀏 𑀐 - 𑀑 𑀒 - -',
  siddham: '𑖀 𑖁 𑖂 𑖃 𑖄 𑖅 𑖆 𑖇 𑖈 𑖉 - 𑖊 𑖋 - 𑖌 𑖍 - -',
  grantha: '𑌅 𑌆 𑌇 𑌈 𑌉 𑌊 𑌋 𑍠 𑌌 𑍡 - 𑌏 𑌐 - 𑌓 𑌔 - -',
  devanagari: 'अ आ इ ई उ ऊ ऋ ॠ ऌ ॡ ऎ ए ऐ ऒ ओ औ ऍ -',
  newa: '𑐀 𑐁 𑐂 𑐃 𑐄 𑐅 𑐆 𑐇 𑐈 𑐉 - 𑐊 𑐋 - 𑐌 𑐍 - -',
  bengali: 'অ আ ই ঈ উ ঊ ঋ ৠ ঌ ৡ - এ ঐ - ও ঔ - -',
  gujarati: 'અ આ ઇ ઈ ઉ ઊ ઋ ૠ ઌ ૡ - એ ઐ - ઓ ઔ - -',
  gurmukhi: 'ਅ ਆ ਇ ਈ ਉ ਊ - - - - - ਏ ਐ - ਓ ਔ - -',
  odia: 'ଅ ଆ ଇ ଈ ଉ ଊ ଋ ୠ ଌ ୡ - ଏ ଐ - ଓ ଔ - -',
  sharada: '𑆃 𑆄 𑆅 𑆆 𑆇 𑆈 𑆉 𑆊 𑆋 𑆌 - 𑆍 𑆎 - 𑆏 𑆐 - -',
  takri: '𑚀 𑚁 𑚂 𑚃 𑚄 𑚅 - - - - - 𑚆 𑚇 - 𑚈 𑚉 - -',
  khojki: '𑈀 𑈁 𑈂 - 𑈃 - - - - - - 𑈄 𑈅 - 𑈆 𑈇 - -',
  mahajani: '𑅐 - 𑅑 - 𑅒 - - - - - - 𑅓 - - 𑅔 - - -',
  multani: '𑊀 - 𑊁 - 𑊂 - - - - - - 𑊃 - - - - - -',
  khudawadi: '𑊰 𑊱 𑊲 𑊳 𑊴 𑊵 - - - - - 𑊶 𑊷 - 𑊸 𑊹 - -',
  dogra: '𑠀 𑠁 𑠂 𑠃 𑠄 𑠅 - - - - - 𑠆 𑠇 - 𑠈 𑠉 - -',
  tamil: 'அ ஆ இ ஈ உ ஊ - - - - எ ஏ ஐ ஒ ஓ ஔ - -',
  telugu: 'అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఌ ౡ ఎ ఏ ఐ ఒ ఓ ఔ - -',
  kannada: 'ಅ ಆ ಇ ಈ ಉ ಊ ಋ ೠ ಌ ೡ ಎ ಏ ಐ ಒ ಓ ಔ - -',
  malayalam: 'അ ആ ഇ ഈ ഉ ഊ ഋ ൠ ഌ ൡ എ ഏ ഐ ഒ ഓ ഔ - -',
  sinhala: 'අ ආ ඉ ඊ උ ඌ ඍ ඎ ඏ ඐ එ ඒ ඓ ඔ ඕ ඖ ඇ ඈ',
  tibetan: 'ཨ - - - - - - - - - - - - - - - - -',
  burmese: 'အ - ဣ ဤ ဥ ဦ ၒ ၓ ၔ ၕ - ဧ - - ဩ ဪ - -',
  java: 'ꦄ - ꦆ ꦇ ꦈ - - - - - - ꦌ ꦍ - ꦎ - - -',
  balinese: 'ᬅ ᬆ ᬇ ᬈ ᬉ ᬊ ᬋ ᬌ ᬍ ᬎ - ᬏ ᬐ - ᬑ - - -',
  khmer: 'ឣ ឤ ឥ ឦ ឧ ឩ ឫ ឬ ឭ ឮ - ឯ ឰ - ឱ ឳ - -',
};

/** 文字 → (元音槽位 → 字符)。行里留空的位置不会进表，字母场按"消失"处理。 */
export const svaraMaps: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(SVARA_TABLE).map(([script, row]) => {
    const chars = row.trim().split(/\s+/);
    const map: Record<string, string> = {};
    for (let i = 0; i < SVARA_SLOTS.length; i += 1) {
      const char = chars[i];
      if (char && char !== '-') map[SVARA_SLOTS[i].id] = char;
    }
    return [script, map];
  }),
);
