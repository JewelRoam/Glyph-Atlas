import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { lineages } from '../data';
import { glyphPaths } from '../data/glyphPaths';
import { scriptById } from '../data/writingSystems';
import type { CSSProperties } from 'react';
import type { GlyphStop, Lineage } from '../data/types';
import { FontGlyph, ImageGlyph, PathGlyph } from './Glyph';
import { AlphabetField } from './AlphabetField';
import { glyphSourceFor, imageFor } from '../data/glyphSources';
import { hasRoster } from '../data/letterSlots';
import { familyFor } from '../data/fontFallback';
import { preloadAlphabetGroup, preloadAlphabetPaths } from '../lib/alphabetPaths';
import { interpolatePath, prepare, type PreparedGlyph } from '../lib/morph';
import { loadFont } from '../lib/fonts';
import { LINEAGE_MODE_HINT, LINEAGE_MODE_LABEL, formatSpan } from '../lib/time';

/** 站点轮廓：优先用轨道里的手绘 path，否则查字体生成的轮廓表。 */
function resolveGlyphPath(stop: GlyphStop): string | null {
  if (stop.path) return stop.path;
  if (!stop.char) return null;
  return glyphPaths[`${stop.script}:${stop.char}`] ?? null;
}

/** 换轨道的交叉淡变时长：与轨道内的补间同量级，切换不会显得突兀 */
const SWAP_MS = 420;

/** 展签带高度：与 CSS 的 --walk-cap 保持一致，用来给中央字形换算可用高度 */
const CAPTION_BAND = 88;

/**
 * 展签 / 残影的交叉淡变半宽：t 走到 0.5 前后各 0.16 的窗口里换脸。
 *
 * 中央字形是连续形变的，展签却只有"这一站"和"下一站"两份文字。之前按
 * t < 0.5 一刀切，字形还在半路，底下的字名先跳了；给一个窗口，两份文字
 * 跟着 t 交叉淡变，换脸就落在形变的节奏上。
 */
const CAP_FADE = 0.16;

/**
 * 展签换脸时的纵向错位：旧的一份往上走、新的一份从下面升上来，
 * 换内容的那一下就有"同一块牌子换了张脸"的方向感，而不是原地闪一下。
 */
const CAP_SHIFT = 16;

/** 侧边街道能看到多远：以"离当前位置的站数"计，收在 ±3.8 站以内 */
const SIDE_REACH = 3.8;
/** 侧边每站之间的横向间距 */
const SIDE_GAP = 200;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 中央字形的上限；实际字号由舞台高度决定，字母场铺开时自动缩小 */
const GLYPH_MAX = 260;

/**
 * 微观维度：沿一条血统轨道"往前走 / 往后走"。
 *
 * 中心舞台在两个相邻站点之间连续插值：
 *  - 两端都有矢量路径时 → 真·路径形变（点对点弧长插值）
 *  - 否则 → 平滑淡变 + 缩放平移（对任意文字可用）
 * 两侧按距离排布相邻站点，形成"街道"纵深感。
 *
 * 顶部标签切换轨道时两条街交叉淡变；key 让新轨道整条街重新挂载：
 * 位置与播放状态自然归零，不需要在 effect 里手动重置状态。
 */
