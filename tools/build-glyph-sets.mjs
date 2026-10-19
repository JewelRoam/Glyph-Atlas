#!/usr/bin/env node
/**
 * 生成 src/data/glyph-sets.ts —— 每种书写体系的"字形样本集"。
 *
 * 数据来源（全部离线可复现）：
 *   · tools/unicode-block-ranges.json  —— Unicode 区块范围（已入库）
 *   · work/unicode/UnicodeData.txt     —— 逐码位的一般类别（缺省时自动下载）
 *
 * 策略：
 *   1. 字母表 / 元音附标文字 / 音节文字 / 辅音音素文字：取该区块内的全部
 *      字母类码位（Lu/Ll/Lt/Lm/Lo），剔除标点、数字、组合符号与控制符。
 *   2. 语素文字（汉字、西夏文、埃及圣书体这类没有字母表的）：只取一组代表字，
 *      在 MANUAL 里手工给出，避免把上万字符灌进详情面板。
 *   3. 缺字体、缺 Unicode 收录的历史文字：留空，由前端给出"去找字体"的入口。
 *
 * 用法：node tools/build-glyph-sets.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const UCD_VERSION = '18.0.0';
const UCD_URL = `https://www.unicode.org/Public/${UCD_VERSION}/ucd/UnicodeData.txt`;
const UCD_PATH = join(root, 'work/unicode/UnicodeData.txt');

/**
 * 每个文字最多存多少个字符。
 *
 * 语素文字与语素音节文字只取代表样本；字母表、元音附标文字、音节文字必须全量，
 * 否则“有字母表就穷举”会在数据层被悄悄截断。
 */
const CAP = { logographic: 64, logosyllabic: 64, default: Infinity };

/**
 * 手工样本。用于两类情况：
 *  · 语素文字：Unicode 里挂着几万个字符，详情只该给代表字；
 *  · Unicode 未单列区块、或区块里没有"字母"的文字（盲文、非文字符号）。
 */
