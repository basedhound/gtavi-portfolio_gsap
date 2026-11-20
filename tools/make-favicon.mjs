#!/usr/bin/env node
// Favicon: the navbar's "GTD" monogram (Barlow Condensed 900, white) on the page colour, as one
// public/favicon.ico holding 16, 32 and 48px images (live declares a single 48×48 favicon.ico).
// Each size is rendered on its own in Chrome with the site's font, then packed with PIL.
//   node tools/make-favicon.mjs
import { chromium } from 'playwright-core'
import { readFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const tmp = resolve(root, '.measure/favicon')
mkdirSync(tmp, { recursive: true })
const font = readFileSync(resolve(root, 'src/assets/fonts/barlow-condensed-900.woff2')).toString('base64')
const SIZES = [16, 32, 48]

const page = (s) => `<!doctype html><style>
@font-face { font-family: B; font-weight: 900; src: url(data:font/woff2;base64,${font}) format('woff2'); }
html, body { margin: 0; background: transparent; }
.i { width: ${s}px; height: ${s}px; border-radius: ${s * 0.1875}px; background: #0c0d1b; display: grid; place-items: center; }
svg { width: ${s * 0.84}px; height: ${s * 0.84 * 35 / 46}px; display: block; }
</style><div class="i"><svg viewBox="0 0 46 35"><text x="23" y="33.5" text-anchor="middle" textLength="46"
lengthAdjust="spacingAndGlyphs" fill="#ffffff" style="font-family:B;font-weight:900;font-size:46.5px">GTD</text></svg></div>`

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ deviceScaleFactor: 1 })
const files = []
for (const s of SIZES) {
  await p.setViewportSize({ width: s, height: s })
  await p.setContent(page(s))
  await p.evaluate(() => document.fonts.ready)
  const f = resolve(tmp, `${s}.png`)
  await p.locator('.i').screenshot({ path: f, omitBackground: true })
  files.push(f)
}
await b.close()

const py = `
import sys
from PIL import Image
ims = [Image.open(f).convert('RGBA') for f in sys.argv[2:]]
ims[-1].save(sys.argv[1], format='ICO', sizes=[i.size for i in ims], append_images=ims[:-1])
print(sys.argv[1], [i.size for i in ims])
`
mkdirSync(resolve(root, 'public'), { recursive: true })
console.log(execFileSync('python3', ['-c', py, resolve(root, 'public/favicon.ico'), ...files]).toString().trim())
