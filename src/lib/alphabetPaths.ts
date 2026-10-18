import { useEffect, useState } from 'react';

export type AlphabetPaths = Record<string, string>;

let loaded: AlphabetPaths | null = null;
let loading: Promise<void> | null = null;

/** 字母轮廓单独成包（≈87KB），进 MICRO 才按需拉取 */
export function loadAlphabetPaths(): Promise<void> {
  loading ??= import('../data/glyphAlphabets').then((mod) => {
    loaded = mod.alphabetPaths;
  });
  return loading;
}

/**
 * 进 MICRO 就先把字母轮廓包拉起来，别等到第一段有字母表的轨道才请求。
 * 这段包没到位时字母场只画骨架，绝不拿字体顶替——否则历史书体会先闪一下
 * 现代字面，看起来像"用楷体画了甲骨文"。
 */
export function preloadAlphabetPaths(): void {
  if (loaded) return;
  void loadAlphabetPaths().catch(() => {
    // 拉取失败就一直是骨架态，不写回错误的字形
  });
}

export function useAlphabetPaths(): AlphabetPaths | null {
  const [paths, setPaths] = useState<AlphabetPaths | null>(loaded);
  useEffect(() => {
    // 已经加载过：state 初始化时就已经拿到，不需要再 setState
    if (loaded) return;
    let alive = true;
    loadAlphabetPaths()
      .then(() => {
        if (alive && loaded) setPaths(loaded);
      })
      .catch(() => {
        /* 保持骨架态 */
      });
    return () => {
      alive = false;
    };
  }, []);
  return paths;
}
