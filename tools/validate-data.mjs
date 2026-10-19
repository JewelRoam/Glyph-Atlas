#!/usr/bin/env node
/**
 * 数据校验：在构建前抓住"看起来没问题、画出来却断线"的数据错误。
 *
 * 用法：npm run validate
 *
 * 校验项：
 *  1. id 唯一
 *  2. parents 指向存在的书写体系
 *  3. 父系年代不晚于子系（允许 200 年宽容度，年代本身是约数）
 *  4. origin 与 parents 自洽（有父系就不该同时声称独立起源）
 *  5. 年代区间有效，且落在全站时间域内
 *  6. 谱系轨道的每一站都指向存在的书写体系，且按时间递增
 *  7. 轨道站点至少两站，path 站点使用 0–100 的 viewBox
 *  8. 中国 / 汉字圈的样本、国家的字段不为空
 *  9. 声明了 Unicode 区块的条目，样例码位确实落在该区块内
 * 10. 字形来源覆盖：声明的字族确实收了这些字符，覆盖不到的就该留空
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// 用极简的 eval 方式装载 TS 数据（只含对象字面量，无运行时依赖）
function loadData() {
  const strip = (code) =>
    code
      .replace(/^import[^;]*;$/gm, '')
      .replace(/^export interface[\s\S]*?\n\}\n/gm, '')
      .replace(/export type[\s\S]*?;\n/g, '')
      .replace(/^export const/gm, 'const')
      .replace(/:\s*(WritingSystem|Lineage|GlyphSet|LetterSlot|MatraSlot)\[\]/g, '')
      .replace(/:\s*\{[^}]*\}\[\]/g, '')
      .replace(/:\s*Record<[^=]*?>(?=\s*=)/g, '');

  const wsSrc = strip(read('src/data/writingSystems.ts'));
  const lnSrc = strip(read('src/data/lineages.ts'));
  // glyphSets.ts 末尾还有一个查表函数，这里只要数据本身
  const gsSrc = strip(read('src/data/glyphSets.ts')).replace(/export function[\s\S]*$/, '');
  const fcSrc = strip(read('src/data/fontCoverage.ts'));
  // 元音槽位表要先于 letterSlots 求值：后者用扩展运算符把 SVARA_SLOTS、
  // MATRA_SLOTS 与 MATRA_EXTRA_SLOTS 铺进去。
  const svSrc = strip(read('src/data/svaraSlots.ts')).replace(/export function[\s\S]*$/, '');
  const mtSrc = strip(read('src/data/matraSlots.ts')).replace(/export function[\s\S]*$/, '');
  const lsSrc = strip(read('src/data/letterSlots.ts')).replace(/export function[\s\S]*$/, '');
  const ffSrc = strip(read('src/data/fontFallback.ts')).replace(/export function[\s\S]*$/, '');
  const factory = new Function(`
    ${wsSrc}
    ${lnSrc}
    ${gsSrc}
    ${fcSrc}
    ${svSrc}
    ${mtSrc}
    ${lsSrc}
    ${ffSrc}
    return { writingSystems, scriptById, lineages, glyphSets, fontCoverage, letterMaps, SLOTS, fontFallback };
  `);
  return factory();
}

const { writingSystems, scriptById, lineages, glyphSets, fontCoverage, letterMaps, SLOTS, fontFallback } =
  loadData();

/** 码位是否落在某个字族的覆盖区间里（区间是扁平的 [起, 止, …]） */
function familyCovers(family, char) {
  const flat = fontCoverage[family];
  if (!flat) return null; // 覆盖表里没有这个字族
  const cp = char.codePointAt(0);
  let lo = 0;
  let hi = flat.length / 2 - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cp < flat[mid * 2]) hi = mid - 1;
    else if (cp > flat[mid * 2 + 1]) lo = mid + 1;
    else return true;
  }
  return false;
}
const unicodeBlocks = JSON.parse(read('tools/unicode-block-ranges.json'));
const blockByName = new Map(unicodeBlocks.blocks.map((b) => [b.name, b]));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const TIME_DOMAIN = [-3300, 2030];
const seen = new Set();

for (const s of writingSystems) {
  if (seen.has(s.id)) err(`[id] 重复的 id: ${s.id}`);
  seen.add(s.id);
}

