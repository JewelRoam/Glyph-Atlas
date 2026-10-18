import type { Family, WritingSystem } from '../data/types';

/** 泳道顺序（宏观图上从上到下） */
export const FAMILY_ORDER: Family[] = [
  'mesopotamia',
  'egypt',
  'levant',
  'greek',
  'indic',
  'seasia',
  'sinic',
  'centralasia',
  'mesoamerica',
  'africa',
  'modern',
  'other',
];

export interface LayoutNode {
  sys: WritingSystem;
  /** 出生点 x */
  x: number;
  /** 生命线末端 x */
  x2: number;
  /** 该行中心的 y */
  y: number;
  lane: number;
  row: number;
}

export interface LaneBand {
  family: Family;
  y0: number;
  y1: number;
}

export interface Layout {
  nodes: LayoutNode[];
  lanes: LaneBand[];
  width: number;
  height: number;
}

const ROW_H = 36;
const LANE_PAD = 16;
/** 图右侧留白：让最晚出现的节点也有地方放标签与生命线尾巴 */
const TAIL = 200;

/**
 * 标签宽度（图坐标单位）由调用方给出。
 *
 * 布局本身不该知道字体、缩放和 canvas——它只要一个"这个名字占多宽"的函数，
 * 这样也方便按不同窗口尺寸给出不同的预留量。
 */
export type LabelWidth = (system: WritingSystem) => number;

/**
 * 计算宏观图布局：x 轴为年代，y 轴按谱系分区排成泳道，
 * 同一泳道内用贪心算法分行，避免标签重叠。
 */
export function computeLayout(
  systems: WritingSystem[],
  x: (year: number) => number,
  endYear: number,
  labelWidth: LabelWidth,
): Layout {
  const nodes: LayoutNode[] = [];
  const lanes: LaneBand[] = [];
  let cursorY = 0;

  for (const family of FAMILY_ORDER) {
    const members = systems
      .filter((s) => s.family === family)
      .sort((a, b) => a.dateFrom - b.dateFrom);
    if (members.length === 0) continue;

    const rowRight: number[] = [];
    const laneNodes: { sys: WritingSystem; x: number; x2: number; row: number }[] = [];

    for (const sys of members) {
      const px = x(sys.dateFrom);
      const px2 = x(sys.dateTo ?? endYear);
      const w = labelWidth(sys);
      let row = -1;
      for (let r = 0; r < rowRight.length; r++) {
        if (px > rowRight[r] + 14) {
          row = r;
          break;
        }
      }
      if (row === -1) {
        row = rowRight.length;
        rowRight.push(0);
      }
      rowRight[row] = px + w;
      laneNodes.push({ sys, x: px, x2: px2, row });
    }

    const laneTop = cursorY + LANE_PAD;
    const laneHeight = rowRight.length * ROW_H;
    for (const n of laneNodes) {
      nodes.push({
        sys: n.sys,
        x: n.x,
        x2: n.x2,
        y: laneTop + n.row * ROW_H + ROW_H / 2,
        lane: FAMILY_ORDER.indexOf(family),
        row: n.row,
      });
    }
    lanes.push({ family, y0: cursorY, y1: cursorY + laneHeight + LANE_PAD * 2 });
    cursorY += laneHeight + LANE_PAD * 2;
  }

  return {
    nodes,
    lanes,
    width: x(endYear) + TAIL,
    height: cursorY + 20,
  };
}

/** 计算某个节点的所有祖先与后代，用于高亮 */
export function relatives(
  id: string,
  systems: WritingSystem[],
): { ancestors: Set<string>; descendants: Set<string> } {
  const byId = new Map(systems.map((s) => [s.id, s]));
  const ancestors = new Set<string>();
  const descendants = new Set<string>();

  const up = (cur: string) => {
    const s = byId.get(cur);
    if (!s) return;
    for (const p of s.parents) {
      if (!ancestors.has(p)) {
        ancestors.add(p);
        up(p);
      }
    }
  };
  const down = (cur: string) => {
    for (const s of systems) {
      if (s.parents.includes(cur) && !descendants.has(s.id)) {
        descendants.add(s.id);
        down(s.id);
      }
    }
  };

  up(id);
  down(id);
  return { ancestors, descendants };
}
