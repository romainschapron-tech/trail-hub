-- Nutrition product library (imported from a sheet or extracted from a URL)
CREATE TABLE IF NOT EXISTS nutrition_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  type TEXT,
  weight_g REAL,
  carbs_g REAL,
  sugar_g REAL,
  protein_g REAL,
  fat_g REAL,
  caffeine_mg REAL,
  sodium_mg REAL,
  price_eur REAL,
  image_url TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_ext ON nutrition_products(ext_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_type ON nutrition_products(type);
