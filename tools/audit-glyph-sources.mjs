/**
 * 字形来源体检 —— 把"字形只能来自能查证的地方"这条规矩钉在构建里。
 *
 * 用户看得见的规则是：甲骨文不能被画成宋体，僧侣体不能拿现代字体顶替，
 * 没有可靠来源就留空或放有授权的图版。这条规则在代码里靠三件事撑住：
 *   1. src/data/glyphSources.ts 的 OVERRIDES —— 历史书体点名换成图版或专门的字体；
 *   2. 每个渲染点都问"来源是哪一类"，字体来源必须有字族，图版来源必须有图；
 *   3. 字体来源的字符必须落在覆盖表里（lib/coverage.ts），没覆盖就空着。
 *
 * 这个脚本守的是前三件事的结构面：
 *   · 每个书写体系的来源可定性（字体有字族 / 图版有图有授权 / 留空有说明）；
 *   · 字母场的每一格、血统轨道的每一站，都能落到轮廓、图版或字体三者之一，
 *     不允许出现"没有字族"这种会掉进浏览器系统字体栈的情况；
 *   · 图版文件真实存在，并且登记在 public/glyphs/CREDITS.md 里；
 *   · 轮廓包（glyphPaths.ts）记录的取形字族，与前端当前渲染该体系用的字族一致
 *     —— 不一致说明 source 变了但轮廓没重跑，形变的两端会画成两种字面。
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { scriptById, writingSystems } from '../src/data/writingSystems.ts';
import { familyFor, fontFallback } from '../src/data/fontFallback.ts';
import { glyphSourceFor } from '../src/data/glyphSources.ts';
import { glyphPaths } from '../src/data/glyphPaths.ts';
import { glyphSets } from '../src/data/glyphSets.ts';
import { rosterFor, hasRoster } from '../src/data/letterSlots.ts';
import { lineages } from '../src/data/index.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const problems = [];
const notes = [];

/* 1. 每个书写体系的来源可定性 */
for (const system of writingSystems) {
  const source = glyphSourceFor(system);
  const where = `[来源] ${system.id} ${system.nameZh}`;
  if (source.kind === 'font') {
    if (!source.family) problems.push(`${where}：字体来源却没有字族（会掉进系统字体栈）`);
  } else if (source.kind === 'image') {
    const plates = source.plates ?? [];
    const images = Object.keys(source.images ?? {});
    if (!plates.length && !images.length) problems.push(`${where}：图版来源却没有任何图`);
  } else {
    notes.push(`${where}：暂时留空${system.sample ? `（样本 ${system.sample}）` : ''}`);
  }
}

/* 2. 图版文件真实存在，并登记在 CREDITS.md 里 */
const credits = await readFile(path.join(ROOT, 'public/glyphs/CREDITS.md'), 'utf8');
for (const system of writingSystems) {
  const source = glyphSourceFor(system);
  for (const plate of source.plates ?? []) {
    const where = `[图版] ${system.id} ${plate.src}`;
    if (!plate.caption || !plate.credit || !plate.license) {
      problems.push(`${where}：缺少说明 / 作者 / 授权`);
    }
    if (!existsSync(path.join(ROOT, 'public', plate.src))) {
      problems.push(`${where}：文件不存在`);
    }
    if (!credits.includes(plate.src)) {
      problems.push(`${where}：没有登记在 public/glyphs/CREDITS.md`);
    }
  }
}
for (const system of writingSystems) {
  for (const [char, src] of Object.entries(glyphSourceFor(system).images ?? {})) {
    const where = `[逐字图] ${system.id} ${char}`;
    if (!existsSync(path.join(ROOT, 'public', src))) problems.push(`${where}：文件不存在（${src}）`);
    if (!credits.includes(src)) problems.push(`${where}：没有登记在 CREDITS.md（${src}）`);
  }
}

