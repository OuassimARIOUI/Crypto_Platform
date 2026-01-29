# Rapport Projet - Plateforme Crypto Trading

**Auteur:** ARIOUI Mohamed  
**Date:** Janvier 2026  
**Projet:** Application de Suivi et Analyse des Cryptomonnaies en Temps Réel

---

## 1. Vue d'Ensemble du Projet

Plateforme full-stack de collecte, analyse et visualisation de données cryptomonnaies via l'API CoinGecko. Architecture microservices avec monitoring Prometheus/Grafana et déploiement Kubernetes.

**Stack Principal:**
- **Backend:** Node.js 20, Express 5, Prisma ORM, PostgreSQL 16, Redis
- **Frontend:** Next.js 16, React 19, TailwindCSS 4, ApexCharts
- **DevOps:** Docker, Kubernetes, GitHub Actions, Prometheus, Grafana

---

## 2. Processus de Développement Agile

**Méthodologie:** Scrum avec sprints de 2 semaines  
**Outil:** Notion (backlog, user stories, retrospectives, Kanban)

**Organisation:**
- Backlog produit avec priorisation MoSCoW
- User stories: "En tant que [role], je veux [action] afin de [bénéfice]"
- 6 sprints documentés avec planning, daily standups, reviews et rétrospectives
- Burndown charts pour suivi de vélocité

**Documentation:**
- README, diagrammes UML (classes, séquence, déploiement)
- Schémas architecture microservicesc
- Guides Kubernetes (QUICKSTART, SECRETS_SETUP)
- Documentation API (routes, middlewares, contrôleurs)

---

## 3. Choix Techniques et Justifications

### 3.1 Backend - Node.js + Express

**Node.js 20 choisi pour:**
- Architecture event-driven non-bloquante, idéale pour les requêtes API temps réel (CoinGecko polling toutes les 30s)
- Écosystème NPM riche (Prisma, BullMQ, Firebase Admin) permettant développement rapide
- Performance élevée pour I/O intensives (WebSockets, requêtes HTTP concurrentes)
- Single language (JavaScript) frontend/backend, facilite la maintenance et le partage de code
- Communauté active, documentation exhaustive, stabilité LTS garantie

**Express 5:** Framework minimaliste permettant architecture modulaire (routes, middlewares, contrôleurs séparés), middleware composables pour auth/validation/logging, maturité éprouvée en production

**Prisma ORM:** Type-safety TypeScript, migrations automatiques, génération client optimisé, prévention injection SQL native

**PostgreSQL 16:** Relations complexes (users, portfolios, cryptos, alerts), transactions ACID critiques pour opérations financières, performance analytics (agrégations, index), JSON support pour données flexibles

**Redis:** Cache haute performance (prix cryptos, réduction latence API CoinGecko), gestion queues BullMQ pour jobs asynchrones

**BullMQ:** Processing jobs fiable (collecte prix, déclenchement alertes), retry automatique sur échec, monitoring état queues

### 3.2 Frontend - Next.js + React

**Next.js 16 choisi pour:**
- Server-Side Rendering (SSR) améliore SEO et temps chargement initial
- App Router moderne avec layouts nested, streaming UI progressive
- Image optimization automatique (ApexCharts, logos cryptos)
- API Routes intégrées pour proxy backend sécurisé
- File-based routing simplifie navigation (pages/, app/)
- Production-ready out-of-the-box (minification, code splitting, lazy loading)

**React 19:** Hooks modernes (useState, useEffect, useContext) pour gestion état, React Compiler optimise re-renders automatiquement, composants réutilisables (UI cards, tables, charts), Virtual DOM performance élevée

**TailwindCSS 4:** Utility-first accélère prototypage, responsive design mobile-first, purge CSS automatique (build optimisé), customisation facile (theme colors, spacing)

**ApexCharts:** Graphiques interactifs temps réel (candlesticks, line charts), zoom/pan pour analyse technique, animations fluides, responsive mobile

### 3.3 DevOps - Kubernetes + CI/CD

**Docker:** Isolation services (backend, frontend, DB séparés), reproductibilité environnements (dev/staging/prod identiques), déploiement simplifié

**Kubernetes:** Orchestration automatique (restart pods en échec), auto-scaling horizontal (HPA sur CPU/mémoire), rolling updates zero downtime, self-healing infrastructure

