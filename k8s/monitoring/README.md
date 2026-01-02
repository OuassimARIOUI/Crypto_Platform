# 📊 Monitoring Stack - Prometheus & Grafana

Configuration de monitoring pour Crypto Platform avec Prometheus et Grafana.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cluster Kubernetes                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      scrape       ┌───────────────┐   │
│  │    Prometheus    │ ◄──────────────── │    Backend    │   │
│  │    :9090         │                   │    /metrics   │   │
│  └────────┬─────────┘                   └───────────────┘   │
│           │                                                  │
│           │ datasource                                       │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │     Grafana      │                                       │
│  │     :3000        │                                       │
│  │  (Dashboards)    │                                       │
│  └──────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Déploiement

### Prérequis
- Cluster Kubernetes fonctionnel
- kubectl configuré
- L'application Crypto Platform déployée

### Installation

```bash
# 1. Déployer le stack de monitoring
kubectl apply -k k8s/monitoring

# 2. Vérifier que les pods sont running
kubectl get pods -n monitoring

# 3. Attendre que tout soit prêt
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s
```

### Accès local (Minikube)

```bash
# Option 1: Port-forward Grafana
kubectl port-forward svc/grafana-service -n monitoring 3001:3000

# Option 2: Port-forward Prometheus
kubectl port-forward svc/prometheus-service -n monitoring 9090:9090

# Option 3: Avec Ingress (ajouter au /etc/hosts)
echo "$(minikube ip) grafana.crypto.local prometheus.crypto.local" | sudo tee -a /etc/hosts
```

## 🔐 Credentials par défaut

| Service | Username | Password |
|---------|----------|----------|
| Grafana | admin | CryptoAdmin123! |

> ⚠️ **Changez le mot de passe en production !**

## 📈 Métriques disponibles

### HTTP Metrics
| Métrique | Type | Description |
|----------|------|-------------|
| `http_requests_total` | Counter | Nombre total de requêtes HTTP |
| `http_request_duration_seconds` | Histogram | Durée des requêtes HTTP |
| `http_active_connections` | Gauge | Connexions HTTP actives |

### Database Metrics
| Métrique | Type | Description |
|----------|------|-------------|
| `db_queries_total` | Counter | Nombre total de requêtes DB |
| `db_query_duration_seconds` | Histogram | Durée des requêtes DB |

### Business Metrics
| Métrique | Type | Description |
|----------|------|-------------|
| `crypto_price_updates_total` | Counter | Mises à jour de prix crypto |
| `active_users` | Gauge | Utilisateurs actifs |
| `alerts_triggered_total` | Counter | Alertes déclenchées |
| `portfolio_value_total_usd` | Gauge | Valeur totale des portfolios |

## 📊 Dashboards Grafana

### Dashboard principal
Le dashboard "Crypto Platform Dashboard" inclut :

1. **Overview Row**
   - CPU Usage total
   - Memory Usage total
   - Running Pods count
   - Backend Status (UP/DOWN)

2. **HTTP Metrics Row**
   - Requests Rate par méthode
   - Response Time (p50, p95)

3. **Resources Row**
   - Memory par pod
   - CPU par pod

## 🚨 Alertes configurées

| Alerte | Seuil | Sévérité |
|--------|-------|----------|
| HighCPUUsage | > 80% pendant 5min | Warning |
| HighMemoryUsage | > 80% pendant 5min | Warning |
| PodNotReady | Non ready > 5min | Critical |
| HighErrorRate | > 5% erreurs 5xx | Critical |
| BackendDown | down > 1min | Critical |

## 🔧 Configuration

### Ajouter un nouveau scrape target

Éditer `k8s/monitoring/prometheus/configmap.yaml` :

```yaml
scrape_configs:
  - job_name: 'my-new-service'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - crypto-platform
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_name]
        action: keep
        regex: my-service-name
```

### Ajouter des annotations Prometheus aux pods

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3004"
    prometheus.io/path: "/metrics"
```

## 🐛 Troubleshooting

### Prometheus ne scrape pas les métriques

```bash
# Vérifier les targets
kubectl port-forward svc/prometheus-service -n monitoring 9090:9090
# Aller sur http://localhost:9090/targets

# Vérifier les logs
kubectl logs -l app=prometheus -n monitoring

# Tester l'endpoint /metrics du backend
kubectl exec -it deploy/backend -n crypto-platform -- wget -qO- http://localhost:3004/metrics
```

### Grafana ne se connecte pas à Prometheus

```bash
# Vérifier la datasource
kubectl get cm grafana-datasources -n monitoring -o yaml

# Vérifier que Prometheus est accessible
kubectl exec -it deploy/grafana -n monitoring -- wget -qO- http://prometheus-service:9090/-/healthy
```

### Les dashboards ne s'affichent pas

```bash
# Vérifier les ConfigMaps
kubectl get cm -n monitoring

# Redémarrer Grafana
kubectl rollout restart deployment/grafana -n monitoring
```

## 📁 Structure des fichiers

```
k8s/monitoring/
├── namespace.yaml              # Namespace monitoring
├── kustomization.yaml          # Config Kustomize
├── ingress.yaml               # Ingress pour accès externe
├── prometheus/
│   ├── rbac.yaml              # ServiceAccount & ClusterRole
│   ├── configmap.yaml         # Config Prometheus + alertes
│   └── deployment.yaml        # Deployment + PVC + Service
└── grafana/
    ├── configmap.yaml         # Datasources config
    ├── dashboards.yaml        # Dashboard JSON
    └── deployment.yaml        # Deployment + PVC + Service
```

## 🔗 Liens utiles

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
