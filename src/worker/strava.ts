import type { AppEnv } from './index'

type Env = AppEnv['Bindings']

const TOKEN_URL = 'https://www.strava.com/oauth/token'
const ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities'

// Settings keys used to persist OAuth state
const K_REFRESH = 'strava_refresh_token'
const K_ACCESS = 'strava_access_token'
const K_EXPIRES = 'strava_access_expires_at' // unix seconds
const K_LAST_SYNC = 'strava_last_sync_at' // ISO datetime
const K_ATHLETE = 'strava_athlete_id'

async function getSetting(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT value FROM app_settings WHERE key = ?')
    .bind(key)
    .first<{ value: string }>()
  return row?.value ?? null
}

async function setSetting(env: Env, key: string, value: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  )
    .bind(key, value)
    .run()
}

export async function isStravaConnected(env: Env): Promise<boolean> {
  return (await getSetting(env, K_REFRESH)) !== null
}

export async function getStravaStatus(env: Env) {
  const [refresh, lastSync, athlete] = await Promise.all([
    getSetting(env, K_REFRESH),
    getSetting(env, K_LAST_SYNC),
    getSetting(env, K_ATHLETE),
  ])
  const count = await env.DB.prepare(
    'SELECT COUNT(*) as c FROM strava_activities'
  ).first<{ c: number }>()
  return {
    connected: refresh !== null,
    athleteId: athlete,
    lastSyncAt: lastSync,
    activityCount: count?.c ?? 0,
  }
}

// Build the Strava authorize URL the browser should be redirected to.
export function buildAuthorizeUrl(env: Env, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

// Exchange the one-time authorization code for tokens and persist them.
export async function exchangeCode(env: Env, code: string): Promise<void> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_at: number
    athlete?: { id: number }
  }
  await Promise.all([
    setSetting(env, K_ACCESS, data.access_token),
    setSetting(env, K_REFRESH, data.refresh_token),
    setSetting(env, K_EXPIRES, String(data.expires_at)),
    data.athlete ? setSetting(env, K_ATHLETE, String(data.athlete.id)) : Promise.resolve(),
  ])
}

// Return a valid access token, refreshing it if expired/near expiry.
async function getAccessToken(env: Env): Promise<string> {
  const [access, expiresAt, refresh] = await Promise.all([
    getSetting(env, K_ACCESS),
    getSetting(env, K_EXPIRES),
    getSetting(env, K_REFRESH),
  ])
  if (!refresh) throw new Error('Strava not connected')

  const now = Math.floor(Date.now() / 1000)
  // 2 min safety margin
  if (access && expiresAt && Number(expiresAt) - 120 > now) {
    return access
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  await Promise.all([
    setSetting(env, K_ACCESS, data.access_token),
    setSetting(env, K_REFRESH, data.refresh_token),
    setSetting(env, K_EXPIRES, String(data.expires_at)),
  ])
  return data.access_token
}

interface StravaSummaryActivity {
  id: number
  name: string
  sport_type: string
  start_date_local: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  suffer_score?: number
  calories?: number
  average_cadence?: number
  kudos_count?: number
  pr_count?: number
  achievement_count?: number
  gear_id?: string | null
  average_heartrate?: number
  max_heartrate?: number
  has_heartrate?: boolean
}

// Upsert a page of activities into the strava_activities table.
async function upsertActivities(env: Env, activities: StravaSummaryActivity[]): Promise<number> {
  if (activities.length === 0) return 0
  const stmt = env.DB.prepare(
    `INSERT OR REPLACE INTO strava_activities
       (id, name, sport_type, start_date, distance_m, moving_time_s, elapsed_time_s,
        elevation_gain, avg_speed, max_speed, relative_effort, calories, avg_cadence,
        kudos_count, pr_count, achievement_count, gear_id,
        average_heartrate, max_heartrate, has_heartrate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const batch = activities.map((a) =>
    stmt.bind(
      String(a.id),
      a.name,
      a.sport_type,
      // Strava returns "...Z"; keep local wall time without the trailing Z to match imports
      a.start_date_local?.replace('Z', '') ?? null,
      Math.round(a.distance ?? 0),
      a.moving_time ?? 0,
      a.elapsed_time ?? 0,
      Math.round(a.total_elevation_gain ?? 0),
      a.average_speed ?? null,
      a.max_speed ?? null,
      a.suffer_score ?? null,
      a.calories ?? null,
      a.average_cadence ?? null,
      a.kudos_count ?? 0,
      a.pr_count ?? 0,
      a.achievement_count ?? 0,
      a.gear_id ?? null,
      a.average_heartrate ?? null,
      a.max_heartrate ? Math.round(a.max_heartrate) : null,
      a.has_heartrate ? 1 : 0
    )
  )
  await env.DB.batch(batch)
  return activities.length
}

// Fetch every activity newer than the most recent one in the DB and upsert them.
// Returns the number of new/updated activities.
export async function syncStravaActivities(env: Env): Promise<number> {
  const token = await getAccessToken(env)

  // Resume from the latest activity we already have.
  const latest = await env.DB.prepare(
    'SELECT MAX(start_date) as d FROM strava_activities'
  ).first<{ d: string | null }>()
  let after = 0
  if (latest?.d) {
    // start_date stored as local wall time; treat as UTC epoch for the `after` cursor.
    after = Math.floor(new Date(latest.d + 'Z').getTime() / 1000)
  }

  let page = 1
  let total = 0
  // Safety cap: 20 pages * 100 = 2000 activities per run.
  while (page <= 20) {
    const url = `${ACTIVITIES_URL}?after=${after}&per_page=100&page=${page}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status} ${await res.text()}`)
    const activities = (await res.json()) as StravaSummaryActivity[]
    if (activities.length === 0) break
    total += await upsertActivities(env, activities)
    if (activities.length < 100) break
    page++
  }

  // Refresh the athlete's HR zone boundaries (cheap, once per sync).
  try {
    const zres = await fetch('https://www.strava.com/api/v3/athlete/zones', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (zres.ok) {
      const zdata = (await zres.json()) as { heart_rate?: { zones?: { min: number; max: number }[] } }
      const hz = zdata.heart_rate?.zones
      if (hz && hz.length) await setSetting(env, 'strava_hr_zones', JSON.stringify(hz))
    }
  } catch (e) {
    console.error('strava zones fetch', e)
  }

  await setSetting(env, K_LAST_SYNC, new Date().toISOString())
  return total
}