const MANUAL = {
  // 汉字圈：汉字没有字母表，取一组甲骨文与《说文》都收的象形基础字
  'chinese-oracle': {
    chars: '日月山水火木土石人女口目耳心田禾戈刀弓牛羊犬王天上下大小中生雨云川泉言食米竹虫鹿虎象父母子兄弟鼻舌首身肉皮南西北春秋年朝夕星雷雪',
    note: '甲骨文可释字约一千六百，字库收录其中一部分；字形表只列字库确有字形的字。',
  },
  'chinese-seal': {
    chars: '日月山水火木土石人女口目耳心田禾戈刀弓牛羊犬王天上下大小中生雨云川泉言食米竹虫鹿虎象父母子兄弟鼻舌首身肉皮南西北春秋年朝夕星雷雪',
    note: '《說文解字》共收九千三百余字；字形表只列其中一批象形基础字。',
  },
  'chinese-clerical': {
    chars: '',
    note: '暂无授权明确、字形可靠的隶书字库，字形表留空，不用现代字体顶替。',
  },
  'chinese-regular': {
    chars:
      '日月山水火木土石人女口目耳心田禾戈刀弓牛羊犬王天上下大小中生雨云川泉言食米竹虫鹿虎象父母子兄弟鼻舌首身肉皮南西北春秋年朝夕星雷雪' +
      // 万叶假名的借字：假名轨道要从这些楷书字长成平假名、片假名
      '安以宇衣於加幾久計己左之寸世曽太知止奈仁奴祢乃波比不部保末美武毛也由与良利留礼呂和為恵遠无',
    note: '汉字数量以万计，这里列一组最基础的楷书字，另加假名所借的万叶假名用字。',
  },
  'chunom': {
    chars: '日月山水天地人上下大小口田心',
    note: '字喃借用的汉字部分照常显示；自造字多在 Unicode 扩展区，Google Fonts 的 CJK 字库不覆盖，故不列出。',
  },
  'sawndip': {
    chars: '日月山水天地人上下大小口田心',
    note: '方块壮字借用的汉字部分照常显示；自造字多在 Unicode 扩展区，Google Fonts 的 CJK 字库不覆盖，故不列出。',
  },
  // 音节 / 特征文字：Unicode 里挂的是组合件，取能直接显示的编码字符
  'hangul': {
    chars: 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ가나다라마바사아자차카타파하',
    note: '谚文的基本字母（字母组合成音节块，这里另给几个整字示例）。',
  },
  'braille': {
    chars: '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵',
    note: '盲文在 Unicode 里属于符号而非字母，这里列出 a–z 的点位。',
  },
  // 埃及圣书体：本身是"辅音符号 + 意符"的混合，取常用单辅音符号
  'egyptian': {
    chars: '𓀀𓁐𓂝𓃀𓄿𓅓𓆓𓇋𓈖𓉔𓊪𓋴𓌗𓍯𓎛𓏏',
    note: '圣书体没有字母表，取一组常用单辅音符号作样本。',
  },
  'hieratic': {
    chars: '',
    note: 'Unicode 未单独编码僧侣体，暂无可靠字形来源，此处留空而不借圣书体符号示意。',
  },
  'demotic': {
    chars: '',
    note: 'Unicode 未单独编码世俗体，暂无可靠字形来源，此处留空而不借圣书体符号示意。',
  },
  // 女真文：Unicode 收了 914 个字符，但没有任何开源字库覆盖这一段，
  // 用系统字体渲染只会出豆腐块。这里留空，详情页改用两块授权图版。
  'jurchen': {
    chars: '',
    note: '女真文没有可用的开源字库，字形表留空，详情页改列金石图版，不用别的字体顶替。',
  },
  // 手语书写系统：Unicode 把它们归为符号（So）而非字母，取一组手形符号
  'signwriting': {
    chars: '𝠀𝠁𝠂𝠃𝠄𝠅𝠆𝠇𝠈𝠉𝠊𝠋𝠌𝠍𝠎𝠏𝠐𝠑𝠒𝠓𝠔𝠕𝠖𝠗',
    note: '手形、动作与表情符号组合成字；这里取一组手形符号作样本。',
  },
  // 楔形文字：语素音节文字，符号上千，只取一组高频符号
  'sumerian': { chars: '𒀭𒀀𒁀𒁕𒂊𒃻𒄀𒄩𒅁𒆷𒈠𒉌𒊒𒋝𒌋𒍪', note: '楔形符号有上千个，这里只取一组高频符号。' },
  'akkadian': { chars: '𒀭𒀀𒁀𒁕𒂊𒃻𒄀𒄩𒅁𒆷𒈠𒉌𒊒𒋝𒌋𒍪', note: '沿用苏美尔的符号，这里只取一组高频符号。' },
  'elamite-cuneiform': { chars: '𒀭𒀀𒁀𒁕𒂊𒃻𒄀𒄩𒅁𒆷𒈠𒉌𒊒𒋝𒌋𒍪', note: '沿用苏美尔的符号，这里只取一组高频符号。' },
  'hittite-cuneiform': { chars: '𒀭𒀀𒁀𒁕𒂊𒃻𒄀𒄩𒅁𒆷𒈠𒉌𒊒𒋝𒌋𒍪', note: '沿用苏美尔的符号，这里只取一组高频符号。' },
};

/** Unicode 区块名与数据里的 unicodeBlock 字段对不上、或数据里干脆没写的补充 */
const BLOCK_OVERRIDE = {
  akkadian: 'Cuneiform',
  'elamite-cuneiform': 'Cuneiform',
  'hittite-cuneiform': 'Cuneiform',
  'paleo-hebrew': 'Phoenician',
  nko: 'NKo',
  'todo-bichig': 'Mongolian',
  manchu: 'Mongolian',
  etruscan: 'Old Italic',
  'meroitic': 'Meroitic Hieroglyphs',
  'old-italic': 'Old Italic',
  'latin': 'Basic Latin',
  'ipa': 'IPA Extensions',
};

/**
 * 同一区块里并排着好几套文字的：按码位名把这一家自己的字母挑出来。
 *
 * 蒙古区块 U+1800–U+18AF 就是这种情形：1820–1842 是几家共用的基础字母，
 * 1843–185C 是托忒字母，185D–1872 是锡伯字母，1873–1877 是满文字母，
 * 1878 是布里亚特字母，1880 起是梵藏转写用的阿礼嘎礼字母（其中也各有
 * 托忒、满文专用的几个）。三家都用 Noto Sans Mongolian，照整块取字母会
 * 把蒙古、托忒、满文画成三张一模一样的字表，所以按名字分红。
 *
 * 共用的基础字母三家都列：托忒与满文本来就沿用这批码位，只是字形不同，
 * 而字体层面的差异（locl）目前没有开源字库支持，字表照实列出码位。
 */
