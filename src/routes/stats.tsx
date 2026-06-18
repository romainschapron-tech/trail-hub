import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import type { YearlyStats, RaceWithTracking, StravaYearly } from '@/lib/types'

export const Route = createFileRoute('/stats')({
  component: StatsPage,
})

// Parse 'HH:MM:SS' to total seconds
function toSeconds(t: string): number {
  const parts = t.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60
  return 0
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function Bar({ value, max, color = 'var(--primary)' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 50, textAlign: 'right' }}>
        {value.toLocaleString('fr-FR')}
      </span>
    </div>
  )
}

const GROUP_COLORS: Record<string, string> = {
  Route: '#6366f1', Trail: '#3b82f6', Rando: '#f59e0b', Vélo: '#22c55e', Ski: '#a855f7', Autre: '#64748b',
}

// Stacked horizontal bar: segments sized by value, scaled to max.
function StackedBar({ segments, max }: { segments: { grp: string; value: number }[]; max: number }) {
  return (
    <div style={{ display: 'flex', height: 16, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      {segments.map((s) => (
        <div key={s.grp} title={`${s.grp} : ${s.value.toLocaleString('fr-FR')}`}
          style={{ width: `${(s.value / max) * 100}%`, background: GROUP_COLORS[s.grp] || '#64748b' }} />
      ))}
    </div>
  )
}

function TrainingByYear({ training }: { training: StravaYearly[] }) {
  const years = Array.from(new Set(training.map((t) => t.year))).sort()
  const distGroups = ['Route', 'Trail', 'Rando', 'Vélo']
  const elevGroups = ['Route', 'Trail', 'Rando'] // foot climbing only — ski/vélo D+ misleading
  const seg = (year: string, groups: string[], field: 'km' | 'elevation') =>
    groups.map((g) => ({ grp: g, value: training.filter((t) => t.year === year && t.grp === g).reduce((a, t) => a + t[field], 0) }))
  const total = (year: string, groups: string[], field: 'km' | 'elevation') => seg(year, groups, field).reduce((a, s) => a + s.value, 0)
  const maxDist = Math.max(...years.map((y) => total(y, distGroups, 'km')), 1)
  const maxElev = Math.max(...years.map((y) => total(y, elevGroups, 'elevation')), 1)
  const usedGroups = distGroups.filter((g) => training.some((t) => t.grp === g && t.km > 0))

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Volume d'entraînement par année</h2>
        <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {usedGroups.map((g) => (
            <span key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: GROUP_COLORS[g] }} />{g}
            </span>
          ))}
        </div>
      </div>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 0, marginBottom: '1.1rem' }}>
        Distance par sport · le dénivelé ne compte que la course à pied (le ski/vélo fausserait le D+).
      </p>
      {training.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {years.slice().reverse().map((y) => {
            const distTotal = total(y, distGroups, 'km')
            const elevTotal = total(y, elevGroups, 'elevation')
            const runKm = total(y, ['Route', 'Trail', 'Rando'], 'km')
            return (
              <div key={y} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <span style={{ width: 40, fontWeight: 600 }}>{y}</span>
                <div style={{ flex: 1 }}>
                  <StackedBar segments={seg(y, distGroups, 'km')} max={maxDist} />
                </div>
                <span style={{ width: 92, textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(runKm).toLocaleString('fr-FR')} km <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>à pied</span>
                </span>
                <span style={{ width: 78, textAlign: 'right', fontSize: '0.78rem', color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                  {elevTotal.toLocaleString('fr-FR')} m
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatsPage() {
  const [yearly, setYearly] = useState<YearlyStats[]>([])
  const [training, setTraining] = useState<StravaYearly[]>([])
  const [pastRaces, setPastRaces] = useState<RaceWithTracking[]>([])
  const [targetKm, setTargetKm] = useState('')
  const [targetElev, setTargetElev] = useState('')

  useEffect(() => {
    api.stats.yearly().then(setYearly).catch(console.error)
    api.stats.stravaYearlyTraining().then(setTraining).catch(console.error)
    api.races
      .list({ trackingStatus: 'completed', sort: 'race_date', order: 'asc', limit: 200 })
      .then((r) => setPastRaces(r.data))
      .catch(console.error)
  }, [])

  const maxKm = Math.max(...yearly.map((y) => y.total_km), 1)
  const maxElev = Math.max(...yearly.map((y) => y.total_elevation ?? 0), 1)
  const maxRaces = Math.max(...yearly.map((y) => y.race_count), 1)

  const prediction = useMemo(() => {
    const km = parseFloat(targetKm)
    const elev = parseFloat(targetElev) || 0
    if (!km || km <= 0) return null

    const usable = pastRaces.filter(
      (r) => r.finish_time && r.distance_km && r.distance_km > 0
    )
    if (usable.length === 0) return null

    // Naismith equivalent flat km: 1 km per 100m D+
    const effortKm = (d: number, e: number) => d + e / 100

    const paces = usable.map((r) => {
      const secs = toSeconds(r.finish_time!)
      const effort = effortKm(r.distance_km!, r.elevation_gain ?? 0)
      return secs / effort
    })

    const avg = paces.reduce((a, b) => a + b, 0) / paces.length
    const min = Math.min(...paces)
    const max = Math.max(...paces)
    const targetEffort = effortKm(km, elev)

    // Find similar races (distance within 30%)
    const similar = usable
      .filter((r) => {
        const ratio = r.distance_km! / km
        return ratio >= 0.7 && ratio <= 1.3
      })
      .sort((a, b) => {
        // sort by closest distance
        return Math.abs(a.distance_km! - km) - Math.abs(b.distance_km! - km)
      })
      .slice(0, 5)

    return {
      predicted: Math.round(avg * targetEffort),
      optimistic: Math.round(min * targetEffort),
      pessimistic: Math.round(max * targetEffort),
      basedOn: usable.length,
      similar,
    }
  }, [targetKm, targetElev, pastRaces])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Statistiques</h1>
      </div>

      {/* Training volume per year, split by sport */}
      <TrainingByYear training={training} />

      {/* Race results per year */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Résultats en course par année</h2>

        {yearly.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chargement…</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.4rem 0.75rem 0.4rem 0', fontWeight: 500, width: 56 }}>Année</th>
                <th style={{ padding: '0.4rem 0.75rem', fontWeight: 500, width: 64 }}>Courses</th>
                <th style={{ padding: '0.4rem 0.75rem', fontWeight: 500, width: '35%' }}>Distance totale</th>
                <th style={{ padding: '0.4rem 0.75rem', fontWeight: 500, width: '35%' }}>Dénivelé cumulé</th>
                <th style={{ padding: '0.4rem 0.75rem', fontWeight: 500 }}>Meilleure place</th>
                <th style={{ padding: '0.4rem 0.75rem', fontWeight: 500 }}>Top 10</th>
              </tr>
            </thead>
            <tbody>
              {yearly.map((y) => (
                <tr key={y.year} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem 0.75rem 0.6rem 0', fontWeight: 600 }}>{y.year}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: Math.round((y.race_count / maxRaces) * 32), height: 8, background: 'var(--primary)', borderRadius: 2, minWidth: 4 }} />
                      <span>{y.race_count}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <Bar value={y.total_km} max={maxKm} />
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <Bar value={y.total_elevation ?? 0} max={maxElev} color="var(--warning, #f59e0b)" />
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: y.best_position != null && y.best_position <= 10 ? 600 : 400, color: y.best_position != null && y.best_position <= 3 ? 'var(--success, #22c55e)' : 'inherit' }}>
                    {y.best_position != null ? `${y.best_position}e` : '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                    {y.top10_count > 0 ? `×${y.top10_count}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {yearly.length > 1 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 600 }}>
                  <td style={{ padding: '0.6rem 0.75rem 0.6rem 0' }}>Total</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {yearly.reduce((s, y) => s + y.race_count, 0)}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {yearly.reduce((s, y) => s + y.total_km, 0).toLocaleString('fr-FR')} km
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {yearly.reduce((s, y) => s + (y.total_elevation ?? 0), 0).toLocaleString('fr-FR')} m D+
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Time predictor */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Prédicteur de temps</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
          Basé sur tes performances passées via la règle de Naismith (1 km équivalent = 100 m D+).
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Distance (km)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={targetKm}
              onChange={(e) => setTargetKm(e.target.value)}
              placeholder="ex: 50"
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-secondary, var(--border))',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text)',
                fontSize: '0.9375rem',
                width: 110,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Dénivelé positif (m)
            </label>
            <input
              type="number"
              min="0"
              max="10000"
              value={targetElev}
              onChange={(e) => setTargetElev(e.target.value)}
              placeholder="ex: 2500"
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-secondary, var(--border))',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text)',
                fontSize: '0.9375rem',
                width: 140,
              }}
            />
          </div>
        </div>

        {prediction && (
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {formatSeconds(prediction.predicted)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Temps prédit
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Optimiste : </span>
                  <strong style={{ color: 'var(--success, #22c55e)' }}>{formatSeconds(prediction.optimistic)}</strong>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pessimiste : </span>
                  <strong style={{ color: 'var(--warning, #f59e0b)' }}>{formatSeconds(prediction.pessimistic)}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Basé sur {prediction.basedOn} course{prediction.basedOn > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {prediction.similar.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Courses similaires utilisées comme référence :
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <tbody>
                    {prediction.similar.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text)' }}>{r.name}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>{r.distance_km} km</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>{r.elevation_gain} m D+</td>
                        <td style={{ padding: '0.4rem 0.5rem', fontVariantNumeric: 'tabular-nums' }}>{r.finish_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!prediction && targetKm && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Pas assez de données pour calculer une prédiction.
          </p>
        )}
      </div>
    </div>
  )
}
