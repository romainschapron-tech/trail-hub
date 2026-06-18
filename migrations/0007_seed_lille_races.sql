-- Recurring trail races within ~2h of Lille (Hauts-de-France + bordure belge).
-- Dates 2026 APPROXIMATIVES — à vérifier/ajuster.
INSERT OR IGNORE INTO races (name, slug, race_date, city, region, country, distance_km, elevation_gain, race_format, source, registration_status) VALUES
-- Métropole lilloise / Nord
('Trail Extrême Lillois', 'trail-extreme-lillois-2026', '2026-03-22', 'Lille', 'Nord', 'FR', 15, 110, 'trail', 'manual', 'unknown'),
('Trail Nocturne des Lacs', 'trail-nocturne-des-lacs-2026', '2026-12-11', 'Wavrin', 'Nord', 'FR', 16, 30, 'trail', 'manual', 'unknown'),
('Run In Lille', 'run-in-lille-2026', '2026-09-13', 'Lille', 'Nord', 'FR', 21, 80, 'trail', 'manual', 'unknown'),
('Trail de Phalempin', 'trail-de-phalempin-2026', '2026-02-08', 'Phalempin', 'Nord', 'FR', 23, 200, 'trail', 'manual', 'unknown'),
('Trail de Wallers-Arenberg', 'trail-wallers-arenberg-2026', '2026-11-15', 'Wallers', 'Nord', 'FR', 24, 250, 'trail', 'manual', 'unknown'),
('Trail du Pipi Malot', 'trail-pipi-malot-2026', '2026-10-18', 'Orchies', 'Nord', 'FR', 14, 80, 'trail', 'manual', 'unknown'),
('Trail des 3 Monts', 'trail-des-3-monts-2026', '2026-08-02', 'Saint-Sylvestre-Cappel', 'Nord', 'FR', 20, 450, 'trail', 'manual', 'unknown'),
('Trail des Monts de Flandre', 'trail-monts-de-flandre-2026', '2026-09-27', 'Bailleul', 'Nord', 'FR', 32, 600, 'trail', 'manual', 'unknown'),
('Crapahute', 'crapahute-2026', '2026-02-01', 'Wavrin', 'Nord', 'FR', 10, 35, 'trail', 'manual', 'unknown'),
('Trail de Marchiennes', 'trail-de-marchiennes-2026', '2026-03-08', 'Marchiennes', 'Nord', 'FR', 21, 150, 'trail', 'manual', 'unknown'),
-- Bassin minier / terrils
('Trail des Terrils', 'trail-des-terrils-2026', '2026-05-10', 'Loos-en-Gohelle', 'Pas-de-Calais', 'FR', 23, 700, 'trail', 'manual', 'unknown'),
('Trail de Vauban', 'trail-de-vauban-2026', '2026-01-18', 'Le Quesnoy', 'Nord', 'FR', 16, 130, 'trail', 'manual', 'unknown'),
-- Val Joly / Avesnois
('Trail de Val Joly', 'trail-de-val-joly-2026', '2026-03-01', 'Eppe-Sauvage', 'Nord', 'FR', 33, 670, 'trail', 'manual', 'unknown'),
-- Côte / Somme
('Trail de Hardelot', 'trail-de-hardelot-2026', '2026-06-14', 'Hardelot', 'Pas-de-Calais', 'FR', 30, 500, 'trail', 'manual', 'unknown'),
('Trail du Touquet', 'trail-du-touquet-2026', '2026-11-08', 'Le Touquet', 'Pas-de-Calais', 'FR', 25, 300, 'trail', 'manual', 'unknown'),
('Trail de la Baie de Somme', 'trail-baie-de-somme-2026', '2026-04-26', 'Le Crotoy', 'Somme', 'FR', 36, 250, 'trail', 'manual', 'unknown'),
('Trail de Saint-Quentin', 'trail-saint-quentin-2026', '2026-09-06', 'Saint-Quentin', 'Aisne', 'FR', 21, 200, 'trail', 'manual', 'unknown'),
-- Belgique frontalière (Flandre / Hainaut / Brabant)
('Trail du Mont Saint-Aubert', 'trail-mont-saint-aubert-2026', '2026-09-13', 'Tournai', 'Hainaut', 'BE', 28, 700, 'trail', 'manual', 'unknown'),
('Trail des Collines', 'trail-des-collines-2026', '2026-10-04', 'Ellezelles', 'Hainaut', 'BE', 25, 650, 'trail', 'manual', 'unknown'),
('Heuvelland Trail (Kemmelberg)', 'heuvelland-trail-2026', '2026-02-22', 'Heuvelland', 'Flandre-Occidentale', 'BE', 27, 750, 'trail', 'manual', 'unknown'),
('Trail de Mons', 'trail-de-mons-2026', '2026-06-07', 'Mons', 'Hainaut', 'BE', 21, 350, 'trail', 'manual', 'unknown'),
('Trail du Pays Vert', 'trail-pays-vert-2026', '2026-05-03', 'Ath', 'Hainaut', 'BE', 30, 500, 'trail', 'manual', 'unknown'),
('Trail de la Dyle', 'trail-de-la-dyle-2026', '2026-11-22', 'Wavre', 'Brabant wallon', 'BE', 24, 450, 'trail', 'manual', 'unknown'),
('Ronse Trail (Renaix)', 'ronse-trail-2026', '2026-12-06', 'Renaix', 'Flandre-Orientale', 'BE', 26, 700, 'trail', 'manual', 'unknown');
