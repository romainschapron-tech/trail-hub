-- Reminder rules
CREATE TABLE reminder_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger_type TEXT NOT NULL DEFAULT 'registration_deadline',
  days_before INTEGER NOT NULL DEFAULT 7,
  applies_to_statuses TEXT NOT NULL DEFAULT 'interested,registered',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sent reminders log (dedup: one reminder per rule per race)
CREATE TABLE reminder_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL REFERENCES reminder_rules(id),
  race_id INTEGER NOT NULL REFERENCES races(id),
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  email_to TEXT NOT NULL,
  subject TEXT,
  UNIQUE(rule_id, race_id)
);

-- App settings (key-value)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO app_settings (key, value) VALUES
  ('notification_email', ''),
  ('scrape_enabled', '1'),
  ('scrape_sources', 'itra,calendrier,ahotu'),
  ('default_country_filter', '');