for (const s of writingSystems) {
  // parents
  for (const p of s.parents ?? []) {
    if (!scriptById[p]) err(`[parents] ${s.id} 指向不存在的父系 "${p}"`);
    else if (scriptById[p].dateFrom > s.dateFrom + 200)
      warn(
        `[chronology] ${s.id} (${s.dateFrom}) 早于其父系 ${p} (${scriptById[p].dateFrom})`,
      );
  }
  // origin 自洽
  if (s.origin === 'independent' && (s.parents ?? []).length > 0)
    err(`[origin] ${s.id} 声明独立起源，却列有父系: ${s.parents.join(', ')}`);
  if (s.origin === 'derived' && (s.parents ?? []).length === 0)
    err(`[origin] ${s.id} 声明为衍生，却没有父系`);
  // 年代
  if (s.dateTo !== null && s.dateTo < s.dateFrom)
    err(`[dates] ${s.id} 的终止年代早于起始年代`);
  if (s.dateFrom < TIME_DOMAIN[0] || (s.dateTo ?? 0) > TIME_DOMAIN[1])
    warn(`[dates] ${s.id} 超出全站时间域 ${TIME_DOMAIN.join(' – ')}`);
  // Unicode 区块与样例码位必须自洽
  if (s.unicodeBlock) {
    const parsed = /^(.+?) U\+([0-9A-F]{4,6})$/.exec(s.unicodeBlock);
    if (!parsed) {
      err(`[unicode] ${s.id} 的 unicodeBlock 格式无法解析: ${s.unicodeBlock}`);
    } else {
      const [, blockName, declaredStart] = parsed;
      const block = blockByName.get(blockName);
      if (!block) {
        err(`[unicode] ${s.id} 引用了未知 Unicode 区块: ${blockName}`);
      } else {
        const declared = parseInt(declaredStart, 16);
        const start = parseInt(block.start, 16);
        const end = parseInt(block.end, 16);
        if (declared < start || declared > end) {
          err(`[unicode] ${s.id} 的区块起点 U+${declaredStart} 不在 ${blockName} 内`);
        }
        if (s.sample) {
          const sample = Array.from(s.sample)[0]?.codePointAt(0);
          if (sample !== undefined && (sample < start || sample > end)) {
            err(
              `[unicode] ${s.id} 的样例 U+${sample.toString(16).toUpperCase()} 不在 ${blockName} 内（应为 U+${block.start}–U+${block.end}）`,
            );
          }
        }
      }
    }
  } else if (s.sample && !s.fontFamily) {
    warn(`[unicode] ${s.id} 有样例字符但没有声明 Unicode 区块或字体`);
  }

  // 展示所需字段
  if (!s.nameZh || !s.nameEn) err(`[fields] ${s.id} 缺少中/英文名`);
  if (!s.countries?.length) err(`[fields] ${s.id} 缺少使用国家 / 地区`);
  if (!s.region) err(`[fields] ${s.id} 缺少发源地`);
}

const lineageIds = new Set();
for (const l of lineages) {
  if (!l.id?.trim()) err('[lineage] 存在缺少 id 的轨道');
  if (lineageIds.has(l.id)) err(`[lineage] 重复的轨道 id: ${l.id}`);
  lineageIds.add(l.id);
  if (l.stops.length < 2) err(`[lineage] ${l.id} 少于两个站点，无法形成演变`);
  // 每一条轨道都要能指出出处：核对不了的链条不上线，页面也就没得显示
  if (!l.source?.trim()) err(`[lineage] ${l.id} 缺少出处 source`);
  if (l.alphabetField && !['full', 'hidden'].includes(l.alphabetField))
    err(`[lineage] ${l.id} 的 alphabetField 只能是 full 或 hidden`);
  if (l.alphabetSlotOverrides) {
    for (const [scriptId, slots] of Object.entries(l.alphabetSlotOverrides)) {
      if (!scriptById[scriptId]) {
        err(`[lineage] ${l.id} 的 alphabetSlotOverrides 指向不存在的书写体系 "${scriptId}"`);
        continue;
      }
      for (const [slotId, char] of Object.entries(slots)) {
        if (!slotIds.has(slotId))
          err(`[lineage] ${l.id} 的 alphabetSlotOverrides.${scriptId} 用了未定义的槽位「${slotId}」`);
        if (typeof char !== 'string' || Array.from(char).length !== 1)
          err(`[lineage] ${l.id} 的 alphabetSlotOverrides.${scriptId}.${slotId} 必须是单个字符`);
      }
    }
  }

  const stopIds = new Set();
  const scriptsInLineage = new Map();
  let prev = -Infinity;
  l.stops.forEach((stop, i) => {
    const script = scriptById[stop.script];
    const key = `${l.id}:${stop.id ?? stop.script}`;
    if (stopIds.has(key))
      err(`[lineage] ${l.id}[${i}] 站点键重复：${key}；同一轨道内请给站点显式 id`);
    stopIds.add(key);

    const count = (scriptsInLineage.get(stop.script) ?? 0) + 1;
    scriptsInLineage.set(stop.script, count);
    if (count > 1 && !stop.id)
      err(`[lineage] ${l.id}[${i}] 同一轨道重复出现 ${stop.script}，必须给每个站点显式 id`);

    if (!script) err(`[lineage] ${l.id}[${i}] 指向不存在的书写体系 "${stop.script}"`);
    else {
      // 只有"单线传承"才要求站点按年代递增；同源辐射与借字记音
      // 是按叙事顺序排列的，年代本来就会来回跳。
      if ((l.mode ?? 'chain') === 'chain' && script.dateFrom < prev)
        warn(
          `[lineage] ${l.id}[${i}] ${stop.script} (${script.dateFrom}) 早于上一站 (${prev})`,
        );
      prev = Math.max(prev, script.dateFrom);
    }
    // 站点可以是 path / 字符 / 图版三者之一；图版的出处由 audit-glyph-sources 查
    if (!stop.path && !stop.image && !(stop.char ?? script?.sample))
      err(`[lineage] ${l.id}[${i}] 既没有 path、图版，也没有可渲染字符`);
    if (stop.path && !/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,+-]+$/.test(stop.path))
      err(`[lineage] ${l.id}[${i}] path 含有可疑字符`);
    if (stop.sourceRef !== undefined && !stop.sourceRef.trim())
      err(`[lineage] ${l.id}[${i}] 的 sourceRef 不能为空字符串`);
    if (stop.asset && !['path', 'image', 'font'].includes(stop.asset.kind))
      err(`[lineage] ${l.id}[${i}] 的 asset.kind 只能是 path / image / font`);
  });
}

