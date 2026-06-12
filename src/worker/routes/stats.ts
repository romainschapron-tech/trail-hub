import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const statsRoutes = new Hono<AppEnv>()

// Weekly km + elevation for the last N weeks
statsRoutes.get('/strava/weekly', async (c) => {
  const db = c.env.DB
  const weeks = parseInt(c.req.query('weeks') || '52')

  const rows = await db
    .prepare(
      `SELECT
         strftime('%Y-%W', start_date) AS week,
         ROUND(SUM(distance_m) / 1000.0, 1) AS km,
         COALESCE(SUM(elevation_gain), 0) AS elevation,
         COUNT(*) AS count,
         GROUP_CONCAT(DISTINCT sport_type) AS sports
       FROM strava_activities
       WHERE start_date >= date('now', ? || ' days')
       GROUP BY week
       ORDER BY week ASC`
    )
    .bind(-(weeks * 7))
    .all<{ week: string; km: number; elevation: number; count: number; sports: string }>()

  return c.json(rows.results)
})

// Monthly km + elevation for all time
statsRoutes.get('/strava/monthly', async (c) => {
  const db = c.env.DB

  const rows = await db
    .prepare(
      `SELECT
         strftime('%Y-%m', start_date) AS month,
         ROUND(SUM(distance_m) / 1000.0, 1) AS km,
         COALESCE(SUM(elevation_gain), 0) AS elevation,
         COUNT(*) AS count,
         ROUND(SUM(CASE WHEN sport_type IN ('Trail Run', 'Run') THEN distance_m ELSE 0 END) / 1000.0, 1) AS run_km,
         ROUND(SUM(CASE WHEN sport_type = 'Trail Run' THEN distance_m ELSE 0 END) / 1000.0, 1) AS trail_km
       FROM strava_activities
       GROUP BY month
       ORDER BY month ASC`
    )
    .all<{ month: string; km: number; elevation: number; count: number; run_km: number; trail_km: number }>()

  return c.json(rows.results)
})

// Sport type breakdown (all time)
statsRoutes.get('/strava/sports', async (c) => {
  const db = c.env.DB

  const rows = await db
    .prepare(
      `SELECT
         sport_type,
         COUNT(*) AS count,
         ROUND(SUM(distance_m) / 1000.0, 1) AS km,
         COALESCE(SUM(elevation_gain), 0) AS elevation,
         ROUND(SUM(moving_time_s) / 3600.0, 1) AS hours
       FROM strava_activities
       GROUP BY sport_type
       ORDER BY km DESC`
    )
    .all<{ sport_type: string; count: number; km: number; elevation: number; hours: number }>()

  return c.json(rows.results)
})

// Training load: 4-week windows + streak
statsRoutes.get('/strava/load', async (c) => {
  const db = c.env.DB

  const [acute, chronic, streak, bestWeek, bestMonth] = await Promise.all([
    // Acute load: last 4 weeks
    db
      .prepare(
        `SELECT ROUND(SUM(distance_m) / 1000.0, 1) AS km, COALESCE(SUM(elevation_gain), 0) AS elevation
         FROM strava_activities WHERE start_date >= date('now', '-28 days')`
      )
      .first<{ km: number; elevation: number }>(),

    // Chronic load: weeks -8 to -4
    db
      .prepare(
        `SELECT ROUND(SUM(distance_m) / 1000.0, 1) AS km, COALESCE(SUM(elevation_gain), 0) AS elevation
         FROM strava_activities WHERE start_date >= date('now', '-56 days') AND start_date < date('now', '-28 days')`
      )
      .first<{ km: number; elevation: number }>(),

    // Streak: consecutive weeks with at least one run
    db
      .prepare(
        `SELECT COUNT(DISTINCT strftime('%Y-%W', start_date)) AS weeks
         FROM strava_activities
         WHERE start_date >= date('now', '-365 days')
           AND sport_type IN ('Run', 'Trail Run', 'Hike')`
      )
      .first<{ weeks: number }>(),

    // Best week ever
    db
      .prepare(
        `SELECT strftime('%Y-%W', start_date) AS week, ROUND(SUM(distance_m) / 1000.0, 1) AS km
         FROM strava_activities
         GROUP BY week ORDER BY km DESC LIMIT 1`
      )
      .first<{ week: string; km: number }>(),

    // Best month ever
    db
      .prepare(
        `SELECT strftime('%Y-%m', start_date) AS month, ROUND(SUM(distance_m) / 1000.0, 1) AS km
         FROM strava_activities
         GROUP BY month ORDER BY km DESC LIMIT 1`
      )
      .first<{ month: string; km: number }>(),
  ])

  return c.json({
    acuteKm: acute?.km ?? 0,
    acuteElevation: acute?.elevation ?? 0,
    chronicKm: chronic?.km ?? 0,
    chronicElevation: chronic?.elevation ?? 0,
    ratio: chronic?.km ? Math.round(((acute?.km ?? 0) / chronic.km) * 100) / 100 : null,
    streakWeeks: streak?.weeks ?? 0,
    bestWeek,
    bestMonth,
  })
})

// Elevation stats: D+/month and D+/km ratio over time
statsRoutes.get('/strava/elevation', async (c) => {
  const db = c.env.DB

  const rows = await db
    .prepare(
      `SELECT
         strftime('%Y-%m', start_date) AS month,
         COALESCE(SUM(elevation_gain), 0) AS elevation,
         ROUND(SUM(distance_m) / 1000.0, 1) AS km,
         CASE WHEN SUM(distance_m) > 0
           THEN ROUND(SUM(elevation_gain) * 1000.0 / SUM(distance_m), 0)
           ELSE 0
         END AS ratio_dplus_per_km
       FROM strava_activities
       WHERE sport_type IN ('Run', 'Trail Run', 'Hike')
       GROUP BY month
       ORDER BY month ASC`
    )
    .all<{ month: string; elevation: number; km: number; ratio_dplus_per_km: number }>()

  return c.json(rows.results)
})

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
