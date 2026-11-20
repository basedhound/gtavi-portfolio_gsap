import { useEffect, useRef } from 'react'
import { hero } from '../content.js'
import { hasFired, emit, on } from '../lib/loaderEvents.js'
import { createHeroIntro } from '../intro/heroIntro.js'
import { gsap, matches } from '../lib/gsap.js'
import { cursorLight } from '../lib/background.js'
import posterDesktop from '../assets/site/hero/desktop/poster.avif'
import logoDesktop from '../assets/site/hero/desktop/poster-logo.avif'
import posterMobile from '../assets/site/hero/mobile/poster.avif'
import logoMobile from '../assets/site/hero/mobile/poster-logo.avif'
import './Hero.css'

// Portrait and square viewports get the square art (the live site's slot is 1:1 or 160:177 there).
const SQUARE_ART = '(max-aspect-ratio: 1 / 1)'

// Intro layers: 10 shards + the two logo layers, desktop and square art, all on one canvas size.
const desktopArt = import.meta.glob('../assets/site/hero/desktop/{shard-*,logo-vi,logo-gta}.avif', { eager: true, import: 'default' })
const mobileArt = import.meta.glob('../assets/site/hero/mobile/{shard-*,logo-vi,logo-gta}.avif', { eager: true, import: 'default' })
const LAYER_NAMES = Object.keys(desktopArt)
  .map((path) => path.split('/').pop().replace('.avif', ''))
  .sort()
const artFor = (set, name) => set[Object.keys(set).find((k) => k.endsWith(`/${name}.avif`))]

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/*
  Scroll-out (live hero chunk, read 2026-11-18). Built once the intro hands over ('enable-scroll').
  The hero pins without spacing for one screen (start top top → end bottom top, scrub); in timeline
  units (total 180 = the whole screen of scroll):
    0–40     chevron fades out (circ.out)
    0–100    hero scales 1 → .9 (.85 on phones)
    50–120   row, phone tagline and collage fade out (power3.out); clicks off at 50
    50–180   logo fades out (power3.out), so it lingers last
  The nav pill fades in (0.3s power2.inOut, reversible) once the hero column's top is 40% of a screen
  above the viewport top.
*/
function createScrollOut({ root, inner, header, row, poster, logo, chevron, extras, pill }) {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      paused: true,
      defaults: { duration: 100, ease: 'none' },
      scrollTrigger: { trigger: root, pin: true, pinSpacing: false, start: 'top top', end: 'bottom top', scrub: true },
    })
    tl.fromTo([chevron], { autoAlpha: 1 }, { autoAlpha: 0, duration: 40, ease: 'circ.out' }, 0)
    tl.fromTo([root], { scale: 1 }, { scale: matches('mobile') ? 0.85 : 0.9 }, 0)
    tl.fromTo([row, header, poster, ...extras].filter(Boolean), { autoAlpha: 1 }, { autoAlpha: 0, duration: 70, ease: 'power3.out' }, 50)
    tl.fromTo([root, inner], { pointerEvents: 'auto' }, { pointerEvents: 'none', duration: 0 }, 50)
    tl.fromTo([logo], { autoAlpha: 1 }, { autoAlpha: 0, duration: 130, ease: 'power3.out' }, 50)
    if (pill) {
      gsap.fromTo(pill, { autoAlpha: 0 }, {
        autoAlpha: 1,
        duration: 0.3,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: inner, start: 'top top-=40%', toggleActions: 'play none none reverse' },
      })
    }
  })
  return () => ctx.revert()
}

