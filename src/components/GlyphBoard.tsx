import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { GlyphPlate } from '../data/glyphPlates';
import type { WritingSystem } from '../data/types';
import { glyphSets } from '../data/glyphSets';
import { glyphSourceFor, imageFor } from '../data/glyphSources';
import { nonLetterKind } from '../data/letterSlots';
import { coverageOf, hasCoverage } from '../lib/coverage';
import { assetUrl } from '../lib/assets';
import { FontGlyph, ImageGlyph } from './Glyph';

/** 折叠状态下先铺这么多，够看出这款文字的骨架 */
const PREVIEW = 48;
/** 语素文字的字符本来就不该铺满一屏，给一个更小的上限 */
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
 * 字形样本板。
 *
 * 详情面板里只有一枚放大的示例字时，读不出这套文字长什么样；这里铺一张字表：
 * 字母表把 Unicode 收录的字母全铺出来（可展开），语素文字只给少量代表字。
 *
 * 每一格都必须有据可查：
 *  · 字体来源 —— 覆盖表说"字库里没有"就留空，绝不回退到系统字体；
 *  · 图片来源 —— 只有登记过授权与出处的图片才画，其余留空。
 * 甲骨文、小篆被画成宋体、楷体，隶书被画成黑体，都是"悄悄回退"造成的，
 * 所以这里宁可空着。
 */
export function GlyphBoard({ system }: { system: WritingSystem }) {
  const [expanded, setExpanded] = useState(false);
  /** 放大的图版：整幅字表的图往往又长又密，缩在侧栏里读不出笔形 */
  const [zoom, setZoom] = useState<GlyphPlate | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const source = glyphSourceFor(system);
  const family = source.kind === 'font' ? source.family ?? system.fontFamily : undefined;
  const set = glyphSets[system.id];
  const raw = set?.chars.length ? set.chars : system.sample ? [system.sample] : [];
  // 符号（OM、表词符号）与记号（叠字、长音、标调）不是字母，不摆进字表；
  // 词尾形这类异体是同一个字母的另一种写法，留在字表里当字形样本
  const full = raw.filter((c) => {
    const kind = nonLetterKind(system.id, c);
    return kind !== 'symbol' && kind !== 'mark';
  });

  // 覆盖表说"有"的才算数；font 来源之外（图片 / 留空）一格都不摆
  const covered = source.kind === 'font' ? full.filter((c) => coverageOf(family, c) !== 'no') : [];
  const missing = full.length - covered.length;
  const fontUsable = source.kind === 'font' && (!family || hasCoverage(family) || covered.length > 0);

  // 图片字形：只有 images 里登记过的字才画
  const plates = full.filter((c) => imageFor(source, c));
  const previewLimit =
    system.type === 'logographic' || system.type === 'logosyllabic' ? LOGOGRAPHIC_PREVIEW : PREVIEW;
  const shown = expanded ? covered : covered.slice(0, previewLimit);
  const shownPlates = expanded ? plates : plates.slice(0, previewLimit);
  const { named, web } = searchLinks(system, family);

  const isSyllabic =
    system.type === 'logographic' || system.type === 'logosyllabic' || system.type === 'undeciphered';
  const cell = isSyllabic ? 42 : 36;
  const size = isSyllabic ? 28 : 24;

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
      <div className="board-head">
        <h3>{source.kind === 'image' ? '字形图版' : '字形样本'}</h3>
        <span className="board-count">{countText}</span>
      </div>

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

      {source.kind === 'image' && plates.length > 0 && (
        <>
          <div className="glyph-grid" style={{ '--cell': `${cell}px` } as CSSProperties}>
            {shownPlates.map((c, i) => (
              <span className="glyph-cell" key={`${c}-${i}`} title={c}>
                <ImageGlyph
                  src={imageFor(source, c)!}
                  label={c}
                  size={cell - 4}
                  credit={source.credit}
                />
              </span>
            ))}
          </div>
          {plates.length > previewLimit && !expanded && (
            <button className="board-more" onClick={() => setExpanded(true)}>
              展开全部 {plates.length} 个
            </button>
          )}
        </>
      )}

      {source.kind === 'font' && covered.length > 0 && (
        <>
          <div className="glyph-grid" style={{ '--cell': `${cell}px` } as CSSProperties}>
            {shown.map((c, i) => {
              const plate = imageFor(source, c);
              return (
                <span className="glyph-cell" key={`${c}-${i}`} title={c}>
                  {plate ? (
                    <ImageGlyph src={plate} label={c} size={cell - 4} credit={source.credit} />
                  ) : (
                    <FontGlyph char={c} fontFamily={family} size={size} />
                  )}
                </span>
              );
            })}
          </div>
          {covered.length > previewLimit && !expanded && (
            <button className="board-more" onClick={() => setExpanded(true)}>
              展开全部 {covered.length} 个
            </button>
          )}
        </>
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

      {source.kind === 'font' && !covered.length && (
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
              <figure className="plate-viewer-card" onClick={(e) => e.stopPropagation()}>
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

      <div className={`board-font ${fontUsable || source.kind === 'image' ? '' : 'missing'}`}>
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
      </div>
    </section>
  );
}
