/**
 * 等比例线性时间轴。
 *
 * 横轴就是年代本身：x = (年 − 域起点) × 每年占的图坐标宽度。
 * 全站时间域 −3300 – 2030 共 5330 年，公元前因此拿到 62% 的横向空间，
 * 任意两段年代的横向距离之比都等于真实年代之比——看图的人可以直接用
 * 眼睛比较"隔了多久"。
 *
 * 早先这里用的是"按标签密度分配宽度"的分段轴：把时间域切成九段，
 * 每段宽度按这一段要放多少标签来分。那样确实能少占几行，但公元前
 * 3300 年只剩下 34% 的宽度，读起来像是"公元前被压缩了"——年代轴一旦
 * 不等比例，位置就不再是可靠的信息。所以改回等比例：
 * 密集期不再靠拉伸时间轴解决，而是靠泳道内分行与缩放平移。
 */
import { TIME_DOMAIN } from './time';

/** 全站时间域，与 lib/time.ts、tools/validate-data.mjs 共用同一个定义 */
export { TIME_DOMAIN } from './time';

export interface TimeScale {
  /** 年 → 横向坐标 */
  x: (year: number) => number;
  /** 每年占多少图坐标单位（调试与文档用） */
  pxPerYear: number;
  /** 时间域 */
  domain: [number, number];
  /** 时间域对应的横向总宽度（不含尾部留白） */
  total: number;
}

/**
 * @param totalWidth 时间域对应的横向总宽度（图坐标单位）
 */
export function buildTimeScale(totalWidth: number): TimeScale {
  const [from, to] = TIME_DOMAIN;
  const pxPerYear = totalWidth / (to - from);
  const x = (year: number): number => {
    const clamped = Math.min(Math.max(year, from), to);
    return (clamped - from) * pxPerYear;
  };
  return { x, pxPerYear, domain: TIME_DOMAIN, total: totalWidth };
}
