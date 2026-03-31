import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const trackingRoutes = new Hono<AppEnv>()

// Upsert tracking for a race
trackingRoutes.post('/:raceId', async (c) => {
  const db = c.env.DB
  const raceId = c.req.param('raceId')
  const body = await c.req.json()

  await db
    .prepare(
      `INSERT INTO tracking (race_id, status, notes, training_readiness)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(race_id) DO UPDATE SET
         status = excluded.status,
         notes = COALESCE(excluded.notes, tracking.notes),
         training_readiness = COALESCE(excluded.training_readiness, tracking.training_readiness),
         updated_at = datetime('now')`
    )
    .bind(
      raceId,
      body.status || 'interested',
      body.notes || null,
      body.training_readiness || null
    )
    .run()

  const tracking = await db
    .prepare('SELECT * FROM tracking WHERE race_id = ?')
    .bind(raceId)
    .first()

  return c.json(tracking)
})

// Remove tracking
trackingRoutes.delete('/:raceId', async (c) => {
  const db = c.env.DB
  const raceId = c.req.param('raceId')
  await db.prepare('DELETE FROM tracking WHERE race_id = ?').bind(raceId).run()
  return c.json({ ok: true })
})
