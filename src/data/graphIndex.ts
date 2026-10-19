import { graphRelations } from './graphRelations';
import { writingSystems } from './writingSystems';
import type { GraphRelation, WritingSystem } from './types';

/** 有向图上的一步：边本身以及它在数据里的两个端点。 */
export interface GraphStep {
  relation: GraphRelation;
  from: WritingSystem;
  to: WritingSystem;
}

/** 两个书写体系之间的一条有向路径，至少包含一步。 */
export interface GraphPath {
  from: WritingSystem;
  to: WritingSystem;
  steps: readonly GraphStep[];
}

/** 两个书写体系之间的连接强度。 */
export type GraphConnectionStatus = 'direct' | 'indirect' | 'none';

/** 从某个方向看，路径是顺着还是逆着当前轨道。 */
export type GraphPathDirection = 'forward' | 'reverse';

/**
 * 两个书写体系之间的连接结果。
 *
 * `direct` 表示边表里有一条直接边；`indirect` 表示中间隔着未入轨节点，
 * 但仍存在一条严格沿有向边的路径；`none` 表示两个方向都没有路径。
 * 不把“间接”压成“无关”，也不为了界面好看补一条假直系边。
 */
export interface GraphConnection {
  status: GraphConnectionStatus;
  direction?: GraphPathDirection;
  path?: GraphPath;
}

const systemById = new Map(writingSystems.map((system) => [system.id, system]));
const outgoingByScript = new Map<string, GraphRelation[]>();
const relationByKey = new Map<string, GraphRelation>();

const relationKey = (parentId: string, childId: string) => `${parentId}>${childId}`;

for (const relation of graphRelations) {
  const outgoing = outgoingByScript.get(relation.parent) ?? [];
  outgoing.push(relation);
  outgoingByScript.set(relation.parent, outgoing);
  relationByKey.set(relationKey(relation.parent, relation.child), relation);
}

function stepFor(relation: GraphRelation): GraphStep | undefined {
  const from = systemById.get(relation.parent);
  const to = systemById.get(relation.child);
  return from && to ? { relation, from, to } : undefined;
}

function directRelation(fromId: string, toId: string): GraphRelation | undefined {
  return relationByKey.get(relationKey(fromId, toId));
}

/**
 * 按 graphRelations 的登记顺序做确定性 BFS，取最短的有向路径。
 *
 * 同一对节点若有多条等长路径，保留先登记的一条；这样数据顺序变化会显式
 * 反映在审计结果里，而不是由对象遍历顺序决定。环不会让搜索死循环。
 */
function pathBetween(fromId: string, toId: string): GraphPath | undefined {
  if (fromId === toId) return undefined;
  const from = systemById.get(fromId);
  const to = systemById.get(toId);
  if (!from || !to) return undefined;

  const queue: Array<{ id: string; steps: GraphStep[] }> = [
    { id: fromId, steps: [] },
  ];
  const visited = new Set<string>([fromId]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (!current) continue;

    for (const relation of outgoingByScript.get(current.id) ?? []) {
      if (visited.has(relation.child)) continue;
      const step = stepFor(relation);
      if (!step) continue;

      const steps = [...current.steps, step];
      if (relation.child === toId) return { from, to, steps };

      visited.add(relation.child);
      queue.push({ id: relation.child, steps });
    }
  }

  return undefined;
}

/** 从 from 到 to 的最短有向路径；没有路径时返回 undefined。 */
export function graphPathBetween(
  fromId: string,
  toId: string,
): GraphPath | undefined {
  return pathBetween(fromId, toId);
}

/**
 * 判断两个体系是有直接边、间接有向路径，还是无关。
 *
 * 直接边优先于更长的间接路径；两个方向都有直接边时按轨道顺序取正向。
 * 间接路径两个方向都存在时取较短的一条，等长时取正向。
 */
export function graphConnectionBetween(
  fromId: string,
  toId: string,
): GraphConnection {
  if (fromId === toId) return { status: 'none' };

  const forwardRelation = directRelation(fromId, toId);
  const reverseRelation = directRelation(toId, fromId);
  const forwardDirect = forwardRelation ? stepFor(forwardRelation) : undefined;
  const reverseDirect = reverseRelation ? stepFor(reverseRelation) : undefined;

  if (forwardDirect) {
    const from = systemById.get(fromId);
    const to = systemById.get(toId);
    if (from && to) {
      return {
        status: 'direct',
        direction: 'forward',
        path: { from, to, steps: [forwardDirect] },
      };
    }
  }
  if (reverseDirect) {
    const from = systemById.get(fromId);
    const to = systemById.get(toId);
    if (from && to) {
      return {
        status: 'direct',
        direction: 'reverse',
        path: { from: to, to: from, steps: [reverseDirect] },
      };
    }
  }

  const forward = pathBetween(fromId, toId);
  const reverse = pathBetween(toId, fromId);
  if (!forward && !reverse) return { status: 'none' };

  if (forward && (!reverse || forward.steps.length <= reverse.steps.length)) {
    return { status: 'indirect', direction: 'forward', path: forward };
  }
  if (reverse) {
    return { status: 'indirect', direction: 'reverse', path: reverse };
  }

  return { status: 'none' };
}
