-- =============================================
-- UTMB WORLD SERIES - Registration dates
-- =============================================

-- UTMB Mont-Blanc (lottery pre-reg: Jan 8-19, results Jan 22)
UPDATE races SET registration_opens = '2026-01-08', registration_deadline = '2026-02-04' WHERE slug LIKE 'utmb-%' OR slug LIKE 'tds-%' OR slug LIKE 'ccc-%' OR slug LIKE 'occ-%' OR slug LIKE 'mcc-%' OR slug LIKE 'etc-%' OR slug LIKE 'ptl-%';

-- Lavaredo (lottery pre-reg: Sep 8-15 2025)
UPDATE races SET registration_opens = '2025-09-08', registration_deadline = '2025-09-15' WHERE slug LIKE 'lavaredo-%';

-- Val d'Aran (priority Sep 24, general Sep 26)
UPDATE races SET registration_opens = '2025-09-24', registration_deadline = '2026-06-11' WHERE slug LIKE 'vda-%';

-- Trail 100 Andorra (priority Jul 15, general Jul 17)
UPDATE races SET registration_opens = '2025-07-15', registration_deadline = '2026-06-06' WHERE slug LIKE 'andorra-%';

-- Mozart 100 (priority Oct 21)
UPDATE races SET registration_opens = '2025-10-21' WHERE slug LIKE 'mozart-%';

-- Nice Cote d'Azur (priority Dec 9, general Dec 11)
UPDATE races SET registration_opens = '2025-12-09' WHERE slug LIKE 'nice-%';

-- Restonica Trail (priority Oct 21, general Oct 23)
UPDATE races SET registration_opens = '2025-10-21' WHERE slug LIKE 'restonica-%';

-- Trail du Saint-Jacques (priority Aug 12, general Aug 14)
UPDATE races SET registration_opens = '2025-08-12' WHERE slug LIKE 'saint-jacques-%';

-- Trail Alsace (priority Aug 5, general Aug 7)
UPDATE races SET registration_opens = '2025-08-05' WHERE slug LIKE 'alsace-%';

-- Grand Raid Ventoux (priority Sep 16, general Sep 18)
UPDATE races SET registration_opens = '2025-09-16' WHERE slug LIKE 'ventoux-%';

-- Snowdonia (priority Sep 9, general Sep 11)
UPDATE races SET registration_opens = '2025-09-09', registration_deadline = '2026-04-19' WHERE slug LIKE 'uts-%';

-- Eiger (lottery pre-reg Sep 22-29)
UPDATE races SET registration_opens = '2025-09-22', registration_deadline = '2025-10-06' WHERE slug LIKE 'eiger-%';

-- Verbier (priority Sep 22, general Sep 24)
UPDATE races SET registration_opens = '2025-09-22', registration_deadline = '2026-07-05' WHERE slug LIKE 'verbier-%';

-- KAT100 (priority Sep 23, general Sep 25)
UPDATE races SET registration_opens = '2025-09-23' WHERE slug LIKE 'kat100-%';

-- Mallorca (opened ~Jan 14 2026)
UPDATE races SET registration_opens = '2026-01-14' WHERE slug LIKE 'mallorca-%';

-- Kullamannen (priority Nov 18, general Nov 20)
UPDATE races SET registration_opens = '2025-11-18' WHERE slug LIKE 'kullamannen-%';

-- Bucovina (priority Sep 9, general Sep 11)
UPDATE races SET registration_opens = '2025-09-09' WHERE slug LIKE 'bucovina-%';

-- Puglia (priority Jun 4 2025, general Jun 6)
UPDATE races SET registration_opens = '2025-06-04' WHERE slug LIKE 'puglia-%';

-- Oh Meu Deus (Nov 4 2025)
UPDATE races SET registration_opens = '2025-11-04' WHERE slug LIKE 'omd-%';

-- Istria (already sold out)
UPDATE races SET registration_opens = '2025-09-01', registration_deadline = '2026-02-28' WHERE slug LIKE 'istria-%';

-- Chianti
UPDATE races SET registration_opens = '2025-07-01' WHERE slug LIKE 'chianti-%';

-- Tenerife Bluetrail
UPDATE races SET registration_opens = '2025-07-01' WHERE slug LIKE 'tenerife-%';

