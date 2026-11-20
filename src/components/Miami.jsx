import { useLayoutEffect, useRef } from 'react'
import { miami as content } from '../content.js'
import { gsap, matches, reduceMotion } from '../lib/gsap.js'
import { cursorLight } from '../lib/background.js'
import ScrollVideo from './ScrollVideo.jsx'
import './Miami.css'

/*
  Miami, USA., in the live "Vice City, USA." section's place (live .n5j5p6*, "back-of-box" JS read
  2026-11-18). The section is pulled 150lvh up under the end of Services; the city video fills its
  first screen and the title and bio sit 250lvh further down. Five scrubbed timelines, as live:
    pin       video wrapper pinned from its top at the viewport top until the text's top gets there;
              the video zooms 1 → 1.1
    progress  over the same range (section top at top → text top at top) the video plays all 149
              frames (≈ 20px of scroll per frame at 1440, 19px at 375)
    enter     from the section top at the viewport top, over 1.5 screens (1 on phones): wrapper fades
              in (power3.in)
    leave     from the text's top 0.9 screens (1.5 on phones) below the viewport bottom until it
              reaches the top: the wrapper's mask closes to an ellipse at the top (power1.out) and in
              the second half the wrapper fades out
    text      the title and bio are clipped to a gradient that shifts from bronze/rose (brightness .8)
              to peach/pink and then to blue/violet while the text crosses the screen
  Cursor glow: back to .5 while the text's top crosses the bottom 30% of the screen.
  Reduced motion: the poster, a screen tall and faded at the bottom, then the text; no pin or fades.
*/
const MASK_FROM = (m) => `radial-gradient(${m ? '250%' : '150%'} 150% at 50% 50%, rgba(0, 0, 0, 1) 100%, rgba(0, 0, 0, 0.5) 150%)`
const MASK_TO = (m) => `radial-gradient(${m ? '200%' : '100%'} 100% at 50% ${m ? '-40%' : '-50%'}, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.25) 90%)`
const TEXT_1 = 'linear-gradient(0deg, #99743d -10%, #ad4556 90%)'
const TEXT_2 = 'linear-gradient(0deg, #FEC497 10%, #E9639B 100%)'
const TEXT_3 = 'linear-gradient(0deg, #99C7FE 30%, #D263E9 110%)'

export default function Miami() {
  const rootRef = useRef(null)
  const wrapRef = useRef(null)
  const contentRef = useRef(null)
  const videoRef = useRef(null)
  const apiRef = useRef(null)

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined
    const root = rootRef.current
    const wrap = wrapRef.current
    const text = contentRef.current
    const mobile = matches('mobile')
    const ctx = gsap.context(() => {
      gsap.fromTo(videoRef.current, { scale: 1 }, {
        scale: 1.1,
        ease: 'none',
        // Live pins with spacing, but the wrapper's grid rows have fixed heights, so the spacer
        // changes nothing; without it the layout is the same.
        scrollTrigger: { scrub: true, pin: wrap, pinSpacing: false, trigger: wrap, start: 'top top', endTrigger: text, end: 'top top' },
      })

      gsap.timeline({
        paused: true,
        scrollTrigger: {
          scrub: true,
          trigger: root,
          start: 'top top',
          endTrigger: text,
          end: 'top top',
          invalidateOnRefresh: true,
          onUpdate: (self) => apiRef.current?.progress(self.progress),
          onRefresh: (self) => apiRef.current?.progress(self.progress),
        },
      })

      const enter = gsap.timeline({ paused: true, defaults: { duration: 100, ease: 'none' }, scrollTrigger: { scrub: true, trigger: root, start: 'top top', end: mobile ? '+=100%' : '+=150%' } })
      enter.fromTo([wrap], { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.in', duration: 100 }, 0)

      const leave = gsap.timeline({
        paused: true,
        defaults: { duration: 100, ease: 'none', immediateRender: false },
        scrollTrigger: { scrub: true, trigger: text, start: mobile ? 'top-=150% bottom' : 'top-=90% bottom', end: 'top top' },
      })
      leave.fromTo([wrap], { maskImage: MASK_FROM(mobile) }, { maskImage: MASK_TO(mobile), ease: 'power1.out' }, 0)
      leave.to([wrap], { autoAlpha: 0, duration: 50 }, 50)

      const light = cursorLight()
      if (light) {
        gsap.to([light], { opacity: 0.5, immediateRender: false, scrollTrigger: { scrub: true, trigger: text, start: 'top bottom', end: '+=30%' } })
      }

      const tint = gsap.timeline({ paused: true, defaults: { duration: 100, ease: 'none' }, scrollTrigger: { scrub: true, trigger: text, start: 'top bottom', end: 'bottom top' } })
      tint.fromTo([text], { backgroundImage: TEXT_1, filter: 'brightness(0.8)' }, { backgroundImage: TEXT_2, filter: 'brightness(1)', duration: 50 }, 0)
      tint.fromTo([text], { backgroundImage: TEXT_2 }, { backgroundImage: TEXT_3, duration: 50 }, 50)
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="miami" data-m="miami" data-theme="base" ref={rootRef} aria-labelledby="miami-heading">
      <div className="miami__wrap" data-m="miami-wrap" ref={wrapRef}>
        <ScrollVideo name="city" className="miami__video" data-m="miami-video" videoRef={videoRef} ref={apiRef} />
      </div>
      <div className="miami__content" data-m="miami-content" ref={contentRef}>
        <h2 id="miami-heading" className="miami__title" data-m="miami-title">{content.title}</h2>
        <p className="miami__bio" data-m="miami-bio">{content.bio}</p>
      </div>
    </section>
  )
}
