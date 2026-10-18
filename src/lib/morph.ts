/**
 * SVG 路径形变引擎。
 *
 * 思路：把任意 path 拆成子路径，对每条子路径按弧长均匀采样 N 个点，
 * 再用点对点的线性插值生成中间态。这样无论两端 path 的命令结构如何，
 * 都能得到平滑的几何过渡（这也是 flubber 一类库的基本原理，
 * 自己实现是为了完全掌控子路径数量不匹配、开闭路径等边界情况）。
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 采样用的离屏 path 元素（惰性创建） */
let probe: SVGPathElement | null = null;
function getProbe(): SVGPathElement {
  if (!probe) {
    probe = document.createElementNS(SVG_NS, 'path');
  }
  return probe;
}

/** 按 'M' 命令把 path 拆成子路径 */
export function splitSubpaths(d: string): string[] {
  return d
    .split(/(?=[Mm])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export type Samples = number[][];

/** 沿一条子路径均匀采样（依赖浏览器的 SVG 几何接口） */
function sampleSubpath(d: string, n: number): Samples {
  const el = getProbe();
  el.setAttribute('d', d);
  try {
    const total = el.getTotalLength();
    if (!total || !isFinite(total)) throw new Error('degenerate');
    const pts: Samples = [];
    for (let i = 0; i <= n; i++) {
      const p = el.getPointAtLength((total * i) / n);
      pts.push([p.x, p.y]);
    }
    return pts;
  } catch {
    // 拿不到几何信息（无 SVG 实现的环境，或病态路径）时，
    // 退回到"读出所有坐标数字、当折线均匀采样"的粗糙方案：
    // 形变精度下降，但不会白屏。
    return sampleByNumbers(d, n);
  }
}

/** 兜底采样：把 path 里出现的数字按对读成点，再沿折线均匀取点 */
function sampleByNumbers(d: string, n: number): Samples {
  const nums = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  if (pts.length < 2) return Array.from({ length: n + 1 }, () => ([50, 50] as [number, number]));

  const out: Samples = [];
  const segs = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * segs;
    const lo = Math.min(Math.floor(u), segs - 1);
    const f = u - lo;
    const [x0, y0] = pts[lo];
    const [x1, y1] = pts[lo + 1];
    out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
  }
  return out;
}

/** 求一条路径所有采样点的质心，用于给退化子路径定位 */
function centroid(subs: Samples[]): [number, number] {
  let sx = 0;
  let sy = 0;
  let c = 0;
  for (const s of subs) {
    for (const [x, y] of s) {
      sx += x;
      sy += y;
      c++;
    }
  }
  return c ? [sx / c, sy / c] : [50, 50];
}

export interface PreparedGlyph {
  subpaths: Samples[];
  /** 采样点数（每条子路径相同） */
  n: number;
}

interface SubpathStats {
  cx: number;
  cy: number;
  area: number;
  signedArea: number;
  width: number;
  height: number;
}

interface Alignment {
  sa: Samples[];
  sb: Samples[];
  n: number;
}

const alignmentCache = new WeakMap<PreparedGlyph, WeakMap<PreparedGlyph, Alignment>>();

/** 把一条 path 预处理成可插值的采样点集合 */
export function prepare(d: string, n = 96): PreparedGlyph {
  const raw = splitSubpaths(d).map((sub) => sampleSubpath(sub, n));
  const [cx, cy] = centroid(raw);
  return { subpaths: raw.length ? raw : [[[cx, cy]]], n };
}

/**
 * 在两组已预处理的字形之间插值。
 *
 * 字形常常由很多互不相连的轮廓组成（笔画、内孔、点）。如果只按数组下标
 * 一一配对，「安」的顶部小点可能去追「あ」的整条大弧，中间态就会扭成一团。
 * 这里先按重心、面积与包围盒做贪心配对，再为每一对闭环寻找最省距离的起点；
 * 多出来的轮廓则原地收缩成点（或从点长开），配合 fill-rule: nonzero，
 * 表现为一笔消失或出现，而不是从整字质心拉出一根跨字长线。
 */
export function interpolatePath(
  a: PreparedGlyph,
  b: PreparedGlyph,
  t: number,
): string {
  const { sa, sb, n } = alignPair(a, b);

  const parts: string[] = [];
  for (let s = 0; s < sa.length; s++) {
    const from = sa[s];
    const to = sb[s];
    let d = '';
    for (let i = 0; i <= n; i++) {
      const x = from[i][0] + (to[i][0] - from[i][0]) * t;
      const y = from[i][1] + (to[i][1] - from[i][1]) * t;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      if (i > 0 && i < n) d += ' ';
    }
    parts.push(d + 'Z');
  }
  return parts.join(' ');
}

/** 对一对字形做子路径配对；结果按准备好的对象缓存。 */
function alignPair(a: PreparedGlyph, b: PreparedGlyph): Alignment {
  let byB = alignmentCache.get(a);
  if (!byB) {
    byB = new WeakMap();
    alignmentCache.set(a, byB);
  }
  const cached = byB.get(b);
  if (cached) return cached;

  const n = Math.max(a.n, b.n);
  const pa = a.subpaths.map((s) => resample(s, n));
  const pb = b.subpaths.map((s) => resample(s, n));
  const statsA = pa.map(statsOf);
  const statsB = pb.map(statsOf);
  const matchA = new Array<number>(pa.length).fill(-1);
  const matchB = new Array<number>(pb.length).fill(-1);

  const edges: { i: number; j: number; cost: number }[] = [];
  for (let i = 0; i < pa.length; i++) {
    for (let j = 0; j < pb.length; j++) {
      edges.push({ i, j, cost: pairCost(statsA[i], statsB[j]) });
    }
  }
  edges.sort((x, y) => x.cost - y.cost);
  for (const edge of edges) {
    if (matchA[edge.i] >= 0 || matchB[edge.j] >= 0) continue;
    matchA[edge.i] = edge.j;
    matchB[edge.j] = edge.i;
  }

  const sa: Samples[] = [];
  const sb: Samples[] = [];
  for (let i = 0; i < pa.length; i++) {
    const j = matchA[i];
    if (j >= 0) {
      sa.push(pa[i]);
      sb.push(rotateToFit(pa[i], pb[j], n));
    } else {
      sa.push(pa[i]);
      sb.push(degenerate(statsA[i], n));
    }
  }
  for (let j = 0; j < pb.length; j++) {
    if (matchB[j] >= 0) continue;
    sa.push(degenerate(statsB[j], n));
    sb.push(pb[j]);
  }

  const result = { sa, sb, n };
  byB.set(b, result);
  return result;
}

/** 轮廓的粗统计量：重心、面积、包围盒与绕向。 */
function statsOf(s: Samples): SubpathStats {
  let sx = 0;
  let sy = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let twiceArea = 0;
  for (let i = 0; i < s.length; i++) {
    const [x, y] = s[i];
    sx += x;
    sy += y;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    const next = s[(i + 1) % s.length];
    twiceArea += x * next[1] - next[0] * y;
  }
  const count = Math.max(1, s.length);
  const area = Math.abs(twiceArea) / 2;
  return {
    cx: sx / count,
    cy: sy / count,
    area,
    signedArea: twiceArea / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** 子路径配对代价：位置、大小与绕向都参与，避免把外轮廓配到内孔。 */
function pairCost(a: SubpathStats, b: SubpathStats): number {
  const distance = Math.hypot(a.cx - b.cx, a.cy - b.cy) / 100;
  const sizeScale = Math.max(Math.sqrt(a.area), Math.sqrt(b.area), 1);
  const sizeDiff = Math.abs(Math.sqrt(a.area) - Math.sqrt(b.area)) / sizeScale;
  const boxDiff = Math.max(Math.abs(a.width - b.width), Math.abs(a.height - b.height)) / 100;
  const windingPenalty =
    Math.sign(a.signedArea) === Math.sign(b.signedArea) || a.area < 1 || b.area < 1 ? 0 : 0.9;
  return distance * 1.2 + sizeDiff * 1.5 + boxDiff * 0.5 + windingPenalty;
}

/** 闭环没有天然起点。尝试所有整数错位，取采样点总距离最短的那一个。 */
function rotateToFit(a: Samples, b: Samples, n: number): Samples {
  if (n < 2) return b;
  const core = b.slice(0, n);
  let bestShift = 0;
  let best = Infinity;
  for (let shift = 0; shift < n; shift++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const p = a[i];
      const q = core[(i + shift) % n];
      const dx = p[0] - q[0];
      const dy = p[1] - q[1];
      sum += dx * dx + dy * dy;
      if (sum >= best) break;
    }
    if (sum < best) {
      best = sum;
      bestShift = shift;
    }
  }
  if (!bestShift) return b;
  const rotated: Samples = [];
  for (let i = 0; i < n; i++) rotated.push(core[(i + bestShift) % n]);
  rotated.push(rotated[0]);
  return rotated;
}

/** 让一条缺失的轮廓原地收缩成一个点，或以一个点原位长开。 */
function degenerate(stats: SubpathStats, n: number): Samples {
  return Array.from({ length: n + 1 }, () => [stats.cx, stats.cy]);
}

/** 把采样点序列重采样到指定点数 */
function resample(s: Samples, n: number): Samples {
  if (s.length === n + 1) return s;
  const out: Samples = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * (s.length - 1);
    const lo = Math.floor(u);
    const hi = Math.min(lo + 1, s.length - 1);
    const f = u - lo;
    out.push([
      s[lo][0] + (s[hi][0] - s[lo][0]) * f,
      s[lo][1] + (s[hi][1] - s[lo][1]) * f,
    ]);
  }
  return out;
}
