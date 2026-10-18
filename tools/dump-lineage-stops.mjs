// 把血统轨道上的站点连同其字体信息导成 JSON，供 tools/build-glyph-paths.py 使用。
//
// 直接 import 数据模块，所以用 Node 的类型剥离功能运行：
//   node --experimental-strip-types tools/dump-lineage-stops.mjs
import { lineages } from '../src/data/lineages.ts';
import { writingSystems } from '../src/data/writingSystems.ts';

const byId = new Map(writingSystems.map((w) => [w.id, w]));
const stops = [];
for (const lineage of lineages) {
  for (const stop of lineage.stops) {
    const system = byId.get(stop.script);
    stops.push({
      lineage: lineage.id,
      script: stop.script,
      nameZh: system?.nameZh ?? null,
      char: stop.char ?? null,
      handPath: Boolean(stop.path),
      fontFamily: system?.fontFamily ?? null,
    });
  }
}
console.log(JSON.stringify(stops));
