#!/usr/bin/env node
// Measure a page: computed styles and bounding boxes of chosen elements,
// sampled every N px of scroll, at several viewport widths.
// Works the same on the live site and on localhost, so tools/diff.mjs can compare them.
//
//   node tools/measure.mjs --url <url> --selectors <file.json | "css,css"> [options]
//
// Options
//   --url <url>            page to measure (required)
//   --selectors <x>        JSON file or comma list of CSS selectors (required unless --inventory)
//   --side live|local      which selector to use when the JSON gives {live, local} pairs (default: live)
//   --widths <list>        comma list from 375,768,1024,1440,1920,2560,landscape
//                          (default: all seven) or WIDTHxHEIGHT, e.g. 1494x833
//   --step <px>            scroll step between samples (default 50)
//   --from <px> --to <px>  scroll range to sample (default: 0 to the bottom of the page)
//   --wait <ms>            wait after load, e.g. for the intro (default 6000)
//   --settle <ms>          wait after each scroll before sampling (default 120)
//   --props <list>         comma list of CSS properties (default: the list below)
//   --all                  record every match of each selector, not just the first
//   --visible              skip matches that aren't rendered (display:none or 0×0), e.g. hidden mobile/desktop twins
//   --hide <css>           set display:none on these elements before measuring
//   --css <text>           inject this stylesheet before page scripts run (e.g. zero a variable)
//   --reduced-motion       emulate prefers-reduced-motion: reduce
//   --shots <px>           save a screenshot every N px of scroll (0 = none, default 0)
//   --inventory            also record every distinct text style on the page at scroll 0
//   --label <name>         output folder name (default: host name)
//   --out <dir>            output root (default .measure)
//
// Selectors JSON: { "name": "css" } or { "name": { "live": "css", "local": "css" } }
// Output: <out>/<label>/<width>.json (and screenshots next to it).
import { chromium } from 'playwright-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// --css is injected before any page script runs, so layout code (e.g. ScrollTrigger pins, which freeze
// computed padding into inline styles) sees it from the first frame.
const injectCss = (css) => {
  const add = () => { if (document.getElementById('__measure_css')) return; const s = document.createElement('style'); s.id = '__measure_css'; s.textContent = css; (document.head || document.documentElement).appendChild(s); };
  if (document.documentElement) add();
  document.addEventListener('DOMContentLoaded', () => { document.getElementById('__measure_css')?.remove(); add(); });
};

const VIEWPORTS = {
  375: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  768: { width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  1024: { width: 1024, height: 768, deviceScaleFactor: 1 },
  1440: { width: 1440, height: 900, deviceScaleFactor: 1 },
  1920: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  2560: { width: 2560, height: 1440, deviceScaleFactor: 1 },
  landscape: { width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
};
const DEFAULT_PROPS = [
  'display', 'position', 'visibility', 'opacity', 'z-index', 'transform', 'filter', 'mix-blend-mode',
  'color', 'background-color', 'background-image',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-align',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-radius', 'box-shadow', 'object-fit', 'object-position', 'clip-path',
];

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const url = opt('url');
if (!url || (!opt('selectors') && !flag('inventory'))) {
  console.error('usage: node tools/measure.mjs --url <url> --selectors <file.json|"css,css"> [--widths ...] (see header)');
  process.exit(1);
}
const side = opt('side', 'live');
const step = Number(opt('step', 50));
const from = Number(opt('from', 0));
const to = opt('to') === undefined ? Infinity : Number(opt('to'));
const wait = Number(opt('wait', 6000));
const settle = Number(opt('settle', 120));
const props = opt('props') ? opt('props').split(',') : DEFAULT_PROPS;
const shots = Number(opt('shots', 0));
const label = opt('label', new URL(url).host.replace(/[:]/g, '_'));
const outDir = resolve(opt('out', '.measure'), label);

async function loadSelectors(s) {
  if (!s) return {};
  if (s.endsWith('.json') || existsSync(s)) {
    const raw = JSON.parse(await readFile(s, 'utf8'));
    const map = {};
    for (const [name, v] of Object.entries(raw)) {
      if (name.startsWith('//')) continue; // comments
      const sel = typeof v === 'string' ? v : v[side];
      if (sel) map[name] = sel;
    }
    return map;
  }
  return Object.fromEntries(s.split(',').map((x) => [x.trim(), x.trim()]));
}
const selectors = await loadSelectors(opt('selectors'));

function viewportFor(w) {
  if (VIEWPORTS[w]) return { name: String(w), ...VIEWPORTS[w] };
  const m = /^(\d+)x(\d+)$/.exec(w);
  if (m) return { name: w, width: +m[1], height: +m[2], deviceScaleFactor: 1 };
  throw new Error(`unknown width "${w}"`);
}
const widths = (opt('widths') || Object.keys(VIEWPORTS).join(',')).split(',').map(viewportFor);

// ---------- in-page functions ----------
function sample({ selectors, props, all, visible }) {
  const r2 = (n) => Math.round(n * 100) / 100;
  const out = {};
  for (const [name, sel] of Object.entries(selectors)) {
    let els;
    try {
      els = [...document.querySelectorAll(sel)];
    } catch {
      out[name] = { error: 'bad selector' };
      continue;
    }
    if (visible) els = els.filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 || b.height > 0; });
    if (!all) els = els.slice(0, 1);
    out[name] = els.map((el) => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const styles = {};
      for (const p of props) styles[p] = cs.getPropertyValue(p);
      return { rect: { x: r2(b.x), y: r2(b.y), w: r2(b.width), h: r2(b.height) }, styles };
    });
  }
  return out;
}

