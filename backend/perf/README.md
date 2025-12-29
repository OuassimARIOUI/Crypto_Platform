# Suite de tests de performance (pro-ready)

Ce dossier contient des tests de **performance** (latence/scalabilité) avec **k6**. L’objectif est de pouvoir les présenter comme une évaluation d’ingénierie (KPIs, scénarios, seuils et interprétation), pas seulement “ça tourne”.

## Ce que vous mesurez

- **Latence** : p(95)/p(99) `http_req_duration`
- **Fiabilité** : taux d’erreur `http_req_failed`
- **Capacité/Scalabilité** : évolution latence/erreurs quand les VUs augmentent (load/stress/spike)
- **Stabilité** : dégradation sur la durée (soak)

## Prérequis

- Backend démarré (port par défaut : `3004`)
- Docker installé (k6 tourne dans un conteneur)

Optionnel mais recommandé :

- Un dataset minimal (au moins 1 crypto + 1 prix) pour éviter le biais “DB vide”

## Démarrage rapide

From `backend/`:

Seed des données minimales (recommandé avant les démos) :

- `npm run perf:seed`

- Smoke (sanity): `npm run perf:smoke`
- Load (small ramp): `npm run perf:load`
- Mix (arrival-rate / RPS-style): `START_RPS=5 RPS1=10 RPS2=20 npm run perf:mix`
- Stress (gradual ramp): `MAX_VUS=30 npm run perf:stress`
- Spike (sudden jump): `SPIKE_VUS=50 npm run perf:spike`
- Soak (long duration): `SOAK_VUS=5 SOAK_DURATION=5m npm run perf:soak`

Scénario authentifié (bypass perf-only, **jamais en production**) :

- Start backend: `PERF_TEST=true PERF_TEST_TOKEN=perf_test_token npm start`
- Run: `PERF_TEST_TOKEN=perf_test_token npm run perf:auth`

Cibler un autre host :

- `BASE_URL=http://host.docker.internal:3004 npm run perf:smoke`

## Livrable pro-ready (quoi montrer)

Présentation recommandée en 3 parties :

1) **Plan de test** (quels endpoints, pourquoi, et définition du succès)
2) **Exécutions** (smoke → load → stress/spike → soak) + capture des résumés
3) **Conclusion** (VUs max stables aux objectifs p95, goulots observés, actions suivantes)

## Comment capturer les résultats (pour un rapport)

Le workflow “pro” le plus simple est de sauvegarder le résumé k6 de chaque scénario.

Exemple PowerShell (Windows) :

```powershell
# From backend/
New-Item -ItemType Directory -Force perf/results | Out-Null
npm run perf:smoke | Tee-Object -FilePath perf/results/smoke.txt
npm run perf:load  | Tee-Object -FilePath perf/results/load.txt
START_RPS=5 RPS1=10 RPS2=20 npm run perf:mix | Tee-Object -FilePath perf/results/mix.txt
```

Ensuite, remplir le modèle :

- `perf/REPORT_TEMPLATE.md`

## Critères d’acceptation suggérés

Utiliser les seuils intégrés à chaque script k6 comme première barrière “OK/KO” :

- `http_req_failed < 2%`
- Endpoints publics : p95 < 900ms, p99 < 1800ms
- Parcours auth : p95 < 1200ms, p99 < 2500ms

Adapter les cibles si votre professeur attend des KPIs plus stricts (ou si vous tournez sur un PC partagé).

## Files

- `perf/README.md` : ce document (plan d’évaluation + présentation)
- `perf/REPORT_TEMPLATE.md` : modèle de rapport à compléter
- `perf/seedPerfData.js` : seed Prisma pour les démos perf (crypto + prix minimum)
- `perf/k6/*` : scénarios k6 + runner (détails dans `perf/k6/README.md`)

Voir `perf/k6/README.md` pour une description fichier-par-fichier des scénarios.
