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
      .replace(/export const/g, 'const')
      .replace(/export type[\s\S]*?;\n/g, '')
      .replace(/:\s*WritingSystem\[\]/g, '')
      .replace(/:\s*Lineage\[\]/g, '')
      .replace(/:\s*Record<string, WritingSystem>/g, '');

  const wsSrc = strip(read('src/data/writingSystems.ts'));
  const lnSrc = strip(read('src/data/lineages.ts'));
  const factory = new Function(`
    ${wsSrc}
    ${lnSrc}
    return { writingSystems, scriptById, lineages };
  `);
  return factory();
}

const { writingSystems, scriptById, lineages } = loadData();
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

for (const l of lineages) {
  if (l.stops.length < 2) err(`[lineage] ${l.id} 少于两个站点，无法形成演变`);
  let prev = -Infinity;
  l.stops.forEach((stop, i) => {
    const script = scriptById[stop.script];
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
    if (!stop.path && !(stop.char ?? script?.sample))
      err(`[lineage] ${l.id}[${i}] 既没有 path 也没有可渲染字符`);
    if (stop.path && !/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,+-]+$/.test(stop.path))
      err(`[lineage] ${l.id}[${i}] path 含有可疑字符`);
  });
}

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
