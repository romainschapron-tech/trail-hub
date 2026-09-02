import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { RaceWithTracking } from '@/lib/types'
import { formatDate, daysUntil } from '@/lib/formatters'
import { TRACKING_STATUSES, RACE_FORMATS } from '@/lib/constants'
import { parseGpx, downsampleRoute, computeSplits, predictTotal, type GpxRoute } from '@/lib/gpx'

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`
}

// Elevation profile with aid-station markers (UTMB-style).
function ProfileChart({ route, splits }: { route: GpxRoute; splits: { label: string; dist: number; cumSec: number }[] }) {
  const W = 960, H = 250, padL = 44, padR = 12, padT = 28, padB = 64
  const plotW = W - padL - padR, plotH = H - padT - padB
  const eles = route.nodes.map((n) => n.ele)
  const minE = Math.min(...eles), maxE = Math.max(...eles), rE = maxE - minE || 1
  const x = (d: number) => padL + (d / route.totalDist) * plotW
  const y = (e: number) => padT + (1 - (e - minE) / rE) * plotH
  const pts = route.nodes.map((n) => `${x(n.dist).toFixed(1)},${y(n.ele).toFixed(1)}`).join(' ')
  const splitByDist = (d: number) => splits.find((s) => Math.abs(s.dist - d) < 50)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {[minE, (minE + maxE) / 2, maxE].map((e, i) => (
        <g key={i}>
          <line x1={padL} y1={y(e)} x2={W - padR} y2={y(e)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 6} y={y(e) + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{Math.round(e)}m</text>
        </g>
      ))}
      <polygon points={`${padL},${padT + plotH} ${pts} ${W - padR},${padT + plotH}`} fill="rgba(249,115,22,0.18)" />
      <polyline points={pts} fill="none" stroke="#f97316" strokeWidth="2" />
      {route.waypoints.map((w, i) => {
        const wx = x(w.dist), s = splitByDist(w.dist)
        return (
          <g key={i}>
            <line x1={wx} y1={padT} x2={wx} y2={padT + plotH} stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={wx} cy={padT + plotH} r="3.5" fill="#f97316" />
            <rect x={wx - 16} y={6} width="32" height="17" rx="8" fill="#f97316" />
            <text x={wx} y={18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">T{String(i + 1).padStart(2, '0')}</text>
            <text x={wx} y={padT + plotH + 16} textAnchor="middle" fontSize="9.5" fill="var(--text)">{(w.dist / 1000).toFixed(1)} km</text>
            <text x={wx} y={padT + plotH + 30} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{w.name.slice(0, 16)}</text>
            {s && <text x={wx} y={padT + plotH + 44} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#f97316">{fmtClock(s.cumSec)}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function GpxSection({ raceId, raceDist, raceEle }: { raceId: number; raceDist: number | null; raceEle: number | null }) {
  const [route, setRoute] = useState<GpxRoute | null>(null)
  const [fileName, setFileName] = useState('')
  const [flatPace, setFlatPace] = useState(360)
  const [pred, setPred] = useState<{ predicted: number | null; low: number | null; high: number | null; sample: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.races.getGpx(raceId).then((d) => { if (d) { setRoute(d.profile); setFileName(d.fileName || '') } })
    api.stats.stravaPace().then((p) => setFlatPace(p.flatPaceSec)).catch(() => {})
  }, [raceId])

  // Calibrated prediction from GPX totals (preferred) or the race's distance/D+.
  const predDist = route ? route.totalDist / 1000 : raceDist ?? 0
  const predEle = route ? route.totalGain : raceEle ?? 0
  useEffect(() => {
    if (predDist > 0) api.stats.predict(predDist, predEle).then(setPred).catch(() => {})
  }, [predDist, predEle])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true); setErr(null)
    try {
      const r = downsampleRoute(parseGpx(await f.text()))
      await api.races.saveGpx(raceId, { profile: r, totalDist: r.totalDist, totalGain: r.totalGain, fileName: f.name })
      setRoute(r); setFileName(f.name)
    } catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  async function remove() {
    await api.races.deleteGpx(raceId)
    setRoute(null); setFileName('')
  }

  const checkpoints = route
    ? (route.waypoints.length >= 1
        ? [...route.waypoints.map((w) => ({ label: w.name, dist: w.dist })), { label: 'Arrivée', dist: route.totalDist }]
        : [{ label: 'Arrivée', dist: route.totalDist }])
    : []
  // Splits scaled to the calibrated prediction (falls back to flat-pace model).
  const targetSec = pred?.predicted ?? (route ? predictTotal(route, flatPace) : undefined)
  const splits = route ? computeSplits(route, flatPace, checkpoints, targetSec) : []

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      {pred?.predicted && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Objectif estimé</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e' }}>{fmtClock(pred.predicted)}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            fourchette {fmtClock(pred.low!)} – {fmtClock(pred.high!)} · calibré sur tes {pred.sample} courses
          </span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: route ? '1rem' : 0, flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0 }}>Profil & tracé GPX</h3>
        {route ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fileName}</span>
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>Remplacer<input type="file" accept=".gpx" onChange={onFile} style={{ display: 'none' }} /></label>
            <button className="btn btn-ghost btn-sm" onClick={remove}>Supprimer</button>
          </div>
        ) : (
          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            {busy ? 'Analyse…' : 'Ajouter le tracé GPX'}
            <input type="file" accept=".gpx" onChange={onFile} style={{ display: 'none' }} />
          </label>
        )}
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{err}</p>}
      {!route && !err && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Importe le GPX de la course : le profil et tes temps de passage estimés seront mémorisés ici.</p>}
      {route && (
        <>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span><strong style={{ color: 'var(--primary)' }}>{(route.totalDist / 1000).toFixed(1)} km</strong></span>
            <span><strong>{route.totalGain.toLocaleString('fr-FR')} m</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>D+</span></span>
          </div>
          <ProfileChart route={route} splits={splits} />
        </>
      )}
    </div>
  )
}

function HeroTile({ value, unit, label, color }: { value: string; unit?: string; label: string; color?: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0.9rem 0.5rem' }}>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color: color ?? 'var(--text)', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.35rem' }}>
        {label}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/races/$raceId')({
  component: RaceDetailPage,
})

function RegistrationBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    open: { label: 'Places disponibles', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
    full: { label: 'Complet', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    closed: { label: 'Inscriptions fermées', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    upcoming: { label: 'Inscriptions bientôt', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
  }
  const c = config[status || '']
  if (!c) return null
  return (
    <span style={{
      padding: '0.35rem 0.9rem',
      borderRadius: '9999px',
      fontSize: '0.8125rem',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {c.label}
    </span>
  )
}

function RaceDetailPage() {
  const { raceId } = Route.useParams()
  const [race, setRace] = useState<RaceWithTracking | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    api.races.get(Number(raceId)).then((r) => {
      setRace(r)
      setNotes(r.tracking_notes || '')
    })
  }, [raceId])

  async function handleStatusChange(status: string) {
    if (!race) return
    if (status === '') {
      await api.tracking.remove(race.id)
    } else {
      await api.tracking.upsert(race.id, { status, notes })
    }
    const updated = await api.races.get(race.id)
    setRace(updated)
  }

  async function saveNotes() {
    if (!race || !race.tracking_status) return
    await api.tracking.upsert(race.id, { status: race.tracking_status, notes })
  }

  if (!race) return <div>Chargement...</div>

  const deadlineDays = daysUntil(race.registration_deadline)

  return (
    <div>
      <Link to="/races" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        &larr; Retour aux courses
      </Link>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main info */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>{race.name}</h2>
            <RegistrationBadge status={race.registration_status} />
          </div>

          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }}>
            <HeroTile value={race.distance_km ? String(race.distance_km) : '-'} unit="km" label="Distance" color="var(--primary)" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <HeroTile value={race.elevation_gain ? race.elevation_gain.toLocaleString('fr-FR') : '-'} unit="m" label="Dénivelé +" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <HeroTile
              value={race.distance_km && race.elevation_gain ? String(Math.round(race.elevation_gain / race.distance_km)) : '-'}
              unit="m/km"
              label="Ratio D+"
              color="#f59e0b"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="form-label">Date</div>
              <div>{formatDate(race.race_date)}</div>
            </div>
            <div>
              <div className="form-label">Lieu</div>
              <div>{race.city ? `${race.city}, ` : ''}{race.country}</div>
            </div>
            <div>
              <div className="form-label">Format</div>
              <div>{RACE_FORMATS.find((f) => f.value === race.race_format)?.label ?? race.race_format}</div>
            </div>
            <div>
              <div className="form-label">Prix</div>
              <div>{race.price_eur ? `${race.price_eur} €` : '-'}</div>
            </div>
            <div>
              <div className="form-label">Places max</div>
              <div>{race.max_participants ?? '-'}</div>
            </div>
            <div>
              <div className="form-label">Points ITRA</div>
              <div>{race.itra_points ?? '-'}</div>
            </div>
          </div>

          {((race as any).registration_opens || race.registration_deadline) && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {(race as any).registration_opens && (
                <div>
                  <div className="form-label">Ouverture inscriptions</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                    {formatDate((race as any).registration_opens)}
                  </div>
                </div>
              )}
              {race.registration_deadline && (
                <div>
                  <div className="form-label">Deadline inscription</div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: deadlineDays !== null && deadlineDays <= 7 ? 'var(--danger)' :
                           deadlineDays !== null && deadlineDays <= 30 ? 'var(--warning)' : undefined,
                  }}>
                    {formatDate(race.registration_deadline)}
                    {deadlineDays !== null && deadlineDays >= 0 && ` (J-${deadlineDays})`}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            {race.website_url && (
              <a href={race.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Site officiel
              </a>
            )}
            {race.registration_url && (
              <a href={race.registration_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                S'inscrire
              </a>
            )}
          </div>
        </div>

        {/* Tracking panel */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Suivi perso</h3>

          <div className="form-group">
            <label className="form-label">Statut</label>
            <select
              className="form-select"
              value={race.tracking_status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">Non suivi</option>
              {TRACKING_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Notes perso sur cette course..."
            />
          </div>
        </div>
      </div>

      <GpxSection raceId={race.id} raceDist={race.distance_km} raceEle={race.elevation_gain} />
    </div>
  )
}
