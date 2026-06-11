-- =============================================
-- ALSACE: all full except 10.5K (already done in fix_alsace.sql)
-- =============================================

-- =============================================
-- SAINT-JACQUES: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'saint-jacques-%';

-- =============================================
-- VENTOUX: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'ventoux-%';

-- =============================================
-- NICE: 100M open, rest full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'nice-%';
UPDATE races SET registration_status = 'open' WHERE slug = 'nice-165k-fr-2026';

-- =============================================
-- RESTONICA: all open
-- =============================================
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'restonica-%';

-- =============================================
-- ANDORRA: all full (10K not in DB)
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'andorra-%';

-- =============================================
-- SNOWDONIA: 100M full, 50K full, 100K open
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug = 'uts-100m-gb-2026';
UPDATE races SET registration_status = 'open' WHERE slug = 'uts-100k-gb-2026';
UPDATE races SET registration_status = 'full' WHERE slug = 'uts-50k-gb-2026';

-- =============================================
-- MOZART: 100 open, rest full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'mozart-%';
UPDATE races SET registration_status = 'open' WHERE slug = 'mozart-100-119k-at-2026';

-- =============================================
-- VAL D'ARAN: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'vda-%';

-- =============================================
-- OH MEU DEUS: 163K open, rest full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'omd-%';
UPDATE races SET registration_status = 'open' WHERE slug = 'omd-163k-pt-2026';

-- =============================================
-- BUCOVINA: all open
-- =============================================
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'bucovina-%';

-- =============================================
-- MALLORCA: 100M + 100K open, 50K + 20K full
-- =============================================
UPDATE races SET registration_status = 'open' WHERE slug = 'mallorca-138k-es-2026';
UPDATE races SET registration_status = 'open' WHERE slug = 'mallorca-104k-es-2026';
UPDATE races SET registration_status = 'full' WHERE slug = 'mallorca-56k-es-2026';

-- =============================================
-- KULLAMANNEN: 100M + 100K + 53K full, 20K not in DB but skip
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'kullamannen-%';

-- =============================================
-- UTMB MONT-BLANC: all closed
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'utmb-%' OR slug LIKE 'tds-%' OR slug LIKE 'ccc-%' OR slug LIKE 'occ-%' OR slug LIKE 'mcc-%' OR slug LIKE 'etc-%' OR slug LIKE 'ptl-%';

-- =============================================
-- FESTIVAL DES TEMPLIERS: all full (main distances)
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'templiers-%';

-- =============================================
-- SAINTELYON: 82K full, 44K full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'saintelyon-%';

-- =============================================
-- MAXI-RACE: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'maxirace-%';

-- =============================================
-- LA 6000D: all open!
-- =============================================
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'la-6000d-%';

-- =============================================
-- UT4M: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'ut4m-%';

-- =============================================
-- LAVAREDO: all closed (lottery past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'lavaredo-%';

-- =============================================
-- EIGER: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'eiger-%';

-- =============================================
-- VERBIER: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'verbier-%';

-- =============================================
-- KAT100: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'kat100-%';

-- =============================================
-- ISTRIA: all full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'istria-%';

-- =============================================
-- TENERIFE + CHIANTI: closed (past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'tenerife-%';
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'chianti-%';

-- =============================================
-- ZUGSPITZ: full (main), open some
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'zut-%';

-- =============================================
-- MONTE ROSA: open
-- =============================================
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'monterosa-%';

-- =============================================
-- ECO-TRAIL PARIS: closed (past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'ecotrail-paris-%';

-- =============================================
-- COTE D'OPALE: closed (past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'cote-opale-%';

-- =============================================
-- TRANSGRANCANARIA: closed (past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'transgrancanaria-%';

-- =============================================
-- SAINTE-VICTOIRE: unknown -> check date (Mar 29 = past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'sainte-victoire-%';

-- =============================================
-- ECHAPPEE BELLE: lottery done
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'echappee-belle-%';

-- =============================================
-- DIAGONALE DES FOUS: unknown -> lottery done
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'diagonale-%' OR slug LIKE 'trail-de-bourbon-%' OR slug LIKE 'mascareignes-%';

-- =============================================
-- ULTRA PIRINEU: full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'ultra-pirineu-%' OR slug LIKE 'marato-pirineu-%';

-- =============================================
-- PENYAGOLOSA: closed (lottery past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'penyagolosa-%';

-- =============================================
-- ZEGAMA: lottery done
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'zegama-%';

-- =============================================
-- TOR DES GEANTS: closed (lottery past)
-- =============================================
UPDATE races SET registration_status = 'closed' WHERE slug LIKE 'tor-%';

-- =============================================
-- LAKELAND: full
-- =============================================
UPDATE races SET registration_status = 'full' WHERE slug LIKE 'lakeland-%';

-- =============================================
-- OPEN RACES (verified or likely)
-- =============================================
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'grossglockner-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'pitz-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'corfu-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'lofoten-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'dfbg-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'irontrail-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'davos-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'adamello-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'gtc-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'gauja-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'kackar-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'penalara-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'sierra-nevada-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'fantomes-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'utha-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'olympus-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'zagori-%';
UPDATE races SET registration_status = 'open' WHERE slug LIKE 'spine-%';
