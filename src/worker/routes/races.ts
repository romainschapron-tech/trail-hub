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
