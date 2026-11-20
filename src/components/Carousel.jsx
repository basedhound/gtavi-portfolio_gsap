import { Children, useEffect, useRef, useState } from 'react'
import './Carousel.css'

/*
  Card row that turns into a swipeable carousel on smaller screens (live: Embla; here: native
  scroll-snap plus mouse drag). Used by the Meet the Developer project cards, Clients and Blog.
    layouts  [[media query, cards per page], …], first match wins; when none matches, or a page
             holds every card, the row is static (no scrolling, no dots).
  Pages = cards − per page + 1, so with 3 cards and 2 per page the pages are "first two" and
  "last two", as live. Gap between cards: --col-gap (the live grid gap, src/index.css).
  Under the row: a frosted pill of dots (16u × 12u), one per page.
*/
const perPageFor = (layouts, n) => layouts.find(([q]) => window.matchMedia(q).matches)?.[1] ?? n

export default function Carousel({ layouts, label, children, className = '', ...rest }) {
  const viewportRef = useRef(null)
  const slides = Children.toArray(children)
  const n = slides.length
  const [perPage, setPerPage] = useState(() => perPageFor(layouts, n))
  const [page, setPage] = useState(0)
  const per = Math.min(perPage, n)
  const pages = per < n ? n - per + 1 : 0

  useEffect(() => {
    const viewport = viewportRef.current
    const queries = layouts.map(([q]) => window.matchMedia(q))
    const update = () => setPerPage(perPageFor(layouts, n))
    queries.forEach((m) => m.addEventListener('change', update))
    update()

    const pageCount = () => {
      const p = Math.min(perPageFor(layouts, n), n)
      return p < n ? n - p + 1 : 0
    }
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth
      const count = pageCount()
      setPage(max > 0 && count > 1 ? Math.round((viewport.scrollLeft / max) * (count - 1)) : 0)
    }
    viewport.addEventListener('scroll', onScroll, { passive: true })

    // Mouse drag (touch and trackpads scroll natively).
    let drag = null
    const down = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || viewport.scrollWidth <= viewport.clientWidth) return
      drag = { x: e.clientX, left: viewport.scrollLeft, moved: false }
    }
    const move = (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (!drag.moved && Math.abs(dx) < 10) return // live dragThreshold 10
      if (!drag.moved) {
        drag.moved = true
        viewport.setPointerCapture(e.pointerId)
        viewport.dataset.dragging = 'true'
      }
      viewport.scrollLeft = drag.left - dx
    }
    const up = () => {
      if (!drag) return
      const moved = drag.moved
      drag = null
      if (!moved) return
      delete viewport.dataset.dragging
      // Settle on the nearest page.
      const max = viewport.scrollWidth - viewport.clientWidth
      const count = pageCount()
      const target = count > 1 ? Math.round((viewport.scrollLeft / max) * (count - 1)) : 0
      viewport.scrollTo({ left: count > 1 ? (target / (count - 1)) * max : 0, behavior: 'smooth' })
      // Swallow the click that ends a drag (it fires right after pointerup, if at all).
      const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation() }
      viewport.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => viewport.removeEventListener('click', swallow, { capture: true }), 0)
    }
    viewport.addEventListener('pointerdown', down)
    viewport.addEventListener('pointermove', move)
    viewport.addEventListener('pointerup', up)
    viewport.addEventListener('pointercancel', up)
    return () => {
      queries.forEach((m) => m.removeEventListener('change', update))
      viewport.removeEventListener('scroll', onScroll)
      viewport.removeEventListener('pointerdown', down)
      viewport.removeEventListener('pointermove', move)
      viewport.removeEventListener('pointerup', up)
      viewport.removeEventListener('pointercancel', up)
    }
    // layouts is a module constant in every caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  const goTo = (i) => {
    const viewport = viewportRef.current
    const max = viewport.scrollWidth - viewport.clientWidth
    viewport.scrollTo({ left: pages > 1 ? (i / (pages - 1)) * max : 0, behavior: 'smooth' })
  }

  return (
    <>
      <div
        className={`carousel ${className}`}
        ref={viewportRef}
        data-per-page={per}
        data-static={pages ? undefined : 'true'}
        style={{ '--per-page': per }}
        {...rest}
      >
        <ul className="carousel__track">
          {slides.map((slide, i) => (
            <li key={slide.key ?? i} className="carousel__slide">{slide}</li>
          ))}
        </ul>
      </div>
      {pages > 1 && (
        <div className="carousel__dots-wrap">
          <div className="carousel__dots" data-m="carousel-dots" role="group" aria-label={label}>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className="carousel__dot"
                aria-label={`Page ${i + 1} of ${pages}`}
                aria-current={i === page ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
