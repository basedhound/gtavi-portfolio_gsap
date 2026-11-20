#!/usr/bin/env node
// Run a JS expression on a page after load and print the JSON result.
//   node tools/eval.mjs --url <url> [--width 1440] [--wait 9000] [--hide css] [--css text] [--reduced-motion] --js "<expression or async body>"
// --js may also be a path to a .js file containing an expression.
import { chromium } from 'playwright-core';
import { readFileSync, existsSync } from 'node:fs';

// --css is injected before any page script runs, so layout code (e.g. ScrollTrigger pins, which freeze
// computed padding into inline styles) sees it from the first frame.
const injectCss = (css) => {
  const add = () => { if (document.getElementById('__measure_css')) return; const s = document.createElement('style'); s.id = '__measure_css'; s.textContent = css; (document.head || document.documentElement).appendChild(s); };
  if (document.documentElement) add();
  document.addEventListener('DOMContentLoaded', () => { document.getElementById('__measure_css')?.remove(); add(); });
};
const VP = { 375: [375, 812, 1], 768: [768, 1024, 1], 1024: [1024, 768], 1440: [1440, 900], 1920: [1920, 1080], 2560: [2560, 1440], landscape: [844, 390, 1] };
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const w = opt('width', '1440'); const m = /^(\d+)x(\d+)$/.exec(w);
const [width, height, mobile] = VP[w] || [+m[1], +m[2]];
let js = opt('js'); if (existsSync(js)) js = readFileSync(js, 'utf8');
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ua = (await (await b.newPage()).evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
const ctx = await b.newContext({ viewport: { width, height }, isMobile: !!mobile, hasTouch: !!mobile,
  userAgent: mobile ? ua.replace(/\(Macintosh[^)]*\)/, '(Linux; Android 14; Pixel 8)').replace('Safari', 'Mobile Safari') : ua,
  reducedMotion: argv.includes('--reduced-motion') ? 'reduce' : 'no-preference' });
if (opt('css')) await ctx.addInitScript(injectCss, opt('css'));
const p = await ctx.newPage();
await p.goto(opt('url'), { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(Number(opt('wait', 9000)));
if (opt('hide')) { await p.addStyleTag({ content: `${opt('hide')}{display:none!important}` }); await p.waitForTimeout(300); }
console.log(JSON.stringify(await p.evaluate(`(async () => (${js}))()`), null, 1));
await b.close();
