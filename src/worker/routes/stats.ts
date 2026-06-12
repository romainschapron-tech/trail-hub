import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const statsRoutes = new Hono<AppEnv>()

statsRoutes.get('/yearly', async (c) => {
  const db = c.env.DB

  const rows = await db
    .prepare(
      `SELECT
         strftime('%Y', r.race_date) AS year,
         COUNT(*) AS race_count,
         ROUND(SUM(r.distance_km), 0) AS total_km,
         ROUND(SUM(r.elevation_gain), 0) AS total_elevation,
         MIN(t.finish_position) AS best_position,
         COUNT(CASE WHEN t.finish_position IS NOT NULL AND t.finish_position <= 10 THEN 1 END) AS top10_count
       FROM races r
       JOIN tracking t ON t.race_id = r.id
       WHERE t.status = 'completed'
         AND r.race_date IS NOT NULL
       GROUP BY year
       ORDER BY year ASC`
    )
    .all<{
      year: string
      race_count: number
      total_km: number
      total_elevation: number
      best_position: number | null
      top10_count: number
    }>()

  return c.json(rows.results)
})
