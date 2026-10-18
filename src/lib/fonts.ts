/**
 * 字体加载与可用性探测。
 *
 * 字形样本有两类来源：
 *  1. 自托管字体（public/fonts/）——历史书体，字面确实画的就是那套书写体系；
 *  2. Google Fonts 上的 Noto 系列——Unicode 已编码、且有对应字面的文字。
 *
 * 这里负责"加载"，并负责"诚实地说没有"：
 *  · loadFont()   自托管字体注入 @font-face，其余注入 Google Fonts 样式表；
 *  · verifyFont() 用 document.fonts.load() 判断字族是否真的存在（兜底路径）；
 *  · fontStack()  自托管字体不挂系统回退——宁可不画，也不让宋体冒充甲骨文。
 *
 * 真正决定"这个字符有没有字形"的是 lib/coverage.ts 的覆盖表；本文件只做加载。
 */
import { localFont, type LocalFont } from '../data/localFonts';

const API = 'https://fonts.googleapis.com/css2?family=';

/** 已经注入过样式的字族 */
const injected = new Set<string>();
/** 每个字族只探测一次，结果缓存（含 in-flight Promise） */
const verified = new Map<string, Promise<boolean>>();

/** 这个字族是不是站点自托管的历史书体字体 */
export function isLocalFamily(family?: string): boolean {
  return Boolean(family && localFont(family));
}

/** 生成 Google Fonts 的 css2 地址 */
function cssUrl(family: string): string {
  return `${API}${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
}

/** 自托管字体：注入 @font-face，路径带 Vite 的 base（GitHub Pages 在子目录下） */
function injectLocalFaces(font: LocalFont): void {
  const base = import.meta.env.BASE_URL || '/';
  const src = font.files
    .map((file) => `url("${base}${file}") format("woff2")`)
    .join(', ');
  const style = document.createElement('style');
  style.dataset.glyphAtlasFont = font.family;
  style.textContent =
    `@font-face{font-family:"${font.family}";font-style:normal;font-weight:400;` +
    `font-display:block;src:${src}}`;
  document.head.appendChild(style);
}

/** 注入样式。返回是否新建了节点（不等待字体文件下载完成）。 */
export function loadFont(family?: string): void {
  if (!family || injected.has(family)) return;
  injected.add(family);

  const local = localFont(family);
  if (local) {
    injectLocalFaces(local);
    return;
  }

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

/** 系统字体链。只在没有声明字族（即本来就该用系统字体）时启用。 */
const SYSTEM_STACK =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans", "Songti SC", system-ui, sans-serif';

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

/**
 * 生成字体族 CSS 值。
 *
 * 自托管的历史书体字体只写自己：如果字库没有这个字形，就让它空着，
 * 绝不让浏览器的系统字体接着画——那正是"甲骨文被画成宋体"的来源。
 * 覆盖表会在更早的地方把这些字符拦下来。
 */
export function fontStack(family?: string): string {
  if (!family) return SYSTEM_STACK;
  if (isLocalFamily(family)) return `"${family}"`;
  return `"${family}", ${SYSTEM_STACK}`;
}
