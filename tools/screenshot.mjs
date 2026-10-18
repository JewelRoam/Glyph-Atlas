#!/usr/bin/env node
/**
 * 视觉校对：构建产物 → 起一个静态预览 → 用 Playwright 把每一屏拍下来。
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
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'work/shots');
const PORT = Number(process.env.SHOT_PORT ?? 4321);
const BASE = `http://localhost:${PORT}`;
const VIEWPORT = { width: 1440, height: 900 };
/** Playwright 的 channel 名称 → 可读名字，按顺序尝试 */
const CHANNELS = ['msedge', 'chrome', null];

let playwright;
try {
  playwright = await import('playwright');
} catch {
  console.error(
    '缺少 Playwright。先安装再跑：\n  npm i --no-save playwright && npx playwright install chromium',
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

/** 起 vite preview，等端口真的可用再返回 */
async function serve() {
  const child = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return child;
    } catch {
      /* 还没起来 */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error(`预览服务 30 秒内没起来：${BASE}`);
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

const server = await serve();
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
  await page.waitForTimeout(label === '时间街景' ? 1400 : 700);
};

try {
  await shoot('01-atlas');
  await shoot('02-walk', { steps: [tab('时间街景')] });
  await shoot('03-table', { steps: [tab('文字总表')] });
  await shoot('04-about', { steps: [tab('关于')] });
  await shoot('05-detail', {
    steps: [
      async (page) => {
        await page.locator('.node').nth(6).click({ force: true });
        await page.waitForTimeout(600);
      },
    ],
  });
  await shoot('06-mobile', { width: 420, height: 860 });
} finally {
  await browser.close();
  server.kill();
}

if (problems.length) {
  console.error(`\n发现 ${problems.length} 条前端报错：\n${problems.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`\n没有 console 报错。图在 ${OUT}`);
}
