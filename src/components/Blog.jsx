import { blog as content } from '../content.js'
import Carousel from './Carousel.jsx'
import SectionHead from './SectionHead.jsx'
import post1 from '../assets/site/blog/post-1.avif'
import post2 from '../assets/site/blog/post-2.avif'
import post3 from '../assets/site/blog/post-3.avif'
import './Rows.css'

/*
  Blog, in the live Featured News section's place (live ._10vlklc* / news card ._1af9x9y*, measured
  2026-11-18). Header, then three post cards in a row (a third each); on portrait phones a carousel,
  one per page. Card: 16:9 cover (at .8 opacity until hover/focus) over a dark fill, then the title
  (4 lines max) and the date. Hover/focus fades in a lighter gradient over the card's own (0.5s).
  The covers have their titles painted in; the text below matches them.
*/
const ART = [post1, post2, post3]
const LAYOUTS = [['(max-width: 767.98px) and (orientation: portrait)', 1]]

function Post({ post, art }) {
  const iso = new Date(`${post.date} 12:00 UTC`).toISOString().slice(0, 10)
  return (
    <a className="post" href={post.href} data-m="post">
      <span className="post__media">
        <img className="post__img" src={art} alt="" loading="lazy" decoding="async" data-m="post-img" />
      </span>
      <span className="post__body" data-m="post-body">
        <span className="post__title" role="heading" aria-level={3} data-m="post-title">{post.title}</span>
        <time className="post__date" dateTime={iso} data-m="post-date">{post.date}</time>
      </span>
    </a>
  )
}

export default function Blog() {
  return (
    <section className="rows rows--blog" data-m="blog" data-theme="base" aria-labelledby="blog-heading">
      <SectionHead id="blog-heading" title={content.header} link={content.link} linkLabel={`${content.link.label} blog posts`} plain />
      <Carousel layouts={LAYOUTS} label="Blog pages" data-m="blog-carousel">
        {content.posts.map((p, i) => <Post key={p.title} post={p} art={ART[i]} />)}
      </Carousel>
    </section>
  )
}
