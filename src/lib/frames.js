/*
  Decode every frame of a short MP4 (H.264) into memory, as the live site's scroll videos do (live
  "RemoteScrollmation": mp4box demux → WebCodecs VideoDecoder, "prefer-software", every output
  VideoFrame kept). Ours runs on the main thread with a minimal demuxer: our clips are 34 and 149
  frames at 1280×720, so the whole decode takes well under a second.

  decodeFrames(arrayBuffer, onFrame) → Promise<{ frames, width, height }>
    frames[i] is the i-th frame in display order (VideoFrame). onFrame(i) is called as each one lands.
  Returns null when this browser can't (no WebCodecs, or the codec isn't supported), so the caller
  can fall back to seeking a <video>.
*/

// ---- MP4 boxes ----
function boxes(view, start, end) {
  const out = []
  let p = start
  while (p + 8 <= end) {
    let size = view.getUint32(p)
    const type = String.fromCharCode(view.getUint8(p + 4), view.getUint8(p + 5), view.getUint8(p + 6), view.getUint8(p + 7))
    let header = 8
    if (size === 1) {
      size = Number(view.getBigUint64(p + 8))
      header = 16
    } else if (size === 0) size = end - p
    if (size < header) break
    out.push({ type, start: p, body: p + header, end: p + size })
    p += size
  }
  return out
}
const child = (view, box, type) => boxes(view, box.body, box.end).find((b) => b.type === type)
const path = (view, box, types) => types.reduce((b, t) => b && child(view, b, t), box)

function videoTrack(view, len) {
  const moov = boxes(view, 0, len).find((b) => b.type === 'moov')
  if (!moov) return null
  for (const trak of boxes(view, moov.body, moov.end).filter((b) => b.type === 'trak')) {
    const hdlr = path(view, trak, ['mdia', 'hdlr'])
    const handler = hdlr && String.fromCharCode(...new Uint8Array(view.buffer, view.byteOffset + hdlr.body + 8, 4))
    if (handler === 'vide') return trak
  }
  return null
}

