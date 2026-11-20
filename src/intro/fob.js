/*
  Hero intro ("fob" on the live site): the collage pieces fly in on a canvas, then the logo appears.
  Ported from the live site's front-end code (rockstargames.com/VI, hero chunk, read 2026-11-18 with
  tools/fetch-js.mjs). Every duration, delay, ease, depth and colour below is the live value.

  Model: 12 layers, each a full-frame image the size of the poster. Each frame, every layer is drawn
  centred on the canvas, scaled by perspective  5000 / (5000 + max(z, -4999)), so a layer at z = 0
  sits exactly on the poster. Layers fly from far negative z to 0. Shards start as page-coloured
  silhouettes ("reveal" 1 → 0). The VI glows pink, the wordmark wipes in top-down and glows gold.

  Our layer set: 10 shards + VI + wordmark (live: 9 shards + logo hole + VI + wordmark). Our VI art has
  the wordmark's dark hole baked in; it is split off at prep time (splitHole) and drawn in the live
  "logoHole" slot, together with our 10th shard (the small piece under the logo). So 12 slots, all on
  live timing.
*/
import { gsap } from 'gsap'

const PAGE = '#0C0D1B'
const ENTER = 2.6 // HeroEnterDuration
const FRAMES = 140 // live timeline is authored in 140 frames over 2.6s
const SHARD_FADE_IN = 0.5571428571428572 // shardFadeInDelay
const REVEAL_DELAYS = [
  0.4642857142857143, 0.5571428571428572, 0.65, 0.7428571428571429, 0.8357142857142859, 0.9285714285714286,
  1.0214285714285714, 1.1142857142857143, 1.2071428571428573,
]

// Live breakpoints for the intro, tested in this order; none → 'landscape'.
export const FOB_BREAKPOINTS = {
  square: '(min-aspect-ratio: 0.6) and (max-aspect-ratio: 1)',
  portrait: '(max-aspect-ratio: 0.6)',
  ultrawide: '(min-aspect-ratio: 2.25), (min-width: 0px) and (max-width: 767.98px) and (min-aspect-ratio: 2)',
}

// Shard order (= draw order) and start depth per breakpoint. Names are the live pieces; each maps to
// the shard of ours in the same place in the collage (see SHARD_FILES).
const ORDER_TALL = [
  ['jl', -4314], ['gator', -5486], ['boobie', -6533], ['gal', -7759], ['biker', -8923],
  ['heli', -10080], ['raul', -11246], ['lambo', -12331], ['speedboat', -13335],
]
const ORDER_WIDE = [
  ['jl', -4314], ['heli', -5337], ['boobie', -6533], ['lambo', -7760], ['speedboat', -9177],
  ['gator', -9440], ['biker', -19197], ['raul', -15243], ['gal', -16634],
]
const ORDERS = { square: ORDER_TALL, portrait: ORDER_TALL, ultrawide: ORDER_WIDE, landscape: ORDER_WIDE }

// Live piece → our shard number, by position in the collage (desktop art for 16:9 and wider, the
// square art for portrait and square viewports). 'hole' is the live logo-hole slot.
export const SHARD_FILES = {
  desktop: { heli: 1, jl: 2, speedboat: 3, raul: 4, gal: 5, lambo: 6, gator: 7, boobie: 8, biker: 9, hole: 10 },
  mobile: { heli: 1, jl: 2, biker: 3, gal: 4, boobie: 5, hole: 6, gator: 7, lambo: 8, raul: 9, speedboat: 10 },
}

class Layer {
  x = 0
  y = 0
  z = 0
  scale = 1
  alpha = 1
  reveal = 0
  visible = true
  shadowColor = 'rgba(0,0,0,0)'
  shadowOpacity = 0
  shadowBlur = 0
  shadowX = 0
  shadowY = 0
  mask = 1
  maskSoftness = 200
  constructor(name, zIndex) {
    this.name = name
    this.zIndex = zIndex
  }
}

export function currentBreakpoint() {
  for (const [name, q] of Object.entries(FOB_BREAKPOINTS)) if (window.matchMedia(q).matches) return name
  return 'landscape'
}

