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

function ProductCard({ p, onDelete }: { p: NutritionProduct; onDelete: (id: number) => void }) {
  const c = typeColor(p.type)
  return (
    <div className="card" style={{ padding: '0.9rem', display: 'flex', gap: '0.8rem', alignItems: 'center', position: 'relative' }}>
      <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: `color-mix(in srgb, ${c} 16%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {p.image_url
          ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: c, fontWeight: 700, fontSize: '0.7rem' }}>{(p.type || '?').slice(0, 3)}</span>}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.brand} · {p.type}</div>
        <div style={{ fontSize: '0.74rem', marginTop: '0.3rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
          {p.carbs_g != null && <span><strong style={{ color: 'var(--primary)' }}>{p.carbs_g}</strong> g gluc.</span>}
          {p.sodium_mg != null && <span style={{ color: 'var(--text-muted)' }}>{p.sodium_mg} mg Na</span>}
          {p.caffeine_mg ? <span style={{ color: 'var(--text-muted)' }}>{p.caffeine_mg} mg caféine</span> : null}
        </div>
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

  const [photoBusy, setPhotoBusy] = useState(false)
  async function fetchPhotos() {
    setPhotoBusy(true); setMsg(null)
    try {
      for (let i = 0; i < 60; i++) {
        const r = await api.nutrition.fetchPhotos()
        setMsg(`Photos : ${r.remaining} produits restants à chercher…`)
        load()
        if (r.remaining === 0 || r.processed === 0) break
      }
      setMsg('Recherche de photos terminée ✅')
    } catch (e) {
      setMsg(`Échec : ${(e as Error).message}`)
    } finally { setPhotoBusy(false) }
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
          <button className="btn btn-ghost" onClick={fetchPhotos} disabled={photoBusy} title="Cherche les photos via Open Food Facts (best-effort)">
            {photoBusy ? 'Recherche photos…' : 'Récupérer les photos'}
          </button>
        </div>
        {msg && <div style={{ fontSize: '0.8rem', marginTop: '0.6rem', color: msg.includes('✅') ? '#22c55e' : 'var(--danger)' }}>{msg}</div>}
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
          {filtered.slice(0, 120).map((p) => <ProductCard key={p.id} p={p} onDelete={remove} />)}
        </div>
      )}
      {filtered.length > 120 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Affichage limité à 120 — affine la recherche.</p>}
    </div>
  )
}
