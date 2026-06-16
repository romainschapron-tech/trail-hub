import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@/lib/api'
import type { Race } from '@/lib/types'
import { COUNTRIES, RACE_FORMATS } from '@/lib/constants'

export const Route = createFileRoute('/races_/new')({
  component: NewRacePage,
})

function NewRacePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    race_date: '',
    city: '',
    country: 'FR',
    region: '',
    distance_km: '',
    elevation_gain: '',
    elevation_loss: '',
    race_format: 'trail',
    registration_deadline: '',
    registration_url: '',
    registration_status: 'unknown',
    price_eur: '',
    max_participants: '',
    website_url: '',
    itra_id: '',
    itra_points: '',
  })

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return

    setSaving(true)
    try {
      const data = {
        ...form,
        distance_km: form.distance_km ? Number(form.distance_km) : null,
        elevation_gain: form.elevation_gain ? Number(form.elevation_gain) : null,
        elevation_loss: form.elevation_loss ? Number(form.elevation_loss) : null,
        price_eur: form.price_eur ? Number(form.price_eur) : null,
        max_participants: form.max_participants ? Number(form.max_participants) : null,
        itra_points: form.itra_points ? Number(form.itra_points) : null,
      }
      const race = await api.races.create(data as Partial<Race>)
      navigate({ to: '/races/$raceId', params: { raceId: String(race.id) } })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ajouter une course</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '800px' }}>
        <div className="form-group">
          <label className="form-label">Nom de la course *</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: UTMB, Trail des Templiers..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.race_date} onChange={(e) => update('race_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Format</label>
            <select className="form-select" value={form.race_format} onChange={(e) => update('race_format', e.target.value)}>
              {RACE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ville</label>
            <input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Chamonix" />
          </div>
          <div className="form-group">
            <label className="form-label">Pays</label>
            <select className="form-select" value={form.country} onChange={(e) => update('country', e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Région</label>
            <input className="form-input" value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="Haute-Savoie" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Distance (km)</label>
            <input className="form-input" type="number" step="0.1" value={form.distance_km} onChange={(e) => update('distance_km', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">D+ (m)</label>
            <input className="form-input" type="number" value={form.elevation_gain} onChange={(e) => update('elevation_gain', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">D- (m)</label>
            <input className="form-input" type="number" value={form.elevation_loss} onChange={(e) => update('elevation_loss', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Deadline inscription</label>
            <input className="form-input" type="date" value={form.registration_deadline} onChange={(e) => update('registration_deadline', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">URL inscription</label>
            <input className="form-input" type="url" value={form.registration_url} onChange={(e) => update('registration_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prix (€)</label>
            <input className="form-input" type="number" step="0.01" value={form.price_eur} onChange={(e) => update('price_eur', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Places max</label>
            <input className="form-input" type="number" value={form.max_participants} onChange={(e) => update('max_participants', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Site officiel</label>
            <input className="form-input" type="url" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">ID ITRA</label>
            <input className="form-input" value={form.itra_id} onChange={(e) => update('itra_id', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Points ITRA</label>
            <input className="form-input" type="number" value={form.itra_points} onChange={(e) => update('itra_points', e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving || !form.name}>
            {saving ? 'Enregistrement...' : 'Enregistrer la course'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate({ to: '/races' })}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