-- Zugspitz
UPDATE races SET registration_opens = '2025-10-01' WHERE slug LIKE 'zut-%';

-- Monte Rosa
UPDATE races SET registration_opens = '2025-09-01' WHERE slug LIKE 'monterosa-%';

-- Gauja (new 2026)
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'gauja-%';

-- Kackar
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'kackar-%';

-- =============================================
-- FRENCH RACES - Registration dates
-- =============================================

-- Festival des Templiers (Jan 19 2026 a midi, sold out en < 1h)
UPDATE races SET registration_opens = '2026-01-19' WHERE slug LIKE 'templiers-%';

-- Eco-Trail de Paris (Jun 23 2025, closes Feb 27 2026)
UPDATE races SET registration_opens = '2025-06-23', registration_deadline = '2026-02-27' WHERE slug LIKE 'ecotrail-paris-%';

-- Diagonale des Fous (lottery: pre-reg Jan 14-20, draw Mar 18)
UPDATE races SET registration_opens = '2026-01-14', registration_deadline = '2026-03-06' WHERE slug LIKE 'diagonale-%' OR slug LIKE 'trail-de-bourbon-%' OR slug LIKE 'mascareignes-%';

-- SainteLyon (Mar 17 2026 a 13h)
UPDATE races SET registration_opens = '2026-03-17' WHERE slug LIKE 'saintelyon-%';

-- La 6000D (mid-Nov 2025, closes Jul 26)
UPDATE races SET registration_opens = '2025-11-15', registration_deadline = '2026-07-26' WHERE slug LIKE 'la-6000d-%';

-- Maxi-Race (lottery: pre-reg Oct 1 2025)
UPDATE races SET registration_opens = '2025-10-01' WHERE slug LIKE 'maxirace-%';

-- Ultra Marin (lottery: Dec 2-4 2025)
UPDATE races SET registration_opens = '2025-12-02' WHERE slug LIKE 'ultra-marin-%';

-- Echappee Belle (lottery: Jan 13 2026)
UPDATE races SET registration_opens = '2026-01-13' WHERE slug LIKE 'echappee-belle-%';

-- UT4M (Dec 15 2025)
UPDATE races SET registration_opens = '2025-12-15' WHERE slug LIKE 'ut4m-%';

-- Grand Trail des Ecrins (Dec 10 2025)
UPDATE races SET registration_opens = '2025-12-10' WHERE slug LIKE 'ecrins-%';

-- Le Grand Duc (Nov 2025)
UPDATE races SET registration_opens = '2025-11-01' WHERE slug LIKE 'grand-duc-%';

-- Trail du Sancy (Apr 1 2026 groups, Apr 3 individuel)
UPDATE races SET registration_opens = '2026-04-03' WHERE slug LIKE 'sancy-%';

-- La Montagn'Hard (Dec 9 2025)
UPDATE races SET registration_opens = '2025-12-09' WHERE slug LIKE 'montagnhard-%';

-- Trail Sainte-Victoire
UPDATE races SET registration_opens = '2025-10-01' WHERE slug LIKE 'sainte-victoire-%';

-- Trail Ubaye
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'ubaye-%';

-- Trail des Passerelles du Monteynard
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'passerelles-%';

-- Trail des Aiguilles Rouges
UPDATE races SET registration_opens = '2025-11-01' WHERE slug LIKE 'aiguilles-rouges-%';

-- Grand Trail Cote d'Opale
UPDATE races SET registration_opens = '2025-06-01' WHERE slug LIKE 'cote-opale-%';

-- =============================================
-- EUROPEAN RACES - Registration dates
-- =============================================

-- MIUT Madeira (Sep 2025)
UPDATE races SET registration_opens = '2025-09-01', registration_deadline = '2026-03-15' WHERE slug LIKE 'miut-%';

-- Transgrancanaria (Jul 2 2025)
UPDATE races SET registration_opens = '2025-07-02' WHERE slug LIKE 'transgrancanaria-%';

-- Zegama-Aizkorri (lottery: Jan 12-23 2026, draw Feb 20)
UPDATE races SET registration_opens = '2026-01-12', registration_deadline = '2026-01-23' WHERE slug LIKE 'zegama-%';

