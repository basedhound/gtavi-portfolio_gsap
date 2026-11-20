import { useLayoutEffect, useRef } from 'react'
import { meetTheDeveloper as content } from '../content.js'
import { gsap, reduceMotion } from '../lib/gsap.js'
import { cursorLight } from '../lib/background.js'
import sceneArt from '../assets/site/meet-the-developer/scene.avif'
import ProjectCards from './ProjectCards.jsx'
import './MeetTheDeveloper.css'

/*
  Meet the Developer, in the live "Watch" section's place (live ._6sjiom*, JS read 2026-11-18).
  The scene sits behind the hero (z -1, pulled up 65lvh) and is 135lvh tall. Three scrubbed timelines:
    pin    scene pinned from its top at the viewport top until the cards' top gets there;
           art scales 1.2 → 1, content 1.05 → .9
    enter  over the first screen of the pin (units of 110): backdrop fades in (power3.in) while its
           brightness goes .2 → 1 (power1.in, 0–61); text fades in 30–100 (power3.in); play button
           70–110 (sine.in); cursor glow .5 → 0 (0–61)
    leave  as the cards rise (cards top at the viewport bottom → top): backdrop out 0–80, text out
           0–100, play button out 10–70 (sine.out)
  The cursor glow returns to .5 while the cards' top crosses the last quarter-screen below the
  viewport, and fades out again once their bottom passes 90% up the viewport.
*/
export default function MeetTheDeveloper() {
  const sceneRef = useRef(null)
  const contentRef = useRef(null)
  const textRef = useRef(null)
  const playRef = useRef(null)
  const bgRef = useRef(null)
  const artRef = useRef(null)
  const cardsRef = useRef(null)

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined
    const scene = sceneRef.current
    const cards = cardsRef.current
    const ctx = gsap.context(() => {
      const pin = gsap.timeline({
        paused: true,
        defaults: { duration: 100, ease: 'none' },
        scrollTrigger: { scrub: true, pin: true, pinSpacing: false, trigger: scene, start: 'top top', endTrigger: cards, end: 'top top' },
      })
      pin.fromTo([artRef.current], { scale: 1.2 }, { scale: 1 }, 0)
      pin.fromTo([contentRef.current], { scale: 1.05 }, { scale: 0.9 }, 0)

      const enter = gsap.timeline({
        paused: true,
        defaults: { duration: 100, ease: 'none' },
        scrollTrigger: { scrub: true, trigger: scene, start: 'top top', end: '+=100%' },
      })
      enter.fromTo([bgRef.current], { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.in' }, 0)
      enter.fromTo([bgRef.current], { filter: 'brightness(0.2)' }, { filter: 'brightness(1)', ease: 'power1.in', duration: 61 }, 0)
      enter.fromTo([playRef.current], { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all', duration: 40, ease: 'sine.in' }, 70)
      enter.fromTo([textRef.current], { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.in', duration: 70 }, 30)

      const leave = gsap.timeline({
        paused: true,
        defaults: { duration: 100, ease: 'none' },
        scrollTrigger: { scrub: true, trigger: cards, start: 'top bottom', end: 'top top' },
      })
      leave.to([playRef.current], { opacity: 0, pointerEvents: 'none', duration: 60, ease: 'sine.out' }, 10)
      leave.to([bgRef.current], { autoAlpha: 0, duration: 80 }, 0)
      leave.to([textRef.current], { opacity: 0 }, 0)

      // Keyboard: focusing the play button while the scene is faded out scrolls to where it's fully
      // shown (the end of 'enter'), so the focus outline is never on an invisible button.
      const play = playRef.current
      const reveal = () => {
        if (parseFloat(getComputedStyle(play).opacity) < 0.99) window.scrollTo(0, enter.scrollTrigger.end)
      }
      play.addEventListener('focus', reveal)

      const light = cursorLight()
      if (light) {
        enter.fromTo([light], { opacity: 0.5 }, { opacity: 0, duration: 61, immediateRender: false }, 0)
        gsap.fromTo([light], { opacity: 0 }, {
          opacity: 0.5,
          immediateRender: false,
          scrollTrigger: { scrub: true, trigger: cards, start: 'top bottom+=25%', end: 'top bottom' },
        })
        gsap.to([light], {
          opacity: 0,
          immediateRender: false,
          scrollTrigger: { scrub: true, trigger: cards, start: 'bottom center-=40%', end: '+=20%' },
        })
      }
      return () => play.removeEventListener('focus', reveal)
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="mtd" data-m="mtd" aria-labelledby="mtd-title">
      <div className="mtd__scene" data-m="mtd-scene" ref={sceneRef}>
        <div className="mtd__content" data-m="mtd-content" ref={contentRef}>
          <div className="mtd__text" data-m="mtd-text" ref={textRef}>
            <p className="mtd__eyebrow" data-m="mtd-eyebrow">{content.eyebrow}</p>
            <h2 id="mtd-title" className="mtd__title" data-m="mtd-title">{content.title}</h2>
          </div>
          <a className="mtd__play" data-m="mtd-play" href={content.playHref} ref={playRef}>
            <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              <path d="M41 33.5v33a1.5 1.5 0 0 0 2.3 1.3l25.4-16.5a1.5 1.5 0 0 0 0-2.6L43.3 32.2A1.5 1.5 0 0 0 41 33.5Z" fill="currentColor" />
            </svg>
            <span className="sr-only">{content.playLabel}</span>
          </a>
        </div>
        <div className="mtd__bg" data-m="mtd-bg" ref={bgRef}>
          <img className="mtd__art" data-m="mtd-art" ref={artRef} src={sceneArt} alt={content.sceneAlt} decoding="async" />
        </div>
      </div>
      <ProjectCards ref={cardsRef} />
    </section>
  )
}
