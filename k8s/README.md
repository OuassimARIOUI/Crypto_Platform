# Crypto Platform - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Crypto Platform.

## Structure

```
k8s/
├── base/                    # Base manifests
│   ├── kustomization.yaml   # Kustomize configuration
│   ├── namespace.yaml       # Namespace definition
│   ├── configmap.yaml       # Configuration data
│   ├── secrets.yaml         # Sensitive data (update before deploying!)
│   ├── persistent-volumes.yaml  # Storage claims
│   ├── postgres.yaml        # PostgreSQL deployment
│   ├── redis.yaml           # Redis deployment
│   ├── backend.yaml         # Backend API deployment
│   ├── worker.yaml          # Crypto worker deployment
│   ├── frontend.yaml        # Frontend deployment
│   └── ingress.yaml         # Ingress routing
└── README.md
```

## Prerequisites

1. **Kubernetes Cluster** - minikube, kind, or cloud provider (GKE, EKS, AKS)
2. **kubectl** - Kubernetes CLI
3. **Docker Images** - Build and push images to container registry

## Quick Start

### 1. Update Configuration

Edit the following files before deploying:

```bash
# Update secrets (use your own values!)
vim k8s/base/secrets.yaml

# Update image names in kustomization.yaml
vim k8s/base/kustomization.yaml

# Update domain names in ingress.yaml
vim k8s/base/ingress.yaml
```

### 2. Create Container Registry Secret (if using private registry)

```bash
kubectl create namespace crypto-platform

kubectl create secret docker-registry ghcr-secret \
  --namespace crypto-platform \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=YOUR_EMAIL
```

### 3. Deploy with Kustomize

```bash
# Preview what will be deployed
kubectl kustomize k8s/base

# Apply the manifests
kubectl apply -k k8s/base

# Or with a specific image tag
kubectl apply -k k8s/base --set image=ghcr.io/username/crypto-backend:v1.0.0
```

### 4. Verify Deployment

```bash
# Check all resources
kubectl get all -n crypto-platform

# Check pods status
kubectl get pods -n crypto-platform -w

# Check logs
kubectl logs -f deployment/backend -n crypto-platform
kubectl logs -f deployment/frontend -n crypto-platform
kubectl logs -f deployment/crypto-worker -n crypto-platform
```

## Local Development with Minikube

```bash
# Start minikube
minikube start --cpus=4 --memory=8192

# Enable ingress addon
minikube addons enable ingress

# Build and load local images
docker build -t crypto-backend:local ./backend
docker build -t crypto-frontend:local ./frontend
minikube image load crypto-backend:local
minikube image load crypto-frontend:local

# Update kustomization to use local images
# Then apply
kubectl apply -k k8s/base

# Get minikube IP for testing
minikube ip
# Add to /etc/hosts: <minikube-ip> crypto.local api.crypto.local
```

## Useful Commands

```bash
# Scale deployments
kubectl scale deployment backend --replicas=3 -n crypto-platform

# Restart deployment (rolling restart)
kubectl rollout restart deployment/backend -n crypto-platform

# View HPA status
kubectl get hpa -n crypto-platform

# Port-forward for local testing
kubectl port-forward svc/frontend-service 3000:3000 -n crypto-platform
kubectl port-forward svc/backend-service 3004:3004 -n crypto-platform

# Access PostgreSQL
kubectl port-forward svc/postgres-service 5432:5432 -n crypto-platform

# Delete everything
kubectl delete -k k8s/base
```

## Production Considerations

1. **Secrets Management**: Use external secrets (AWS Secrets Manager, HashiCorp Vault)
2. **TLS Certificates**: Set up cert-manager with Let's Encrypt
3. **Monitoring**: Add Prometheus/Grafana stack
4. **Logging**: Add EFK/ELK stack or cloud logging
5. **Backups**: Set up CronJob for database backups
6. **Resource Limits**: Adjust based on actual usage

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n crypto-platform
kubectl logs <pod-name> -n crypto-platform --previous
```

### Database connection issues
```bash
# Check if postgres is ready
kubectl exec -it deployment/postgres -n crypto-platform -- pg_isready

# Check database URL in secret
kubectl get secret crypto-secrets -n crypto-platform -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

### Image pull errors
```bash
# Check if ghcr-secret exists
kubectl get secret ghcr-secret -n crypto-platform

# Re-create if needed
kubectl delete secret ghcr-secret -n crypto-platform
kubectl create secret docker-registry ghcr-secret ...
```
