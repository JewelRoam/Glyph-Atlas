import type { GraphRelation, WritingSystem } from './types';
import type { GlyphSet } from './glyphSets';
import type { GlyphSource } from './glyphSources';
import { writingSystems } from './writingSystems';
import { graphRelations } from './graphRelations';
import { glyphSets } from './glyphSets';
import { glyphSourceFor } from './glyphSources';
import { hasLetterMap, hasRoster, rosterFor } from './letterSlots';
import type { GraphStep } from './graphIndex';
import {
  adjacentGraphLinks,
  adjacentStops,
  graphLinksForLineage,
  lineageEntryFor,
  lineageHref,
  type LineageGraphAdjacency,
  type LineageGraphLink,
  type LineageStopRef,
} from './lineageIndex';

/**
 * 一个书写体系在“图谱 + 血统”两层里的完整上下文。
 *
 * 未来 MACRO 节点详情与 MICRO 合流时，界面只需要拿这一份对象：
 *  - graph：节点在有向图中的直接关系、完整祖先/后代，以及保留分支的多条路径；
 *  - lineage：默认字形轨道、轨道上的前后站，以及该体系出现的其他轨道。
 *
 * 两层关系不能互相冒充：graph 表示书写体系之间的传承或影响，
 * lineage 表示某个同源字位在具体字形层面的前后关系。
 */
/** 从某个根节点到当前节点的一条完整祖先路径（按时间顺序）。 */
export interface AncestryPath {
  nodes: readonly WritingSystem[];
  steps: readonly GraphStep[];
}

/** 从当前节点到某个后代的一条完整后代路径（按时间顺序）。 */
export interface DescendantPath {
  nodes: readonly WritingSystem[];
  steps: readonly GraphStep[];
}

export interface ScriptGraphContext {
  /** 直接父系，保持原有字段与顺序 */
  parents: readonly WritingSystem[];
  /** 直接子系，保持原有字段与顺序 */
  children: readonly WritingSystem[];
  /** 直接父系节点及其可进入的详情 / MICRO 门户，与 parentRelations 同序 */
  parentNeighbors: readonly ScriptGraphNeighborContext[];
  /** 直接子系节点及其可进入的详情 / MICRO 门户，与 childRelations 同序 */
  childNeighbors: readonly ScriptGraphNeighborContext[];
  /** 所有祖先的去重节点集合（不含当前节点） */
  ancestors: readonly WritingSystem[];
  /** 所有后代的去重节点集合（不含当前节点） */
  descendants: readonly WritingSystem[];
  /** 所有从根到当前节点的路径；分支不会被压平成一条线 */
  ancestryPaths: readonly AncestryPath[];
  /** 所有从当前节点到叶节点的路径；分支不会被压平成一条线 */
  descendantPaths: readonly DescendantPath[];
  /** 直接父系边，和 parents 同序 */
  parentRelations: readonly GraphRelation[];
  /** 直接子系边，和 children 同序 */
  childRelations: readonly GraphRelation[];
}

/**
 * 某一条轨道在该体系入口处的完整上下文。
 *
 * 不只是“其他轨道还能点哪里”：每条轨道都带自己的前后邻站、站点级图边和
 * 邻接路径。未来切换轨道时不需要再用别处的索引拼一次。
 */
export interface ScriptLineageTrackContext {
  /** 该体系在这条轨道里的入口站点 */
  entry: LineageStopRef;
  /** 直接打开这条轨道入口的稳定查询链接 */
  href: string;
  /** 这条轨道上的前后站 */
  previous?: LineageStopRef;
  next?: LineageStopRef;
  /** 这条轨道里所有能落到体系级图边的站点对 */
  graphLinks: readonly LineageGraphLink[];
  /** 入口前后两侧的直接 / 间接 / 无关状态 */
  adjacency: LineageGraphAdjacency;
}

export interface ScriptLineageContext extends ScriptLineageTrackContext {
  /** 该体系出现的其他轨道入口；保留下来供未来的轨道切换器使用 */
  alternatives: readonly LineageStopRef[];
  /** 默认轨道在前，其余轨道各有一份完整上下文；同一轨道只出现一次 */
  tracks: readonly ScriptLineageTrackContext[];
}

/**
 * 节点详情与字母场共用的素材读模型。
 *
 * 字体 / 图版来源、代表字形集和字母槽位仍分别由原模块维护；这里只做只读
 * 关联，不复制数据。未来 MACRO 节点详情和 MICRO 字母场从同一个上下文取素材，
 * 站点自己的 path / image / char / sourceRef / asset 则继续随 LineageStopRef 保存。
 */
