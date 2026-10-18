/**
 * 字体加载与可用性探测。
 *
 * 我们的字形样本来自 Google Fonts 上的 Noto 系列。问题在于：
 * 并不是每一种文字都有对应的 Web 字体（例如线形文字 A、恩西比底文字、
 * 东巴文的部分区块），而缺失字体的后果是页面上出现"豆腐块"，
 * 这会让整站看起来像坏了。
 *
 * 因此这里不只负责"加载"，还负责"诚实地说没有"：
 *  1. loadFont()   注入 Google Fonts 样式表（每种文字一次）。
 *  2. verifyFont() 用 document.fonts.load() 判断该字族是否真的存在。
 *  3. 私有区 / 未分配码位直接判定为无字形，不浪费时间请求。
 * 拿到 "missing" 之后，Glyph 组件会渲染码位名片而不是豆腐块。
 */

const API = 'https://fonts.googleapis.com/css2?family=';

/** 已经注入过样式表的字族 */
const injected = new Set<string>();
/** 每个字族只探测一次，结果缓存（含 in-flight Promise） */
const verified = new Map<string, Promise<boolean>>();

/** 生成 Google Fonts 的 css2 地址 */
function cssUrl(family: string): string {
  return `${API}${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
}

/** 注入样式表。返回是否新建了 <link>（不等待加载完成）。 */
export function loadFont(family?: string): void {
  if (!family || injected.has(family)) return;
  injected.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl(family);
  // 加载失败（400 / 离线）时保持静默，verifyFont 会给出结论
  link.dataset.glyphAtlasFont = family;
  document.head.appendChild(link);
}

/** 私有使用区与未分配区：任何通用字体都不会有真实字形 */
const PUA = [
  [0xe000, 0xf8ff],
  [0xf0000, 0xffffd],
  [0x100000, 0x10fffd],
  [0xfff0, 0xffff], // 特殊区（含 BOM、替换字符）
];

export function isPrivateUse(char: string): boolean {
  for (const cp of toCodePoints(char)) {
    if (PUA.some(([lo, hi]) => cp >= lo && cp <= hi)) return true;
  }
  return false;
}

/** 取字符串中的码位（正确处理增补平面与代理对） */
export function toCodePoints(text: string): number[] {
  return Array.from(text).map((c) => c.codePointAt(0) ?? 0);
}

/** 格式化为 "U+10600" */
export function formatCodePoint(char: string): string {
  const cps = toCodePoints(char);
  if (!cps.length) return '';
  return cps.map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
}

/**
 * 判断某个字族是否真的可用。
 * 未提供字族时视为可用（交给系统字体链）。
 */
export function verifyFont(family: string | undefined, sample: string): Promise<boolean> {
  if (!family || family === '') return Promise.resolve(true);
  if (isPrivateUse(sample)) return Promise.resolve(false);

  const cached = verified.get(family);
  if (cached) return cached;

  const task = (async () => {
    loadFont(family);
    if (typeof document === 'undefined' || !document.fonts) return true;
    try {
      const faces = await document.fonts.load(`32px "${family}"`, sample);
      return faces.length > 0;
    } catch {
      return false;
    }
  })();

  verified.set(family, task);
  return task;
}

/** 生成字体族 CSS 值。系统字体链保证中文永远有回退。 */
export function fontStack(family?: string): string {
  const fallbacks =
    '"Noto Sans SC", "PingFang SC", "Hiragino Sans", "Songti SC", system-ui, sans-serif';
  return family ? `"${family}", ${fallbacks}` : fallbacks;
}
