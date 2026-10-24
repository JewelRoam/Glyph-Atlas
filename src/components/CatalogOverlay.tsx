import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { graphSystems, writingSystems } from '../data';
import { glyphSourceFor, imageFor } from '../data/glyphSources';
import { familyFor } from '../data/fontFallback';
import type { Family, Status } from '../data/types';
import { assetUrl } from '../lib/assets';
import { FAMILY_ORDER } from '../lib/layout';
import {
  FAMILY_COLOR,
  FAMILY_LABEL,
  ORIGIN_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  formatSpan,
} from '../lib/time';
import { FontGlyph, ImageGlyph } from './Glyph';

type StatusFilter = 'all' | 'living' | 'historical' | 'undeciphered';

const STATUS_FILTERS: { id: StatusFilter; label: string; test: (status: Status) => boolean }[] = [
  { id: 'all', label: '全部', test: () => true },
  {
    id: 'living',
    label: '今仍使用',
    test: (status) => status === 'living' || status === 'revived' || status === 'liturgical',
  },
  {
    id: 'historical',
    label: '历史文字',
    test: (status) => status === 'historical' || status === 'extinct',
  },
  { id: 'undeciphered', label: '未破译', test: (status) => status === 'undeciphered' },
];

function CatalogGlyph({ system }: { system: (typeof writingSystems)[number] }) {
  const source = glyphSourceFor(system);
  const sampleImage = system.sample ? imageFor(source, system.sample) : undefined;
  const plate = source.plates?.[0];
  const image = sampleImage ?? plate?.src;
  const family = familyFor(system.id, system.fontFamily);
  if (image) {
    return (
      <ImageGlyph
        src={assetUrl(image)}
        label={system.sample ?? system.nameZh}
        size={52}
        credit={sampleImage ? source.credit : plate?.credit}
      />
    );
  }
  return (
    <FontGlyph
      char={system.sample}
      fontFamily={family}
      size={42}
      color="var(--ink-strong)"
    />
  );
}

/** 覆盖在全图之上的馆藏检索层：按名称、国家与谱系检索，点选后进入记录页。 */
export function CatalogOverlay({
  onClose,
  onOpenScript,
}: {
  onClose: () => void;
  onOpenScript: (scriptId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<Family | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statusTest = STATUS_FILTERS.find((item) => item.id === status)!.test;
    const filtered = writingSystems.filter((system) => {
      if (family !== 'all' && system.family !== family) return false;
      if (!statusTest(system.status)) return false;
      if (!q) return true;
      const searchable = [
        system.nameZh,
        system.nameEn,
        system.region,
        ...(system.alias ?? []),
        ...system.countries,
        FAMILY_LABEL[system.family],
        TYPE_LABEL[system.type],
        ORIGIN_LABEL[system.origin],
        STATUS_LABEL[system.status],
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
    return [...filtered].sort((a, b) =>
      sort === 'date'
        ? a.dateFrom - b.dateFrom || a.nameZh.localeCompare(b.nameZh, 'zh')
        : a.nameZh.localeCompare(b.nameZh, 'zh'),
    );
  }, [family, query, sort, status]);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="catalog-layer" onMouseDown={closeOnBackdrop}>
      <div
        ref={dialogRef}
        className="catalog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-title"
        onKeyDown={onDialogKeyDown}
      >
        <header className="catalog-head">
          <div className="catalog-heading">
            <span className="catalog-kicker">
              全部馆藏 · {writingSystems.length} 条记录 · {graphSystems.length} 个书写体系
            </span>
            <h1 id="catalog-title">查找馆藏</h1>
          </div>
          <button className="catalog-close" onClick={onClose} aria-label="关闭查找">
            关闭 <span aria-hidden="true">Esc</span>
          </button>
        </header>

        <div className="catalog-search-row">
          <label className="catalog-search">
            <span className="sr-only">搜索名称、国家或谱系</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名称、英文名、国家、地区或谱系"
              autoComplete="off"
            />
          </label>
          <label className="catalog-sort">
            <span>排序</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as 'date' | 'name')}>
              <option value="date">按年代</option>
              <option value="name">按名称</option>
            </select>
          </label>
        </div>

        <div className="catalog-filters">
          <div className="filter-row" aria-label="按谱系筛选">
            <span className="filter-label">谱系</span>
            <div className="filter-options">
              <button
                className={family === 'all' ? 'active' : ''}
                onClick={() => setFamily('all')}
                aria-pressed={family === 'all'}
              >
                全部
              </button>
              {FAMILY_ORDER.map((item) => (
                <button
                  key={item}
                  className={family === item ? 'active' : ''}
                  onClick={() => setFamily(item)}
                  aria-pressed={family === item}
                  style={
                    family === item
                      ? { borderColor: FAMILY_COLOR[item], color: FAMILY_COLOR[item] }
                      : undefined
                  }
                >
                  <i style={{ background: FAMILY_COLOR[item] }} />
                  {FAMILY_LABEL[item]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row" aria-label="按状态筛选">
            <span className="filter-label">状态</span>
            <div className="filter-options">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.id}
                  className={status === item.id ? 'active' : ''}
                  onClick={() => setStatus(item.id)}
                  aria-pressed={status === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="catalog-result-bar" aria-live="polite">
          <span>
            <b>{rows.length}</b> 条馆藏
          </span>
          {(query || family !== 'all' || status !== 'all') && (
            <button
              onClick={() => {
                setQuery('');
                setFamily('all');
                setStatus('all');
                searchRef.current?.focus();
              }}
            >
              清除筛选
            </button>
          )}
        </div>

        <div className="catalog-results" role="list">
          {rows.map((system) => (
            <button
              className="catalog-card"
              key={system.id}
              role="listitem"
              onClick={() => onOpenScript(system.id)}
            >
              <span className="catalog-glyph">
                <CatalogGlyph system={system} />
              </span>
              <span className="catalog-card-copy">
                <span className="catalog-card-title">
                  <strong>{system.nameZh}</strong>
                  <em>{system.nameEn}</em>
                </span>
                <span className="catalog-card-meta">
                  <i style={{ background: FAMILY_COLOR[system.family] }} />
                  {FAMILY_LABEL[system.family]} · {TYPE_LABEL[system.type]} · {STATUS_LABEL[system.status]}
                </span>
                <span className="catalog-card-foot">
                  <span>{formatSpan(system.dateFrom, system.dateTo)}</span>
                  <span>{system.countries.join(' · ')}</span>
                </span>
              </span>
              <span className="catalog-card-enter" aria-hidden="true">→</span>
            </button>
          ))}
        </div>

        {!rows.length && (
          <div className="catalog-empty">
            <strong>没有匹配的馆藏记录</strong>
            <p>试试缩短名称，或清除谱系与状态筛选。</p>
          </div>
        )}
      </div>
    </div>
  );
}
