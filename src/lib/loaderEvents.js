// Tiny event bus between the loader and the hero intro, mirroring the live site's loader events:
//   'fadeout'        loading finished; the loader starts fading out and the intro starts behind it
//   'complete'       the loader overlay has faded out
//   'enable-scroll'  the intro has finished; scrolling and clicks are allowed and the loader is removed
// Events are remembered, so a late subscriber can ask whether one already fired.
const fired = new Set()
const handlers = new Map()

export function emit(name) {
  fired.add(name)
  performance.mark(`loader:${name}`) // read by tools/record.mjs to line recordings up
  handlers.get(name)?.forEach((fn) => fn())
}

export function on(name, fn) {
  if (!handlers.has(name)) handlers.set(name, new Set())
  handlers.get(name).add(fn)
  return () => handlers.get(name)?.delete(fn)
}

export function hasFired(name) {
  return fired.has(name)
}