export function WalkView() {
  const [lineageId, setLineageId] = useState(lineages[0].id);
  // 换轨道时保留上一条街一小会儿，两条叠着交叉淡变；直接换 key 会让整块
  // 内容硬切，所以这里自己管一份"正在离开的轨道"。
  const [leaving, setLeaving] = useState<{ id: string; dir: 1 | -1 } | null>(null);
  const [arriving, setArriving] = useState(false);
  const swapTimer = useRef<number | null>(null);

  const lineage = lineages.find((l) => l.id === lineageId) ?? lineages[0];
  const leavingLineage = leaving ? lineages.find((l) => l.id === leaving.id) : undefined;
  const dir = leaving?.dir ?? 1;

  // 进 MICRO 先把闪米特—希腊那条线（core 包）拉起来，别等字母场挂载才请求；
  // 鼠标移到某条轨道标签上时，再顺手预取那条轨道要用的包（婆罗米系在另一包里）
  useEffect(() => {
    preloadAlphabetGroup('core');
  }, []);

  useEffect(() => () => {
    if (swapTimer.current !== null) window.clearTimeout(swapTimer.current);
  }, []);

  /** 切轨道：旧轨道滑出、新轨道滑入，交错进行 */
  const selectLineage = useCallback(
    (nextId: string) => {
      if (nextId === lineageId) return;
      const from = lineages.findIndex((l) => l.id === lineageId);
      const to = lineages.findIndex((l) => l.id === nextId);
      if (swapTimer.current !== null) window.clearTimeout(swapTimer.current);
      setLeaving((prev) => ({
        // 上一次的交叉淡变还没跑完就又点了一下：沿用最初那条正在离开的街，
        // 免得中间态一闪而过
        id: prev ? prev.id : lineageId,
        dir: to >= from ? 1 : -1,
      }));
      setArriving(true);
      setLineageId(nextId);
      swapTimer.current = window.setTimeout(() => {
        setLeaving(null);
        setArriving(false);
        swapTimer.current = null;
      }, SWAP_MS);
    },
    [lineageId],
  );

  return (
    <div className="walk">
      <div className="walk-tabs">
        {lineages.map((l) => (
          <button
            key={l.id}
            className={l.id === lineageId ? 'active' : ''}
            aria-pressed={l.id === lineageId}
            onMouseEnter={() => preloadAlphabetPaths(l.stops.map((s) => s.script))}
            onFocus={() => preloadAlphabetPaths(l.stops.map((s) => s.script))}
            onClick={() => selectLineage(l.id)}
          >
            {l.nameZh}
          </button>
        ))}
      </div>
      <div
        className="walk-swap"
        data-swapping={arriving ? 'on' : 'off'}
        data-dir={dir === 1 ? 'right' : 'left'}
      >
        {leavingLineage && (
          <div className="walk-layer walk-layer-leaving" aria-hidden="true">
            <WalkTrack lineage={leavingLineage} interactive={false} />
          </div>
        )}
        <div className="walk-layer walk-layer-arriving" key={lineage.id}>
          <WalkTrack lineage={lineage} />
        </div>
      </div>
    </div>
  );
}

/** 一条轨道 = 一条街。interactive=false 用于正在淡出的旧街：只保留画面，
 *  不再抢方向键。 */
