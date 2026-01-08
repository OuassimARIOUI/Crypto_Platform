# Documentation CI/CD Pipeline

Auteur: ARIOUI Achraf
Date: 8 Janvier 2026
Version: 1.0.0

---

## Vue d'ensemble

Cette documentation décrit le pipeline CI/CD complet de la plateforme de trading crypto, incluant l'intégration continue avec GitHub Actions et le déploiement continu sur Kubernetes.

Le pipeline automatise :
- Les tests unitaires et d'intégration
- La génération de rapports de couverture de code
- La construction d'images Docker
- Le déploiement sur Kubernetes (Minikube/Production)
- Les sauvegardes automatiques de base de données
- Le monitoring avec Prometheus et Grafana

---

## Architecture CI/CD

### Workflow GitHub Actions

**Fichier** : `.github/workflows/ci.yml`

Le pipeline se compose de 5 jobs principaux exécutés séquentiellement ou en parallèle :

```
[Backend Tests] ──┐
                  ├──> [Docker Build] ──> [K8s Deploy] ──> [Monitoring]
[Frontend Tests]──┘           │
                              │
[Database Backup] ────────────┘
                              │
[K8s Dry Run] ────────────────┘ (Pull Requests uniquement)
```

### Déclencheurs

Le pipeline s'exécute automatiquement dans les cas suivants :

1. **Push sur n'importe quelle branche** : Tests backend et frontend uniquement
2. **Pull Request vers main ou DEV** : Tests + validation Kubernetes (dry-run)
3. **Push sur main ou DEV** : Pipeline complet (tests, build, deploy)
4. **Planification automatique** : Backup quotidien à 2h UTC
5. **Manuel** : Via l'interface GitHub Actions (workflow_dispatch)

---

## Jobs du Pipeline

### 1. Backend Tests

**Objectif** : Valider le code backend avec tests unitaires et intégration.

**Services Docker** :
- PostgreSQL 16 (port 5432)
- Redis (port 6379)

**Étapes** :
1. Checkout du code source
2. Installation de Node.js 20 avec cache npm
3. Installation des dépendances (`npm ci`)
4. Exécution des tests unitaires avec couverture (`npm run test:coverage`)
5. Préparation de la base de données pour tests d'intégration
6. Exécution des tests d'intégration avec couverture
7. Upload des artefacts de couverture (rétention 30 jours)

**Variables d'environnement** :
```yaml
NODE_ENV: test
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/crypto_test
JWT_SECRET: test_jwt_secret
REDIS_URL: redis://localhost:6379
FIREBASE_DISABLED: "true"
```

**Durée moyenne** : 3-5 minutes

---

### 2. Frontend Tests

**Objectif** : Valider le code frontend avec tests unitaires et lint.

**Étapes** :
1. Checkout du code source
2. Installation de Node.js 20 avec cache npm
3. Installation des dépendances (`npm ci`)
4. Vérification du linting (`npm run lint`)
5. Exécution des tests avec couverture (`npm run test:coverage`)
6. Upload des artefacts de couverture (rétention 30 jours)

**Durée moyenne** : 2-4 minutes

---

### 3. Docker Build

**Objectif** : Construire et publier les images Docker sur GitHub Container Registry.

**Pré-requis** : Jobs backend et frontend réussis.

**Conditions d'exécution** :
- Push sur `main` ou `DEV`
- Backup planifié
- Déclenchement manuel

**Images construites** :
1. **Backend** :
   - Tag: `ghcr.io/[repo]/backend:latest`
   - Tag: `ghcr.io/[repo]/backend:[commit-sha]`
   - Context: `./backend`

2. **Frontend** :
   - Tag: `ghcr.io/[repo]/frontend:latest`
   - Tag: `ghcr.io/[repo]/frontend:[commit-sha]`
   - Context: `./frontend`
   - Build args: `NEXT_PUBLIC_FIREBASE_API_KEY`

**Optimisations** :
- Docker Buildx pour builds multi-plateforme
- Cache GitHub Actions pour accélérer les builds
- Mode `cache-to: type=gha,mode=max`

**Durée moyenne** : 5-8 minutes

