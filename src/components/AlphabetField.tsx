import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { letterMaps, sharedSlots, slotLabel } from '../data/letterSlots';
import { scriptById } from '../data/writingSystems';
import { familyFor } from '../data/fontFallback';
import { glyphSourceFor, imageFor } from '../data/glyphSources';
import { useAlphabetPaths } from '../lib/alphabetPaths';
import { interpolatePath, prepare, type PreparedGlyph } from '../lib/morph';
import { FontGlyph, ImageGlyph, PathGlyph } from './Glyph';

/**
 * 字母场 —— 把一整套字母表从一种文字连续变形到另一种文字。
 *
 * 站位由 src/data/letterSlots.ts 的同源槽位决定：同一个槽位在任何文字里都占
 * 同一格，所以在两种文字之间推拉时，每个字母都是"原地变形"成它的后代，
 * 而不是两个字随机交叉淡化。
 *
 * 只在一边出现的槽位，就是字母表的增与减：新字母从下方飞入，
 * 被淘汰的字母向上飞出并缩小消失。腓尼基 wāw 分出两支的情形会看到
 * 同一个祖形在两个格子里同时变形成希腊 Υ 与 Ϝ。
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const easeIn = (u: number) => u * u * u;

/** 整个字母场的错峰幅度：格子之间相差最多 15% 的进度，形成一道波浪 */
const SPREAD = 0.15;

/** 预处理过的轮廓按 glyph 缓存，避免每帧重新采样 */
const preparedCache = new Map<string, PreparedGlyph>();
function preparedPath(key: string, d: string): PreparedGlyph {
  let p = preparedCache.get(key);
  if (!p) {
    p = prepare(d, 48);
    preparedCache.set(key, p);
  }
  return p;
}

/** 某个字符的图片字形（没有可靠字体、改用图版的历史书体走这条） */
function plateFor(scriptId: string, char?: string): string | undefined {
  if (!char) return undefined;
  const system = scriptById[scriptId];
  if (!system) return undefined;
  return imageFor(glyphSourceFor(system), char);
}

function fontOf(scriptId: string): string | undefined {
  const system = scriptById[scriptId];
  return familyFor(scriptId, system?.fontFamily);
}

/** 一个字母：有轮廓就画轮廓，否则挂字体 */
function LetterGlyph({
  script,
  char,
  size,
  d,
  plate,
  pending,
  opacity,
  style,
}: {
  script: string;
  char: string;
  size: number;
  d?: string;
  /** 该字符的图版（没有可靠字体时使用；图版之间只能交叉淡变，不能形变） */
  plate?: string;
  /** 轮廓包还没到位：宁可画骨架，也不拿字体顶替 */
  pending?: boolean;
  opacity?: number;
  style?: CSSProperties;
}) {
  return (
    <span className="alpha-glyph" style={{ opacity, ...style }}>
      {plate ? (
        <ImageGlyph src={plate} label={char} size={size} />
      ) : d ? (
        <PathGlyph d={d} size={size} />
      ) : pending ? (
        <PendingGlyph size={size} />
      ) : (
        <FontGlyph char={char} fontFamily={fontOf(script)} size={Math.round(size * 0.92)} />
      )}
    </span>
  );
}

/** 轮廓包还没到位时的占位：一条静默的骨架，不画任何字形 */
function PendingGlyph({ size }: { size: number }) {
  return <span className="alpha-skeleton" style={{ width: size * 0.72, height: size * 0.18 }} />;
}

