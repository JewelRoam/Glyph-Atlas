// 把字母槽位表连同字体信息导成 JSON，供 tools/build-glyph-paths.py 取字形轮廓。
//   node --experimental-strip-types tools/dump-letter-slots.mjs
import { letterMaps } from '../src/data/letterSlots.ts';
import { writingSystems } from '../src/data/writingSystems.ts';
import { fontFallback } from '../src/data/fontFallback.ts';

const byId = new Map(writingSystems.map((w) => [w.id, w]));
const out = [];
for (const [script, slots] of Object.entries(letterMaps)) {
  const system = byId.get(script);
  const family = system?.fontFamily ?? fontFallback[script] ?? null;
  for (const [slot, char] of Object.entries(slots)) {
    out.push({ script, slot, char, nameZh: system?.nameZh ?? null, family });
  }
}
console.log(JSON.stringify(out));
