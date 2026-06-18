import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const racesRoutes = new Hono<AppEnv>()

function slugify(name: string, country: string, year: string): string {
  return `${name}-${country}-${year}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Geocode races missing coordinates (city + country → lat/lng) via Nominatim.
racesRoutes.post('/geocode', async (c) => {
  const db = c.env.DB
  const rows = await db
    .prepare(
      `SELECT id, city, country FROM races
       WHERE latitude IS NULL AND city IS NOT NULL AND city != ''
       LIMIT 20`
    )
    .all<{ id: number; city: string; country: string }>()

  const remainingBefore = await db
    .prepare(`SELECT COUNT(*) AS c FROM races WHERE latitude IS NULL AND city IS NOT NULL AND city != ''`)
    .first<{ c: number }>()

  let done = 0
  for (const r of rows.results) {
    try {
      const params = new URLSearchParams({ city: r.city, format: 'json', limit: '1' })
      if (r.country) params.set('countrycodes', r.country.toLowerCase())
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'TrailHub/1.0 (race planner)' },
      })
      if (res.ok) {
        const data = (await res.json()) as { lat: string; lon: string }[]
        if (data[0]) {
          await db
            .prepare('UPDATE races SET latitude = ?, longitude = ? WHERE id = ?')
            .bind(parseFloat(data[0].lat), parseFloat(data[0].lon), r.id)
            .run()
          done++
        }
      }
    } catch { /* skip on error */ }
    await new Promise((res) => setTimeout(res, 1100)) // be polite to Nominatim
  }

  return c.json({ geocoded: done, processed: rows.results.length, remaining: Math.max(0, (remainingBefore?.c ?? 0) - done) })
})

// Import running/trail events from the 1000pattes (The Events Calendar) REST API.
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

racesRoutes.post('/import-events', async (c) => {
  const db = c.env.DB
  const base = 'https://nord-pas-de-calais.1000pattes.guide/wp-json/tribe/events/v1/events'
  const today = new Date().toISOString().slice(0, 10)

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO races (name, slug, race_date, city, country, race_format, website_url, source, registration_status)
     VALUES (?, ?, ?, ?, 'FR', 'trail', ?, '1000pattes', 'unknown')`
  )
  const batch = []
  let scanned = 0
  for (let page = 1; page <= 16; page++) {
    const res = await fetch(`${base}?per_page=50&page=${page}&start_date=${today}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) break
    const data = (await res.json()) as {
      events?: { slug: string; title: string; url: string; start_date: string; categories?: { name: string }[]; venue?: { city?: string; venue?: string } | unknown[] }[]
    }
    const events = data.events || []
    if (events.length === 0) break
    for (const e of events) {
      scanned++
      const cats = (e.categories || []).map((x) => x.name).join(' ')
      if (!/trail|course/i.test(cats)) continue // keep trails & foot races only
      const venue = e.venue && !Array.isArray(e.venue) ? (e.venue as { city?: string; venue?: string }) : null
      batch.push(
        stmt.bind(
          decodeEntities(e.title),
          `1000-${e.slug}`,
          e.start_date?.slice(0, 10) || null,
          venue?.city || venue?.venue || null,
          e.url || null
        )
      )
    }
    if (events.length < 50) break
  }
  if (batch.length) await db.batch(batch)
  return c.json({ ok: true, scanned, matched: batch.length })
})

// Saved GPX profile for a race
racesRoutes.get('/:id/gpx', async (c) => {
  const row = await c.env.DB
    .prepare('SELECT profile_json, total_dist_m, total_gain_m, file_name FROM race_gpx WHERE race_id = ?')
    .bind(c.req.param('id'))
    .first<{ profile_json: string; total_dist_m: number; total_gain_m: number; file_name: string }>()
  if (!row) return c.json(null)
  return c.json({
    profile: JSON.parse(row.profile_json),
    totalDist: row.total_dist_m,
    totalGain: row.total_gain_m,
    fileName: row.file_name,
  })
})

racesRoutes.put('/:id/gpx', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json()) as { profile: unknown; totalDist: number; totalGain: number; fileName?: string }
  if (!body.profile) return c.json({ error: 'profile manquant' }, 400)
  await c.env.DB
    .prepare(
      `INSERT INTO race_gpx (race_id, profile_json, total_dist_m, total_gain_m, file_name)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(race_id) DO UPDATE SET
         profile_json = excluded.profile_json, total_dist_m = excluded.total_dist_m,
         total_gain_m = excluded.total_gain_m, file_name = excluded.file_name, created_at = datetime('now')`
    )
    .bind(id, JSON.stringify(body.profile), Math.round(body.totalDist || 0), Math.round(body.totalGain || 0), body.fileName || null)
    .run()
  return c.json({ ok: true })
})

racesRoutes.delete('/:id/gpx', async (c) => {
  await c.env.DB.prepare('DELETE FROM race_gpx WHERE race_id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// List races with filters
racesRoutes.get('/', async (c) => {
  const db = c.env.DB
  const q = c.req.query()

  const conditions: string[] = []
  const params: unknown[] = []

  if (q.search) {
    conditions.push('r.name LIKE ?')
    params.push(`%${q.search}%`)
  }
  if (q.country) {
    conditions.push('r.country = ?')
    params.push(q.country)
  }
  if (q.distanceMin) {
    conditions.push('r.distance_km >= ?')
    params.push(Number(q.distanceMin))
  }
  if (q.distanceMax) {
    conditions.push('r.distance_km <= ?')
    params.push(Number(q.distanceMax))
  }
  if (q.elevationMin) {
    conditions.push('r.elevation_gain >= ?')
    params.push(Number(q.elevationMin))
  }
  if (q.elevationMax) {
    conditions.push('r.elevation_gain <= ?')
    params.push(Number(q.elevationMax))
  }
  if (q.dateFrom) {
    conditions.push('r.race_date >= ?')
    params.push(q.dateFrom)
  }
  if (q.dateTo) {
    conditions.push('r.race_date <= ?')
    params.push(q.dateTo)
  }
  if (q.format) {
    conditions.push('r.race_format = ?')
    params.push(q.format)
  }
  if (q.trackingStatus) {
    conditions.push('t.status = ?')
    params.push(q.trackingStatus)
  }
  if (q.registrationStatus) {
    conditions.push('r.registration_status = ?')
    params.push(q.registrationStatus)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sort = q.sort || 'race_date'
  const order = q.order === 'desc' ? 'DESC' : 'ASC'
  const limit = Math.min(Number(q.limit) || 50, 200)
  const page = Math.max(Number(q.page) || 1, 1)
  const offset = (page - 1) * limit

  const allowedSorts = ['race_date', 'name', 'distance_km', 'elevation_gain', 'country', 'created_at']
  const safeSort = allowedSorts.includes(sort) ? `r.${sort}` : 'r.race_date'

  const countSql = `SELECT COUNT(*) as total FROM races r LEFT JOIN tracking t ON t.race_id = r.id ${where}`
  const dataSql = `
    SELECT r.*, t.status as tracking_status, t.notes as tracking_notes, t.training_readiness as tracking_readiness, t.finish_time, t.finish_position
    FROM races r
    LEFT JOIN tracking t ON t.race_id = r.id
    ${where}
    ORDER BY ${safeSort} ${order} NULLS LAST
    LIMIT ? OFFSET ?
  `

  const [countResult, dataResult] = await Promise.all([
    db.prepare(countSql).bind(...params).first<{ total: number }>(),
    db
      .prepare(dataSql)
      .bind(...params, limit, offset)
      .all(),
  ])

  return c.json({
    data: dataResult.results,
    total: countResult?.total ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countResult?.total ?? 0) / limit),
  })
})

// Get single race
racesRoutes.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const race = await db
    .prepare(
      `SELECT r.*, t.id as tracking_id, t.status as tracking_status, t.notes as tracking_notes,
              t.training_readiness as tracking_readiness, t.bib_number, t.finish_time, t.finish_position
       FROM races r
       LEFT JOIN tracking t ON t.race_id = r.id
       WHERE r.id = ?`
    )
    .bind(id)
    .first()

  if (!race) return c.json({ error: 'Race not found' }, 404)
  return c.json(race)
})

// Create race
racesRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const year = body.race_date ? body.race_date.slice(0, 4) : new Date().getFullYear().toString()
  const slug = slugify(body.name, body.country || 'FR', year)

  const result = await db
    .prepare(
      `INSERT INTO races (name, slug, race_date, race_end_date, city, country, region, latitude, longitude,
        distance_km, elevation_gain, elevation_loss, race_format, registration_opens, registration_deadline,
        registration_url, registration_status, price_eur, max_participants, website_url,
        itra_id, itra_points, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`
    )
    .bind(
      body.name,
      slug,
      body.race_date || null,
      body.race_end_date || null,
      body.city || null,
      body.country || 'FR',
      body.region || null,
      body.latitude || null,
      body.longitude || null,
      body.distance_km || null,
      body.elevation_gain || null,
      body.elevation_loss || null,
      body.race_format || 'trail',
      body.registration_opens || null,
      body.registration_deadline || null,
      body.registration_url || null,
      body.registration_status || 'unknown',
      body.price_eur || null,
      body.max_participants || null,
      body.website_url || null,
      body.itra_id || null,
      body.itra_points || null
    )
    .run()

  const race = await db.prepare('SELECT * FROM races WHERE slug = ?').bind(slug).first()
  return c.json(race, 201)
})

// Update race
racesRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()

  const fields: string[] = []
  const values: unknown[] = []

  const updatable = [
    'name', 'race_date', 'race_end_date', 'city', 'country', 'region',
    'latitude', 'longitude', 'distance_km', 'elevation_gain', 'elevation_loss',
    'race_format', 'registration_opens', 'registration_deadline', 'registration_url',
    'registration_status', 'price_eur', 'max_participants', 'website_url',
    'itra_id', 'itra_points',
  ]

  for (const key of updatable) {
    if (key in body) {
      fields.push(`${key} = ?`)
      values.push(body[key])
    }
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push("updated_at = datetime('now')")
  values.push(id)

  await db
    .prepare(`UPDATE races SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  const race = await db.prepare('SELECT * FROM races WHERE id = ?').bind(id).first()
  return c.json(race)
})

// Delete race
racesRoutes.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM races WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
