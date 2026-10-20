import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as d3 from 'd3';
import { graphSystems as writingSystems } from '../data';
import type { WritingSystem } from '../data/types';
import { computeLayout, FAMILY_ORDER, relatives } from '../lib/layout';
import { FAMILY_COLOR, FAMILY_LABEL, formatYearShort } from '../lib/time';
import { measureText } from '../lib/measure';
import { buildTimeScale } from '../lib/timescale';

/**
 * 全球演化全图：全部书写体系的有向演化关系。
 *
 * 图分两层：
 *  · 坐标系层（会缩放平移）：泳道底色、年代竖线、演化边、节点与生命线；
 *  · 陈设层（不缩放）：左侧谱系名、顶部年代刻度。文字属于"地图注记"，
 *    不该随着缩放变大变小，所以它们渲染在 SVG 之外，按当前变换换算位置。
 *    窄屏放不下谱系名时，左侧只留一条颜色脊，完整名称移到图下图例。
 *
 * 节点的名字标签留在坐标系内，但字号按 1/k 反向补偿，屏幕上始终 13px；
 * 缩得太小时再按"屏幕矩形是否相撞"做一轮取舍，宁可少显示几个名字，
 * 也不让文字叠成一团（这和地图软件的做法是同一件事）。
 */

/**
 * 时间域（5330 年）对应的横向总宽度 = 可用宽度 × 这个倍率，
 * 再夹在上下限之间。等比例时间轴下，这个值直接决定"每一年有多宽"
 * （约 0.5–0.9 图单位），也就是整张图的横向疏密。
 */
const AXIS_WIDTH_RATIO = 2.6;
const AXIS_WIDTH_MIN = 2100;
const AXIS_WIDTH_MAX = 4600;

/** 标签在屏幕上的目标字号（像素），不随缩放变化 */
const NODE_LABEL_PX = 13;
const NODE_LABEL_FONT =
  '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif';
/**
 * 名字相对节点的偏移（屏幕像素）。基线往上抬 7px，右移 9px。
 * 渲染与碰撞检测共用这两个数字，避免"画在这里、判定在那里"。
 */
const LABEL_DX = 9;
const LABEL_DY = -7;
/**
 * 名字行盒相对基线的上下缘（屏幕像素）。中文在 13px 下实测为
 * 基线上方约 14px、下方约 5px，共 19px 高——比 font-size 大不少。
 * 碰撞检测必须按这个真实高度算，否则相邻行会"判定通过、肉眼叠字"。
 */
const LABEL_BOX_ABOVE = NODE_LABEL_PX * 1.05;
const LABEL_BOX_BELOW = NODE_LABEL_PX * 0.38;
/** 相邻名字之间至少留出的水平空隙（屏幕像素） */
const LABEL_GAP = 6;
const LANE_LABEL_PX = 14;
const TICK_LABEL_PX = 12;
/** 年代刻度用的字体（与 CSS 的 --antique 保持一致），量宽度时要用同一个 */
const TICK_FONT = '"Cardo", "Iowan Old Style", "Palatino Linotype", "Songti SC", Georgia, serif';
/** 刻度的字距（CSS letter-spacing: 0.08em），量宽度时要算进去 */
const TICK_TRACKING = 0.08;
/**
 * 布局按这个缩放比例预留标签宽度：labelWidth = 实测屏幕宽度 ÷ NOMINAL_K。
 * 这是个偏乐观的值——比桌面实际的总览比例（0.20–0.37）大，于是布局不会为了
 * "一行塞得下"把泳道撑得过高；真塞不下时交给标注取舍就地折叠，不会叠字。
 * 调大 → 布局更紧凑、折叠更多；调小 → 图更高更空、折叠更少。
 */
const NOMINAL_K = 0.48;
/**
 * 缩放上下限。等比例时间轴比过去的分段轴更高更宽，桌面总数览比例落在
 * 0.20–0.37，下限 0.18 够用；窄屏要更小才放得下整张图，所以实际下限是
 * min(ZOOM_MIN, fitK × 0.98)。若把下限钉死在 0.18，手机首屏的适配比例
 * 会低于它，用户第一次滚轮就被拽回 0.18，画面突然一跳。
 */
