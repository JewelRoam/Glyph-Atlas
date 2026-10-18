import { writingSystems } from '../data';
import { FontGlyph } from './Glyph';
import {
  FAMILY_COLOR,
  FAMILY_LABEL,
  ORIGIN_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  formatSpan,
} from '../lib/time';

interface Props {
  id: string | null;
  onSelect: (id: string | null) => void;
}

/** 文字详情面板（宏观图右侧） */
export function DetailPanel({ id, onSelect }: Props) {
  if (!id) {
    return (
      <aside className="detail empty">
        <p>点击图谱中的任一节点，查看该书写体系的详情与亲缘关系。</p>
      </aside>
    );
  }

  const s = writingSystems.find((x) => x.id === id);
  if (!s) return null;

  const parents = s.parents
    .map((p) => writingSystems.find((x) => x.id === p))
    .filter(Boolean);
  const children = writingSystems.filter((x) => x.parents.includes(s.id));

  return (
    <aside className="detail">
      <button className="detail-close" onClick={() => onSelect(null)}>
        ✕
      </button>

      <div className="detail-glyph">
        <FontGlyph char={s.sample} fontFamily={s.fontFamily} size={76} />
      </div>

      <h2>{s.nameZh}</h2>
      <div className="detail-en">{s.nameEn}</div>

      <div className="detail-tags">
        <span style={{ background: FAMILY_COLOR[s.family], color: '#0d1018' }}>
          {FAMILY_LABEL[s.family]}
        </span>
        <span>{TYPE_LABEL[s.type]}</span>
        <span>{ORIGIN_LABEL[s.origin]}</span>
        <span>{STATUS_LABEL[s.status]}</span>
      </div>

      {s.note && <p className="detail-note">{s.note}</p>}

      <dl className="detail-list">
        <dt>年代</dt>
        <dd>{formatSpan(s.dateFrom, s.dateTo)}</dd>
        <dt>发源地</dt>
        <dd>{s.region}</dd>
        <dt>使用国家 / 地区</dt>
        <dd>{s.countries.join('、')}</dd>
        {s.unicodeBlock && (
          <>
            <dt>Unicode</dt>
            <dd className="mono">{s.unicodeBlock}</dd>
          </>
        )}
      </dl>

      {parents.length > 0 && (
        <div className="detail-rel">
          <h3>源自</h3>
          {parents.map((p) => (
            <button key={p!.id} onClick={() => onSelect(p!.id)}>
              {p!.nameZh}
            </button>
          ))}
        </div>
      )}

      {children.length > 0 && (
        <div className="detail-rel">
          <h3>衍生出</h3>
          <div className="rel-wrap">
            {children.map((c) => (
              <button key={c.id} onClick={() => onSelect(c.id)}>
                {c.nameZh}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
