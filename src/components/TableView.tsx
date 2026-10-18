import { useMemo, useState } from 'react';
import { writingSystems } from '../data';
import type { Family, WritingSystem } from '../data/types';
import { FontGlyph } from './Glyph';
import {
  FAMILY_COLOR,
  FAMILY_LABEL,
  ORIGIN_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  formatSpan,
} from '../lib/time';
import { FAMILY_ORDER } from '../lib/layout';

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

/** 对照表：可按谱系筛选、按年代排序地纵览全部文字；点一行打开与 MACRO 相同的详情 */
export function TableView({ selected, onSelect }: Props) {
  const [family, setFamily] = useState<Family | 'all'>('all');
  const [sortKey, setSortKey] = useState<'date' | 'name'>('date');
  const [query, setQuery] = useState('');
  const [onlyLiving, setOnlyLiving] = useState(false);

  const rows = useMemo(() => {
    let list = writingSystems.filter((s) => family === 'all' || s.family === family);
    if (onlyLiving) list = list.filter((s) => s.status === 'living' || s.status === 'revived');
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.nameZh.includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          (s.alias ?? []).some((a) => a.includes(q)),
      );
    }
    return [...list].sort((a, b) =>
      sortKey === 'date' ? a.dateFrom - b.dateFrom : a.nameZh.localeCompare(b.nameZh, 'zh'),
    );
  }, [family, sortKey, query, onlyLiving]);

  const th = (key: 'date' | 'name', label: string) => (
    <th
      onClick={() => setSortKey(key)}
      className={sortKey === key ? 'sorted' : ''}
      style={{ cursor: 'pointer' }}
    >
      {label} {sortKey === key ? '↓' : ''}
    </th>
  );

  return (
    <div className="table-view">
      <div className="table-toolbar">
        <input
          className="search"
          placeholder="搜索文字名称…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips">
          <button
            className={family === 'all' ? 'active' : ''}
            onClick={() => setFamily('all')}
          >
            全部
          </button>
          {FAMILY_ORDER.map((f) => (
            <button
              key={f}
              className={family === f ? 'active' : ''}
              onClick={() => setFamily(f)}
              style={family === f ? { background: FAMILY_COLOR[f], color: '#0d1018' } : undefined}
            >
              {FAMILY_LABEL[f]}
            </button>
          ))}
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={onlyLiving}
            onChange={(e) => setOnlyLiving(e.target.checked)}
          />
          只看今用
        </label>
        <span className="count">{rows.length} 种</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ width: 22 }} aria-label="详情" />
              <th style={{ width: 76 }}>字形</th>
              {th('name', '名称')}
              <th>谱系</th>
              <th>类型</th>
              <th>起源</th>
              {th('date', '年代')}
              <th>主要使用国家 / 地区</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s: WritingSystem) => (
              <tr
                key={s.id}
                className={selected === s.id ? 'selected' : ''}
                aria-selected={selected === s.id}
                tabIndex={0}
                onClick={() => onSelect(selected === s.id ? null : s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(selected === s.id ? null : s.id);
                  }
                }}
              >
                <td className="cell-detail">
                  <span className="cell-detail-hint" aria-hidden="true">
                    ›
                  </span>
                </td>
                <td>
                  <div className="cell-glyph">
                    <FontGlyph
                      char={s.sample}
                      fontFamily={s.fontFamily}
                      size={30}
                      color="var(--ink-strong)"
                    />
                  </div>
                </td>
                <td>
                  <div className="cell-name">{s.nameZh}</div>
                  <div className="cell-en">{s.nameEn}</div>
                </td>
                <td>
                  <span className="dot" style={{ background: FAMILY_COLOR[s.family] }} />
                  {FAMILY_LABEL[s.family]}
                </td>
                <td>{TYPE_LABEL[s.type]}</td>
                <td>{ORIGIN_LABEL[s.origin]}</td>
                <td className="nowrap">{formatSpan(s.dateFrom, s.dateTo)}</td>
                <td className="countries">{s.countries.join('、')}</td>
                <td className={`status status-${s.status}`}>{STATUS_LABEL[s.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
