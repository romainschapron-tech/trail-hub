import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const statsRoutes = new Hono<AppEnv>()

// Year-to-date totals (and all-time) across all Strava activities.
statsRoutes.get('/strava/overview', async (c) => {
  const db = c.env.DB
  const year = c.req.query('year') || new Date().getFullYear().toString()

  // Foot-based volume only — cycling/ski distort distance & D+.
  const agg = `
    SELECT
      COUNT(*) AS activities,
      ROUND(SUM(distance_m) / 1000.0, 0) AS km,
      COALESCE(SUM(elevation_gain), 0) AS elevation,
      ROUND(SUM(moving_time_s) / 3600.0, 0) AS hours,
      ROUND(SUM(distance_m) / 1000.0, 0) AS run_km
    FROM strava_activities WHERE sport_type IN ('Run','TrailRun','Hike')`

  const [yearRow, allRow, longest] = await Promise.all([
    db.prepare(`${agg} AND strftime('%Y', start_date) = ?`).bind(year)
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

// Estimated VO2max (Daniels VDOT) from best race + real pace per HR zone.
statsRoutes.get('/strava/fitness', async (c) => {
  const db = c.env.DB

  const races = await db
    .prepare(
      `SELECT r.distance_km AS d, t.finish_time AS ft, r.name AS name, r.race_date AS date
       FROM races r JOIN tracking t ON t.race_id = r.id
       WHERE t.status = 'completed' AND t.finish_time IS NOT NULL
         AND r.distance_km BETWEEN 3 AND 60`
    )
    .all<{ d: number; ft: string; name: string; date: string }>()

  const toMin = (ft: string): number | null => {
    const p = ft.split(':').map(Number)
    if (p.some(isNaN)) return null
    if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 60
    if (p.length === 2) return p[0] + p[1] / 60
    return null
  }
  let vdot = 0
  let best: { name: string; date: string; vdot: number } | null = null
  for (const r of races.results) {
    const t = toMin(r.ft)
    if (!t || t < 10 || !r.d) continue
    const v = (r.d * 1000) / t // m/min
    const pVO2 = -4.6 + 0.182258 * v + 0.000104 * v * v
    const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
    const vd = pVO2 / pct
    if (vd > vdot) { vdot = vd; best = { name: r.name, date: r.date, vdot: Math.round(vd * 10) / 10 } }
  }

  const zonesRow = await db.prepare(`SELECT value FROM app_settings WHERE key='strava_hr_zones'`).first<{ value: string }>()
  const zones: { min: number; max: number }[] = zonesRow
    ? JSON.parse(zonesRow.value)
    : [{ min: 0, max: 130 }, { min: 131, max: 150 }, { min: 151, max: 165 }, { min: 166, max: 180 }, { min: 181, max: 220 }]

  const paceZones = await Promise.all(
    zones.map((z, i) => {
      const upper = i === zones.length - 1 ? 999 : z.max
      // Flat-equivalent pace (corrige le dénivelé : 100 m D+ ≈ 0.9 km) pour comparer les zones.
      return db
        .prepare(
          `SELECT ROUND(AVG(moving_time_s * 1.0 / ((distance_m + COALESCE(elevation_gain,0) * 9) / 1000.0)), 0) AS pace, COUNT(*) AS n
           FROM strava_activities
           WHERE has_heartrate = 1 AND sport_type IN ('Run', 'TrailRun')
             AND distance_m > 3000 AND moving_time_s > 0
             AND average_heartrate >= ? AND average_heartrate <= ?`
        )
        .bind(z.min, upper)
        .first<{ pace: number | null; n: number }>()
    })
  )

  return c.json({
    vo2max: vdot ? Math.round(vdot * 10) / 10 : null,
    bestRace: best,
    paceZones: zones.map((z, i) => ({
      label: `Z${i + 1}`,
      min: z.min,
      max: i === zones.length - 1 ? null : z.max,
      paceSec: paceZones[i]?.pace ?? null,
      count: paceZones[i]?.n ?? 0,
    })),
  })
})

// Race-time prediction, calibrated on the athlete's own completed races (power law + climb cost).
statsRoutes.get('/predict', async (c) => {
  const db = c.env.DB
  const dist = parseFloat(c.req.query('dist') || '0')
  const ele = parseFloat(c.req.query('ele') || '0')
  const CLIMB = 0.012 // km flat-equivalent per metre of D+

  const races = await db
    .prepare(
      `SELECT r.distance_km AS d, COALESCE(r.elevation_gain,0) AS e, t.finish_time AS ft
       FROM races r JOIN tracking t ON t.race_id = r.id
       WHERE t.status = 'completed' AND t.finish_time IS NOT NULL AND r.distance_km > 3`
    )
    .all<{ d: number; e: number; ft: string }>()

  const hist: { deq: number; pace: number; ratio: number }[] = []
  const pts: { lx: number; ly: number }[] = []
  for (const r of races.results) {
    const p = r.ft.split(':').map(Number)
    if (p.length !== 3 || p.some(isNaN)) continue
    const sec = p[0] * 3600 + p[1] * 60 + p[2]
    const deq = r.d + r.e * CLIMB
    if (sec > 600 && deq > 1) {
      hist.push({ deq, pace: sec / deq, ratio: r.e / r.d })
      pts.push({ lx: Math.log(deq), ly: Math.log(sec / deq) })
    }
  }

  // Global power-law fit (fallback when no similar races).
  let p0 = 150, exp = 1.16
  if (pts.length >= 4) {
    const n = pts.length
    const mx = pts.reduce((a, p) => a + p.lx, 0) / n
    const my = pts.reduce((a, p) => a + p.ly, 0) / n
    const k = pts.reduce((a, p) => a + (p.lx - mx) * (p.ly - my), 0) / pts.reduce((a, p) => a + (p.lx - mx) ** 2, 0)
    p0 = Math.exp(my - k * mx)
    exp = k + 1
  }

  let predicted: number | null = null
  let low: number | null = null
  let high: number | null = null
  if (dist > 0) {
    const deqT = dist + ele * CLIMB
    const ratioT = ele / dist
    // Similarity-weighted prediction: races close in BOTH distance and steepness count most.
    let sw = 0, swp = 0, swp2 = 0
    for (const h of hist) {
      const wd = Math.exp(-(((Math.log(h.deq) - Math.log(deqT)) / 0.22) ** 2))
      const wr = Math.exp(-(((h.ratio - ratioT) / 35) ** 2))
      const w = wd * wr
      sw += w; swp += w * h.pace; swp2 += w * h.pace * h.pace
    }
    let pace: number
    if (sw > 0.5) {
      pace = swp / sw
      const variance = Math.max(0, swp2 / sw - pace * pace)
      const sd = Math.sqrt(variance)
      predicted = Math.round(pace * deqT)
      const rel = Math.min(0.13, Math.max(0.04, sd / pace)) // 4–13% band by confidence
      low = Math.round(predicted * (1 - rel))
      high = Math.round(predicted * (1 + rel))
    } else {
      predicted = Math.round(p0 * Math.pow(deqT, exp))
      low = Math.round(predicted * 0.9)
      high = Math.round(predicted * 1.12)
    }
  }
  return c.json({ predicted, low, high, sample: hist.length })
})

// Fitness / Fatigue / Form (CTL / ATL / TSB) — Banister model from daily Relative Effort.
statsRoutes.get('/strava/form', async (c) => {
  const db = c.env.DB
  const rows = await db
    .prepare(
      `SELECT date(start_date) AS day, SUM(COALESCE(relative_effort, 0)) AS load
       FROM strava_activities
       GROUP BY day HAVING load > 0 ORDER BY day ASC`
    )
    .all<{ day: string; load: number }>()

  if (rows.results.length === 0) return c.json({ current: null, series: [] })

  const loadByDay: Record<string, number> = {}
  for (const r of rows.results) loadByDay[r.day] = r.load

  const start = new Date(rows.results[0].day + 'T00:00:00Z')
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  let ctl = 0, atl = 0
  const series: { date: string; ctl: number; atl: number; tsb: number }[] = []
  for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const load = loadByDay[key] || 0
    const tsb = ctl - atl // yesterday's fitness − fatigue
    ctl += (load - ctl) / 42
    atl += (load - atl) / 7
    series.push({ date: key, ctl: Math.round(ctl), atl: Math.round(atl), tsb: Math.round(tsb) })
  }

  const last = series[series.length - 1]
  return c.json({
    current: { ctl: last.ctl, atl: last.atl, tsb: last.tsb },
    series: series.slice(-180),
  })
})

// Pace-zone distribution: sessions classified by flat-equivalent pace into the athlete's pace zones.
statsRoutes.get('/strava/pacezones', async (c) => {
  const db = c.env.DB
  const stored = await db.prepare(`SELECT value FROM app_settings WHERE key='pace_zones'`).first<{ value: string }>()
  // Defaults = zones VMA fournies par l'athlète (sec/km). fast = borne rapide, slow = borne lente.
  const zones: { label: string; name: string; fast: number; slow: number }[] = stored
    ? JSON.parse(stored.value)
    : [
        { label: 'Z1', name: 'Récup', fast: 315, slow: 99999 },
        { label: 'Z2', name: 'Endurance', fast: 252, slow: 315 },
        { label: 'Z3', name: 'Tempo', fast: 222, slow: 252 },
        { label: 'Z4', name: 'Seuil', fast: 199, slow: 222 },
        { label: 'Z5', name: 'VMA', fast: 0, slow: 199 },
      ]

  const rows = await Promise.all(
    zones.map((z) =>
      db
        .prepare(
          `SELECT COUNT(*) AS n, ROUND(AVG(average_heartrate)) AS avg_hr
           FROM strava_activities
           WHERE sport_type IN ('Run', 'TrailRun') AND distance_m > 3000 AND moving_time_s > 0
             AND (moving_time_s * 1.0 / ((distance_m + COALESCE(elevation_gain,0) * 9) / 1000.0)) >= ?
             AND (moving_time_s * 1.0 / ((distance_m + COALESCE(elevation_gain,0) * 9) / 1000.0)) < ?`
        )
        .bind(z.fast, z.slow)
        .first<{ n: number; avg_hr: number | null }>()
    )
  )
  const total = rows.reduce((a, r) => a + (r?.n ?? 0), 0)
  return c.json({
    total,
    zones: zones.map((z, i) => ({
      label: z.label, name: z.name, fast: z.fast, slow: z.slow,
      count: rows[i]?.n ?? 0, avgHr: rows[i]?.avg_hr ?? null,
    })),
  })
})

// Yearly training totals broken down by sport group (so cycling/ski don't skew running).
statsRoutes.get('/strava/yearly', async (c) => {
  const db = c.env.DB
  const rows = await db
    .prepare(
      `SELECT strftime('%Y', start_date) AS year,
              CASE
                WHEN sport_type = 'Run' THEN 'Route'
                WHEN sport_type = 'TrailRun' THEN 'Trail'
                WHEN sport_type IN ('Ride','GravelRide','VirtualRide','EBikeRide') THEN 'Vélo'
                WHEN sport_type = 'Hike' THEN 'Rando'
                WHEN sport_type = 'AlpineSki' THEN 'Ski'
                ELSE 'Autre'
              END AS grp,
              COUNT(*) AS activities,
              ROUND(SUM(distance_m) / 1000.0, 0) AS km,
              COALESCE(SUM(elevation_gain), 0) AS elevation,
              ROUND(SUM(moving_time_s) / 3600.0, 0) AS hours
       FROM strava_activities
       GROUP BY year, grp ORDER BY year ASC`
    )
    .all<{ year: string; grp: string; activities: number; km: number; elevation: number; hours: number }>()
  return c.json(rows.results)
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

// Personal records — exact ones from summary data + estimated distance records.
statsRoutes.get('/strava/records', async (c) => {
  const db = c.env.DB
  const foot = `sport_type IN ('Run','TrailRun','Hike')`

  // Exact records (foot sports) — biggest single-activity values.
  const longest = await db.prepare(
    `SELECT name, start_date, distance_m, elevation_gain FROM strava_activities
     WHERE ${foot} AND distance_m > 0 ORDER BY distance_m DESC LIMIT 1`
  ).first<{ name: string; start_date: string; distance_m: number; elevation_gain: number }>()

  const climb = await db.prepare(
    `SELECT name, start_date, elevation_gain, distance_m FROM strava_activities
     WHERE ${foot} AND elevation_gain > 0 ORDER BY elevation_gain DESC LIMIT 1`
  ).first<{ name: string; start_date: string; elevation_gain: number; distance_m: number }>()

  const longestTime = await db.prepare(
    `SELECT name, start_date, moving_time_s, distance_m FROM strava_activities
     WHERE ${foot} AND moving_time_s > 0 ORDER BY moving_time_s DESC LIMIT 1`
  ).first<{ name: string; start_date: string; moving_time_s: number; distance_m: number }>()

  const effort = await db.prepare(
    `SELECT name, start_date, relative_effort, distance_m FROM strava_activities
     WHERE ${foot} AND relative_effort > 0 ORDER BY relative_effort DESC LIMIT 1`
  ).first<{ name: string; start_date: string; relative_effort: number; distance_m: number }>()

  // Distance records (estimated): best avg pace sustained over >= D, on flat road runs.
  const distances = [
    { key: '5k', m: 5000 },
    { key: '10k', m: 10000 },
    { key: 'semi', m: 21097 },
    { key: 'marathon', m: 42195 },
  ]
  const paceRecords = []
  for (const d of distances) {
    // Only efforts near this distance (D .. 1.5×D) so a longer race's pace
    // doesn't masquerade as a shorter-distance PR.
    const best = await db.prepare(
      `SELECT name, start_date, distance_m, moving_time_s,
              (moving_time_s * 1.0 / (distance_m / 1000.0)) AS pace
       FROM strava_activities
       WHERE sport_type = 'Run' AND moving_time_s > 0
         AND distance_m >= ? AND distance_m < ?
         AND (elevation_gain * 1000.0 / distance_m) < 12
       ORDER BY pace ASC LIMIT 1`
    ).bind(d.m, Math.round(d.m * 1.5)).first<{ name: string; start_date: string; distance_m: number; moving_time_s: number; pace: number }>()
    paceRecords.push({
      key: d.key,
      distM: d.m,
      timeSec: best ? Math.round(best.pace * (d.m / 1000)) : null,
      paceSec: best ? Math.round(best.pace) : null,
      name: best?.name ?? null,
      date: best?.start_date ?? null,
      actualKm: best ? Math.round(best.distance_m / 100) / 10 : null,
    })
  }

  return c.json({
    longest: longest ? { name: longest.name, date: longest.start_date, km: Math.round(longest.distance_m / 100) / 10, elevation: longest.elevation_gain } : null,
    climb: climb ? { name: climb.name, date: climb.start_date, elevation: climb.elevation_gain, km: Math.round(climb.distance_m / 100) / 10 } : null,
    longestTime: longestTime ? { name: longestTime.name, date: longestTime.start_date, timeSec: longestTime.moving_time_s, km: Math.round(longestTime.distance_m / 100) / 10 } : null,
    effort: effort ? { name: effort.name, date: effort.start_date, value: effort.relative_effort, km: Math.round(effort.distance_m / 100) / 10 } : null,
    paceRecords,
  })
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
         AND sport_type IN ('Run','TrailRun','Hike')
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
         ROUND(SUM(CASE WHEN sport_type IN ('TrailRun', 'Run') THEN distance_m ELSE 0 END) / 1000.0, 1) AS run_km,
         ROUND(SUM(CASE WHEN sport_type = 'TrailRun' THEN distance_m ELSE 0 END) / 1000.0, 1) AS trail_km
       FROM strava_activities
       WHERE sport_type IN ('Run','TrailRun','Hike')
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
         FROM strava_activities WHERE start_date >= date('now', '-28 days')
           AND sport_type IN ('Run','TrailRun','Hike')`
      )
      .first<{ km: number; elevation: number; effort: number }>(),

    // Chronic load: weeks -8 to -4
    db
      .prepare(
        `SELECT ROUND(SUM(distance_m) / 1000.0, 1) AS km, COALESCE(SUM(elevation_gain), 0) AS elevation,
                COALESCE(SUM(relative_effort), 0) AS effort
         FROM strava_activities WHERE start_date >= date('now', '-56 days') AND start_date < date('now', '-28 days')
           AND sport_type IN ('Run','TrailRun','Hike')`
      )
      .first<{ km: number; elevation: number; effort: number }>(),

    // Streak: consecutive weeks with at least one run
    db
      .prepare(
        `SELECT COUNT(DISTINCT strftime('%Y-%W', start_date)) AS weeks
         FROM strava_activities
         WHERE start_date >= date('now', '-365 days')
           AND sport_type IN ('Run', 'TrailRun', 'Hike')`
      )
      .first<{ weeks: number }>(),

    // Best week ever
    db
      .prepare(
        `SELECT strftime('%Y-%W', start_date) AS week, ROUND(SUM(distance_m) / 1000.0, 1) AS km
         FROM strava_activities WHERE sport_type IN ('Run','TrailRun','Hike')
         GROUP BY week ORDER BY km DESC LIMIT 1`
      )
      .first<{ week: string; km: number }>(),

    // Best month ever
    db
      .prepare(
        `SELECT strftime('%Y-%m', start_date) AS month, ROUND(SUM(distance_m) / 1000.0, 1) AS km
         FROM strava_activities WHERE sport_type IN ('Run','TrailRun','Hike')
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