/* 3. 字母场的每一格都要有据可依 */
let cells = 0;
let rosters = 0;
for (const system of writingSystems) {
  if (!hasRoster(system.id)) continue;
  rosters++;
  const source = glyphSourceFor(system);
  const family = source.kind === 'font' ? source.family ?? familyFor(system.id, system.fontFamily) : undefined;
  for (const [slot, char] of Object.entries(rosterFor(system.id))) {
    cells++;
    if (glyphPaths[`${system.id}:${char}`]) continue;
    // 字母场只认"字体来源 + 有字族"和"登记过的逐字图"，其余一律算漏
    if (family) continue;
    if (source.images?.[char]) continue;
    problems.push(`[字母场] ${system.id} ${slot} ${char}：没有字族也没有逐字图`);
  }
}

/* 4. 血统轨道的每一站都要能画出来 */
let stops = 0;
for (const lineage of lineages) {
  for (const stop of lineage.stops) {
    stops++;
    const system = scriptById[stop.script];
    const char = stop.char ?? system?.sample;
    if (stop.path) continue;
    if (!system) {
      problems.push(`[轨道] ${lineage.id} / ${stop.script}：书写体系不存在`);
      continue;
    }
    if (!char) continue; // 站点只是一段描述，画布上留空
    if (glyphPaths[`${stop.script}:${char}`]) continue;
    const source = glyphSourceFor(system);
    if (source.images?.[char]) continue;
    const family = source.kind === 'font' ? source.family ?? familyFor(stop.script, system.fontFamily) : undefined;
    if (family) {
      notes.push(`[轨道] ${lineage.id} / ${stop.script} ${char}：没有轮廓，靠字体交叉淡变`);
      continue;
    }
    problems.push(`[轨道] ${lineage.id} / ${stop.script} ${char}：轮廓、图版、字体都没有`);
  }
}

/* 5. 轮廓包记录的取形字族，必须等于前端现在渲染用的字族 */
const packFile = await readFile(path.join(ROOT, 'src/data/glyphPaths.ts'), 'utf8');
const packHead = packFile.slice(0, packFile.indexOf('export const glyphPaths'));
const recorded = new Map();
for (const line of packHead.split('\n')) {
  const m = line.match(/^\s*\*\s+(\S+?):(\S+)\s+→\s+(.+?)\s*$/);
  if (m) recorded.set(`${m[1]}:${m[2]}`, m[3]);
}
if (!recorded.size) problems.push('[轮廓包] 读不出字形来源清单，glyphPaths.ts 的头部格式变了');
for (const [key, family] of recorded) {
  const [scriptId] = key.split(':');
  const system = scriptById[scriptId];
  if (!system) {
    problems.push(`[轮廓包] ${key}：没有这个书写体系`);
    continue;
  }
  const source = glyphSourceFor(system);
  const front = source.kind === 'font' ? source.family ?? familyFor(scriptId, system.fontFamily) : undefined;
  if (front !== family) {
    problems.push(`[轮廓包] ${key}：轮廓取自 ${family}，前端渲染 ${front ?? '(系统字体栈)'}；改完来源要重跑 tools/build-glyph-paths.py`);
  }
}

/* 6. 兜底字族表：Python 侧从 fontFallback.ts 解析，这里确认它解析得动 */
if (!Object.keys(fontFallback).length) problems.push('[兜底表] fontFallback.ts 里没有条目');
if (!fontFallback.greek) problems.push('[兜底表] fontFallback.ts 读不到 greek，Python 侧的解析会跟着失败');

/* 7. 字母表清单里的字都得是这套文字的字（样本集非空） */
for (const system of writingSystems) {
  if (!hasRoster(system.id)) continue;
  const set = glyphSets[system.id];
  if (!set?.chars.length) problems.push(`[清单] ${system.id}：有字表却读不到字形清单`);
}

console.log(
  `✔ 字形来源体检：${writingSystems.length} 个书写体系、${rosters} 张字表 ${cells} 格、` +
    `${stops} 个轨道站点、${recorded.size} 条轮廓`,
);
if (process.env.GLYPH_AUDIT_VERBOSE && notes.length) {
  for (const note of notes) console.log(`   · ${note}`);
}
if (problems.length) {
  console.error(`\n✘ 发现 ${problems.length} 处字形来源问题：`);
  for (const problem of problems) console.error(`   · ${problem}`);
  process.exit(1);
}
