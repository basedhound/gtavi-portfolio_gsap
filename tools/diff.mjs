#!/usr/bin/env node
// Compare two measure.mjs runs (e.g. the live site and localhost), element by element,
// at every scroll position both runs sampled.
//
//   node tools/diff.mjs <a-dir-or-file> <b-dir-or-file> [--px 1] [--pct 1] [--ignore font-family,background-image] [--json out.json]
//
// Given folders, it pairs files by width (375.json with 375.json, ...).
// Boxes: a difference is reported when x/y/w/h differ by more than --px (default 1).
// Numeric styles (sizes, opacity, ...): reported when they differ by more than --pct percent (default 1)
// and more than --px pixels. Other styles must match exactly.
// Exit code 1 when anything is out of tolerance, so it can gate a check.
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const [a, b] = argv.filter((x, i) => !x.startsWith('--') && !argv[i - 1]?.startsWith('--'));
if (!a || !b) { console.error('usage: node tools/diff.mjs <a> <b> [--px 1] [--pct 1] [--ignore props] [--json file]'); process.exit(1); }
const PX = Number(opt('px', 1));
const PCT = Number(opt('pct', 1));
const ignore = new Set((opt('ignore', '') || '').split(',').filter(Boolean));

async function files(p) {
  if ((await stat(p)).isDirectory()) return (await readdir(p)).filter((f) => f.endsWith('.json')).map((f) => join(p, f));
  return [p];
}
const load = async (f) => JSON.parse(await readFile(f, 'utf8'));
const nums = (s) => (String(s).match(/-?\d*\.?\d+/g) || []).map(Number);

function cmpStyle(prop, va, vb) {
  if (va === vb) return null;
  const na = nums(va), nb = nums(vb);
  const sameShape = String(va).replace(/-?\d*\.?\d+/g, '#') === String(vb).replace(/-?\d*\.?\d+/g, '#');
  if (sameShape && na.length && na.length === nb.length) {
    const bad = na.some((x, i) => {
      const d = Math.abs(x - nb[i]);
      return d > PX && d / Math.max(Math.abs(x), Math.abs(nb[i]), 1e-9) * 100 > PCT;
    });
    // opacity / unitless 0..1 values: 1% absolute
    const unitless = !/px|%|deg|em|rem|vw|vh/.test(va);
    const badUnitless = unitless && na.some((x, i) => Math.abs(x - nb[i]) > 0.01);
    return bad || badUnitless ? { prop, a: va, b: vb } : null;
  }
  return { prop, a: va, b: vb };
}

const pairsA = await files(a), pairsB = await files(b);
const report = [];
let total = 0;
for (const fa of pairsA) {
  const fb = pairsB.find((f) => basename(f) === basename(fa)) || (pairsB.length === 1 && pairsA.length === 1 ? pairsB[0] : null);
  if (!fb) { console.log(`${basename(fa)}: no matching file in ${b}`); continue; }
  const A = await load(fa), B = await load(fb);
  const bySy = new Map(B.samples.map((s) => [s.scrollY, s]));
  const issues = [];
  const pageDiffs = ['htmlBackground', 'bodyBackground', 'bodyColor'].filter((k) => A.page[k] !== B.page[k])
    .map((k) => ({ prop: `page.${k}`, a: A.page[k], b: B.page[k] }));
  if (Math.abs(A.page.scrollHeight - B.page.scrollHeight) > PX) pageDiffs.push({ prop: 'page.scrollHeight', a: A.page.scrollHeight, b: B.page.scrollHeight });
  for (const sa of A.samples) {
    const sb = bySy.get(sa.scrollY);
    if (!sb) continue;
    for (const [name, la] of Object.entries(sa.elements)) {
      const lb = sb.elements[name];
      if (!lb) continue;
      if (!Array.isArray(la) || !Array.isArray(lb)) { issues.push({ y: sa.scrollY, name, diffs: [{ prop: 'selector', a: la.error || 'ok', b: lb.error || 'ok' }] }); continue; }
      if (la.length !== lb.length) issues.push({ y: sa.scrollY, name, diffs: [{ prop: 'count', a: la.length, b: lb.length }] });
      for (let i = 0; i < Math.min(la.length, lb.length); i++) {
        const ea = la[i], eb = lb[i], diffs = [];
        for (const k of ['x', 'y', 'w', 'h']) {
          const d = ea.rect[k] - eb.rect[k];
          if (Math.abs(d) > PX) diffs.push({ prop: `rect.${k}`, a: ea.rect[k], b: eb.rect[k], d: Math.round(d * 100) / 100 });
        }
        for (const p of Object.keys(ea.styles)) {
          if (ignore.has(p) || !(p in eb.styles)) continue;
          const r = cmpStyle(p, ea.styles[p], eb.styles[p]);
          if (r) diffs.push(r);
        }
        if (diffs.length) issues.push({ y: sa.scrollY, name: la.length > 1 ? `${name}[${i}]` : name, diffs });
      }
    }
  }
  const compared = A.samples.filter((s) => bySy.has(s.scrollY)).length;
  total += issues.length + pageDiffs.length;
  report.push({ width: basename(fa, '.json'), compared, pageDiffs, issues });

  console.log(`\n== ${basename(fa, '.json')}  (${compared} scroll positions compared)  ${issues.length + pageDiffs.length ? `${issues.length + pageDiffs.length} out of tolerance` : 'OK'}`);
  for (const d of pageDiffs) console.log(`  page  ${d.prop}: ${d.a}  vs  ${d.b}`);
  // Group by element + diff signature so a constant offset prints once, with its scroll range.
  const groups = new Map();
  for (const it of issues) {
    const key = it.name + ' :: ' + it.diffs.map((d) => `${d.prop} ${d.a} vs ${d.b}`).join('; ');
    const g = groups.get(key) || { name: it.name, diffs: it.diffs, ys: [] };
    g.ys.push(it.y);
    groups.set(key, g);
  }
  for (const g of [...groups.values()].slice(0, 60)) {
    const ys = g.ys.length > 1 ? `y=${g.ys[0]}…${g.ys.at(-1)} (${g.ys.length}×)` : `y=${g.ys[0]}`;
    console.log(`  ${g.name}  ${ys}`);
    for (const d of g.diffs) console.log(`      ${d.prop}: ${d.a}  vs  ${d.b}${d.d !== undefined ? `  (Δ ${d.d})` : ''}`);
  }
  if (groups.size > 60) console.log(`  … ${groups.size - 60} more groups (use --json)`);
}
if (opt('json')) await writeFile(opt('json'), JSON.stringify(report, null, 1));
process.exit(total ? 1 : 0);
