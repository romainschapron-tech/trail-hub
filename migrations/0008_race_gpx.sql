-- Saved GPX profile per race (downsampled elevation nodes + aid-station waypoints)
CREATE TABLE IF NOT EXISTS race_gpx (
  race_id INTEGER PRIMARY KEY REFERENCES races(id) ON DELETE CASCADE,
  profile_json TEXT NOT NULL,
  total_dist_m INTEGER,
  total_gain_m INTEGER,
  file_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