-- Ultra Pirineu (preferred Oct 9, general Dec 9 2025)
UPDATE races SET registration_opens = '2025-12-09' WHERE slug LIKE 'ultra-pirineu-%' OR slug LIKE 'marato-pirineu-%';

-- Penyagolosa (lottery: pre-reg Nov 20 - Dec 8, draw Dec 12)
UPDATE races SET registration_opens = '2025-11-20', registration_deadline = '2025-12-08' WHERE slug LIKE 'penyagolosa-%';

-- Ultra Sierra Nevada
UPDATE races SET registration_opens = '2025-10-01' WHERE slug LIKE 'sierra-nevada-%';

-- Gran Trail Penalara
UPDATE races SET registration_opens = '2026-01-15' WHERE slug LIKE 'penalara-%';

-- Tor des Geants (lottery: pre-reg Feb 1-14 2026, draw Feb 28)
UPDATE races SET registration_opens = '2026-02-01', registration_deadline = '2026-03-15' WHERE slug LIKE 'tor-%';

-- Gran Trail Courmayeur
UPDATE races SET registration_opens = '2025-12-01', registration_deadline = '2026-06-15' WHERE slug LIKE 'gtc-%';

-- Adamello Ultra Trail (Mar 16 2026)
UPDATE races SET registration_opens = '2026-03-16' WHERE slug LIKE 'adamello-%';

-- Sierre-Zinal (Apr 2 2026, lottery if oversubscribed)
UPDATE races SET registration_opens = '2026-04-02' WHERE slug LIKE 'sierre-zinal-%';

-- Swiss Irontrail
UPDATE races SET registration_opens = '2025-11-01' WHERE slug LIKE 'irontrail-%';

-- Davos X-Trails
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'davos-%';

-- Jungfrau Marathon
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'jungfrau-%';

-- Grossglockner (open, early bird ended Dec 31 2025)
UPDATE races SET registration_opens = '2025-07-01', registration_deadline = '2026-07-23' WHERE slug LIKE 'grossglockner-%';

-- Pitz Alpine
UPDATE races SET registration_opens = '2025-11-01' WHERE slug LIKE 'pitz-%';

-- Lakeland 100 (ballot Sep 1 2025)
UPDATE races SET registration_opens = '2025-09-01' WHERE slug LIKE 'lakeland-%';

-- Spine Race (Jul 7 2025)
UPDATE races SET registration_opens = '2025-07-07' WHERE slug LIKE 'spine-%';

-- West Highland Way (ballot Nov 2025)
UPDATE races SET registration_opens = '2025-11-01' WHERE slug LIKE 'whw-%';

-- Lofoten Ultra Trail (late 2025)
UPDATE races SET registration_opens = '2025-10-01' WHERE slug LIKE 'lofoten-%';

-- Olympus Marathon (Jan 23 2026 non-Greek, Feb 8 Greek)
UPDATE races SET registration_opens = '2026-01-23', registration_deadline = '2026-05-15' WHERE slug LIKE 'olympus-%';

-- Corfu Mountain Trail (Nov 1 2025, closes Apr 20 2026)
UPDATE races SET registration_opens = '2025-11-01', registration_deadline = '2026-04-20' WHERE slug LIKE 'corfu-%';

-- Zagori
UPDATE races SET registration_opens = '2026-02-01' WHERE slug LIKE 'zagori-%';

-- Trail des Fantomes
UPDATE races SET registration_opens = '2026-01-15' WHERE slug LIKE 'fantomes-%';

-- UTHA Haute Ardenne
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'utha-%';

-- Les 4 Cimes de Herve
UPDATE races SET registration_opens = '2026-09-01' WHERE slug LIKE 'herve-%';

-- Bastogne-Wiltz-Bastogne
UPDATE races SET registration_opens = '2026-06-01' WHERE slug LIKE 'bastogne-%';

-- DFBG Poland
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'dfbg-%';

-- TransAlpine Run
UPDATE races SET registration_opens = '2025-12-01' WHERE slug LIKE 'transalpine-%';

-- Transvulcania (already in DB from first seed, update)
UPDATE races SET registration_opens = '2025-09-01' WHERE slug LIKE 'transvulcania-%';