---

### 4. Database Backup

**Objectif** : Créer une sauvegarde compressée de la base de données.

**Conditions d'exécution** :
- Backup planifié quotidien (2h UTC)
- Déclenchement manuel
- Push sur `main` ou `DEV`

**Processus** :
1. Démarrage d'un service PostgreSQL temporaire
2. Création d'un dump avec `pg_dump`
3. Compression gzip du dump
4. Nom du fichier : `crypto_backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
5. Upload comme artefact GitHub (rétention 30 jours)

**Variables d'environnement** :
```yaml
PGHOST: localhost
PGUSER: postgres
PGPASSWORD: postgres
PGDATABASE: crypto
```

**Durée moyenne** : 2-3 minutes

---

### 5. Deploy Kubernetes

**Objectif** : Déployer l'application complète sur Kubernetes (Minikube).

**Pré-requis** : Job Docker Build réussi.

**Conditions d'exécution** : Push sur `main` ou `DEV` uniquement.

**Infrastructure Minikube** :
- Version Kubernetes: v1.28.0
- Driver: Docker
- CPU: 2 cores
- RAM: 4096 MB
- Addons: ingress, metrics-server

**Étapes de déploiement** :

#### 5.1 Préparation
1. Setup Minikube avec configuration optimisée
2. Activation des addons (ingress, metrics-server)
3. Configuration Docker pour utiliser le démon Minikube

#### 5.2 Construction des images
```bash
eval $(minikube docker-env)
docker build -t crypto_platform-backend:latest ./backend
docker build -t crypto_platform-frontend:latest ./frontend
```

#### 5.3 Déploiement avec Kustomize
```bash
kubectl apply -k k8s/base
```

Ressources déployées :
- Namespace `crypto-platform`
- ConfigMap (variables d'environnement)
- Secrets (credentials)
- PersistentVolumes et PersistentVolumeClaims
- Deployments: PostgreSQL, Redis, Backend (2 replicas), Frontend (2 replicas), Worker
- Services: ClusterIP pour chaque composant
- Ingress: Routage HTTP/HTTPS
- HorizontalPodAutoscalers: Auto-scaling

#### 5.4 Vérification du déploiement
Attente de la disponibilité des pods (timeout 120-180s) :
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n crypto-platform
kubectl wait --for=condition=ready pod -l app=redis -n crypto-platform
kubectl wait --for=condition=ready pod -l app=backend -n crypto-platform
kubectl wait --for=condition=ready pod -l app=frontend -n crypto-platform
kubectl wait --for=condition=ready pod -l app=crypto-worker -n crypto-platform
```

#### 5.5 Smoke Tests
```bash
# Test Backend Health
kubectl port-forward svc/backend 3004:3004 -n crypto-platform
curl -f http://localhost:3004/health

# Test Frontend
kubectl port-forward svc/frontend 3000:3000 -n crypto-platform
curl -f http://localhost:3000
```

#### 5.6 Déploiement Monitoring
```bash
kubectl apply -k k8s/monitoring
```

Stack monitoring déployé :
- Prometheus (port 30090)
- Grafana (port 30030)
- Node Exporter
- Metrics Server

**URLs d'accès** :
```
Application: http://[MINIKUBE_IP]
Prometheus:  http://[MINIKUBE_IP]:30090
Grafana:     http://[MINIKUBE_IP]:30030
```

**Durée moyenne** : 8-12 minutes

---

### 6. Kubernetes Dry Run

**Objectif** : Valider les manifestes Kubernetes sans déploiement réel.

**Conditions d'exécution** : Pull Requests uniquement.

**Validations** :
1. Génération des manifestes avec Kustomize
2. Validation de la syntaxe YAML
3. Vérification de la présence de tous les fichiers requis

**Fichiers vérifiés** :
- `namespace.yaml`
- `configmap.yaml`
- `secrets.yaml`
- `persistent-volumes.yaml`
- `postgres.yaml`
- `redis.yaml`
- `backend.yaml`
- `worker.yaml`
- `frontend.yaml`
- `ingress.yaml`
- `kustomization.yaml`