/*
  "Hire Me" (live hero CTA, chunk 030 ≈4259, read 2026-11-18):
    pulse   yoyo forever, 1.75s sine.inOut each way: glow 50px at .15 / #2D2B4F on #ffb0c4 →
            75px at .45 / #693C56 on #FED6E3. Hover or focus drops it (back to the CSS state), leaving
            restarts it.
    hover   the poster art dims to .6 (0.5s sine.inOut), back on leave.
    press   the cursor glow squashes to .6 × .4 and brightens to 1.3 (0.4s sine.inOut), back on release.
            Live also drops the glow to its resting .5 on release, though the pointer is still over the
            button (measured 2026-11-18; the code path wasn't traced), so ours does too.
  Reduced motion: none of these (the CSS hover/focus states remain).
*/
function bindButton(button, poster) {
  const pulse = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 1.75, ease: 'sine.inOut' } })
  pulse.fromTo(
    [button],
    { boxShadow: '0 2px 50px 0 rgba(255, 178, 198, .15)', color: '#2D2B4F', background: '#ffb0c4' },
    { boxShadow: '0 2px 75px 0 hsla(344, 100%, 85%, 0.45)', color: '#693C56', background: '#FED6E3' },
    0,
  )
  const dim = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'sine.inOut' } })
  dim.to([poster], { opacity: 0.6 }, 0)
  const light = cursorLight()
  const squash = gsap.timeline({ paused: true, defaults: { duration: 0.4, ease: 'sine.inOut' } })
  if (light) squash.fromTo([light], { scaleX: 1, scaleY: 1, filter: 'brightness(1)' }, { scaleX: 0.6, scaleY: 0.4, filter: 'brightness(1.3)' }, 0)

  const enter = () => { pulse.revert(); dim.play() }
  const leave = () => { pulse.restart(); dim.reverse(); squash.reverse() }
  const down = () => { pulse.revert(); squash.play() }
  const up = () => {
    pulse.restart()
    squash.reverse()
    if (light) gsap.to([light], { opacity: 0.5, duration: 0.5, ease: 'sine.inOut', overwrite: 'auto' })
  }
  const events = { focusin: enter, mouseenter: enter, mousedown: down, focusout: leave, mouseleave: leave, mouseup: up }
  Object.entries(events).forEach(([e, f]) => button.addEventListener(e, f))
  return () => {
    Object.entries(events).forEach(([e, f]) => button.removeEventListener(e, f))
    // revert, not kill: a killed pulse would leave its inline colours on the button
    pulse.revert()
    dim.revert()
    squash.revert()
  }
}

function Layer({ desktop, mobile, alt, className = '', imgRef, ...rest }) {
  return (
    <picture className={`hero__layer ${className}`} data-preload {...rest}>
      <source media={SQUARE_ART} srcSet={mobile} type="image/avif" />
      <img ref={imgRef} src={desktop} alt={alt} decoding="async" fetchPriority="high" />
    </picture>
  )
}

function Tagline({ className, ref }) {
  return (
    <p ref={ref} className={`hero__tagline ${className}`} data-m="hero-tagline">
      {hero.tagline[0]}
      <br />
      {hero.tagline[1]}
    </p>
  )
}

