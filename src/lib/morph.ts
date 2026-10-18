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

/** 把一条 path 预处理成可插值的采样点集合 */
export function prepare(d: string, n = 96): PreparedGlyph {
  const raw = splitSubpaths(d).map((sub) => sampleSubpath(sub, n));
  const [cx, cy] = centroid(raw);
  return { subpaths: raw.length ? raw : [[[cx, cy]]], n };
}

/**
 * 在两组已预处理的字形之间插值。
 * 子路径数量不同时，用"退化子路径"补齐：它从质心处的一个点长大，
 * 配合 fill-rule: evenodd，表现为一个洞从无到有地张开。
 */
export function interpolatePath(
  a: PreparedGlyph,
  b: PreparedGlyph,
  t: number,
): string {
  const maxSub = Math.max(a.subpaths.length, b.subpaths.length);
  const n = Math.max(a.n, b.n);
  const pa = padGlyph(a, maxSub, n);
  const pb = padGlyph(b, maxSub, n);

  const parts: string[] = [];
  for (let s = 0; s < maxSub; s++) {
    const sa = pa[s];
    const sb = pb[s];
    let d = '';
    for (let i = 0; i <= n; i++) {
      const x = sa[i][0] + (sb[i][0] - sa[i][0]) * t;
      const y = sa[i][1] + (sb[i][1] - sa[i][1]) * t;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      if (i > 0 && i < n) d += ' ';
    }
    parts.push(d + 'Z');
  }
  return parts.join(' ');
}

/** 把字形补齐到指定子路径数与采样点数 */
function padGlyph(g: PreparedGlyph, subs: number, n: number): Samples[] {
  const [cx, cy] = centroid(g.subpaths);
  const out: Samples[] = [];
  for (let i = 0; i < subs; i++) {
    const src = g.subpaths[i];
    if (src) {
      out.push(resample(src, n));
    } else {
      out.push(Array.from({ length: n + 1 }, () => [cx, cy]));
    }
  }
  return out;
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
