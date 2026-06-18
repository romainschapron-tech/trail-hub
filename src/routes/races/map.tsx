import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import { api } from '@/lib/api'
import type { RaceWithTracking } from '@/lib/types'

export const Route = createFileRoute('/races/map')({
  component: MapView,
})

const STATUS_COLOR: Record<string, string> = {
  interested: '#3b82f6', registered: '#22c55e', completed: '#a855f7', archived: '#64748b',
}

function MapView() {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [races, setRaces] = useState<RaceWithTracking[]>([])
  const [geocoding, setGeocoding] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  function load() {
    api.races.list({ limit: 500 }).then((r) => setRaces(r.data))
  }
  useEffect(load, [])

  // init map once
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    const map = L.map(mapEl.current, { scrollWheelZoom: true }).setView([46.6, 2.5], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
  }, [])

  // (re)draw markers when races change
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    const withCoords = races.filter((r) => r.latitude != null && r.longitude != null)
    const bounds: [number, number][] = []
    for (const r of withCoords) {
      const color = STATUS_COLOR[r.tracking_status || ''] || '#64748b'
      const marker = L.circleMarker([r.latitude!, r.longitude!], {
        radius: 7, color, fillColor: color, fillOpacity: 0.85, weight: 2,
      })
      const date = r.race_date ? new Date(r.race_date).toLocaleDateString('fr-FR') : ''
      marker.bindPopup(
        `<strong>${r.name}</strong><br/>${r.city || ''}${date ? ' · ' + date : ''}<br/><a href="/races/${r.id}">Voir la course →</a>`
      )
      marker.addTo(layer)
      bounds.push([r.latitude!, r.longitude!])
    }
    if (bounds.length && mapRef.current) mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 })
  }, [races])

  async function geocodeAll() {
    setGeocoding(true)
    try {
      for (let i = 0; i < 30; i++) {
        const r = await api.races.geocode()
        setProgress(`${r.remaining} course(s) restante(s) à localiser…`)
        load()
        if (r.remaining === 0 || r.processed === 0) break
      }
      setProgress('Localisation terminée ✅')
    } catch (e) {
      setProgress(`Erreur : ${(e as Error).message}`)
    } finally {
      setGeocoding(false)
    }
  }

  const located = races.filter((r) => r.latitude != null).length
  const missing = races.filter((r) => r.latitude == null && r.city).length

  return (
    <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {located} course(s) localisée(s){missing > 0 ? ` · ${missing} sans coordonnées` : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {progress && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{progress}</span>}
          {missing > 0 && (
            <button className="btn btn-primary btn-sm" onClick={geocodeAll} disabled={geocoding}>
              {geocoding ? 'Localisation…' : 'Localiser les courses'}
            </button>
          )}
        </div>
      </div>
      <div ref={mapEl} style={{ height: 560, width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }} />
    </div>
  )
}
