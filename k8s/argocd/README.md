# Argo CD (GitOps)

Argo CD tourne dans le cluster et surveille `k8s/overlays/staging` sur la branche `main`.
À chaque push sur `main`, la CI construit les images, puis le job `gitops` écrit leur tag
(SHA du commit) dans `k8s/overlays/staging/kustomization.yaml`. Argo CD voit ce commit
(il interroge GitHub toutes les ~3 minutes) et met le cluster à jour tout seul.

```
push main -> CI : tests -> images GHCR -> commit "chore(gitops): deploy <sha>"
                                                   |
                         Argo CD (dans le cluster) <-- lit Git --> applique sur le cluster
```

## Installation (une seule fois, sur un cluster qui reste allumé, ex. Minikube local)

Prérequis : Docker Desktop (avec l'intégration WSL), `minikube` et `kubectl`.

```bash
# 1. Cluster (Argo CD + l'application demandent ~6 Go de RAM)
minikube start --cpus=4 --memory=6144
minikube addons enable metrics-server

# 2. Argo CD
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.5.5/manifests/install.yaml
kubectl wait deployment --all -n argocd --for=condition=Available --timeout=300s

# 3. Accès aux images privées de GHCR
#    (token GitHub "classic" avec le droit read:packages)
kubectl create namespace crypto-platform
kubectl create secret docker-registry ghcr-secret -n crypto-platform \
  --docker-server=ghcr.io \
  --docker-username=OuassimARIOUI \
  --docker-password=<TON_TOKEN_GITHUB>

# 4. L'application Argo CD
kubectl apply -f k8s/argocd/application.yaml
```

## Interface web

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Ouvrir https://localhost:8080 (accepter le certificat), utilisateur : admin
# Mot de passe :
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## Revenir à une version précédente

Annuler le commit `chore(gitops): deploy ...` concerné (`git revert <commit>` puis push) :
Argo CD redéploie les images d'avant. Le bouton **History and rollback** de l'interface
fait la même chose, mais il est désactivé tant que la synchronisation automatique est active.
