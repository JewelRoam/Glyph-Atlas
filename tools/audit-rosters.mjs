#!/usr/bin/env node
/**
 * 字母表体检：确认每个体系的字表都完整进了字母场。
 *
 * 用法：node --import ./tools/register-ts.mjs tools/audit-rosters.mjs
 * （已挂在 npm run validate 后面，跟着 npm run check 一起跑）
 *
 * 字母场要铺出这一家字母表的全部字母，所以除了两类字，别的字都不该缺席：
 *  · 同字母的另一种写法（大小写 á/Á、附加符号）—— 占同一格；
 *  · 纯组合 / 叠字 / 标调一类记号（NON_LETTER_MARKS）—— 单独成格像缺字。
 * 剩下的字如果没进字表，要么是撞上了 AUTO_LIMIT（截断，报错），要么是声明的
 * 字族里根本没有这个字形（缺字，提示里说明，页面留空而不拿别的字体顶替）。
 */
import { writingSystems } from '../src/data/writingSystems.ts';
import { rosterAudit, rosterFor, hasRoster } from '../src/data/letterSlots.ts';

const ALPHABETIC = new Set(['alphabet', 'abjad', 'abugida', 'syllabary', 'featural']);

const truncated = [];
const uncovered = [];
const empty = [];
const rows = [];

for (const system of writingSystems) {
  if (!ALPHABETIC.has(system.type)) continue;
  const audit = rosterAudit(system.id);
  if (!audit.inventory) continue;
  rows.push([system.id, audit]);

  if (audit.truncated) truncated.push(`${system.id} 被截掉 ${audit.truncated} 格（样本 ${audit.inventory}）`);
  if (audit.uncovered) uncovered.push(`${system.id} ${audit.uncovered} 个（${system.fontFamily ?? '兜底字族'}）`);
  if (!audit.displayed && !hasRoster(system.id)) empty.push(system.id);
}

// 自动化脚本关心的是"有没有被规则吃掉"，所以正常情况只印一行汇总
console.log(
  `✔ 字母表体检：${rows.length} 个字母/音节体系，` +
    `${rows.filter(([, a]) => !a.truncated && !a.uncovered).length} 个完整，` +
    `最大字表 ${Math.max(0, ...rows.map(([, a]) => a.displayed))} 格`,
);

if (process.env.ROSTER_AUDIT_VERBOSE) {
  for (const [id, a] of rows) {
    const detail = Object.keys(rosterFor(id)).length;
    console.log(
      `${id}\t样本 ${a.inventory}\t自动补位 ${a.displayed}\t字表 ${detail}\t` +
        `算同格 ${a.folded}\t非字母记号 ${a.marks}\t字库未收 ${a.uncovered}\t截断 ${a.truncated}`,
    );
  }
}

if (empty.length) {
  console.log(`   · 有字母清单却铺不出字表的体系：${empty.join('、')}`);
}
if (uncovered.length) {
  console.log(`   · 字族里没有字形、字母场只能留空的：${uncovered.join('，')}`);
}
if (truncated.length) {
  console.error(`\n✖ 字母表被截断：${truncated.join('，')}`);
  console.error('  字母场必须铺出整张表。请提高 AUTO_LIMIT，或在 letterSlots.ts 里说明原因。');
  process.exit(1);
}
