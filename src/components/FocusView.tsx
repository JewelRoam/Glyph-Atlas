import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { scriptContextFor, writingSystems } from '../data';
import {
  FAMILY_COLOR,
  FAMILY_LABEL,
  ORIGIN_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  formatSpan,
} from '../lib/time';
import { GlyphField } from './GlyphField';
import { RelationRail } from './RelationRail';

export interface FocusLocation {
  scriptId: string;
}

const DIRECTION_LABEL: Record<string, string> = {
  ltr: '从左到右',
  rtl: '从右到左',
  ttb: '自上而下',
  boustrophedon: '牛耕式',
  mixed: '多向并用',
};

/**
 * 一个书写体系的节点页。
 *
 * 来源与去向分别占据中央字形场两侧；每一个相邻体系都是可进入的节点入口。
 * 页面不再区分总览与独立详情，进入节点后看到的就是完整体系。
 */
export function FocusView({
  location,
  onOpenScript,
}: {
  location: FocusLocation;
  onOpenScript: (scriptId: string) => void;
}) {
  const focusRef = useRef<HTMLElement>(null);
  const pendingScrollRef = useRef<number | null>(null);
  const framesRef = useRef<number[]>([]);
  const context = scriptContextFor(location.scriptId);

  useLayoutEffect(() => {
    const focus = focusRef.current;
    const frames = framesRef.current;
    const target = pendingScrollRef.current;
    if (!focus || target === null) return;

    // 关系列与字形场会在切换后的第一帧更新；等两轮布局完成再落位，避免
    // 浏览器先按旧高度钳制滚动值。
    focus.scrollTop = target;
    const first = requestAnimationFrame(() => {
      focus.scrollTop = target;
      const second = requestAnimationFrame(() => {
        focus.scrollTop = target;
        pendingScrollRef.current = null;
      });
      frames.push(second);
    });
    frames.push(first);

    return () => {
      for (const frame of frames.splice(0)) cancelAnimationFrame(frame);
    };
  }, [location.scriptId]);

  if (!context) return null;

  const { system } = context;
  const graphNumber = String(
    writingSystems.findIndex((item) => item.id === system.id) + 1,
  ).padStart(3, '0');
  const hasGlyphField = context.materials.materialReady;
  const openRelatedScript = (scriptId: string) => {
    pendingScrollRef.current = focusRef.current?.scrollTop ?? 0;
    onOpenScript(scriptId);
  };

  return (
    <article
      ref={focusRef}
      className="focus"
      style={{ '--family-color': FAMILY_COLOR[system.family] } as CSSProperties}
    >
      <header className="focus-head">
        <span className="focus-index" aria-hidden="true">
          {graphNumber}
        </span>

        <div className="focus-heading">
          <span className="focus-kicker">
            {FAMILY_LABEL[system.family]} · {TYPE_LABEL[system.type]} ·{' '}
            {ORIGIN_LABEL[system.origin]}
          </span>
          <h1>{system.nameZh}</h1>
          <p>{system.nameEn}</p>
        </div>

        <div className="focus-context">
          {system.note ? <p className="focus-summary">{system.note}</p> : null}
          <p className="focus-spec">
            <span>
              <b>状态</b>
              {STATUS_LABEL[system.status]}
            </span>
            <span>
              <b>方向</b>
              {DIRECTION_LABEL[system.direction ?? 'ltr']}
            </span>
          </p>
        </div>

        <dl className="focus-facts">
          <div>
            <dt>年代</dt>
            <dd>{formatSpan(system.dateFrom, system.dateTo)}</dd>
          </div>
          <div>
            <dt>发源地</dt>
            <dd>{system.region}</dd>
          </div>
          <div>
            <dt>使用地区</dt>
            <dd>{system.countries.join(' · ') || '—'}</dd>
          </div>
        </dl>
      </header>

      <div className={`focus-workbench ${hasGlyphField ? '' : 'without-glyph'}`}>
        <RelationRail
          side="parent"
          neighbors={context.graph.parentNeighbors}
          onOpen={openRelatedScript}
        />

        {hasGlyphField ? (
          <div className="focus-field-column">
            <GlyphField context={context} />
          </div>
        ) : null}

        <RelationRail
          side="child"
          neighbors={context.graph.childNeighbors}
          onOpen={openRelatedScript}
        />
      </div>
    </article>
  );
}
