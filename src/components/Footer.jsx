import { footer as content } from '../content.js'
import logo from '../assets/site/footer/logo.avif'
import './Footer.css'

/*
  Footer (live .jjnta2* / pill ._18g0m2t* / rating .vne2sz*, measured at every width 2026-11-18):
  logo, then a centred column: the "Build Your Own" pill (live: newsletter pill), social icons, text
  links, the rating badge (ours: "Rated D for Developer", drawn below), then the copyright and the
  fan-made disclaimer (live has no such line; ours is required). Page-theme marker: base.
*/
function BuildIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Brand marks (single-path glyphs on a 24 grid, after the projects' public brand assets).
const SOCIAL_PATHS = {
  GitHub: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  X: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  YouTube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
}

// Our badge in the rating badge's slot (live: a 48×72 rating image).
function RatingBadge() {
  return (
    <svg className="rating__img" viewBox="0 0 48 72" role="img" aria-label={content.badge.title} data-m="rating-img">
      <rect x="1" y="1" width="46" height="70" rx="2" fill="#fff" />
      <rect x="3.5" y="3.5" width="41" height="51" fill="#0c0d1b" />
      <text x="24" y="44" textAnchor="middle" fill="#fff" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="44">D</text>
      <text x="24" y="65.5" textAnchor="middle" fill="#0c0d1b" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="7.4" letterSpacing=".2">DEVELOPER</text>
    </svg>
  )
}

export default function Footer() {
  return (
    <div className="foot" data-m="foot" data-theme="base">
      <div className="foot__logo-box">
        <a href="#" className="foot__logo-link" aria-label="Grand Theft Developer, back to top">
          <img className="foot__logo" src={logo} alt="" width="807" height="540" loading="lazy" decoding="async" data-m="foot-logo" />
        </a>
      </div>
      <footer className="foot__main" data-m="foot-main">
        <div className="foot__pill-wrap">
          <a className="foot__pill" href={content.pill.href} data-m="foot-pill">
            <strong className="foot__pill-title" data-m="foot-pill-title">
              <BuildIcon className="foot__pill-icon" />
              {content.pill.title}
            </strong>
            <span className="foot__pill-text" data-m="foot-pill-text">{content.pill.text}</span>
          </a>
        </div>
        <nav className="foot__nav" aria-label="Footer">
          <ul className="foot__socials" data-m="foot-socials">
            {content.socials.map((s) => (
              <li key={s.label}>
                <a className="foot__social" href={s.href} aria-label={s.label} data-m="foot-social">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={SOCIAL_PATHS[s.label]} fill="currentColor" /></svg>
                </a>
              </li>
            ))}
          </ul>
          <ul className="foot__links" data-m="foot-links">
            {content.links.map((l) => (
              <li key={l.label}><a className="foot__link" href={l.href} data-m="foot-link">{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="rating" data-m="rating">
          <div className="rating__in">
            <RatingBadge />
            <div className="rating__txt" data-m="rating-txt">
              <p className="rating__p" data-m="rating-p">{content.badge.text}</p>
              <hr className="rating__hr" />
              <p className="rating__p">{content.badge.title}</p>
            </div>
          </div>
        </div>
        <div className="foot__legal" data-m="foot-legal">
          <p>{content.copyright}</p>
          <p>{content.disclaimer}</p>
        </div>
      </footer>
    </div>
  )
}
