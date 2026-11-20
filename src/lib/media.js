/*
  Renditions of the scroll-scrubbed videos, built from the links in src/assets/hosted-media.json with
  Cloudinary URL transformations (tested 2026-11-18, see AGENTS.md Findings › Videos):
    video   every frame kept, a keyframe every 3 frames (ki_0.125 at 24fps) so seeks are cheap, no audio
    portrait  the same, cropped to 9:16 following the subject (c_fill,g_auto) — no w_: it would upscale
    poster  the first frame of the same crop. The image g_auto picks a different x than the video's, so
            portrait posters use a fixed crop at the x the video crop starts at (re-measure if a video
            is re-uploaded).
*/
import media from '../assets/hosted-media.json'

const VIDEO_T = 'f_mp4,vc_h264,ac_none,q_auto,ki_0.125'
const PORTRAIT_CROP = 'c_fill,g_auto,ar_9:16'
const PORTRAIT_POSTER_X = { services: 438, city: 699 } // 404×720 crop of the 1280×720 source
const FPS = 24 // both clips (hosted-media.json notes)

const withT = (url, t) => url.replace('/upload/', `/upload/${t}/`)
const asJpg = (url) => url.replace(/\.mp4$/, '.jpg')

export function renditions(key) {
  const src = media[key].video
  return {
    fps: FPS,
    desktop: withT(src, VIDEO_T),
    portrait: withT(src, `${PORTRAIT_CROP}/${VIDEO_T}`),
    posterDesktop: asJpg(withT(src, 'so_0')),
    posterPortrait: asJpg(withT(src, `c_crop,w_404,h_720,x_${PORTRAIT_POSTER_X[key]},y_0,so_0`)),
  }
}

// Live: portrait phones get the 9:16 file; everything else (incl. portrait tablets) the 16:9 one.
export const PORTRAIT_MEDIA = '(max-width: 767.98px) and (orientation: portrait)'
