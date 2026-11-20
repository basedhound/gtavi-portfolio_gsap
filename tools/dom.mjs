#!/usr/bin/env node
// Dump an element tree with boxes and key styles, to learn a page's structure before measuring it.
//
//   node tools/dom.mjs --url <url> [--root <css>] [--width 1440|375|...|WxH] [--wait 9000]
//                      [--scroll <px>] [--hide <css>] [--css <stylesheet text>] [--depth N] [--styles a,b,c]
//
// Prints one line per rendered element: tag#id.classes [x,y wxh] plus position, opacity, z-index,
// transform, own text, and img source/fit. Hidden (display:none) subtrees are skipped.
// Uses the same viewports and user agent as tools/measure.mjs.
import { chromium } from 'playwright-core';

// --css is injected before any page script runs, so layout code (e.g. ScrollTrigger pins, which freeze
// computed padding into inline styles) sees it from the first frame.
const injectCss = (css) => {
  const add = () => { if (document.getElementById('__measure_css')) return; const s = document.createElement('style'); s.id = '__measure_css'; s.textContent = css; (document.head || document.documentElement).appendChild(s); };
  if (document.documentElement) add();
  document.addEventListener('DOMContentLoaded', () => { document.getElementById('__measure_css')?.remove(); add(); });
};

const VIEWPORTS = {
  375: { width: 375, height: 812, isMobile: true, hasTouch: true },
  768: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  1024: { width: 1024, height: 768 },
  1440: { width: 1440, height: 900 },
  1920: { width: 1920, height: 1080 },
  2560: { width: 2560, height: 1440 },
  landscape: { width: 844, height: 390, isMobile: true, hasTouch: true },
};
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const url = opt('url');
if (!url) { console.error('usage: node tools/dom.mjs --url <url> [--root css] [--width w] (see header)'); process.exit(1); }
const w = opt('width', '1440');
const m = /^(\d+)x(\d+)$/.exec(w);
const vp = VIEWPORTS[w] || (m && { width: +m[1], height: +m[2] });
if (!vp) throw new Error(`unknown width ${w}`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ua = (await (await browser.newPage()).evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
const ctx = await browser.newContext({
  viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch,
  userAgent: vp.isMobile ? ua.replace(/\(Macintosh[^)]*\)/, '(Linux; Android 14; Pixel 8)').replace('Safari', 'Mobile Safari') : ua,
});
if (opt('css')) await ctx.addInitScript(injectCss, opt('css'));
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(Number(opt('wait', 9000)));
if (opt('hide')) await page.addStyleTag({ content: `${opt('hide')}{display:none!important}` });
if (opt('scroll')) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Number(opt('scroll')));
  await page.waitForTimeout(500);
}
const out = await page.evaluate(({ root, depth, extra }) => {
  const lines = [];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META']);
  const walk = (el, d) => {
    if (SKIP.has(el.tagName)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const r = el.getBoundingClientRect();
    const f = (n) => Math.round(n * 10) / 10;
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 50);
    let s = `${'  '.repeat(d)}${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].join('.') : ''}`;
    s += ` [${f(r.x)},${f(r.y)} ${f(r.width)}x${f(r.height)}] ${cs.position}`;
    if (cs.opacity !== '1') s += ` op=${cs.opacity}`;
    if (cs.visibility !== 'visible') s += ` ${cs.visibility}`;
    if (cs.zIndex !== 'auto') s += ` z=${cs.zIndex}`;
    if (cs.transform !== 'none') s += ` tf=${cs.transform}`;
    for (const p of extra) s += ` ${p}=${cs.getPropertyValue(p)}`;
    if (txt) s += ` "${txt}"`;
    if (el.tagName === 'IMG') s += ` src=${(el.currentSrc || el.src).split('/').pop().slice(0, 60)} fit=${cs.objectFit} pos=${cs.objectPosition}`;
    lines.push(s);
    if (el.tagName.toLowerCase() === 'svg' || d >= depth) return;
    for (const c of el.children) walk(c, d + 1);
  };
  const roots = root ? [...document.querySelectorAll(root)] : [document.body];
  for (const r of roots) walk(r, 0);
  return lines.join('\n');
}, { root: opt('root'), depth: Number(opt('depth', 40)), extra: opt('styles') ? opt('styles').split(',') : [] });
console.log(out);
await browser.close();
