import { useEffect, useRef, useState } from 'react'
import { emit, on } from '../lib/loaderEvents.js'
import './Loader.css'

// Live: NEXT_PUBLIC_LOAD_TIMEOUT = 15000. After that the page carries on without waiting.
const LOAD_TIMEOUT = 15000
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Ready when the fonts and every image marked data-preload (the hero's poster and intro layers) are
// decoded, or when the timeout runs out.
function whenReady() {
  const imgs = [...document.querySelectorAll('[data-preload] img')]
  const work = Promise.all([
    document.fonts?.load('500 1em Outfit').catch(() => {}),
    document.fonts?.ready,
    ...imgs.map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {})),
  ])
  return Promise.race([work, new Promise((ok) => setTimeout(ok, LOAD_TIMEOUT))])
}

/*
  Loading screen, ported from the live loader (loader chunk + ._2qmne3* CSS, read 2026-11-18):
  the logo shimmers on a 2.15s loop over the page gradient. When loading is done it waits for the
  current loop to end, pauses, fires 'fadeout' (the hero intro starts behind it), fades the logo out
  (1000ms), then the overlay (1300ms). It stays in the DOM, blocking clicks and scrolling, until the
  intro fires 'enable-scroll'.
*/
export default function Loader() {
  const [mounted, setMounted] = useState(true)
  const rootRef = useRef(null)
  const logoRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const html = document.documentElement
    html.style.overflow = 'hidden'
    const offEnable = on('enable-scroll', () => {
      html.style.overflow = ''
      setMounted(false)
    })

    ;(async () => {
      await whenReady()
      if (cancelled) return
      const logo = logoRef.current
      const root = rootRef.current
      const reduce = reduceMotion()
      if (!reduce) {
        const anims = logo.getAnimations({ subtree: true })
        if (anims[0]) await new Promise((ok) => logo.addEventListener('animationiteration', ok, { once: true }))
        if (cancelled) return
        anims.forEach((a) => a.pause())
      }
      emit('fadeout')
      if (!reduce) {
        await logo.animate([{ opacity: 0 }], { fill: 'forwards', easing: 'cubic-bezier(0.2, 0, 0.8, 1)', duration: 1000 }).finished
        await root.animate([{ opacity: 1 }, { opacity: 0 }], { fill: 'forwards', easing: 'cubic-bezier(0.4, 0, 0.8, 1)', duration: 1300 }).finished
      }
      emit('complete')
    })()

    return () => {
      cancelled = true
      offEnable()
      html.style.overflow = ''
    }
  }, [])

  if (!mounted) return null
  return (
    <div ref={rootRef} className="loader" data-m="loader" aria-hidden="true">
      <div ref={logoRef} className="loader__logo" data-m="loader-logo">
        <div className="loader__outline" />
        <div className="loader__fill" />
      </div>
    </div>
  )
}
