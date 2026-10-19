import type { WritingSystem } from './types';
import { writingSystems } from './writingSystems';

export * from './types';
export { writingSystems, scriptById } from './writingSystems';
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
  graphChildrenByScript,
  scriptContextFor,
} from './scriptContext';
export type {
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

/** 独立起源（人类文字史上屈指可数的几次独立发明） */
export const independentSystems: WritingSystem[] = graphSystems.filter(
  (s) => s.origin === 'independent',
);

/** 今天仍在日常使用的书写体系 */
export const livingSystems: WritingSystem[] = graphSystems.filter(
  (s) => s.status === 'living' || s.status === 'revived',
);
