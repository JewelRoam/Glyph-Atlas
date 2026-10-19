import type { GraphRelation, WritingSystem } from './types';
import { writingSystems } from './writingSystems';
import { graphRelations } from './graphRelations';
import {
  adjacentGraphLinks,
  adjacentStops,
  graphLinksForLineage,
  lineageEntryFor,
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
export interface GraphStep {
  relation: GraphRelation;
  from: WritingSystem;
  to: WritingSystem;
}

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

export interface ScriptLineageContext {
  /** 默认入口站点，可直接交给 MICRO 恢复当前上下文 */
  entry: LineageStopRef;
  /** 默认入口所在轨道的前后站 */
  previous?: LineageStopRef;
  next?: LineageStopRef;
  /** 该体系出现的其他轨道入口；保留下来供未来的轨道切换器使用 */
  alternatives: readonly LineageStopRef[];
  /** 默认轨道里所有能落到体系级图边的站点对；由 graphRelations 计算 */
  graphLinks?: readonly LineageGraphLink[];
  /** 默认入口前后两侧的图边状态；与轨道邻站分开表达 */
  adjacency?: LineageGraphAdjacency;
}

export interface ScriptContext {
  system: WritingSystem;
  graph: ScriptGraphContext;
  /** 没有任何已核实轨道的体系没有这一段，不伪造链条 */
  lineage?: ScriptLineageContext;
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

/**
 * 取一个书写体系的完整上下文。
 *
 * 未知 id 返回 undefined；有节点但没有轨道的体系仍会返回 graph 上下文，
 * lineage 留空。这样详情页可以在同一种数据结构下显示“有前后演变”或
 * “尚无已核实血统轨道”，而不需要两套互相平行的模型。
 */
export function scriptContextFor(scriptId: string): ScriptContext | undefined {
  const system = systemById.get(scriptId);
  if (!system) return undefined;

  const parents = system.parents
    .map((parentId) => systemById.get(parentId))
    .filter((parent): parent is WritingSystem => Boolean(parent));
  const children = childrenByScript.get(scriptId) ?? [];
  const parentRelations = parentRelationsByScript.get(scriptId) ?? [];
  const childRelations = childRelationsByScript.get(scriptId) ?? [];
  const { ancestors, ancestryPaths } = ancestryFor(system.id);
  const { descendants, descendantPaths } = descendantsForWithPaths(system.id);

  const graph: ScriptGraphContext = {
    parents,
    children,
    ancestors,
    descendants,
    ancestryPaths,
    descendantPaths,
    parentRelations,
    childRelations,
  };

  const lineageEntry = lineageEntryFor(scriptId);
  if (!lineageEntry?.track) return { system, graph };

  const { previous, next } = adjacentStops(lineageEntry.track);
  return {
    system,
    graph,
    lineage: {
      entry: lineageEntry.track,
      previous,
      next,
      alternatives: lineageEntry.tracks.slice(1),
      graphLinks: graphLinksForLineage(lineageEntry.track.lineage),
      adjacency: adjacentGraphLinks(lineageEntry.track),
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
