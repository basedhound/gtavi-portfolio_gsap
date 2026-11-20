// One place to register GSAP plugins, plus the live site's breakpoints (live JS, `breakpoints` export,
// read 2026-11-18) for the scroll timelines that branch on them.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// Live sets these globally (020 bundle): tweens without their own ease are linear, e.g. the cursor
// glow's scroll fades.
gsap.defaults({ ease: 'none', duration: 100 })

export { gsap, ScrollTrigger }

export const BREAKPOINTS = {
  mobile: '(max-width: 767.98px)',
  mobilePortrait: '(max-width: 767.98px) and (orientation: portrait)',
  touch: '(pointer: coarse)',
}

export const matches = (name) => window.matchMedia(BREAKPOINTS[name] ?? name).matches
export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
