// 把"站点真的会画出来的字符"按字族导出成 JSON，供 tools/verify-font-coverage.py 核对。
//   node --import ./tools/register-ts.mjs tools/dump-need-chars.mjs
import { writeFileSync } from 'node:fs';
import { letterMaps, rosterFor } from '../src/data/letterSlots.ts';
import { svaraMaps } from '../src/data/svaraSlots.ts';
import { glyphSets } from '../src/data/glyphSets.ts';
import { writingSystems } from '../src/data/writingSystems.ts';
import { fontFallback } from '../src/data/fontFallback.ts';
import { lineages } from '../src/data/lineages.ts';

const byId = new Map(writingSystems.map((s) => [s.id, s]));
const familyOf = (id) => byId.get(id)?.fontFamily ?? fontFallback[id] ?? null;

/** family → 这个字族要画的全部字符 */
const need = new Map();
const add = (family, char, scriptId) => {
  if (!family || !char) return;
  if (!need.has(family)) need.set(family, new Map());
  const m = need.get(family);
  for (const c of Array.from(char)) {
    if (!m.has(c)) m.set(c, new Set());
    m.get(c).add(scriptId);
  }
};

for (const s of writingSystems) {
  const fam = familyOf(s.id);
  add(fam, s.sample, s.id);
  for (const c of glyphSets[s.id]?.chars ?? []) add(fam, c, s.id);
}
for (const [scriptId, map] of Object.entries(letterMaps)) {
  for (const char of Object.values(map)) add(familyOf(scriptId), char, scriptId);
}
for (const [scriptId, map] of Object.entries(svaraMaps)) {
  for (const char of Object.values(map)) add(familyOf(scriptId), char, scriptId);
}
for (const l of lineages) {
  for (const stop of l.stops) {
    if (stop.char) add(familyOf(stop.script), stop.char, stop.script);
  }
}

const out = {};
for (const [family, m] of need) out[family] = [...m.keys()].join('');

// 字母场的字表单独留一份：核对报告要按"哪个体系的哪个字没字形"回话
out.__meta = {
  rosterChars: Object.fromEntries(
    writingSystems
      .map((s) => [s.id, [...new Set(Object.values(rosterFor(s.id)))].join('')])
      .filter(([, chars]) => chars.length > 0),
  ),
  rosterFamily: Object.fromEntries(
    writingSystems
      .filter((s) => Object.keys(rosterFor(s.id)).length > 0)
      .map((s) => [s.id, familyOf(s.id)]),
  ),
};

writeFileSync('work/need-chars.json', JSON.stringify(out));
console.log(
  `· work/need-chars.json：${need.size} 个字族，` +
    `${[...need.values()].reduce((n, m) => n + m.size, 0)} 个字符`,
);
