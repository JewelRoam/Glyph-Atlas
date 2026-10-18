import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { letterMaps } from '../data/letterSlots';

export type AlphabetPaths = Record<string, string>;

/**
 * 字母轮廓分两包：
 *  · core  —— 闪米特—希腊—拉丁那条线（ʾālep → Α → A…）；
 *  · varga —— 婆罗米系的元音位与梵语字音表（svara-* 与 varga-* 两套槽位：
 *    婆罗米 𑀅 → 天城 अ、婆罗米 ka → 天城 क → 泰文 ก…）。
 *
 * 两套槽位互不相干，一条轨道只用得到其中一包，所以按包拆文件、按需取：
 * 走闪米特轨道的读者不必先下载印度那六百多个轮廓。
 */
export type AlphabetGroup = 'core' | 'varga';

const groupOfCache = new Map<string, AlphabetGroup | null>();

/** 某个书写体系的花名册落在哪一包；没有对照表的返回 null */
export function alphabetGroup(scriptId: string): AlphabetGroup | null {
  let group = groupOfCache.get(scriptId);
  if (group === undefined) {
    const map = letterMaps[scriptId];
    group = map
      ? Object.keys(map).some((slot) => slot.startsWith('varga-') || slot.startsWith('svara-'))
        ? 'varga'
        : 'core'
      : null;
    groupOfCache.set(scriptId, group);
  }
  return group;
}

const loaded = new Map<AlphabetGroup, AlphabetPaths>();
const inflight = new Map<AlphabetGroup, Promise<void>>();
const merged = new Map<string, AlphabetPaths>();
/** 包加载完成时通知字母场重画 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function announce(): void {
  for (const listener of listeners) listener();
}

function loadGroup(group: AlphabetGroup): Promise<void> {
  let task = inflight.get(group);
  if (!task) {
    task = (
      group === 'core'
        ? import('../data/glyphAlphabets').then((mod) => mod.alphabetPaths)
        : import('../data/glyphAlphabetsVarga').then((mod) => mod.alphabetPathsVarga)
    ).then((paths) => {
      loaded.set(group, paths);
      announce();
    });
    inflight.set(group, task);
  }
  return task;
}

/** 这两套文字要用的包都到位了才返回查表，否则返回 null（字母场画骨架） */
function ready(key: string): AlphabetPaths | null {
  const groups = key.split(',').filter(Boolean) as AlphabetGroup[];
  if (!groups.every((group) => loaded.has(group))) return null;
  const cached = merged.get(key);
  if (cached) return cached;
  const built = Object.assign({}, ...groups.map((group) => loaded.get(group)!));
  merged.set(key, built);
  return built;
}

/** 预取一包轮廓 */
export function preloadAlphabetGroup(group: AlphabetGroup): void {
  void loadGroup(group).catch(() => undefined);
}

/** 预取一组文字会用到的包，别等到字母场挂载才请求 */
export function preloadAlphabetPaths(scriptIds: string[]): void {
  for (const id of scriptIds) {
    const group = alphabetGroup(id);
    if (group) preloadAlphabetGroup(group);
  }
}

export function useAlphabetPaths(a: string, b: string): AlphabetPaths | null {
  // 这一对文字要用哪几包：按字母序拼成 key，既当缓存键也当订阅键
  const key = useMemo(() => {
    const groups = new Set<AlphabetGroup>();
    for (const id of [a, b]) {
      const group = alphabetGroup(id);
      if (group) groups.add(group);
    }
    return [...groups].sort().join(',');
  }, [a, b]);

  const snapshot = useCallback(() => ready(key), [key]);
  // 轮廓包是 React 之外的资源：没到位时 ready() 返回 null，字母场画骨架
  const paths = useSyncExternalStore(subscribe, snapshot, snapshot);

  useEffect(() => {
    for (const group of key.split(',').filter(Boolean) as AlphabetGroup[]) {
      void loadGroup(group).catch(() => undefined);
    }
  }, [key]);

  return paths;
}
