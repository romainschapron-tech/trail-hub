import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { StravaWeekly, StravaMonthly, StravaSport, StravaLoad, StravaElevation, StravaFitness, StravaPaceZones } from '@/lib/types'

export const Route = createFileRoute('/training')({
  component: TrainingPage,
})

const ZONE_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444']
const ZONE_NAMES = ['Récup', 'Endurance', 'Tempo', 'Seuil', 'Max']

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function weekStart(yw: string) {
  const [y, w] = yw.split('-')
  const jan4 = new Date(+y, 0, 4)
  const dow = jan4.getDay() || 7
  const d = new Date(jan4)
  d.setDate(jan4.getDate() - dow + 1 + (+w - 1) * 7)
  return d
}

function fmtPace(sec: number | null) {
  if (!sec || !isFinite(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

function ratioColor(r: number | null) {
  if (r === null) return 'var(--text-muted)'
  if (r < 0.8) return '#3b82f6'
  if (r <= 1.3) return '#22c55e'
  if (r <= 1.5) return 'var(--warning)'
  return 'var(--danger)'
}
function ratioLabel(r: number | null) {
  if (r === null) return '—'
  if (r < 0.8) return 'Sous-charge'
  if (r <= 1.3) return 'Optimal'
  if (r <= 1.5) return 'Attention'
  return 'Surcharge'
}

// ── Reusable bits ─────────────────────────────────────────────────────────────

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{children}</h2>
      {right}
    </div>
  )
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140, padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.3rem', color: color ?? 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  )
}

// Vertical bar chart. items: { pct 0-100, color, title, axis? }
function VerticalBars({ items, height = 150 }: { items: { pct: number; color: string; title: string; axis?: string }[]; height?: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: items.length > 40 ? 1 : 3, height }}>
        {items.map((it, i) => (
          <div key={i} title={it.title} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: `${Math.max(2, it.pct)}%`, background: it.color, borderRadius: '3px 3px 0 0', transition: 'height 0.3s ease' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: items.length > 40 ? 1 : 3, marginTop: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {it.axis ?? ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

function TrainingPage() {
  const [weekly, setWeekly] = useState<StravaWeekly[]>([])
  const [monthly, setMonthly] = useState<StravaMonthly[]>([])
  const [sports, setSports] = useState<StravaSport[]>([])
  const [load, setLoad] = useState<StravaLoad | null>(null)
  const [elevation, setElevation] = useState<StravaElevation[]>([])
  const [fitness, setFitness] = useState<StravaFitness | null>(null)
  const [pz, setPz] = useState<StravaPaceZones | null>(null)
  const [weekRange, setWeekRange] = useState(26)
  const [weekView, setWeekView] = useState<'chart' | 'table'>('table')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.stats.stravaFitness().then(setFitness).catch(() => {})
    api.stats.stravaPaceZones().then(setPz).catch(() => {})
  }, [])

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
        setWeekly(w); setMonthly(m); setSports(s); setLoad(l); setElevation(e)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [weekRange])

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Chargement...</div>
  if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Erreur : {error}</div>

  if (weekly.length === 0 && monthly.length === 0) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Entraînement</h1></div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3>Aucune activité Strava</h3>
          <p style={{ color: 'var(--text-muted)' }}>Connecte Strava dans les paramètres pour voir tes stats.</p>
        </div>
      </div>
    )
  }

  // Load — prefer Relative Effort (HR-based) over raw km
  const useEffort = (load?.acuteEffort ?? 0) > 0 || (load?.chronicEffort ?? 0) > 0
  const ratio = useEffort ? load?.ratioEffort ?? null : load?.ratio ?? null

  // Weekly bars
  const maxWeekKm = Math.max(...weekly.map((w) => w.km), 1)
  const labelEvery = Math.ceil(weekly.length / 8)
  const weekItems = weekly.map((w, i) => ({
    pct: (w.km / maxWeekKm) * 100,
    color: w.sports?.includes('Trail') ? '#3b82f6' : '#6366f1',
    title: `W${i + 1} · ${weekStart(w.week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${w.km} km`,
    axis: i % labelEvery === 0 ? `W${i + 1}` : '',
  }))

  // YoY
  const last12 = monthly.slice(-12).reduce((a, m) => a + m.km, 0)
  const prev12 = monthly.slice(-24, -12).reduce((a, m) => a + m.km, 0)
  const yoy = prev12 > 0 ? Math.round(((last12 - prev12) / prev12) * 100) : null

  // Pace zones (VMA)
  const maxZone = Math.max(...(pz?.zones.map((z) => z.count) ?? [1]), 1)
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
  const paceRange = (fast: number, slow: number) =>
    slow >= 9999 ? `> ${mmss(fast)}` : fast <= 0 ? `< ${mmss(slow)}` : `${mmss(slow)}–${mmss(fast)}`

  // Sports
  const totalSportKm = sports.reduce((a, s) => a + s.km, 0)
  const maxElev = Math.max(...elevation.map((e) => e.elevation), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title">Entraînement</h1>
      </div>

      {/* ── Forme du moment ─────────────────────────────── */}
      <section>
        <SectionTitle>Forme du moment</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <Metric
            label={useEffort ? 'Charge 4 sem.' : 'Volume 4 sem.'}
            value={useEffort ? String(load?.acuteEffort ?? 0) : `${load?.acuteKm ?? 0} km`}
            sub={useEffort ? 'effort relatif' : `${load?.acuteElevation?.toLocaleString('fr-FR')} m D+`}
            color="var(--primary)"
          />
          <Metric
            label="4 sem. précédentes"
            value={useEffort ? String(load?.chronicEffort ?? 0) : `${load?.chronicKm ?? 0} km`}
            sub={useEffort ? 'effort relatif' : `${load?.chronicElevation?.toLocaleString('fr-FR')} m D+`}
          />
          <Metric label="Ratio aigu/chronique" value={ratio !== null ? String(ratio) : '—'} sub={ratioLabel(ratio)} color={ratioColor(ratio)} />
          <Metric label="Semaines actives" value={`${load?.streakWeeks ?? 0}`} sub="sur 52 sem." />
          {load?.bestMonth && <Metric label="Meilleur mois" value={`${load.bestMonth.km} km`} sub={fmtMonth(load.bestMonth.month)} />}
          {fitness?.vo2max && (
            <Metric label="VO2max estimée" value={String(fitness.vo2max)} sub={fitness.bestRace ? `d'après ${fitness.bestRace.name}` : 'VDOT'} color="#22c55e" />
          )}
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
            <span>Ratio aigu/chronique {useEffort ? '(sur l’effort relatif)' : '(sur le volume)'} — optimal 0.8–1.3</span>
            <span style={{ fontWeight: 600, color: ratioColor(ratio) }}>{ratio ?? '—'} · {ratioLabel(ratio)}</span>
          </div>
          <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '0%', width: '40%', height: '100%', background: 'rgba(59,130,246,0.18)' }} />
            <div style={{ position: 'absolute', left: '40%', width: '25%', height: '100%', background: 'rgba(34,197,94,0.3)' }} />
            <div style={{ position: 'absolute', left: '65%', width: '12%', height: '100%', background: 'rgba(234,179,8,0.32)' }} />
            <div style={{ position: 'absolute', left: '77%', width: '23%', height: '100%', background: 'rgba(239,68,68,0.25)' }} />
            {ratio !== null && (
              <div style={{ position: 'absolute', left: `${Math.min(98, (ratio / 2) * 100)}%`, top: 0, bottom: 0, width: 3, background: ratioColor(ratio), borderRadius: 2, transform: 'translateX(-50%)' }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>0</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.0+</span>
          </div>
        </div>
      </section>

      {/* ── Volume hebdomadaire ─────────────────────────── */}
      <section>
        <SectionTitle
          right={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="view-switcher">
                <button className={`view-btn ${weekView === 'table' ? 'active' : ''}`} onClick={() => setWeekView('table')}>Tableau</button>
                <button className={`view-btn ${weekView === 'chart' ? 'active' : ''}`} onClick={() => setWeekView('chart')}>Graphe</button>
              </div>
              <select className="form-select" style={{ width: 'auto', fontSize: '0.78rem', padding: '0.25rem 0.5rem' }} value={weekRange} onChange={(e) => setWeekRange(+e.target.value)}>
                <option value={12}>12 sem.</option>
                <option value={26}>26 sem.</option>
                <option value={52}>52 sem.</option>
                <option value={104}>2 ans</option>
              </select>
            </div>
          }
        >
          Volume hebdomadaire
        </SectionTitle>
        {yoy !== null && (
          <div style={{ fontSize: '0.84rem', marginBottom: '0.75rem', color: yoy >= 0 ? '#22c55e' : 'var(--danger)' }}>
            {yoy >= 0 ? '+' : ''}{yoy}% sur 12 mois ({Math.round(last12)} km vs {Math.round(prev12)} km)
          </div>
        )}
        {weekView === 'table' ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.6rem 1.25rem', fontWeight: 500 }}>Semaine</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>km</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>D+</th>
                  <th style={{ padding: '0.6rem 1.25rem', fontWeight: 500, textAlign: 'right' }}>Sorties</th>
                </tr>
              </thead>
              <tbody>
                {[...weekly].reverse().map((w, i) => {
                  const d = weekStart(w.week)
                  const wn = weekly.length - i
                  return (
                    <tr key={w.week} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 1.25rem' }}>
                        <strong>W{wn}</strong> <span style={{ color: 'var(--text-muted)' }}>· {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      </td>
                      <td style={{ padding: '0.5rem 0.5rem', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{w.km}</td>
                      <td style={{ padding: '0.5rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{w.elevation.toLocaleString('fr-FR')} m</td>
                      <td style={{ padding: '0.5rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)' }}>{w.count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
          <VerticalBars items={weekItems} height={170} />
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.9rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} /> Trail</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} /> Route / autre</span>
          </div>
        </div>
        )}
      </section>

      {/* ── Intensité : zones d'allure (VMA) ─────────────── */}
      <section>
        <SectionTitle right={pz && pz.total > 0 ? <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pz.total} sorties</span> : undefined}>
          Intensité — zones d'allure
        </SectionTitle>
        {!pz || pz.total === 0 ? (
          <div className="card" style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Pas encore assez de données. Les sorties apparaîtront après la synchro Strava.
          </div>
        ) : (
          <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {pz.zones.map((z, i) => (
                <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 118, flexShrink: 0, fontSize: '0.78rem' }}>
                    <strong style={{ color: ZONE_COLORS[i] }}>{z.label}</strong> <span style={{ color: 'var(--text-muted)' }}>{z.name}</span>
                  </span>
                  <span style={{ width: 96, flexShrink: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {paceRange(z.fast, z.slow)} /km
                  </span>
                  <div style={{ flex: 1, height: 14, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(z.count / maxZone) * 100}%`, height: '100%', background: ZONE_COLORS[i], borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ width: 64, textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{z.avgHr ? `${z.avgHr} bpm` : '—'}</span>
                  <span style={{ width: 58, textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{z.count} sorties</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.95rem', marginBottom: 0 }}>
              Chaque sortie classée selon son <strong>allure équivalent-plat</strong> (corrigée du dénivelé) dans tes zones VMA. FC moyenne observée indiquée à titre indicatif.
            </p>
          </div>
        )}
      </section>

      {/* ── Répartition par activité ─────────────────────── */}
      <section>
        <SectionTitle>Répartition par activité</SectionTitle>
        <div className="card" style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {sports.map((s) => (
            <div key={s.sport_type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{s.sport_type}</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.km.toLocaleString('fr-FR')} km · {s.count} sorties · {s.hours} h</span>
              </div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(s.km / totalSportKm) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Terrain ──────────────────────────────────────── */}
      <section>
        <SectionTitle>Terrain & dénivelé</SectionTitle>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.6rem 1.25rem', fontWeight: 500 }}>Mois</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500, width: '34%' }}>Dénivelé +</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>Distance</th>
                <th style={{ padding: '0.6rem 1.25rem', fontWeight: 500, textAlign: 'right' }}>Ratio D+/km</th>
              </tr>
            </thead>
            <tbody>
              {elevation.slice(-12).reverse().map((e) => (
                <tr key={e.month} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem 1.25rem', fontWeight: 500, textTransform: 'capitalize' }}>{fmtMonth(e.month)}</td>
                  <td style={{ padding: '0.5rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(e.elevation / maxElev) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                      </div>
                      <span style={{ minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{e.elevation.toLocaleString('fr-FR')} m</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{e.km} km</td>
                  <td style={{ padding: '0.5rem 1.25rem', textAlign: 'right', fontWeight: 600, color: e.ratio_dplus_per_km >= 30 ? '#f59e0b' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{e.ratio_dplus_per_km} m/km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
