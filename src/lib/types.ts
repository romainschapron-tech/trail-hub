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
  chronicKm: number
  chronicElevation: number
  ratio: number | null
  streakWeeks: number
  bestWeek: { week: string; km: number } | null
  bestMonth: { month: string; km: number } | null
}

export interface StravaElevation {
  month: string
  elevation: number
  km: number
  ratio_dplus_per_km: number
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
