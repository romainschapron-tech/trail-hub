import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { DashboardStats, RaceWithTracking } from '@/lib/types'
import { formatDate, formatDistance, formatElevation, daysUntil } from '@/lib/formatters'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalRaces ?? '-'}</div>
          <div className="stat-label">Courses au catalogue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.trackedRaces ?? '-'}</div>
          <div className="stat-label">Courses suivies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.upcomingRegistered ?? '-'}</div>
          <div className="stat-label">Inscriptions a venir</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {stats?.upcomingDeadlines ?? '-'}
          </div>
          <div className="stat-label">Deadlines dans 30j</div>
        </div>
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
                  const isTopTen = race.finish_position != null && race.finish_position <= 10
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
                        {race.finish_position != null ? (
                          <span style={{ color: isTopTen ? 'var(--success, #22c55e)' : 'var(--text)', fontWeight: isTopTen ? 600 : 400 }}>
                            {isTopTen && '🏆 '}{race.finish_position}e
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
