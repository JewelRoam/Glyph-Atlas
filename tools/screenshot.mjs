#!/usr/bin/env node
/**
 * 视觉回归：把构建产物按 GitHub Pages 的路径挂起来，用真实浏览器检查全图、
 * 体系焦点、检索层与移动端，并把结果写到 work/shots。
 *
 * Playwright 体积较大，只在需要拍图时按需安装：
 *
 *   npm run build
 *   npm i --no-save playwright && npx playwright install chromium
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
    const file = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
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
    } catch (err) {
      failures.push(`${channel ?? 'chromium'}: ${err.message.split('\n')[0]}`);
    }
  }
  throw new Error(`没有可用的浏览器：\n${failures.join('\n')}`);
}

const server = await serveDist();
const browser = await launch(playwright.chromium);
const problems = [];
const checks = [];

const url = (query = '') => `${BASE}${query}`;

async function pageMetrics(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
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
      .map((el) => ({ rect: el.getBoundingClientRect(), text: el.textContent ?? '' }));
    const walkStage = document.querySelector('.walk-stage');
    const walkCaption = document.querySelector('.walk-caption');
    const walkCaptionTitle = document.querySelector('.walk-caption-title');
    const boardGlyphs = [
      ...document.querySelectorAll(
        '.detail-board .font-glyph, .detail-board .image-glyph, .detail-board .plate',
      ),
    ].filter(visible);
    const boardImageContainers = [
      ...document.querySelectorAll(
        '.detail-board .image-glyph, .detail-board .plate, .detail-board .plate-open',
      ),
    ].filter(visible);
    const boardImages = [...document.querySelectorAll('.detail-board img')].filter(visible);
    let overlaps = 0;
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i].rect;
        const b = labels[j].rect;
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
          overlaps += 1;
        }
      }
    }
    return {
      overflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      labels: labels.length,
      labelOverlaps: overlaps,
      walk: Boolean(document.querySelector('.walk')),
      stageWidth: walkStage?.getBoundingClientRect().width ?? 0,
      captionWidth: walkCaption?.getBoundingClientRect().width ?? 0,
      captionTitleWidth: walkCaptionTitle?.getBoundingClientRect().width ?? 0,
      focusScrollTop: document.querySelector('.focus')?.scrollTop ?? 0,
      alpha: Boolean(document.querySelector('.alpha-field')),
      boardGlyphs: boardGlyphs.length,
      boardImages: boardImages.length,
      brokenBoardImages: boardImages.filter((img) => !img.complete || img.naturalWidth === 0).length,
      nonWhiteBoardVisuals: boardImageContainers.filter(
        (el) => !getComputedStyle(el).backgroundColor.match(/^rgba?\(255, 255, 255(?:, 1)?\)$/),
      ).length,
    };
  });
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1100);
}

async function shoot(
  name,
  {
    width = 1440,
    height = 900,
    query = '',
    steps = [],
    fullPage = false,
    strictLabels = false,
    expectWalk = false,
    checkBoard = false,
    expectImages = false,
  } = {},
) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`[${name}] console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`[${name}] pageerror: ${error.message}`));
  await page.goto(url(query), { waitUntil: 'networkidle' });
  await settle(page);
  for (const step of steps) await step(page);

  const metrics = await pageMetrics(page);
  if (metrics.overflowX > 0) {
    problems.push(`[${name}] 横向溢出 ${metrics.overflowX}px`);
  }
  if (strictLabels && metrics.labelOverlaps > 0) {
    problems.push(`[${name}] 节点标签重叠 ${metrics.labelOverlaps} 处`);
  }
  if (expectWalk) {
    if (!metrics.walk) problems.push(`[${name}] 缺少字形舞台`);
    if (metrics.stageWidth < 260) problems.push(`[${name}] 字形舞台宽度仅 ${metrics.stageWidth}px`);
    if (metrics.captionWidth < 200) problems.push(`[${name}] 展签宽度仅 ${metrics.captionWidth}px`);
    if (metrics.captionTitleWidth < 80) {
      problems.push(`[${name}] 展签标题宽度仅 ${metrics.captionTitleWidth}px`);
    }
  }
  if (checkBoard) {
    if (!metrics.boardGlyphs) problems.push(`[${name}] 字形图版没有可见字形`);
    if (metrics.brokenBoardImages) {
      problems.push(`[${name}] ${metrics.brokenBoardImages} 张字形图版加载失败`);
    }
    if (metrics.nonWhiteBoardVisuals) {
      problems.push(`[${name}] ${metrics.nonWhiteBoardVisuals} 个图片字形不是白底`);
    }
  }
  if (expectImages && !metrics.boardImages) {
    problems.push(`[${name}] 字形图版没有可检查的图片`);
  }
  checks.push(
    `${name}: ${width}×${height} · 溢出 ${metrics.overflowX}px · 标签 ${metrics.labels}/${metrics.labelOverlaps} 重叠 · 舞台 ${Math.round(metrics.stageWidth)}px · 展签 ${Math.round(metrics.captionWidth)}px · alpha ${metrics.alpha ? '有' : '无'}`,
  );
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  await page.close();
  console.log(`· ${name}.png`);
}

async function openCatalog(page) {
  await page.getByRole('button', { name: /查找文字/ }).click();
  await page.waitForTimeout(350);
}

async function inspectWalk(page) {
  const next = page.getByRole('button', { name: '下一个' });
  if (!(await next.count())) throw new Error('焦点页没有“下一个”按钮');
  const range = page.locator('.walk-street input[type=range]');
  if (!(await range.count())) throw new Error('焦点页没有站点尺');

  const heading = page.locator('.focus-heading h1');
  const focusSystem = (await heading.textContent())?.trim();
  const stationBefore = Number(await range.inputValue());
  await page.locator('.focus').evaluate((el) => {
    const controls = el.querySelector('.walk-controls');
    if (!controls) throw new Error('找不到字形轨道按键');
    const offset = controls.getBoundingClientRect().top - el.getBoundingClientRect().top;
    // 测试定位需要精确落点；页面连接中的平滑滚动会让记录值仍在变化。
    el.style.scrollBehavior = 'auto';
    el.scrollTop = Math.max(0, el.scrollTop + offset - 220);
  });
  await page.waitForTimeout(120);
  const scrollBefore = await page.locator('.focus').evaluate((el) => el.scrollTop);
  if (scrollBefore < 20) throw new Error('回归测试没有把字形轨道滚入视口');

  await next.click();
  await page.waitForTimeout(1250);
  const stationAfter = Number(await range.inputValue());
  const scrollAfter = await page.locator('.focus').evaluate((el) => {
    const top = el.scrollTop;
    el.style.removeProperty('scroll-behavior');
    return top;
  });
  const focusSystemAfter = (await heading.textContent())?.trim();

  if (stationAfter <= stationBefore) throw new Error('“下一个”没有推进站点');
  if (focusSystemAfter !== focusSystem) {
    throw new Error(`沿线换站时体系焦点从“${focusSystem}”跳成了“${focusSystemAfter}”`);
  }
  if (Math.abs(scrollAfter - scrollBefore) > 3) {
    throw new Error(`沿线换站时页面从 ${scrollBefore}px 跳到了 ${scrollAfter}px`);
  }
  if (new URL(page.url()).searchParams.get('script') !== 'greek') {
    throw new Error('沿线换站时深链的体系焦点被改写');
  }
}

async function inspectNoTrack(page) {
  if (await page.getByText('尚未建立连续字形轨道', { exact: true }).count()) {
    throw new Error('无连续轨道的体系仍渲染了空轨道提示');
  }
  if (await page.locator('.focus-stage-column').count()) {
    throw new Error('无连续轨道的体系仍渲染了空舞台栏');
  }
}

async function resetFocusScroll(page) {
  await page.locator('.focus').evaluate((el) => el.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(180);
}

async function switchTrack(page) {
  const buttons = page.locator('.track-switcher button');
  const count = await buttons.count();
  if (count < 2) throw new Error('该体系没有可切换的第二条轨道');
  const before = (await page.locator('.track-switcher button.active').textContent())?.trim();
  await buttons.nth(1).click();
  await page.waitForTimeout(1050);
  const after = (await page.locator('.track-switcher button.active').textContent())?.trim();
  if (!after || after === before) throw new Error('轨道切换没有生效');
  await resetFocusScroll(page);
}

async function inspectFocusContract(page) {
  if (await page.getByRole('button', { name: /播放|暂停/ }).count()) {
    throw new Error('焦点页仍显示自动播放控件');
  }

  const stage = page.locator('.walk-stage');
  const range = page.locator('.walk-street input[type=range]');
  if (!(await stage.count()) || !(await range.count())) throw new Error('焦点页缺少字形舞台');

  const before = Number(await range.inputValue());
  await stage.scrollIntoViewIfNeeded();
  let box = await stage.boundingBox();
  if (!box) throw new Error('字形舞台不可见');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(220);
  const afterVertical = Number(await range.inputValue());
  if (Math.abs(afterVertical - before) > 0.001) {
    throw new Error('纵向滚轮仍会推进字形轨道');
  }

  const max = Number(await range.getAttribute('max'));
  const horizontalDirection = before >= max - 0.001 ? -1 : 1;
  await stage.scrollIntoViewIfNeeded();
  box = await stage.boundingBox();
  if (!box) throw new Error('字形舞台不可见');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(horizontalDirection * 180, 0);
  await page.waitForTimeout(220);
  const afterHorizontal = Number(await range.inputValue());
  if (Math.abs(afterHorizontal - afterVertical) < 0.001) {
    throw new Error('横向滚轮没有推进字形轨道');
  }

  const dossier = await page.locator('.focus-dossier').evaluate((el) => {
    const overflowY = getComputedStyle(el).overflowY;
    el.scrollTop = 64;
    const scrollTop = el.scrollTop;
    el.scrollTop = 0;
    return { overflowY, scrollTop };
  });
  if (dossier.overflowY === 'auto' || dossier.overflowY === 'scroll' || dossier.scrollTop !== 0) {
    throw new Error('右侧内容仍形成独立纵向滚动区');
  }

  const alpha = await page.locator('.alpha-scroll').evaluate((el) => ({
    overflowX: getComputedStyle(el).overflowX,
    overflowY: getComputedStyle(el).overflowY,
  }));
  if (alpha.overflowX !== 'auto' || alpha.overflowY !== 'hidden') {
    throw new Error(`字母场滚动方向错误：${alpha.overflowX} / ${alpha.overflowY}`);
  }

  await resetFocusScroll(page);
}

async function scrollFocusTo(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
}

try {
  await shoot('01-atlas-1440', { strictLabels: true });
  await shoot('02-atlas-1280', { width: 1280, height: 800, strictLabels: true });
  await shoot('03-atlas-1920', { width: 1920, height: 1080, strictLabels: true });
  await shoot('04-catalog', { steps: [openCatalog] });

  await shoot('05-focus-greek-1440', {
    query: '?script=greek&lineage=aleph&stop=greek',
    expectWalk: true,
  });
  await shoot('06-focus-greek-1280', {
    width: 1280,
    height: 800,
    query: '?script=greek&lineage=aleph&stop=greek',
    expectWalk: true,
  });
  await shoot('07-focus-greek-1920', {
    width: 1920,
    height: 1080,
    query: '?script=greek&lineage=aleph&stop=greek',
    expectWalk: true,
  });
  await shoot('08-focus-greek-next', {
    query: '?script=greek&lineage=aleph&stop=greek',
    steps: [inspectWalk, resetFocusScroll],
    expectWalk: true,
  });
  await shoot('09-focus-track-switched', {
    query: '?script=latin&lineage=italy&stop=latin',
    steps: [switchTrack],
    expectWalk: true,
  });
  await shoot('10-focus-interactions', {
    query: '?script=greek&lineage=aleph&stop=greek',
    steps: [inspectFocusContract],
    expectWalk: true,
  });
  await shoot('11-focus-board-greek', {
    query: '?script=greek&lineage=aleph&stop=greek',
    steps: [async (page) => scrollFocusTo(page, '.detail-board')],
    expectWalk: true,
  });
  await shoot('12-focus-chinese', {
    query: '?script=chinese-regular&lineage=chinese-evolution&stop=chinese-regular',
    expectWalk: true,
  });
  await shoot('13-focus-board-chinese', {
    query: '?script=chinese-regular&lineage=chinese-evolution&stop=chinese-regular',
    steps: [async (page) => scrollFocusTo(page, '.detail-board')],
    checkBoard: true,
  });
  await shoot('14-focus-board-egyptian', {
    query: '?script=egyptian&lineage=egypt-cursive&stop=egyptian',
    steps: [async (page) => scrollFocusTo(page, '.detail-board')],
    checkBoard: true,
  });

  await shoot('15-mobile-atlas', { width: 420, height: 860, strictLabels: true });
  await shoot('16-mobile-focus', {
    width: 420,
    height: 860,
    query: '?script=greek&lineage=aleph&stop=greek',
    expectWalk: true,
  });
  await shoot('17-mobile-focus-next', {
    width: 420,
    height: 860,
    query: '?script=greek&lineage=aleph&stop=greek',
    steps: [inspectWalk, resetFocusScroll],
    expectWalk: true,
  });
  await shoot('18-mobile-focus-board', {
    width: 420,
    height: 860,
    query: '?script=greek&lineage=aleph&stop=greek',
    steps: [async (page) => scrollFocusTo(page, '.detail-board')],
  });
  await shoot('19-mobile-catalog', {
    width: 420,
    height: 860,
    steps: [openCatalog],
  });

  await shoot('20-focus-board-jurchen', {
    width: 1024,
    height: 768,
    query: '?script=jurchen',
    steps: [inspectNoTrack, async (page) => scrollFocusTo(page, '.detail-board')],
    checkBoard: true,
    expectImages: true,
  });
  await shoot('21-atlas-1024', {
    width: 1024,
    height: 768,
    strictLabels: true,
  });
  await shoot('22-focus-greek-1024', {
    width: 1024,
    height: 768,
    query: '?script=greek&lineage=aleph&stop=greek',
    expectWalk: true,
  });
  await shoot('23-catalog-1024', {
    width: 1024,
    height: 768,
    steps: [openCatalog],
  });
  await shoot('24-atlas-tablet-portrait', {
    width: 768,
    height: 1024,
    strictLabels: true,
  });
  await shoot('25-focus-greek-tablet-portrait', {
    width: 768,
    height: 1024,
    query: '?script=greek&lineage=aleph&stop=greek',
    expectWalk: true,
  });
  await shoot('26-focus-alpha-field', {
    query: '?script=greek&lineage=aleph&stop=greek',
    steps: [async (page) => scrollFocusTo(page, '.alpha-field')],
    expectWalk: true,
  });
  await shoot('27-focus-no-track-1440', {
    query: '?script=jurchen',
    steps: [inspectNoTrack],
  });
  await shoot('28-focus-no-track-mobile', {
    width: 420,
    height: 860,
    query: '?script=jurchen',
    steps: [inspectNoTrack],
  });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(`\n视口检查\n${checks.map((line) => `· ${line}`).join('\n')}`);
if (problems.length) {
  console.error(`\n发现 ${problems.length} 个问题：\n${problems.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`\n全部检查通过。图在 ${OUT}`);
}