// ── 10. 字形来源覆盖 ────────────────────────────────────────────
// 声明了字族，但字库里根本没有这个字形时，页面上会留空；如果连样例字都
// 覆盖不到，说明这条记录挑错了字体。覆盖表由 tools/build-font-coverage.py 生成。
const uncoveredSets = [];
for (const s of writingSystems) {
  if (!s.fontFamily) continue;
  const known = Boolean(fontCoverage[s.fontFamily]);
  if (!known && glyphSets[s.id]?.chars.length) {
    warn(`[coverage] ${s.id} 的字族「${s.fontFamily}」不在覆盖表里，需重跑 tools/build-font-coverage.py`);
    continue;
  }
  if (s.sample) {
    const hit = familyCovers(s.fontFamily, s.sample);
    if (hit === false) err(`[coverage] ${s.id} 的样例字「${s.sample}」不在字族「${s.fontFamily}」里，页面会留空`);
  }
  const chars = glyphSets[s.id]?.chars ?? [];
  if (!chars.length) continue;
  const covered = chars.filter((c) => familyCovers(s.fontFamily, c) === true).length;
  if (covered === 0) err(`[coverage] ${s.id} 的字形表在字族「${s.fontFamily}」里一个都盖不到`);
  else if (covered < chars.length) uncoveredSets.push(`${s.id} ${covered}/${chars.length}`);
}
if (uncoveredSets.length)
  warn(`[coverage] ${uncoveredSets.length} 个体系有字形未被字库收录（页面留空）：${uncoveredSets.slice(0, 8).join('，')}${uncoveredSets.length > 8 ? ' …' : ''}`);