const ZOOM_MIN = 0.18;
const ZOOM_MAX = 6;
/** 顶部留给年代刻度的空白（屏幕像素） */
const TOP_PAD = 26;
/** 左侧谱系名自然留白宽度（屏幕像素），由最长的谱系名撑开 */
const LANE_LABEL_GUTTER = Math.round(
  Math.max(...FAMILY_ORDER.map((f) => measureText(FAMILY_LABEL[f], LANE_LABEL_PX))) + 30,
);
/** 谱系名最多占画布宽度的五分之一；超过时改用颜色脊与下方图例。 */
const LANE_GUTTER_MAX_RATIO = 0.2;
/** 窄屏颜色脊宽度（屏幕像素）。 */
const LANE_SPINE_WIDTH = 9;

/** 年代刻度的位置 */
const TICKS = [-3000, -2000, -1000, 0, 1000, 2000];

/** 标签取舍的优先级：还在用的 > 宗教用 > 历史 > 消亡 / 未破译 */
const STATUS_RANK: Record<string, number> = {
  living: 0,
  revived: 0,
  liturgical: 1,
  historical: 2,
  extinct: 3,
  undeciphered: 4,
};

export interface AtlasViewport {
  x: number;
  y: number;
  k: number;
}

interface Props {
  /** 从体系节点返回时恢复的视图；首次进入传 null。 */
  initialView?: AtlasViewport | null;
  onViewChange: (view: AtlasViewport) => void;
  onOpenScript: (scriptId: string) => void;
}

