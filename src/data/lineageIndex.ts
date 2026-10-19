import { lineages } from './lineages';
import { scriptById } from './writingSystems';
import type { GlyphStop, Lineage, WritingSystem } from './types';

/**
 * 轨道站点的稳定键。
 *
 * 未来 MACRO 的任意书写体系节点要能直接进入它所在的轨道，并继续前后行走，
 * 因而不能只拿 writingSystem.id 定位：同一体系可以在不同轨道里出现，
 * 同一条轨道也可能因年代或书体不同而出现多次。每个站点都有必填且稳定的
 * id，校验器会拒绝缺失、重复或格式不合法的站点键。
 */
export function stopKey(lineageId: string, stop: GlyphStop): string {
  return `${lineageId}:${stop.id}`;
}

/** 一条轨道上的一个具体站点，以及它在轨道中的位置。 */
export interface LineageStopRef {
  lineage: Lineage;
  stop: GlyphStop;
  index: number;
  key: string;
}

export const lineageById: ReadonlyMap<string, Lineage> = new Map(
  lineages.map((lineage) => [lineage.id, lineage]),
);

const stopRefs = new Map<string, LineageStopRef>();
const lineageMap = new Map<string, Lineage[]>();
const stopMap = new Map<string, LineageStopRef[]>();

for (const lineage of lineages) {
  for (const [index, stop] of lineage.stops.entries()) {
    const ref: LineageStopRef = {
      lineage,
      stop,
      index,
      key: stopKey(lineage.id, stop),
    };
    stopRefs.set(ref.key, ref);

    // 同一轨道可能在多个书体阶段重复经过同一体系；轨道列表只记一次。
    const tracks = lineageMap.get(stop.script) ?? [];
    if (!tracks.includes(lineage)) tracks.push(lineage);
    lineageMap.set(stop.script, tracks);

    const stops = stopMap.get(stop.script) ?? [];
    stops.push(ref);
    stopMap.set(stop.script, stops);
  }
}

/** scriptId → 包含该体系的轨道（按 lineages 的展示顺序）。 */
export const lineagesByScript: ReadonlyMap<string, readonly Lineage[]> = lineageMap;

/** scriptId → 该体系在全部轨道里的站点，按轨道顺序与站内顺序排列。 */
export const stopsByScript: ReadonlyMap<string, readonly LineageStopRef[]> = stopMap;

/** 全部站点，按轨道与站内顺序排列。 */
export const allStopRefs: readonly LineageStopRef[] = [...stopRefs.values()];

/** 按 `${lineageId}:${stopId}` 取站点。 */
export function stopRefByKey(key: string): LineageStopRef | undefined {
  return stopRefs.get(key);
}

/** 一个书写体系在血统视图中的默认入口。 */
export interface LineageEntry {
  /** 默认轨道与站点；有站点时可继续向前后行走 */
  track?: LineageStopRef;
  /** 该体系可进入的轨道入口，默认入口排在最前；同一轨道只保留一个站点 */
  tracks: readonly LineageStopRef[];
  /** 是否有经过已核实的前后邻站 */
  hasNeighbors: boolean;
}

/**
 * 取书写体系的默认血统入口。
 *
 * 优先使用 WritingSystem.lineageEntry 明确指定的站点；未指定时退回该体系
 * 在 lineages 数组中的第一条站点。没有任何轨道的体系返回 undefined，调用方
 * 应显示单体系详情，而不是伪造两站链条。
 */
export function lineageEntryFor(scriptId: string): LineageEntry | undefined {
  const tracks = stopsByScript.get(scriptId);
  if (!tracks?.length) return undefined;

  const system = scriptById[scriptId];
  const preferred = system?.lineageEntry;
  let track: LineageStopRef | undefined;
  if (preferred) {
    const candidate = stopRefByKey(`${preferred.lineageId}:${preferred.stopId}`);
    if (candidate?.stop.script === scriptId) track = candidate;
  }
  track ??= tracks[0];

  return {
    track,
    tracks: [
      track,
      ...tracks.filter(
        (candidate) =>
          candidate.key !== track!.key && candidate.lineage.id !== track!.lineage.id,
      ),
    ],
    hasNeighbors: track.lineage.stops.length > 1,
  };
}

/**
 * 血统入口的站点深链键。URL 中使用脚本 id、轨道 id 和站点 id，避免把
 * 会随素材替换而改变的字符码位写进地址。
 */
export function lineageHref(scriptId: string, track?: LineageStopRef): string {
  const entry = track ?? lineageEntryFor(scriptId)?.track;
  const params = new URLSearchParams({ script: scriptId });
  if (entry) {
    params.set('lineage', entry.lineage.id);
    params.set('stop', entry.stop.id);
  }
  return `?${params.toString()}`;
}

/** 从查询参数恢复轨道站点；参数缺失或指向不存在的数据时返回 undefined。 */
export function stopRefFromParams(
  lineageId: string | null | undefined,
  stopId: string | null | undefined,
): LineageStopRef | undefined {
  if (!lineageId || !stopId) return undefined;
  return stopRefByKey(`${lineageId}:${stopId}`);
}

/**
 * 某书写体系可用的全部相邻站点。仅用于节点入口摘要；单站轨道返回空数组。
 */
export function neighboringStopRefs(scriptId: string): readonly LineageStopRef[] {
  const entry = lineageEntryFor(scriptId);
  if (!entry?.track) return [];
  const { previous, next } = adjacentStops(entry.track);
  return [previous, next].filter((ref): ref is LineageStopRef => Boolean(ref));
}

/** 每个书写体系都有入口；有轨道的返回站点入口，无轨道的返回单体系占位。 */
export type ScriptLineageStatus = 'neighbors' | 'standalone' | 'isolated';

export function lineageStatusFor(system: WritingSystem): ScriptLineageStatus {
  const entry = lineageEntryFor(system.id);
  if (!entry) return 'isolated';
  return entry.hasNeighbors ? 'neighbors' : 'standalone';
}

/** 在指定轨道中按站点对象取反向索引记录。 */
export function stopRefFor(lineageId: string, stop: GlyphStop): LineageStopRef | undefined {
  return stopRefs.get(stopKey(lineageId, stop));
}

/**
 * 站点在轨道上的前后邻居。
 *
 * chain 轨道中这是直系前后身；cognate / pair 轨道中则只是叙事上的前后站。
 * 调用方应同时读取 lineage.mode，避免把同源并列误读成直接演化。
 */
export function adjacentStops(ref: LineageStopRef): {
  previous?: LineageStopRef;
  next?: LineageStopRef;
} {
  const previousStop = ref.lineage.stops[ref.index - 1];
  const nextStop = ref.lineage.stops[ref.index + 1];
  return {
    previous: previousStop ? stopRefFor(ref.lineage.id, previousStop) : undefined,
    next: nextStop ? stopRefFor(ref.lineage.id, nextStop) : undefined,
  };
}
