import { useEffect, useImperativeHandle, useRef } from 'react'
import { renditions, PORTRAIT_MEDIA } from '../lib/media.js'
import { reduceMotion } from '../lib/gsap.js'
import { decodeFrames } from '../lib/frames.js'
import './ScrollVideo.css'

/*
  Scroll-scrubbed video (live "scrollmation", spec in AGENTS.md Findings › Videos). Stack, as live:
  video (z 3) over a canvas (z 2) over the poster (z 1). The video and canvas are transparent until
  they get their first frame, and that frame is the poster's, so nothing jumps; no cross-fade.
  The parent drives it: ref.current.progress(p), p in 0..1, shows frame floor((N − 1)·p), no
  smoothing, drawn on the next animation frame.

  Two engines, chosen as live does:
    frames  (desktop and Android: WebCodecs available, not iOS/iPadOS) the whole file is fetched,
            every frame decoded into memory (src/lib/frames.js) and the current one drawn on the
            canvas, so every frame shows however fast the page scrolls.
    seek    (iOS/iPadOS, or no WebCodecs) the <video> is seeked to the frame's centre. Only one seek
            is in flight at a time; while it runs, newer targets replace each other and the latest
            is applied when it lands, so a fast scroll never queues stale seeks.
  The rendition follows PORTRAIT_MEDIA; on a change the source swaps and the frame is kept.
  `videoRef` receives [video, canvas] so the parent can zoom whichever is showing (live zooms the
  canvas). Reduced motion: the poster only.
*/
const isAppleTouch = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

export default function ScrollVideo({ name, className = '', videoRef, ref, ...rest }) {
  const r = renditions(name)
  const els = useRef({ video: null, canvas: null })
  const state = useRef({ p: 0, frame: -1, frames: null, count: 0, raf: 0, pending: -1 })

  const syncRef = () => {
    if (videoRef) videoRef.current = [els.current.video, els.current.canvas].filter(Boolean)
  }

  const show = () => {
    const s = state.current
    if (!s.count) return
    const frame = Math.floor((s.count - 1) * s.p)
    if (frame === s.frame) return
    s.frame = frame
    if (s.frames) els.current.canvas.dataset.target = frame // read by the smoothness probe
    cancelAnimationFrame(s.raf)
    s.raf = requestAnimationFrame(() => {
      if (s.frames) {
        const canvas = els.current.canvas
        const f = s.frames[s.frame]
        if (!canvas || !f) return
        if (canvas.width !== f.displayWidth || canvas.height !== f.displayHeight) {
          canvas.width = f.displayWidth
          canvas.height = f.displayHeight
        }
        canvas.getContext('2d').drawImage(f, 0, 0, canvas.width, canvas.height)
        canvas.dataset.shown = s.frame
      } else {
        const video = els.current.video
        if (video.seeking) s.pending = s.frame
        else video.currentTime = (s.frame + 0.5) / r.fps
      }
    })
  }

  useImperativeHandle(ref, () => ({
    progress(p) {
      state.current.p = Math.min(1, Math.max(0, p))
      show()
    },
  }))

  useEffect(() => {
    if (reduceMotion()) return undefined
    const { video, canvas } = els.current
    const s = state.current
    const mq = window.matchMedia(PORTRAIT_MEDIA)
    const useFrames = !isAppleTouch() && typeof VideoDecoder === 'function'
    let objectUrl = null
    let abort = null

    const dropFrames = () => {
      s.frames?.forEach((f) => f.close())
      s.frames = null
    }
    const clear = () => {
      dropFrames()
      s.count = 0
      s.frame = -1
      s.pending = -1
      canvas.width = 0 // transparent again: the poster shows until the new source is ready
      video.removeAttribute('src')
      video.load()
    }

    const asVideo = (blob, src) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = blob ? URL.createObjectURL(blob) : null
      video.src = objectUrl ?? src
    }

    const load = async () => {
      abort?.abort()
      const ac = (abort = new AbortController())
      clear()
      const src = mq.matches ? r.portrait : r.desktop
      let blob
      try {
        blob = await (await fetch(src, { signal: ac.signal })).blob()
      } catch (e) {
        if (e.name !== 'AbortError') asVideo(null, src) // fall back to streaming
        return
      }
      if (ac.signal.aborted) return
      if (useFrames) {
        const decoded = await decodeFrames(await blob.arrayBuffer()).catch(() => null)
        if (ac.signal.aborted) {
          decoded?.frames.forEach((f) => f.close())
          return
        }
        if (decoded) {
          s.frames = decoded.frames
          s.count = decoded.frames.length
          s.frame = -1
          show()
          return
        }
      }
      asVideo(blob, src)
    }

    const ready = () => {
      if (s.frames) return
      s.count = Math.round(video.duration * r.fps)
      s.frame = -1
      show()
    }
    const seeked = () => {
      if (s.pending < 0) return
      const next = s.pending
      s.pending = -1
      if (Math.abs(video.currentTime - (next + 0.5) / r.fps) > 0.5 / r.fps) video.currentTime = (next + 0.5) / r.fps
    }
    video.addEventListener('loadedmetadata', ready)
    video.addEventListener('seeked', seeked)
    mq.addEventListener('change', load)
    load()
    return () => {
      abort?.abort()
      mq.removeEventListener('change', load)
      video.removeEventListener('loadedmetadata', ready)
      video.removeEventListener('seeked', seeked)
      cancelAnimationFrame(s.raf)
      dropFrames()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  return (
    <div className={`svideo ${className}`} aria-hidden="true" {...rest}>
      <video
        ref={(el) => { els.current.video = el; syncRef() }}
        className="svideo__video"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
      />
      <canvas ref={(el) => { els.current.canvas = el; syncRef() }} className="svideo__canvas" width="0" height="0" />
      <picture className="svideo__poster">
        <source media={PORTRAIT_MEDIA} srcSet={r.posterPortrait} />
        <img src={r.posterDesktop} alt="" decoding="async" />
      </picture>
    </div>
  )
}
