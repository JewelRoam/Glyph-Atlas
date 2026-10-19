import { lineages } from './lineages';
import type { GlyphStop, Lineage } from './types';

/**
 * 轨道站点的稳定键。
 *
 * 未来 MACRO 的任意书写体系节点要能直接进入它所在的轨道，并继续前后行走，
 * 因而不能只拿 writingSystem.id 定位：同一体系可以在不同轨道里出现，
 * 同一条轨道也可能因年代或书体不同而出现多次。站点 id 缺省时以 script
 * 作为键；出现重复 script 时，validate-data 会要求数据显式补 id。
 */
export function stopKey(lineageId: string, stop: GlyphStop): string {
  return `${lineageId}:${stop.id ?? stop.script}`;
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

/** 按 `${lineageId}:${stopId ?? scriptId}` 取站点。 */
export function stopRefByKey(key: string): LineageStopRef | undefined {
  return stopRefs.get(key);
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