function inventory() {
  // Every distinct text style on the page, with an example and a selector to find it again.
  const path = (el) => {
    const parts = [];
    while (el && el.nodeType === 1 && parts.length < 4) {
      let s = el.localName;
      if (el.id) { parts.unshift(`#${CSS.escape(el.id)}`); break; }
      const cls = [...el.classList].slice(0, 2).map((c) => `.${CSS.escape(c)}`).join('');
      parts.unshift(s + cls);
      el = el.parentElement;
    }
    return parts.join(' > ');
  };
  const seen = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent.trim();
    const el = walker.currentNode.parentElement;
    if (!t || !el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    const cs = getComputedStyle(el);
    const key = [cs.fontFamily, cs.fontWeight, cs.fontSize, cs.lineHeight, cs.letterSpacing, cs.textTransform, cs.color].join(' | ');
    const e = seen.get(key) || { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, color: cs.color, count: 0, examples: [] };
    e.count++;
    if (e.examples.length < 3) e.examples.push({ text: t.slice(0, 60), selector: path(el) });
    seen.set(key, e);
  }
  return [...seen.values()].sort((a, b) => b.count - a.count);
}

function pageInfo() {
  const cs = (el) => getComputedStyle(el);
  return {
    title: document.title,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth, innerHeight, devicePixelRatio,
    htmlBackground: cs(document.documentElement).backgroundColor,
    bodyBackground: cs(document.body).backgroundColor,
    bodyColor: cs(document.body).color,
    bodyFont: cs(document.body).fontFamily,
    fontFaces: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`),
  };
}

// ---------- run ----------
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
// Headless Chrome announces itself as "HeadlessChrome"; send the normal Chrome UA so we get
// the page a real visitor gets. Still compare screenshots with src/references/ before trusting numbers.
const realUA = (await browser.newPage().then(async (p) => { const u = await p.evaluate(() => navigator.userAgent); await p.close(); return u; }))
  .replace('HeadlessChrome', 'Chrome');

for (const vp of widths) {
  const t0 = Date.now();
  const { name, ...ctxVp } = vp;
  const ctx = await browser.newContext({
    viewport: { width: ctxVp.width, height: ctxVp.height },
    deviceScaleFactor: ctxVp.deviceScaleFactor,
    isMobile: !!ctxVp.isMobile,
    hasTouch: !!ctxVp.hasTouch,
    userAgent: ctxVp.isMobile ? realUA.replace(/\(Macintosh[^)]*\)/, '(Linux; Android 14; Pixel 8)').replace('Safari', 'Mobile Safari') : realUA,
    reducedMotion: flag('reduced-motion') ? 'reduce' : 'no-preference',
  });
  if (opt('css')) await ctx.addInitScript(injectCss, opt('css'));
const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(wait);
  if (opt('hide')) await page.addStyleTag({ content: `${opt('hide')}{display:none!important}` });
  await page.evaluate(() => document.fonts.ready);

  const info = await page.evaluate(pageInfo);
  const result = {
    url, measuredAt: new Date().toISOString(), viewport: vp, side, step, props, selectors,
    page: info,
    inventory: flag('inventory') ? await page.evaluate(inventory) : undefined,
    samples: [],
  };
  if (shots) await page.screenshot({ path: `${outDir}/${name}@0.png` });

  if (Object.keys(selectors).length) {
    const end = Math.min(to, info.scrollHeight - ctxVp.height);
    for (let y = from; y <= end; y += step) {
      // Instant jump; works with native scroll and with smooth-scroll libraries that follow window.scrollY.
      const actual = await page.evaluate(async ({ y, settle }) => {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, settle));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return window.scrollY;
      }, { y, settle });
      const elements = await page.evaluate(sample, { selectors, props, all: flag('all'), visible: flag('visible') });
      result.samples.push({ scrollY: y, actualScrollY: Math.round(actual), elements });
      if (shots && y % shots === 0 && y > 0) await page.screenshot({ path: `${outDir}/${name}@${y}.png` });
    }
  }
  const file = `${outDir}/${name}.json`;
  await writeFile(file, JSON.stringify(result, null, 1));
  console.log(`${name.padEnd(9)} ${ctxVp.width}x${ctxVp.height}  ${result.samples.length} samples  page ${info.scrollHeight}px  ${((Date.now() - t0) / 1000).toFixed(1)}s  → ${file}`);
  await ctx.close();
}
await browser.close();