function sampleTable(view, trak) {
  const mdhd = path(view, trak, ['mdia', 'mdhd'])
  const timescale = view.getUint8(mdhd.body) === 1 ? view.getUint32(mdhd.body + 20) : view.getUint32(mdhd.body + 12)
  const stbl = path(view, trak, ['mdia', 'minf', 'stbl'])
  const get = (t) => child(view, stbl, t)

  // stsd → avc1 → avcC (sample entry: 8 header + 78 bytes of fields, then child boxes)
  const stsd = get('stsd')
  const entry = boxes(view, stsd.body + 8, stsd.end)[0]
  if (!entry || !/^avc[13]$/.test(entry.type)) return null
  const width = view.getUint16(entry.body + 24)
  const height = view.getUint16(entry.body + 26)
  const avcC = boxes(view, entry.body + 78, entry.end).find((b) => b.type === 'avcC')
  if (!avcC) return null
  const description = new Uint8Array(view.buffer.slice(view.byteOffset + avcC.body, view.byteOffset + avcC.end))
  const hex = (n) => n.toString(16).padStart(2, '0')
  const codec = `avc1.${hex(description[1])}${hex(description[2])}${hex(description[3])}`

  // sizes
  const stsz = get('stsz')
  const fixed = view.getUint32(stsz.body + 4)
  const count = view.getUint32(stsz.body + 8)
  const sizes = Array.from({ length: count }, (_, i) => fixed || view.getUint32(stsz.body + 12 + i * 4))

  // chunk offsets
  const stco = get('stco')
  const co64 = get('co64')
  const chunkBox = stco || co64
  const chunkCount = view.getUint32(chunkBox.body + 4)
  const chunkOffsets = Array.from({ length: chunkCount }, (_, i) =>
    stco ? view.getUint32(stco.body + 8 + i * 4) : Number(view.getBigUint64(co64.body + 8 + i * 8)),
  )

  // sample → chunk
  const stsc = get('stsc')
  const stscCount = view.getUint32(stsc.body + 4)
  const runs = Array.from({ length: stscCount }, (_, i) => ({
    first: view.getUint32(stsc.body + 8 + i * 12) - 1,
    per: view.getUint32(stsc.body + 12 + i * 12),
  }))
  const offsets = []
  for (let r = 0, s = 0; r < runs.length; r++) {
    const lastChunk = r + 1 < runs.length ? runs[r + 1].first : chunkCount
    for (let c = runs[r].first; c < lastChunk; c++) {
      let off = chunkOffsets[c]
      for (let k = 0; k < runs[r].per && s < count; k++, s++) {
        offsets.push(off)
        off += sizes[s]
      }
    }
  }

  // decode times (stts) + composition offsets (ctts)
  const stts = get('stts')
  const dts = []
  for (let i = 0, n = view.getUint32(stts.body + 4), t = 0; i < n; i++) {
    const c = view.getUint32(stts.body + 8 + i * 8)
    const d = view.getUint32(stts.body + 12 + i * 8)
    for (let k = 0; k < c; k++, t += d) dts.push(t)
  }
  const pts = dts.slice()
  const ctts = get('ctts')
  if (ctts) {
    const signed = view.getUint8(ctts.body) === 1
    for (let i = 0, n = view.getUint32(ctts.body + 4), s = 0; i < n; i++) {
      const c = view.getUint32(ctts.body + 8 + i * 8)
      const o = signed ? view.getInt32(ctts.body + 12 + i * 8) : view.getUint32(ctts.body + 12 + i * 8)
      for (let k = 0; k < c; k++, s++) pts[s] += o
    }
  }

  // keyframes (stss absent = all keyframes)
  const stss = get('stss')
  const sync = new Set()
  if (stss) for (let i = 0, n = view.getUint32(stss.body + 4); i < n; i++) sync.add(view.getUint32(stss.body + 8 + i * 4) - 1)

  return {
    codec,
    width,
    height,
    description,
    samples: sizes.map((size, i) => ({
      offset: offsets[i],
      size,
      key: !stss || sync.has(i),
      timestamp: Math.round((pts[i] * 1e6) / timescale),
    })),
  }
}

export async function decodeFrames(buffer, onFrame) {
  if (typeof VideoDecoder !== 'function' || typeof EncodedVideoChunk !== 'function') return null
  const view = new DataView(buffer)
  const trak = videoTrack(view, buffer.byteLength)
  const table = trak && sampleTable(view, trak)
  if (!table) return null
  const config = {
    codec: table.codec,
    codedWidth: table.width,
    codedHeight: table.height,
    description: table.description,
    optimizeForLatency: false,
    hardwareAcceleration: 'prefer-software', // live: keeps every frame in plain memory, never starves a GPU pool
  }
  const support = await VideoDecoder.isConfigSupported(config).catch(() => null)
  if (!support?.supported) return null

  // Display order: rank of each sample's presentation time.
  const order = new Map(
    table.samples
      .map((s) => s.timestamp)
      .sort((a, b) => a - b)
      .map((t, i) => [t, i]),
  )
  const frames = new Array(table.samples.length).fill(null)
  let failed = null
  const decoder = new VideoDecoder({
    output: (frame) => {
      const i = order.get(frame.timestamp)
      if (i === undefined || frames[i]) frame.close()
      else {
        frames[i] = frame
        onFrame?.(i)
      }
    },
    error: (e) => { failed = e },
  })
  decoder.configure(config)
  const bytes = new Uint8Array(buffer)
  for (const s of table.samples) {
    decoder.decode(new EncodedVideoChunk({ type: s.key ? 'key' : 'delta', timestamp: s.timestamp, data: bytes.subarray(s.offset, s.offset + s.size) }))
  }
  try {
    await decoder.flush()
  } catch (e) {
    failed ??= e
  }
  if (decoder.state !== 'closed') decoder.close()
  if (failed || frames.some((f) => !f)) {
    frames.forEach((f) => f?.close())
    return null
  }
  return { frames, width: table.width, height: table.height }
}
