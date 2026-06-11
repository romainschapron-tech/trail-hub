-- Romain Chapron's past race results (imported from UTMB World)
-- Run: wrangler d1 execute trail-hub-db --local --file migrations/seed_my_results.sql
-- For remote: wrangler d1 execute trail-hub-db --remote --file migrations/seed_my_results.sql

INSERT OR IGNORE INTO races (name, slug, race_date, city, country, distance_km, elevation_gain, race_format, source) VALUES
  ('Elephant 100 - Chiangmai 2025', 'elephant-100-chiangmai-2025', '2025-12-05', 'Chiang Mai', 'TH', 96, 4600, 'ultra', 'manual'),
  ('Trail de Bruxelles 25km 2025', 'trail-de-bruxelles-25km-2025', '2025-10-19', 'Bruxelles', 'BE', 25, 460, 'trail', 'manual'),
  ('CCC HOKA UTMB Mont-Blanc 2025', 'ccc-utmb-mont-blanc-2025', '2025-08-29', 'Chamonix', 'FR', 101, 6050, 'ultra', 'manual'),
  ('Grand Raid Ventoux 100M 2025', 'grand-raid-ventoux-100m-2025', '2025-04-25', 'Ventoux', 'FR', 124, 6500, 'ultra', 'manual'),
  ('Trail Sainte Victoire Les Crêtes 2025', 'trail-sainte-victoire-cretes-2025', '2025-04-06', 'Aix-en-Provence', 'FR', 60, 3000, 'trail', 'manual'),
  ('Malaysia Ultra-Trail MY50 2024', 'malaysia-ultra-trail-my50-2024', '2024-11-16', 'Malaysia', 'MY', 51, 2801, 'trail', 'manual'),
  ('Trail Côte d''Opale 27km 2024', 'trail-cote-opale-27km-2024', '2024-09-08', 'Côte d''Opale', 'FR', 26.7, 280, 'trail', 'manual'),
  ('Maratrail 50K Trail du Saint-Jacques 2024', 'maratrail-50k-saint-jacques-2024', '2024-06-16', 'Saint-Jacques', 'FR', 51, 2000, 'trail', 'manual'),
  ('Les Chibottes 20K Trail du Saint-Jacques 2024', 'chibottes-20k-saint-jacques-2024', '2024-06-15', 'Saint-Jacques', 'FR', 17.7, 534, 'trail', 'manual'),
  ('Ultra-Trail des Païens Trail Alsace 2024', 'ultra-trail-paiens-alsace-2024', '2024-05-16', 'Alsace', 'FR', 114.3, 4196, 'ultra', 'manual'),
  ('Nord Trail Monts de Flandres 59km 2024', 'nord-trail-monts-flandres-59km-2024', '2024-04-21', 'Flandres', 'FR', 55, 1089, 'trail', 'manual'),
  ('Hmong 50 Doi Inthanon 2023', 'hmong-50-doi-inthanon-2023', '2023-12-09', 'Doi Inthanon', 'TH', 50, 2870, 'trail', 'manual'),
  ('L''Ultra by HuyForTrail 2023', 'ultra-huyfortrail-2023', '2023-10-08', 'Huy', 'BE', 67, 1576, 'ultra', 'manual'),
  ('Arctic Triple Lofoten 50 Miles 2023', 'arctic-triple-lofoten-50-miles-2023', '2023-06-03', 'Lofoten', 'NO', 88.2, 3230, 'ultra', 'manual'),
  ('Sandnes Ultratrail 19km 2023', 'sandnes-ultratrail-19km-2023', '2023-04-22', 'Sandnes', 'NO', 22, 1400, 'trail', 'manual'),
  ('Terrace20 Doi Inthanon 2022', 'terrace20-doi-inthanon-2022', '2022-12-11', 'Doi Inthanon', 'TH', 23.9, 1070, 'trail', 'manual'),
  ('Pong Yaeng Trail PNK 2022', 'pong-yaeng-trail-pnk-2022', '2022-11-12', 'Chiang Mai', 'TH', 20, 1460, 'trail', 'manual'),
  ('Vietnam Jungle Marathon Ultra 70km 2022', 'vietnam-jungle-marathon-ultra-70km-2022', '2022-10-15', 'Vietnam', 'VN', 63.8, 2790, 'ultra', 'manual'),
  ('MUSER 65 DAY 2022', 'muser-65-day-2022', '2022-09-24', 'Chiang Mai', 'TH', 67, 2550, 'ultra', 'manual'),
  ('Ultra-Trail Chiangmai 33km 2022', 'ultra-trail-chiangmai-33km-2022', '2022-08-28', 'Chiang Mai', 'TH', 32.9, 1460, 'trail', 'manual'),
  ('CM1 CM6 20km 2022', 'cm1-cm6-20km-2022', '2022-08-06', 'Chiang Mai', 'TH', 20, 1160, 'trail', 'manual'),
  ('Koh Tao Mountain Trail KTMT40 2022', 'koh-tao-mountain-trail-ktmt40-2022', '2022-05-14', 'Koh Tao', 'TH', 42, 2400, 'trail', 'manual'),
  ('Addo Elephant Trail Run 76km 2020', 'addo-elephant-trail-run-76km-2020', '2020-03-14', 'Addo', 'ZA', 76.7, 2630, 'ultra', 'manual'),
  ('Formosa Trail 40km 2019', 'formosa-trail-40km-2019', '2019-11-30', 'Taiwan', 'TW', 38.7, 2340, 'trail', 'manual'),
  ('Ultra-Trail Chiangmai 33km 2019', 'ultra-trail-chiangmai-33km-2019', '2019-09-01', 'Chiang Mai', 'TH', 32, 940, 'trail', 'manual'),
  ('CM1 CM6 20km 2019', 'cm1-cm6-20km-2019', '2019-08-04', 'Chiang Mai', 'TH', 19.9, 1130, 'trail', 'manual'),
  ('Salomon Gore-Tex MaXi-Race Short 2019', 'salomon-gore-tex-maxi-race-short-2019', '2019-05-24', 'Annecy', 'FR', 16, 968, 'trail', 'manual');

