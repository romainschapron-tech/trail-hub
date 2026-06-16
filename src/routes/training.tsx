import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { StravaWeekly, StravaMonthly, StravaSport, StravaLoad, StravaElevation, StravaHr } from '@/lib/types'

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
  const [hr, setHr] = useState<StravaHr | null>(null)
  const [weekRange, setWeekRange] = useState(26)
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
      api.stats.stravaHr(),
    ])
      .then(([w, m, s, l, e, h]) => {
        setWeekly(w); setMonthly(m); setSports(s); setLoad(l); setElevation(e); setHr(h)
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
    title: `${weekStart(w.week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${w.km} km`,
    axis: i % labelEvery === 0 ? weekStart(w.week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '',
  }))

  // YoY
  const last12 = monthly.slice(-12).reduce((a, m) => a + m.km, 0)
  const prev12 = monthly.slice(-24, -12).reduce((a, m) => a + m.km, 0)
  const yoy = prev12 > 0 ? Math.round(((last12 - prev12) / prev12) * 100) : null

  // HR
  const maxZone = Math.max(...(hr?.zones.map((z) => z.count) ?? [1]), 1)
  const hrTrend = hr?.trend ?? []
  const trendItems = hrTrend.slice(-18).map((t) => ({
    pct: ((t.avg_hr - 110) / (190 - 110)) * 100,
    color: '#ef4444',
    title: `${fmtMonth(t.month)} — ${t.avg_hr} bpm moy`,
    axis: '',
  }))

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
            <select className="form-select" style={{ width: 'auto', fontSize: '0.78rem', padding: '0.25rem 0.5rem' }} value={weekRange} onChange={(e) => setWeekRange(+e.target.value)}>
              <option value={12}>12 sem.</option>
              <option value={26}>26 sem.</option>
              <option value={52}>52 sem.</option>
              <option value={104}>2 ans</option>
            </select>
          }
        >
          Volume hebdomadaire
        </SectionTitle>
        {yoy !== null && (
          <div style={{ fontSize: '0.84rem', marginBottom: '0.75rem', color: yoy >= 0 ? '#22c55e' : 'var(--danger)' }}>
            {yoy >= 0 ? '+' : ''}{yoy}% sur 12 mois ({Math.round(last12)} km vs {Math.round(prev12)} km)
          </div>
        )}
        <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
          <VerticalBars items={weekItems} height={170} />
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.9rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} /> Trail</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} /> Route / autre</span>
          </div>
        </div>
      </section>

      {/* ── Intensité : zones cardiaques ─────────────────── */}
      <section>
        <SectionTitle right={hr && hr.total > 0 ? <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hr.total} sorties avec FC</span> : undefined}>
          Intensité — zones cardiaques
        </SectionTitle>
        {!hr || hr.total === 0 ? (
          <div className="card" style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Pas encore de données de fréquence cardiaque. Elles arriveront automatiquement à la prochaine synchro Strava.
          </div>
        ) : (
          <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.25rem' }}>
              {hr.zones.map((z, i) => (
                <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 110, flexShrink: 0, fontSize: '0.78rem' }}>
                    <strong style={{ color: ZONE_COLORS[i] }}>{z.label}</strong> <span style={{ color: 'var(--text-muted)' }}>{ZONE_NAMES[i]}</span>
                  </span>
                  <span style={{ width: 78, flexShrink: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {z.max ? `${z.min}-${z.max}` : `${z.min}+`} bpm
                  </span>
                  <div style={{ flex: 1, height: 14, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(z.count / maxZone) * 100}%`, height: '100%', background: ZONE_COLORS[i], borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ width: 64, textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{z.count} sorties</span>
                </div>
              ))}
            </div>
            {trendItems.length > 1 && (
              <>
                <div style={{ fontSize: '0.78rem', fontWeight: 500, marginBottom: '0.5rem' }}>FC moyenne par mois (bpm)</div>
                <VerticalBars items={trendItems} height={90} />
              </>
            )}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.85rem', marginBottom: 0 }}>
              Répartition par <strong>FC moyenne</strong> de chaque sortie (course à pied). Idéalement la majorité du volume en Z1–Z2.
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
        <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 500, marginBottom: '0.6rem' }}>D+ par mois (m)</div>
          <VerticalBars
            items={elevation.slice(-24).map((e) => ({
              pct: (e.elevation / maxElev) * 100,
              color: '#f59e0b',
              title: `${fmtMonth(e.month)} — ${e.elevation.toLocaleString('fr-FR')} m`,
              axis: '',
            }))}
            height={120}
          />
        </div>
      </section>
    </div>
  )
}
