#!/usr/bin/env node
/**
 * 字母表体检：确认每个体系的字表都完整进了字母场。
 *
 * 用法：node --import ./tools/register-ts.mjs tools/audit-rosters.mjs
 * （已挂在 npm run validate 后面，跟着 npm run check 一起跑）
 *
 * 字母场要铺出这一家字母表的全部字母，所以除了三类字，别的字都不该缺席：
 *  · 同字母的另一种写法（大小写 á/Á、附加符号）—— 占同一格；
 *  · 名称上不是字母的码位（符号 / 记号 / 词尾形，glyphSets.nonLetters）——
 *    符号与记号不占格，词尾形折进基字那一格；
 *  · 手工核过的纯组合 / 叠字 / 标调记号（NON_LETTER_MARKS）。
 * 剩下的字如果没进字表，要么是撞上了 AUTO_LIMIT（截断，报错），要么是声明的
 * 字族里根本没有这个字形（缺字，提示里说明，页面留空而不拿别的字体顶替）。
 */
import { writingSystems } from '../src/data/writingSystems.ts';
import { letterGlyphKey, letterMaps, rosterAudit, rosterFor, hasRoster } from '../src/data/letterSlots.ts';
import { alphabetPaths } from '../src/data/glyphAlphabets.ts';
import { alphabetPathsVarga } from '../src/data/glyphAlphabetsVarga.ts';

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
        `算同格 ${a.folded}\t符号 ${a.symbols}\t非字母记号 ${a.marks}\t` +
        `同字母异体 ${a.variants}\t字库未收 ${a.uncovered}\t截断 ${a.truncated}`,
    );
  }
}

if (empty.length) {
  console.log(`   · 有字母清单却铺不出字表的体系：${empty.join('、')}`);
}
if (uncovered.length) {
  console.log(`   · 字族里没有字形、字母场只能留空的：${uncovered.join('，')}`);
}
/**
 * 同源槽位的矢量轮廓。
 *
 * 字母场里"原地变形"的部分靠 src/data/glyphAlphabets*.ts 里生成好的轮廓：两张
 * 表的每个手工槽位字符都得有自己的一条 path（`${scriptId}:${char}`），缺一个，
 * 那一格就悄悄退回"两张图交叉淡变"——不报错，只是不再形变，正好是最难被发现的
 * 一种退化。所以这里把"手工槽位的字符必须有轮廓"当作硬约束。
 *
 * 同字不同槽（腓尼基的 waw 与 digamma 用同一个码位）按字符去重后只算一个。
 */
const OUTLINE_EXEMPT = new Set([
  // 例：'某体系:某字符' —— 字族里确实没有这个字形、只可能留空的，写在这里并说明原因
]);

const outlines = { ...alphabetPaths, ...alphabetPathsVarga };
const noOutline = [];
let outlineSlots = 0;
for (const [script, slots] of Object.entries(letterMaps)) {
  const seen = new Set();
  for (const [slot, char] of Object.entries(slots)) {
    const key = letterGlyphKey(script, slot, char);
    if (seen.has(key)) continue;
    seen.add(key);
    outlineSlots += 1;
    if (!outlines[key] && !OUTLINE_EXEMPT.has(key)) {
      noOutline.push(
        `${script}:${slot} ${char} U+${char.codePointAt(0).toString(16).toUpperCase()}`,
      );
    }
  }
}

console.log(
  `✔ 字母轮廓覆盖：${Object.keys(letterMaps).length} 个手工花名册体系、` +
    `${outlineSlots} 个槽位字符，${noOutline.length ? `${noOutline.length} 个缺轮廓` : '全部有矢量轮廓'}`,
);

if (noOutline.length) {
  console.error(`\n✖ 字母场会退回交叉淡变：${noOutline.join('，')}`);
  console.error('  重新生成轮廓：work/.venv/bin/python tools/build-glyph-paths.py；');
  console.error('  字族里确实没有这个字形的，在 tools/audit-rosters.mjs 的 OUTLINE_EXEMPT 里写明原因。');
  process.exit(1);
}

if (truncated.length) {
  console.error(`\n✖ 字母表被截断：${truncated.join('，')}`);
  console.error('  字母场必须铺出整张表。请提高 AUTO_LIMIT，或在 letterSlots.ts 里说明原因。');
  process.exit(1);
}
