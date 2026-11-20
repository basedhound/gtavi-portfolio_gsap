#!/usr/bin/env node
// Save every JavaScript file a page loads, so its animation code (triggers, durations, eases) can be read.
//   node tools/fetch-js.mjs --url <url> [--width 1440] [--wait 12000] [--out .measure/js]
// Writes <out>/<n>-<file name>.js plus <out>/index.json (url → file, size).
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const url = opt('url');
if (!url) { console.error('usage: node tools/fetch-js.mjs --url <url> [--width 1440] [--wait 12000] [--out dir]'); process.exit(1); }
const width = Number(opt('width', 1440));
const out = resolve(opt('out', '.measure/js'));
await mkdir(out, { recursive: true });

const b = await chromium.launch({ channel: 'chrome', headless: true });
const ua = (await (await b.newPage()).evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
const ctx = await b.newContext({ viewport: { width, height: Math.round(width * 0.625) }, userAgent: ua });
const p = await ctx.newPage();
const index = [];
let n = 0;
p.on('response', async (r) => {
  const type = r.request().resourceType();
  const ct = r.headers()['content-type'] || '';
  if (type !== 'script' && !ct.includes('javascript')) return;
  try {
    const body = await r.text();
    const name = `${String(n++).padStart(3, '0')}-${basename(new URL(r.url()).pathname).replace(/[^\w.-]/g, '_').slice(0, 80) || 'inline'}`;
    const file = name.endsWith('.js') ? name : `${name}.js`;
    await writeFile(`${out}/${file}`, body);
    index.push({ url: r.url(), file, size: body.length });
  } catch { /* redirects and aborted requests have no body */ }
});
await p.goto(url, { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(Number(opt('wait', 12000)));
await writeFile(`${out}/index.json`, JSON.stringify(index, null, 1));
console.log(`${index.length} scripts → ${out}`);
await b.close();
