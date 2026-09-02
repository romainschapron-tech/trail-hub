# Stride

**Application personnelle de suivi et de préparation trail / course à pied.** Elle agrège mes activités Strava, calcule ma charge d'entraînement et ma forme, prédit mes temps de course calibrés sur mes propres performances, et prépare le plan de course (profil GPX, temps de passage, nutrition).

Projet full-stack déployé sur **Cloudflare Workers** (edge) avec une base **D1 (SQLite)**, ~1 000 activités synchronisées et 700+ produits de nutrition.

> Application mono-utilisateur, conçue comme un vrai outil de performance — data-dense mais lisible.

---

## Aperçu

**Dashboard** — saison en cours, palmarès, courses passées.
![Dashboard](docs/screenshots/dashboard.png)

**Entraînement** — courbe Forme/Fatigue (PMC), zones d'allure VMA, VO2max, terrain & dénivelé.
![Entraînement](docs/screenshots/entrainement.png)

<table>
<tr>
<td width="50%"><b>Stats</b> — volume par sport & année, records<br><img src="docs/screenshots/stats.png" alt="Stats"></td>
<td width="50%"><b>Nutrition</b> — bibliothèque 700+ produits<br><img src="docs/screenshots/nutrition.png" alt="Nutrition"></td>
</tr>
</table>

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

## Défis techniques (et comment je les ai résolus)

**1. Dé-biaiser le dénivelé.** En cumulant toutes les activités, mes stats de D+ étaient absurdes : le ski compte les descentes en télésiège comme du dénivelé positif, et le vélo gonfle la distance. J'ai séparé les statistiques par **groupe de sport** et restreint les métriques de D+ aux sports à pied (`Run`, `TrailRun`, `Hike`), ce qui rend enfin les chiffres comparables d'une année sur l'autre.

**2. Comparer des allures sur des terrains différents.** Une allure brute n'a aucun sens en trail (3:30/km sur plat ≠ 6:00/km en montée). Pour classer chaque sortie dans mes zones VMA, je calcule une **allure équivalent-plat** en convertissant le dénivelé en distance-effort, ce qui rend les zones monotones et cohérentes. Même principe (grade-adjusted pace de Minetti) pour estimer les temps de passage section par section sur un GPX.

**3. Prédire un temps de course… sans sur-généraliser.** Une simple loi puissance globale ajustée sur toutes mes courses sur-estimait les formats raides. Je suis passé à une **prédiction pondérée par similarité** : chaque course de référence est pondérée par un noyau gaussien sur la distance **et** sur la raideur (D+/km) de la cible. Résultat : la CCC (101 km, 6050 m) est prédite en 16h23 pour un réel de 15h58, contre ~17h21 avec le modèle global.

**4. Rester dans une enveloppe serverless.** L'API Strava impose des quotas et le refresh de token ; j'ai mis en place un **cron quotidien** côté Worker qui synchronise en delta (uniquement les nouvelles activités) et capture l'effort relatif + la FC. Tout tourne dans le free tier Cloudflare, sans serveur à maintenir.

**5. Honnêteté des données.** Certaines fonctions se heurtent aux limites de l'API (pas de « best efforts », donc pas de vrai split 5K exact ; couverture photo quasi nulle sur la nutrition sport). Plutôt que d'afficher des valeurs trompeuses, je **libelle explicitement les estimations** et je conçois des états de repli assumés (vignettes produit sans photo, records « estimés » clairement distingués des records exacts).

---

*Projet personnel — développé pour mon propre usage de coureur trail & route.*
