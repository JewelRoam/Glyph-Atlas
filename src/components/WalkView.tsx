import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lineages } from '../data';
import { scriptById } from '../data/writingSystems';
import type { GlyphStop, Lineage } from '../data/types';
import { FontGlyph, PathGlyph } from './Glyph';
import { interpolatePath, prepare, type PreparedGlyph } from '../lib/morph';
import { loadFont } from '../lib/fonts';
import { LINEAGE_MODE_HINT, LINEAGE_MODE_LABEL, formatSpan } from '../lib/time';

/**
 * 微观维度：沿一条血统轨道"往前走 / 往后走"。
 *
 * 中心舞台在两个相邻站点之间连续插值：
 *  - 两端都有矢量路径时 → 真·路径形变（点对点弧长插值）
 *  - 否则 → 平滑淡变 + 缩放平移（对任意文字可用）
 * 两侧按距离排布相邻站点，形成"街道"纵深感。
 */
export function WalkView() {
  const [lineageId, setLineageId] = useState(lineages[0].id);
  const lineage = lineages.find((l) => l.id === lineageId) ?? lineages[0];

  return (
    <div className="walk">
      <div className="walk-tabs">
        {lineages.map((l) => (
          <button
            key={l.id}
            className={l.id === lineageId ? 'active' : ''}
            aria-pressed={l.id === lineageId}
            onClick={() => setLineageId(l.id)}
          >
            {l.nameZh}
          </button>
        ))}
      </div>
      {/* key 让切轨道时整条街重新挂载：位置与播放状态自然归零，
          不需要在 effect 里手动重置状态。 */}
      <WalkTrack key={lineage.id} lineage={lineage} />
    </div>
  );
}

/** 一条轨道 = 一条街 */
function WalkTrack({ lineage }: { lineage: Lineage }) {
  const stops = lineage.stops;

  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const dragRef = useRef<{ x: number; p: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // 预加载这条轨道上所有站点用到的字体
  useEffect(() => {
    stops.forEach((s) => loadFont(scriptById[s.script]?.fontFamily));
  }, [stops]);

  const prepared = useMemo<(PreparedGlyph | null)[]>(
    () => stops.map((s) => (s.path ? prepare(s.path, 96) : null)),
    [stops],
  );

  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(stops.length - 1, v)),
    [stops.length],
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

  // 键盘左右
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setP((v) => clamp(Math.round(v) + 1));
      if (e.key === 'ArrowLeft') setP((v) => clamp(Math.round(v) - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clamp]);

  const i0 = Math.max(0, Math.min(stops.length - 1, Math.floor(p)));
  const i1 = Math.min(stops.length - 1, i0 + 1);
  const t = p - i0;
  const a = stops[i0];
  const b = stops[i1];

  const morphPath =
    prepared[i0] && prepared[i1]
      ? interpolatePath(prepared[i0]!, prepared[i1]!, t)
      : null;

  const dominant = t < 0.5 ? a : b;
  const dominantScript = scriptById[dominant.script];
  const mode = lineage.mode ?? 'chain';

  /**
   * 残影：变形途中，把"你要去的那一站"（或"你刚离开的那一站"）
   * 淡淡地留在后面。它让过渡看起来像在同一个空间里移动，
   * 而不是两张图交叉淡出——这正是街道感的关键。
   */
  const ghostStop = t < 0.5 ? b : a;
  const ghostOpacity = Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) * 0.2;
  const showGhost = ghostOpacity > 0.004 && (ghostStop.path || ghostStop.char);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setP((v) => clamp(v + Math.sign(e.deltaY) * 0.35));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, p };
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

  /** 侧边站点：按与当前位置的距离决定尺寸与透明度 */
  const sideStop = (idx: number, offset: number) => {
    const s = stops[idx];
    if (!s) return null;
    const dist = Math.abs(idx - p);
    const size = 116 - Math.min(dist, 3) * 26;
    const opacity = Math.max(0, 0.55 - (dist - 1) * 0.2);
    return (
      <div
        className="walk-side"
        key={idx}
        style={{
          transform: `translate(calc(-50% + ${offset * 200}px), -50%) scale(${size / 116})`,
          opacity,
        }}
        onClick={() => setP(idx)}
      >
        <StopGlyph stop={s} size={116} />
      </div>
    );
  };

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
        <div className="walk-halo" />

        {showGhost && (
          <div
            className={`walk-ghost ${ghostStop.path ? '' : 'font-ghost'}`}
            style={{ opacity: ghostOpacity }}
          >
            <StopGlyph stop={ghostStop} size={260} />
          </div>
        )}

        <div className="walk-side-layer">
          {sideStop(i0 - 2, -2)}
          {sideStop(i0 - 1, -1)}
          {sideStop(i1 + 1, 1)}
          {sideStop(i1 + 2, 2)}
        </div>

        <div className="walk-center">
          {morphPath ? (
            <PathGlyph d={morphPath} size={260} color="var(--ink-strong)" />
          ) : (
            <div className="walk-fade">
              <span style={{ opacity: 1 - t }}>
                <StopGlyph stop={a} size={260} />
              </span>
              <span style={{ opacity: t }}>
                <StopGlyph stop={b} size={260} />
              </span>
            </div>
          )}
        </div>

        <div className="walk-caption">
          <div className="walk-caption-title">{dominant.label ?? dominantScript?.nameZh}</div>
          <div className="walk-caption-sub">
            {dominantScript?.nameZh}
            {dominant.phonetic ? ` · /${dominant.phonetic}/` : ''}
            {dominantScript ? ` · ${formatSpan(dominantScript.dateFrom, dominantScript.dateTo)}` : ''}
          </div>
          {dominantScript && (
            <div className="walk-caption-country">
              {dominantScript.countries.join(' · ')}
            </div>
          )}
        </div>
      </div>

      <div className="walk-controls">
        <button onClick={() => setP((v) => clamp(Math.round(v) - 1))} aria-label="上一个">
          ←
        </button>
        <button
          className={`play ${playing ? 'on' : ''}`}
          onClick={() => setPlaying((v) => !v)}
          aria-pressed={playing}
        >
          {playing ? '暂停' : '播放演进'}
        </button>
        <button onClick={() => setP((v) => clamp(Math.round(v) + 1))} aria-label="下一个">
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
            setP(Number(e.target.value));
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
                setP(i);
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

/** 单个站点字形：有条路径用路径，否则用字体 */
function StopGlyph({ stop, size }: { stop: GlyphStop; size: number }) {
  const script = scriptById[stop.script];
  if (stop.path) return <PathGlyph d={stop.path} size={size} color="var(--ink-strong)" />;
  return (
    <FontGlyph
      char={stop.char ?? script?.sample}
      fontFamily={script?.fontFamily}
      size={size}
      color="var(--ink-strong)"
    />
  );
}