function WalkTrack({ lineage, interactive = true }: { lineage: Lineage; interactive?: boolean }) {
  const stops = lineage.stops;

  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const dragRef = useRef<{ x: number; p: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** 位置的最新值：动画与手势互相打断时都要读它 */
  const pRef = useRef(p);
  const animRef = useRef<number | null>(null);
  /** 正在滑向的那一站：补间途中再点左右，以它为准往前/往后，目标不会来回抖 */
  const targetRef = useRef(p);

  useEffect(() => {
    pRef.current = p;
  }, [p]);

  // 预加载这条轨道上所有站点用到的字体
  useEffect(() => {
    stops.forEach((s) => loadFont(scriptById[s.script]?.fontFamily));
  }, [stops]);

  const prepared = useMemo<(PreparedGlyph | null)[]>(
    () =>
      stops.map((s) => {
        const d = resolveGlyphPath(s);
        return d ? prepare(d, 96) : null;
      }),
    [stops],
  );

  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(stops.length - 1, v)),
    [stops.length],
  );

  /** 停掉正在跑的补间 */
  const stopGlide = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  useEffect(() => stopGlide, [stopGlide]);

  /**
   * 平滑滑到某一站。
   *
   * 左右箭头、侧边站点、底部刻度都用它，这样"前进一站"和拖动滚轮是同一套
   * 形变过程：中间态一直在算，而不是瞬间跳到下一格。
   */
  const glideTo = useCallback(
    (target: number) => {
      stopGlide();
      const from = pRef.current;
      const to = clamp(target);
      targetRef.current = to;
      const dist = Math.abs(to - from);
      if (dist < 0.001) {
        setP(to);
        return;
      }
      const ms = Math.min(1100, 300 + dist * 320);
      const start = performance.now();
      const step = (now: number) => {
        const u = Math.min(1, (now - start) / ms);
        const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        setP(from + (to - from) * e);
        animRef.current = u < 1 ? requestAnimationFrame(step) : null;
      };
      animRef.current = requestAnimationFrame(step);
    },
    [clamp, stopGlide],
  );

  /**
   * 往前走 / 往后走一站。
   *
   * 补间途中再点一次，基准是"当前要去的那一站"而不是当前画面位置：连点三下就是
   * 连走三站，中途改向也从那一站折回，不会因为画面还在半路而原地抖一下。
   */
  const stepBy = useCallback(
    (dir: 1 | -1) => {
      const base = animRef.current !== null ? targetRef.current : pRef.current;
      const next = clamp(
        dir > 0 ? Math.floor(base + 1e-6) + 1 : Math.ceil(base - 1e-6) - 1,
      );
      if (next === base) return;
      setPlaying(false);
      glideTo(next);
    },
    [clamp, glideTo],
  );

  /** 手势与滑杆：立刻跟手，同时取消补间 */
  const setDirect = useCallback(
    (next: number | ((v: number) => number)) => {
      stopGlide();
      setP((prev) => clamp(typeof next === 'function' ? next(prev) : next));
    },
    [clamp, stopGlide],
  );

  // 播放
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setP((prev) => {
        const next = prev + dt * 0.55;
        return next >= stops.length - 1 ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, stops.length]);

  // 键盘左右：同样走补间，走一步就是一整套形变
  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // 焦点在滑杆/输入框里时不抢方向键
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBy(e.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive, stepBy]);

  /**
   * 舞台高度决定中央字形的大小。
   *
   * 展签在底部独占一条带（CSS 的 --walk-cap），字形只能在这条带之上居中；
   * 一旦字母场把舞台压矮，还用固定的 260px 画字，字形就会盖住展签。所以这里
   * 按实测高度算字号，字号始终落在展签带以上。
   */
  const [stageBox, setStageBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setStageBox((prev) =>
        Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1
          ? prev
          : { w: r.width, h: r.height },
      );
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const glyphSize = useMemo(() => {
    // 还没量到宽度（首帧之前）：先按上限画，layout effect 会在绘制前纠正
    if (!stageBox.w) return GLYPH_MAX;
    const byHeight = stageBox.h - CAPTION_BAND - 10;
    const byWidth = stageBox.w * 0.3;
    return Math.round(Math.max(40, Math.min(GLYPH_MAX, byHeight, byWidth)));
  }, [stageBox]);

  /** 贴住字形底缘的那条基线：字形缩小时它跟着往上走，不会掉进展签里 */
  const baselineGap = useMemo(() => {
    const centerH = Math.max(0, stageBox.h - CAPTION_BAND);
    return Math.round(Math.max(6, (centerH - glyphSize) / 2 + 6));
  }, [stageBox.h, glyphSize]);

  const i0 = Math.max(0, Math.min(stops.length - 1, Math.floor(p)));
  const i1 = Math.min(stops.length - 1, i0 + 1);
  const t = p - i0;
  const a = stops[i0];
  const b = stops[i1];

  const morphPath =
    prepared[i0] && prepared[i1]
      ? interpolatePath(prepared[i0]!, prepared[i1]!, t)
      : null;

  const mode = lineage.mode ?? 'chain';

  /**
   * 展签从"这一站"换到"下一站"的进度：0 = 完全是 a，1 = 完全是 b。
   * 两份展签都挂在舞台上，靠这个因子交叉淡变，字名不会在形变半路硬跳。
   */
  const capB = clamp01((t - (0.5 - CAP_FADE)) / (2 * CAP_FADE));
  /**
   * 两份展签的浓淡：旧的先淡走，新的再淡上来。
   *
   * 展签是三行中文，两份各占五成、叠在原处时正中间会糊成一团认不出的字。
   * 所以这里不做对称的交叉，改成接力：旧的一份在 `capB` 过半之前就淡到几乎
   * 看不见，新的一份过半之后才起来，只在过半那一线交叠出两层很淡的影子。
   * 这样既不会糊字，也不会在中间留下一条空白的展签带。
   */
  const capAlpha = clamp01((0.52 - capB) / CAP_FADE);
  const capBeta = clamp01((capB - 0.48) / CAP_FADE);

  /**
   * 残影：变形途中，把"你要去的那一站"（或"你刚离开的那一站"）
   * 淡淡地留在后面。它让过渡看起来像在同一个空间里移动，
   * 而不是两张图交叉淡出——这正是街道感的关键。
   *
   * 残影同样分两份：t 小的时候留 b（要去的那一站），t 大的时候留 a
   * （刚离开的那一站），中间跟着 capB 交叉淡变。之前按 t < 0.5 换形状，
   * 而残影最亮的时候正好是 t = 0.5，那一下虚线轮廓跳得很明显。
   */
  const ghostPeak = Math.sin(Math.PI * clamp01(t)) * 0.2;
  const ghostAlphaB = ghostPeak * (1 - capB);
  const ghostAlphaA = ghostPeak * capB;
  const ghostPathA = resolveGlyphPath(a);
  const ghostPathB = resolveGlyphPath(b);
  const showGhostA = ghostAlphaA > 0.004 && (ghostPathA || a.char);
  const showGhostB = ghostAlphaB > 0.004 && (ghostPathB || b.char);

  /**
   * 这一段轨道能不能铺字母场：任意一站有字母表就铺（见 data/letterSlots.ts）。
   *
   * 只有一边有字母表时，对面按"整表未出现 / 已消失"处理：那一家的字母会成批
   * 飞入或飞出。语素文字（汉字、圣书体）没有字母表，仍然只显示单字形的街景。
   */
  const alphabetPair = useMemo(() => {
    const sa = a.script;
    const sb = b.script;
    if (sa === sb) return hasRoster(sa) ? { a: sa, b: sb, t: 0 } : null;
    if (!hasRoster(sa) && !hasRoster(sb)) return null;
    return { a: sa, b: sb, t };
  }, [a.script, b.script, t]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setPlaying(false);
    setDirect((v) => v + Math.sign(e.deltaY) * 0.35);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    stopGlide();
    dragRef.current = { x: e.clientX, p: pRef.current };
    setPlaying(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    setP(clamp(d.p - dx / 160));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  /**
   * 侧边站点：站位只由"它离当前位置有多远"决定，是连续量（i - p）。
   *
   * 之前按 i0 / i1 的固定偏移摆（-2 -1 +1 +2）：跨过整数站时，同一站会从
   * +2 挪到 +1，整排街道像被人推了一把，还凭空少掉紧邻的那一站。改成按
   * 真实距离连续排，街道就跟着往前走；正在中央形变的那两站（离得最近）
   * 淡出，免得一个字母在中央和街边同时出现。
   */
  const sideStops: { stop: GlyphStop; idx: number; offset: number }[] = [];
  for (let i = Math.floor(p - SIDE_REACH); i <= Math.ceil(p + SIDE_REACH); i += 1) {
    const stop = stops[i];
    if (!stop) continue;
    const offset = i - p;
    if (Math.abs(offset) > SIDE_REACH) continue;
    sideStops.push({ stop, idx: i, offset });
  }

  return (
    <>
      <div className="walk-meta">
        <span className="walk-mode" title={LINEAGE_MODE_HINT[mode]}>
          {LINEAGE_MODE_LABEL[mode]}
        </span>
        <p className="walk-desc">{lineage.description}</p>
      </div>

      <div
        className="walk-stage"
        ref={stageRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="walk-halo" style={{ '--walk-halo': `${Math.round(glyphSize * 1.6)}px` } as CSSProperties} />

        {showGhostB && (
          <div
            className={`walk-ghost ${ghostPathB ? '' : 'font-ghost'}`}
            style={{ opacity: ghostAlphaB }}
          >
            <StopGlyph stop={b} size={glyphSize} />
          </div>
        )}
        {showGhostA && (
          <div
            className={`walk-ghost ${ghostPathA ? '' : 'font-ghost'}`}
            style={{ opacity: ghostAlphaA }}
          >
            <StopGlyph stop={a} size={glyphSize} />
          </div>
        )}

        <div className="walk-side-layer">
          {sideStops.map(({ stop, idx, offset }) => {
            const near = Math.abs(offset);
            // 中央正在形变的那两站淡出：离得越近越淡，到 0.58 站以内完全让位
            const nearFade = clamp01((near - 0.58) / 0.32);
            const size = 116 - Math.min(near, 3) * 26;
            const opacity = Math.max(0, 0.55 - (near - 1) * 0.2) * nearFade;
            return (
              <div
                className="walk-side"
                key={idx}
                style={{
                  transform: `translate(calc(-50% + ${offset * SIDE_GAP}px), -50%) scale(${size / 116})`,
                  opacity,
                }}
                onClick={() => {
                  setPlaying(false);
                  glideTo(idx);
                }}
              >
                <StopGlyph stop={stop} size={116} />
              </div>
            );
          })}
        </div>

        <div
          className="walk-center"
          style={
            {
              '--walk-baseline-gap': `${baselineGap}px`,
              '--walk-baseline-w': `${Math.round(Math.min(300, glyphSize * 1.15))}px`,
            } as CSSProperties
          }
        >
          {morphPath ? (
            <PathGlyph d={morphPath} size={glyphSize} color="var(--ink-strong)" />
          ) : (
            <div className="walk-fade">
              <span style={{ opacity: 1 - t }}>
                <StopGlyph stop={a} size={glyphSize} />
              </span>
              <span style={{ opacity: t }}>
                <StopGlyph stop={b} size={glyphSize} />
              </span>
            </div>
          )}
        </div>

        <div className="walk-caption">
          <div
            className="walk-caption-face"
            style={{ opacity: capAlpha, transform: `translateY(${-CAP_SHIFT * capB}px)` }}
          >
            <StopCaption stop={a} />
          </div>
          <div
            className="walk-caption-face"
            style={{ opacity: capBeta, transform: `translateY(${CAP_SHIFT * (1 - capB)}px)` }}
          >
            <StopCaption stop={b} />
          </div>
        </div>
      </div>

      {/* 两边都是字母表性质的文字时，铺开一整套字母做形变对照 */}
      {alphabetPair && <AlphabetField a={alphabetPair.a} b={alphabetPair.b} t={alphabetPair.t} />}

      <div className="walk-controls">
        <button onClick={() => stepBy(-1)} aria-label="上一个">
          ←
        </button>
        <button
          className={`play ${playing ? 'on' : ''}`}
          onClick={() => {
            stopGlide();
            setPlaying((v) => !v);
          }}
          aria-pressed={playing}
        >
          {playing ? '暂停' : '播放演进'}
        </button>
        <button onClick={() => stepBy(1)} aria-label="下一个">
          →
        </button>
      </div>

      <div className="walk-street">
        <input
          type="range"
          min={0}
          max={Math.max(0, stops.length - 1)}
          step={0.01}
          value={p}
          onChange={(e) => {
            setPlaying(false);
            setDirect(Number(e.target.value));
          }}
        />
        <div className="walk-markers">
          {stops.map((s, i) => (
            <button
              key={i}
              className={Math.round(p) === i ? 'active' : ''}
              style={{ left: `${(i / Math.max(1, stops.length - 1)) * 100}%` }}
              title={s.label ?? scriptById[s.script]?.nameZh}
              onClick={() => {
                setPlaying(false);
                glideTo(i);
              }}
            >
              <StopGlyph stop={s} size={34} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * 单个站点的展签：站名 + 文字名 + 音值 + 年代 + 今用国家。
 *
 * 拆出来是因为展签要挂两份（这一站、下一站），跟着形变交叉淡变；
 * 站与站之间只是同一套排版换内容。
 */
function StopCaption({ stop }: { stop: GlyphStop }) {
  const script = scriptById[stop.script];
  return (
    <>
      <div className="walk-caption-title">{stop.label ?? script?.nameZh}</div>
      <div className="walk-caption-sub">
        {script?.nameZh}
        {stop.phonetic ? ` · /${stop.phonetic}/` : ''}
        {script ? ` · ${formatSpan(script.dateFrom, script.dateTo)}` : ''}
      </div>
      {script && <div className="walk-caption-country">{script.countries.join(' · ')}</div>}
    </>
  );
}

/**
 * 单个站点字形：有条路径走路径 → 有图版走图版 → 最后才用字体。
 * 历史书体（隶书、僧侣体、世俗体）没有正确字体，只能用图版或留空。
 */
function StopGlyph({ stop, size }: { stop: GlyphStop; size: number }) {
  const script = scriptById[stop.script];
  const d = resolveGlyphPath(stop);
  if (d) return <PathGlyph d={d} size={size} color="var(--ink-strong)" />;
  const char = stop.char ?? script?.sample;
  const plate = script ? imageFor(glyphSourceFor(script), char ?? '') : undefined;
  if (plate) return <ImageGlyph src={plate} label={char} size={size} />;
  return (
    <FontGlyph
      char={char}
      fontFamily={familyFor(stop.script, script?.fontFamily)}
      size={size}
      color="var(--ink-strong)"
    />
  );
}