-- Insert tracking entries with finish times and positions
INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '13:42:30', 48 FROM races WHERE slug = 'elephant-100-chiangmai-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:43:36', 3 FROM races WHERE slug = 'trail-de-bruxelles-25km-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '15:58:24', 237 FROM races WHERE slug = 'ccc-utmb-mont-blanc-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '19:25:41', 82 FROM races WHERE slug = 'grand-raid-ventoux-100m-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '10:09:22', 148 FROM races WHERE slug = 'trail-sainte-victoire-cretes-2025';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '08:58:41', 33 FROM races WHERE slug = 'malaysia-ultra-trail-my50-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:59:22', 13 FROM races WHERE slug = 'trail-cote-opale-27km-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '05:47:21', 132 FROM races WHERE slug = 'maratrail-50k-saint-jacques-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:23:30', 716 FROM races WHERE slug = 'chibottes-20k-saint-jacques-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '16:08:26', 177 FROM races WHERE slug = 'ultra-trail-paiens-alsace-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '05:54:02', 71 FROM races WHERE slug = 'nord-trail-monts-flandres-59km-2024';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '06:10:06', 35 FROM races WHERE slug = 'hmong-50-doi-inthanon-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '06:39:24', 10 FROM races WHERE slug = 'ultra-huyfortrail-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '13:50:06', 8 FROM races WHERE slug = 'arctic-triple-lofoten-50-miles-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '03:09:34', 14 FROM races WHERE slug = 'sandnes-ultratrail-19km-2023';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:14:34', 4 FROM races WHERE slug = 'terrace20-doi-inthanon-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '01:47:52', 4 FROM races WHERE slug = 'pong-yaeng-trail-pnk-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '09:55:44', 8 FROM races WHERE slug = 'vietnam-jungle-marathon-ultra-70km-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '09:42:28', 5 FROM races WHERE slug = 'muser-65-day-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '03:24:49', 2 FROM races WHERE slug = 'ultra-trail-chiangmai-33km-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:13:24', 6 FROM races WHERE slug = 'cm1-cm6-20km-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '07:41:31', 5 FROM races WHERE slug = 'koh-tao-mountain-trail-ktmt40-2022';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '12:15:07', 13 FROM races WHERE slug = 'addo-elephant-trail-run-76km-2020';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '05:36:07', 9 FROM races WHERE slug = 'formosa-trail-40km-2019';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '03:24:25', 13 FROM races WHERE slug = 'ultra-trail-chiangmai-33km-2019';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:34:49', 7 FROM races WHERE slug = 'cm1-cm6-20km-2019';

INSERT OR IGNORE INTO tracking (race_id, status, finish_time, finish_position)
SELECT id, 'completed', '02:00:39', 133 FROM races WHERE slug = 'salomon-gore-tex-maxi-race-short-2019';
