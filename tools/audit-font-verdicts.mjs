#!/usr/bin/env node
/**
 * 字体核实台账体检 —— 让"每个体系的字体都有人核过"这件事有据可查。
 *
 * 用法：node --import ./tools/register-ts.mjs tools/audit-font-verdicts.mjs
 * （已挂在 npm run validate 后面，跟着 npm run check 一起跑）
 *
 * 字形来源的结构面由 audit-glyph-sources.mjs 守着：来源可定性、图版有授权、
 * 字表里的字都落在声明的字族里。剩下那件事机器判不了——"这款字画的是不是
 * 这套文字"。工具只能确认字族里确实有这些码位，确认不了字面设计对不对。
 *
 * 所以人工核过的结论落在 tools/font-verdicts.tsv：一行一个体系。这个脚本守
 * 三件事：
 *   1. 一个体系一行，不多不少——新增的书写体系必须跟着补一行，不能悄悄漏掉；
 *   2. 结论只能是 ok / wrong / blank / todo，wrong（已知画错）直接让体检失败，
 *      不允许"知道错了还发布"；
 *   3. 第三列记的字族必须就是代码现在用的那一款——换了字体而没更新台账，
 *      这一行立刻变成过期数据，体检报错。
 *
 * 待办（todo）不阻塞构建，但每次都会印出来，免得台账慢慢变成没人看的纸。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { writingSystems, scriptById } from '../src/data/writingSystems.ts';
import { glyphSourceFor } from '../src/data/glyphSources.ts';
import { familyFor } from '../src/data/fontFallback.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const VERDICTS = ['ok', 'wrong', 'blank', 'todo'];

const rows = [];
for (const line of (await readFile(path.join(ROOT, 'tools/font-verdicts.tsv'), 'utf8')).split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [id, verdict, family, ...rest] = line.split('\t');
  rows.push({ id: id.trim(), verdict: (verdict ?? '').trim(), family: (family ?? '').trim(), note: rest.join('\t').trim() });
}

const problems = [];
const seen = new Set();
for (const row of rows) {
  const where = `[台账] ${row.id}`;
  if (!scriptById[row.id]) {
    problems.push(`${where}：没有这个书写体系（改过 id 就要同步这一行）`);
    continue;
  }
  if (seen.has(row.id)) problems.push(`${where}：重复的一行`);
  seen.add(row.id);
  if (!VERDICTS.includes(row.verdict)) {
    problems.push(`${where}：结论「${row.verdict}」不认识，只能是 ${VERDICTS.join(' / ')}`);
  }
  if ((row.verdict === 'wrong' || row.verdict === 'blank') && !row.note) {
    problems.push(`${where}：${row.verdict} 必须在第四列写明理由`);
  }

  // 第三列的字族必须等于代码现在真正用的那一款
  const system = scriptById[row.id];
  const source = glyphSourceFor(system);
  const inUse = source.kind === 'font' ? source.family ?? familyFor(row.id, system.fontFamily) ?? '' : '';
  if (row.family !== (inUse || '-')) {
    problems.push(
      `${where}：台账记的字族是「${row.family}」，代码现在用的是「${inUse || '(无字库，走图版)'}」` +
        '；换了字体要同步这一行，并重新过一遍字体审看台',
    );
  }
}

for (const system of writingSystems) {
  if (!seen.has(system.id)) {
    problems.push(`[台账] ${system.id} ${system.nameZh}：台账里没有这一行，新增体系要补一条核实记录`);
  }
}

const by = (v) => rows.filter((r) => r.verdict === v);
const ok = by('ok').length;
const blank = by('blank');
const todo = by('todo');
const wrong = by('wrong');

console.log(
  `✔ 字体核实台账：${rows.length} 个书写体系，${ok} 已核、${blank.length} 有意留空、` +
    `${wrong.length} 已知画错、${todo.length} 待核`,
);
if (blank.length) console.log(`   · 有意留空：${blank.map((r) => r.id).join('、')}`);
if (todo.length) console.log(`   · 待核：${todo.map((r) => r.id).join('、')}`);

if (wrong.length) {
  console.error(`\n✖ 有 ${wrong.length} 家的字体已知画错，不能就这样发布：`);
  for (const row of wrong) console.error(`   · ${row.id}：${row.note}`);
}
if (problems.length) {
  console.error(`\n✘ 字体核实台账有 ${problems.length} 处问题：`);
  for (const problem of problems) console.error(`   · ${problem}`);
}
if (problems.length || wrong.length) process.exit(1);