**GitHub Actions:** CI/CD natif GitHub (pas d'outil externe), parallélisation jobs (backend/frontend/security simultanés), cache NPM accélère builds, secrets management intégré

**Prometheus + Grafana:** Métriques time-series (latence API, CPU, mémoire), alerting automatique (email, Discord), dashboards customisables, PromQL queries puissantes

**Loki:** Centralisation logs Kubernetes, corrélation logs/métriques Grafana, requêtes LogQL efficaces, stockage optimisé

---

## 4. Résultats des Tests

### 4.1 Tests Unitaires (Vitest)

**Backend (580 tests - 100%):**
- Coverage: 90.66% lignes, 87.31% branches
- Services (97.49%), Controllers (95.72%), Middleware (88.88%)
- Mocks: Prisma, Firebase Admin, Axios CoinGecko

**Frontend (202 tests - 100%):**
- Coverage: 26.79% lignes, 74.21% branches
- Composants UI (100%), Hooks (100%), Pages (26.79%)
- Mocks: Firebase Client, fetch API, Next.js Router

### 4.2 Tests d'Intégration

**6 scénarios:** Auth flow, Portfolio CRUD, Alertes prix, Cryptos endpoints  
**Configuration:** PostgreSQL dédiée, isolation DB, fixtures réalistes  
**Qualité:** 9.5/10

### 4.3 Tests Performance (k6 - 7 scénarios)

| Scénario | VUs | Requêtes | Objectif |
|----------|-----|----------|----------|
| Smoke | 1 | ~90 | Sanity check |
| Load | 0→10 | ~15,000 | Montée progressive |
| Stress | 0→20 | ~30,000 | Charge intense |
| Spike | 0→30 | ~10,000 | Pic soudain |
| Soak | 5 (2min) | ~6,000 | Stabilité |

**Résultats:** P95<900ms, erreurs<2%, capacité 900 req/s

### 4.4 Tests Sécurité

**Snyk:** 126 vulnérabilités corrigées  
**Vitest Security:** 126 tests (100%)  
**Couverture:** Injection SQL, XSS, CSRF, Auth JWT, Rate limiting, CORS

---

## 5. DevOps et CI/CD

### 5.1 Pipeline GitHub Actions

**Jobs Parallèles:**
- Backend: PostgreSQL/Redis services, 580 tests unitaires + intégration, coverage
- Frontend: 202 tests, coverage report
- Security: Snyk scan, 126 tests sécurité
- Build & Deploy: Docker build, push Docker Hub, deploy K8s

**Déclencheurs:** Push branches, PR main/DEV, cron quotidien (backup), manuel

**Optimisations:** Cache NPM, jobs parallèles, concurrency groups, artifacts coverage

### 5.2 Dockerisation

**Services:** Backend (Node 20 Alpine, multi-stage), Frontend (Next.js prod), PostgreSQL 16, Redis, Workers BullMQ

**Docker Compose:** Environnement dev complet, networks isolés, volumes persistants

### 5.3 Kubernetes

**Architecture:** Namespace crypto-platform
- Backend (3 replicas), Frontend (2), PostgreSQL (StatefulSet), Redis (1), Workers (2)
- Rolling Update (zero downtime), HPA (auto-scaling), ConfigMaps, Secrets, PV

**Overlays Kustomize:** Base, Staging (1 replica), Production (3 replicas)

### 5.4 Monitoring

**Prometheus:** Métriques Node.js (event loop, heap, CPU), HTTP (latence, status, throughput), métier (prix, alertes, portfolios), K8s (pods, ressources)

**Grafana:** Dashboards plateforme, performance backend (P95/P99), base données, infrastructure K8s

**Alertmanager:** Email SMTP, Discord webhook, règles (latence>1s, erreurs>5%, CPU>80%)

**Loki:** Centralisation logs K8s, recherche LogQL

**Sauvegardes:** Scripts bash cron (backup.sh, restore.sh), rétention 7 jours

---

## 6. Intégration SonarQube (À Configurer)

**Objectif:** Analyse qualité code continue + détection code smells

**Configuration Prévue:**

```yaml
# .github/workflows/sonarqube.yml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

**Métriques à Tracker:**
- Code coverage (backend 90%+, frontend 70%+)
- Duplications (< 3%)
- Complexité cyclomatique (< 15)
- Bugs/Vulnérabilités (0 critical)
- Code smells (< 10)
- Dette technique (< 5%)

**Fichier sonar-project.properties:**
```properties
sonar.projectKey=crypto-platform
sonar.sources=backend/src,frontend/src
sonar.tests=backend/src/test,frontend/src/__tests__
sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info
```

---

## 7. Synthèse des Livrables

### Livrables Complétés

- [x] **Code source:** Versionné GitHub (commits cohérents, branches DEV/main)
- [x] **Documentation technique:** README, UML, architecture, guides K8s
- [x] **Documentation utilisateur:** GUIDE_UTILISATEUR.md
- [x] **Tableau Agile:** Notion (sprints, backlog, retrospectives)
- [x] **Pipeline CI/CD:** GitHub Actions fonctionnel (tests + build + deploy)
- [x] **Rapports tests:** Unitaires (782 tests), intégration (6 tests), performance (7 scénarios), sécurité (126 tests)
- [x] **Dockerisation:** Services complets (docker-compose + Dockerfiles)
- [x] **Kubernetes:** Manifests base + overlays (staging/prod)
- [x] **Monitoring:** Prometheus + Grafana + Loki + Alertmanager
- [x] **Sauvegardes:** Scripts automatiques (backup.sh/restore.sh)

### Scores de Qualité

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Tests Backend | 9.5/10 | Excellent coverage (90%), tests robustes |
| Tests Frontend | 6.5/10 | À améliorer (27% coverage) |
| Sécurité | 10/10 | Snyk, ZAP, tests sécu exhaustifs |
| Performance | 8/10 | k6 complet, capacité ~900 req/s |
| DevOps | 9/10 | CI/CD mature, K8s prod-ready |
| Documentation | 9/10 | Complète, UML, guides détaillés |
| **Global** | **8.7/10** | Projet professionnel et maintenable |

---

## 8. Retour d'Expérience

Ce projet a été une expérience formatrice qui m'a permis de mettre en pratique des compétences techniques avancées et de comprendre les exigences d'un développement professionnel.

### Points Positifs

**Architecture et Scalabilité:**
L'adoption de Kubernetes et Docker a permis une séparation claire des services et une infrastructure résiliente. Le déploiement automatisé via GitHub Actions a considérablement réduit les erreurs humaines et accéléré les itérations de développement.

**Qualité du Code Backend:**
L'excellent coverage de 90% sur le backend témoigne d'une approche rigoureuse des tests. L'utilisation de Prisma ORM a significativement simplifié les migrations de base de données et éliminé les risques d'injection SQL.

**Monitoring Proactif:**
L'intégration de Prometheus et Grafana dès le début du projet a permis d'identifier rapidement les goulots d'étranglement de performance, notamment sur les requêtes API CoinGecko qui causaient des timeouts avant l'implémentation du cache Redis.

**Méthodologie Agile:**
La structuration Scrum avec Notion a facilité la priorisation des fonctionnalités et maintenu une vision claire de l'avancement. Les rétrospectives ont été particulièrement utiles pour ajuster la vélocité des sprints.

### Défis Rencontrés

**Coverage Frontend Insuffisante (27%):**
Le délai serré a conduit à prioriser les fonctionnalités au détriment des tests frontend. Les pages authentifiées (dashboard, login, register) sont peu testées, créant un risque de régressions lors des futures évolutions. Une meilleure planification initiale aurait dû allouer 30% du temps sprint aux tests.

**Complexité Kubernetes:**
La courbe d'apprentissage de Kubernetes a été sous-estimée. La configuration des Secrets, PersistentVolumes et overlays Kustomize a nécessité plusieurs itérations et causé des retards de 3-4 jours. Une formation préalable ou l'usage de Minikube plus tôt aurait été bénéfique.

**Gestion BullMQ:**
L'implémentation des queues asynchrones pour la collecte de prix a posé des problèmes de retry infinis en cas d'API CoinGecko indisponible. La solution finale (backoff exponentiel + DLQ) aurait dû être intégrée dès la conception initiale plutôt qu'en correctif.


### Compétences Acquises

**DevOps End-to-End:**
Maîtrise complète du cycle CI/CD (tests automatisés, build Docker, déploiement K8s, monitoring production). Capacité à déboguer des pods Kubernetes et analyser des métriques Prometheus en production.

**Architecture Microservices:**
Compréhension approfondie de la séparation des responsabilités (API, workers, cache), gestion de la communication inter-services, et stratégies de résilience (retry, circuit breaker, cache fallback).

**Testing Stratégique:**
Différenciation entre tests unitaires, intégration et performance. Utilisation avancée de mocks (Prisma, Firebase, API externes) et fixtures pour isolation des tests. Capacité à interpréter les métriques de coverage et prioriser les tests critiques.

**Observabilité:**
Configuration de stacks de monitoring complets (logs, métriques, alerting). Création de dashboards Grafana pertinents pour diagnostiquer des incidents en production. Définition de SLOs (Service Level Objectives) basés sur des seuils P95/P99.

### Conclusion

Ce projet m'a permis de comprendre qu'un code fonctionnel ne suffit pas: la maintenabilité, l'observabilité et la sécurité sont tout aussi critiques. La dette technique frontend (tests) et les challenges Kubernetes m'ont appris l'importance d'une estimation réaliste et d'une formation continue sur les outils complexes. L'expérience DevOps acquise (CI/CD, monitoring, K8s) est directement applicable en environnement professionnel et constitue une base solide pour des architectures cloud-native à grande échelle.

---

**Fin du Rapport - Janvier 2026**  
**ARIOUI Mohamed**