import './SectionHead.css'

/*
  Row header for Clients and Blog (live Shop ._82fiuk3 / Featured News ._10vlklc1): a title on the
  left, a "View all" link on the right. From 768px the link is text plus an arrow; below, a round
  8u icon button (Clients) or a bare 6u arrow (Blog, `plain`), as live. Live shows one element or the
  other per breakpoint; we hide the text visually so the link keeps its name.
  Colours come from the section: --head-title, --head-link, --head-chip.
*/
export function Arrow({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SectionHead({ id, title, link, linkLabel, plain = false }) {
  return (
    <div className={`shead${plain ? ' shead--plain' : ''}`} data-m="shead">
      <h2 id={id} className="shead__title" data-m="shead-title">{title}</h2>
      <a className="shead__link" href={link.href} data-m="shead-link" aria-label={linkLabel}>
        <span className="shead__label">{link.label}</span>
        <Arrow className="shead__arrow" />
      </a>
    </div>
  )
}
