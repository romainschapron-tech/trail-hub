export interface Race {
  id: number
  name: string
  slug: string
  race_date: string | null
  race_end_date: string | null
  city: string | null
  country: string
  region: string | null
  latitude: number | null
  longitude: number | null
  distance_km: number | null
  elevation_gain: number | null
  elevation_loss: number | null
  race_format: RaceFormat
  registration_opens: string | null
  registration_deadline: string | null
  registration_url: string | null
  registration_status: RegistrationStatus
  price_eur: number | null
  max_participants: number | null
  website_url: string | null
  itra_id: string | null
  itra_points: number | null
  source: 'manual' | 'scraped'
  source_url: string | null
  last_scraped_at: string | null
  created_at: string
  updated_at: string
}

export interface Tracking {
  id: number
  race_id: number
  status: TrackingStatus
  notes: string | null
  training_readiness: string | null
  bib_number: string | null
  finish_time: string | null
  finish_position: number | null
  created_at: string
  updated_at: string
}

export interface RaceWithTracking extends Race {
  tracking_status: TrackingStatus | null
  tracking_notes: string | null
  tracking_readiness: string | null
  finish_time: string | null
  finish_position: number | null
}

export type RaceFormat = 'trail' | 'ultra' | 'vertical' | 'sky' | 'marathon' | 'other'
export type TrackingStatus = 'interested' | 'registered' | 'completed' | 'archived'
export type RegistrationStatus = 'unknown' | 'open' | 'closed' | 'full' | 'upcoming'

export interface RaceFilters {
  search?: string
  country?: string
  distanceMin?: number
  distanceMax?: number
  elevationMin?: number
  elevationMax?: number
  dateFrom?: string
  dateTo?: string
  format?: RaceFormat
  trackingStatus?: TrackingStatus
  registrationStatus?: RegistrationStatus
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface DashboardStats {
  totalRaces: number
  trackedRaces: number
  upcomingRegistered: number
  upcomingDeadlines: number
  completedFinishes: number
  completedKm: number
  completedElevation: number
}

export interface YearlyStats {
  year: string
  race_count: number
  total_km: number
  total_elevation: number | null
  best_position: number | null
  top10_count: number
}

export interface ReminderRule {
  id: number
  trigger_type: string
  days_before: number
  applies_to_statuses: string
  enabled: number
  created_at: string
}

export interface StravaWeekly {
  week: string
  km: number
  elevation: number
  count: number
  sports: string
}

export interface StravaMonthly {
  month: string
  km: number
  elevation: number
  count: number
  run_km: number
  trail_km: number
}

export interface StravaSport {
  sport_type: string
  count: number
  km: number
  elevation: number
  hours: number
}

export interface StravaLoad {
  acuteKm: number
  acuteElevation: number
  acuteEffort: number
  chronicKm: number
  chronicElevation: number
  chronicEffort: number
  ratio: number | null
  ratioEffort: number | null
  streakWeeks: number
  bestWeek: { week: string; km: number } | null
  bestMonth: { month: string; km: number } | null
}

export interface NutritionProduct {
  id: number
  ext_id: string | null
  name: string
  brand: string | null
  type: string | null
  weight_g: number | null
  carbs_g: number | null
  sugar_g: number | null
  protein_g: number | null
  fat_g: number | null
  caffeine_mg: number | null
  sodium_mg: number | null
  price_eur: number | null
  image_url: string | null
  source_url: string | null
}

export interface StravaHr {
  total: number
  zones: { label: string; min: number; max: number | null; count: number }[]
  trend: { month: string; avg_hr: number }[]
}

export interface StravaForm {
  current: { ctl: number; atl: number; tsb: number } | null
  series: { date: string; ctl: number; atl: number; tsb: number }[]
}

export interface StravaPaceZones {
  total: number
  zones: { label: string; name: string; fast: number; slow: number; count: number; avgHr: number | null }[]
}

export interface StravaFitness {
  vo2max: number | null
  bestRace: { name: string; date: string; vdot: number } | null
  paceZones: { label: string; min: number; max: number | null; paceSec: number | null; count: number }[]
}

export interface StravaYearly {
  year: string
  grp: string
  activities: number
  km: number
  elevation: number
  hours: number
}

export interface StravaRecords {
  longest: { name: string; date: string; km: number; elevation: number } | null
  climb: { name: string; date: string; elevation: number; km: number } | null
  longestTime: { name: string; date: string; timeSec: number; km: number } | null
  effort: { name: string; date: string; value: number; km: number } | null
  paceRecords: { key: string; distM: number; timeSec: number | null; paceSec: number | null; name: string | null; date: string | null; actualKm: number | null }[]
}

export interface StravaElevation {
  month: string
  elevation: number
  km: number
  ratio_dplus_per_km: number
}

export interface StravaOverview {
  year: string
  activities: number
  km: number
  runKm: number
  elevation: number
  hours: number
  allTime: {
    activities: number
    km: number
    elevation: number
    hours: number
  }
  longestRun: { name: string; km: number; elevation: number; start_date: string } | null
}

export interface ScrapeLog {
  id: number
  source: string
  started_at: string
  finished_at: string | null
  races_found: number
  races_created: number
  races_updated: number
  races_skipped: number
  status: string
  error_message: string | null
  duration_ms: number | null
}
