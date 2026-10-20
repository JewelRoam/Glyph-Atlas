#!/usr/bin/env node
/**
 * 视觉与交互回归：把构建产物按 GitHub Pages 的项目路径伺服，检查演化全图、
 * 统一体系节点、检索层与移动端布局。截图写入 work/shots，不进入版本库。
 *
 *   npm run build
 *   npm i --no-save playwright
 *   npx playwright install chromium
 *   npm run shots
 */
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'work/shots');
const PORT = Number(process.env.SHOT_PORT ?? 4321);
const BASE_PATH = process.env.SHOT_BASE ?? '/Glyph-Atlas/';
const BASE = `http://localhost:${PORT}${BASE_PATH}`;
const DIST = path.resolve('dist');
const CHANNELS = ['msedge', 'chrome', null];
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

let playwright;
try {
  playwright = await import('playwright');
} catch {
  console.error(
    '缺少 Playwright。先安装再跑：\n  npm i --no-save playwright && npx playwright install chromium',
  );
  process.exit(1);
}

if (!existsSync(DIST)) {
  console.error(`找不到 ${DIST}，先跑 npm run build。`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

function serveDist() {
  const server = createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://shot').pathname);
    } catch {
      res.writeHead(400);
      return res.end('bad request');
    }
    if (!pathname.startsWith(BASE_PATH)) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('404');
    }
    let rel = pathname.slice(BASE_PATH.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.join(DIST, path.normalize(rel).replace(/^(\.\.(\/|\\))+/, ''));
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not a file');
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      });
      res.end(body);
    } catch {
      if (!path.extname(rel)) {
        const html = await readFile(path.join(DIST, 'index.html'));
        res.writeHead(200, { 'content-type': MIME['.html'] });
        return res.end(html);
      }
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function launch(chromium) {
  const failures = [];
  for (const channel of CHANNELS) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch (error) {
      failures.push(`${channel ?? 'chromium'}: ${error.message.split('\n')[0]}`);
    }
  }
  throw new Error(`没有可用的浏览器：\n${failures.join('\n')}`);
}

const server = await serveDist();
const browser = await launch(playwright.chromium);
const problems = [];
const checks = [];
const consoleErrors = [];

function fail(name, message) {
  problems.push(`${name}: ${message}`);
}

function pass(message) {
  checks.push(message);
}

function pageUrl(query = '') {
  return `${BASE}${query}`;
}

