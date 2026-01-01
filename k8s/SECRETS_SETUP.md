# 🔐 Configuration des Secrets pour Kubernetes

## Prérequis GitHub Actions

Pour que le déploiement Kubernetes fonctionne via GitHub Actions, vous devez configurer les secrets suivants dans votre repository.

### 1. Secret `KUBE_CONFIG`

Ce secret contient la configuration kubectl encodée en base64 pour accéder à votre cluster Kubernetes.

#### Pour Minikube (développement local)
```bash
# Récupérer le kubeconfig
cat ~/.kube/config | base64 -w 0
```

#### Pour un cluster cloud (AKS, EKS, GKE)

**Azure AKS:**
```bash
az aks get-credentials --resource-group <rg-name> --name <cluster-name>
cat ~/.kube/config | base64 -w 0
```

**AWS EKS:**
```bash
aws eks update-kubeconfig --region <region> --name <cluster-name>
cat ~/.kube/config | base64 -w 0
```

**Google GKE:**
```bash
gcloud container clusters get-credentials <cluster-name> --zone <zone>
cat ~/.kube/config | base64 -w 0
```

### 2. Ajouter le secret dans GitHub

1. Aller dans **Settings** → **Secrets and variables** → **Actions**
2. Cliquer sur **New repository secret**
3. Nom: `KUBE_CONFIG`
4. Valeur: la sortie base64 de votre kubeconfig
5. Cliquer sur **Add secret**

---

## Secrets Kubernetes (dans le cluster)

Les secrets définis dans `k8s/base/secrets.yaml` utilisent des valeurs encodées en base64.

### Encoder vos valeurs

```bash
# Encoder une valeur
echo -n "votre-valeur" | base64

# Exemples
echo -n "crypto_admin" | base64              # Y3J5cHRvX2FkbWlu
echo -n "votre_mot_de_passe" | base64        # dm90cmVfbW90X2RlX3Bhc3Nl
echo -n "votre_jwt_secret_tres_long" | base64
```

### Valeurs à configurer

| Secret | Description | Exemple de valeur |
|--------|-------------|-------------------|
| `POSTGRES_USER` | Utilisateur PostgreSQL | `crypto_admin` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `(générer un mot de passe fort)` |
| `DATABASE_URL` | URL de connexion complète | `postgresql://user:pass@postgres:5432/crypto_db?schema=public` |
| `REDIS_URL` | URL Redis | `redis://redis:6379` |
| `JWT_SECRET` | Secret pour JWT | `(générer une clé de 32+ caractères)` |
| `FIREBASE_SERVICE_ACCOUNT` | JSON Firebase encodé | `(contenu du fichier JSON)` |

### Générer des secrets forts

```bash
# Mot de passe PostgreSQL (32 caractères)
openssl rand -base64 32

# JWT Secret (64 caractères)
openssl rand -hex 32

# Puis encoder en base64 pour le YAML
openssl rand -hex 32 | base64
```

---

## Configuration de l'environnement de production

### 1. Créer un fichier overlay de production

Créer `k8s/overlays/production/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: crypto-platform

resources:
  - ../../base

# Remplacer les secrets en production
secretGenerator:
  - name: crypto-secrets
    behavior: replace
    envs:
      - secrets.env
```

### 2. Créer le fichier secrets.env (NE PAS COMMITTER)

```env
POSTGRES_USER=crypto_admin
POSTGRES_PASSWORD=votre_vrai_mot_de_passe
DATABASE_URL=postgresql://crypto_admin:votre_vrai_mot_de_passe@postgres:5432/crypto_db?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=votre_vrai_jwt_secret
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 3. Ajouter au .gitignore

```
k8s/overlays/production/secrets.env
```

---

## Vérification

Après avoir configuré les secrets:

```bash
# Vérifier que les secrets sont créés
kubectl get secrets -n crypto-platform

# Voir les clés d'un secret (pas les valeurs)
kubectl describe secret crypto-secrets -n crypto-platform

# Décoder une valeur (pour debug uniquement)
kubectl get secret crypto-secrets -n crypto-platform -o jsonpath='{.data.POSTGRES_USER}' | base64 -d
```

---

## Rotation des secrets

Pour mettre à jour un secret:

```bash
# Mettre à jour le secret
kubectl create secret generic crypto-secrets \
  --from-literal=POSTGRES_USER=crypto_admin \
  --from-literal=POSTGRES_PASSWORD=nouveau_mot_de_passe \
  # ... autres valeurs
  --dry-run=client -o yaml | kubectl apply -n crypto-platform -f -

# Redémarrer les pods pour prendre en compte les nouvelles valeurs
kubectl rollout restart deployment/backend -n crypto-platform
kubectl rollout restart deployment/crypto-worker -n crypto-platform
```

---

## Troubleshooting

### Le pod ne démarre pas avec "secret not found"
```bash
kubectl get secrets -n crypto-platform
# Vérifier que crypto-secrets existe
```

### Erreur de connexion à la base de données
```bash
# Vérifier que DATABASE_URL est correct
kubectl logs -n crypto-platform -l app=backend --tail=50
```

### Le déploiement GitHub Actions échoue
1. Vérifier que `KUBE_CONFIG` est bien configuré
2. Vérifier que le kubeconfig n'a pas expiré (clusters cloud)
3. Vérifier les permissions du service account
