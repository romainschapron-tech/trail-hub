// GPX parsing + grade-adjusted pace (Minetti) for race split predictions.

export interface GpxNode {
  dist: number // cumulative metres
  ele: number // smoothed metres
  gain: number // cumulative positive elevation
}

export interface GpxWaypoint {
  name: string
  dist: number // cumulative metres along the track
}

export interface GpxRoute {
  nodes: GpxNode[]
  waypoints: GpxWaypoint[]
  totalDist: number
  totalGain: number
}

export interface Split {
  label: string
  dist: number // m cumulative
  gain: number // m cumulative
  segPaceSec: number // sec/km on this segment (real, not GAP)
  cumSec: number // cumulative seconds
}

function haversine(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLa = toRad(la2 - la1)
  const dLo = toRad(lo2 - lo1)
  const a =
    Math.sin(dLa / 2) ** 2 +
    Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Minetti energetic cost of running vs gradient, normalised to flat (=1).
export function gapFactor(slope: number): number {
  const i = Math.max(-0.45, Math.min(0.45, slope))
  const cr = 155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6
  return Math.max(0.55, cr / 3.6)
}

function movingAverage(vals: number[], win: number): number[] {
  const out: number[] = []
  for (let i = 0; i < vals.length; i++) {
    let s = 0, n = 0
    for (let j = Math.max(0, i - win); j <= Math.min(vals.length - 1, i + win); j++) {
      s += vals[j]; n++
    }
    out.push(s / n)
  }
  return out
}

// Reduce the node count for compact storage (keeps first/last + evenly sampled).
export function downsampleRoute(route: GpxRoute, maxNodes = 600): GpxRoute {
  const n = route.nodes.length
  if (n <= maxNodes) return route
  const step = (n - 1) / (maxNodes - 1)
  const nodes: GpxNode[] = []
  for (let i = 0; i < maxNodes; i++) nodes.push(route.nodes[Math.round(i * step)])
  nodes[nodes.length - 1] = route.nodes[n - 1]
  return { ...route, nodes }
}

export function parseGpx(xml: string): GpxRoute {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Fichier GPX invalide')

  const trkpts = Array.from(doc.querySelectorAll('trkpt, rtept'))
  if (trkpts.length < 2) throw new Error('Aucune trace exploitable dans le GPX')

  // Raw cumulative distance + elevation
  const raw: { dist: number; ele: number; lat: number; lon: number }[] = []
  let cum = 0
  let prevLat = 0, prevLon = 0
  trkpts.forEach((p, idx) => {
    const lat = parseFloat(p.getAttribute('lat') || '0')
    const lon = parseFloat(p.getAttribute('lon') || '0')
    const ele = parseFloat(p.querySelector('ele')?.textContent || '0')
    if (idx > 0) cum += haversine(prevLat, prevLon, lat, lon)
    raw.push({ dist: cum, ele, lat, lon })
    prevLat = lat; prevLon = lon
  })

  // Smooth elevation to tame GPS noise
  const smoothed = movingAverage(raw.map((r) => r.ele), 4)

  // Resample to fixed 100 m nodes
  const STEP = 100
  const nodes: GpxNode[] = [{ dist: 0, ele: smoothed[0], gain: 0 }]
  let target = STEP
  let gain = 0
  let i = 1
  while (i < raw.length) {
    if (raw[i].dist >= target) {
      const a = raw[i - 1], b = raw[i]
      const t = (target - a.dist) / ((b.dist - a.dist) || 1)
      const ele = smoothed[i - 1] + (smoothed[i] - smoothed[i - 1]) * t
      const prev = nodes[nodes.length - 1]
      const d = ele - prev.ele
      if (d > 0) gain += d
      nodes.push({ dist: target, ele, gain })
      target += STEP
    } else i++
  }
  const total = raw[raw.length - 1].dist
  if (nodes[nodes.length - 1].dist < total) {
    const ele = smoothed[smoothed.length - 1]
    const d = ele - nodes[nodes.length - 1].ele
    if (d > 0) gain += d
    nodes.push({ dist: total, ele, gain })
  }

  // Waypoints → nearest point along the track
  const waypoints: GpxWaypoint[] = []
  Array.from(doc.querySelectorAll('wpt')).forEach((w) => {
    const lat = parseFloat(w.getAttribute('lat') || '0')
    const lon = parseFloat(w.getAttribute('lon') || '0')
    const name = w.querySelector('name')?.textContent?.trim() || 'Point'
    let best = Infinity, bestDist = 0
    for (const r of raw) {
      const dd = haversine(lat, lon, r.lat, r.lon)
      if (dd < best) { best = dd; bestDist = r.dist }
    }
    if (best < 200) waypoints.push({ name, dist: bestDist }) // within 200 m of route
  })
  waypoints.sort((a, b) => a.dist - b.dist)

  return { nodes, waypoints, totalDist: total, totalGain: Math.round(gain) }
}

// Per-node cumulative time using flat pace + GAP + a mild positive-split fade.
function nodeTimes(route: GpxRoute, flatPaceSec: number, fade = 0.08): number[] {
  const { nodes, totalDist } = route
  const times = [0]
  for (let k = 1; k < nodes.length; k++) {
    const seg = (nodes[k].dist - nodes[k - 1].dist) / 1000 // km
    const slope = (nodes[k].ele - nodes[k - 1].ele) / (nodes[k].dist - nodes[k - 1].dist || 1)
    const progress = nodes[k].dist / (totalDist || 1)
    const t = seg * flatPaceSec * gapFactor(slope) * (1 + fade * progress)
    times.push(times[k - 1] + t)
  }
  return times
}

export function predictTotal(route: GpxRoute, flatPaceSec: number): number {
  const t = nodeTimes(route, flatPaceSec)
  return t[t.length - 1]
}

// Build splits at the given checkpoints (cumulative metres), scaled so the
// total matches targetSec (if provided).
export function computeSplits(
  route: GpxRoute,
  flatPaceSec: number,
  checkpoints: { label: string; dist: number }[],
  targetSec?: number
): Split[] {
  const times = nodeTimes(route, flatPaceSec)
  const predicted = times[times.length - 1]
  const scale = targetSec && predicted > 0 ? targetSec / predicted : 1

  const timeAt = (dist: number): number => {
    const { nodes } = route
    if (dist <= 0) return 0
    for (let k = 1; k < nodes.length; k++) {
      if (nodes[k].dist >= dist) {
        const t = (dist - nodes[k - 1].dist) / ((nodes[k].dist - nodes[k - 1].dist) || 1)
        return (times[k - 1] + (times[k] - times[k - 1]) * t) * scale
      }
    }
    return times[times.length - 1] * scale
  }
  const gainAt = (dist: number): number => {
    const { nodes } = route
    for (let k = 1; k < nodes.length; k++) {
      if (nodes[k].dist >= dist) return Math.round(nodes[k].gain)
    }
    return route.totalGain
  }

  const splits: Split[] = []
  let prevDist = 0, prevSec = 0
  for (const cp of checkpoints) {
    const cumSec = timeAt(cp.dist)
    const segKm = (cp.dist - prevDist) / 1000
    const segPace = segKm > 0 ? (cumSec - prevSec) / segKm : 0
    splits.push({ label: cp.label, dist: cp.dist, gain: gainAt(cp.dist), segPaceSec: segPace, cumSec })
    prevDist = cp.dist; prevSec = cumSec
  }
  return splits
}
