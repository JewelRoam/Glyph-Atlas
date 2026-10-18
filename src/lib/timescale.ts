import type { WritingSystem } from '../data/types';
import type { LabelWidth } from './layout';

/**
 * 分段线性时间轴。
 *
 * 如果按真实年代等比例画，公元前 1200 到公元 0 年这一小段会挤进十几个
 * 闪米特字母，而公元 1800 之后只有寥寥几种，却占掉同样多的横向空间。
 * 结果就是密集期被迫堆成十几行，整张图被撑得又高又窄，
 * 总览时缩小到看不清，只能把一半标签藏起来。
 *
 * 所以横向宽度按"这一段里要放多少标签"分配：
 *   band_i = 保底宽度 + 剩余宽度 × (这一段标签总宽 / 全局标签总宽)
 * 时间仍然是单调的、可解释的（年代越大越靠右），只是不再等比例——
 * 和地质年表、地铁线路图压缩长距离段的做法是同一件事。
 */

/** 时间分段边界；与元数据的 TIME_DOMAIN 对齐 */
export const TIME_BREAKS = [-3300, -2000, -1000, -500, 0, 500, 1000, 1500, 1800, 2030];

/** 每一段的保底宽度（图坐标单位），保证再空的年代也看得出距离 */
const MIN_BAND = 86;

export interface TimeScale {
  /** 年 → 横向坐标 */
  x: (year: number) => number;
  /** 图形总宽度（含尾部留白） */
  total: number;
  /** 每一段分到的宽度，便于调试与导出 */
  bands: number[];
}

/**
 * @param systems     图上所有节点
 * @param labelWidth  标签占多宽（图坐标单位），与布局用的是同一个函数
 * @param totalWidth  图形横向总宽度
 * @param tail        右侧留给生命线尾巴与末代标签的空白
 */
export function buildTimeScale(
  systems: WritingSystem[],
  labelWidth: LabelWidth,
  totalWidth: number,
  tail: number,
): TimeScale {
  const n = TIME_BREAKS.length - 1;
  const demand = new Array<number>(n).fill(0);
  for (const s of systems) {
    demand[bandOf(s.dateFrom)] += labelWidth(s);
  }
  const sum = demand.reduce((a, b) => a + b, 0) || 1;
  const free = Math.max(0, totalWidth - tail - MIN_BAND * n);
  const bands = demand.map((d) => MIN_BAND + (free * d) / sum);

  const range: number[] = [];
  let cursor = 0;
  for (const w of bands) {
    range.push(cursor);
    cursor += w;
  }
  range.push(cursor);

  const x = (year: number): number => {
    const clamped = Math.min(Math.max(year, TIME_BREAKS[0]), TIME_BREAKS[n]);
    let i = n - 1;
    while (i > 0 && TIME_BREAKS[i] > clamped) i--;
    const span = TIME_BREAKS[i + 1] - TIME_BREAKS[i];
    const t = span <= 0 ? 0 : (clamped - TIME_BREAKS[i]) / span;
    return range[i] + t * bands[i];
  };

  return { x, total: cursor + tail, bands };
}

/** 某个年代落在第几段 */
function bandOf(year: number): number {
  const n = TIME_BREAKS.length - 1;
  if (year <= TIME_BREAKS[0]) return 0;
  for (let i = 0; i < n; i++) {
    if (year < TIME_BREAKS[i + 1]) return i;
  }
  return n - 1;
}
