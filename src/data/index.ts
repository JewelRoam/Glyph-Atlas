import type { WritingSystem } from './types';
import { writingSystems } from './writingSystems';

export * from './types';
export { writingSystems, scriptById } from './writingSystems';
export { lineages } from './lineages';

/**
 * 演化图使用的节点集合。
 *
 * 收录口径是"书写体系"，因此像奇普（结绳）这类记录系统虽然保留在
 * 总表里，但不会被画进演化图，也不会被算作一次独立发明。
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
