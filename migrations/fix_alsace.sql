-- Fix Alsace: all FULL except 10.5K
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'alsace-%';

-- Add missing distances
INSERT INTO races (name, slug, race_date, city, country, distance_km, elevation_gain, race_format, website_url, price_eur, registration_status, registration_opens, source) VALUES
('Trail Alsace TDP 29K', 'alsace-tdp-29k-fr-2026', '2026-05-16', 'Obernai', 'FR', 29, 800, 'trail', 'https://alsace.utmb.world', 55, 'full', '2025-08-05', 'manual'),
('Trail Alsace RDP 18K', 'alsace-rdp-18k-fr-2026', '2026-05-16', 'Obernai', 'FR', 18, 250, 'trail', 'https://alsace.utmb.world', 48, 'full', '2025-08-05', 'manual'),
('Trail Alsace TDE 10.5K', 'alsace-tde-10k-fr-2026', '2026-05-16', 'Obernai', 'FR', 10.5, 400, 'trail', 'https://alsace.utmb.world', 48, 'open', '2025-08-05', 'manual');
