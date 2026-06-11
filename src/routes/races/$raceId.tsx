import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { RaceWithTracking } from '@/lib/types'
import { formatDate, formatDistance, formatElevation, daysUntil } from '@/lib/formatters'
import { TRACKING_STATUSES } from '@/lib/constants'

export const Route = createFileRoute('/races/$raceId')({
  component: RaceDetailPage,
})

function RegistrationBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    open: { label: 'Places disponibles', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
    full: { label: 'Complet', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    closed: { label: 'Inscriptions fermees', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    upcoming: { label: 'Inscriptions bientot', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
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
              <div className="form-label">Distance</div>
              <div>{formatDistance(race.distance_km)}</div>
            </div>
            <div>
              <div className="form-label">Denivele</div>
              <div>{formatElevation(race.elevation_gain)}</div>
            </div>
            <div>
              <div className="form-label">Format</div>
              <div>{race.race_format}</div>
            </div>
            <div>
              <div className="form-label">Prix</div>
              <div>{race.price_eur ? `${race.price_eur} EUR` : '-'}</div>
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
    </div>
  )
}
