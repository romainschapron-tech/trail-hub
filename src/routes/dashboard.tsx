import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { DashboardStats, RaceWithTracking, StravaOverview } from '@/lib/types'
import { formatDate, formatDistance, formatElevation, daysUntil } from '@/lib/formatters'
import { IconCatalog, IconBookmark, IconCalendar, IconAlarm } from '@/components/layout/Icons'

function StatCard({
  value,
  label,
  icon,
  color = 'var(--primary)',
}: {
  value: string | number
  label: string
  icon: React.ReactNode
  color?: string
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-value">{value}</div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 9,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            color,
          }}
        >
          {icon}
        </span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function HeroStat({ value, unit, label, accent }: { value: string; unit?: string; label: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: accent ? 'var(--primary)' : 'var(--text)' }}>
        {value}
        {unit && <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  )
}

function YearHero() {
  const [ov, setOv] = useState<StravaOverview | null>(null)
  useEffect(() => {
    api.stats.stravaOverview().then(setOv).catch(() => setOv(null))
  }, [])

  if (!ov || ov.activities === 0) return null

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        padding: 0,
        background: 'linear-gradient(135deg, var(--bg-elevated, #1a2332) 0%, var(--bg, #11151f) 100%)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem 0', flexWrap: 'wrap', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Ma saison {ov.year}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Total : {ov.allTime.km.toLocaleString('fr-FR')} km · {ov.allTime.elevation.toLocaleString('fr-FR')} m D+ depuis 2019
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <HeroStat value={ov.km.toLocaleString('fr-FR')} unit="km" label="Distance" accent />
        <HeroStat value={ov.elevation.toLocaleString('fr-FR')} unit="m" label="Dénivelé +" />
        <HeroStat value={String(ov.activities)} label="Activités" />
        <HeroStat value={ov.hours.toLocaleString('fr-FR')} unit="h" label="Temps de sport" />
        {ov.longestRun && (
          <HeroStat value={String(ov.longestRun.km)} unit="km" label="Plus longue sortie" />
        )}
      </div>
    </div>
  )
}

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcoming, setUpcoming] = useState<RaceWithTracking[]>([])
  const [deadlines, setDeadlines] = useState<RaceWithTracking[]>([])
  const [pastRaces, setPastRaces] = useState<RaceWithTracking[]>([])
  const [showAllPast, setShowAllPast] = useState(false)

  useEffect(() => {
    api.dashboard.stats().then(setStats)

    const now = new Date().toISOString().slice(0, 10)
    api.races
      .list({ trackingStatus: 'registered', dateFrom: now, sort: 'race_date', order: 'asc', limit: 5 })
      .then((r) => setUpcoming(r.data))

    api.races
      .list({ dateFrom: now, sort: 'race_date', order: 'asc', limit: 10 })
      .then((r) => {
        const withDeadline = r.data.filter(
          (race) =>
            race.registration_deadline &&
            race.tracking_status === 'interested' &&
            daysUntil(race.registration_deadline)! <= 30 &&
            daysUntil(race.registration_deadline)! >= 0
        )
        setDeadlines(withDeadline)
      })

    api.races
      .list({ trackingStatus: 'completed', sort: 'race_date', order: 'desc', limit: 100 })
      .then((r) => setPastRaces(r.data))
  }, [])

  const visiblePastRaces = showAllPast ? pastRaces : pastRaces.slice(0, 8)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <YearHero />

      <div className="stats-grid">
        <StatCard
          value={stats?.totalRaces ?? '-'}
          label="Courses au catalogue"
          icon={<IconCatalog size={18} />}
        />
        <StatCard
          value={stats?.trackedRaces ?? '-'}
          label="Courses suivies"
          icon={<IconBookmark size={18} />}
          color="var(--accent)"
        />
        <StatCard
          value={stats?.upcomingRegistered ?? '-'}
          label="Inscriptions à venir"
          icon={<IconCalendar size={18} />}
          color="var(--success)"
        />
        <StatCard
          value={stats?.upcomingDeadlines ?? '-'}
          label="Deadlines dans 30j"
          icon={<IconAlarm size={18} />}
          color="var(--warning)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Prochaines courses (inscrit)</h2>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune inscription a venir</p>
          ) : (
            upcoming.map((race) => (
              <div key={race.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <strong>{race.name}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {formatDate(race.race_date)} - {formatDistance(race.distance_km)} - {formatElevation(race.elevation_gain)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Deadlines inscription</h2>
          {deadlines.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune deadline proche</p>
          ) : (
            deadlines.map((race) => {
              const days = daysUntil(race.registration_deadline)
              return (
                <div key={race.id} className="deadline-alert">
                  <strong>{race.name}</strong>
                  <span style={{ marginLeft: '0.5rem', color: days! <= 7 ? 'var(--danger)' : 'var(--warning)' }}>
                    {days === 0 ? "Aujourd'hui !" : `J-${days}`}
                  </span>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Deadline: {formatDate(race.registration_deadline)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Past races section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Mes courses passées</h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span><strong style={{ color: 'var(--text)' }}>{stats?.completedFinishes ?? '-'}</strong> finishes</span>
            <span><strong style={{ color: 'var(--text)' }}>{stats?.completedKm ? `${stats.completedKm.toLocaleString('fr-FR')} km` : '-'}</strong></span>
            <span><strong style={{ color: 'var(--text)' }}>{stats?.completedElevation ? `${stats.completedElevation.toLocaleString('fr-FR')} D+` : '-'}</strong></span>
          </div>
        </div>

        {pastRaces.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune course terminée</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Course</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Date</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Distance</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>D+</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Temps</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Position</th>
                </tr>
              </thead>
              <tbody>
                {visiblePastRaces.map((race) => {
                  const pos = race.finish_position
                  const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null
                  const isTopTen = pos != null && pos <= 10
                  return (
                    <tr key={race.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <Link to="/races/$raceId" params={{ raceId: String(race.id) }} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                          <strong>{race.name}</strong>
                        </Link>
                      </td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(race.race_date)}
                      </td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                        {formatDistance(race.distance_km)}
                      </td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                        {formatElevation(race.elevation_gain)}
                      </td>
                      <td style={{ padding: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>
                        {race.finish_time ?? '-'}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {pos != null ? (
                          <span style={{ color: medal ? '#fbbf24' : isTopTen ? 'var(--success, #22c55e)' : 'var(--text)', fontWeight: isTopTen ? 600 : 400 }}>
                            {medal && `${medal} `}{pos}e
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {pastRaces.length > 8 && (
              <button
                onClick={() => setShowAllPast(!showAllPast)}
                style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}
              >
                {showAllPast ? 'Voir moins' : `Voir toutes les courses (${pastRaces.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