function watchConsole(page, name) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${name}: ${message.text()}`);
  });
  page.on('pageerror', (error) => consoleErrors.push(`${name}: ${error.message}`));
}

async function inspectVisual(page, name, { strictLabels = false, focus = false } = {}) {
  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) > 0.01 &&
        rect.width > 1 &&
        rect.height > 1
      );
    };
    const labels = [...document.querySelectorAll('.node-label')]
      .filter(visible)
      .map((element) => ({ rect: element.getBoundingClientRect(), text: element.textContent ?? '' }));
    let overlaps = 0;
    const overlapPairs = [];
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i].rect;
        const b = labels[j].rect;
        if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) {
          overlaps += 1;
          overlapPairs.push(`${labels[i].text} × ${labels[j].text}`);
        }
      }
    }

    const statItems = [...document.querySelectorAll('.stats > div')].filter(visible);
    const statRects = statItems.map((element) => element.getBoundingClientRect());
    const statsRect = document.querySelector('.stats')?.getBoundingClientRect();
    const actionsRect = document.querySelector('.topbar-actions')?.getBoundingClientRect();
    const intersects = (a, b) =>
      !!a && !!b && a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const statOverlaps = statRects.reduce(
      (count, rect, index) =>
        count + statRects.slice(index + 1).filter((other) => intersects(rect, other)).length,
      0,
    );
    const laneLabels = [...document.querySelectorAll('.lane-label')].filter(visible);
    const laneLegend = document.querySelector('.atlas-legend');
    const legendItems = [...document.querySelectorAll('.atlas-legend-item')].filter(visible);

    const focusElement = document.querySelector('.focus');
    const alphaScroll = document.querySelector('.alpha-scroll');
    const images = [...document.querySelectorAll('.focus img')].filter(visible);
    const brokenImages = images.filter((image) => !image.complete || image.naturalWidth === 0).length;
    const plateBackgrounds = [
      ...document.querySelectorAll(
        '.focus .plate-open, .focus .plate img, .focus .image-glyph',
      ),
    ]
      .filter(visible)
      .map((element) => getComputedStyle(element).backgroundColor);

    return {
      labelCount: labels.length,
      overlaps,
      overlapPairs: overlapPairs.slice(0, 5),
      statCount: statItems.length,
      statOverlaps,
      statRowSpread:
        statRects.length > 0
          ? Math.max(...statRects.map((rect) => rect.top)) -
            Math.min(...statRects.map((rect) => rect.top))
          : 0,
      statActionsOverlap: intersects(statsRect, actionsRect),
      topbarOverflowX: statsRect ? Math.max(0, Math.round(statsRect.right - window.innerWidth)) : 0,
      laneLabelCount: laneLabels.length,
      legendItemCount: legendItems.length,
      legendVisible: laneLegend ? visible(laneLegend) : false,
      pageOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      graphOverflowX: document.querySelector('.atlas-layout')
        ? document.querySelector('.atlas-layout').scrollWidth - window.innerWidth
        : 0,
      focusOverflowX: focusElement ? focusElement.scrollWidth - focusElement.clientWidth : 0,
      oldNavigation: /(?:MICRO|MACRO|INDEX)/i.test(document.body.innerText),
      forbidden: {
        walk: document.querySelectorAll('.walk, .walk-stage, .walk-controls').length,
        station: document.querySelectorAll('.station-dossier, .track-switcher').length,
      },
      glyphFieldCount: document.querySelectorAll('.glyph-field').length,
      relationRailCount: document.querySelectorAll('.relation-rail').length,
      alphaCellCount: document.querySelectorAll('.alpha-cell').length,
      alphaScroll: alphaScroll
        ? {
            clientWidth: alphaScroll.clientWidth,
            scrollWidth: alphaScroll.scrollWidth,
            clientHeight: alphaScroll.clientHeight,
            scrollHeight: alphaScroll.scrollHeight,
            overflowY: getComputedStyle(alphaScroll).overflowY,
          }
        : null,
      brokenImages,
      plateBackgrounds,
      emptyTrackCopy: document.body.innerText.includes('尚未建立连续字形轨道'),
      focusTop: focusElement?.getBoundingClientRect().top ?? null,
      fieldTop: document.querySelector('.focus-field-column')?.getBoundingClientRect().top ?? null,
      parentTop: document.querySelector('.relation-rail[data-side="parent"]')?.getBoundingClientRect().top ?? null,
      childTop: document.querySelector('.relation-rail[data-side="child"]')?.getBoundingClientRect().top ?? null,
    };
  });

  if (metrics.oldNavigation) fail(name, '界面仍出现 MICRO / MACRO / INDEX');
  if (metrics.forbidden.walk || metrics.forbidden.station) fail(name, '仍存在旧街景或轨道切换器 DOM');
  if (metrics.emptyTrackCopy) fail(name, '仍渲染空轨道提示');
  if (metrics.pageOverflowX > 1 || metrics.focusOverflowX > 1) {
    fail(name, `横向溢出 page=${metrics.pageOverflowX}px focus=${metrics.focusOverflowX}px`);
  }
  if (metrics.statOverlaps > 0) fail(name, `顶栏统计互相重叠 ${metrics.statOverlaps} 处`);
  if (metrics.statActionsOverlap) fail(name, '顶栏统计与导航动作重叠');
  if (metrics.topbarOverflowX > 1) fail(name, `顶栏统计越出视口 ${metrics.topbarOverflowX}px`);
  if (strictLabels && metrics.overlaps > 0) {
    fail(name, `${metrics.overlaps} 处节点标签重叠：${metrics.overlapPairs.join(' / ')}`);
  }
  if (metrics.brokenImages > 0) fail(name, `${metrics.brokenImages} 张图片未加载`);
  const nonWhitePlate = metrics.plateBackgrounds.find((color) => color !== 'rgb(255, 255, 255)');
  if (nonWhitePlate) fail(name, `图版底色不是白色：${nonWhitePlate}`);

  if (focus) {
    if (metrics.relationRailCount !== 2) fail(name, `关系轨数量为 ${metrics.relationRailCount}`);
    if (metrics.alphaScroll) {
      if (metrics.alphaScroll.overflowY === 'auto' || metrics.alphaScroll.overflowY === 'scroll') {
        fail(name, '字母场存在纵向滚动');
      }
    }
  }

  return metrics;
}

async function open(page, query, name) {
  watchConsole(page, name);
  await page.goto(pageUrl(query), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

async function screenshot(page, name, options = {}) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: options.fullPage ?? true,
  });
}

async function runViewport(name, viewport, query = '', options = {}) {
  const page = await browser.newPage({ viewport });
  try {
    await open(page, query, name);
    await screenshot(page, name);
    return await inspectVisual(page, name, options);
  } finally {
    await page.close();
  }
}

try {
  const atlas1440 = await runViewport('01-atlas-1440', { width: 1440, height: 940 }, '', {
    strictLabels: true,
  });
  pass(`全图 1440：${atlas1440.labelCount} 个可见标签，0 重叠`);
  const atlas1280 = await runViewport('02-atlas-1280', { width: 1280, height: 800 }, '', {
    strictLabels: true,
  });
  pass(`全图 1280：${atlas1280.labelCount} 个可见标签，0 重叠`);
  const atlas1920 = await runViewport('03-atlas-1920', { width: 1920, height: 1080 }, '', {
    strictLabels: true,
  });
  pass(`全图 1920：${atlas1920.labelCount} 个可见标签，0 重叠`);

  const greekDesktop = await runViewport(
    '04-node-greek-1440',
    { width: 1440, height: 940 },
    '?script=greek',
    { focus: true },
  );
  if (greekDesktop.glyphFieldCount !== 1) fail('希腊节点', '缺少统一字形场');
  if (greekDesktop.alphaCellCount < 30) fail('希腊节点', `字母格仅 ${greekDesktop.alphaCellCount} 个`);
  pass(`希腊节点：${greekDesktop.alphaCellCount} 个字母格，双关系轨`);

  await runViewport('05-node-greek-1280', { width: 1280, height: 800 }, '?script=greek', {
    focus: true,
  });
  await runViewport('06-node-greek-1920', { width: 1920, height: 1080 }, '?script=greek', {
    focus: true,
  });

  await runViewport('07-node-aramaic', { width: 1440, height: 940 }, '?script=aramaic', {
    focus: true,
  });
  await runViewport('08-node-brahmi', { width: 1440, height: 940 }, '?script=brahmi', {
    focus: true,
  });
  await runViewport('09-node-kawi', { width: 1440, height: 940 }, '?script=kawi', {
    focus: true,
  });
  await runViewport('10-node-chinese', { width: 1440, height: 940 }, '?script=chinese-regular', {
    focus: true,
  });
  await runViewport('11-node-jurchen', { width: 1440, height: 940 }, '?script=jurchen', {
    focus: true,
  });
  await runViewport('12-node-egyptian', { width: 1440, height: 940 }, '?script=egyptian', {
    focus: true,
  });
  await runViewport(
    '13-node-libyco-berber',
    { width: 1440, height: 940 },
    '?script=libyco-berber',
    { focus: true },
  );

  const gaudiPage = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  try {
    await open(gaudiPage, '?script=gaudi', '高迪文图版');
    const gaudiMetrics = await inspectVisual(gaudiPage, '高迪文图版', { focus: true });
    if (gaudiMetrics.glyphFieldCount !== 1) fail('高迪文图版', '缺少统一字形场');
    if ((await gaudiPage.locator('.focus .plate img').count()) === 0) {
      fail('高迪文图版', '缺少写本图版');
    }
    await screenshot(gaudiPage, '14-node-gaudi-plate');
  } finally {
    await gaudiPage.close();
  }

  const transitionPage = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  try {
    await open(transitionPage, '?script=greek', '节点切换');
    await transitionPage.locator('.focus-workbench').scrollIntoViewIfNeeded();
    await transitionPage.waitForTimeout(250);
    const beforeScroll = await transitionPage.locator('.focus').evaluate((element) => element.scrollTop);
    const beforeGeometry = await transitionPage.evaluate(() => {
      const grid = document.querySelector('.alpha-grid');
      const field = document.querySelector('.focus-field-column');
      const status = document.querySelector('.alpha-status');
      return {
        gridTop:
          grid && field
            ? grid.getBoundingClientRect().top - field.getBoundingClientRect().top
            : null,
        statusHeight: status?.getBoundingClientRect().height ?? null,
      };
    });
    const coptic = transitionPage
      .locator('.relation-rail[data-side="child"] .relation-link')
      .filter({ hasText: '科普特' })
      .first();
    if ((await coptic.count()) === 0) {
      fail('节点切换', '希腊节点中没有科普特去向');
    } else {
      await coptic.click();
      await transitionPage.waitForTimeout(80);
      const morphing = await transitionPage.locator('.alpha-field.is-morphing').count();
      const morphStatus = await transitionPage.locator('.alpha-status').textContent();
      const duringGeometry = await transitionPage.evaluate(() => {
        const grid = document.querySelector('.alpha-grid');
        const field = document.querySelector('.focus-field-column');
        const status = document.querySelector('.alpha-status');
        return {
          gridTop:
            grid && field
              ? grid.getBoundingClientRect().top - field.getBoundingClientRect().top
              : null,
          statusHeight: status?.getBoundingClientRect().height ?? null,
        };
      });
      if (morphing === 0) fail('节点切换', '有共享槽位的直系关系未启动整表形变');
      if (!morphStatus?.includes('整表变形中')) {
        fail('节点切换', `变形中状态异常：${morphStatus ?? '空'}`);
      }
      if (/同源|新增|消失/.test(morphStatus ?? '')) {
        fail('节点切换', '变形动画尚未结束就显示了增删统计');
      }
      if (
        beforeGeometry.gridTop === null ||
        duringGeometry.gridTop === null ||
        Math.abs(beforeGeometry.gridTop - duringGeometry.gridTop) > 1.5 ||
        beforeGeometry.statusHeight === null ||
        duringGeometry.statusHeight === null ||
        Math.abs(beforeGeometry.statusHeight - duringGeometry.statusHeight) > 1.5
      ) {
        fail('节点切换', '变形开始后字形场或状态行发生布局位移');
      }
      await transitionPage.waitForTimeout(1100);
      const finalStatus = await transitionPage.locator('.alpha-status').textContent();
      const finalGeometry = await transitionPage.evaluate(() => {
        const grid = document.querySelector('.alpha-grid');
        const field = document.querySelector('.focus-field-column');
        const status = document.querySelector('.alpha-status');
        return {
          gridTop:
            grid && field
              ? grid.getBoundingClientRect().top - field.getBoundingClientRect().top
              : null,
          statusHeight: status?.getBoundingClientRect().height ?? null,
        };
      });
      if (!finalStatus?.includes('同源') || !finalStatus.includes('新增') || !finalStatus.includes('消失')) {
        fail('节点切换', `变形完成后未显示稳定统计：${finalStatus ?? '空'}`);
      }
      if (
        beforeGeometry.gridTop === null ||
        finalGeometry.gridTop === null ||
        Math.abs(beforeGeometry.gridTop - finalGeometry.gridTop) > 1.5 ||
        beforeGeometry.statusHeight === null ||
        finalGeometry.statusHeight === null ||
        Math.abs(beforeGeometry.statusHeight - finalGeometry.statusHeight) > 1.5
      ) {
        fail('节点切换', '变形结束后字形场或状态行发生布局位移');
      }
      const afterState = await transitionPage.locator('.focus').evaluate((element) => ({
        scrollTop: element.scrollTop,
        maxScroll: element.scrollHeight - element.clientHeight,
      }));
      const expectedScroll = Math.min(beforeScroll, afterState.maxScroll);
      if (Math.abs(afterState.scrollTop - expectedScroll) > 3) {
        fail(
          '节点切换',
          `切换后滚动位置漂移 ${Math.abs(afterState.scrollTop - expectedScroll)}px（${beforeScroll} → ${afterState.scrollTop}，上限 ${afterState.maxScroll}）`,
        );
      }
      if (!transitionPage.url().includes('?script=coptic')) fail('节点切换', 'URL 未更新为单一 script 参数');
      await transitionPage.waitForTimeout(400);
      const persistentStatus = await transitionPage.locator('.alpha-status').textContent();
      if (persistentStatus !== finalStatus) fail('节点切换', '增删统计未在动画结束后持续显示');
      await screenshot(transitionPage, '15-node-morph-coptic');
    }
  } finally {
    await transitionPage.close();
  }

  const crossfadePage = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  try {
    await open(crossfadePage, '?script=egyptian', '交叉淡变切换');
    const hieratic = crossfadePage
      .locator('.relation-rail[data-side="child"] .relation-link')
      .filter({ hasText: '僧侣体' })
      .first();
    if ((await hieratic.count()) === 0) {
      fail('交叉淡变切换', '埃及圣书体节点中没有僧侣体去向');
    } else {
      await hieratic.click();
      await crossfadePage.waitForTimeout(60);
      const staleCount = await crossfadePage.locator('.xfade-stale').count();
      if (staleCount === 0) fail('交叉淡变切换', '无共享槽位的关系未保留上一字形场进行交叉淡变');
      await screenshot(crossfadePage, '16-node-crossfade-hieratic');
    }
  } finally {
    await crossfadePage.close();
  }

  const mobile = await runViewport(
    '17-mobile-node-greek',
    { width: 420, height: 860 },
    '?script=greek',
    { focus: true },
  );
  if (mobile.fieldTop === null || mobile.parentTop === null || mobile.fieldTop > mobile.parentTop) {
    fail('移动端节点', '中央字形场没有排在来源之前');
  }
  pass('移动端节点：字形场前置，横向溢出为 0');

  const mobileClick = await browser.newPage({ viewport: { width: 420, height: 860 } });
  try {
    await open(mobileClick, '?script=greek', '移动端关系切换');
    await mobileClick.locator('.relation-rail[data-side="child"]').scrollIntoViewIfNeeded();
    await mobileClick.waitForTimeout(200);
    const before = await mobileClick.locator('.focus').evaluate((element) => element.scrollTop);
    const relation = mobileClick
      .locator('.relation-rail[data-side="child"] .relation-link')
      .filter({ hasText: '科普特' })
      .first();
    if ((await relation.count()) === 0) {
      fail('移动端关系切换', '希腊节点中没有科普特去向');
    } else {
      await relation.click();
      await mobileClick.waitForTimeout(150);
      const afterState = await mobileClick.locator('.focus').evaluate((element) => ({
        scrollTop: element.scrollTop,
        maxScroll: element.scrollHeight - element.clientHeight,
      }));
      const expectedScroll = Math.min(before, afterState.maxScroll);
      if (Math.abs(afterState.scrollTop - expectedScroll) > 3) {
        fail(
          '移动端关系切换',
          `切换后滚动位置漂移 ${Math.abs(afterState.scrollTop - expectedScroll)}px（${before} → ${afterState.scrollTop}，上限 ${afterState.maxScroll}）`,
        );
      }
    }
    await screenshot(mobileClick, '18-mobile-node-switched');
  } finally {
    await mobileClick.close();
  }

  for (const width of [320, 375, 420]) {
    const atlas = await runViewport(
      `19-mobile-atlas-${width}`,
      { width, height: 860 },
      '',
      { strictLabels: true },
    );
    if (atlas.statCount !== 4) fail(`移动端全图 ${width}px`, `馆藏统计仅 ${atlas.statCount} 项`);
    if (atlas.statRowSpread > 3) {
      fail(`移动端全图 ${width}px`, `馆藏统计未保持同一行（顶差 ${atlas.statRowSpread}px）`);
    }
    if (atlas.laneLabelCount !== 0 || !atlas.legendVisible || atlas.legendItemCount === 0) {
      fail(
        `移动端全图 ${width}px`,
        `谱系陈设未切换为颜色脊与图例：标签 ${atlas.laneLabelCount}，图例 ${atlas.legendItemCount}`,
      );
    }
    pass(`移动端全图 ${width}px：四组馆藏、下方 ${atlas.legendItemCount} 项谱系图例`);
  }
  await runViewport('20-atlas-1024', { width: 1024, height: 768 }, '', {
    strictLabels: true,
  });
  await runViewport('21-node-greek-tablet', { width: 768, height: 1024 }, '?script=greek', {
    focus: true,
  });

  const catalog = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  try {
    await open(catalog, '', '检索层');
    await catalog.getByRole('button', { name: /查找文字/ }).click();
    await catalog.waitForTimeout(250);
    await screenshot(catalog, '22-catalog');
    if ((await catalog.locator('.catalog').count()) !== 1) fail('检索层', '检索浮层未打开');
    const missingIcons = await catalog.locator('.catalog-card').evaluateAll((cards) =>
      cards
        .filter((card) => !card.querySelector('.catalog-glyph img, .catalog-glyph .font-glyph'))
        .map((card) => card.querySelector('.catalog-card-title strong')?.textContent ?? '未知条目'),
    );
    if (missingIcons.length) fail('检索层', `${missingIcons.length} 条记录没有图标：${missingIcons.join('、')}`);
    await catalog.getByPlaceholder('名称、英文名、国家、地区或谱系').fill('高迪文');
    await catalog.waitForTimeout(300);
    const gaudiCard = catalog.locator('.catalog-card').filter({ hasText: '高迪文' });
    const gaudiThumb = gaudiCard.locator('.catalog-glyph img');
    if ((await gaudiCard.count()) !== 1 || !(await gaudiThumb.evaluate((image) => image.complete && image.naturalWidth > 0))) {
      fail('检索层', '高迪文没有加载第一幅图版');
    }
    await screenshot(catalog, '23-catalog-gaudi');
  } finally {
    await catalog.close();
  }

  if (consoleErrors.length) {
    for (const message of consoleErrors) fail('浏览器控制台', message);
  } else {
    pass('浏览器控制台与页面错误为 0');
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(`\n检查结果\n${checks.map((line) => `· ${line}`).join('\n')}`);
if (problems.length) {
  console.error(`\n发现 ${problems.length} 个问题：\n${problems.map((line) => `· ${line}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`\n全部检查通过。截图位于 ${OUT}`);
}