// Hero: the full poster (collage + logo, two layers on one canvas) with the tagline, "Hire Me" and
// tech tags under it. The intro (src/intro/) plays on the canvas behind the poster when the loader
// fires 'fadeout', then hands over to the poster.
export default function Hero() {
  const rootRef = useRef(null)
  const chevronRef = useRef(null)
  const disclaimerRef = useRef(null)
  const innerRef = useRef(null)
  const posterRef = useRef(null)
  const canvasRef = useRef(null)
  const headerRef = useRef(null)
  const rowRef = useRef(null)
  const buttonRef = useRef(null)
  const finalsRef = useRef([])
  const layerImgs = useRef({})

  useEffect(() => {
    if (hasFired('enable-scroll')) return undefined
    const reduce = reduceMotion()
    // Cut the layers now, while the loader is still up, so the intro starts on 'fadeout' without delay.
    const intro = reduce
      ? null
      : createHeroIntro(
          {
            canvas: canvasRef.current,
            content: innerRef.current,
            poster: posterRef.current,
            finals: finalsRef.current,
            layerImgs: layerImgs.current,
            header: headerRef.current,
            row: rowRef.current,
            extras: [disclaimerRef.current],
            nav: document.querySelector('.nav'),
          },
          () => emit('enable-scroll'),
        )
    let started = false
    const start = () => {
      if (started) return
      started = true
      if (reduce) emit('enable-scroll')
      else intro.play()
    }
    const off = hasFired('fadeout') ? (start(), () => {}) : on('fadeout', start)
    // Live: a resize or rotation during the intro jumps it to the end.
    const resized = () => intro?.resized()
    window.addEventListener('resize', resized)
    window.addEventListener('orientationchange', resized)
    return () => {
      off()
      window.removeEventListener('resize', resized)
      window.removeEventListener('orientationchange', resized)
      intro?.destroy()
    }
  }, [])

  useEffect(() => {
    if (reduceMotion()) return undefined
    return bindButton(buttonRef.current, finalsRef.current[0])
  }, [])

  // Scroll-out + nav pill, once scrolling is enabled (live: the same `enabled` flag).
  useEffect(() => {
    let undo = null
    const pill = document.querySelector('[data-m=nav-pill-wrap]')
    const build = () => {
      if (reduceMotion()) {
        // Static version: no pin or fades; the pill is simply shown.
        gsap.set(pill, { autoAlpha: 1 })
        return
      }
      undo = createScrollOut({
        root: rootRef.current,
        inner: innerRef.current,
        header: headerRef.current,
        row: rowRef.current,
        poster: finalsRef.current[0],
        logo: finalsRef.current[1],
        chevron: chevronRef.current,
        extras: [disclaimerRef.current],
        pill,
      })
    }
    const off = hasFired('enable-scroll') ? (build(), () => {}) : on('enable-scroll', build)
    return () => {
      off()
      undo?.()
    }
  }, [])

  return (
    <>
      <section className="hero" data-m="hero" aria-labelledby="hero-heading" ref={rootRef}>
        <h1 id="hero-heading" className="sr-only">
          {hero.heading}
        </h1>
        <div className="hero__inner" data-m="hero-inner" ref={innerRef}>
          <Tagline className="hero__tagline--top" ref={headerRef} />
          <div className="hero__poster" data-m="hero-poster" ref={posterRef}>
            <canvas ref={canvasRef} className="hero__canvas" data-m="hero-canvas" aria-hidden="true" />
            {LAYER_NAMES.map((name) => (
              <Layer
                key={name}
                className="hero__layer--intro"
                desktop={artFor(desktopArt, name)}
                mobile={artFor(mobileArt, name)}
                alt=""
                aria-hidden="true"
                imgRef={(el) => { layerImgs.current[name] = el }}
              />
            ))}
            <Layer
              desktop={posterDesktop}
              mobile={posterMobile}
              alt={hero.posterAlt}
              ref={(el) => { finalsRef.current[0] = el }}
            />
            <Layer desktop={logoDesktop} mobile={logoMobile} alt="" ref={(el) => { finalsRef.current[1] = el }} />
          </div>
          <div className="hero__row" data-m="hero-row" ref={rowRef}>
            <div className="hero__col hero__col--start">
              <Tagline className="hero__tagline--row" />
            </div>
            <a ref={buttonRef} className="hero__button" data-m="hero-button" href={hero.button.href}>
              {hero.button.label}
            </a>
            <ul className="hero__tags" data-m="hero-tags" aria-label="Tech stack">
              {hero.tags.map((tag) => (
                <li key={tag} className="hero__tag" data-m="hero-tag">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Live: the scroll-out fades the indicator's container; the chevron itself stays hidden at rest. */}
        <div ref={chevronRef} className="hero__scroll">
          <svg className="hero__chevron" data-m="hero-chevron" viewBox="0 0 34 14" aria-hidden="true" focusable="false">
            <path d="M2 2 17 11.5 32 2" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p ref={disclaimerRef} className="hero__disclaimer" data-m="hero-disclaimer">
          {hero.disclaimer}
        </p>
      </section>
    </>
  )
}
