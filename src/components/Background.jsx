import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, matches } from '../lib/gsap.js'
import { setBackgroundRefs } from '../lib/background.js'
import './Background.css'

/*
  Page background (live BackgroundProvider, read and measured 2026-11-18; spec in AGENTS.md Findings):
  three fixed layers behind every section — fill (z -4), cursor glow (z -3), overlay (z -2).
    glow     150vmax circle, radial spotlight colour → transparent, opacity .5, grain at 3%. Its centre
             chases the pointer (quickTo x/y, 0.4s linear), starting at the viewport's top-left corner.
             Hovering any link or button raises it to 1 (0.5s sine.inOut), leaving returns it to .5.
             Hidden on touch screens.
    fill     the section theme's colour (pointer devices) or gradient (touch).
    overlay  solid page colour at load; the hero intro fades it out.
  Themes: each [data-theme] section scrubs fill, body and glow colour from the previous theme's values
  to its own, from its top at the viewport bottom to its top at the viewport top (or, when it's shorter
  than the screen, until its bottom reaches the viewport bottom).
*/
const THEMES = {
  base: { fill: '#0c0d1b', spotlight: '#1f1f38', gradient: ['#1f1f38', '#18182d', '#111222', '#0c0d1b'] },
  raised: { fill: '#18182d', spotlight: '#2f2e52', gradient: ['#2f2e52', '#252644', '#1f1f38', '#18182d'] },
  // Wide cards under Miami, USA. (live feature cards 1–4) and Clients (live Shop); sampled on the
  // live page per marker at 1440 (fill, spotlight) and 375 (touch gradient), 2026-11-18.
  violet: { fill: '#0f0c1a', spotlight: '#2d1f36', gradient: ['#2d1f36', '#1e1728', '#16111f', '#0f0c1a'] },
  indigo: { fill: '#0d0c1a', spotlight: '#142242', gradient: ['#142242', '#161733', '#111126', '#0d0c1a'] },
  jade: { fill: '#071012', spotlight: '#142e25', gradient: ['#142e25', '#0f1e1d', '#0d1516', '#071012'] },
  navy: { fill: '#0d0c1a', spotlight: '#16203f', gradient: ['#16203f', '#151732', '#111127', '#0d0c1a'] },
  plum: { fill: '#1e1728', spotlight: '#31223e', gradient: ['#472b4f', '#31223e', '#271c33', '#1e1728'] },
}
const gradient = (c) => `linear-gradient(189deg, ${c[0]} 0.55%, ${c[1]} 30.38%, ${c[2]} 65.19%, ${c[3]} 100%)`
const fillOf = (t, touch) => (touch ? gradient(t.gradient) : t.fill)

export default function Background() {
  const fillRef = useRef(null)
  const glowRef = useRef(null)
  const overlayRef = useRef(null)

  useLayoutEffect(() => {
    const glow = glowRef.current
    const fill = fillRef.current
    // Background renders before <main>, so this layout effect runs before the sections' and they
    // can read the refs.
    setBackgroundRefs({ cursorLight: glow, overlay: overlayRef.current })
    const touch = matches('touch')

    const ctx = gsap.context(() => {
      gsap.set(fill, { background: fillOf(THEMES.base, touch) })
      gsap.set(glow, { xPercent: -50, yPercent: -50, '--spotlight': THEMES.base.spotlight })
      gsap.set(document.body, { background: THEMES.base.fill })

      // Follow the pointer.
      const x = gsap.quickTo(glow, 'x', { duration: 0.4, ease: 'none' })
      const y = gsap.quickTo(glow, 'y', { duration: 0.4, ease: 'none' })
      const move = (e) => { x(e.clientX); y(e.clientY) }
      window.addEventListener('pointermove', move, { passive: true })

      // Brighten over anything clickable. Delegated, so links added later count too.
      const rest = 0.5
      // Live binds these at mount, before the navbar exists, so nav links don't raise it; same here.
      const isTarget = (el) => el instanceof Element && el.closest('a, button, [data-cursor]') && !el.closest('nav')
      const over = (e) => {
        if (isTarget(e.target) && !isTarget(e.relatedTarget)) gsap.to(glow, { opacity: 1, duration: 0.5, ease: 'sine.inOut', overwrite: 'auto' })
      }
      const out = (e) => {
        if (isTarget(e.target) && !isTarget(e.relatedTarget)) gsap.to(glow, { opacity: rest, duration: 0.5, ease: 'sine.inOut', overwrite: 'auto' })
      }
      document.addEventListener('mouseover', over, { passive: true })
      document.addEventListener('mouseout', out, { passive: true })

      // Section themes.
      const markers = gsap.utils.toArray('[data-theme]')
      let prev = THEMES.base
      markers.forEach((marker) => {
        const theme = THEMES[marker.dataset.theme] ?? THEMES.base
        const from = prev
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: marker,
            start: 'top bottom',
            end: () => `top top+=${marker.offsetHeight < window.innerHeight ? window.innerHeight - marker.offsetHeight : 0}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        tl.fromTo(document.body, { background: from.fill }, { background: theme.fill }, 0)
        tl.fromTo(fill, { background: fillOf(from, touch) }, { background: fillOf(theme, touch) }, 0)
        tl.fromTo(glow, { '--spotlight': from.spotlight }, { '--spotlight': theme.spotlight }, 0)
        prev = theme
      })
      ScrollTrigger.refresh()

      return () => {
        window.removeEventListener('pointermove', move)
        document.removeEventListener('mouseover', over)
        document.removeEventListener('mouseout', out)
      }
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      <div ref={glowRef} className="bg-glow" data-m="bg-glow" aria-hidden="true" />
      <div ref={fillRef} className="bg-fill" data-m="bg-fill" aria-hidden="true" />
      <div ref={overlayRef} className="bg-overlay" data-m="bg-overlay" aria-hidden="true" />
    </>
  )
}