**Durée moyenne** : 1 minute

---

## Configuration Kubernetes

### Structure des dossiers

```
k8s/
├── base/                    # Configuration de base
│   ├── namespace.yaml       # Namespace crypto-platform
│   ├── configmap.yaml       # Variables d'environnement non-sensibles
│   ├── secrets.yaml         # Credentials et secrets
│   ├── persistent-volumes.yaml  # Volumes persistants
│   ├── postgres.yaml        # Base de données PostgreSQL
│   ├── redis.yaml           # Cache Redis
│   ├── backend.yaml         # API Backend (2 replicas)
│   ├── worker.yaml          # Worker BullMQ
│   ├── frontend.yaml        # Frontend Next.js (2 replicas)
│   ├── ingress.yaml         # Routage HTTP
│   └── kustomization.yaml   # Configuration Kustomize
├── overlays/                # Environnements spécifiques
│   ├── staging/             # Configuration staging
│   └── production/          # Configuration production
└── monitoring/              # Stack monitoring
    ├── prometheus/          # Configuration Prometheus
    ├── grafana/             # Configuration Grafana
    └── kustomization.yaml
```

---

## Ressources Kubernetes Détaillées

### Backend Deployment

**Fichier** : `k8s/base/backend.yaml`

**Configuration** :
- Replicas: 2 (haute disponibilité)
- Strategy: RollingUpdate (maxSurge: 1, maxUnavailable: 0)
- Image: `crypto_platform-backend:latest`
- Port: 3004

**Init Containers** :
1. **wait-for-postgres** : Attend la disponibilité de PostgreSQL
2. **prisma-migrate** : Applique les migrations Prisma automatiquement

**Container Principal** :
```yaml
Resources:
  requests:
    memory: 256Mi
    cpu: 100m
  limits:
    memory: 512Mi
    cpu: 500m

Probes:
  livenessProbe: /health (après 30s, toutes les 10s)
  readinessProbe: /health (après 10s, toutes les 5s)
```

**Variables d'environnement** :
- `NODE_ENV` (depuis ConfigMap)
- `PORT` (depuis ConfigMap)
- `DATABASE_URL` (depuis Secret)
- `REDIS_URL` (depuis Secret)
- `JWT_SECRET` (depuis Secret)

**Service** :
- Type: ClusterIP
- Port: 3004
- Selector: `app=backend`

**HorizontalPodAutoscaler** :
- Min replicas: 2
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

---

### Frontend Deployment

**Fichier** : `k8s/base/frontend.yaml`

**Configuration** :
- Replicas: 2
- Strategy: RollingUpdate
- Image: `crypto_platform-frontend:latest`
- Port: 3000

**Init Container** :
- **wait-for-backend** : Attend la disponibilité du Backend

**Container Principal** :
```yaml
Resources:
  requests:
    memory: 256Mi
    cpu: 100m
  limits:
    memory: 512Mi
    cpu: 500m

Probes:
  livenessProbe: / (après 30s, toutes les 10s)
  readinessProbe: / (après 10s, toutes les 5s)
```