export interface ScriptMaterialContext {
  /** 字体、逐字图片或整幅图版；没有可靠来源时 kind 为 none */
  source: GlyphSource;
  /** Unicode 推导或手工整理的代表字形集 */
  glyphSet?: GlyphSet;
  /** 可铺开的完整字母表；语素文字和没有可靠字库的体系可能没有 */
  letterSlots?: {
    /** 是否有手工核过的跨体系同源槽位 */
    hasManualMap: boolean;
    /** 槽位 → 该体系中的字符 */
    roster: Readonly<Record<string, string>>;
  };
}

/**
 * 单个节点的可进入门户，不含它自己的父系 / 子系。
 *
 * 这是节点详情的轻量读模型，也是图邻居上下文里的节点摘要。它不递归携带
 * 邻接图，避免一份节点上下文无限展开；调用方若从邻居继续走，只需再取该
 * 邻居自己的 scriptContextFor()。href 始终指向该节点默认详情 / MICRO 入口。
 */
export interface ScriptNodePortal {
  system: WritingSystem;
  /** 默认入口的稳定查询链接；没有轨道时仍可打开该节点的体系详情 */
  href: string;
  /** 字体、字形清单与字母槽位的统一入口 */
  materials: ScriptMaterialContext;
  /** 没有任何已核实轨道的体系没有这一段，不伪造链条 */
  lineage?: ScriptLineageContext;
}

/** 图谱上一条直接关系，以及关系另一端的可进入门户。 */
export interface ScriptGraphNeighborContext {
  /** 原始有向边；父系门户方向为 parent，子系门户方向为 child */
  relation: GraphRelation;
  direction: 'parent' | 'child';
  /** 另一端节点的详情 / MICRO 入口和素材上下文 */
  node: ScriptNodePortal;
}

export interface ScriptContext extends ScriptNodePortal {
  graph: ScriptGraphContext;
}

const systemById = new Map(writingSystems.map((system) => [system.id, system]));
const childrenByScript = new Map<string, WritingSystem[]>();
const parentRelationsByScript = new Map<string, GraphRelation[]>();
const childRelationsByScript = new Map<string, GraphRelation[]>();

for (const relation of graphRelations) {
  const parent = systemById.get(relation.parent);
  const child = systemById.get(relation.child);
  if (!parent || !child) continue;

  const children = childrenByScript.get(parent.id) ?? [];
  children.push(child);
  childrenByScript.set(parent.id, children);

  const parentRelations = parentRelationsByScript.get(child.id) ?? [];
  parentRelations.push(relation);
  parentRelationsByScript.set(child.id, parentRelations);

  const childRelations = childRelationsByScript.get(parent.id) ?? [];
  childRelations.push(relation);
  childRelationsByScript.set(parent.id, childRelations);
}

const relationKey = (parentId: string, childId: string) => `${parentId}>${childId}`;
const relationByKey = new Map(
  graphRelations.map((relation) => [relationKey(relation.parent, relation.child), relation]),
);

function stepFor(parentId: string, childId: string): GraphStep | undefined {
  const relation = relationByKey.get(relationKey(parentId, childId));
  const from = systemById.get(parentId);
  const to = systemById.get(childId);
  return relation && from && to ? { relation, from, to } : undefined;
}

/** scriptId → 在 parents 图中以它为父系的直接子节点。 */
export const graphChildrenByScript: ReadonlyMap<string, readonly WritingSystem[]> =
  childrenByScript;

function materialContextFor(system: WritingSystem): ScriptMaterialContext {
  const glyphSet = glyphSets[system.id];
  const materials: ScriptMaterialContext = {
    source: glyphSourceFor(system),
    glyphSet,
  };
  if (hasRoster(system.id)) {
    materials.letterSlots = {
      hasManualMap: hasLetterMap(system.id),
      roster: rosterFor(system.id),
    };
  }
  return materials;
}

function trackContextFor(track: LineageStopRef): ScriptLineageTrackContext {
  const { previous, next } = adjacentStops(track);
  return {
    entry: track,
    href: lineageHref(track.stop.script, track),
    previous,
    next,
    graphLinks: graphLinksForLineage(track.lineage),
    adjacency: adjacentGraphLinks(track),
  };
}

function lineageContextFor(scriptId: string): ScriptLineageContext | undefined {
  const lineageEntry = lineageEntryFor(scriptId);
  if (!lineageEntry?.track) return undefined;

  const tracks = lineageEntry.tracks.map(trackContextFor);
  const defaultTrack = tracks[0];
  if (!defaultTrack) return undefined;

  return {
    ...defaultTrack,
    alternatives: lineageEntry.tracks.slice(1),
    tracks,
  };
}

/**
 * 取一个节点的轻量门户，不展开它的父系 / 子系。
 *
 * 图邻居摘要和节点自身详情都走这里，确保“节点入口”只有一种生成方式。
 * 邻居继续前进时再取它自己的 scriptContextFor()，不会递归复制整张图。
 */
