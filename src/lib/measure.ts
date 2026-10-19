/**
 * 文本宽度测量。
 *
 * 演化全图是按"这个名字要占多宽"来分行的，所以必须先知道标签的真实宽度。
 * 早期版本用 `nameZh.length * 13` 估算，中英混排（"线形文字 A"）、
 * 以及 "·" "/" "—" 这类窄字符都会被算错，结果就是标签互相压在一起。
 * 现在改用 canvas 实测并缓存；在没有 canvas 的环境（构建期、测试）
 * 退回按码位估算。
 */

const DEFAULT_STACK =
  '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", "Times New Roman", serif';

const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  return ctx;
}

/** 粗略估算：全宽字符算 1em，空格 0.3em，其余 0.55em */
export function estimateWidth(text: string, fontPx: number): number {
  let em = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp === 0x20) em += 0.3;
    else if (isWide(cp)) em += 1;
    else em += 0.55;
  }
  return em * fontPx;
}

/** CJK、假名、谚文、全角与 CJK 标点都按一个字宽处理 */
function isWide(cp: number): boolean {
  return (
    (cp >= 0x2e80 && cp <= 0xa4cf) || // 部首扩展 ~ 彝文
    (cp >= 0xac00 && cp <= 0xd7a3) || // 谚文音节
    (cp >= 0xf900 && cp <= 0xfaff) || // 兼容汉字
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK 兼容形式
    (cp >= 0xff00 && cp <= 0xff60) || // 全角形式
    (cp >= 0x20000 && cp <= 0x3ffff) // 扩展 B 之后
  );
}

/**
 * 测量一段文本在给定字号下的像素宽度。
 * 结果按 字号 + 字体 + 文本 缓存，图上几百个标签也只量一次。
 */
export function measureText(text: string, fontPx: number, family = DEFAULT_STACK): number {
  if (!text) return 0;
  const key = `${fontPx}|${family}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const c = context();
  let w: number;
  if (c) {
    c.font = `${fontPx}px ${family}`;
    w = c.measureText(text).width;
    // 字体还没就绪时 canvas 可能给出异常小的值，用估算兜底
    if (!Number.isFinite(w) || w < estimateWidth(text, fontPx) * 0.5) {
      w = estimateWidth(text, fontPx);
    }
  } else {
    w = estimateWidth(text, fontPx);
  }
  cache.set(key, w);
  return w;
}
