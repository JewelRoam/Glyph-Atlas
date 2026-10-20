import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { GlyphPlate } from '../data/glyphPlates';
import type { WritingSystem } from '../data/types';
import { glyphSets } from '../data/glyphSets';
import { glyphSourceFor, imageFor } from '../data/glyphSources';
import { nonLetterKind } from '../data/letterSlots';
import { familyFor } from '../data/fontFallback';
import { coverageOf, hasCoverage } from '../lib/coverage';
import { assetUrl } from '../lib/assets';
import { FontGlyph, ImageGlyph } from './Glyph';

/** 语素文字取代表字，不追求把一个包含数万字的字库铺满页面。 */
const LOGOGRAPHIC_PREVIEW = 28;

function searchLinks(system: WritingSystem, family?: string) {
  const named = family
    ? `https://fonts.google.com/?query=${encodeURIComponent(family)}`
    : null;
  const web = `https://www.google.com/search?q=${encodeURIComponent(
    `${system.nameZh} ${system.nameEn} 字体 字库`,
  )}`;
  return { named, web };
}

/**
 * 字形图版。
 *
 * 字母表、音节文字与元音附标文字默认铺开全部可靠字形；语素文字只取代表字。
 * 每一格必须有据可查：字体覆盖表说没有就留空，图片只画登记过授权与出处的素材，
 * 不以系统字体或现代书体冒充历史字形。
 */
