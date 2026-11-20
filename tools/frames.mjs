#!/usr/bin/env node
// Grab still frames from a screen recording using Chrome's own video decoder
// (no ffmpeg needed). Use it to compare live-site measurements with the
// recordings in src/references/, and later to check motion frame by frame.
//
//   node tools/frames.mjs <video> [--at 0,1.5,3] [--every 0.5] [--from 0 --to 5] [--out .measure/frames]
//
// Prints the video's real size and duration, then writes one PNG per time:
// <out>/<video-name>@<seconds>s.png
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const video = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
if (!video) {
  console.error('usage: node tools/frames.mjs <video> [--at 0,1.5] [--every 0.5 --from 0 --to 5] [--out dir]');
  process.exit(1);
}
const out = resolve(opt('out', '.measure/frames'));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
const src = pathToFileURL(resolve(video)).href;
// Open a file:// page first so the file:// video is allowed to load.
await page.goto(pathToFileURL(resolve(video, '..')).href + '/');
await page.setContent(
  `<body style="margin:0;background:#000"><video id="v" src="${src}" muted preload="auto"></video></body>`,
);
const meta = await page.evaluate(
  () =>
    new Promise((ok, fail) => {
      const v = document.getElementById('v');
      const done = () => ok({ w: v.videoWidth, h: v.videoHeight, duration: v.duration });
      if (v.readyState >= 1) done();
      v.onloadedmetadata = done;
      v.onerror = () => fail(new Error('Chrome cannot decode this video: ' + (v.error && v.error.message)));
    }),
);
console.log(`${basename(video)}: ${meta.w}x${meta.h}, ${meta.duration.toFixed(3)}s`);

let times;
if (opt('at')) times = opt('at').split(',').map(Number);
else {
  const every = Number(opt('every', 1));
  const from = Number(opt('from', 0));
  const to = Math.min(Number(opt('to', meta.duration)), meta.duration - 0.001);
  times = [];
  for (let t = from; t <= to + 1e-9; t += every) times.push(+t.toFixed(3));
}

await page.setViewportSize({ width: meta.w, height: meta.h });
const name = basename(video, extname(video));
for (const t of times) {
  await page.evaluate(
    (t) =>
      new Promise((ok) => {
        const v = document.getElementById('v');
        v.onseeked = () => requestAnimationFrame(() => requestAnimationFrame(ok));
        v.currentTime = t;
      }),
    t,
  );
  const file = `${out}/${name}@${t}s.png`;
  await page.locator('#v').screenshot({ path: file });
  console.log(file);
}
await browser.close();
