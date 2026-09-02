# Stride

**Application personnelle de suivi et de préparation trail / course à pied.** Elle agrège mes activités Strava, calcule ma charge d'entraînement et ma forme, prédit mes temps de course calibrés sur mes propres performances, et prépare le plan de course (profil GPX, temps de passage, nutrition).

Projet full-stack déployé sur **Cloudflare Workers** (edge) avec une base **D1 (SQLite)**, ~1 000 activités synchronisées et 700+ produits de nutrition.

> Application mono-utilisateur, conçue comme un vrai outil de performance — data-dense mais lisible.

---

## Ce qui rend le projet intéressant

Au-delà du CRUD, le cœur du projet est un ensemble de **modèles de sport-science** appliqués à mes données réelles :

| Fonction | Modèle |
|---|---|
| **Forme / fatigue (PMC)** | Modèle de Banister / TrainingPeaks — CTL (moyenne mobile exponentielle 42 j de l'effort relatif), ATL (7 j), TSB = CTL − ATL. Interprétation automatique (frais / en charge / surcharge). |
| **Prédiction de temps de course** | Loi puissance **pondérée par similarité** : pour une cible (distance, D+), chaque course passée est pondérée selon sa proximité en distance **et** en raideur (D+/km). Le modèle part donc de mes vraies perfs sur un profil comparable. Validé sur mes résultats réels (CCC 101 km : prédit 16h23, réel 15h58). |
| **Zones d'allure (VMA)** | Classification de chaque sortie par **allure équivalent-plat** (correction du dénivelé) dans mes zones VMA. |
| **Temps de passage GPX** | Splits calculés avec la **grade-adjusted pace de Minetti** (coût énergétique en fonction de la pente), alignés sur un objectif de temps. |
| **VO2max estimée** | VDOT (tables de Daniels) à partir de ma meilleure course. |
| **Charge aiguë/chronique** | Ratio ACWR sur l'effort relatif, avec zones de risque. |
| **Records automatiques** | Records exacts (plus longue sortie, D+, durée, effort) + records par distance (5/10/semi/marathon) estimés depuis les meilleures sorties proches de chaque distance. |
| **Plan nutrition** | Besoins glucides/heure selon la durée, hydratation & sodium selon les conditions, et un plan d'ingestion toutes les 30 min réparti depuis mon ravitaillement. |

---

## Stack technique

- **Frontend** — React 19, TanStack Router (routing par fichiers, type-safe), Leaflet (carte des courses), CSS maison (design system « cockpit » : Fira Sans + Fira Code tabulaire, tokens sémantiques, dark mode).
- **Backend** — [Hono](https://hono.dev/) sur **Cloudflare Workers** (~40 endpoints API), un seul Worker sert le SPA **et** l'API.
- **Base de données** — Cloudflare **D1** (SQLite à l'edge), migrations SQL versionnées.
- **Intégration Strava** — OAuth 2.0, refresh de token automatique, **synchronisation quotidienne par cron** (Workers Scheduled), capture de l'effort relatif et de la FC.
- **Enrichissement** — extraction de produits nutrition depuis une URL via l'API Claude (Haiku), géocodage des courses via Nominatim/OpenStreetMap.
- **Outillage** — Vite, TypeScript strict (build sans erreur), bun, Wrangler.

Le tout tient dans le **free tier** de Cloudflare (Workers + D1 + Cron).

---

## Fonctionnalités par écran

- **Dashboard** — saison en cours, volumes, palmarès, courses à venir et deadlines d'inscription.
- **Courses** — catalogue filtrable (liste / **calendrier** / **carte**), suivi (intéressé / inscrit / terminé), avec résultats et temps.
- **Stats** — volume d'entraînement par année **séparé par sport** (le vélo/ski ne fausse plus le D+), résultats en course, records personnels.
- **Entraînement** — courbe Forme/Fatigue (PMC), charge aiguë/chronique, zones d'allure VMA, VO2max, volumes hebdo/mensuel, terrain & dénivelé.
- **Préparer** — import GPX (profil + temps de passage calés sur un objectif) + plan nutrition dérivé de la durée.
- **Nutrition** — bibliothèque de 700+ produits (gels, barres, boissons) avec macros, filtres, ajout par URL.

---

## Architecture

```
Navigateur (SPA React)
        │  fetch /api/*
        ▼
Cloudflare Worker (Hono)  ──────────────┐
   ├─ /api/races          routes courses │  sert aussi les assets du SPA
   ├─ /api/stats/strava/* analytics      │
   ├─ /api/nutrition/*    bibliothèque   │
   └─ /api/strava/*       OAuth + sync    │
        │                                 │
        ├── D1 (SQLite edge) ─────────────┘
        └── Cron quotidien → sync Strava (effort relatif, FC, D+…)
```

---

## Développement local

```bash
bun install
bun run dev        # Vite (front) + Wrangler (worker) en parallèle
```

Base locale :

```bash
bun run db:migrate:local migrations/0001_init.sql   # (par migration)
```

Déploiement :

```bash
bun run deploy     # vite build && wrangler deploy
```

Variables/secrets attendus (Wrangler) : `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `ANTHROPIC_API_KEY` (optionnel, pour l'extraction nutrition par URL).

---

## Structure du projet

```
src/
├─ routes/            écrans (TanStack Router, routing par fichiers)
│  └─ races/          liste · calendrier · carte · détail course
├─ components/        UI (layout, dashboard, map, races…)
├─ lib/              client API typé, modèle GPX (Minetti, splits), formatters
├─ styles/           design system (tokens, cockpit dark)
└─ worker/
   ├─ index.ts       entrée Worker + handler cron
   └─ routes/        races · stats · nutrition · strava · tracking · settings
migrations/          schéma D1 versionné
```

---

*Projet personnel — développé pour mon propre usage de coureur trail & route.*
