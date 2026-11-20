/*
  The hero intro: the fob layer timeline (fob.js) plus what the live hero adds around it
  (hero chunk, read 2026-11-18): the content zooms in from 1.4286, the row and navbar fade in once the
  shards land, and at the end the real poster fades in over the canvas, which is then hidden.
  Also the page background: the overlay fades from #0C0D1B to transparent from shardFadeInDelay to
  ENTER (linear), and the cursor glow fades 0 → .5 with the hero UI (pointer devices only).

  Two steps, so the timeline starts the instant the loader fires 'fadeout':
    prepare()  decode the layer images and cut them for drawing (runs while the loader is still up)
    play()     build and play the timeline (re-prepares first if the viewport changed meanwhile)
*/
import { gsap } from 'gsap'
import { cursorLight, backgroundOverlay } from '../lib/background.js'
import { buildFobTimeline, currentBreakpoint, drawFob, prepareLayers, SHARD_FILES } from './fob.js'

const SQUARE_ART = '(max-aspect-ratio: 1 / 1)'

const decode = (img) =>
  img.decode ? img.decode().then(() => img) : img.complete ? Promise.resolve(img) : new Promise((ok, fail) => { img.onload = () => ok(img); img.onerror = fail })

// Layer order for the current breakpoint, as image keys ('shard-02', …, 'logo-vi', 'logo-gta').
function layerKeys(breakpoint) {
  const files = SHARD_FILES[window.matchMedia(SQUARE_ART).matches ? 'mobile' : 'desktop']
  const { layers } = buildFobTimeline(breakpoint)
  return layers.map((L) => (L.name === 'vi' ? 'logo-vi' : L.name === 'gta' ? 'logo-gta' : `shard-${String(files[L.name]).padStart(2, '0')}`))
}

/*
  refs: { canvas, content (column that zooms), poster (the poster box), finals ([poster, logo] pictures),
          layerImgs ({ 'shard-01': img, …, 'logo-vi': img, 'logo-gta': img }), header, row, nav,
          extras (our additions that fade in with the hero UI, e.g. the fan-made line) }
  onDone: called when scrolling may resume ('enable-scroll').
*/
export function createHeroIntro(refs, onDone) {
  const { canvas, content, poster, finals, layerImgs, header, row, nav, extras = [] } = refs
  let cut = null // { key, breakpoint, f, p, prepared }
  let tl = null
  let killed = false

  // Live: the natural width of every layer is the 85vw slot (min(85vw, 2560px) when ultrawide);
  // the natural height follows the poster's aspect.
  const geometry = () => {
    const breakpoint = currentBreakpoint()
    const f = breakpoint === 'ultrawide' ? Math.min(window.innerWidth * 0.85, 2560) : window.innerWidth * 0.85
    const p = (f * poster.offsetHeight) / poster.offsetWidth
    const dpr = window.devicePixelRatio || 1
    const keys = layerKeys(breakpoint)
    return { breakpoint, f, p, dpr, keys, key: [breakpoint, f, p, dpr, keys[0], layerImgs[keys[0]]?.currentSrc].join('|') }
  }
  const cutLayers = (g) => {
    const images = g.keys.map((k) => layerImgs[k])
    cut = { key: g.key, ...g, prepared: prepareLayers(buildFobTimeline(g.breakpoint).layers, images, g.f, g.p, g.dpr * 1.4286) }
  }

  const prepare = async () => {
    await Promise.all(Object.values(layerImgs).map(decode))
    if (!killed) cutLayers(geometry())
  }
  let preparing = prepare().catch(() => null)

  const play = async () => {
    const ok = await preparing
    if (killed) return
    if (ok === null) {
      // images failed: show the poster without the intro
      gsap.set(finals, { autoAlpha: 1 })
      onDone()
      return
    }
    const g = geometry()
    if (!cut || cut.key !== g.key) cutLayers(g)
    const { breakpoint, f, p, dpr, prepared } = cut
    const ctx = canvas.getContext('2d')
    const stage = { camera: 1, endCamera: 1 }
    let live = prepared
    let layers = null
    const render = () => {
      if (live && layers) drawFob({ ctx, canvas, layers, prepared: live, camera: stage.camera, f, p })
    }
    const built = buildFobTimeline(breakpoint, {
      onStart: () => gsap.set(content, { pointerEvents: 'none' }),
      onUpdate: render,
    })
    layers = built.layers
    tl = built.timeline

    // Hero additions, in the live order.
    const { ENTER, FRAMES } = built.vars
    const zoom = (190 / FRAMES) * ENTER
    const ui = (81 / FRAMES) * ENTER
    const items = [...row.children]
    const buttons = items.filter((e) => e.matches('a.hero__button, button'))
    const others = items.filter((e) => !buttons.includes(e))

    gsap.set(finals, { autoAlpha: 0 })
    tl.to([row], { autoAlpha: 1, duration: 0 }, 0)
    tl.to([stage], { camera: () => stage.endCamera, duration: zoom, ease: 'power2.inOut', data: { invalidate: true } }, 0)
    tl.from([content], { scale: 1.4286, duration: zoom, ease: 'power2.inOut' }, 0)
    tl.from([content], { autoAlpha: 0, duration: ENTER / 2, ease: 'power1.in' }, 0)
    tl.addLabel('button', ENTER)
    tl.fromTo(buttons, { autoAlpha: 0 }, { autoAlpha: 1, duration: (42 / FRAMES) * ENTER, ease: 'power1.in' }, 'button')
    tl.addLabel('heroUI', ENTER)
    tl.fromTo([header, ...others, ...extras].filter(Boolean), { autoAlpha: 0 }, { autoAlpha: 1, duration: ui, ease: 'power1.inOut' }, 'heroUI')
    tl.fromTo([nav].filter(Boolean), { autoAlpha: 0 }, { autoAlpha: 1, duration: ui, ease: 'power1.inOut' }, 'heroUI')
    const light = cursorLight()
    if (light && !window.matchMedia('(pointer: coarse)').matches) tl.fromTo([light], { opacity: 0 }, { opacity: 0.5, duration: ui, ease: 'power1.inOut' }, 'heroUI')
    const overlay = backgroundOverlay()
    if (overlay) tl.from([overlay], { background: '#0C0D1B', duration: ENTER - built.vars.SHARD_FADE_IN, ease: 'none' }, built.vars.SHARD_FADE_IN)
    tl.call(() => {
      gsap.to(finals, {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'sine.inOut',
        onComplete: () => {
          gsap.set(content, { pointerEvents: 'auto' })
          gsap.set(canvas, { opacity: 0 })
          canvas.width = 0
          canvas.height = 0
          live = null
          cut = null
          onDone()
        },
      })
    })

    stage.endCamera = poster.offsetWidth / f
    stage.camera = stage.endCamera // live: updateCameraEnd sets both, so the zoom comes from the content scale
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (window.scrollY > window.innerHeight) tl.duration(0.001)
    tl.getChildren().filter((c) => c.data?.invalidate).forEach((c) => c.invalidate())
    render()
    performance.mark('intro:play')
    tl.play()
  }

  // Live: a resize or rotation during the intro jumps it to the end; before it, re-prepare.
  const kill = () => {
    if (tl) {
      if (!killed) tl.totalProgress(1)
      killed = true
    }
  }
  const destroy = () => {
    kill()
    killed = true
  }
  const resized = () => {
    if (tl) kill()
  }

  return { play, kill, resized, destroy }
}
