#!/usr/bin/env node
/**
 * 字体审看台 —— 把每个书写体系的字形按"站上真正会用的字族"排成一张张对照表，
 * 给人工逐个核实"这款字画的是不是这套文字"。
 *
 * 站上的规则是"字面必须画的就是该书写体系本身"。这条规则编译器守不住：字体
 * 名字对不对、字面是不是这套字，只能靠眼睛看。这个脚本把要看的都铺出来——
 * 每个体系一行，左边是体系名与声明的字族，右边是这一家用到的字形（字母表
 * 铺前若干格，语素文字取代表字；没有字库的体系不画字面，只贴图版）。
 *
 *   npm run build                 # 先有 dist（图版体系要从里面取图）
 *   node tools/font-sheet.mjs     # 输出 work/font-sheet/tile-NN.png
 *
 * 审看结果记进 tools/font-verdicts.tsv：一行一个体系，第二列写 ok、wrong、blank
 * 或 todo，第三列写理由。tools/audit-font-verdicts.mjs 会盯着这份表，没写结论
 * 的体系在体检里列出来。
 */
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { writingSystems } from '../src/data/writingSystems.ts';
import { glyphSourceFor } from '../src/data/glyphSources.ts';
import { glyphSets } from '../src/data/glyphSets.ts';
import { rosterFor, hasRoster } from '../src/data/letterSlots.ts';
import { localFonts } from '../src/data/localFonts.ts';
import { familyFor } from '../src/data/fontFallback.ts';

const OUT = path.resolve(process.argv[2] ?? 'work/font-sheet');
const ROOT = path.resolve(import.meta.dirname, '..');
/** 一屏放多少行；行高固定，编号与截图对应 */
const PER_TILE = 14;
const ROW_H = 92;

const PLATES = 3;
/**
 * 这一行要看的字。
 *
 * 只有字体来源才有字面可看：图版来源排的是整幅实物图，若把样例字塞进
 * 字形栏，浏览器找不到字面就会画成一个空方框——那正是审看台要抓的错，
 * 工具自己不能先造一个。字面栏留空，图版栏就是这一家的全部证据。
 */
const chars = (id, sample, isFont) => {
  if (!isFont) return [];
  const roster = hasRoster(id) ? Object.values(rosterFor(id)) : [];
  if (roster.length) return roster.slice(0, 24);
  const set = glyphSets[id];
  if (set?.chars.length) return set.chars.slice(0, 24);
  return sample ? [sample] : [];
};

const rows = writingSystems.map((s) => {
  const src = glyphSourceFor(s);
  const family = src.kind === 'font' ? src.family ?? familyFor(s.id, s.fontFamily) : undefined;
  const fonts = new Set();
  if (family) fonts.add(family);
  for (const f of localFonts) fonts.add(f.family);
  return {
    id: s.id,
    name: `${s.nameZh} · ${s.nameEn}`,
    kind: src.kind,
    family,
    credit: src.credit,
    note: src.note,
    glyphs: chars(s.id, s.sample, src.kind === 'font'),
    plates: (src.plates ?? []).slice(0, PLATES).map((p) => p.src),
    fonts: [...fonts].filter(Boolean),
  };
});

/**
 * 自托管字体要内联成 data URI。
 *
 * file:// 页面加载同目录的字体文件会被当成跨源请求挡掉，审看台会把甲骨文画成
 * 系统里的楷体——那正是这张表要抓的错，工具自己不能先犯。内联成 data URI 就
 * 没有这回事。
 */
const faceCss = localFonts
  .map((f) => {
    const src = f.files
      .map((file) => `url(data:font/woff2;base64,${readFileSync(path.join(ROOT, 'public', file)).toString('base64')}) format("woff2")`)
      .join(',');
    return `@font-face{font-family:"${f.family}";src:${src};font-display:block}`;
  })
  .join('\n');

const gfLink = (slice) => {
  const fams = [...new Set(slice.map((r) => r.family).filter(Boolean))];
  if (!fams.length) return '';
  const q = fams.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`).join('&');
  return `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=block">`;
};

const html = (slice, offset) => `<!doctype html><meta charset="utf-8">
${gfLink(slice)}
<style>${faceCss}
 body{margin:0;background:#12100e;color:#f2ece2;font:13px/1.4 "Noto Sans",system-ui,sans-serif}
 .row{display:flex;align-items:center;gap:16px;height:${ROW_H}px;padding:0 18px;border-bottom:1px solid #2a251f}
 .meta{width:330px;flex:none}
 .id{color:#8d8477;font-size:11px}
 .fam{color:#e8b46a;font-size:12px;word-break:break-all}
 .glyphs{display:flex;flex-wrap:wrap;gap:6px;font-size:30px;line-height:1.1}
 .glyphs span{width:44px;text-align:center}
 img{height:64px;border:1px solid #2a251f}
 .tag{font-size:11px;color:#8d8477}</style>
 ${slice
   .map(
     (r, i) => `<div class="row">
   <div class="meta"><div class="id">${offset + i + 1}. ${r.id}</div>
   <div>${r.name}</div><div class="fam">${r.family ?? r.kind}${r.credit ? ` · ${r.credit}` : ''}</div></div>
   <div class="glyphs" style="font-family:${r.family ? `'${r.family}',monospace` : 'monospace'}">
     ${r.glyphs.length
       ? r.glyphs.map((c) => `<span>${c}</span>`).join('')
       : `<span class="tag">${r.kind === 'font' ? '字表为空' : '无字库，看图版'}</span>`}
   </div>
   ${r.plates.map((p) => `<img src="file://${path.join(ROOT, 'public', p)}">`).join('')}
 </div>`,
   )
   .join('\n')}`;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1680, height: PER_TILE * ROW_H + 8 }, deviceScaleFactor: 2 });
const tiles = Math.ceil(rows.length / PER_TILE);
for (let t = 0; t < tiles; t++) {
  const slice = rows.slice(t * PER_TILE, (t + 1) * PER_TILE);
  const file = path.join(OUT, `tile-${String(t + 1).padStart(2, '0')}.html`);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(file, html(slice, t * PER_TILE));
  await page.goto(`file://${file}`, { waitUntil: 'networkidle' });
  // 等 Google Fonts 真正到齐，否则拍到的是一堆替代字面
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `tile-${String(t + 1).padStart(2, '0')}.png`) });
  console.log(`· tile-${String(t + 1).padStart(2, '0')}.png  ${slice[0].id} … ${slice[slice.length - 1].id}`);
}
await browser.close();
console.log(`\n共 ${rows.length} 个体系、${tiles} 张图，在 ${OUT}。`);
console.log('审看结论记进 tools/font-verdicts.tsv（ok / wrong / blank / todo）。');
