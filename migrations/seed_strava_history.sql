-- Romain Chapron's past race results (mined from full Strava history 2019-2025)
-- Run locally:  wrangler d1 execute trail-hub-db --local --file migrations/seed_strava_history.sql
-- Run remotely: wrangler d1 execute trail-hub-db --remote --file migrations/seed_strava_history.sql

INSERT OR IGNORE INTO races (name, slug, race_date, city, country, distance_km, elevation_gain, race_format, source) VALUES
  -- 2019
  ('Vietnam Mountain Marathon 21km 2019', 'vietnam-mountain-marathon-21km-2019', '2019-09-22', 'Sapa', 'VN', 20.2, 678, 'trail', 'strava'),
  ('Ultimate Trail of Penang 2019',       'ultimate-trail-penang-2019',          '2019-10-13', 'Penang', 'MY', 22.7, 972, 'trail', 'strava'),
  ('Half Marathon de Chiang Mai 2019',    'half-marathon-chiang-mai-2019',       '2019-12-22', 'Chiang Mai', 'TH', 21, 29, 'road', 'strava'),

  -- 2020
  ('Peninsula Cap Half Marathon 2020',    'peninsula-cap-half-marathon-2020',    '2020-02-16', 'Cape Town', 'ZA', 21.2, 14, 'road', 'strava'),

  -- 2021
  ('Trail Nocturne des Lacs 2021',        'trail-nocturne-des-lacs-2021',        '2021-12-10', 'Lille', 'FR', 15.5, 21, 'trail', 'strava'),
  ('Trail Extrême Lillois 2021',          'trail-extreme-lillois-2021',          '2021-12-19', 'Lille', 'FR', 14.9, 7, 'trail', 'strava'),

  -- 2023
  ('Mon Jam Trail 2023',                  'mon-jam-trail-2023',                  '2023-02-19', 'Chiang Mai', 'TH', 12.8, 478, 'trail', 'strava'),
  ('Bergen City Half Marathon 2023',      'bergen-city-half-marathon-2023',      '2023-04-29', 'Bergen', 'NO', 21.4, 271, 'road', 'strava'),
  ('Trail des 3 Monts 2023',             'trail-des-3-monts-2023',              '2023-08-05', 'Nord', 'FR', 20.2, 447, 'trail', 'strava'),

  -- 2024
  ('Semi-Marathon de Lille 2024',         'semi-marathon-lille-2024',            '2024-03-17', 'Lille', 'FR', 21.4, 43, 'road', 'strava'),
  ('Trail Extrême Lillois 2024',          'trail-extreme-lillois-2024',          '2024-03-24', 'Lille', 'FR', 14.9, 108, 'trail', 'strava'),
  ('Trail du Pipi Malot 2024',            'trail-pipi-malot-2024',               '2024-10-20', 'Orchies', 'FR', 14, 77, 'trail', 'strava'),
  ('Foulées Lambersartoises 10km 2024',   'foulees-lambersartoises-2024',        '2024-09-22', 'Lambersart', 'FR', 10, 3, 'road', 'strava'),
  ('Marathon de la Bière de Bergues 2024','marathon-biere-bergues-2024',         '2024-09-29', 'Bergues', 'FR', 42, 100, 'road', 'strava'),

  -- 2025
  ('Ultra Trail de la Rosière 2025',      'ultra-trail-rosiere-2025',            '2025-01-13', 'La Rosière', 'FR', 2.9, 200, 'sky', 'strava'),
  ('Trail de Vauban 2025',               'trail-de-vauban-2025',                '2025-01-18', 'Vauban', 'FR', 16.3, 131, 'trail', 'strava'),
  ('Trail de Val Joly 2025',             'trail-de-val-joly-2025',              '2025-03-02', 'Val Joly', 'FR', 32.9, 669, 'trail', 'strava'),
  ('Marathon de Rome 2025',              'marathon-de-rome-2025',               '2025-03-16', 'Rome', 'IT', 42.2, 93, 'road', 'strava');

-- Tracking entries with finish times and positions
INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:23:00', NULL FROM races WHERE slug = 'vietnam-mountain-marathon-21km-2019';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:00:00', NULL FROM races WHERE slug = 'ultimate-trail-penang-2019';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:27:22', 20 FROM races WHERE slug = 'half-marathon-chiang-mai-2019';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:25:21', NULL FROM races WHERE slug = 'peninsula-cap-half-marathon-2020';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:13:54', 42 FROM races WHERE slug = 'trail-nocturne-des-lacs-2021';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:10:12', 19 FROM races WHERE slug = 'trail-extreme-lillois-2021';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:01:09', 6 FROM races WHERE slug = 'mon-jam-trail-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:22:53', 90 FROM races WHERE slug = 'bergen-city-half-marathon-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:35:33', NULL FROM races WHERE slug = 'trail-des-3-monts-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:18:58', 307 FROM races WHERE slug = 'semi-marathon-lille-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:03:10', 3 FROM races WHERE slug = 'trail-extreme-lillois-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '00:54:55', 5 FROM races WHERE slug = 'trail-pipi-malot-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '00:37:19', NULL FROM races WHERE slug = 'foulees-lambersartoises-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '03:40:31', NULL FROM races WHERE slug = 'marathon-biere-bergues-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', NULL, 1 FROM races WHERE slug = 'ultra-trail-rosiere-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:13:05', 6 FROM races WHERE slug = 'trail-de-vauban-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:37:02', NULL FROM races WHERE slug = 'trail-de-val-joly-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:59:39', NULL FROM races WHERE slug = 'marathon-de-rome-2025';
