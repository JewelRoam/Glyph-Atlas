import type { WritingSystem } from './types';
import { writingSystems } from './writingSystems';
import { graphRelations } from './graphRelations';

export * from './types';
export { writingSystems, scriptById } from './writingSystems';
export { graphRelations } from './graphRelations';
export { graphConnectionBetween, graphPathBetween } from './graphIndex';
export type {
  GraphConnection,
  GraphConnectionStatus,
  GraphPath,
  GraphPathDirection,
  GraphStep,
} from './graphIndex';
export { lineages } from './lineages';
export {
  adjacentGraphLinks,
  adjacentStops,
  allStopRefs,
  graphLinksForLineage,
  lineageById,
  lineageEntryFor,
  lineageHref,
  lineageStatusFor,
  lineagesByScript,
  neighboringStopRefs,
  stopKey,
  stopRefByKey,
  stopRefFor,
  stopRefFromParams,
  stopsByScript,
} from './lineageIndex';
export type {
  LineageAdjacentGraphLink,
  LineageAdjacencyStatus,
  LineageEntry,
  LineageGraphAdjacency,
  LineageGraphDirection,
  LineageGraphLink,
  LineageStopRef,
  ScriptLineageStatus,
} from './lineageIndex';
export {
  ancestorsFor,
  descendantsFor,
  graphChildrenByScript,
  scriptContextFor,
  scriptPortalFor,
} from './scriptContext';
export type {
  AncestryPath,
  DescendantPath,
  ScriptContext,
  ScriptGraphContext,
  ScriptGraphNeighborContext,
  ScriptLineageContext,
  ScriptLineageTrackContext,
  ScriptMaterialContext,
  ScriptNodePortal,
  ScriptNodeRoute,
  ScriptRouteMode,
} from './scriptContext';

/**
 * 演化图使用的节点集合。
 *
 * 馆藏还包含奇普（结绳）与国际音标等辅助记录；只有承担具体语言书写职能的
 * 条目才进入谱系图。标音系统和记录系统保留在馆藏与检索中，不能借用书写
 * 体系的传承边。
 */
const CATALOG_ONLY_TYPES = new Set<WritingSystem['type']>(['nonscript', 'notation']);

export function isGraphSystem(system: WritingSystem): boolean {
  return !CATALOG_ONLY_TYPES.has(system.type);
}

export const graphSystems: WritingSystem[] = writingSystems.filter(isGraphSystem);

/**
 * 独立起源（人类文字史上屈指可数的几次独立发明）。
 *
 * 节点级 origin 可能保留历史分类，但只有没有父系边的节点才是图谱意义上的
 * 源头；否则一个派生节点会被误算成新的独立发明。
 */
export const independentSystems: WritingSystem[] = graphSystems.filter(
  (s) => s.origin === 'independent' && s.parents.length === 0,
);

/** 边表投影后的父系数量；供审计确认所有边都已落到节点上。 */
export const graphRelationCount = graphRelations.length;

/** 今天仍在日常使用的书写体系 */
export const livingSystems: WritingSystem[] = graphSystems.filter(
  (s) => s.status === 'living' || s.status === 'revived',
);
