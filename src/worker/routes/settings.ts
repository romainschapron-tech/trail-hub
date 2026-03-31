import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const settingsRoutes = new Hono<AppEnv>()

// Get all settings
settingsRoutes.get('/', async (c) => {
  const db = c.env.DB
  const result = await db.prepare('SELECT key, value FROM app_settings').all()
  const settings: Record<string, string> = {}
  for (const row of result.results as { key: string; value: string }[]) {
    settings[row.key] = row.value
  }
  return c.json(settings)
})

// Update a setting
settingsRoutes.put('/:key', async (c) => {
  const db = c.env.DB
  const key = c.req.param('key')
  const body = await c.req.json()

  await db
    .prepare(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .bind(key, body.value)
    .run()

  return c.json({ ok: true })
})
