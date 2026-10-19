import { lineages } from './lineages';
import { scriptById } from './writingSystems';
import { graphRelations } from './graphRelations';
import { graphConnectionBetween, type GraphConnection } from './graphIndex';
import type { GlyphStop, GraphRelation, Lineage, WritingSystem } from './types';

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


/** 体系级图谱边在一条字形轨道里的方向。 */
export type LineageGraphDirection = 'forward' | 'reverse';

/**
 * 相邻两个轨道站点之间的图连接状态。
 *
 * direct 表示两站之间有直接边；indirect 表示中间隔着未入轨节点，但图里
 * 仍有严格沿边方向的路径；unrelated 表示两个方向都没有有向路径。轨道顺序
 * 本身只是叙事顺序，不能替代图边。
 */
export type LineageAdjacencyStatus = 'direct' | 'indirect' | 'unrelated';

/**
 * 一条落在具体轨道站点上的体系级图边。
 *
 * 关系本身仍由 graphRelations 定义；这里只补上它在轨道里的端点位置，
 * 不复制关系语义，也不把 cognate / pair 的叙事顺序误当成直系血缘。
 */
export interface LineageGraphLink {
  relation: GraphRelation;
  parentStop: LineageStopRef;
  childStop: LineageStopRef;
  parentIndex: number;
  childIndex: number;
  /** forward：父系站在前、子系站在后；reverse：轨道顺序与图边方向相反 */
  direction: LineageGraphDirection;
}

/** 一个轨道邻接对及其图边状态。 */
export interface LineageAdjacentGraphLink {
  from: LineageStopRef;
  to: LineageStopRef;
  status: LineageAdjacencyStatus;
  /** 直接边或间接路径；unrelated 时没有。路径方向相对于 from → to。 */
  connection: GraphConnection;
  /** 只有当这条直接边也落在当前轨道里时才有 */
  link?: LineageGraphLink;
}

/** 某站点前后两侧的图边邻接状态。 */
export interface LineageGraphAdjacency {
  previous?: LineageAdjacentGraphLink;
  next?: LineageAdjacentGraphLink;
}

const lineageGraphLinksCache = new Map<string, readonly LineageGraphLink[]>();

function closestGraphLink(
  parentStops: readonly LineageStopRef[],
  childStops: readonly LineageStopRef[],
): { parentStop: LineageStopRef; childStop: LineageStopRef } | undefined {
  let best:
    | { parentStop: LineageStopRef; childStop: LineageStopRef }
    | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const parentStop of parentStops) {
    for (const childStop of childStops) {
      const distance = Math.abs(parentStop.index - childStop.index);
      if (
        distance < bestDistance ||
        (distance === bestDistance &&
          parentStop.index < (best?.parentStop.index ?? Number.POSITIVE_INFINITY))
      ) {
        best = { parentStop, childStop };
        bestDistance = distance;
      }
    }
  }

  return best;
}

/**
 * 取一条轨道上所有能落到站点对的体系级图边。
 *
 * 同一书写体系可能在轨道里出现多次。此时体系级边只绑定距离最近的一对
 * 端点，避免把一条“父系 → 子系”关系重复铺到该体系的所有书体阶段。
 * 图边本身仍来自 graphRelations；这里没有另一套关系表。
 */
export function graphLinksForLineage(lineage: Lineage): readonly LineageGraphLink[] {
  const cached = lineageGraphLinksCache.get(lineage.id);
  if (cached) return cached;

  const refsByScript = new Map<string, LineageStopRef[]>();
  for (const stop of lineage.stops) {
    const ref = stopRefFor(lineage.id, stop);
    if (!ref) continue;
    const refs = refsByScript.get(stop.script) ?? [];
    refs.push(ref);
    refsByScript.set(stop.script, refs);
  }

  const links: LineageGraphLink[] = [];
  for (const relation of graphRelations) {
    const parentStops = refsByScript.get(relation.parent);
    const childStops = refsByScript.get(relation.child);
    if (!parentStops?.length || !childStops?.length) continue;
    const pair = closestGraphLink(parentStops, childStops);
    if (!pair) continue;
    links.push({
      relation,
      parentStop: pair.parentStop,
      childStop: pair.childStop,
      parentIndex: pair.parentStop.index,
      childIndex: pair.childStop.index,
      direction:
        pair.parentStop.index < pair.childStop.index ? 'forward' : 'reverse',
    });
  }

  lineageGraphLinksCache.set(lineage.id, links);
  return links;
}

/**
 * 取一个站点前后两个邻接对的图连接状态。
 *
 * 直接边会给出它在轨道里的具体端点；间接路径保留中间节点和每一步的
 * relation，供未来节点详情继续向前后行走。没有有向路径才是 unrelated。
 * cognate / pair 轨道出现 unrelated 是合法状态，调用方仍应结合
 * lineage.mode 解读。
 */
export function adjacentGraphLinks(ref: LineageStopRef): LineageGraphAdjacency {
  const links = graphLinksForLineage(ref.lineage);
  const { previous, next } = adjacentStops(ref);

  const describe = (
    from: LineageStopRef,
    to: LineageStopRef,
  ): LineageAdjacentGraphLink => {
    const forward = links.find(
      (link) => link.parentIndex === from.index && link.childIndex === to.index,
    );
    const reverse = forward
      ? undefined
      : links.find(
          (link) => link.parentIndex === to.index && link.childIndex === from.index,
        );
    const link = forward ?? reverse;
    const connection = graphConnectionBetween(from.stop.script, to.stop.script);
    const status: LineageAdjacencyStatus =
      connection.status === 'direct'
        ? 'direct'
        : connection.status === 'indirect'
          ? 'indirect'
          : 'unrelated';
    return {
      from,
      to,
      status,
      connection,
      link,
    };
  };

  return {
    previous: previous ? describe(previous, ref) : undefined,
    next: next ? describe(ref, next) : undefined,
  };
}

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