export function GlyphBoard({ system }: { system: WritingSystem }) {
  const [zoom, setZoom] = useState<GlyphPlate | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoom(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const source = glyphSourceFor(system);
  const family = source.kind === 'font' ? source.family ?? familyFor(system.id) : undefined;
  const set = glyphSets[system.id];
  const raw = set?.chars.length ? set.chars : system.sample ? [system.sample] : [];
  const full = raw.filter((char) => {
    const kind = nonLetterKind(system.id, char);
    return kind !== 'symbol' && kind !== 'mark';
  });

  const covered = useMemo(
    () =>
      source.kind === 'font'
        ? full.filter((char) => coverageOf(family, char) !== 'no')
        : [],
    [family, full, source.kind],
  );
  const plates = useMemo(
    () => full.filter((char) => imageFor(source, char)),
    [full, source],
  );
  const imageOnlyChars = useMemo(() => {
    if (source.kind !== 'font') return [];
    const represented = new Set([...covered, ...plates]);
    return Object.keys(source.images ?? {}).filter((key) => !represented.has(key));
  }, [covered, plates, source]);

  const previewLimit =
    system.type === 'logographic' || system.type === 'logosyllabic'
      ? LOGOGRAPHIC_PREVIEW
      : Number.POSITIVE_INFINITY;
  const shown = covered.slice(0, previewLimit);
  const shownPlates = plates.slice(0, previewLimit);
  const shownImageOnly = imageOnlyChars.slice(0, previewLimit);

  const missing = full.length - covered.length;
  const fontUsable =
    source.kind === 'font' && (!family || hasCoverage(family) || covered.length > 0);
  const { named, web } = searchLinks(system, family);

  const compact =
    system.type === 'logographic' ||
    system.type === 'logosyllabic' ||
    system.type === 'undeciphered';
  const cell = compact ? 44 : 40;
  const glyphSize = compact ? 28 : 26;
  const plateOnly = Boolean(source.plates?.length) && !plates.length;

  const countText = plateOnly
    ? `${source.plates!.length} 幅图版`
    : source.kind === 'image'
      ? plates.length
        ? `${plates.length} 个字形图${missing ? `（另有 ${missing} 个字形未收）` : ''}`
        : '暂无字形样本'
      : !covered.length
        ? '暂无字形样本'
        : set?.source === 'manual'
          ? `${covered.length} 个示例${missing ? `（另有 ${missing} 个字形未收）` : ''}`
          : `${covered.length} 个字符${
              set && set.total > covered.length ? `（Unicode 共 ${set.total} 个）` : ''
            }`;

  return (
    <section className="detail-board">
      <header className="board-head">
        <span className="board-kicker">字形</span>
        <span className="board-count">{countText}</span>
      </header>

      {source.plates && source.plates.length > 0 && (
        <div className="plate-strip">
          {source.plates.map((plate) => (
            <figure className="plate" key={plate.src}>
              <button
                type="button"
                className="plate-open"
                onClick={() => setZoom(plate)}
                aria-label={`放大图版：${plate.caption}`}
                title="放大"
              >
                <img src={assetUrl(plate.src)} alt={plate.caption} loading="lazy" decoding="async" />
              </button>
              <figcaption>
                <span className="plate-caption">{plate.caption}</span>
                <span className="plate-credit">
                  {plate.credit} · {plate.license}
                </span>
                {plate.home ? (
                  <a href={plate.home} target="_blank" rel="noreferrer">
                    图版出处 ↗
                  </a>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {source.kind === 'image' && source.note && source.plates?.length ? (
        <p className="board-note">{source.note}</p>
      ) : null}

      {source.kind === 'image' && shownPlates.length > 0 && (
        <div className="glyph-grid" style={{ '--cell': `${cell}px` } as CSSProperties}>
          {shownPlates.map((char, index) => (
            <span className="glyph-cell" key={`${char}-${index}`} title={char}>
              <ImageGlyph
                src={imageFor(source, char)!}
                label={char}
                size={cell - 4}
                credit={source.credit}
              />
            </span>
          ))}
        </div>
      )}

      {source.kind === 'font' && (shown.length > 0 || shownImageOnly.length > 0) && (
        <div className="glyph-grid" style={{ '--cell': `${cell}px` } as CSSProperties}>
          {shown.map((char, index) => {
            const plate = imageFor(source, char);
            return (
              <span className="glyph-cell" key={`${char}-${index}`} title={char}>
                {plate ? (
                  <ImageGlyph src={plate} label={char} size={cell - 4} credit={source.credit} />
                ) : (
                  <FontGlyph char={char} fontFamily={family} size={glyphSize} />
                )}
              </span>
            );
          })}
          {shownImageOnly.map((key) => (
            <span className="glyph-cell" key={key} title={key}>
              <ImageGlyph
                src={source.images![key]}
                label={key}
                size={cell - 4}
                credit={source.credit}
              />
            </span>
          ))}
        </div>
      )}

      {source.kind === 'image' && !plates.length && !source.plates?.length && (
        <div className="board-empty">
          <p>{source.note ?? '这套文字的图片字形还在整理，字形位留空。'}</p>
        </div>
      )}

      {source.kind === 'none' && (
        <div className="board-empty">
          <p>{source.note ?? '这套文字暂时没有可靠的 Web 字体或授权明确的字形图，字形位留空。'}</p>
        </div>
      )}

      {source.kind === 'font' && !covered.length && !shownImageOnly.length && (
        <div className="board-empty">
          <p>{set?.note ?? '这款字库里没有可用的字形，字形位留空。'}</p>
        </div>
      )}

      {set?.note && covered.length > 0 && <p className="board-note">{set.note}</p>}

      {zoom
        ? createPortal(
            <div
              className="plate-viewer"
              role="dialog"
              aria-modal="true"
              aria-label={`${zoom.caption}（放大）`}
              onClick={() => setZoom(null)}
            >
              <figure className="plate-viewer-card" onClick={(event) => event.stopPropagation()}>
                <img src={assetUrl(zoom.src)} alt={zoom.caption} decoding="async" />
                <figcaption>
                  <span className="plate-caption">{zoom.caption}</span>
                  <span className="plate-credit">
                    {zoom.credit} · {zoom.license}
                  </span>
                  {zoom.home ? (
                    <a href={zoom.home} target="_blank" rel="noreferrer">
                      图版出处 ↗
                    </a>
                  ) : null}
                </figcaption>
              </figure>
              <button
                type="button"
                className="plate-viewer-close"
                onClick={() => setZoom(null)}
                aria-label="关闭放大的图版"
              >
                ✕
              </button>
            </div>,
            document.body,
          )
        : null}

      <footer className={`board-font ${fontUsable || source.kind === 'image' ? '' : 'missing'}`}>
        {source.kind === 'none' ? (
          <span>暂无可靠字形来源，不以现代字体顶替</span>
        ) : source.kind === 'image' ? (
          <>
            <span>
              {source.credit ?? '字形图'}
              {source.license ? ` · ${source.license}` : ''}
            </span>
            {source.home ? (
              <a href={source.home} target="_blank" rel="noreferrer">
                图版出处 ↗
              </a>
            ) : null}
          </>
        ) : fontUsable ? (
          <>
            <span>
              {source.credit ?? family}
              {source.license ? ` · ${source.license}` : ''}
            </span>
            {source.home ? (
              <a href={source.home} target="_blank" rel="noreferrer">
                字形来源 ↗
              </a>
            ) : null}
          </>
        ) : (
          <>
            <span>缺 Web 字体</span>
            <a href={named ?? web} target="_blank" rel="noreferrer">
              去搜这款字库 ↗
            </a>
          </>
        )}
      </footer>
    </section>
  );
}
