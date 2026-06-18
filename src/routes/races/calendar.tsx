import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import type { RaceWithTracking } from '@/lib/types'

export const Route = createFileRoute('/races/calendar')({
  component: CalendarView,
})

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const STATUS_COLOR: Record<string, string> = {
  interested: '#3b82f6', registered: '#22c55e', completed: '#a855f7', archived: '#64748b',
}

function CalendarView() {
  const today = new Date()
  const [races, setRaces] = useState<RaceWithTracking[]>([])
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })

  useEffect(() => {
    api.races.list({ limit: 500, sort: 'race_date', order: 'asc' }).then((r) => setRaces(r.data))
  }, [])

  const byDay = useMemo(() => {
    const map: Record<string, RaceWithTracking[]> = {}
    for (const r of races) {
      if (!r.race_date) continue
      const k = r.race_date.slice(0, 10)
      ;(map[k] ||= []).push(r)
    }
    return map
  }, [races])

  const { y, m } = cursor
  const first = new Date(y, m, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function shift(delta: number) {
    const d = new Date(y, m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }

  const isToday = (day: number) => y === today.getFullYear() && m === today.getMonth() && day === today.getDate()

  return (
    <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{MONTHS[m]} {y}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => shift(-1)}>← Préc.</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}>Aujourd'hui</button>
          <button className="btn btn-ghost btn-sm" onClick={() => shift(1)}>Suiv. →</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 4 }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const key = day ? `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
          const dayRaces = key ? byDay[key] || [] : []
          return (
            <div key={i} style={{
              minHeight: 92, borderRadius: 8, padding: 6,
              background: day ? 'var(--bg)' : 'transparent',
              border: day ? `1px solid ${isToday(day) ? 'var(--primary)' : 'var(--border)'}` : 'none',
            }}>
              {day && (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: isToday(day) ? 700 : 500, color: isToday(day) ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 4 }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {dayRaces.slice(0, 3).map((r) => (
                      <Link key={r.id} to="/races/$raceId" params={{ raceId: String(r.id) }}
                        title={r.name}
                        style={{
                          fontSize: '0.68rem', lineHeight: 1.2, padding: '2px 5px', borderRadius: 4,
                          background: `color-mix(in srgb, ${STATUS_COLOR[r.tracking_status || ''] || '#64748b'} 18%, transparent)`,
                          color: 'var(--text)', textDecoration: 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          borderLeft: `2px solid ${STATUS_COLOR[r.tracking_status || ''] || '#64748b'}`,
                        }}>
                        {r.name}
                      </Link>
                    ))}
                    {dayRaces.length > 3 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{dayRaces.length - 3} autre(s)</span>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        {Object.entries({ interested: 'Intéressé', registered: 'Inscrit', completed: 'Terminé' }).map(([k, label]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[k] }} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}
