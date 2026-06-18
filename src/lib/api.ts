import type { Race, RaceWithTracking, RaceFilters, DashboardStats, YearlyStats, StravaWeekly, StravaMonthly, StravaSport, StravaLoad, StravaElevation, StravaOverview, StravaHr, StravaFitness, StravaPaceZones, StravaYearly, NutritionProduct } from './types'

const BASE = '/api'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error || res.statusText)
  }
  return res.json() as Promise<T>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const api = {
  races: {
    list(filters: RaceFilters = {}) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== '' && v !== null) params.set(k, String(v))
      }
      return fetchJson<PaginatedResponse<RaceWithTracking>>(
        `${BASE}/races?${params}`
      )
    },
    get(id: number) {
      return fetchJson<RaceWithTracking>(`${BASE}/races/${id}`)
    },
    create(data: Partial<Race>) {
      return fetchJson<Race>(`${BASE}/races`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    update(id: number, data: Partial<Race>) {
      return fetchJson<Race>(`${BASE}/races/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    delete(id: number) {
      return fetchJson<{ ok: boolean }>(`${BASE}/races/${id}`, {
        method: 'DELETE',
      })
    },
    geocode() {
      return fetchJson<{ geocoded: number; processed: number; remaining: number }>(`${BASE}/races/geocode`, {
        method: 'POST',
      })
    },
    importEvents() {
      return fetchJson<{ ok: boolean; scanned: number; matched: number }>(`${BASE}/races/import-events`, {
        method: 'POST',
      })
    },
    getGpx(id: number) {
      return fetchJson<{ profile: import('./gpx').GpxRoute; totalDist: number; totalGain: number; fileName: string } | null>(`${BASE}/races/${id}/gpx`)
    },
    saveGpx(id: number, data: { profile: import('./gpx').GpxRoute; totalDist: number; totalGain: number; fileName: string }) {
      return fetchJson<{ ok: boolean }>(`${BASE}/races/${id}/gpx`, { method: 'PUT', body: JSON.stringify(data) })
    },
    deleteGpx(id: number) {
      return fetchJson<{ ok: boolean }>(`${BASE}/races/${id}/gpx`, { method: 'DELETE' })
    },
  },
  tracking: {
    upsert(raceId: number, data: { status: string; notes?: string; training_readiness?: string }) {
      return fetchJson(`${BASE}/tracking/${raceId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    remove(raceId: number) {
      return fetchJson(`${BASE}/tracking/${raceId}`, { method: 'DELETE' })
    },
  },
  dashboard: {
    stats() {
      return fetchJson<DashboardStats>(`${BASE}/dashboard/stats`)
    },
  },
  stats: {
    yearly() {
      return fetchJson<YearlyStats[]>(`${BASE}/stats/yearly`)
    },
    stravaWeekly(weeks = 52) {
      return fetchJson<StravaWeekly[]>(`${BASE}/stats/strava/weekly?weeks=${weeks}`)
    },
    stravaMonthly() {
      return fetchJson<StravaMonthly[]>(`${BASE}/stats/strava/monthly`)
    },
    stravaSports() {
      return fetchJson<StravaSport[]>(`${BASE}/stats/strava/sports`)
    },
    stravaLoad() {
      return fetchJson<StravaLoad>(`${BASE}/stats/strava/load`)
    },
    stravaElevation() {
      return fetchJson<StravaElevation[]>(`${BASE}/stats/strava/elevation`)
    },
    stravaOverview(year?: number) {
      return fetchJson<StravaOverview>(`${BASE}/stats/strava/overview${year ? `?year=${year}` : ''}`)
    },
    stravaHr() {
      return fetchJson<StravaHr>(`${BASE}/stats/strava/hr`)
    },
    stravaPace() {
      return fetchJson<{ flatPaceSec: number; sampleCount: number }>(`${BASE}/stats/strava/pace`)
    },
    stravaFitness() {
      return fetchJson<StravaFitness>(`${BASE}/stats/strava/fitness`)
    },
    stravaPaceZones() {
      return fetchJson<StravaPaceZones>(`${BASE}/stats/strava/pacezones`)
    },
    stravaYearlyTraining() {
      return fetchJson<StravaYearly[]>(`${BASE}/stats/strava/yearly`)
    },
  },
  nutrition: {
    list() {
      return fetchJson<NutritionProduct[]>(`${BASE}/nutrition/products`)
    },
    importSheet(csvUrl?: string) {
      return fetchJson<{ ok: boolean; imported?: number; error?: string }>(`${BASE}/nutrition/import`, {
        method: 'POST',
        body: JSON.stringify(csvUrl ? { csvUrl } : {}),
      })
    },
    fetchPhotos() {
      return fetchJson<{ updated: number; processed: number; remaining: number }>(`${BASE}/nutrition/photos`, {
        method: 'POST',
      })
    },
    addByUrl(url: string) {
      return fetchJson<{ ok: boolean; product?: NutritionProduct; error?: string }>(`${BASE}/nutrition/products`, {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
    },
    remove(id: number) {
      return fetchJson(`${BASE}/nutrition/products/${id}`, { method: 'DELETE' })
    },
  },
  settings: {
    get() {
      return fetchJson<Record<string, string>>(`${BASE}/settings`)
    },
    update(key: string, value: string) {
      return fetchJson(`${BASE}/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      })
    },
  },
}