**Variables d'environnement** :
- `NEXT_PUBLIC_API_BASE`: URL publique de l'API
- `API_BASE_URL`: URL interne vers le Backend (http://backend-service:3004)

**Service** :
- Type: ClusterIP
- Port: 3000

**HorizontalPodAutoscaler** :
- Min replicas: 2
- Max replicas: 5
- CPU target: 70%

---

### PostgreSQL Deployment

**Fichier** : `k8s/base/postgres.yaml`

**Configuration** :
- Replicas: 1 (StatefulSet recommandé pour production)
- Strategy: Recreate (évite la corruption de données)
- Image: `postgres:16`
- Port: 5432

**Container** :
```yaml
Resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m

Volumes:
  - postgres-data (PersistentVolumeClaim)
  
Mount Path: /var/lib/postgresql/data

Probes:
  livenessProbe: pg_isready (après 30s)
  readinessProbe: pg_isready (après 5s)
```

**Variables d'environnement** :
- `POSTGRES_USER` (depuis Secret)
- `POSTGRES_PASSWORD` (depuis Secret)
- `POSTGRES_DB` (depuis ConfigMap)
- `PGDATA`: `/var/lib/postgresql/data/pgdata`

**PersistentVolumeClaim** :
- Nom: `postgres-pvc`
- Storage: 5Gi
- Access Mode: ReadWriteOnce

**Service** :
- Type: ClusterIP
- Port: 5432

---

### Redis Deployment

**Fichier** : `k8s/base/redis.yaml`

**Configuration** :
- Replicas: 1
- Strategy: Recreate
- Image: `redis:alpine`
- Port: 6379

**Command** :
```yaml
redis-server
  --appendonly yes           # Persistence AOF
  --maxmemory 128mb          # Limite mémoire
  --maxmemory-policy allkeys-lru  # Éviction LRU
```

**Container** :
```yaml
Resources:
  requests:
    memory: 64Mi
    cpu: 50m
  limits:
    memory: 256Mi
    cpu: 200m

Volumes:
  - redis-data (PersistentVolumeClaim)

Mount Path: /data

Probes:
  livenessProbe: redis-cli ping
  readinessProbe: redis-cli ping
```

**PersistentVolumeClaim** :
- Nom: `redis-pvc`
- Storage: 1Gi
- Access Mode: ReadWriteOnce

**Service** :
- Type: ClusterIP
- Port: 6379

---

### Worker Deployment

**Fichier** : `k8s/base/worker.yaml`

**Configuration** :
- Replicas: 1
- Strategy: RollingUpdate
- Image: `crypto_platform-worker:latest` (utilise l'image backend)
- Command: `node src/workers/crypto.worker.js`

**Init Containers** :
1. **wait-for-postgres** : Attend PostgreSQL
2. **wait-for-redis** : Attend Redis
3. **prisma-migrate** : Applique les migrations

**Container** :
```yaml
Resources:
  requests:
    memory: 128Mi
    cpu: 50m
  limits:
    memory: 256Mi
    cpu: 200m

Probes:
  livenessProbe: node -e "console.log('healthy')"
```

**Variables d'environnement** :
- `NODE_ENV` (depuis ConfigMap)
- `DATABASE_URL` (depuis Secret)
- `REDIS_URL` (depuis Secret)

---

### Ingress Configuration

**Fichier** : `k8s/base/ingress.yaml`

**Annotations Nginx** :
```yaml
kubernetes.io/ingress.class: nginx
nginx.ingress.kubernetes.io/ssl-redirect: "true"
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
nginx.ingress.kubernetes.io/proxy-send-timeout: "60"

# Rate Limiting
nginx.ingress.kubernetes.io/limit-rps: "100"
nginx.ingress.kubernetes.io/limit-connections: "50"

# CORS
nginx.ingress.kubernetes.io/enable-cors: "true"
nginx.ingress.kubernetes.io/cors-allow-origin: "*"
```

**Routes** :
1. **Frontend** : `crypto.your-domain.com` → `frontend-service:3000`
2. **Backend API** : `api.crypto.your-domain.com` → `backend-service:3004`

**TLS** (à configurer) :
```yaml
tls:
  - hosts:
      - crypto.your-domain.com
      - api.crypto.your-domain.com
    secretName: crypto-tls-secret
```

---

## Monitoring et Observabilité

### Stack Prometheus + Grafana

**Déploiement** : `kubectl apply -k k8s/monitoring`

**Composants** :

#### Prometheus
- Port: 9090 (NodePort 30090)
- Scraping interval: 15s
- Retention: 15 jours
- Targets automatiques : Pods avec annotation `prometheus.io/scrape: "true"`

**Métriques collectées** :
- Métriques système (CPU, RAM, Disk, Network)
- Métriques applicatives Backend (requests, latency, errors)
- Métriques PostgreSQL (connexions, queries, cache)
- Métriques Redis (memory, commands, keys)
- Métriques Kubernetes (pods, deployments, nodes)

#### Grafana
- Port: 3000 (NodePort 30030)
- Credentials par défaut : admin/admin
- Dashboards pré-configurés :
  - Kubernetes Cluster Monitoring
  - Application Performance (Backend)
  - PostgreSQL Database Metrics
  - Redis Cache Metrics
  - Node Exporter Full

**Accès local** :
```bash
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
kubectl port-forward svc/grafana 3001:3000 -n monitoring
```

---

## Sécurité

### Secrets Management

**Fichier** : `k8s/base/secrets.yaml`

Les secrets sont encodés en base64 :
```bash
echo -n "ma-valeur" | base64
```

**Secrets requis** :
- `DATABASE_URL` : URL complète PostgreSQL
- `REDIS_URL` : URL complète Redis
- `JWT_SECRET` : Secret pour signature JWT
- `POSTGRES_USER` : Utilisateur PostgreSQL
- `POSTGRES_PASSWORD` : Mot de passe PostgreSQL
- `FIREBASE_PRIVATE_KEY` : Clé privée Firebase Admin SDK
- `DISCORD_CLIENT_SECRET` : Secret OAuth Discord
- `COINGECKO_API_KEY` : Clé API CoinGecko

**Fichier de configuration** : `k8s/SECRETS_SETUP.md`

### Recommandations Production

1. **Secrets externes** : Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager, Azure Key Vault)
2. **TLS** : Activer HTTPS avec cert-manager et Let's Encrypt
3. **Network Policies** : Restreindre la communication inter-pods
4. **RBAC** : Configurer les permissions Kubernetes
5. **Image Registry privé** : Utiliser `imagePullSecrets`
6. **Security Context** : Exécuter les containers en utilisateur non-root

---

## Gestion des Environnements

### Staging

**Dossier** : `k8s/overlays/staging/`

**Particularités** :
- Replicas réduits (1 backend, 1 frontend)
- Ressources réduites (moins de CPU/RAM)
- Base de données partagée ou temporaire
- Domain: `staging.crypto.your-domain.com`

**Déploiement** :
```bash
kubectl apply -k k8s/overlays/staging
```

### Production

**Dossier** : `k8s/overlays/production/`

**Particularités** :
- Replicas élevés (3+ backend, 2+ frontend)
- Ressources optimisées
- Base de données PostgreSQL avec réplication
- Redis Cluster (si volume élevé)
- Backups automatiques fréquents
- Monitoring avancé avec alertes
- TLS/SSL activé
- Rate limiting strict
- Domain: `crypto.your-domain.com`

**Déploiement** :
```bash
kubectl apply -k k8s/overlays/production
```

---

## Opérations Courantes

### Déployer une nouvelle version

```bash
# Build et push images Docker
docker build -t ghcr.io/[repo]/backend:v1.2.3 ./backend
docker push ghcr.io/[repo]/backend:v1.2.3

# Mettre à jour le tag dans kustomization.yaml
cd k8s/base
kustomize edit set image crypto_platform-backend=ghcr.io/[repo]/backend:v1.2.3

# Appliquer
kubectl apply -k k8s/base
```

### Rollback d'un déploiement

```bash
# Voir l'historique
kubectl rollout history deployment/backend -n crypto-platform

# Rollback vers la version précédente
kubectl rollout undo deployment/backend -n crypto-platform

# Rollback vers une révision spécifique
kubectl rollout undo deployment/backend --to-revision=3 -n crypto-platform
```

### Scaling manuel

```bash
# Scaler le backend à 5 replicas
kubectl scale deployment backend --replicas=5 -n crypto-platform

# Scaler le frontend
kubectl scale deployment frontend --replicas=3 -n crypto-platform
```

### Consulter les logs

```bash
# Logs Backend
kubectl logs -f deployment/backend -n crypto-platform

# Logs Worker
kubectl logs -f deployment/crypto-worker -n crypto-platform

# Logs Frontend
kubectl logs -f deployment/frontend -n crypto-platform

# Logs PostgreSQL
kubectl logs -f deployment/postgres -n crypto-platform

# Logs d'un pod spécifique
kubectl logs -f [pod-name] -n crypto-platform
```

### Exécuter des commandes dans un pod

```bash
# Shell dans le backend
kubectl exec -it deployment/backend -n crypto-platform -- /bin/sh

# Exécuter une migration Prisma
kubectl exec -it deployment/backend -n crypto-platform -- npx prisma migrate deploy

# Accéder à PostgreSQL
kubectl exec -it deployment/postgres -n crypto-platform -- psql -U postgres -d crypto

# Accéder à Redis CLI
kubectl exec -it deployment/redis -n crypto-platform -- redis-cli
```

### Backup et Restore

**Backup manuel** :
```bash
# Backup PostgreSQL
kubectl exec deployment/postgres -n crypto-platform -- pg_dump -U postgres crypto | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup Redis
kubectl exec deployment/redis -n crypto-platform -- redis-cli SAVE
kubectl cp crypto-platform/[redis-pod]:/data/dump.rdb ./backup_redis_$(date +%Y%m%d).rdb
```

**Restore** :
```bash
# Restore PostgreSQL
gunzip -c backup_20260108.sql.gz | kubectl exec -i deployment/postgres -n crypto-platform -- psql -U postgres crypto

# Restore Redis
kubectl cp ./backup_redis_20260108.rdb crypto-platform/[redis-pod]:/data/dump.rdb
kubectl exec deployment/redis -n crypto-platform -- redis-cli SHUTDOWN NOSAVE
kubectl delete pod [redis-pod] -n crypto-platform  # Redémarre automatiquement
```

### Monitoring et Debugging

```bash
# Voir l'état des ressources
kubectl get all -n crypto-platform

# Décrire un pod
kubectl describe pod [pod-name] -n crypto-platform

# Événements récents
kubectl get events -n crypto-platform --sort-by='.lastTimestamp'

# Utilisation des ressources
kubectl top pods -n crypto-platform
kubectl top nodes

# Port-forwarding pour accès local
kubectl port-forward svc/backend 3004:3004 -n crypto-platform
kubectl port-forward svc/frontend 3000:3000 -n crypto-platform
kubectl port-forward svc/postgres-service 5432:5432 -n crypto-platform
kubectl port-forward svc/redis-service 6379:6379 -n crypto-platform
```

---

## Troubleshooting

### Pods en CrashLoopBackOff

**Diagnostic** :
```bash
kubectl describe pod [pod-name] -n crypto-platform
kubectl logs [pod-name] -n crypto-platform --previous
```

**Causes fréquentes** :
- Base de données non disponible → Vérifier les init containers
- Variables d'environnement manquantes → Vérifier secrets et configmaps
- Migrations Prisma échouées → Vérifier les logs du init container
- Port déjà utilisé → Vérifier les conflits de ports

### Images non trouvées (ImagePullBackOff)

**Diagnostic** :
```bash
kubectl describe pod [pod-name] -n crypto-platform
```

**Solutions** :
- Vérifier le nom de l'image dans le deployment
- Configurer `imagePullSecrets` si registry privé
- Vérifier que l'image existe sur le registry

### Performances dégradées

**Vérifications** :
```bash
# Utilisation CPU/RAM
kubectl top pods -n crypto-platform

# Logs pour identifier les requêtes lentes
kubectl logs deployment/backend -n crypto-platform | grep "slow"

# Vérifier les métriques Prometheus
# Ouvrir Grafana et consulter les dashboards
```

**Solutions** :
- Augmenter les ressources (requests/limits)
- Scaler horizontalement (plus de replicas)
- Optimiser les requêtes base de données
- Activer le cache Redis

### Base de données corrompue

**Restauration** :
```bash
# Sauvegarder l'état actuel
kubectl exec deployment/postgres -n crypto-platform -- pg_dump -U postgres crypto > corrupt_dump.sql

# Supprimer et recréer la base
kubectl exec -it deployment/postgres -n crypto-platform -- psql -U postgres
DROP DATABASE crypto;
CREATE DATABASE crypto;
\q

# Restaurer depuis un backup valide
gunzip -c backup_valid.sql.gz | kubectl exec -i deployment/postgres -n crypto-platform -- psql -U postgres crypto
```

---

## Métriques et KPIs

### Performance Tracking

**Métriques Backend** :
- Request Rate : Requêtes/seconde
- Response Time : p50, p95, p99
- Error Rate : Pourcentage d'erreurs 4xx/5xx
- Availability : Uptime %

**Métriques Infrastructure** :
- CPU Usage : Utilisation par pod
- Memory Usage : Utilisation par pod
- Network I/O : Trafic entrant/sortant
- Disk I/O : Lectures/écritures PostgreSQL

**Métriques Applicatives** :
- Active Users : Connexions SSE actives
- Trade Volume : Nombre de transactions/jour
- Price Updates : Fréquence de mise à jour des prix
- Alert Triggers : Alertes déclenchées/jour

### Alertes Recommandées

**Critique** :
- Pod crashant (CrashLoopBackOff)
- PostgreSQL down
- Redis down
- Disk usage > 90%
- API error rate > 5%

**Warning** :
- CPU usage > 80%
- Memory usage > 80%
- API latency p95 > 500ms
- Pod restart récent

---

## Coûts et Optimisation

### Ressources Recommandées par Environnement

**Staging** :
- 1 Node : 2 CPU, 4 GB RAM
- Total requests : ~1 CPU, ~1.5 GB RAM

**Production** :
- 3 Nodes : 4 CPU, 8 GB RAM chacun
- Total requests : ~4 CPU, ~6 GB RAM
- Auto-scaling jusqu'à ~10 CPU, ~15 GB RAM

### Optimisations

1. **Cache Redis** : Réduire les requêtes PostgreSQL
2. **Image caching** : Utiliser les layers Docker existants
3. **Horizontal Pod Autoscaling** : Scaler selon la charge
4. **Resource limits** : Éviter le gaspillage de ressources
5. **Compression** : Activer gzip dans Nginx Ingress
6. **CDN** : Utiliser un CDN pour les assets frontend

---

## Maintenance

### Mises à jour

**Kubernetes** :
```bash
# Mettre à jour Minikube
minikube stop
minikube delete
minikube start --kubernetes-version=v1.29.0
```

**PostgreSQL** :
```bash
# Backup avant mise à jour
kubectl exec deployment/postgres -n crypto-platform -- pg_dump -U postgres crypto > backup_before_upgrade.sql

# Mettre à jour l'image dans postgres.yaml
image: postgres:17

# Appliquer
kubectl apply -f k8s/base/postgres.yaml
```

**Dependencies Node.js** :
```bash
# Backend
cd backend
npm update
npm audit fix
npm test

# Frontend
cd frontend
npm update
npm audit fix
npm test

# Rebuild images
docker build -t backend:latest ./backend
docker build -t frontend:latest ./frontend
```

---

## Annexes

### Commandes Utiles

```bash
# Créer un namespace
kubectl create namespace crypto-platform

# Appliquer tous les manifestes
kubectl apply -k k8s/base

# Supprimer toutes les ressources
kubectl delete -k k8s/base

# Voir les secrets
kubectl get secrets -n crypto-platform

# Décoder un secret
kubectl get secret crypto-secrets -n crypto-platform -o jsonpath='{.data.JWT_SECRET}' | base64 -d

# Restart d'un deployment
kubectl rollout restart deployment/backend -n crypto-platform

# Watch les pods en temps réel
kubectl get pods -n crypto-platform -w

# Afficher les variables d'environnement
kubectl exec deployment/backend -n crypto-platform -- env

# Tester la connectivité réseau
kubectl run tmp --image=busybox -it --rm -n crypto-platform -- sh
```

### Liens Utiles

**Documentation officielle** :
- Kubernetes: https://kubernetes.io/docs/
- Kustomize: https://kustomize.io/
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/

**Outils** :
- k9s : Interface TUI pour Kubernetes
- kubectx : Changement rapide de contexte
- Lens : IDE Kubernetes
- Stern : Logs multi-pods

---

## Conclusion

Ce pipeline CI/CD automatise entièrement le cycle de développement, des tests au déploiement en production. L'architecture Kubernetes assure la scalabilité, la haute disponibilité et la résilience de la plateforme.

Pour toute question ou amélioration, consulter la documentation technique ou contacter l'équipe DevOps.
