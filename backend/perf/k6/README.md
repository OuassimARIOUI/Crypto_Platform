# Tests de performance (k6)

Ce sont des tests de **performance/charge** (pas des tests unitaires/intégration). Ils envoient du trafic HTTP réel vers le backend en cours d’exécution et valident la latence/le taux d’erreur via des seuils.

## Prérequis

- Backend démarré en local (par défaut : `http://localhost:3004`)
- Docker installé (recommandé pour exécuter k6 sur Windows)

## Démarrage rapide

From repository root:

```bash
docker compose up -d
```

Lancer un test smoke rapide (WSL/Windows) :

```bash
npm run perf:smoke
```

Lancer un petit test de charge :

```bash
npm run perf:load
```

Seed des données minimales (recommandé avant une démo, garantit au moins une crypto + un prix) :

```bash
npm run perf:seed
```

## Autres scénarios

Test de stress (montée progressive jusqu’à MAX_VUS) :

```bash
MAX_VUS=30 npm run perf:stress
```

Test de spike (saut brusque jusqu’à SPIKE_VUS) :

```bash
SPIKE_VUS=50 npm run perf:spike
```

Test de soak (charge stable sur une durée plus longue) :

```bash
SOAK_VUS=5 SOAK_DURATION=5m npm run perf:soak
```

Mix de trafic (style RPS via arrival-rate) :

```bash
START_RPS=5 RPS1=10 RPS2=20 npm run perf:mix
```

Parcours authentifié (portfolio + alerts) **PERF-ONLY** :

1) Démarrer le backend avec le bypass d’auth perf activé :

```bash
PERF_TEST=true PERF_TEST_TOKEN=perf_test_token npm start
```

2) Lancer le scénario :

```bash
PERF_TEST_TOKEN=perf_test_token npm run perf:auth
```

Changer la cible et la charge (optionnel) :

```bash
BASE_URL=http://host.docker.internal:3004 MAX_VUS=50 npm run perf:load
```

Notes :
- `host.docker.internal` est la méthode la plus courante pour qu’un conteneur Docker atteigne la machine hôte.

## Fichiers (rôle de chaque script)

- [smoke.js](smoke.js) : très faible charge, seuils pass/fail rapides
- [load.js](load.js) : test de charge avec montée progressive de VUs
- [stress.js](stress.js) : montée plus agressive jusqu’à MAX_VUS pour trouver le point de rupture
- [spike.js](spike.js) : spike soudain jusqu’à SPIKE_VUS
- [soak.js](soak.js) : VUs stables sur une longue durée (fuites/instabilité)
- [mix.js](mix.js) : mix orienté lecture via arrival-rate (type RPS)
- [auth.js](auth.js) : parcours authentifié (nécessite le bypass PERF_TEST)
- [helpers.js](helpers.js) : helpers partagés (mix endpoints, sélection de symbol)
- [run.js](run.js) : runner cross-platform (WSL/Windows) qui monte les scripts dans le conteneur k6

## Sécurité

`PERF_TEST=true` active un bypass d’auth dans le backend (uniquement hors production). Ne l’utilisez PAS en production.