export function AlphabetField({ a, b, t }: { a: string; b: string; t: number }) {
  const paths = useAlphabetPaths();
  const slots = useMemo(() => sharedSlots(a, b), [a, b]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rectsRef = useRef(new Map<string, DOMRect>());
  const paintedRef = useRef(false);
  const ma = letterMaps[a] ?? {};
  const mb = letterMaps[b] ?? {};
  const slotKey = slots.join('|');

  /**
   * 一段轨道上的格子数会变（走到下一站时这一段的槽位增减），网格就会换行重排。
   * 直接重排会让整排字母"啪"地跳一下，所以这里按 FLIP 把每个格子从旧位置
   * 滑到新位置，连带网格高度一起过渡。
   */
  useLayoutEffect(() => {
    const grid = gridRef.current;
    const scroll = scrollRef.current;
    if (!grid || !scroll) return;

    const painted = paintedRef.current;
    const before = rectsRef.current;
    const after = new Map<string, DOMRect>();
    const moves: [HTMLElement, number, number][] = [];
    const fresh: HTMLElement[] = [];
    const cells = Array.from(grid.querySelectorAll<HTMLElement>('.alpha-cell'));

    for (const el of cells) {
      // 上一次还没跑完的补间先就地收尾，测量才不会把位移算两遍
      if (el.style.transform) {
        el.style.transition = 'none';
        el.style.transform = '';
      }
    }

    for (const el of cells) {
      const slot = el.dataset.slot ?? '';
      const rect = el.getBoundingClientRect();
      after.set(slot, rect);
      const old = before.get(slot);
      if (!old) {
        if (painted) fresh.push(el);
        continue;
      }
      const dx = old.left - rect.left;
      const dy = old.top - rect.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moves.push([el, dx, dy]);
    }

    rectsRef.current = after;
    paintedRef.current = true;

    const natural = grid.offsetHeight;
    const capped = Math.min(natural, 196);
    scroll.style.height = `${capped}px`;
    scroll.style.overflowY = natural > capped + 1 ? 'auto' : 'hidden';

    if (!painted || (!moves.length && !fresh.length)) return;

    for (const [el, dx, dy] of moves) {
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    for (const el of fresh) {
      el.style.transition = 'none';
      el.style.opacity = '0';
    }

    requestAnimationFrame(() => {
      for (const [el] of moves) {
        el.style.transition = 'transform 320ms cubic-bezier(.22,.68,.28,1), background 0.16s ease';
        el.style.transform = '';
      }
      for (const el of fresh) {
        el.style.transition = 'opacity 240ms ease, background 0.16s ease';
        el.style.opacity = '1';
      }
    });
  }, [slotKey]);

  if (!slots.length) return null;

  let added = 0;
  let lost = 0;
  let kept = 0;
  for (const slot of slots) {
    const ca = ma[slot];
    const cb = mb[slot];
    if (ca && cb) kept++;
    else if (cb) added++;
    else lost++;
  }

  const nameA = scriptById[a]?.nameZh ?? a;
  const nameB = scriptById[b]?.nameZh ?? b;

  // 同一种文字（轨道最后一站）只写名字，不写成"甲 → 甲"
  const heading = a === b ? nameA : `${nameA} → ${nameB}`;

  return (
    <section className="alpha-field" aria-label={`${nameA}到${nameB}的字母对照`}>
      <div className="alpha-head">
        <span className="alpha-title">
          字母全表
          <em>{heading}</em>
        </span>
        <span className="alpha-legend">
          同源 {kept}
          {added ? <b className="in">· 新增 {added}</b> : null}
          {lost ? <b className="out">· 消失 {lost}</b> : null}
        </span>
      </div>

      <div className="alpha-scroll" ref={scrollRef}>
        <div className="alpha-grid" ref={gridRef}>
          {slots.map((slot, i) => {
            const ca = ma[slot];
            const cb = mb[slot];
            const shift = slots.length > 1 ? (i / (slots.length - 1)) * SPREAD : 0;
            const local = clamp01((t - shift) / (1 - SPREAD));
            const label = slotLabel[slot] ?? slot;
            const da = ca ? paths?.[`${a}:${ca}`] : undefined;
            const db = cb ? paths?.[`${b}:${cb}`] : undefined;
            const plateA = plateFor(a, ca);
            const plateB = plateFor(b, cb);
            // 轮廓还没到位；有图版的字先画图版，其余画骨架
            const pending = !paths;

            let body;
            if (ca && cb) {
              const morph =
                da && db && !plateA && !plateB
                  ? interpolatePath(
                      preparedPath(`${a}:${ca}`, da),
                      preparedPath(`${b}:${cb}`, db),
                      local,
                    )
                  : null;
              if (morph) {
                body = <LetterGlyph script={a} char={ca} size={46} d={morph} />;
              } else {
                body = (
                  <>
                    <LetterGlyph
                      script={a}
                      char={ca}
                      size={46}
                      d={da}
                      plate={plateA}
                      pending={pending}
                      opacity={1 - local}
                    />
                    <LetterGlyph
                      script={b}
                      char={cb}
                      size={46}
                      d={db}
                      plate={plateB}
                      pending={pending}
                      opacity={local}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </>
                );
              }
            } else if (cb) {
              // 新字母：从下方飞入、放大到位
              const p = easeOut(local);
              body = (
                <LetterGlyph
                  script={b}
                  char={cb}
                  size={46}
                  d={db}
                  plate={plateB}
                  pending={pending}
                  opacity={p}
                  style={{
                    transform: `translateY(${(1 - p) * 22}px) scale(${0.55 + 0.45 * p})`,
                  }}
                />
              );
            } else if (ca) {
              // 被淘汰的字母：向上飞出
              const q = 1 - easeIn(local);
              body = (
                <LetterGlyph
                  script={a}
                  char={ca}
                  size={46}
                  d={da}
                  plate={plateA}
                  pending={pending}
                  opacity={q}
                  style={{
                    transform: `translateY(${-(1 - q) * 22}px) scale(${0.55 + 0.45 * q})`,
                  }}
                />
              );
            }

            return (
              <span
                className="alpha-cell"
                key={slot}
                data-slot={slot}
                title={`${label}${ca && cb ? `：${ca} → ${cb}` : cb ? `：新增 ${cb}` : `：${ca} 不再沿用`}`}
              >
                {body}
              </span>
            );
          })}
        </div>
      </div>

      <p className="alpha-note">
        格子按"同源槽位"排列，不是各自字母表的书写顺序。
        {added || lost ? '只在一边出现的格子就是字母表的增删：它们会飞入或飞出。' : ''}
      </p>
    </section>
  );
}
