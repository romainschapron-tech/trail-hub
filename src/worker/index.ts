import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { racesRoutes } from './routes/races'
import { trackingRoutes } from './routes/tracking'
import { settingsRoutes } from './routes/settings'
import { statsRoutes } from './routes/stats'
import { stravaRoutes } from './routes/strava'
import { syncStravaActivities, isStravaConnected } from './strava'

export type AppEnv = {
  Bindings: {
    DB: D1Database
    ASSETS: Fetcher
    RESEND_API_KEY: string
    NOTIFICATION_EMAIL: string
    STRAVA_CLIENT_ID: string
    STRAVA_CLIENT_SECRET: string
  }
}

const app = new Hono<AppEnv>()

app.use('/api/*', cors())

app.route('/api/races', racesRoutes)
app.route('/api/tracking', trackingRoutes)
app.route('/api/settings', settingsRoutes)
app.route('/api/stats', statsRoutes)
app.route('/api/strava', stravaRoutes)

app.get('/api/dashboard/stats', async (c) => {
  const db = c.env.DB
  const now = new Date().toISOString().slice(0, 10)

  const [totalRaces, trackedRaces, upcomingRegistered, upcomingDeadlines, completedStats] =
    await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM races').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM tracking').first<{ count: number }>(),
      db
        .prepare(
          `SELECT COUNT(*) as count FROM tracking t
         JOIN races r ON r.id = t.race_id
         WHERE t.status = 'registered' AND r.race_date >= ?`
        )
        .bind(now)
        .first<{ count: number }>(),
      db
        .prepare(
          `SELECT COUNT(*) as count FROM tracking t
         JOIN races r ON r.id = t.race_id
         WHERE t.status IN ('interested', 'registered')
         AND r.registration_deadline IS NOT NULL
         AND r.registration_deadline >= ?
         AND r.registration_deadline <= date(?, '+30 days')`
        )
        .bind(now, now)
        .first<{ count: number }>(),
      db
        .prepare(
          `SELECT COUNT(*) as finishes,
                  COALESCE(SUM(r.distance_km), 0) as totalKm,
                  COALESCE(SUM(r.elevation_gain), 0) as totalElevation
           FROM tracking t
           JOIN races r ON r.id = t.race_id
           WHERE t.status = 'completed'`
        )
        .first<{ finishes: number; totalKm: number; totalElevation: number }>(),
    ])

  return c.json({
    totalRaces: totalRaces?.count ?? 0,
    trackedRaces: trackedRaces?.count ?? 0,
    upcomingRegistered: upcomingRegistered?.count ?? 0,
    upcomingDeadlines: upcomingDeadlines?.count ?? 0,
    completedFinishes: completedStats?.finishes ?? 0,
    completedKm: Math.round(completedStats?.totalKm ?? 0),
    completedElevation: Math.round(completedStats?.totalElevation ?? 0),
  })
})

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: AppEnv['Bindings'], ctx: ExecutionContext) {
    const hour = new Date(event.scheduledTime).getUTCHours()

    if (hour === 4) {
      // Daily Strava sync
      if (await isStravaConnected(env)) {
        ctx.waitUntil(
          syncStravaActivities(env)
            .then((n) => console.log(`Strava sync: ${n} activities`))
            .catch((e) => console.error('Strava sync failed', e))
        )
      }
    }

    if (hour === 7) {
      // Reminder cron - Phase 5
      console.log('Reminder cron triggered')
    }
  },
}
