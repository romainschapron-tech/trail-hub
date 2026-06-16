import { Hono } from 'hono'
import type { AppEnv } from '../index'

export const nutritionRoutes = new Hono<AppEnv>()

const DEFAULT_SHEET =
  'https://docs.google.com/spreadsheets/d/1UKcmnhSmCdE7iWZL7MwSv9-WpVGfGkkO/export?format=csv&gid=1553834770'

// Minimal CSV parser handling quoted fields and embedded commas.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (ch === '\r') { /* skip */ }
    else field += ch
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

// French-formatted number → number | null
function num(s: string | undefined): number | null {
  if (!s) return null
  const t = s.trim().replace(/\s/g, '').replace(',', '.')
  if (!t || !/^-?\d*\.?\d+$/.test(t)) return null
  const n = parseFloat(t)
  return isFinite(n) ? n : null
}

nutritionRoutes.get('/products', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT * FROM nutrition_products ORDER BY brand, name`
  ).all()
  return c.json(rows.results)
})

nutritionRoutes.delete('/products/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM nutrition_products WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// Import the whole library from a public Google Sheet (CSV export).
nutritionRoutes.post('/import', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const url: string = body.csvUrl || DEFAULT_SHEET
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return c.json({ ok: false, error: `Téléchargement échoué (${res.status}) — le sheet est-il public ?` }, 400)
  const csv = await res.text()
  const rows = parseCsv(csv)
  if (rows.length < 2) return c.json({ ok: false, error: 'CSV vide' }, 400)

  const stmt = c.env.DB.prepare(
    `INSERT INTO nutrition_products (ext_id, name, brand, type, weight_g, carbs_g, sugar_g, protein_g, fat_g, caffeine_mg, sodium_mg, price_eur)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(ext_id) DO UPDATE SET
       name=excluded.name, brand=excluded.brand, type=excluded.type, weight_g=excluded.weight_g,
       carbs_g=excluded.carbs_g, sugar_g=excluded.sugar_g, protein_g=excluded.protein_g, fat_g=excluded.fat_g,
       caffeine_mg=excluded.caffeine_mg, sodium_mg=excluded.sodium_mg, price_eur=excluded.price_eur`
  )
  const batch = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const extId = (r[0] || '').trim()
    const name = (r[3] || r[1] || '').trim()
    if (!extId || !name) continue
    batch.push(
      stmt.bind(
        extId, name, (r[1] || '').trim() || null, (r[2] || '').trim() || null,
        num(r[4]), num(r[5]), num(r[7]), num(r[9]), num(r[10]), num(r[11]), num(r[12]), num(r[16])
      )
    )
  }
  if (batch.length) await c.env.DB.batch(batch)
  return c.json({ ok: true, imported: batch.length })
})

// Extract a product from a URL using the Claude API.
nutritionRoutes.post('/products', async (c) => {
  const { url } = (await c.req.json().catch(() => ({}))) as { url?: string }
  if (!url) return c.json({ ok: false, error: 'URL manquante' }, 400)
  if (!c.env.ANTHROPIC_API_KEY) return c.json({ ok: false, error: 'Clé API Anthropic non configurée' }, 500)

  const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!pageRes.ok) return c.json({ ok: false, error: `Page inaccessible (${pageRes.status})` }, 400)
  const html = await pageRes.text()

  // og:image for the photo
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || null

  // Strip to text to keep the prompt small
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 9000)

  const prompt = `Voici le texte d'une page produit nutrition sportive. Extrais les infos au format JSON STRICT (pas de texte autour). Champs (null si absent) : {"name": string, "brand": string|null, "type": "Gel"|"Barre"|"Boisson"|"Purée"|"Gomme"|"Autre", "weight_g": number|null (poids d'une portion), "carbs_g": number|null (glucides par portion), "sugar_g": number|null, "protein_g": number|null, "fat_g": number|null, "caffeine_mg": number|null, "sodium_mg": number|null, "price_eur": number|null}. Texte:\n${text}`

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!aiRes.ok) return c.json({ ok: false, error: `Extraction IA échouée (${aiRes.status})` }, 502)
  const aiData = (await aiRes.json()) as { content?: { text?: string }[] }
  const raw = aiData.content?.[0]?.text || ''
  const jsonStr = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  let p: Record<string, unknown>
  try { p = JSON.parse(jsonStr) } catch { return c.json({ ok: false, error: 'Réponse IA illisible' }, 502) }
  if (!p.name) return c.json({ ok: false, error: 'Produit non reconnu sur cette page' }, 422)

  const row = await c.env.DB.prepare(
    `INSERT INTO nutrition_products (name, brand, type, weight_g, carbs_g, sugar_g, protein_g, fat_g, caffeine_mg, sodium_mg, price_eur, image_url, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  )
    .bind(
      p.name, p.brand ?? null, p.type ?? null, p.weight_g ?? null, p.carbs_g ?? null, p.sugar_g ?? null,
      p.protein_g ?? null, p.fat_g ?? null, p.caffeine_mg ?? null, p.sodium_mg ?? null, p.price_eur ?? null,
      ogImage, url
    )
    .first()
  return c.json({ ok: true, product: row })
})
