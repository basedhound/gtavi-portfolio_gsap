import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reduceMotion } from '../lib/gsap.js'
import './Card.css'

/*
  Promo card (live ._s7pzuf*, card JS read 2026-11-18; spec in AGENTS.md Findings › Cards). The whole
  card is one link; the pill inside is visual only.
  shape   'wide'  5:2, text bottom-left or bottom-right, smaller (MD) text
          'big'   37:20, text vertically centred on one side, larger (LG) text, no image fade
          'half'  column: square image area, text centred under it (project cards)
  On portrait phones 'wide' and 'big' become columns too (square image area, or 3:2 when `short`).
  Motion: the card scales .985 → 1 as it scrolls up to the middle of the screen; the picture
  drifts against the scroll (parallax speed .97); on wide cards the image fade follows the pointer.
*/

// Live getHeadlineSize: 1 (≤13 characters) … 5 (> 40), on the headline's text.
const headlineSize = (text) => {
  const n = text.length
  return n > 40 ? 5 : n > 30 ? 4 : n > 23 ? 3 : n > 13 ? 2 : 1
}

const SPEED = 0.97

function PlayGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6.5 4.6v10.8a.6.6 0 0 0 .92.5l8.3-5.4a.6.6 0 0 0 0-1L7.42 4.1a.6.6 0 0 0-.92.5Z" fill="currentColor" />
    </svg>
  )
}
function ArrowGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Card({
  shape,
  side = 'left',
  short = false,
  theme,
  href,
  art,
  artMobile,
  artPosition,
  artPositionMobile,
  eyebrow,
  title,
  text,
  cta,
  ctaIcon,
  ctaAppearance = 'accent',
  play = false,
  className = '',
  ...rest
}) {
  const cardRef = useRef(null)
  const picRef = useRef(null)
  const lines = title.split(' / ')
  const size = headlineSize(lines.join(''))

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined
    const card = cardRef.current
    const pic = picRef.current
    const ctx = gsap.context(() => {
      // Scale .985 → 1 by the time the card is centred, then hold.
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } })
      tl.fromTo(card, { scale: 0.985 }, { scale: 1, duration: 50 }, 0).to(card, { scale: 1, duration: 50 }, 50)

      // Parallax (live useParallax, speed .97): the picture is scaled up to cover a drift of
      // `change`, and moves from -change/2 to +change/2 over a range stretched by 1/speed.
      const k = (1 - SPEED) / SPEED
      let change = 0
      const st = ScrollTrigger.create({
        trigger: pic,
        refreshPriority: -1,
        start: () => {
          const h = pic.offsetHeight
          change = (k * (window.innerHeight + h)) / (1 - k)
          gsap.set(pic, { scale: (h + change) / h })
          const stretch = (window.innerHeight + h) / SPEED - (window.innerHeight + h)
          return `top bottom+=${stretch / 2}`
        },
        end: () => {
          const h = pic.offsetHeight
          const stretch = (window.innerHeight + h) / SPEED - (window.innerHeight + h)
          return `bottom top-=${stretch / 2}`
        },
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(pic, { y: change * (self.progress - 0.5) }),
        onRefresh: (self) => gsap.set(pic, { y: change * (self.progress - 0.5) }),
      })
      gsap.set(pic, { y: change * (st.progress - 0.5) })

      // Wide cards: the fade's centre drifts against the pointer (rest -5% / 140%).
      if (shape === 'wide') {
        const setX = gsap.quickSetter(card, '--mx', '%')
        const setY = gsap.quickSetter(card, '--my', '%')
        const pos = { x: -5, y: 140 }
        setX(pos.x)
        setY(pos.y)
        const toX = gsap.quickTo(pos, 'x', { duration: 0.3, ease: 'none', onUpdate: () => setX(pos.x) })
        const toY = gsap.quickTo(pos, 'y', { duration: 0.3, ease: 'none', onUpdate: () => setY(pos.y) })
        const clamp = gsap.utils.clamp
        const move = (e) => {
          const r = card.getBoundingClientRect()
          const a = clamp(0, 1, (e.clientX - r.left) / r.width)
          const b = clamp(0, 1, (e.clientY - r.top) / r.height)
          toX(clamp(-15, 5, -5 - 10 * ((a - 0.5) * 2)))
          toY(clamp(133, 147, 140 - 7 * ((b - 0.5) * 2)))
        }
        const leave = () => { toX(-5); toY(140) }
        card.addEventListener('pointermove', move, { passive: true })
        card.addEventListener('pointerleave', leave, { passive: true })
        return () => {
          card.removeEventListener('pointermove', move)
          card.removeEventListener('pointerleave', leave)
        }
      }
      return undefined
    })
    return () => ctx.revert()
  }, [shape])

  const style = {
    '--card-bg': theme.bg,
    '--card-eyebrow': theme.eyebrow,
    '--card-accent': theme.accent,
    '--card-glow-1': theme.glow1,
    '--card-glow-2': theme.glow2,
    '--cta-bg': theme.ctaBg ?? theme.accent,
    '--cta-text': theme.ctaText ?? '#0f0c1a',
    '--cta-hover': theme.ctaHover,
    '--cta-pressed': theme.ctaPressed,
    '--art-pos': artPosition,
    '--art-pos-mobile': artPositionMobile ?? artPosition,
  }

  return (
    <a
      ref={cardRef}
      href={href}
      className={`card card--${shape} card--${side}${short ? ' card--short' : ''} ${className}`}
      data-size={size}
      style={style}
      {...rest}
    >
      {play && (
        <span className="card__play" aria-hidden="true">
          <svg viewBox="0 0 100 100" focusable="false">
            <path d="M41 33.5v33a1.5 1.5 0 0 0 2.3 1.3l25.4-16.5a1.5 1.5 0 0 0 0-2.6L43.3 32.2A1.5 1.5 0 0 0 41 33.5Z" fill="currentColor" />
          </svg>
        </span>
      )}
      <span className="card__text" data-m="card-text">
        {eyebrow && <span className="card__eyebrow" data-m="card-eyebrow">{eyebrow}</span>}
        <span className="card__title" data-m="card-title" role="heading" aria-level={3}>
          {lines.map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
        {text && <span className="card__body" data-m="card-body">{text}</span>}
        {cta && (
          <span className={`card__cta card__cta--${ctaAppearance}${ctaIcon ? ` card__cta--icon-${ctaIcon === 'play' ? 'lead' : 'trail'}` : ''}`} data-m="card-cta">
            {ctaIcon === 'play' && <PlayGlyph />}
            {cta}
            {ctaIcon === 'arrow' && <ArrowGlyph />}
          </span>
        )}
      </span>
      <picture className="card__pic" data-m="card-pic" ref={picRef} aria-hidden="true">
        {artMobile && <source media="(max-width: 767.98px) and (orientation: portrait)" srcSet={artMobile} />}
        <img src={art} alt="" decoding="async" loading="lazy" />
      </picture>
    </a>
  )
}
