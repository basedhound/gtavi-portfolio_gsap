// Shared handles to the page background layers (live `useBackgroundRef`), so sections can animate
// the cursor glow's opacity from their own scroll timelines. Background.jsx registers them.
const refs = { cursorLight: null, overlay: null }

export const setBackgroundRefs = (next) => Object.assign(refs, next)
export const cursorLight = () => refs.cursorLight
export const backgroundOverlay = () => refs.overlay
