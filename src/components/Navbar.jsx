import { navbar } from '../content.js'
import Monogram from './Monogram.jsx'
import './Navbar.css'

// Fixed navbar: monogram (back to top) on the left; "Hire Me" pill and menu button on the right.
// The pill is hidden at the top of the page, as on the live site; the hero's scroll-out fades it in
// (see createScrollOut in Hero.jsx).
export default function Navbar() {
  return (
    <nav className="nav" data-m="nav" aria-label="Main">
      <a className="nav__skip" data-m="skip-link" href="#main">
        {navbar.skipLink}
      </a>
      <a className="nav__logo" data-m="nav-logo" href="#">
        <Monogram />
        <span className="sr-only">{navbar.homeLabel}</span>
      </a>
      <div className="nav__right" data-m="nav-right">
        <div className="nav__pill-wrap" data-m="nav-pill-wrap">
          <a className="nav__pill" data-m="nav-pill" href={navbar.pill.href}>
            {navbar.pill.label}
          </a>
        </div>
        <button className="nav__menu" data-m="nav-menu" type="button" aria-expanded="false">
          <span className="nav__menu-bars" aria-hidden="true">
            <span className="nav__menu-bar" data-m="nav-menu-bar" />
            <span className="nav__menu-bar" data-m="nav-menu-bar" />
          </span>
          <span className="sr-only">{navbar.menuLabel}</span>
        </button>
      </div>
    </nav>
  )
}
