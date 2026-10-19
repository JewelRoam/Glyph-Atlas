import { useEffect, useRef, type CSSProperties } from 'react';
import {
  adjacentStops,
  lineageEntryFor,
  lineagesByScript,
  scriptContextFor,
  stopRefFromParams,
  stopRefFor,
  writingSystems,
  type LineageStopRef,
  type ScriptGraphNeighborContext,
} from '../data';
import type { GraphRelationKind, WritingSystem } from '../data/types';
import {
  FAMILY_COLOR,
  FAMILY_LABEL,
  LINEAGE_MODE_HINT,
  LINEAGE_MODE_LABEL,
  ORIGIN_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  formatSpan,
} from '../lib/time';
import { GlyphBoard } from './GlyphBoard';
import { LineageStage } from './LineageStage';

export interface FocusLocation {
  scriptId: string;
  lineageId?: string;
  stopId?: string;
}

interface FocusViewProps {
  location: FocusLocation;
  onOpenScript: (scriptId: string) => void;
  onOpenTrack: (track: LineageStopRef) => void;
  onStationChange: (track: LineageStopRef) => void;
}

const DIRECTION_LABEL: Record<string, string> = {
  ltr: '从左到右',
  rtl: '从右到左',
  ttb: '自上而下',
  boustrophedon: '牛耕式',
  mixed: '多向并用',
};

const RELATION_LABEL: Record<GraphRelationKind, string> = {
  descent: '直系演变',
  borrowing: '借用',
  influence: '影响',
  model: '造字模型',
};

function stationNumber(track: LineageStopRef) {
  return `${String(track.index + 1).padStart(2, '0')} / ${String(track.lineage.stops.length).padStart(2, '0')}`;
}

function relationTitle(relation: ScriptGraphNeighborContext['relation']) {
  return RELATION_LABEL[relation.kind];
}

function RelationPortal({
  neighbor,
  direction,
  onOpen,
}: {
  neighbor: ScriptGraphNeighborContext;
  direction: 'parent' | 'child';
  onOpen: (scriptId: string) => void;
}) {
  const system = neighbor.node.system;
  return (
    <button
      className="relation-portal"
      data-direction={direction}
      onClick={() => onOpen(system.id)}
    >
      <span className="relation-direction" aria-hidden="true">
        {direction === 'parent' ? '←' : '→'}
      </span>
      <span className="relation-copy">
        <span className="relation-kind">{relationTitle(neighbor.relation)}</span>
        <strong>{system.nameZh}</strong>
        <em>{system.nameEn}</em>
        {neighbor.relation.note ? <small>{neighbor.relation.note}</small> : null}
      </span>
    </button>
  );
}

function StationDossier({
  system,
  track,
  onOpenTrack,
}: {
  system: WritingSystem;
  track: LineageStopRef;
  onOpenTrack: (track: LineageStopRef) => void;
}) {
  const { previous, next } = adjacentStops(track);
  const source = track.stop.sourceRef ?? track.lineage.sourceRefs[0];
  return (
    <section className="dossier-section station-dossier" aria-labelledby="station-heading">
      <header className="dossier-kicker">
        <span id="station-heading">当前站点</span>
        <b>{stationNumber(track)}</b>
      </header>
      <h2>{track.stop.label ?? system.nameZh}</h2>
      <p className="station-ident">
        {system.nameZh}
        {track.stop.phonetic ? <span> /{track.stop.phonetic}/</span> : null}
      </p>

      {(previous || next) && (
        <nav className="station-neighbors" aria-label="沿线前后站点">
          {previous ? (
            <button onClick={() => onOpenTrack(previous)}>
              <span>上一站</span>
              <strong>{previous.stop.label ?? previous.stop.script}</strong>
            </button>
          ) : (
            <span className="station-end">轨道起点</span>
          )}
          {next ? (
            <button onClick={() => onOpenTrack(next)}>
              <span>下一站</span>
              <strong>{next.stop.label ?? next.stop.script}</strong>
            </button>
          ) : (
            <span className="station-end">轨道终点</span>
          )}
        </nav>
      )}

      {(source || track.stop.asset) && (
        <div className="station-source">
          <span>字形依据</span>
          {source ? (
            <a href={source} target="_blank" rel="noreferrer">
              查看出处 ↗
            </a>
          ) : null}
          {track.stop.asset?.credit ? <em>{track.stop.asset.credit}</em> : null}
        </div>
      )}
    </section>
  );
}

