# Rapport d’évaluation de performance (modèle)

## Contexte
- Date :
- Commit / branche :
- Environnement : local / Docker / VM
- Version backend :
- DB : Postgres (conteneur) / local
- Base URL :

## Données de test & prérequis
- Seed utilisé : `npm run perf:seed`
- Notes sur la taille du dataset (nombre de cryptos, lignes de prix) :

## KPIs (critères d’acceptation)
| KPI | Cible | Mesuré | OK/KO | Notes |
|---|---:|---:|---|---|
| Error rate (`http_req_failed`) | < 2% |  |  |  |
| p95 latency (`http_req_duration`) | < 900ms (public) |  |  |  |
| p99 latency (`http_req_duration`) | < 1800ms (public) |  |  |  |

## Scénarios exécutés
- Smoke : commande, durée, VUs
- Load : commande, profil de montée
- Stress : commande, VUs max
- Spike : commande, VUs de pic
- Soak : commande, durée
- Mix (arrival-rate) : commande, paliers RPS
- Auth flow : commande, VUs, mode de token

## Résultats (coller le résumé k6)
- Capture d’écran ou coller la sortie ici

## Interprétation
- Où peuvent se situer les goulots d’étranglement (API, DB, réseau)
- Prochaines étapes d’optimisation

## Étapes de reproduction
1) Démarrer la DB (compose de test)
2) Démarrer le backend avec la cible `BASE_URL`
3) Lancer `npm run perf:seed`
4) Lancer les scénarios + capturer la sortie