export function scriptPortalFor(scriptId: string): ScriptNodePortal | undefined {
  const system = systemById.get(scriptId);
  if (!system) return undefined;

  const materials = materialContextFor(system);
  const lineage = lineageContextFor(system.id);
  return {
    system,
    href: lineageHref(system.id),
    materials,
    lineage,
  };
}

/** 取一个书写体系的完整上下文。 */
export function scriptContextFor(scriptId: string): ScriptContext | undefined {
  const portal = scriptPortalFor(scriptId);
  if (!portal) return undefined;

  const { system } = portal;
  const parents = system.parents
    .map((parentId) => systemById.get(parentId))
    .filter((parent): parent is WritingSystem => Boolean(parent));
  const children = childrenByScript.get(scriptId) ?? [];
  const parentRelations = parentRelationsByScript.get(scriptId) ?? [];
  const childRelations = childRelationsByScript.get(scriptId) ?? [];
  const { ancestors, ancestryPaths } = ancestryFor(system.id);
  const { descendants, descendantPaths } = descendantsForWithPaths(system.id);

  const parentNeighbors = parentRelations.flatMap((relation) => {
    const node = scriptPortalFor(relation.parent);
    return node
      ? [{ relation, direction: 'parent' as const, node }]
      : [];
  });
  const childNeighbors = childRelations.flatMap((relation) => {
    const node = scriptPortalFor(relation.child);
    return node
      ? [{ relation, direction: 'child' as const, node }]
      : [];
  });

  return {
    ...portal,
    graph: {
      parents,
      children,
      parentNeighbors,
      childNeighbors,
      ancestors,
      descendants,
      ancestryPaths,
      descendantPaths,
      parentRelations,
      childRelations,
    },
  };
}

/** 某个节点的全部祖先，按年代升序去重；路径仍保留严格的有向边顺序。 */
export function ancestorsFor(scriptId: string): readonly WritingSystem[] {
  return ancestryFor(scriptId).ancestors;
}

/** 某个节点的全部后代，按年代升序去重；路径仍保留严格的有向边顺序。 */
export function descendantsFor(scriptId: string): readonly WritingSystem[] {
  return descendantsForWithPaths(scriptId).descendants;
}

function chronological(left: WritingSystem, right: WritingSystem): number {
  return left.dateFrom - right.dateFrom || left.id.localeCompare(right.id);
}

function ancestryFor(scriptId: string): {
  ancestors: readonly WritingSystem[];
  ancestryPaths: readonly AncestryPath[];
} {
  const system = systemById.get(scriptId);
  if (!system) return { ancestors: [], ancestryPaths: [] };

  const paths: AncestryPath[] = [];
  const seenAncestors = new Set<string>();
  const collectedAncestors: WritingSystem[] = [];

  const walk = (
    current: WritingSystem,
    reverseNodes: WritingSystem[],
    reverseSteps: GraphStep[],
    visited: ReadonlySet<string>,
  ) => {
    const parentIds = current.parents;
    if (parentIds.length === 0) {
      paths.push({
        nodes: [...reverseNodes].reverse(),
        steps: [...reverseSteps].reverse(),
      });
      return;
    }

    for (const parentId of parentIds) {
      const parent = systemById.get(parentId);
      const step = stepFor(parentId, current.id);
      if (!parent || !step || visited.has(parent.id)) continue;
      if (!seenAncestors.has(parent.id)) {
        seenAncestors.add(parent.id);
        collectedAncestors.push(parent);
      }
      walk(
        parent,
        [...reverseNodes, parent],
        [...reverseSteps, step],
        new Set([...visited, parent.id]),
      );
    }
  };

  walk(system, [system], [], new Set([system.id]));
  return { ancestors: [...collectedAncestors].sort(chronological), ancestryPaths: paths };
}

function descendantsForWithPaths(scriptId: string): {
  descendants: readonly WritingSystem[];
  descendantPaths: readonly DescendantPath[];
} {
  const system = systemById.get(scriptId);
  if (!system) return { descendants: [], descendantPaths: [] };

  const paths: DescendantPath[] = [];
  const seen = new Set<string>();
  const collected: WritingSystem[] = [];

  const walk = (
    current: WritingSystem,
    nodes: WritingSystem[],
    steps: GraphStep[],
    visited: ReadonlySet<string>,
  ) => {
    const children = childrenByScript.get(current.id) ?? [];
    if (children.length === 0) {
      paths.push({ nodes, steps });
      return;
    }

    for (const child of children) {
      const step = stepFor(current.id, child.id);
      if (!step || visited.has(child.id)) continue;
      if (!seen.has(child.id)) {
        seen.add(child.id);
        collected.push(child);
      }
      walk(
        child,
        [...nodes, child],
        [...steps, step],
        new Set([...visited, child.id]),
      );
    }
  };

  walk(system, [system], [], new Set([system.id]));
  return { descendants: [...collected].sort(chronological), descendantPaths: paths };
}
