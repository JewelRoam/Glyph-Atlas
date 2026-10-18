import { fontCoverage } from '../data/fontCoverage';

/**
 * 字体覆盖查询。
 *
 * 一个字符渲染出来是什么样，取决于字族里到底有没有它的字形。字体没有这个
 * 字形时浏览器会悄悄换用系统字体——甲骨文、篆书被画成宋体就是这么来的。
 * 所以这里用构建期生成的覆盖表先判定"有没有"，没有就直接留空。
 *
 * 返回：
 *  · 'yes'     —— 字库里确有该字形；
 *  · 'no'      —— 字库里没有，必须留空，不能交给系统字体；
 *  · 'unknown' —— 覆盖表里没有这个字族（tools/build-font-coverage.mjs 尚未跑），
 *                 此时放行，并由 npm run validate 提醒补数据。
 */
export type Coverage = 'yes' | 'no' | 'unknown';

const parsed = new Map<string, Uint32Array>();

function rangesFor(family: string): Uint32Array | undefined {
  const cached = parsed.get(family);
  if (cached) return cached;
  const raw = fontCoverage[family];
  if (!raw) return undefined;
  const arr = Uint32Array.from(raw);
  parsed.set(family, arr);
  return arr;
}

export function coverageOf(family: string | undefined, char: string | undefined): Coverage {
  if (!family || !char) return 'no';
  const cp = char.codePointAt(0);
  if (cp === undefined) return 'no';
  const ranges = rangesFor(family);
  if (!ranges) return 'unknown';

  let lo = 0;
  let hi = ranges.length / 2 - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = ranges[mid * 2];
    const end = ranges[mid * 2 + 1];
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return 'yes';
  }
  return 'no';
}

/** 覆盖表里有没有这个字族 */
export function hasCoverage(family: string | undefined): boolean {
  return Boolean(family && fontCoverage[family]);
}
