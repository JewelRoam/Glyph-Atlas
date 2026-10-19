#!/usr/bin/env node
/**
 * 血统入口覆盖率审计。
 *
 * 用法：
 *   npm run audit:coverage
 *   npm run audit:coverage -- --json
 *   npm run audit:coverage -- --strict
 *
 * 这个脚本不是构建门禁。它把“从 MACRO 任意节点进入前后演变”还缺什么
 * 列成可执行队列：哪些书写体系已有可前后行走的轨道，哪些只能以单体系
 * 打开，哪些站点还缺出处或素材登记。
 *
 * --strict 会把覆盖率不足当成失败，供未来覆盖率达标后的 CI 使用。
 */
import { lineages, writingSystems } from '../src/data/index.ts';
import { adjacentStops, lineageEntryFor } from '../src/data/lineageIndex.ts';

const json = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

const systems = writingSystems.filter((system) => system.type !== 'nonscript');
const stopRefs = lineages.flatMap((lineage) =>
  lineage.stops.map((stop, index) => ({ lineage, stop, index })),
);

const entries = systems.map((system) => {
  const entry = lineageEntryFor(system.id);
  const neighbors = entry?.track ? adjacentStops(entry.track) : {};
  return {
    id: system.id,
    nameZh: system.nameZh,
    nameEn: system.nameEn,
    origin: system.origin,
    family: system.family,
    type: system.type,
    status: system.status,
    tracks: entry?.tracks.length ?? 0,
    entry: entry?.track
      ? {
          lineageId: entry.track.lineage.id,
          stopId: entry.track.stop.id,
          key: entry.track.key,
          position: entry.track.index + 1,
          length: entry.track.lineage.stops.length,
        }
      : null,
    neighbors: {
      previous: neighbors.previous
        ? {
            lineageId: neighbors.previous.lineage.id,
            stopId: neighbors.previous.stop.id,
            script: neighbors.previous.stop.script,
            nameZh: neighbors.previous.stop.label ?? neighbors.previous.stop.script,
          }
        : null,
      next: neighbors.next
        ? {
            lineageId: neighbors.next.lineage.id,
            stopId: neighbors.next.stop.id,
            script: neighbors.next.stop.script,
            nameZh: neighbors.next.stop.label ?? neighbors.next.stop.script,
          }
        : null,
    },
  };
});

const linked = entries.filter((entry) => entry.entry);
const isolated = entries.filter((entry) => !entry.entry);
const withNeighbors = entries.filter(
  (entry) => entry.neighbors.previous || entry.neighbors.next,
);

const independent = entries.filter((entry) => entry.origin === 'independent');
const independentIsolated = independent.filter((entry) => !entry.entry);

const tracksWithoutSourceRefs = lineages.filter((lineage) => !lineage.sourceRefs?.length);
const incompleteStops = stopRefs.filter(
  ({ lineage, stop }) => !stop.sourceRef && !lineage.sourceRefs?.length,
);
const undocumentedAssets = stopRefs.filter(
  ({ stop }) => (stop.path || stop.image) && !stop.asset,
);

const result = {
  summary: {
    graphSystems: entries.length,
    lineageTracks: lineages.length,
    lineageStops: stopRefs.length,
    systemsWithEntry: linked.length,
    systemsWithNeighbors: withNeighbors.length,
    systemsIsolated: isolated.length,
    independentSystems: independent.length,
    independentSystemsWithEntry: independent.length - independentIsolated.length,
    independentSystemsIsolated: independentIsolated.length,
    tracksWithoutSourceRefs: tracksWithoutSourceRefs.length,
    stopsWithoutSource: incompleteStops.length,
    stopsWithoutAssetMetadata: undocumentedAssets.length,
  },
  independentIsolated: independentIsolated.map((entry) => ({
    id: entry.id,
    nameZh: entry.nameZh,
  })),
  isolated: isolated.map((entry) => ({
    id: entry.id,
    nameZh: entry.nameZh,
    origin: entry.origin,
    family: entry.family,
  })),
  tracksWithoutSourceRefs: tracksWithoutSourceRefs.map((lineage) => ({
    id: lineage.id,
    nameZh: lineage.nameZh,
    stopCount: lineage.stops.length,
  })),
  incompleteStops: incompleteStops.map(({ lineage, stop, index }) => ({
    lineageId: lineage.id,
    stopId: stop.id,
    index,
    script: stop.script,
  })),
  undocumentedAssets: undocumentedAssets.map(({ lineage, stop, index }) => ({
    lineageId: lineage.id,
    stopId: stop.id,
    index,
    script: stop.script,
    kind: stop.path ? 'path' : 'image',
  })),
  entries,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const pct = (n, d) => `${Math.round((n / d) * 100)}%`;
  console.log('血统入口覆盖');
  console.log(
    `  节点 ${entries.length} · 可进入轨道 ${linked.length} (${pct(linked.length, entries.length)}) · ` +
      `可前后行走 ${withNeighbors.length} (${pct(withNeighbors.length, entries.length)}) · ` +
      `单体系待补 ${isolated.length}`,
  );
  console.log(
    `  独立起源 ${independent.length} · 已有入口 ${independent.length - independentIsolated.length} · ` +
      `待补 ${independentIsolated.length}`,
  );
  console.log(
    `  站点 ${stopRefs.length} · 缺来源 ${incompleteStops.length} · 缺素材登记 ${undocumentedAssets.length}`,
  );
  console.log(
    `  轨道 ${lineages.length} · 已有轨道级来源 ${lineages.length - tracksWithoutSourceRefs.length} · ` +
      `待补 ${tracksWithoutSourceRefs.length}`,
  );

  if (independentIsolated.length) {
    console.log('\n独立起源待补：');
    for (const entry of independentIsolated) {
      console.log(`  · ${entry.id}  ${entry.nameZh}`);
    }
  }

  if (isolated.length) {
    console.log('\n单体系待补（不代表都应有血统链）：');
    const byFamily = new Map();
    for (const entry of isolated) {
      const list = byFamily.get(entry.family) ?? [];
      list.push(entry);
      byFamily.set(entry.family, list);
    }
    for (const [family, list] of byFamily) {
      console.log(`  ${family} (${list.length}): ${list.map((entry) => entry.id).join(', ')}`);
    }
  }

  if (tracksWithoutSourceRefs.length) {
    console.log('\n轨道缺来源链接：');
    for (const lineage of tracksWithoutSourceRefs) {
      console.log(`  · ${lineage.id}  ${lineage.nameZh} (${lineage.stops.length} 站)`);
    }
  }

  if (incompleteStops.length) {
    console.log('\n站点缺来源：');
    for (const item of result.incompleteStops) {
      console.log(`  · ${item.lineageId}:${item.stopId} (${item.script})`);
    }
  }

  if (undocumentedAssets.length) {
    console.log('\n站点缺素材登记：');
    for (const item of result.undocumentedAssets) {
      console.log(`  · ${item.lineageId}:${item.stopId} (${item.script}, ${item.kind})`);
    }
  }
}

if (strict && isolated.length) {
  console.error(`\n✘ ${isolated.length} 个图谱节点还没有血统入口`);
  process.exit(1);
}
