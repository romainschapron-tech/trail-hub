-- Curated catalogue of well-known FR & BE trail races (2026 season, dates approximate — to verify).
INSERT OR IGNORE INTO races (name, slug, race_date, city, region, country, distance_km, elevation_gain, race_format, website_url, source, registration_status) VALUES
-- France — Alpes / montagne
('UTMB', 'utmb-2026', '2026-08-28', 'Chamonix', 'Haute-Savoie', 'FR', 176, 10000, 'ultra', 'https://utmbmontblanc.com', 'manual', 'unknown'),
('CCC', 'ccc-2026', '2026-08-28', 'Courmayeur', NULL, 'IT', 101, 6100, 'ultra', 'https://utmbmontblanc.com', 'manual', 'unknown'),
('OCC', 'occ-2026', '2026-08-27', 'Orsières', NULL, 'CH', 56, 3500, 'ultra', 'https://utmbmontblanc.com', 'manual', 'unknown'),
('TDS', 'tds-2026', '2026-08-24', 'Courmayeur', NULL, 'IT', 145, 9100, 'ultra', 'https://utmbmontblanc.com', 'manual', 'unknown'),
('Marathon du Mont-Blanc 42K', 'marathon-mont-blanc-2026', '2026-06-28', 'Chamonix', 'Haute-Savoie', 'FR', 42, 2800, 'sky', 'https://montblancmarathon.net', 'manual', 'unknown'),
('MaxiRace Annecy 85K', 'maxirace-annecy-2026', '2026-05-23', 'Annecy', 'Haute-Savoie', 'FR', 85, 5200, 'ultra', 'https://www.maxi-race.org', 'manual', 'unknown'),
('Grand Trail du Lac d''Annecy', 'grand-trail-lac-annecy-2026', '2026-04-25', 'Annecy', 'Haute-Savoie', 'FR', 73, 4500, 'ultra', NULL, 'manual', 'unknown'),
('Ut4M 100', 'ut4m-2026', '2026-08-22', 'Grenoble', 'Isère', 'FR', 100, 7000, 'ultra', 'https://ut4m.fr', 'manual', 'unknown'),
('6000D', '6000d-2026', '2026-07-26', 'La Plagne', 'Savoie', 'FR', 65, 3800, 'ultra', 'https://www.6000d.com', 'manual', 'unknown'),
('Trail du Galibier-Thabor 53K', 'trail-galibier-thabor-2026', '2026-07-12', 'Valloire', 'Savoie', 'FR', 53, 3600, 'trail', NULL, 'manual', 'unknown'),
('Trail des Cerces 45K', 'trail-des-cerces-2026', '2026-07-19', 'Névache', 'Hautes-Alpes', 'FR', 45, 2800, 'trail', NULL, 'manual', 'unknown'),
('Grand Raid des Pyrénées 120K', 'grand-raid-pyrenees-2026', '2026-08-21', 'Vielle-Aure', 'Hautes-Pyrénées', 'FR', 120, 7000, 'ultra', 'https://www.grandraidpyrenees.com', 'manual', 'unknown'),
-- France — Sud / Provence
('Trail du Ventoux 46K', 'trail-du-ventoux-2026', '2026-03-15', 'Bédoin', 'Vaucluse', 'FR', 46, 2000, 'trail', NULL, 'manual', 'unknown'),
('Trail de la Sainte-Victoire 60K', 'trail-sainte-victoire-2026', '2026-04-05', 'Aix-en-Provence', 'Bouches-du-Rhône', 'FR', 60, 2800, 'ultra', NULL, 'manual', 'unknown'),
('Ergysport Trail du Ventoux', 'ergysport-trail-ventoux-2026', '2026-05-30', 'Beaumes-de-Venise', 'Vaucluse', 'FR', 72, 3200, 'ultra', NULL, 'manual', 'unknown'),
-- France — Causses / classiques
('Festival des Templiers 76K', 'festival-templiers-2026', '2026-10-25', 'Millau', 'Aveyron', 'FR', 76, 3300, 'ultra', 'https://www.festivaldestempliers.com', 'manual', 'unknown'),
('SaintéLyon 78K', 'saintelyon-2026', '2026-11-29', 'Saint-Étienne', 'Loire', 'FR', 78, 2000, 'ultra', 'https://www.saintelyon.com', 'manual', 'unknown'),
('EcoTrail de Paris 80K', 'ecotrail-paris-2026', '2026-03-21', 'Paris', 'Île-de-France', 'FR', 80, 1500, 'ultra', 'https://ecotrailparis.com', 'manual', 'unknown'),
('Lyon Urban Trail 36K', 'lyon-urban-trail-2026', '2026-04-05', 'Lyon', 'Rhône', 'FR', 36, 1000, 'trail', 'https://www.lyonurbantrail.com', 'manual', 'unknown'),
('Diagonale des Fous (Grand Raid)', 'diagonale-des-fous-2026', '2026-10-15', 'Saint-Pierre', 'La Réunion', 'FR', 165, 9600, 'ultra', 'https://www.grandraid-reunion.com', 'manual', 'unknown'),
-- France — Nord / Hauts-de-France
('Nord Trail Mont des Flandres 59K', 'ntmf-2026', '2026-04-19', 'Cassel', 'Nord', 'FR', 59, 1400, 'trail', NULL, 'manual', 'unknown'),
('Trail de la Côte d''Opale 45K', 'trail-cote-opale-2026', '2026-04-12', 'Wimereux', 'Pas-de-Calais', 'FR', 45, 1200, 'trail', NULL, 'manual', 'unknown'),
('Trail des Passerelles du Monteynard 65K', 'passerelles-monteynard-2026', '2026-06-07', 'Treffort', 'Isère', 'FR', 65, 3000, 'ultra', NULL, 'manual', 'unknown'),
-- Belgique
('Trail des Fantômes 64K', 'trail-des-fantomes-2026', '2026-10-31', 'La Roche-en-Ardenne', 'Luxembourg', 'BE', 64, 2200, 'ultra', NULL, 'manual', 'unknown'),
('Ultra-Trail de Bouillon 80K', 'ultra-trail-bouillon-2026', '2026-05-16', 'Bouillon', 'Luxembourg', 'BE', 80, 2800, 'ultra', NULL, 'manual', 'unknown'),
('Trail de la Semois 38K', 'trail-de-la-semois-2026', '2026-05-17', 'Bouillon', 'Luxembourg', 'BE', 38, 1300, 'trail', NULL, 'manual', 'unknown'),
('Trail des Hautes Fagnes 42K', 'trail-hautes-fagnes-2026', '2026-06-20', 'Malmedy', 'Liège', 'BE', 42, 1400, 'trail', NULL, 'manual', 'unknown'),
('Ardenne Trail 56K', 'ardenne-trail-2026', '2026-09-12', 'Bouillon', 'Luxembourg', 'BE', 56, 2000, 'ultra', NULL, 'manual', 'unknown'),
('Trail du Pays de Herve 30K', 'trail-pays-de-herve-2026', '2026-09-20', 'Herve', 'Liège', 'BE', 30, 800, 'trail', NULL, 'manual', 'unknown'),
('Brussels Trail 25K', 'brussels-trail-2026', '2026-10-18', 'Bruxelles', NULL, 'BE', 25, 400, 'trail', NULL, 'manual', 'unknown'),
('Sky Trail des Crêtes 30K', 'sky-trail-cretes-be-2026', '2026-07-05', 'Vresse-sur-Semois', 'Namur', 'BE', 30, 1500, 'sky', NULL, 'manual', 'unknown');