// The live layer timeline for one breakpoint. Returns the layers (in draw order) and a paused timeline.
export function buildFobTimeline(breakpoint, vars = {}) {
  const tl = gsap.timeline({ paused: true, defaults: { duration: ENTER, ease: 'power3.inOut' }, ...vars })
  const spec = [
    ...ORDERS[breakpoint].map(([name, z], i) => ({ name, z, alpha: 0, revealDelay: REVEAL_DELAYS[i] })),
    { name: 'hole', z: -13435, alpha: 0 },
    { name: 'vi', z: -13435, alpha: 0 },
    { name: 'gta', z: -15853, alpha: 1 },
  ]
  const layers = spec.map((s, i) => new Layer(s.name, i))
  const shards = layers.slice(0, 9)
  const [hole, vi, gta] = layers.slice(9)

  spec.forEach((s, i) => {
    const L = layers[i]
    L.alpha = s.alpha
    tl.from(L, { z: s.z }, 0)
    if (shards.includes(L)) {
      tl.set(L, { alpha: 0.5 }, SHARD_FADE_IN)
      tl.from(L, { reveal: 1, ease: 'power3.inOut', duration: ENTER - s.revealDelay }, s.revealDelay)
    }
  })
  tl.to(vi, { alpha: 1, duration: 0.5571428571428572, ease: 'none' }, 1.6714285714285717)
  tl.fromTo(vi, { shadowColor: '#FFACFD', shadowOpacity: 0, shadowBlur: 18 }, { shadowOpacity: 1, shadowBlur: 108, duration: 0.9285714285714284, ease: 'none' }, 2.0428571428571427)
  tl.from(gta, { mask: 0, duration: breakpoint === 'ultrawide' ? 1.4857142857142858 : 2.1357142857142857, ease: 'power1.out' }, 1.6714285714285717)
  tl.fromTo(gta, { shadowColor: '#FFD398', shadowOpacity: 0, shadowBlur: 15 }, { shadowOpacity: 1, duration: 0.5571428571428572, ease: 'none' }, 2.4699999999999998)
  tl.to(hole, { alpha: 1, duration: 0.4642857142857143, ease: 'sine.inOut' }, 2.4142857142857146)
  tl.to([vi, gta], { shadowOpacity: 0, duration: 1.1142857142857143, ease: 'power2.in' }, 3.0271428571428567)
  tl.addLabel('afterShardsLand', ENTER)
  tl.to(shards, { alpha: 1, duration: 1.1142857142857143, ease: 'sine.inOut' }, 'afterShardsLand')
  return { layers, timeline: tl, vars: { ENTER, SHARD_FADE_IN, FRAMES } }
}

/*
  Prepare each layer for drawing. The live site sizes its layer images to the poster slot (their
  natural width is always 85vw); ours are full-frame art cropped like object-fit: cover. To keep
  drawing cheap, each layer is cut to the box its pixels occupy, and the silhouettes the effects need
  (page colour for the reveal, the glow colour for the shadow) are made once instead of every frame.
    f × p  the layer size in natural units (CSS px at camera 1)
    k      backing pixels per natural unit (never more than the source has)
*/
// Our VI art has the wordmark's dark hole baked in (flat ≈ rgb(20, 4, 28)); the live site has it as a
// separate layer that fades in later. Split it out: pixels of that colour in large connected regions
// (the wordmark silhouette; dark palm fronds of the same colour are small and stay) move to their own
// canvas. Every pixel lands in exactly one part, so drawing both at full alpha gives back the art.
function splitHole(art) {
  const w = art.width
  const h = art.height
  const actx = art.getContext('2d', { willReadFrequently: true })
  const img = actx.getImageData(0, 0, w, h)
  const d = img.data
  const n = w * h
  const isHole = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const r = d[i * 4]
    const g = d[i * 4 + 1]
    const b = d[i * 4 + 2]
    if (d[i * 4 + 3] > 0 && r >= 8 && r <= 32 && g <= 12 && b >= 16 && b <= 40) isHole[i] = 1
  }
  // connected regions (4-neighbour flood fill)
  const label = new Int32Array(n)
  const sizes = [0]
  const queue = new Int32Array(n)
  for (let s = 0; s < n; s++) {
    if (!isHole[s] || label[s]) continue
    const id = sizes.length
    let head = 0
    let tail = 0
    queue[tail++] = s
    label[s] = id
    while (head < tail) {
      const i = queue[head++]
      const x = i % w
      if (x > 0 && isHole[i - 1] && !label[i - 1]) { label[i - 1] = id; queue[tail++] = i - 1 }
      if (x < w - 1 && isHole[i + 1] && !label[i + 1]) { label[i + 1] = id; queue[tail++] = i + 1 }
      if (i >= w && isHole[i - w] && !label[i - w]) { label[i - w] = id; queue[tail++] = i - w }
      if (i < n - w && isHole[i + w] && !label[i + w]) { label[i + w] = id; queue[tail++] = i + w }
    }
    sizes.push(tail)
  }
  const largest = Math.max(0, ...sizes)
  const keep = sizes.map((s) => s >= largest * 0.05)
  const hole = new ImageData(w, h)
  for (let i = 0; i < n; i++)
    if (label[i] && keep[label[i]]) {
      for (let c = 0; c < 4; c++) hole.data[i * 4 + c] = d[i * 4 + c]
      d[i * 4 + 3] = 0
    }
  actx.putImageData(img, 0, 0)
  const holeCanvas = document.createElement('canvas')
  holeCanvas.width = w
  holeCanvas.height = h
  holeCanvas.getContext('2d').putImageData(hole, 0, 0)
  return holeCanvas
}

