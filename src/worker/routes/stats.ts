import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const statsRoutes = new Hono<AppEnv>()

// Year-to-date totals (and all-time) across all Strava activities.
statsRoutes.get('/strava/overview', async (c) => {
  const db = c.env.DB
  const year = c.req.query('year') || new Date().getFullYear().toString()

  const agg = `
    SELECT
      COUNT(*) AS activities,
      ROUND(SUM(distance_m) / 1000.0, 0) AS km,
      COALESCE(SUM(elevation_gain), 0) AS elevation,
      ROUND(SUM(moving_time_s) / 3600.0, 0) AS hours,
      COALESCE(SUM(CASE WHEN sport_type IN ('Run','TrailRun','Hike') THEN distance_m ELSE 0 END) / 1000.0, 0) AS run_km
    FROM strava_activities`

  const [yearRow, allRow, longest] = await Promise.all([
    db.prepare(`${agg} WHERE strftime('%Y', start_date) = ?`).bind(year)
      .first<{ activities: number; km: number; elevation: number; hours: number; run_km: number }>(),
    db.prepare(agg)
      .first<{ activities: number; km: number; elevation: number; hours: number; run_km: number }>(),
    db.prepare(
      `SELECT name, ROUND(distance_m / 1000.0, 1) AS km, elevation_gain AS elevation, start_date
       FROM strava_activities
       WHERE strftime('%Y', start_date) = ?
         AND sport_type IN ('Run', 'TrailRun')
       ORDER BY distance_m DESC LIMIT 1`
    ).bind(year).first<{ name: string; km: number; elevation: number; start_date: string }>(),
  ])

  return c.json({
    year,
    activities: yearRow?.activities ?? 0,
    km: yearRow?.km ?? 0,
    runKm: Math.round(yearRow?.run_km ?? 0),
    elevation: yearRow?.elevation ?? 0,
    hours: yearRow?.hours ?? 0,
    allTime: {
      activities: allRow?.activities ?? 0,
      km: allRow?.km ?? 0,
      elevation: allRow?.elevation ?? 0,
      hours: allRow?.hours ?? 0,
    },
    longestRun: longest ?? null,
  })
})

// Reference flat pace (sec/km) derived from recent flat-ish runs — used by the race planner.
statsRoutes.get('/strava/pace', async (c) => {
  const db = c.env.DB
  const row = await db
    .prepare(
      `SELECT
         ROUND(AVG(moving_time_s * 1.0 / (distance_m / 1000.0)), 0) AS flat_pace,
         COUNT(*) AS n
       FROM strava_activities
       WHERE sport_type IN ('Run', 'TrailRun')
         AND distance_m >= 5000 AND moving_time_s > 0
         AND start_date >= date('now', '-365 days')
         AND (elevation_gain * 1000.0 / distance_m) < 12`
    )
    .first<{ flat_pace: number | null; n: number }>()

  // Fallback over all-time if not enough recent flat runs.
  let flatPace = row?.flat_pace ?? null
  let sample = row?.n ?? 0
  if (!flatPace || sample < 5) {
    const all = await db
      .prepare(
        `SELECT ROUND(AVG(moving_time_s * 1.0 / (distance_m / 1000.0)), 0) AS flat_pace, COUNT(*) AS n
         FROM strava_activities
         WHERE sport_type IN ('Run', 'TrailRun') AND distance_m >= 5000 AND moving_time_s > 0
           AND (elevation_gain * 1000.0 / distance_m) < 15`
      )
      .first<{ flat_pace: number | null; n: number }>()
    flatPace = all?.flat_pace ?? 360
    sample = all?.n ?? 0
  }

  return c.json({ flatPaceSec: flatPace, sampleCount: sample })
})

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
        `SELECT ROUND(SUM(distance_m) / 1000.0, 1) AS km, COALESCE(SUM(elevation_gain), 0) AS elevation,
                COALESCE(SUM(relative_effort), 0) AS effort
         FROM strava_activities WHERE start_date >= date('now', '-28 days')`
      )
      .first<{ km: number; elevation: number; effort: number }>(),

    // Chronic load: weeks -8 to -4
    db
      .prepare(
        `SELECT ROUND(SUM(distance_m) / 1000.0, 1) AS km, COALESCE(SUM(elevation_gain), 0) AS elevation,
                COALESCE(SUM(relative_effort), 0) AS effort
         FROM strava_activities WHERE start_date >= date('now', '-56 days') AND start_date < date('now', '-28 days')`
      )
      .first<{ km: number; elevation: number; effort: number }>(),

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
    acuteEffort: acute?.effort ?? 0,
    chronicKm: chronic?.km ?? 0,
    chronicElevation: chronic?.elevation ?? 0,
    chronicEffort: chronic?.effort ?? 0,
    ratio: chronic?.km ? Math.round(((acute?.km ?? 0) / chronic.km) * 100) / 100 : null,
    ratioEffort: chronic?.effort ? Math.round(((acute?.effort ?? 0) / chronic.effort) * 100) / 100 : null,
    streakWeeks: streak?.weeks ?? 0,
    bestWeek,
    bestMonth,
  })
})

// Heart-rate: session distribution across HR zones + monthly average HR trend.
statsRoutes.get('/strava/hr', async (c) => {
  const db = c.env.DB

  const zonesRow = await db
    .prepare(`SELECT value FROM app_settings WHERE key = 'strava_hr_zones'`)
    .first<{ value: string }>()
  const zones: { min: number; max: number }[] = zonesRow
    ? JSON.parse(zonesRow.value)
    : [
        { min: 0, max: 130 },
        { min: 131, max: 150 },
        { min: 151, max: 165 },
        { min: 166, max: 180 },
        { min: 181, max: 220 },
      ]

  const totalRow = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM strava_activities
       WHERE has_heartrate = 1 AND average_heartrate IS NOT NULL
         AND sport_type IN ('Run', 'TrailRun')`
    )
    .first<{ c: number }>()

  // Count sessions whose average HR falls in each zone.
  const zoneCounts = await Promise.all(
    zones.map((z, i) => {
      const upper = i === zones.length - 1 ? 999 : z.max
      return db
        .prepare(
          `SELECT COUNT(*) AS c FROM strava_activities
           WHERE has_heartrate = 1 AND sport_type IN ('Run', 'TrailRun')
             AND average_heartrate >= ? AND average_heartrate <= ?`
        )
        .bind(z.min, upper)
        .first<{ c: number }>()
    })
  )

  const trend = await db
    .prepare(
      `SELECT strftime('%Y-%m', start_date) AS month, ROUND(AVG(average_heartrate), 0) AS avg_hr
       FROM strava_activities
       WHERE has_heartrate = 1 AND average_heartrate IS NOT NULL
         AND sport_type IN ('Run', 'TrailRun')
       GROUP BY month ORDER BY month ASC`
    )
    .all<{ month: string; avg_hr: number }>()

  return c.json({
    total: totalRow?.c ?? 0,
    zones: zones.map((z, i) => ({
      label: `Z${i + 1}`,
      min: z.min,
      max: i === zones.length - 1 ? null : z.max,
      count: zoneCounts[i]?.c ?? 0,
    })),
    trend: trend.results,
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
