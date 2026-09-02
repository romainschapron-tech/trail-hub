import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import type { NutritionProduct } from '@/lib/types'

export const Route = createFileRoute('/nutrition')({
  component: NutritionLibraryPage,
})

const TYPE_COLORS: Record<string, string> = {
  Gel: '#3b82f6', Barre: '#f59e0b', Boisson: '#22c55e', Purée: '#a855f7', Gomme: '#ec4899',
}
function typeColor(t: string | null) {
  return (t && TYPE_COLORS[t]) || '#64748b'
}

function ProductCard({ p, onDelete, onPhoto }: { p: NutritionProduct; onDelete: (id: number) => void; onPhoto: (id: number, url: string) => void }) {
  const c = typeColor(p.type)
  const monogram = (p.brand || p.name || '?').trim().slice(0, 2).toUpperCase()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(p.image_url || '')

  function save() {
    onPhoto(p.id, draft.trim())
    setEditing(false)
  }

  return (
    <div className="card" style={{ padding: '0.9rem', display: 'flex', gap: '0.8rem', alignItems: 'center', position: 'relative', borderLeft: `3px solid ${c}` }}>
      <button
        onClick={() => { setDraft(p.image_url || ''); setEditing((v) => !v) }}
        title={p.image_url ? 'Modifier la photo' : 'Ajouter une photo (coller une URL)'}
        style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, padding: 0, cursor: 'pointer', background: `color-mix(in srgb, ${c} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 35%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
      >
        {p.image_url
          ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: c, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>{monogram}</span>}
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
          {p.type && <span style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: c, background: `color-mix(in srgb, ${c} 15%, transparent)`, padding: '0.05rem 0.4rem', borderRadius: 4 }}>{p.type}</span>}
          {p.brand && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.brand}</span>}
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
            <input
              className="form-input" autoFocus
              style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
              placeholder="Coller une URL d'image…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            />
            <button className="btn btn-primary btn-sm" onClick={save}>OK</button>
          </div>
        ) : (
          <div style={{ fontSize: '0.74rem', marginTop: '0.35rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            {p.carbs_g != null && <span><strong className="num" style={{ color: 'var(--primary)' }}>{p.carbs_g}</strong> g gluc.</span>}
            {p.sodium_mg != null && <span className="num" style={{ color: 'var(--text-muted)' }}>{p.sodium_mg} mg Na</span>}
            {p.caffeine_mg ? <span className="num" style={{ color: 'var(--effort)' }}>{p.caffeine_mg} mg caféine</span> : null}
          </div>
        )}
      </div>
      <button onClick={() => onDelete(p.id)} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} aria-label="Supprimer">✕</button>
    </div>
  )
}

function NutritionLibraryPage() {
  const [products, setProducts] = useState<NutritionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function load() {
    api.nutrition.list().then((p) => { setProducts(p); setLoading(false) })
  }
  useEffect(load, [])

  const types = useMemo(() => Array.from(new Set(products.map((p) => p.type).filter(Boolean))) as string[], [products])
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) =>
      (!typeFilter || p.type === typeFilter) &&
      (!q || `${p.name} ${p.brand}`.toLowerCase().includes(q))
    )
  }, [products, search, typeFilter])

  async function addUrl() {
    if (!url.trim()) return
    setBusy(true); setMsg(null)
    try {
      const r = await api.nutrition.addByUrl(url.trim())
      if (r.ok && r.product) { setProducts((a) => [r.product!, ...a]); setUrl(''); setMsg('Produit ajouté ✅') }
      else setMsg(`Échec : ${r.error}`)
    } catch (e) { setMsg(`Échec : ${(e as Error).message}`) }
    finally { setBusy(false) }
  }

  async function importSheet() {
    setBusy(true); setMsg(null)
    try {
      const r = await api.nutrition.importSheet()
      setMsg(r.ok ? `${r.imported} produits importés ✅` : `Échec : ${r.error}`)
      load()
    } finally { setBusy(false) }
  }

  async function remove(id: number) {
    setProducts((a) => a.filter((p) => p.id !== id))
    await api.nutrition.remove(id)
  }

  async function setPhoto(id: number, url: string) {
    setProducts((a) => a.map((p) => (p.id === id ? { ...p, image_url: url || null } : p)))
    try {
      const r = await api.nutrition.setPhoto(id, url)
      if (!r.ok) setMsg(`Photo : ${r.error}`)
    } catch (e) { setMsg(`Photo : ${(e as Error).message}`) }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Nutrition</h1></div>

      {/* Add by URL */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.6rem' }}>Ajouter un produit par URL</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            className="form-input" style={{ flex: 1, minWidth: 260 }}
            placeholder="https://… (page produit d'un gel, barre, boisson)"
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          />
          <button className="btn btn-primary" onClick={addUrl} disabled={busy || !url.trim()}>
            {busy ? 'Analyse…' : 'Analyser'}
          </button>
          <button className="btn btn-ghost" onClick={importSheet} disabled={busy} title="Recharger depuis le Google Sheet">
            Importer ma base
          </button>
        </div>
        {msg && <div style={{ fontSize: '0.8rem', marginTop: '0.6rem', color: msg.includes('✅') ? 'var(--success)' : 'var(--danger)' }}>{msg}</div>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input className="form-input" style={{ width: 220 }} placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter('')}>Tous</button>
        {types.map((t) => (
          <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} produits</span>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {filtered.slice(0, 120).map((p) => <ProductCard key={p.id} p={p} onDelete={remove} onPhoto={setPhoto} />)}
        </div>
      )}
      {filtered.length > 120 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Affichage limité à 120 — affine la recherche.</p>}
    </div>
  )
}