export function AtlasGraph({ initialView, onViewChange, onOpenScript }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialViewRef = useRef(initialView);
  const positionedRef = useRef(false);
  const onViewChangeRef = useRef(onViewChange);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ x: 0, y: 0, k: NOMINAL_K });
  const viewRef = useRef(view);
  const [showLabels, setShowLabels] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  // 不按设备型号猜断点：直接比较谱系名所需宽度与当前画布。
  // 当标签会侵占过多绘图区时，整组标签改为图例，而不是逐字缩写。
  const showLaneLabels = size.w > 0 && LANE_LABEL_GUTTER <= size.w * LANE_GUTTER_MAX_RATIO;
  const gutter = showLaneLabels ? LANE_LABEL_GUTTER : LANE_SPINE_WIDTH;

  /** 画布可用宽度（扣掉左侧谱系陈设） */
  const plotW = Math.max(160, size.w - gutter);
  /** 时间轴总宽：随画布伸缩，见文件头的 AXIS_WIDTH_RATIO */
  const axisWidth = Math.min(
    AXIS_WIDTH_MAX,
    Math.max(AXIS_WIDTH_MIN, Math.round(plotW * AXIS_WIDTH_RATIO)),
  );

  // 标签要占多宽（图坐标单位）。布局用它预留横向空间，取舍判定用同一个
  // measureText 量屏幕宽度——两处同源，否则会出现"布局以为放得下、
  // 屏幕上却撞车"。
  const labelWidth = useCallback(
    (s: WritingSystem) =>
      // 28 图单位 ≈ 两侧各 7px（NOMINAL_K 下）的呼吸，跟下面的取舍判定对齐
      measureText(s.nameZh, NODE_LABEL_PX, NODE_LABEL_FONT) / NOMINAL_K + 28,
    [],
  );

  const layout = useMemo(() => {
    const axis = buildTimeScale(axisWidth);
    return {
      ...computeLayout(writingSystems, axis.x, 2030, labelWidth),
      axis,
    };
  }, [labelWidth, axisWidth]);

  const xScale = layout.axis.x;

  // 容器尺寸
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fitK = useMemo(
    () =>
      Math.min(
        1,
        (plotW - 24) / layout.width,
        (size.h - TOP_PAD - 24) / layout.height,
      ),
    [plotW, layout.width, layout.height, size.h],
  );

  /**
   * 总览位置：给顶部刻度留出 TOP_PAD 之后，把整张图摆在视口正中。
   *
   * 之前这里只做了 translate(0, TOP_PAD)，于是整张图贴着左上角；
   * 图比视口小的时候（总览通常如此）右边和下边会空出一大片，
   * 看上去像是"图跑偏了"。现在横向、纵向都居中；
   * 1:1 之类的放大视图本来就比视口大，取 max(0, …) 后仍是贴边。
   */
  const overview = useCallback(
    (scale: number) =>
      d3.zoomIdentity
        .translate(
          Math.max(0, (plotW - layout.width * scale) / 2),
          TOP_PAD + Math.max(0, (size.h - TOP_PAD - layout.height * scale) / 2),
        )
        .scale(scale),
    [layout.width, layout.height, plotW, size.h],
  );

  // 缩放与平移：只有变化到肉眼可见的程度才回写 state，避免每帧重渲染
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        g.attr('transform', event.transform.toString());
        const next = { x, y, k };
        const previous = viewRef.current;
        if (
          Math.abs(previous.k - k) < 0.004 &&
          Math.abs(previous.x - x) < 0.6 &&
          Math.abs(previous.y - y) < 0.6
        ) {
          return;
        }
        viewRef.current = next;
        setView(next);
        onViewChangeRef.current(next);
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // 首次有真实画布尺寸后定位：返回全图时恢复离开前的视图，首次进入则居中适配。
  // 之后窗口尺寸变化不再把用户已经选好的视域拽回总览。
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || !size.w || !size.h || positionedRef.current) return;
    const saved = initialViewRef.current;
    const target = saved
      ? d3.zoomIdentity.translate(saved.x, saved.y).scale(saved.k)
      : overview(fitK);
    d3.select(svgRef.current).call(zoomRef.current.transform, target);
    positionedRef.current = true;
  }, [fitK, overview, size.h, size.w]);

  // 缩放下限跟着适配比例走，理由见 ZOOM_MIN 的注释
  useEffect(() => {
    zoomRef.current?.scaleExtent([Math.min(ZOOM_MIN, fitK * 0.98), ZOOM_MAX]);
  }, [fitK]);

  const reposition = useCallback(
    (anchor: 'fit' | 'origin') => {
      const svgEl = svgRef.current;
      const zoom = zoomRef.current;
      if (!svgEl || !zoom) return;
      const target = overview(anchor === 'fit' ? fitK : 1);
      d3.select(svgEl).transition().duration(500).call(zoom.transform, target);
    },
    [fitK, overview],
  );

  const focusId = hovered;
  const rel = useMemo(
    () => (focusId ? relatives(focusId, writingSystems) : null),
    [focusId],
  );

  const isDimmed = useCallback(
    (id: string): boolean => {
      if (!rel || !focusId) return false;
      if (id === focusId) return false;
      return !rel.ancestors.has(id) && !rel.descendants.has(id);
    },
    [rel, focusId],
  );

  const nodePos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    layout.nodes.forEach((n) => m.set(n.sys.id, { x: n.x, y: n.y }));
    return m;
  }, [layout]);

  /**
   * 年代刻度：窄屏上刻度会挤到一起，所以按屏幕上的实际宽度依次让位，
   * 放不下的就整条撤掉（竖线仍保留，只减少文字）。
   */
  const tickLabels = useMemo(() => {
    const out: { t: number; left: number; label: string }[] = [];
    let lastRight = -Infinity;
    for (const t of TICKS) {
      const left = gutter + view.x + xScale(t) * view.k + 5;
      if (left < gutter + 2 || left > size.w - 30) continue;
      const label = formatYearShort(t);
      if (left < lastRight + 10) continue;
      lastRight =
        left +
        measureText(label, TICK_LABEL_PX, TICK_FONT) +
        TICK_TRACKING * TICK_LABEL_PX * label.length;
      out.push({ t, left, label });
    }
    return out;
  }, [gutter, view, xScale, size.w]);

  /** 一屏幕像素对应多少图坐标单位 */
  const u = 1 / view.k;
  /** 节点标签在图上画多大（反向补偿后屏幕上恒为 NODE_LABEL_PX） */
  const labelSize = NODE_LABEL_PX * u;

  /**
   * 标签取舍：按优先级（还在用 > 宗教 > 历史 > 消亡 > 未破译）依次占位。
   * 每个名字先试节点右侧；右侧被占就翻到左侧、文字改成右对齐；
   * 两侧都撞上才折叠不画。相邻两行一左一右错开，能把不少"注定被藏掉"
   * 的名字救回来；中央字形与连线用的是同一套屏幕坐标，所以判定即所见。
   *
   * 判定矩形按 13px 中文的实测行盒（基线上方 14px、下方 5px）算，
   * 比 font-size 大得多——用 font-size 当高度会"判定通过、肉眼叠字"。
   */
  const labelPlan = useMemo(() => {
    const hidden = new Set<string>();
    const flipped = new Set<string>();
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    if (!showLabels) return { hidden, flipped };
    const ordered = layout.nodes
      .filter((n) => {
        const screenX = gutter + view.x + n.x * view.k;
        const screenY = view.y + n.y * view.k;
        return screenX >= gutter && screenX <= size.w && screenY >= TOP_PAD && screenY <= size.h;
      })
      .sort(
        (a, b) =>
          Number(b.sys.origin === 'independent') - Number(a.sys.origin === 'independent') ||
          (STATUS_RANK[a.sys.status] ?? 5) - (STATUS_RANK[b.sys.status] ?? 5) ||
          a.y - b.y ||
          a.x - b.x,
      );
    /** 与已占位矩形是否相撞（留 LABEL_GAP 呼吸） */
    const free = (r: { x0: number; x1: number; y0: number; y1: number }) =>
      !placed.some(
        (o) => r.x0 < o.x1 + LABEL_GAP && r.x1 + LABEL_GAP > o.x0 && r.y0 < o.y1 && r.y1 > o.y0,
      );
    const inside = (r: { x0: number; x1: number; y0: number; y1: number }) =>
      r.x0 >= gutter + 3 && r.x1 <= size.w - 3 && r.y0 >= TOP_PAD && r.y1 <= size.h;
    for (const n of ordered) {
      const w = measureText(n.sys.nameZh, NODE_LABEL_PX, NODE_LABEL_FONT);
      const dotX = gutter + view.x + n.x * view.k;
      const baseline = view.y + n.y * view.k + LABEL_DY;
      const y0 = baseline - LABEL_BOX_ABOVE;
      const y1 = baseline + LABEL_BOX_BELOW;
      const right = { x0: dotX + LABEL_DX, x1: dotX + LABEL_DX + w, y0, y1 };
      const left = { x0: dotX - LABEL_DX - w, x1: dotX - LABEL_DX, y0, y1 };
      if (inside(right) && free(right)) placed.push(right);
      else if (inside(left) && free(left)) {
        placed.push(left);
        flipped.add(n.sys.id);
      } else {
        hidden.add(n.sys.id);
      }
    }
    return { hidden, flipped };
  }, [gutter, showLabels, layout, size.h, size.w, view]);

  return (
    <div className="atlas" style={{ '--u': u } as CSSProperties}>
      <div className="atlas-canvas" ref={wrapRef}>
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          className="atlas-svg"
          role="img"
          aria-label="世界书写体系演化图谱：横轴为年代，纵轴按谱系分区，连线表示衍生关系"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" fill="#4b4438" />
            </marker>
            <clipPath id="plot-clip">
              <rect x={gutter} y={0} width={plotW} height={size.h} />
            </clipPath>
          </defs>

          <g clipPath="url(#plot-clip)">
            <g transform={`translate(${gutter},0)`}>
              <g ref={gRef}>
                {/* 泳道底色 */}
                {layout.lanes.map((lane, i) => (
                  <rect
                    key={lane.family}
                    x={-gutter * u}
                    y={lane.y0}
                    width={layout.width + gutter * u}
                    height={lane.y1 - lane.y0}
                    fill={i % 2 === 0 ? 'rgba(239,230,214,0.022)' : 'transparent'}
                  />
                ))}

                {/* 年代竖线 */}
                {TICKS.map((t) => {
                  const gx = xScale(t);
                  return (
                    <line
                      key={t}
                      x1={gx}
                      x2={gx}
                      y1={0}
                      y2={layout.height}
                      stroke="rgba(239,230,214,0.09)"
                      strokeDasharray={`${2 * u} ${6 * u}`}
                    />
                  );
                })}

                {/* 演化边 */}
                <g className="edges">
                  {layout.nodes.map((n) =>
                    n.sys.parents.map((pid) => {
                      const p = nodePos.get(pid);
                      if (!p) return null;
                      const dx = Math.max(30, (n.x - p.x) * 0.45);
                      const active =
                        focusId &&
                        (n.sys.id === focusId ||
                          pid === focusId ||
                          rel?.ancestors.has(n.sys.id) ||
                          rel?.descendants.has(pid));
                      return (
                        <path
                          key={`${pid}-${n.sys.id}`}
                          d={`M${p.x} ${p.y} C${p.x + dx} ${p.y}, ${n.x - dx} ${n.y}, ${n.x} ${n.y}`}
                          className={`edge ${isDimmed(n.sys.id) && isDimmed(pid) ? 'dim' : ''} ${active ? 'active' : ''}`}
                          markerEnd="url(#arrow)"
                        />
                      );
                    }),
                  )}
                </g>

                {/* 节点 */}
                <g className="nodes">
                  {layout.nodes.map((n) => {
                    const color = FAMILY_COLOR[n.sys.family];
                    const dim = isDimmed(n.sys.id);
                    const folded = labelPlan.hidden.has(n.sys.id);
                    const flipped = labelPlan.flipped.has(n.sys.id);
                    const showLabel = showLabels && (!folded || n.sys.id === hovered);
                    return (
                      <g
                        key={n.sys.id}
                        className={`node ${dim ? 'dim' : ''}`}
                        transform={`translate(${n.x},${n.y})`}
                        onMouseEnter={() => setHovered(n.sys.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => onOpenScript(n.sys.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`查看${n.sys.nameZh}的演变`}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onOpenScript(n.sys.id);
                          }
                        }}
                      >
                        {/* 生命线 */}
                        <line
                          x1={0}
                          x2={Math.max(6, n.x2 - n.x)}
                          y1={0}
                          y2={0}
                          stroke={color}
                          strokeOpacity={n.sys.status === 'living' ? 0.75 : 0.32}
                          strokeDasharray={
                            n.sys.status === 'extinct' || n.sys.status === 'undeciphered'
                              ? `${3 * u} ${3 * u}`
                              : undefined
                          }
                        />
                        {/* 放大的透明命中区：小圆点也要好点中 */}
                        <circle r={10 * u} fill="transparent" />
                        <circle r={4.4 * u} fill={color} stroke="#0d1018" strokeWidth={1.4 * u} />
                        {showLabel && (
                          <text
                            className={`node-label ${folded ? 'was-folded' : ''}`}
                            x={(flipped ? -LABEL_DX : LABEL_DX) * u}
                            y={LABEL_DY * u}
                            textAnchor={flipped ? 'end' : 'start'}
                            fontSize={labelSize}
                            fill={n.sys.status === 'extinct' ? '#9d9483' : '#e8dfd0'}
                          >
                            {n.sys.nameZh}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </g>
          </g>
        </svg>

        {/* 陈设层：不随缩放改变字号与线宽 */}
        <div className="atlas-furniture" aria-hidden="true">
          <div className="gutter" style={{ width: gutter }} />
          {showLaneLabels
            ? layout.lanes.map((lane) => {
                const top = view.y + ((lane.y0 + lane.y1) / 2) * view.k;
                if (top < -20 || top > size.h + 20) return null;
                return (
                  <span
                    key={lane.family}
                    className="lane-label"
                    style={{ top, width: gutter - 14, color: FAMILY_COLOR[lane.family] }}
                  >
                    {FAMILY_LABEL[lane.family]}
                  </span>
                );
              })
            : layout.lanes.map((lane) => {
                const top = view.y + lane.y0 * view.k;
                const height = (lane.y1 - lane.y0) * view.k;
                if (top > size.h || top + height < 0) return null;
                return (
                  <span
                    key={lane.family}
                    className="lane-spine-mark"
                    style={{ top, height, background: FAMILY_COLOR[lane.family] }}
                  />
                );
              })}
          {tickLabels.map(({ t, left, label }) => (
            <span
              key={t}
              className="tick-label"
              style={{ left, top: TOP_PAD / 2, fontSize: TICK_LABEL_PX }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="atlas-tools">
          <button
            className={showLabels ? 'on' : ''}
            aria-pressed={showLabels}
            onClick={() => setShowLabels((v) => !v)}
            title="名字太挤时，图谱会自动取舍；关掉可以只看星座一样的节点与连线"
          >
            标注
          </button>
          <button onClick={() => reposition('fit')}>总览</button>
          <button onClick={() => reposition('origin')}>1:1</button>
        </div>

        {showLabels && labelPlan.hidden.size > 0 && (
          <div className="atlas-hint">另 {labelPlan.hidden.size} 个重叠标注已折叠</div>
        )}
      </div>

      {!showLaneLabels && size.w > 0 && (
        <div className="atlas-legend" aria-label="谱系图例">
          {layout.lanes.map((lane) => (
            <span className="atlas-legend-item" key={lane.family}>
              <i style={{ background: FAMILY_COLOR[lane.family] }} aria-hidden="true" />
              {FAMILY_LABEL[lane.family]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
