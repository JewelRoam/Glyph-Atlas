import { writingSystems } from '../data';
import type { WritingSystem } from '../data/types';
import { FAMILY_COLOR, FAMILY_LABEL, ORIGIN_LABEL, STATUS_LABEL, TYPE_LABEL, formatSpan } from '../lib/time';
import { GlyphBoard } from './GlyphBoard';

interface Props {
  system: WritingSystem;
  onSelect: (id: string | null) => void;
}

/**
 * 书写体系详情 —— MACRO 的图谱节点与 INDEX 的表格行共用这一套内容。
 * 面板壳子（定位、关闭、动画）交给 DetailDrawer，这里只管内容。
 */
export function ScriptDetail({ system: s, onSelect }: Props) {
  const parents = s.parents.map((p) => writingSystems.find((x) => x.id === p)).filter(Boolean);
  const children = writingSystems.filter((x) => x.parents.includes(s.id));

  return (
    <>
      <div className="detail-head">
        <h2>{s.nameZh}</h2>
        <div className="detail-en">{s.nameEn}</div>
      </div>

      <div className="detail-tags">
        <span style={{ background: FAMILY_COLOR[s.family], color: '#0d1018' }}>
          {FAMILY_LABEL[s.family]}
        </span>
        <span>{TYPE_LABEL[s.type]}</span>
        <span>{ORIGIN_LABEL[s.origin]}</span>
        <span>{STATUS_LABEL[s.status]}</span>
      </div>

      {s.note && <p className="detail-note">{s.note}</p>}

      <GlyphBoard system={s} />

      <dl className="detail-list">
        <dt>年代</dt>
        <dd>{formatSpan(s.dateFrom, s.dateTo)}</dd>
        <dt>发源地</dt>
        <dd>{s.region}</dd>
        <dt>使用国家 / 地区</dt>
        <dd>{s.countries.join('、')}</dd>
        <dt>书写方向</dt>
        <dd>{DIRECTION_LABEL[s.direction ?? 'ltr']}</dd>
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
    </>
  );
}

const DIRECTION_LABEL: Record<string, string> = {
  ltr: '从左到右',
  rtl: '从右到左',
  ttb: '自上而下',
  boustrophedon: '牛耕式（逐行反向）',
  mixed: '多向并用',
};
