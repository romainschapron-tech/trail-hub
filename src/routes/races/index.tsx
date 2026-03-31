import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { RaceWithTracking, RaceFilters } from '@/lib/types'
import { formatDate, formatDistance, formatElevation, daysUntil } from '@/lib/formatters'
import { COUNTRIES, RACE_FORMATS, TRACKING_STATUSES } from '@/lib/constants'

export const Route = createFileRoute('/races/')({
  component: RaceListPage,
})

function RaceListPage() {
  const [races, setRaces] = useState<RaceWithTracking[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RaceFilters>({
    sort: 'race_date',
    order: 'asc',
    limit: 50,
  })

  const fetchRaces = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.races.list({ ...filters, page })
      setRaces(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchRaces()
  }, [fetchRaces])

  function updateFilter(key: keyof RaceFilters, value: string | number | undefined) {
    setPage(1)
    setFilters((f) => ({ ...f, [key]: value || undefined }))
  }

  function toggleSort(field: string) {
    setFilters((f) => ({
      ...f,
      sort: field,
      order: f.sort === field && f.order === 'asc' ? 'desc' : 'asc',
    }))
  }

  async function handleStatusChange(raceId: number, status: string) {
    if (status === '') {
      await api.tracking.remove(raceId)
    } else {
      await api.tracking.upsert(raceId, { status })
    }
    fetchRaces()
  }

  return (
    <div>
      {/* Filters */}
      <div className="filters-bar">
        <div className="form-group">
          <input
            className="form-input"
            placeholder="Rechercher..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <div className="form-group">
          <select
            className="form-select"
            value={filters.country || ''}
            onChange={(e) => updateFilter('country', e.target.value)}
          >
            <option value="">Tous les pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <select
            className="form-select"
            value={filters.format || ''}
            onChange={(e) => updateFilter('format', e.target.value)}
          >
            <option value="">Tous les formats</option>
            {RACE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <select
            className="form-select"
            value={filters.trackingStatus || ''}
            onChange={(e) => updateFilter('trackingStatus', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {TRACKING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>
                  Nom {filters.sort === 'name' && (filters.order === 'asc' ? '\u2191' : '\u2193')}
                </th>
                <th onClick={() => toggleSort('race_date')}>
                  Date {filters.sort === 'race_date' && (filters.order === 'asc' ? '\u2191' : '\u2193')}
                </th>
                <th>Lieu</th>
                <th onClick={() => toggleSort('distance_km')}>
                  Distance {filters.sort === 'distance_km' && (filters.order === 'asc' ? '\u2191' : '\u2193')}
                </th>
                <th onClick={() => toggleSort('elevation_gain')}>
                  D+ {filters.sort === 'elevation_gain' && (filters.order === 'asc' ? '\u2191' : '\u2193')}
                </th>
                <th>Deadline</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    Chargement...
                  </td>
                </tr>
              ) : races.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <h3>Aucune course trouvee</h3>
                      <p>Ajoutez une course ou modifiez vos filtres</p>
                    </div>
                  </td>
                </tr>
              ) : (
                races.map((race) => {
                  const deadlineDays = daysUntil(race.registration_deadline)
                  return (
                    <tr key={race.id}>
                      <td>
                        <Link to="/races/$raceId" params={{ raceId: String(race.id) }} style={{ fontWeight: 500 }}>
                          {race.name}
                        </Link>
                      </td>
                      <td>{formatDate(race.race_date)}</td>
                      <td>
                        {race.city ? `${race.city}, ` : ''}
                        {race.country}
                      </td>
                      <td>{formatDistance(race.distance_km)}</td>
                      <td>{formatElevation(race.elevation_gain)}</td>
                      <td>
                        {race.registration_deadline ? (
                          <span style={{
                            color: deadlineDays !== null && deadlineDays <= 7 ? 'var(--danger)' :
                                   deadlineDays !== null && deadlineDays <= 30 ? 'var(--warning)' : undefined,
                          }}>
                            {formatDate(race.registration_deadline)}
                            {deadlineDays !== null && deadlineDays >= 0 && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>J-{deadlineDays}</span>
                            )}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          value={race.tracking_status || ''}
                          onChange={(e) => handleStatusChange(race.id, e.target.value)}
                        >
                          <option value="">-</option>
                          {TRACKING_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {race.website_url && (
                          <a href={race.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                            Site
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Precedent
            </button>
            <span className="pagination-info">
              Page {page} / {totalPages} ({total} courses)
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
