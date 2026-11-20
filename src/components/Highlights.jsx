import { wideCards } from '../content.js'
import Card from './Card.jsx'
import openToWork from '../assets/site/highlights/mission-1.avif'
import afterHours from '../assets/site/highlights/mission-4.avif'
import afterHoursMobile from '../assets/site/highlights/mission-4-mobile.avif'
import caseStudy from '../assets/site/highlights/mission-3.avif'
import offTheClock from '../assets/site/highlights/mission-2.avif'
import './Highlights.css'

/*
  The four wide cards under Miami, USA. (live feature cards ._15id12y*, measured 2026-11-18): Open to
  Work, After Hours, Case Study, Off the Clock, with the colours, text side (left, right, left, right)
  and page theme of live cards 1–4; each text side is also where our art leaves room. On portrait
  phones they take the short layout (3:2 image area, text left), as live. Each card is a page-theme
  marker. Art: sunset-coast, after-hours-nightclub (1024×410, soft on desktop), vault-heist,
  alligator-float banners (2.5:1). On portrait phones the art's top shows the subject (art-pos-mobile).
*/
const CARDS = [
  {
    art: openToWork,
    artPositionMobile: '62% 0%',
    marker: 'violet',
    theme: { bg: '#4b2f54', eyebrow: '#fee8ea', accent: '#ffd4a8', ctaText: '#0f0c1a', glow1: '#583660', glow2: '#6a3e6c', ctaHover: '#ffc080', ctaPressed: '#ffa74d' },
  },
  {
    art: afterHours,
    // the banner's face would fill a phone card under the text; its own cut puts it above (tools/cut-art.py)
    artMobile: afterHoursMobile,
    artPositionMobile: '50% 0%',
    marker: 'indigo',
    // live card 2 (bg #243152, CTA #e6ffa3 / #0d0c1a measured); same palette as the Services wide card
    theme: { bg: '#243152', eyebrow: '#b8f0ea', accent: '#e6ffa3', ctaText: '#0d0c1a', glow1: '#273c5c', glow2: '#315573', ctaHover: '#e1fa9e', ctaPressed: '#d6f485' },
  },
  {
    art: caseStudy,
    artPositionMobile: '60% 0%',
    marker: 'jade',
    theme: { bg: '#162623', eyebrow: '#d1ddb0', accent: '#ffdf9e', ctaText: '#071012', glow1: '#243830', glow2: '#294235', ctaHover: '#fbd383', ctaPressed: '#f6c76a' },
  },
  {
    art: offTheClock,
    artPositionMobile: '14% 0%',
    marker: 'navy',
    theme: { bg: '#2c3868', eyebrow: '#d9f3fe', accent: '#ffc5b8', ctaText: '#0d0c1a', glow1: '#324275', glow2: '#394e84', ctaHover: '#fcae9c', ctaPressed: '#f79882' },
  },
]

export default function Highlights() {
  return (
    <section className="highlights" data-m="highlights" aria-label="Highlights">
      {wideCards.map((c, i) => (
        <Card
          key={c.title}
          shape="wide"
          side={c.side}
          short
          theme={CARDS[i].theme}
          href={c.href}
          art={CARDS[i].art}
          artMobile={CARDS[i].artMobile}
          artPosition="50% 50%"
          artPositionMobile={CARDS[i].artPositionMobile}
          eyebrow={c.eyebrow}
          title={c.title}
          text={c.text}
          cta={c.button}
          ctaIcon="arrow"
          data-theme={CARDS[i].marker}
          data-m="hl-card"
        />
      ))}
    </section>
  )
}