// ── 11. 字母槽位表 ────────────────────────────────────────────
// MICRO 的字母场按"同源槽位"把两套字母表对上号（见 src/data/letterSlots.ts）。
// 槽位错一个字，页面就会把两个不相干的字母画成一条演化链，所以这里逐条核对：
// 槽位有没有定义、字符是不是单字符、字库里有没有这个字形。
const slotIds = new Set(SLOTS.map((x) => x.id));
if (slotIds.size !== SLOTS.length) err('[slots] SLOTS 里有重复的槽位 id');
const unmappedLetters = [];
const unexpandedLetters = [];
/** 自动补位里混进"纯组合记号"是最容易出的错：单独一格只剩一个小点，像缺字 */
const autoMarkLetters = [];
/** 与 src/data/letterSlots.ts 的 ALPHABETIC_TYPES 保持一致 */
const ALPHABETIC_TYPES = new Set(['alphabet', 'abjad', 'abugida', 'syllabary', 'featural']);
for (const [scriptId, slots] of Object.entries(letterMaps)) {
  const system = scriptById[scriptId];
  if (!system) {
    err(`[slots] 字母槽位表里的「${scriptId}」不是已收录的书写体系`);
    continue;
  }
  const family = system.fontFamily ?? fontFallback[scriptId];
  if (!family) warn(`[slots] ${scriptId} 有字母槽位表，却没有可用字体`);
  const chars = glyphSets[scriptId]?.chars ?? [];
  for (const [slot, char] of Object.entries(slots)) {
    if (!slotIds.has(slot)) err(`[slots] ${scriptId} 用了未定义的槽位「${slot}」`);
    if (Array.from(char).length !== 1) err(`[slots] ${scriptId}.${slot} 不是单个字符`);
    // 依附式元音（matra-*）是 Mc/Mn 记号，天生不进只收字母类码位的 glyphSets，
    // 它们的字形由 src/data/matraSlots.ts 单独给出，这里只核字族覆盖。
    if (chars.length && !slot.startsWith('matra-') && !chars.includes(char))
      warn(`[slots] ${scriptId}.${slot} 的「${char}」不在该体系的字形样本集里`);
    if (family && familyCovers(family, char) === false)
      warn(`[slots] ${scriptId}.${slot} 的「${char}」在字族「${family}」里没有字形`);
  }
  // 大小写、附加符号的变体不算"还没进对照表"的字母
  const norm = (c) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const known = new Set([...Object.values(slots)].map(norm));
  const rest = chars.filter((c) => !known.has(norm(c))).length;
  // 只把"样本集里认得出来的字母"算作已进手工表：matra / svara 这类
  // 记号不占样本集的码位，算进去会让分子大过分母。
  const mappedCount = chars.filter((c) => known.has(norm(c))).length;
  if (!rest) continue;
  for (const c of chars) {
    if (known.has(norm(c))) continue;
    // 组合记号 / 装饰记号单独成格没有意义：要么它其实是这一家的字母（进手工表），
    // 要么它只是加在别的字母上的记号（进 letterSlots.ts 的 NON_LETTER_MARKS）
    if (/^[\p{Mn}\p{Mc}\p{Me}]$/u.test(c))
      autoMarkLetters.push(`${scriptId} ${c} U+${c.codePointAt(0).toString(16).toUpperCase()}`);
  }
  // 只有字母表性质的体系会走 rosterFor() 的自动补位；语素文字根本没有字母表，
  // 不进字母场，这里分开记，免得提示读起来像"汉字也该整表铺开"。
  // 这里只报"手工表覆盖了几个 / 样本集里一共有几个"。真正进字母场的格数由
  // rosterFor() 按字母身份折叠（大小写、附加符号）后决定，和这个分母不等，
  // 所以不在这里替它算一个会误导人的数字。
  const line = `${scriptId} 手工 ${mappedCount} / 样本 ${chars.length}`;
  if (ALPHABETIC_TYPES.has(system.type)) unmappedLetters.push(line);
  else unexpandedLetters.push(`${scriptId} ${mappedCount}/${chars.length}`);
}
if (unmappedLetters.length)
  warn(
    `[slots] ${unmappedLetters.length} 个体系的手工同源位还没覆盖全部字形样本（样本里含词尾形、` +
      `大小写与为其他语言增补的字母）。没进手工表的部分由 rosterFor() 自动补位进字母场，` +
      `按字母表的增删飞入 / 飞出，但不参与形变：` +
      unmappedLetters.join('，'),
  );
if (autoMarkLetters.length)
  warn(
    `[slots] ${autoMarkLetters.length} 个自动补位的字面是纯组合记号，单独成格只剩一个小点：` +
      autoMarkLetters.join('，'),
  );
if (unexpandedLetters.length)
  warn(
    `[slots] ${unexpandedLetters.length} 个语素文字/非字母体系的手工表只取这一家的字母：` +
      `语素文字取代表字形，表词符号 / 数字 / 度量衡不铺进字母场：` +
      unexpandedLetters.join('，'),
  );

// 统计信息，顺便作为 README 的数字来源
const independent = writingSystems.filter((s) => s.origin === 'independent');
const graph = writingSystems.filter((s) => s.type !== 'nonscript');
const graphIndependent = graph.filter((s) => s.origin === 'independent');
const living = graph.filter((s) => s.status === 'living' || s.status === 'revived');

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} 条提示（不阻塞构建）`);
  warnings.forEach((w) => console.log('   · ' + w));
}
if (errors.length) {
  console.error(`\n✖ 发现 ${errors.length} 个数据错误`);
  errors.forEach((e) => console.error('   · ' + e));
  process.exit(1);
}
console.log(
  `✔ 数据校验通过：${graph.length} 个书写体系进入图谱，` +
    `${graphIndependent.length} 个独立起源（另有 ${independent.length - graphIndependent.length} 条非文字记录），` +
    `${living.length} 个今仍使用，${lineages.length} 条血统轨道`,
);
