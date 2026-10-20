import type { GraphRelationKind } from '../data/types';
import type { ScriptGraphNeighborContext } from '../data/scriptContext';
import { formatSpan } from '../lib/time';

const RELATION_LABEL: Record<GraphRelationKind, string> = {
  descent: '直系演变',
  borrowing: '借用',
  influence: '影响',
  model: '造字模型',
};

const RELATION_ORDER: readonly GraphRelationKind[] = [
  'descent',
  'borrowing',
  'model',
  'influence',
];

type RailSide = 'parent' | 'child';

const COPY: Record<
  RailSide,
  { label: string; empty: string; aria: string }
> = {
  parent: {
    label: '来源',
    empty: '没有已核实的来源',
    aria: '直接来源',
  },
  child: {
    label: '去向',
    empty: '没有已核实的去向',
    aria: '直接去向',
  },
};

function orderedNeighbors(
  neighbors: readonly ScriptGraphNeighborContext[],
): { kind: GraphRelationKind; items: ScriptGraphNeighborContext[] }[] {
  return RELATION_ORDER.flatMap((kind) => {
    const items = neighbors
      .filter((neighbor) => neighbor.relation.kind === kind)
      .sort(
        (left, right) =>
          left.node.system.dateFrom - right.node.system.dateFrom ||
          left.node.system.nameZh.localeCompare(right.node.system.nameZh, 'zh-CN'),
      );
    return items.length ? [{ kind, items }] : [];
  });
}

/**
 * 节点两侧的直接谱系。
 *
 * 每一端都完整列出相邻书写体系，不再把多分支藏进局部切换器。关系类型、
 * 年代与英文名都在按钮内，主列只承担层级；点击后整个节点一起切换。
 */
export function RelationRail({
  side,
  neighbors,
  onOpen,
}: {
  side: RailSide;
  neighbors: readonly ScriptGraphNeighborContext[];
  onOpen: (scriptId: string) => void;
}) {
  const groups = orderedNeighbors(neighbors);
  const copy = COPY[side];

  return (
    <nav className="relation-rail" data-side={side} aria-label={copy.aria}>
      <header className="relation-rail-head">
        <span>{copy.label}</span>
        <b>{String(neighbors.length).padStart(2, '0')}</b>
      </header>

      {groups.length ? (
        <div className="relation-rail-groups">
          {groups.map((group) => (
            <section className="relation-group" key={group.kind}>
              <h3>{RELATION_LABEL[group.kind]}</h3>
              {group.items.map((neighbor) => {
                const system = neighbor.node.system;
                return (
                  <button
                    className="relation-link"
                    key={`${neighbor.relation.parent}>${neighbor.relation.child}`}
                    onClick={() => onOpen(system.id)}
                    aria-label={`${RELATION_LABEL[group.kind]}：${system.nameZh}（${system.nameEn}）`}
                    title={neighbor.relation.note}
                  >
                    <span className="relation-link-mark" aria-hidden="true">
                      {side === 'parent' ? '←' : '→'}
                    </span>
                    <span className="relation-link-copy">
                      <strong>{system.nameZh}</strong>
                      <em>{system.nameEn}</em>
                      <small>{formatSpan(system.dateFrom, system.dateTo)}</small>
                    </span>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <p className="relation-rail-empty">{copy.empty}</p>
      )}
    </nav>
  );
}
