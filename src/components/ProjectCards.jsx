import { meetTheDeveloper as content } from '../content.js'
import Card from './Card.jsx'
import Carousel from './Carousel.jsx'
import featuredDesktop from '../assets/site/meet-the-developer/featured-desktop.avif'
import featuredMobile from '../assets/site/meet-the-developer/featured-mobile.avif'
import card1 from '../assets/site/meet-the-developer/card-1.avif'
import card2 from '../assets/site/meet-the-developer/card-2.avif'
import card3 from '../assets/site/meet-the-developer/card-3.avif'
import './ProjectCards.css'

/*
  Meet the Developer cards (live ._158v41*, read 2026-11-18): the wide featured card, then the three
  project cards. From 1280px they sit in a static row of three; below that the row is a carousel
  (live: Embla; here: native scroll-snap plus mouse drag), one card per page on portrait phones, two
  on landscape phones and tablets, with a frosted dots pill under it.
  Themes are the live cards' colours: featured = "An Extended Look", projects = the trailer cards.
*/
const FEATURED_THEME = { bg: '#38365d', eyebrow: '#f1eaff', accent: '#ffb2c6', glow1: '#433f6a', glow2: '#4e4a7b', ctaHover: '#f1eaff', ctaPressed: '#d9d1f6' }
const PROJECT_THEMES = [
  { bg: '#31223e', eyebrow: '#fbd9e0', accent: '#ffd4a8', glow1: '#3f284b', glow2: '#4b2f54' },
  { bg: '#21254c', eyebrow: '#cae9f7', accent: '#ffc5b8', glow1: '#262e5b', glow2: '#2c3868' },
  { bg: '#31223e', eyebrow: '#fbd9e0', accent: '#ffd4a8', glow1: '#3f284b', glow2: '#4b2f54' },
]
const PROJECT_ART = [card1, card2, card3]

// Cards per page: 1 on portrait phones, 2 below 1280; from 1280 a static row of 3.
const LAYOUTS = [
  ['(max-width: 767.98px) and (orientation: portrait)', 1],
  ['(max-width: 1279.98px)', 2],
]

export default function ProjectCards({ ref }) {
  const { featured, projects } = content
  return (
    <div className="pcards" data-m="mtd-cards" ref={ref}>
      <Card
        shape="wide"
        side="left"
        theme={FEATURED_THEME}
        href={featured.href}
        art={featuredDesktop}
        artMobile={featuredMobile}
        artPosition="50% 50%"
        eyebrow={featured.eyebrow}
        title={featured.title}
        cta={featured.button}
        ctaIcon="play"
        ctaAppearance="primary"
        data-m="mtd-featured"
      />
      <Carousel layouts={LAYOUTS} label="Project pages" data-m="mtd-carousel">
        {projects.map((p, i) => (
          <Card
            key={p.title}
            shape="half"
            theme={PROJECT_THEMES[i]}
            href={p.href}
            art={PROJECT_ART[i]}
            artPosition="50% 0%"
            eyebrow={p.eyebrow}
            title={p.title}
            play
            data-m="mtd-project"
          />
        ))}
      </Carousel>
    </div>
  )
}