function GraphRelations({
  context,
  onOpenScript,
}: {
  context: NonNullable<ReturnType<typeof scriptContextFor>>;
  onOpenScript: (scriptId: string) => void;
}) {
  if (!context.graph.parentNeighbors.length && !context.graph.childNeighbors.length) return null;
  return (
    <section className="dossier-section graph-relations" aria-labelledby="relations-heading">
      <header className="dossier-kicker">
        <span id="relations-heading">图谱关系</span>
        <b>{context.graph.parentNeighbors.length + context.graph.childNeighbors.length}</b>
      </header>
      {context.graph.parentNeighbors.length > 0 && (
        <div className="relation-group">
          <h3>来自</h3>
          {context.graph.parentNeighbors.map((neighbor) => (
            <RelationPortal
              key={`${neighbor.relation.parent}>${neighbor.relation.child}`}
              neighbor={neighbor}
              direction="parent"
              onOpen={onOpenScript}
            />
          ))}
        </div>
      )}
      {context.graph.childNeighbors.length > 0 && (
        <div className="relation-group">
          <h3>去向</h3>
          {context.graph.childNeighbors.map((neighbor) => (
            <RelationPortal
              key={`${neighbor.relation.parent}>${neighbor.relation.child}`}
              neighbor={neighbor}
              direction="child"
              onOpen={onOpenScript}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * 一个书写体系的统一焦点。
 *
 * 左栏沿已核实的字形轨道连续行走，右栏始终解释当前站点、
 * 体系档案与直接图谱关系。全图和检索都从这里进入，不存在第二套详情。
 */
export function FocusView({
  location,
  onOpenScript,
  onOpenTrack,
  onStationChange,
}: FocusViewProps) {
  const focusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    focusRef.current?.scrollTo({ top: 0 });
  }, [location.scriptId]);

  const context = scriptContextFor(location.scriptId);
  if (!context) return null;

  const requested = stopRefFromParams(location.lineageId, location.stopId);
  const requestedTrack = requested?.stop.script === location.scriptId ? requested : undefined;
  const fallbackTrack = lineageEntryFor(location.scriptId)?.track;
  const activeTrack = requestedTrack ?? fallbackTrack;
  const tracks = lineagesByScript.get(location.scriptId) ?? [];
  const system = context.system;
  const graphNumber = String(writingSystems.findIndex((item) => item.id === system.id) + 1).padStart(
    3,
    '0',
  );

  return (
    <article
      ref={focusRef}
      className="focus"
      style={
        {
          '--family-color': FAMILY_COLOR[system.family],
        } as CSSProperties
      }
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
              <b>方向</b>
              {DIRECTION_LABEL[system.direction ?? 'ltr']}
            </span>
            {system.unicodeBlock ? (
              <span>
                <b>Unicode</b>
                <em>{system.unicodeBlock}</em>
              </span>
            ) : null}
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
          <div>
            <dt>状态</dt>
            <dd>{STATUS_LABEL[system.status]}</dd>
          </div>
        </dl>
      </header>

      <div className={`focus-workspace ${activeTrack ? '' : 'without-track'}`}>
        <section className="focus-stage-column" aria-labelledby="lineage-heading">
          <header className="stage-heading">
            <div>
              <span>字形演变</span>
              <h2 id="lineage-heading">
                {activeTrack?.lineage.nameZh ?? '尚未建立连续字形轨道'}
              </h2>
            </div>
            {activeTrack?.lineage.mode ? (
              <span className="lineage-mode">
                {LINEAGE_MODE_LABEL[activeTrack.lineage.mode]}
              </span>
            ) : null}
          </header>

          {tracks.length > 0 && (
            <div className="track-switcher" aria-label="选择字形轨道">
              {tracks.map((track, index) => {
                const active = track.id === activeTrack?.lineage.id;
                return (
                  <button
                    key={track.id}
                    className={active ? 'active' : ''}
                    aria-pressed={active}
                    onClick={() => {
                      const stop =
                        track.stops.find((candidate) => candidate.script === system.id) ??
                        track.stops[0];
                      const ref = stopRefFor(track.id, stop);
                      if (ref) onOpenTrack(ref);
                    }}
                    title={track.description}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{track.nameZh}</strong>
                  </button>
                );
              })}
            </div>
          )}

          {activeTrack ? (
            <>
              <LineageStage
                lineage={activeTrack.lineage}
                stationId={activeTrack.stop.id}
                onStationChange={onStationChange}
              />
              <footer className="lineage-footnote">
                <p>{activeTrack.lineage.description}</p>
                <div>
                  {activeTrack.lineage.mode ? (
                    <span>{LINEAGE_MODE_HINT[activeTrack.lineage.mode]}</span>
                  ) : null}
                  <a
                    href={activeTrack.lineage.sourceRefs[0]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    依据 · {activeTrack.lineage.source} ↗
                  </a>
                </div>
              </footer>
            </>
          ) : (
            <div className="track-empty">
              <span className="track-empty-mark" aria-hidden="true">
                ○
              </span>
              <h3>没有可核实的连续字形</h3>
              <p>
                现存材料只支持确认这套文字的形式与来源，尚不足以把逐字演变连成轨道。
                下方字表展示可靠字形，空缺不以现代字体补画。
              </p>
            </div>
          )}
        </section>

        <aside className="focus-dossier" aria-label={`${system.nameZh}档案`}>
          {activeTrack ? (
            <StationDossier
              system={system}
              track={activeTrack}
              onOpenTrack={onOpenTrack}
            />
          ) : null}
          <GraphRelations context={context} onOpenScript={onOpenScript} />
        </aside>
      </div>

      <GlyphBoard system={system} />
    </article>
  );
}