const BASE_MONGOLIAN = (cp) => cp >= 0x1820 && cp <= 0x1842;

const NAME_FILTER = {
  mongolian: (cp, name) =>
    BASE_MONGOLIAN(cp) ||
    /^MONGOLIAN LETTER (CHA WITH TWO DOTS|ALI GALI)/.test(name),
  'todo-bichig': (cp, name) => BASE_MONGOLIAN(cp) || /^MONGOLIAN LETTER TODO/.test(name),
  manchu: (cp, name) => BASE_MONGOLIAN(cp) || /^MONGOLIAN LETTER MANCHU/.test(name),
};

/** 多鉴本共用的区块：只保留该书写体系本体的鉴本 */
const SCRIPT_OVERRIDE = {
  greek: 'Greek', // Greek and Coptic 区块里混着 14 个科普特字母
};

/**
 * 字母散落在多个 Unicode 区块里的书写体系。
 *
 * 科普特字母并不全在 Coptic 区块：来自世俗体的七个字母（Ϣ Ϥ Ϧ Ϩ Ϫ Ϭ Ϯ）
 * 当年沿用希腊区块的空位，落在 U+03E2–U+03EF。只按 Coptic 区块取字母会漏掉
 * 它们，而它们恰恰是科普特字母表区别于希腊字母的那一部分。
 *
 * 西里尔同理：U+0400–U+04FF 只收了近现代字母，斯拉夫语特有的 Ꙗ（iotated a）、
 * Ѧ Ѫ 那几个尤斯的扩展形与一批中世纪字母在 Cyrillic Extended-B（U+A640–A69F）
 * 里，并进样本集才不至于把字母表截断。该区块 Noto Sans 全数覆盖，不会出豆腐块。
 */
const SCRIPT_EXTRA = {
  coptic: [[0x03e2, 0x03ef]],
  cyrillic: [[0xa640, 0xa69f]],
};

function loadSystems() {
  const src = read('src/data/writingSystems.ts')
    .replace(/^import[^;]*;$/gm, '')
    .replace(/export const/g, 'const')
    .replace(/export type[\s\S]*?;\n/g, '')
    .replace(/:\s*WritingSystem\[\]/g, '')
    .replace(/:\s*Record<string, WritingSystem>/g, '');
  return new Function(`${src}; return writingSystems;`)();
}

