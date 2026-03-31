export function formatDistance(km: number | null): string {
  if (km === null) return '-'
  return km >= 100 ? `${Math.round(km)} km` : `${km} km`
}

export function formatElevation(m: number | null): string {
  if (m === null) return '-'
  return `${m.toLocaleString('fr-FR')} D+`
}

export function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatCountry(code: string): string {
  const flags: Record<string, string> = {
    FR: 'FR', ES: 'ES', IT: 'IT', CH: 'CH', AT: 'AT', DE: 'DE',
    GB: 'GB', PT: 'PT', BE: 'BE', NL: 'NL', GR: 'GR', NO: 'NO', SE: 'SE', AD: 'AD',
  }
  return flags[code] || code
}