export function prepareLayers(layers, images, f, p, k) {
  const prepared = cutLayers(layers, images, f, p, k)
  // The VI's hole joins the live logo-hole slot (same depth as the VI, so it lines up exactly).
  const vi = layers.findIndex((L) => L.name === 'vi')
  const hole = layers.findIndex((L) => L.name === 'hole')
  const V = prepared[vi]
  if (V && !V.empty && prepared[hole] && !prepared[hole].empty) {
    prepared[hole].extras = [{ art: splitHole(V.art), bx: V.bx, by: V.by, bw: V.bw, bh: V.bh }]
    V.shadow = (() => {
      // the glow follows the VI as drawn (without the hole)
      const c = document.createElement('canvas')
      c.width = V.art.width
      c.height = V.art.height
      const x = c.getContext('2d')
      x.drawImage(V.art, 0, 0)
      x.globalCompositeOperation = 'source-in'
      x.fillStyle = '#FFACFD'
      x.fillRect(0, 0, c.width, c.height)
      return c
    })()
  }
  return prepared
}

function cutLayers(layers, images, f, p, k) {
  const scan = document.createElement('canvas')
  const sw0 = 256
  scan.width = sw0
  scan.height = Math.max(1, Math.round((sw0 * p) / f))
  const sctx = scan.getContext('2d', { willReadFrequently: true })

  return layers.map((L, i) => {
    const img = images[i]
    const W = img.naturalWidth
    const H = img.naturalHeight
    // cover crop of the source to f:p
    let sw = W
    let sh = H
    if (W / H > f / p) sw = H * (f / p)
    else sh = W / (f / p)
    const sx = (W - sw) / 2
    const sy = (H - sh) / 2
    const s = sw / f // source px per natural unit

    // bounding box of visible pixels, in natural units, padded by one scan pixel
    sctx.clearRect(0, 0, scan.width, scan.height)
    sctx.drawImage(img, sx, sy, sw, sh, 0, 0, scan.width, scan.height)
    const data = sctx.getImageData(0, 0, scan.width, scan.height).data
    let x0 = scan.width
    let y0 = scan.height
    let x1 = -1
    let y1 = -1
    for (let y = 0; y < scan.height; y++)
      for (let x = 0; x < scan.width; x++)
        if (data[(y * scan.width + x) * 4 + 3] > 0) {
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
    if (x1 < 0) return { empty: true }
    const u = f / scan.width
    const bx = Math.max(0, (x0 - 1) * u)
    const by = Math.max(0, (y0 - 1) * u)
    const bw = Math.min(f, (x1 + 2) * u) - bx
    const bh = Math.min(p, (y1 + 2) * u) - by

    const kk = Math.min(k, s)
    const cw = Math.max(1, Math.ceil(bw * kk))
    const ch = Math.max(1, Math.ceil(bh * kk))
    const art = document.createElement('canvas')
    art.width = cw
    art.height = ch
    art.getContext('2d').drawImage(img, sx + bx * s, sy + by * s, bw * s, bh * s, 0, 0, cw, ch)

    const silhouette = (color) => {
      const c = document.createElement('canvas')
      c.width = cw
      c.height = ch
      const x = c.getContext('2d')
      x.drawImage(art, 0, 0)
      x.globalCompositeOperation = 'source-in'
      x.fillStyle = color
      x.fillRect(0, 0, cw, ch)
      return c
    }
    return {
      art,
      bx,
      by,
      bw,
      bh,
      k: kk,
      reveal: L.name === 'vi' || L.name === 'gta' || L.name === 'hole' ? null : silhouette(PAGE),
      shadow: L.name === 'vi' ? silhouette('#FFACFD') : L.name === 'gta' ? silhouette('#FFD398') : null,
    }
  })
}

let maskCanvas = null

// One frame. A direct port of the live draw loop, with the per-layer crop boxes added.
export function drawFob({ ctx, canvas, layers, prepared, camera, f, p }) {
  const l = canvas.clientWidth
  const i = canvas.clientHeight
  ctx.clearRect(0, 0, l, i)
  ctx.save()
  const cx = l / 2
  const cy = i / 2
  ctx.translate(cx, cy)
  ctx.scale(camera, camera)
  ctx.translate(-cx, -cy)
  const g = (l - f) / 2
  const m = (i - p) / 2
  const h = f / 2
  const v = p / 2
  const ox = Math.round(-h)
  const oy = Math.round(-v)
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex)
  for (const o of sorted) {
    const P = prepared[o.zIndex]
    if (!o.visible || o.alpha <= 0 || !P || P.empty) continue
    const d = 5000 / (5000 + Math.max(o.z, -4999))
    const c = o.scale * d
    ctx.save()
    ctx.globalAlpha = o.alpha
    ctx.translate(g + o.x * d + h, m + o.y * d + v)
    if (c !== 1) ctx.scale(c, c)
    const dx = ox + P.bx
    const dy = oy + P.by
    if (o.shadowOpacity > 0 && P.shadow) {
      ctx.save()
      ctx.globalAlpha = o.shadowOpacity
      ctx.filter = o.shadowBlur > 0 ? `blur(${o.shadowBlur}px)` : 'none'
      ctx.translate(o.shadowX, o.shadowY)
      ctx.drawImage(P.shadow, dx, dy, P.bw, P.bh)
      ctx.restore()
    }
    const x = Math.max(0, Math.min(1, o.mask))
    if (x <= 0) {
      ctx.restore()
      continue
    }
    if (x >= 1) {
      ctx.drawImage(P.art, dx, dy, P.bw, P.bh)
      if (P.extras) for (const e of P.extras) ctx.drawImage(e.art, ox + e.bx, oy + e.by, e.bw, e.bh)
    } else {
      // top-down wipe with a soft edge, in natural units of the full frame
      const a = Math.round(p * x)
      const soft = Math.min(Math.round(o.maskSoftness), a, 0.5 * p)
      const solid = Math.max(a - soft, 0)
      if (!maskCanvas) maskCanvas = document.createElement('canvas')
      if (maskCanvas.width !== P.art.width || maskCanvas.height !== P.art.height) {
        maskCanvas.width = P.art.width
        maskCanvas.height = P.art.height
      }
      const t = maskCanvas.getContext('2d')
      t.setTransform(1, 0, 0, 1, 0, 0)
      t.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      t.setTransform(P.k, 0, 0, P.k, -P.bx * P.k, -P.by * P.k)
      t.drawImage(P.art, P.bx, P.by, P.bw, P.bh)
      t.clearRect(0, a, f, p - a)
      if (soft > 0 && a > 0) {
        const grad = t.createLinearGradient(0, 0, 0, a)
        grad.addColorStop(0, 'rgba(255,255,255,1)')
        grad.addColorStop(solid / a, 'rgba(255,255,255,1)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        t.save()
        t.globalCompositeOperation = 'destination-in'
        t.fillStyle = grad
        t.fillRect(0, 0, f, a)
        t.restore()
      }
      ctx.drawImage(maskCanvas, dx, dy, P.bw, P.bh)
    }
    if (o.reveal > 0 && P.reveal) {
      ctx.save()
      ctx.globalAlpha = o.reveal
      ctx.drawImage(P.reveal, dx, dy, P.bw, P.bh)
      ctx.restore()
    }
    ctx.restore()
  }
  ctx.restore()
}
