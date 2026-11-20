#!/usr/bin/env node
// Record a page load as timestamped frames (Chrome's CDP screencast; no ffmpeg needed), to check
// motion against the reference recordings.
//   node tools/record.mjs --url <url> [--width 1440|WxH|375|landscape] [--ms 9000] [--mark loader:fadeout]
//        [--every 0.1] [--from -1 --to 6] [--css text] [--init-js file] [--reduced-motion] [--out .measure/rec/<width>]
// Frames are named by time in seconds relative to --mark (a performance mark on the page), or to
// navigation when no mark is given: <out>/rel@1.20s.jpg. --every keeps one frame per step (the nearest).
// Also writes <out>/marks.json. Line frames up with a reference recording by its mark time
// (e.g. the live 'fadeout' falls at ≈3.8s in src/references/01-hero-intro.mp4).
import { chromium } from 'playwright-core';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const VP = { 375: [375, 812, 1], 768: [768, 1024, 1], 1024: [1024, 768], 1440: [1440, 900], 1920: [1920, 1080], 2560: [2560, 1440], landscape: [844, 390, 1] };
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const url = opt('url');
if (!url) { console.error('usage: node tools/record.mjs --url <url> [--width 1440] [--ms 9000] [--mark name] [--every 0.1]'); process.exit(1); }
const w = opt('width', '1440'); const m = /^(\d+)x(\d+)$/.exec(w);
const [width, height, mobile] = VP[w] || [+m[1], +m[2]];
const out = resolve(opt('out', `.measure/rec/${w}`));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const b = await chromium.launch({ channel: 'chrome', headless: true });
const ua = (await (await b.newPage()).evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
const ctx = await b.newContext({
  viewport: { width, height }, isMobile: !!mobile, hasTouch: !!mobile, userAgent: ua,
  reducedMotion: argv.includes('--reduced-motion') ? 'reduce' : 'no-preference',
});
// --init-js: a script file run before page scripts (e.g. to add performance marks to a live page)
if (opt('init-js')) await ctx.addInitScript({ path: resolve(opt('init-js')) });
if (opt('css')) await ctx.addInitScript((css) => { const add = () => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s); }; if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add); }, opt('css'));
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ t: metadata.timestamp * 1000, data });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
await p.goto(url, { waitUntil: 'commit' });
await p.waitForTimeout(Number(opt('ms', 9000)));
const info = await p.evaluate(() => ({ origin: performance.timeOrigin, marks: Object.fromEntries(performance.getEntriesByType('mark').map((e) => [e.name, Math.round(e.startTime)])) }));
await cdp.send('Page.stopScreencast');
await b.close();

const mark = opt('mark');
const zero = info.origin + (mark && info.marks[mark] != null ? info.marks[mark] : 0);
const rel = frames.map((f) => ({ ...f, s: (f.t - zero) / 1000 }));
await writeFile(`${out}/marks.json`, JSON.stringify({ marks: info.marks, frames: rel.length, zeroMark: mark || 'navigation' }, null, 1));

const every = Number(opt('every', 0));
let keep = rel;
if (every) {
  const from = Number(opt('from', Math.ceil(rel[0]?.s ?? 0))); const to = Number(opt('to', rel.at(-1)?.s ?? 0));
  keep = [];
  for (let t = from; t <= to + 1e-9; t += every) {
    // screencast only sends a frame when the page changes, so the frame on screen at t is the last one before t
    const before = rel.filter((f) => f.s <= t + 0.008).at(-1);
    if (before) keep.push({ ...before, label: +t.toFixed(3) });
  }
}
for (const f of keep) await writeFile(`${out}/rel@${(f.label ?? f.s).toFixed(2)}s.jpg`, Buffer.from(f.data, 'base64'));
console.log(`${rel.length} frames, kept ${keep.length} → ${out}`, info.marks);
