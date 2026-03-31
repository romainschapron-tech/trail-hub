import type { Race, RaceWithTracking, RaceFilters, DashboardStats } from './types'

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
