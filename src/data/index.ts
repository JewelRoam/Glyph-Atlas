import type { WritingSystem } from './types';
import { writingSystems } from './writingSystems';
import { graphRelations } from './graphRelations';

export * from './types';
export { writingSystems, scriptById } from './writingSystems';
export { graphRelations } from './graphRelations';
export { lineages } from './lineages';
export {
  adjacentStops,
  allStopRefs,
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
export type { LineageEntry, LineageStopRef, ScriptLineageStatus } from './lineageIndex';
export {
  ancestorsFor,
  descendantsFor,
  graphChildrenByScript,
  scriptContextFor,
} from './scriptContext';
export type {
  AncestryPath,
  DescendantPath,
  GraphStep,
  ScriptContext,
  ScriptGraphContext,
  ScriptLineageContext,
} from './scriptContext';

/**
 * 演化图使用的节点集合。
 *
 * 总表还包含奇普（结绳）等非文字记录系统；图谱节点只取书写体系。
 */
export const graphSystems: WritingSystem[] = writingSystems.filter(
  (s) => s.type !== 'nonscript',
);

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
