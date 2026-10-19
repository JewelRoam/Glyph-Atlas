import type { WritingSystem } from './types';
import { writingSystems } from './writingSystems';
import {
  adjacentStops,
  lineageEntryFor,
  type LineageStopRef,
} from './lineageIndex';

/**
 * 一个书写体系在“图谱 + 血统”两层里的完整上下文。
 *
 * 未来 MACRO 节点详情与 MICRO 合流时，界面只需要拿这一份对象：
 *  - graph：节点在 parents 有向图中的直接前驱 / 后继；
 *  - lineage：默认字形轨道、轨道上的前后站，以及该体系出现的其他轨道。
 *
 * 两层关系不能互相冒充：graph 表示书写体系之间的传承或影响，
 * lineage 表示某个同源字位在具体字形层面的前后关系。
 */
export interface ScriptGraphContext {
  parents: readonly WritingSystem[];
  children: readonly WritingSystem[];
}

export interface ScriptLineageContext {
  /** 默认入口站点，可直接交给 MICRO 恢复当前上下文 */
  entry: LineageStopRef;
  /** 默认入口所在轨道的前后站 */
  previous?: LineageStopRef;
  next?: LineageStopRef;
  /** 该体系出现的其他轨道入口；保留下来供未来的轨道切换器使用 */
  alternatives: readonly LineageStopRef[];
}

export interface ScriptContext {
  system: WritingSystem;
  graph: ScriptGraphContext;
  /** 没有任何已核实轨道的体系没有这一段，不伪造链条 */
  lineage?: ScriptLineageContext;
}

const childrenByScript = new Map<string, WritingSystem[]>();
for (const system of writingSystems) {
  for (const parentId of system.parents) {
    const children = childrenByScript.get(parentId) ?? [];
    children.push(system);
    childrenByScript.set(parentId, children);
  }
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
  const system = writingSystems.find((candidate) => candidate.id === scriptId);
  if (!system) return undefined;

  const graph: ScriptGraphContext = {
    parents: system.parents
      .map((parentId) => writingSystems.find((candidate) => candidate.id === parentId))
      .filter((parent): parent is WritingSystem => Boolean(parent)),
    children: childrenByScript.get(scriptId) ?? [],
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
    },
  };
}
