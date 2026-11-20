import { clients as content } from '../content.js'
import Card from './Card.jsx'
import Carousel from './Carousel.jsx'
import SectionHead from './SectionHead.jsx'
import keyRack from '../assets/site/clients/clients.avif'
import postcard from '../assets/site/clients/testimonial.avif'
import './Rows.css'

/*
  Clients, in the live Shop section's place (live ._82fiuk*, measured 2026-11-18). Header, then two
  tile cards side by side (each half the row); on portrait phones a carousel, one card per page.
  The section is a page-theme marker (plum). Card colours: live Merchandise and Collector's Box cards.
  Live's second card has no image fade (its art is a cut-out); ours is a full painting, so both cards
  fade under the text. The key-rack art shows real company logos, so the card says "Sample Clients".
*/
const THEMES = [
  { bg: '#20234c', eyebrow: '#fbd9e0', accent: '#ffd4a8', ctaText: '#0f0c1a', glow1: '#3f284b', glow2: '#4b2f54', ctaHover: '#ffc080', ctaPressed: '#ffa74d' },
  { bg: '#252644', eyebrow: '#e5ddff', accent: '#ffb2c6', ctaText: '#0c0d1b', glow1: '#2f2e52', glow2: '#38365d', ctaHover: '#fc97b1', ctaPressed: '#f77e9c' },
]
const ART = [keyRack, postcard]
const LAYOUTS = [['(max-width: 767.98px) and (orientation: portrait)', 1]]

export default function Clients() {
  return (
    <section className="rows rows--clients" data-m="clients" data-theme="plum" aria-labelledby="clients-heading">
      <SectionHead id="clients-heading" title={content.header} link={content.link} linkLabel={`${content.link.label} clients`} />
      <Carousel layouts={LAYOUTS} label="Client pages" data-m="clients-carousel">
        {content.cards.map((c, i) => (
          <Card
            key={c.title}
            shape="tile"
            short
            theme={THEMES[i]}
            href={c.href}
            art={ART[i]}
            artPosition="50% 0%"
            eyebrow={c.eyebrow}
            title={c.title}
            cta={c.button}
            ctaIcon="arrow"
            data-m="clients-card"
          />
        ))}
      </Carousel>
    </section>
  )
}
