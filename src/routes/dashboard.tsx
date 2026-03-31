import { createFileRoute } from '@tanstack/react-router'
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
  }, [])

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
    </div>
  )
}
