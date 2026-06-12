CREATE TABLE IF NOT EXISTS strava_activities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  distance_m INTEGER,
  moving_time_s INTEGER,
  elapsed_time_s INTEGER,
  elevation_gain INTEGER,
  avg_speed REAL,
  max_speed REAL,
  relative_effort INTEGER,
  calories INTEGER,
  avg_cadence REAL,
  kudos_count INTEGER DEFAULT 0,
  pr_count INTEGER DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  gear_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_strava_activities_date ON strava_activities(start_date);
CREATE INDEX IF NOT EXISTS idx_strava_activities_sport ON strava_activities(sport_type);
