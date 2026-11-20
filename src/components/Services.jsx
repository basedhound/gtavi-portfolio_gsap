import { useLayoutEffect, useRef } from 'react'
import { services as content } from '../content.js'
import { gsap, matches, reduceMotion } from '../lib/gsap.js'
import { cursorLight } from '../lib/background.js'
import Card from './Card.jsx'
import ScrollVideo from './ScrollVideo.jsx'
import tallDesktop from '../assets/site/services/card-tall-desktop.avif'
import tallMobile from '../assets/site/services/card-tall-mobile.avif'
import short from '../assets/site/services/card-short.avif'
import './Services.css'

/*
  Services, in the live Ultimate Edition section's place (live .gihvh7*, JS read 2026-11-18). The video
  backdrop sits behind the end of the previous section (z -1, pulled up 65lvh, 135lvh tall) and pins
  from its top at the viewport top until the cards' top gets there, zooming 1 → 1.1.
    progress  from the backdrop's top at 25% of the screen to the cards' top at the top
    enter     from that same start, over one screen: backdrop fades in (power3.in) while its brightness
              goes .2 → 1 (power1.in, 61%)
    leave     cards' top from 80% (60% on phones) of the screen to the top: backdrop fades out; in the
              last 20% its brightness drops back to .2 and the glow behind the cards fades
    glow      cursor glow .5 as the cards arrive, 0 once they've passed (same triggers as the scene)
  Our clip is 34 frames, far fewer than live's 300, so it plays only while the backdrop is fully shown
  (between the end of 'enter' and the start of 'leave') and holds its first and last frames either side.
*/
const BIG_THEME = { bg: '#4b2f54', eyebrow: '#fee8ea', accent: '#ffd4a8', glow1: '#583660', glow2: '#6a3e6c', ctaHover: '#ffc080', ctaPressed: '#ffa74d' }
const WIDE_THEME = { bg: '#243152', eyebrow: '#b8f0ea', accent: '#e6ffa3', ctaText: '#0d0c1a', glow1: '#273c5c', glow2: '#315573', ctaHover: '#e1fa9e', ctaPressed: '#d6f485' }

export default function Services() {
  const wrapRef = useRef(null)
  const cardsRef = useRef(null)
  const backdropRef = useRef(null)
  const videoRef = useRef(null)
  const apiRef = useRef(null)

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined
    const wrap = wrapRef.current
    const cards = cardsRef.current
    const mobile = matches('mobile')
    const exitAt = mobile ? 0.4 : 0.2
    const start = 'top top+=25%'
    const ctx = gsap.context(() => {
      gsap.fromTo(videoRef.current, { scale: 1 }, {
        scale: 1.1,
        ease: 'none',
        scrollTrigger: { scrub: true, pinSpacing: false, pin: wrap, trigger: wrap, start: 'top top', endTrigger: cards, end: 'top top' },
      })

      // Progress → video, played over the fully-shown part of the range.
      let a = 0
      let b = 1
      gsap.timeline({
        paused: true,
        scrollTrigger: {
          scrub: true,
          trigger: wrap,
          start,
          endTrigger: cards,
          end: 'top top',
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            const len = self.end - self.start
            const vh = window.innerHeight
            a = Math.min(1, vh / len)
            b = Math.max(a, (len - (1 - exitAt) * vh) / len)
            apiRef.current?.progress((self.progress - a) / (b - a))
          },
          onUpdate: (self) => apiRef.current?.progress((self.progress - a) / (b - a)),
        },
      })

      const enter = gsap.timeline({ paused: true, defaults: { duration: 100, ease: 'none' }, scrollTrigger: { scrub: true, trigger: wrap, start, end: '+=100%' } })
      enter.fromTo([wrap], { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.in', duration: 100 }, 0)
      enter.fromTo([wrap], { filter: 'brightness(0.2)' }, { filter: 'brightness(1)', ease: 'power1.in', duration: 61 }, 0)

      const leave = gsap.timeline({
        paused: true,
        defaults: { duration: 100, ease: 'none' },
        scrollTrigger: { scrub: true, trigger: cards, start: `top bottom-=${exitAt * 100}%`, end: 'top top' },
      })
      leave.to([wrap], { opacity: 0, duration: 100 }, 0)
      leave.fromTo([wrap], { filter: 'brightness(1)' }, { filter: 'brightness(.2)', duration: 20 }, 80)
      leave.to([backdropRef.current], { opacity: 0, duration: 20 }, 80)

      const light = cursorLight()
      if (light) {
        gsap.fromTo([light], { opacity: 0 }, { opacity: 0.5, immediateRender: false, scrollTrigger: { scrub: true, trigger: cards, start: 'top bottom+=25%', end: 'top bottom' } })
        gsap.to([light], { opacity: 0, immediateRender: false, scrollTrigger: { scrub: true, trigger: cards, start: 'bottom center-=40%', end: '+=20%' } })
      }
    })
    return () => ctx.revert()
  }, [])

  const [big, wide] = content.cards
  return (
    <section className="svc" data-m="svc" data-theme="raised" aria-labelledby="svc-heading">
      <h2 id="svc-heading" className="sr-only">{content.heading}</h2>
      <div className="svc__wrap" data-m="svc-wrap" ref={wrapRef}>
        <ScrollVideo name="services" className="svc__video" data-m="svc-video" videoRef={videoRef} ref={apiRef} />
      </div>
      <div className="svc__cards" data-m="svc-cards" ref={cardsRef}>
        <div className="svc__backdrop" ref={backdropRef} aria-hidden="true" />
        <Card
          shape="big"
          side="right"
          theme={BIG_THEME}
          href={big.href}
          art={tallDesktop}
          artMobile={tallMobile}
          artPosition="50% 50%"
          artPositionMobile="50% 0%"
          title={big.title}
          text={big.text}
          cta={big.button}
          ctaIcon="arrow"
          data-m="svc-big"
        />
        <Card
          shape="wide"
          side="left"
          short
          theme={WIDE_THEME}
          href={wide.href}
          art={short}
          artPosition="50% 0%"
          artPositionMobile="80% 0%"
          eyebrow={wide.eyebrow}
          title={wide.title}
          text={wide.text}
          cta={wide.button}
          ctaIcon="arrow"
          data-m="svc-wide"
        />
      </div>
    </section>
  )
}
