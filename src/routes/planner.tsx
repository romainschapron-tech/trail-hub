import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { parseGpx, predictTotal, computeSplits, type GpxRoute, type Split } from '@/lib/gpx'
import type { NutritionProduct } from '@/lib/types'

export const Route = createFileRoute('/planner')({
  component: PlannerPage,
})

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}
function fmtHMS(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function fmtPace(sec: number): string {
  if (!sec || !isFinite(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}
function parseHM(v: string): number | undefined {
  const m = v.match(/^(\d{1,2})[h:](\d{0,2})$/)
  if (!m) return undefined
  return (+m[1]) * 3600 + (+(m[2] || 0)) * 60
}

function ElevationProfile({ route }: { route: GpxRoute }) {
  const W = 640, H = 120, pad = 4
  const eles = route.nodes.map((n) => n.ele)
  const minE = Math.min(...eles), maxE = Math.max(...eles)
  const rangeE = maxE - minE || 1
  const pts = route.nodes.map((n) => {
    const x = pad + (n.dist / route.totalDist) * (W - 2 * pad)
    const y = pad + (1 - (n.ele - minE) / rangeE) * (H - 2 * pad)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points={`${pad},${H - pad} ${pts.join(' ')} ${W - pad},${H - pad}`} fill="rgba(59,130,246,0.18)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
    </svg>
  )
}

interface InvItem { name: string; carbs: number; qty: number }

function carbRate(h: number): number {
  if (h < 1) return 30
  if (h < 2) return 55
  if (h < 3.5) return 70
  return 85
}

function NutritionTile({ value, unit, label, sub, color }: { value: string; unit?: string; label: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 150, padding: '0.9rem 1.1rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: color ?? 'var(--text)' }}>
        {value}{unit && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  )
}

function NutritionPlan({ durationSec }: { durationSec: number }) {
  const hours = durationSec / 3600
  const [temp, setTemp] = useState<'frais' | 'tempere' | 'chaud'>('tempere')
  const [inv, setInv] = useState<InvItem[]>([
    { name: 'Gel énergétique', carbs: 22, qty: 8 },
    { name: 'Barre', carbs: 30, qty: 3 },
    { name: 'Boisson (bidon)', carbs: 35, qty: 5 },
  ])
  const [lib, setLib] = useState<NutritionProduct[]>([])
  const [pick, setPick] = useState('')
  useEffect(() => { api.nutrition.list().then(setLib).catch(() => {}) }, [])
  const matches = useMemo(() => {
    const q = pick.toLowerCase().trim()
    if (!q) return []
    return lib.filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(q)).slice(0, 6)
  }, [pick, lib])

  const rate = carbRate(hours)
  const totalTarget = Math.round(rate * hours)
  const fluidPerH = { frais: 450, tempere: 600, chaud: 750 }[temp]
  const sodiumPerH = { frais: 400, tempere: 600, chaud: 800 }[temp]
  const avail = inv.reduce((a, i) => a + i.carbs * i.qty, 0)
  const coverage = totalTarget > 0 ? Math.round((avail / totalTarget) * 100) : 0

  // Fueling schedule — one intake every 30 min, greedily filled from inventory.
  const schedule = useMemo(() => {
    const units: { name: string; carbs: number }[] = []
    inv.forEach((it) => { for (let k = 0; k < it.qty; k++) units.push({ name: it.name, carbs: it.carbs }) })
    units.sort((a, b) => b.carbs - a.carbs)
    const slots = Math.max(1, Math.round(hours * 2))
    const perSlot = rate / 2
    const out: { t: number; items: Record<string, number>; carbs: number }[] = []
    let u = 0
    for (let s = 1; s <= slots; s++) {
      const items: Record<string, number> = {}
      let c = 0
      while (u < units.length && c < perSlot * 0.85) {
        const it = units[u++]
        items[it.name] = (items[it.name] || 0) + 1
        c += it.carbs
      }
      out.push({ t: s * 1800, items, carbs: c })
    }
    return out
  }, [inv, hours, rate])

  function setItem(i: number, field: keyof InvItem, value: string) {
    setInv((arr) => arr.map((it, idx) => (idx === i ? { ...it, [field]: field === 'name' ? value : Number(value) || 0 } : it)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <NutritionTile label="Glucides / heure" value={String(rate)} unit="g" color="var(--primary)" sub={`sur ~${hours.toFixed(1)} h`} />
        <NutritionTile label="Glucides total" value={totalTarget.toLocaleString('fr-FR')} unit="g" />
        <NutritionTile label="Hydratation" value={`${fluidPerH}`} unit="ml/h" sub={`~${(fluidPerH * hours / 1000).toFixed(1)} L total`} />
        <NutritionTile label="Sodium" value={`${sodiumPerH}`} unit="mg/h" color="#f59e0b" />
      </div>

      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Conditions :</span>
        {(['frais', 'tempere', 'chaud'] as const).map((t) => (
          <button key={t} onClick={() => setTemp(t)} className={`btn btn-sm ${temp === t ? 'btn-primary' : 'btn-ghost'}`}>
            {t === 'frais' ? 'Frais' : t === 'tempere' ? 'Tempéré' : 'Chaud'}
          </button>
        ))}
      </div>

      {/* Inventory editor */}
      <div className="card">
        <div style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.75rem' }}>Mon ravitaillement</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {inv.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input className="form-input" style={{ flex: 1 }} value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
              <input className="form-input" type="number" style={{ width: 90 }} value={it.carbs} onChange={(e) => setItem(i, 'carbs', e.target.value)} title="glucides (g)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>g ×</span>
              <input className="form-input" type="number" style={{ width: 70 }} value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} title="quantité" />
              <button className="btn btn-ghost btn-sm" onClick={() => setInv((a) => a.filter((_, idx) => idx !== i))} aria-label="Supprimer">✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setInv((a) => [...a, { name: 'Nouvel item', carbs: 25, qty: 1 }])}>+ Item manuel</button>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input className="form-input" style={{ width: '100%' }} placeholder="🔍 Ajouter depuis ma bibliothèque…" value={pick} onChange={(e) => setPick(e.target.value)} />
            {matches.length > 0 && (
              <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10, padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {matches.map((p) => (
                  <button key={p.id} className="btn btn-ghost btn-sm" style={{ justifyContent: 'space-between', textAlign: 'left' }}
                    onClick={() => { setInv((a) => [...a, { name: `${p.name}${p.brand ? ' · ' + p.brand : ''}`, carbs: p.carbs_g ?? 0, qty: 1 }]); setPick('') }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{p.carbs_g ?? '?'} g</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
            <span>Couverture du besoin : <strong style={{ color: coverage >= 100 ? '#22c55e' : coverage >= 75 ? 'var(--warning)' : 'var(--danger)' }}>{coverage}%</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>{avail} g dispo / {totalTarget} g visés</span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, coverage)}%`, height: '100%', background: coverage >= 100 ? '#22c55e' : coverage >= 75 ? 'var(--warning)' : 'var(--danger)', borderRadius: 4 }} />
          </div>
          {coverage < 100 && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Il te manque ~{Math.max(0, totalTarget - avail)} g de glucides pour tenir le rythme.</div>}
        </div>
      </div>

      {/* Schedule */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, padding: '1rem 1.25rem 0.5rem' }}>Plan d'ingestion (toutes les 30 min)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.6rem 1.25rem', fontWeight: 500 }}>À</th>
              <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>À prendre</th>
              <th style={{ padding: '0.6rem 1rem', fontWeight: 500, textAlign: 'right' }}>Glucides</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((slot, i) => {
              const desc = Object.entries(slot.items).map(([n, q]) => `${q}× ${n}`).join(' + ')
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem 1.25rem', fontWeight: 600, whiteSpace: 'nowrap' }}>+{Math.floor(slot.t / 3600)}h{String(Math.floor((slot.t % 3600) / 60)).padStart(2, '0')}</td>
                  <td style={{ padding: '0.5rem 0.5rem', color: desc ? 'var(--text)' : 'var(--text-muted)' }}>{desc || 'eau / électrolytes'}</td>
                  <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>{slot.carbs ? `${slot.carbs} g` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlannerPage() {
  const [route, setRoute] = useState<GpxRoute | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [flatPace, setFlatPace] = useState<number | null>(null)
  const [targetStr, setTargetStr] = useState('')
  const [startStr, setStartStr] = useState('06:00')
  const [interval, setInterval] = useState(5)

  useEffect(() => {
    api.stats.stravaPace().then((p) => setFlatPace(p.flatPaceSec)).catch(() => setFlatPace(360))
  }, [])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    try {
      const text = await f.text()
      const r = parseGpx(text)
      setRoute(r)
      setFileName(f.name)
    } catch (err) {
      setError((err as Error).message)
      setRoute(null)
    }
  }

  // Default target = estimate from flat pace; user can override.
  const estimate = useMemo(
    () => (route && flatPace ? predictTotal(route, flatPace) : null),
    [route, flatPace]
  )
  useEffect(() => {
    if (estimate && !targetStr) setTargetStr(fmtClock(estimate).replace(' min', 'm'))
  }, [estimate]) // eslint-disable-line

  const targetSec = parseHM(targetStr) ?? estimate ?? undefined

  const checkpoints = useMemo(() => {
    if (!route) return []
    if (route.waypoints.length >= 2) {
      const cps = route.waypoints.map((w) => ({ label: w.name, dist: w.dist }))
      if (cps[cps.length - 1].dist < route.totalDist - 100)
        cps.push({ label: 'Arrivée', dist: route.totalDist })
      return cps
    }
    const cps: { label: string; dist: number }[] = []
    for (let d = interval * 1000; d < route.totalDist; d += interval * 1000)
      cps.push({ label: `${Math.round(d / 1000)} km`, dist: d })
    cps.push({ label: 'Arrivée', dist: route.totalDist })
    return cps
  }, [route, interval])

  const splits: Split[] = useMemo(
    () => (route && flatPace ? computeSplits(route, flatPace, checkpoints, targetSec) : []),
    [route, flatPace, checkpoints, targetSec]
  )

  const startSec = parseHM(startStr.replace(':', 'h'))
  const clockAt = (cum: number) => {
    if (startSec === undefined) return ''
    const t = (startSec + cum) % 86400
    return `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}`
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Préparer une course</h1></div>

      {!route && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Importe le tracé GPX de ta course</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0.5rem auto 1.5rem' }}>
            J'analyse le profil, j'estime tes temps de passage selon ton allure réelle (Strava) et la pente de chaque section.
          </p>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            Choisir un fichier .gpx
            <input type="file" accept=".gpx,application/gpx+xml,text/xml" onChange={onFile} style={{ display: 'none' }} />
          </label>
          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
        </div>
      )}

      {route && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary + profile */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{fileName}</span>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Changer
                <input type="file" accept=".gpx" onChange={onFile} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
              <div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{(route.totalDist / 1000).toFixed(1)} km</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DISTANCE</div></div>
              <div><div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{route.totalGain.toLocaleString('fr-FR')} m</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DÉNIVELÉ +</div></div>
              <div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{Math.round((route.totalGain / (route.totalDist / 1000)))} m/km</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RATIO D+</div></div>
              {estimate && <div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>{fmtClock(estimate)}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ESTIMATION</div></div>}
            </div>
            <ElevationProfile route={route} />
          </div>

          {/* Controls */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Objectif de temps</label>
              <input className="form-input" style={{ width: 140 }} value={targetStr} onChange={(e) => setTargetStr(e.target.value)} placeholder="13h00" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Heure de départ</label>
              <input className="form-input" type="time" style={{ width: 140 }} value={startStr} onChange={(e) => setStartStr(e.target.value)} />
            </div>
            {route.waypoints.length < 2 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Intervalle</label>
                <select className="form-select" style={{ width: 120 }} value={interval} onChange={(e) => setInterval(+e.target.value)}>
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                </select>
              </div>
            )}
            {flatPace && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>
                Allure plat de référence : <strong style={{ color: 'var(--text)' }}>{fmtPace(flatPace)}</strong>
                {route.waypoints.length >= 2 && <> · {route.waypoints.length} ravitos détectés</>}
              </div>
            )}
          </div>

          {/* Splits */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 500 }}>Point</th>
                  <th style={{ padding: '0.7rem 0.5rem', fontWeight: 500 }}>km</th>
                  <th style={{ padding: '0.7rem 0.5rem', fontWeight: 500 }}>D+</th>
                  <th style={{ padding: '0.7rem 0.5rem', fontWeight: 500 }}>Allure</th>
                  <th style={{ padding: '0.7rem 0.5rem', fontWeight: 500 }}>Temps</th>
                  {startSec !== undefined && <th style={{ padding: '0.7rem 1rem', fontWeight: 500 }}>Heure</th>}
                </tr>
              </thead>
              <tbody>
                {splits.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 500 }}>{s.label}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{(s.dist / 1000).toFixed(1)}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{s.gain.toLocaleString('fr-FR')} m</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{fmtPace(s.segPaceSec)}</td>
                    <td style={{ padding: '0.6rem 0.5rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtHMS(s.cumSec)}</td>
                    {startSec !== undefined && <td style={{ padding: '0.6rem 1rem', fontVariantNumeric: 'tabular-nums' }}>{clockAt(s.cumSec)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nutrition */}
          {targetSec && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Plan nutrition</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>calé sur {fmtClock(targetSec)} d'effort</span>
              </div>
              <NutritionPlan durationSec={targetSec} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
