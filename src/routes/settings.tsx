import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface StravaStatus {
  connected: boolean
  athleteId: string | null
  lastSyncAt: string | null
  activityCount: number
}

export const Route = createFileRoute('/settings')({
  validateSearch: (s: Record<string, unknown>): { strava?: string } => ({
    strava: typeof s.strava === 'string' ? s.strava : undefined,
  }),
  component: SettingsPage,
})

function fmtDateTime(iso: string | null): string {
  if (!iso) return 'jamais'
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SettingsPage() {
  const { strava: stravaParam } = useSearch({ from: '/settings' })
  const [status, setStatus] = useState<StravaStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  async function handleImportEvents() {
    setImporting(true); setImportMsg(null)
    try {
      const r = await api.races.importEvents()
      setImportMsg(`${r.matched} courses du Nord importées (sur ${r.scanned} événements).`)
    } catch (e) {
      setImportMsg(`Erreur : ${(e as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  async function loadStatus() {
    const res = await fetch('/api/strava/status')
    setStatus(await res.json())
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      const data = (await res.json()) as { ok: boolean; synced?: number; error?: string }
      if (data.ok) {
        setSyncMsg(`${data.synced} activité(s) synchronisée(s)`)
        await loadStatus()
      } else {
        setSyncMsg(`Erreur : ${data.error}`)
      }
    } finally {
      setSyncing(false)
    }
  }

  const banner =
    stravaParam === 'connected'
      ? { text: 'Strava connecté ! Première synchro en cours…', cls: 'var(--primary)' }
      : stravaParam === 'denied'
      ? { text: 'Connexion Strava refusée.', cls: 'var(--danger)' }
      : stravaParam === 'error'
      ? { text: 'Erreur lors de la connexion Strava.', cls: 'var(--danger)' }
      : null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Parametres</h1>
      </div>

      {banner && (
        <div
          className="card"
          style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: `3px solid ${banner.cls}` }}
        >
          {banner.text}
        </div>
      )}

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#fc4c02' }}>●</span> Strava
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 0 }}>
          Synchronise automatiquement tes activités chaque jour.
        </p>

        {status === null ? (
          <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
        ) : status.connected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Connecté</strong>
              {status.athleteId && <span style={{ color: 'var(--text-muted)' }}> · athlète #{status.athleteId}</span>}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {status.activityCount.toLocaleString('fr-FR')} activités · dernière synchro : {fmtDateTime(status.lastSyncAt)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSync} disabled={syncing}>
                {syncing ? 'Synchro…' : 'Synchroniser maintenant'}
              </button>
              {syncMsg && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{syncMsg}</span>}
            </div>
          </div>
        ) : (
          <a
            href="/api/strava/auth"
            className="btn btn-sm"
            style={{ background: '#fc4c02', color: '#fff', display: 'inline-block', marginTop: '0.5rem' }}
          >
            Connecter Strava
          </a>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem', marginTop: '1.25rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Catalogue de courses</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 0 }}>
          Importe les trails &amp; courses à pied à venir dans le Nord / Hauts-de-France (source : 1000pattes).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={handleImportEvents} disabled={importing}>
            {importing ? 'Import…' : 'Importer les courses du Nord'}
          </button>
          {importMsg && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{importMsg}</span>}
        </div>
      </div>
    </div>
  )
}
