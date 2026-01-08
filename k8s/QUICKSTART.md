# Guide Rapide - Lancer le Monitoring

## Prérequis
- Minikube installé et démarré
- kubectl configuré

## Commandes pour lancer Grafana & Prometheus

```bash
# 1. Démarrer Minikube (si pas déjà fait)
minikube start --driver=docker

# 2. Déployer le stack de monitoring
kubectl apply -k k8s/monitoring

# 3. Vérifier que les pods sont Running
kubectl get pods -n monitoring

# 4. Lancer Grafana (port-forward)
kubectl port-forward svc/grafana-service -n monitoring 3001:3000

# 5. Accéder à Grafana
# URL: http://localhost:3001
# Username: admin
# Password: CryptoAdmin123!
```

## Commandes pour Prometheus (optionnel)

```bash
# Dans un autre terminal
kubectl port-forward svc/prometheus-service -n monitoring 9090:9090

# URL: http://localhost:9090
```

## Commandes utiles

```bash
# Voir les pods du monitoring
kubectl get pods -n monitoring

# Voir les logs Grafana
kubectl logs -l app=grafana -n monitoring

# Voir les logs Prometheus
kubectl logs -l app=prometheus -n monitoring

# Redémarrer Grafana
kubectl rollout restart deployment/grafana -n monitoring

# Supprimer le monitoring
kubectl delete -k k8s/monitoring
```

## Déployer l'application Crypto Platform

```bash
# 1. Charger les images Docker dans Minikube
minikube image load crypto_platform-backend:latest
minikube image load crypto_platform-frontend:latest
minikube image load crypto_platform-worker:latest

# 2. Déployer l'application
kubectl apply -k k8s/base

# 3. Vérifier les pods
kubectl get pods -n crypto-platform

# 4. Accéder au backend
kubectl port-forward svc/backend-service -n crypto-platform 3004:3004

# 5. Accéder au frontend
kubectl port-forward svc/frontend-service -n crypto-platform 3000:3000
```

## Voir les métriques

Une fois le backend déployé dans K8s :
1. Aller sur Grafana → Dashboards → Crypto Platform Dashboard
2. Les métriques s'afficheront automatiquement
