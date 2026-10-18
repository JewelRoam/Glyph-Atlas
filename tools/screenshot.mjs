#!/usr/bin/env node
/**
 * 视觉校对：构建产物 → 起一个本地静态服务 → 用 Playwright 把每一屏拍下来。
 *
 * 这不是构建的一部分。Playwright 与浏览器体积都很大（浏览器约 300MB），
 * 放进 devDependencies 会让 CI 每次安装都替所有人下载一遍，
 * 所以这里只在真正需要看图时装一次：
 *
 *   npm run build
 *   npm i --no-save playwright && npx playwright install chromium
 *   npm run shots [输出目录]
 *
 * 默认优先用本机已装的浏览器（Edge / Chrome），找不到才用 Playwright 自带的
 * Chromium，这样在没跑过 install 的机器上也能用。
 *
 * 这里不用 `vite preview`：构建产物挂在仓库名前缀下（见 vite.config.ts 的 base），
 * 而 vite preview 只把 dist 挂在根路径上，`/Glyph-Atlas/assets/*.js` 会落到
 * SPA 回退、以 HTML 返回，页面白屏。静态服务直接照 GitHub Pages 的挂法来伺服，
 * 拍到的就是真正上线的那一份。
 */
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'work/shots');
const PORT = Number(process.env.SHOT_PORT ?? 4321);
/** 部署前缀（vite.config.ts 的 base）；本地想拍根路径时用 SHOT_BASE=/ 覆盖 */
const BASE_PATH = process.env.SHOT_BASE ?? '/Glyph-Atlas/';
const BASE = `http://localhost:${PORT}${BASE_PATH}`;
const DIST = path.resolve('dist');
const VIEWPORT = { width: 1440, height: 900 };
/** Playwright 的 channel 名称 → 可读名字，按顺序尝试 */
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

/** 照 GitHub Pages 项目站点的方式伺服 dist：一切都在 BASE_PATH 之下 */
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
      // 单页应用：没有扩展名的路径回 index.html，其余老老实实 404
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

/** 一屏拍一张，顺便收集 console 报错——看不见的报错比拍糊更值得知道 */
async function shoot(name, { width = VIEWPORT.width, height = VIEWPORT.height, steps = [] } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${name}] console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  for (const step of steps) await step(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  await page.close();
  console.log(`· ${name}.png`);
}

const tab = (label) => async (page) => {
  await page.getByRole('button', { name: new RegExp(label) }).click();
  // MICRO 要等本地轮廓包与字体到位，不然拍到的是骨架
  await page.waitForTimeout(label === 'MICRO' ? 1600 : 700);
};

try {
  await shoot('01-macro');
  await shoot('02-micro', { steps: [tab('MICRO')] });
  await shoot('03-index', { steps: [tab('INDEX')] });
  // 字母场铺开时舞台会被压矮，这一屏专门盯字形与展签有没有叠在一起
  await shoot('04-micro-field', {
    steps: [
      tab('MICRO'),
      async (page) => {
        await page.locator('.walk-street input[type=range]').fill('2.5');
        await page.waitForTimeout(700);
      },
    ],
  });
  await shoot('05-detail', {
    steps: [
      async (page) => {
        await page.locator('.node').nth(6).click({ force: true });
        await page.waitForTimeout(600);
      },
    ],
  });
  await shoot('06-mobile', { width: 420, height: 860 });
  await shoot('07-mobile-micro', { width: 420, height: 860, steps: [tab('MICRO')] });
  // 窄屏 + 字母场铺开是最挤的一种组合，单独留一屏盯重叠
  await shoot('08-mobile-micro-field', {
    width: 420,
    height: 860,
    steps: [
      tab('MICRO'),
      async (page) => {
        await page.locator('.walk-street input[type=range]').fill('2.5');
        await page.waitForTimeout(700);
      },
    ],
  });
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

if (problems.length) {
  console.error(`\n发现 ${problems.length} 条前端报错：\n${problems.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`\n没有 console 报错。图在 ${OUT}`);
}
