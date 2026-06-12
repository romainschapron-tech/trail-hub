import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { StravaWeekly, StravaMonthly, StravaSport, StravaLoad, StravaElevation } from '@/lib/types'

export const Route = createFileRoute('/training')({
  component: TrainingPage,
})

// ── Mini chart helpers ────────────────────────────────────────────────────────

function SparkBar({
  value,
  max,
  color = 'var(--primary)',
  label,
  sublabel,
}: {
  value: number
  max: number
  color?: string
  label?: string
  sublabel?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {label && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 72, flexShrink: 0, textAlign: 'right' }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      {sublabel && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 48, textAlign: 'right' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: '1rem 1.25rem', minWidth: 130 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: accent ? 'var(--primary)' : 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
      {children}
    </h2>
  )
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function fmtWeek(yw: string) {
  const [y, w] = yw.split('-')
  // ISO week → approximate date
  const jan4 = new Date(+y, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (+w - 1) * 7)
  return weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function ratioColor(ratio: number | null) {
  if (ratio === null) return 'var(--text-muted)'
  if (ratio < 0.8) return 'var(--primary)' // under-training
  if (ratio <= 1.3) return '#22c55e' // optimal
  if (ratio <= 1.5) return 'var(--warning)' // caution
  return 'var(--danger)' // overload risk
}

function ratioLabel(ratio: number | null) {
  if (ratio === null) return '—'
  if (ratio < 0.8) return 'Sous-charge'
  if (ratio <= 1.3) return 'Optimal'
  if (ratio <= 1.5) return 'Attention'
  return 'Surcharge'
}

// ── Main page ─────────────────────────────────────────────────────────────────

function TrainingPage() {
  const [weekly, setWeekly] = useState<StravaWeekly[]>([])
  const [monthly, setMonthly] = useState<StravaMonthly[]>([])
  const [sports, setSports] = useState<StravaSport[]>([])
  const [load, setLoad] = useState<StravaLoad | null>(null)
  const [elevation, setElevation] = useState<StravaElevation[]>([])
  const [weekRange, setWeekRange] = useState(52)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.stats.stravaWeekly(weekRange),
      api.stats.stravaMonthly(),
      api.stats.stravaSports(),
      api.stats.stravaLoad(),
      api.stats.stravaElevation(),
    ])
      .then(([w, m, s, l, e]) => {
        setWeekly(w)
        setMonthly(m)
        setSports(s)
        setLoad(l)
        setElevation(e)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [weekRange])

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Chargement...</div>
  if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Erreur : {error}</div>

  const noData = weekly.length === 0 && monthly.length === 0

  if (noData) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>Aucune activité Strava</h3>
        <p style={{ color: 'var(--text-muted)' }}>Importe tes activités Strava pour voir tes stats d'entraînement.</p>
      </div>
    )
  }

  const maxWeekKm = Math.max(...weekly.map((w) => w.km), 1)
  const maxMonthKm = Math.max(...monthly.map((m) => m.km), 1)
  const maxElev = Math.max(...elevation.map((e) => e.elevation), 1)
  const maxRatio = Math.max(...elevation.map((e) => e.ratio_dplus_per_km), 1)
  const totalSportKm = sports.reduce((a, s) => a + s.km, 0)

  const last12Months = monthly.slice(-12)
  const prev12Months = monthly.slice(-24, -12)
  const last12Km = last12Months.reduce((a, m) => a + m.km, 0)
  const prev12Km = prev12Months.reduce((a, m) => a + m.km, 0)
  const yoyPct = prev12Km > 0 ? Math.round(((last12Km - prev12Km) / prev12Km) * 100) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── 1. Charge d'entraînement ───────────────────────────────────── */}
      <section>
        <SectionTitle>Charge d'entraînement</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <StatCard label="4 dernières semaines" value={`${load?.acuteKm ?? 0} km`} sub={`${load?.acuteElevation?.toLocaleString('fr-FR') ?? 0} m D+`} accent />
          <StatCard label="4 semaines précédentes" value={`${load?.chronicKm ?? 0} km`} sub={`${load?.chronicElevation?.toLocaleString('fr-FR') ?? 0} m D+`} />
          <StatCard
            label="Ratio aigu/chronique"
            value={load?.ratio !== null && load?.ratio !== undefined ? String(load.ratio) : '—'}
            sub={ratioLabel(load?.ratio ?? null)}
            accent={false}
          />
          <StatCard label="Meilleures semaines (52s)" value={`${load?.streakWeeks ?? 0}`} sub="semaines actives" />
          {load?.bestWeek && (
            <StatCard label="Meilleure semaine" value={`${load.bestWeek.km} km`} sub={fmtWeek(load.bestWeek.week)} />
          )}
          {load?.bestMonth && (
            <StatCard label="Meilleur mois" value={`${load.bestMonth.km} km`} sub={fmtMonth(load.bestMonth.month)} />
          )}
        </div>

        {load?.ratio !== null && load?.ratio !== undefined && (
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>Ratio aigu/chronique (optimal : 0.8–1.3)</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: ratioColor(load.ratio) }}>
                {load.ratio} — {ratioLabel(load.ratio)}
              </span>
            </div>
            <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
              {/* zones */}
              <div style={{ position: 'absolute', left: '0%', width: '40%', height: '100%', background: 'rgba(59,130,246,0.15)' }} />
              <div style={{ position: 'absolute', left: '40%', width: '25%', height: '100%', background: 'rgba(34,197,94,0.25)' }} />
              <div style={{ position: 'absolute', left: '65%', width: '12%', height: '100%', background: 'rgba(234,179,8,0.3)' }} />
              <div style={{ position: 'absolute', left: '77%', width: '23%', height: '100%', background: 'rgba(239,68,68,0.2)' }} />
              {/* cursor */}
              <div style={{
                position: 'absolute',
                left: `${Math.min(98, (load.ratio / 2) * 100)}%`,
                top: 0, bottom: 0, width: 3,
                background: ratioColor(load.ratio),
                borderRadius: 2,
                transform: 'translateX(-50%)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>0</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.0+</span>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Volume hebdomadaire ─────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Volume hebdomadaire</h2>
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            value={weekRange}
            onChange={(e) => setWeekRange(+e.target.value)}
          >
            <option value={12}>12 semaines</option>
            <option value={26}>26 semaines</option>
            <option value={52}>52 semaines</option>
            <option value={104}>2 ans</option>
          </select>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {weekly.map((w) => (
              <SparkBar
                key={w.week}
                value={w.km}
                max={maxWeekKm}
                label={fmtWeek(w.week)}
                sublabel={`${w.km} km`}
                color={w.sports?.includes('Trail') ? 'var(--primary)' : '#6366f1'}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} />
              Trail Run
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} />
              Course à pied
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. Volume mensuel + YoY ────────────────────────────────────── */}
      <section>
        <SectionTitle>Volume mensuel</SectionTitle>
        {yoyPct !== null && (
          <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: yoyPct >= 0 ? '#22c55e' : 'var(--danger)' }}>
            {yoyPct >= 0 ? '+' : ''}{yoyPct}% vs l'année précédente ({Math.round(last12Km)} km vs {Math.round(prev12Km)} km)
          </div>
        )}
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {monthly.slice(-24).map((m) => (
              <SparkBar
                key={m.month}
                value={m.km}
                max={maxMonthKm}
                label={fmtMonth(m.month)}
                sublabel={`${m.km} km`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Répartition par sport ───────────────────────────────────── */}
      <section>
        <SectionTitle>Répartition par activité</SectionTitle>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sports.map((s) => (
              <div key={s.sport_type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 500 }}>{s.sport_type}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{s.km} km · {s.count} sorties · {s.hours}h</span>
                </div>
                <SparkBar
                  value={s.km}
                  max={totalSportKm}
                  sublabel={`${Math.round((s.km / totalSportKm) * 100)}%`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Terrain : D+ et ratio ──────────────────────────────────── */}
      <section>
        <SectionTitle>Terrain & Dénivelé</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <StatCard
            label="D+ total (tout temps)"
            value={`${elevation.reduce((a, e) => a + e.elevation, 0).toLocaleString('fr-FR')} m`}
          />
          <StatCard
            label="Ratio moyen D+/km"
            value={`${Math.round(elevation.filter(e => e.km > 0).reduce((a, e) => a + e.ratio_dplus_per_km, 0) / Math.max(1, elevation.filter(e => e.km > 0).length))} m/km`}
          />
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.78rem', fontWeight: 500 }}>D+ par mois (m)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.5rem' }}>
            {elevation.slice(-24).map((e) => (
              <SparkBar
                key={`elev-${e.month}`}
                value={e.elevation}
                max={maxElev}
                label={fmtMonth(e.month)}
                sublabel={`${e.elevation.toLocaleString('fr-FR')} m`}
                color='#f59e0b'
              />
            ))}
          </div>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.78rem', fontWeight: 500 }}>Ratio D+/km par mois</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {elevation.slice(-24).map((e) => (
              <SparkBar
                key={`ratio-${e.month}`}
                value={e.ratio_dplus_per_km}
                max={maxRatio}
                label={fmtMonth(e.month)}
                sublabel={`${e.ratio_dplus_per_km} m/km`}
                color='#10b981'
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
