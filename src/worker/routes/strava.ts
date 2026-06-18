import { Hono } from 'hono'
import type { AppEnv } from '../index'
import {
  buildAuthorizeUrl,
  exchangeCode,
  getStravaStatus,
  syncStravaActivities,
} from '../strava'

export const stravaRoutes = new Hono<AppEnv>()

// Connection status + last sync info (consumed by the Settings page).
stravaRoutes.get('/status', async (c) => {
  return c.json(await getStravaStatus(c.env))
})

// Kick off the OAuth flow: redirect the browser to Strava's consent screen.
stravaRoutes.get('/auth', (c) => {
  if (!c.env.STRAVA_CLIENT_ID) {
    return c.json({ error: 'STRAVA_CLIENT_ID not configured' }, 500)
  }
  const redirectUri = new URL(c.req.url).origin + '/api/strava/callback'
  return c.redirect(buildAuthorizeUrl(c.env, redirectUri))
})

// OAuth redirect target: exchange the code, then bounce back to the Settings page.
stravaRoutes.get('/callback', async (c) => {
  const error = c.req.query('error')
  if (error) return c.redirect(`/settings?strava=denied`)
  const code = c.req.query('code')
  if (!code) return c.redirect(`/settings?strava=error`)
  try {
    await exchangeCode(c.env, code)
    // First sync runs in the background so the redirect is instant.
    c.executionCtx.waitUntil(syncStravaActivities(c.env).catch((e) => console.error('strava sync', e)))
    return c.redirect(`/settings?strava=connected`)
  } catch (e) {
    console.error('strava callback', e)
    return c.redirect(`/settings?strava=error`)
  }
})

// Manual "sync now" trigger.
stravaRoutes.post('/sync', async (c) => {
  try {
    const full = c.req.query('full') === '1'
    const count = await syncStravaActivities(c.env, full)
    return c.json({ ok: true, synced: count })
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500)
  }
})
