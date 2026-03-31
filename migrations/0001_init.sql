-- Race catalogue
CREATE TABLE races (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  race_date TEXT,
  race_end_date TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'FR',
  region TEXT,
  latitude REAL,
  longitude REAL,
  distance_km REAL,
  elevation_gain INTEGER,
  elevation_loss INTEGER,
  race_format TEXT NOT NULL DEFAULT 'trail',
  registration_opens TEXT,
  registration_deadline TEXT,
  registration_url TEXT,
  registration_status TEXT DEFAULT 'unknown',
  price_eur REAL,
  max_participants INTEGER,
  website_url TEXT,
  itra_id TEXT,
  itra_points INTEGER,
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  last_scraped_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_races_date ON races(race_date);
CREATE INDEX idx_races_country ON races(country);
CREATE INDEX idx_races_format ON races(race_format);
CREATE INDEX idx_races_distance ON races(distance_km);
CREATE INDEX idx_races_slug ON races(slug);

-- Personal tracking
CREATE TABLE tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested',
  notes TEXT,
  training_readiness TEXT,
  bib_number TEXT,
  finish_time TEXT,
  finish_position INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(race_id)
);

CREATE INDEX idx_tracking_status ON tracking(status);

-- Scrape audit log
CREATE TABLE scrape_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  races_found INTEGER DEFAULT 0,
  races_created INTEGER DEFAULT 0,
  races_updated INTEGER DEFAULT 0,
  races_skipped INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  duration_ms INTEGER
);