async function loadUnicodeData() {
  if (!existsSync(UCD_PATH)) {
    console.log(`UnicodeData.txt 不在 work/unicode/，从 unicode.org 下载 ${UCD_VERSION}…`);
    mkdirSync(dirname(UCD_PATH), { recursive: true });
    const res = await fetch(UCD_URL);
    if (!res.ok) throw new Error(`下载失败：${res.status}`);
    writeFileSync(UCD_PATH, await res.text());
  }
  const text = readFileSync(UCD_PATH, 'utf8');
  const LETTER = new Set(['Lu', 'Ll', 'Lt', 'Lm', 'Lo']);
  /**
   * 剔除名单。两类：
   *  · 类别挂在字母下、其实不是字母的码位（阿拉伯的连接符 U+0640）；
   *  · Unicode 18 新增、目前没有任何 Web 字体收录的字母（只要是空字形，
   *    详情面板就会破一格豆腐块，宁可先不列，等字库跟上再加回来）。
   */
  const EXCLUDE = new Set([
    0x0640, // ARABIC TATWEEL，连接符
    // Unicode 18 新增字母，Noto 全系尚未收录（2026-10 复核）
    0x0558, 0x058b, 0x058c, // 亚美尼亚修饰字母
    0x0c5c, 0x0cdc, // 泰卢固 / 卡纳达 ARCHAIC SHRII
    0x1b4c, // 巴厘文 ARCHAIC JNYA
    0x2c2f, 0x2c5f, // 格拉哥里 CAUDATE CHRIVI
  ]);
  const ranges = [];
  /** 码位 → Unicode 名。字母与符号靠名字分辨（见 classifyNonLetters） */
  const names = new Map();
  let pending = null;
  let pendingName = null;
  let pendingStart = 0;
  for (const line of text.split('\n')) {
    if (!line) continue;
    const f = line.split(';');
    const cp = parseInt(f[0], 16);
    const name = f[1];
    const cat = f[2];
    if (name.endsWith(', First>')) {
      pendingName = name.replace(/, First>$/, '');
      pendingStart = cp;
      pending = LETTER.has(cat) && !EXCLUDE.has(cp) ? [cp, cp] : null;
      continue;
    }
    if (name.endsWith(', Last>')) {
      if (pending) {
        pending[1] = cp;
        ranges.push(pending);
        pending = null;
      }
      if (pendingName !== null) {
        for (let c = pendingStart; c <= cp; c++) names.set(c, pendingName);
        pendingName = null;
      }
      continue;
    }
    if (LETTER.has(cat) && !EXCLUDE.has(cp)) ranges.push([cp, cp]);
    names.set(cp, name);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  // 合并相邻 / 重叠区间，后续按区块取交集时更快
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return { ranges: merged, nameOf: (cp) => names.get(cp) };
}

/**
 * 单独列出"名称上是字母、其实不是这一家字母"的码位。
 *
 * Unicode 把不少符号与记号也归进字母类别（Lo/Ll/Lu），逐区块取字母会把它们
 * 一并收进样本集：希腊的 β 符号 ϐ、各家的 OM 符号、瓦伊文的表词符号、线性
 * 文字 B 的表意符号都在其中。字母场只该铺字母，所以生成样本集时把这一批标成
 * nonLetters，前端据此跳过（MICRO 的字母场与详情面板都照这份名单筛）。
 *
 * 三种归类：
 *   · symbol  —— 符号：名称含 SYMBOL，或者是 OM 一类的宗教符号；
 *   · mark    —— 记号：叠字记号、长音符、声调或鼻化一类的标记；
 *   · variant —— 同一个字母的另一种写法：ALTERNATE 异体、FINAL 词尾形、
 *                DOTLESS 无点形，且这一家里确实有对应的基本字母。
 *
 * variant 要同时满足三条才成立，宁可漏判也不误判——误判会把真字母从字母场里
 * 抹掉，那比多留一格词尾形严重得多：
 *   ① 名称含 FINAL / DOTLESS / ALTERNATE，且带 " LETTER " 这个词
 *      —— 排除 NEWA SIGN FINAL ANUSVARA、PAU CIN HAU RISING TONE FINAL
 *      一类"名字里有 FINAL、其实是独立字符"的编码；
 *   ② 去掉这三个词后的正名，刚好等于同一套字里另一个字符的名字
 *      —— 希伯来 ך FINAL KAF 对上 כ KAF、希腊 ς FINAL SIGMA 对上 σ SIGMA；
 *      IPA 的 ɟ DOTLESS J WITH STROKE 对不出同名字符，不会被并进 j；
 *   ③ 两个码位落在同一个 Unicode 区块里 —— 同名字符散布在不同区块时多半
 *      是两套体系，不算同一个字母的异体。
 */
const NON_LETTER_PATTERNS = [
  [/\bSYMBOL\b/, 'symbol'],
  [/\bOM\b/, 'symbol'],
  [/\b(ITERATION|PROLONGED)\b/, 'mark'],
  [/\bMARK\b/, 'mark'],
];
const VARIANT_WORD = /\b(FINAL|DOTLESS|ALTERNATE)\b/;

/** 去掉"词尾形 / 无点形 / 异体"字样后的正名 */
function baseName(name) {
  return name.replace(/\b(FINAL|DOTLESS|ALTERNATE)\b/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyNonLetters(chars, nameOf, blockOf) {
  // 正名 → 码位：只收名称本身不是异体的字符，免得链式折叠
  const baseByCp = new Map();
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    const name = nameOf(cp);
    if (name && !VARIANT_WORD.test(name)) baseByCp.set(name, cp);
  }
  const out = {};
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    const name = nameOf(cp);
    if (!name) continue;
    let kind;
    for (const [re, k] of NON_LETTER_PATTERNS) {
      if (re.test(name)) {
        kind = k;
        break;
      }
    }
    if (!kind && VARIANT_WORD.test(name) && name.includes(' LETTER ')) {
      const baseCp = baseByCp.get(baseName(name));
      if (baseCp !== undefined && blockOf(baseCp) === blockOf(cp)) kind = 'variant';
    }
    if (kind) out[cp.toString(16).toUpperCase()] = kind;
  }
  return out;
}

/** 读取 Scripts.txt，得到"码位 → Unicode 鉴本名"的查询表 */
function loadScripts() {
  const ranges = [];
  for (const line of read('work/unicode/Scripts.txt').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [range, rest] = line.split(';');
    const script = rest.trim().split(/\s+/)[0];
    const [a, b] = range.trim().split('..');
    ranges.push([parseInt(a, 16), b ? parseInt(b, 16) : parseInt(a, 16), script]);
  }
  ranges.sort((x, y) => x[0] - y[0]);
  return (cp) => {
    let lo = 0, hi = ranges.length - 1, ans = 'Unknown';
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (ranges[mid][0] <= cp) { ans = ranges[mid][2]; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  };
}

/** 展开某个区块内的字母，最多 ENUM_LIMIT 个（防止 CJK 这种一次铺开几万字） */
function lettersInRange(letterRanges, lo, hi, limit = 20000) {
  const out = [];
  for (const [a, b] of letterRanges) {
    if (b < lo) continue;
    if (a > hi) break;
    for (let cp = Math.max(a, lo); cp <= Math.min(b, hi); cp++) {
      if (out.length >= limit) return out;
      out.push(String.fromCodePoint(cp));
    }
  }
  return out;
}

/** 样本集的补充说明，跟着字表一起显示在详情面板里 */
const NOTES = {
  mongolian: '蒙古区块里几家共用基础字母，这里列蒙古文自己的字母与本块阿礼嘎礼字母；托忒、满文另有各自的字母，见那两家。',
  'todo-bichig': '托忒文沿用蒙古文的基础字母码位，另加托忒专有字母；目前没有开源字库区分托忒字形，字面由 Noto Sans Mongolian 画出。',
  manchu: '满文沿用蒙古文的基础字母码位，另加满文专有字母；目前没有开源字库区分满文字形，字面由 Noto Sans Mongolian 画出。',
};

const systems = loadSystems();
const { ranges: letterRanges, nameOf } = await loadUnicodeData();
const blocks = JSON.parse(read('tools/unicode-block-ranges.json')).blocks;
const blockByName = new Map(blocks.map((b) => [b.name, b]));
const blockRanges = blocks.map((b) => [parseInt(b.start, 16), parseInt(b.end, 16), b.name]);
/** 码位落在哪个 Unicode 区块（名字），用于判断两个字符是不是同一套字 */
const blockOf = (cp) => blockRanges.find(([lo, hi]) => cp >= lo && cp <= hi)?.[2] ?? '';

const entries = [];
const unmapped = [];
const missingFont = [];

for (const s of systems) {
  if (s.type === 'nonscript') continue;
  const manual = MANUAL[s.id];
  const cap = CAP[s.type] ?? CAP.default;
  let chars = [];
  let total = 0;
  let note;
  let source = 'unicode';
  /** 名称上不是字母的码位 → 归类，由 classifyNonLetters 填 */
  let nonLetters;

  if (manual) {
    chars = [...manual.chars];
    total = chars.length;
    source = 'manual';
    note = manual.note;
  } else {
    // unicodeBlock 形如 'Devanagari U+0900'，取区块名再查范围
    const blockName =
      BLOCK_OVERRIDE[s.id] ?? (s.unicodeBlock ? s.unicodeBlock.replace(/\s+U\+[0-9A-F]+$/, '') : null);
    const block = blockName ? blockByName.get(blockName) : null;
    if (!block) {
      unmapped.push(s.id);
    } else {
      const lo = parseInt(block.start, 16);
      const hi = parseInt(block.end, 16);
      let all = lettersInRange(letterRanges, lo, hi);
      const script = SCRIPT_OVERRIDE[s.id];
      if (script) {
        const scriptOf = loadScripts();
        all = all.filter((c) => scriptOf(c.codePointAt(0)) === script);
      }
      const nameFilter = NAME_FILTER[s.id];
      if (nameFilter) {
        all = all.filter((c) => nameFilter(c.codePointAt(0), nameOf(c.codePointAt(0)) ?? ''));
      }
      const extra = SCRIPT_EXTRA[s.id];
      if (extra) {
        const seen = new Set(all);
        for (const [a, b] of extra) {
          for (const c of lettersInRange(letterRanges, a, b)) {
            if (!seen.has(c)) {
              seen.add(c);
              all.push(c);
            }
          }
        }
        all.sort((x, y) => x.codePointAt(0) - y.codePointAt(0));
      }
      total = all.length;
      chars = all.slice(0, cap);
      if (chars.length < all.length) note = `Unicode 共收录 ${all.length} 个字符，这里截取前 ${chars.length} 个。`;
      if (NOTES[s.id]) note = note ? `${NOTES[s.id]} ${note}` : NOTES[s.id];
      nonLetters = classifyNonLetters(chars, nameOf, blockOf);
    }
  }

  if (!s.fontFamily && !manual) missingFont.push(s.id);
  entries.push({ id: s.id, chars, total: total || chars.length, note, source, nonLetters });
}

const lines = entries.map((e) => {
  const chars = e.chars.join('');
  const parts = [`chars: [...${JSON.stringify(chars)}]`, `total: ${e.total}`, `source: '${e.source}'`];
  if (e.nonLetters && Object.keys(e.nonLetters).length)
    parts.push(`nonLetters: ${JSON.stringify(e.nonLetters)}`);
  if (e.note) parts.push(`note: ${JSON.stringify(e.note)}`);
  return `  ${JSON.stringify(e.id)}: { ${parts.join(', ')} },`;
});

const out = `/**
 * 字形样本集 —— 由 tools/build-glyph-sets.mjs 依据 Unicode ${UCD_VERSION} 数据生成，请勿手工编辑。
 *
 * chars 是详情面板展示的字形清单：
 *  · 字母表 / 元音附标文字 / 音节文字：该文字在 Unicode 中的字母（不含标点、数字、组合符号）；
 *  · 语素文字（汉字、西夏文、埃及圣书体等）：没有字母表，只取一组代表字；
 *  · 未收录进 Unicode 的文字：留空，由详情面板给出"去找字体"的入口。
 * total 是 Unicode 中该文字的字母总数，与 chars.length 不等时表示做过截取。
 * source 标记这份清单是 Unicode 推导（unicode）还是手工给的（manual）。
 * nonLetters 记为"名称上是字母、其实不是字母"的码位（符号 / 记号 / 同一字母的
 * 异体），键是十六进制码位；字母场与详情面板照这份名单把这些格子跳过。
 */
export type GlyphSetSource = 'unicode' | 'manual';

/** 名称上是字母、其实不是字母的三类码位 */
export type NonLetterKind = 'symbol' | 'mark' | 'variant';

export interface GlyphSet {
  /** 展示用的字形清单 */
  chars: string[];
  /** Unicode 中该文字的字母总数 */
  total: number;
  /** 清单来源 */
  source: GlyphSetSource;
  /** 截取说明 */
  note?: string;
  /** 十六进制码位 → 归类，见 NonLetterKind */
  nonLetters?: Record<string, NonLetterKind>;
}

export const glyphSets: Record<string, GlyphSet> = {
${lines.join('\n')}
};

export function glyphSetFor(id: string): GlyphSet | undefined {
  return glyphSets[id];
}
`;

writeFileSync(join(root, 'src/data/glyphSets.ts'), out);

const withChars = entries.filter((e) => e.chars.length > 0);
const big = [...withChars].sort((a, b) => b.chars.length - a.chars.length).slice(0, 8);
console.log(`写入 src/data/glyphSets.ts`);
console.log(`  条目 ${entries.length} · 有字形 ${withChars.length} · 无字形 ${entries.length - withChars.length}`);
console.log(`  最大几组：${big.map((e) => `${e.id}(${e.chars.length}/${e.total})`).join(' ')}`);
if (unmapped.length) console.log(`  未匹配到 Unicode 区块（${unmapped.length}）：${unmapped.join(', ')}`);
if (missingFont.length) console.log(`  未声明字体（${missingFont.length}）：${missingFont.join(', ')}`);
