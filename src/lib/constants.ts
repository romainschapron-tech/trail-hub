export const COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'CH', label: 'Suisse' },
  { code: 'AT', label: 'Autriche' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'PT', label: 'Portugal' },
  { code: 'BE', label: 'Belgique' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'GR', label: 'Grece' },
  { code: 'NO', label: 'Norvege' },
  { code: 'SE', label: 'Suede' },
  { code: 'AD', label: 'Andorre' },
] as const

export const RACE_FORMATS = [
  { value: 'trail', label: 'Trail' },
  { value: 'ultra', label: 'Ultra Trail' },
  { value: 'vertical', label: 'Kilometre Vertical' },
  { value: 'sky', label: 'Skyrunning' },
  { value: 'marathon', label: 'Trail Marathon' },
  { value: 'other', label: 'Autre' },
] as const

export const TRACKING_STATUSES = [
  { value: 'interested', label: 'Interesse', color: '#3b82f6' },
  { value: 'registered', label: 'Inscrit', color: '#22c55e' },
  { value: 'completed', label: 'Termine', color: '#a855f7' },
  { value: 'archived', label: 'Archive', color: '#6b7280' },
] as const

export const DISTANCE_RANGES = [
  { label: '< 20 km', min: 0, max: 20 },
  { label: '20-50 km', min: 20, max: 50 },
  { label: '50-80 km', min: 50, max: 80 },
  { label: '80-120 km', min: 80, max: 120 },
  { label: '120-170 km', min: 120, max: 170 },
  { label: '170+ km', min: 170, max: undefined },
] as const
