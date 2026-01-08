# Configuration des Alertes Email - AlertManager

## IMPORTANT : Configuration Gmail requise

Pour que les alertes soient envoyées à **u4820065201@gmail.com**, tu dois configurer un **App Password Gmail**.

---

## Étape 1 : Créer un App Password Gmail

### Option A : Utiliser un compte Gmail existant

1. Va sur ton compte Google : https://myaccount.google.com/
2. Clique sur **Sécurité** dans le menu de gauche
3. Active la **Validation en deux étapes** (si pas déjà fait)
4. Cherche **Mots de passe des applications**
5. Sélectionne :
   - Application : **Autre (nom personnalisé)**
   - Nom : **Crypto Platform Alerts**
6. Clique sur **Générer**
7. **COPIE LE MOT DE PASSE** (16 caractères, ex: `abcd efgh ijkl mnop`)

### Option B : Créer un compte Gmail dédié

1. Créer un nouveau compte Gmail : `crypto-platform-alerts@gmail.com`
2. Suivre les mêmes étapes que l'Option A

---

## Étape 2 : Configurer le Secret Kubernetes

### Créer le secret avec le mot de passe Gmail

```bash
# Remplace YOUR_APP_PASSWORD par le mot de passe généré (sans espaces)
kubectl create secret generic alertmanager-email-secret \
  --from-literal=smtp-password='abcdefghijklmnop' \
  -n monitoring
```

**Exemple** :
```bash
kubectl create secret generic alertmanager-email-secret \
  --from-literal=smtp-password='xyzw1234abcd5678' \
  -n monitoring
```

---

## Étape 3 : Modifier AlertManager pour utiliser le Secret

Modifie [k8s/monitoring/alertmanager/configmap.yaml](k8s/monitoring/alertmanager/configmap.yaml) :

**Remplace** `auth_password: 'YOUR_APP_PASSWORD_HERE'` par une référence au secret :

```yaml
# Cette approche NE FONCTIONNE PAS dans ConfigMap
# Il faut monter le secret dans le deployment

# Solution : Passer en variable d'environnement
```

---

## Étape 4 : Modifier le Deployment AlertManager

Modifie [k8s/monitoring/alertmanager/deployment.yaml](k8s/monitoring/alertmanager/deployment.yaml) :

```yaml
spec:
  containers:
    - name: alertmanager
      env:
        - name: SMTP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: alertmanager-email-secret
              key: smtp-password
```

---

## Solution Simple : Mettre le mot de passe directement (DEV uniquement)

**Pour tester rapidement en DEV**, remplace dans [alertmanager/configmap.yaml](alertmanager/configmap.yaml) :

```yaml
auth_password: 'ton_app_password_gmail_ici'
```

**Exemple** :
```yaml
email_configs:
  - to: 'u4820065201@gmail.com'
    from: 'crypto-platform-alerts@gmail.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'crypto-platform-alerts@gmail.com'
    auth_password: 'abcd efgh ijkl mnop'  # Ton App Password Gmail
```

**ATTENTION** : Ne jamais commit ce mot de passe sur GitHub ! Ajouter à `.gitignore`.

---

## Tester l'envoi d'email

### 1. Déployer AlertManager

```bash
kubectl apply -k k8s/monitoring
kubectl get pods -n monitoring
```

### 2. Vérifier les logs AlertManager

```bash
kubectl logs -f deployment/alertmanager -n monitoring
```

Tu devrais voir :
```
level=info msg="Sending email to: u4820065201@gmail.com"
```

### 3. Déclencher une alerte de test

```bash
# Port-forward vers Prometheus
kubectl port-forward svc/prometheus-service -n monitoring 9090:9090

# Ouvrir http://localhost:9090
# Aller dans Alerts
# Forcer une alerte (par exemple, arrêter le backend)
kubectl scale deployment backend --replicas=0 -n crypto-platform
```

Après 2 minutes, tu devrais recevoir un email avec :
```
Subject: [CRITIQUE] Crypto Platform - Alerte Urgente

ALERTE CRITIQUE!

Alerte: BackendNotResponding
Severite: critical
Description: Le service backend de Crypto Platform ne repond pas depuis 2 minutes.
Debut: 2026-01-08T12:34:56Z
```

### 4. Remettre le backend en ligne

```bash
kubectl scale deployment backend --replicas=2 -n crypto-platform
```

Tu devrais recevoir un email de résolution :
```
Subject: [RESOLU] Crypto Platform - Alerte Resolue

L'alerte BackendNotResponding a ete resolue.
```

---

## Types d'alertes email configurées

| Severité | Destinataire | Subject | Repeat Interval |
|----------|--------------|---------|-----------------|
| **critical** | u4820065201@gmail.com | [CRITIQUE] | 1 heure |
| **warning** | u4820065201@gmail.com | [WARNING] | 2 heures |
| **default** | u4820065201@gmail.com | [Crypto Platform] | 4 heures |

---

## Alternatives à Gmail

### Option 1 : SendGrid (Recommandé pour production)

```yaml
email_configs:
  - to: 'u4820065201@gmail.com'
    from: 'alerts@cryptoplatform.com'
    smarthost: 'smtp.sendgrid.net:587'
    auth_username: 'apikey'
    auth_password: 'SG.YOUR_SENDGRID_API_KEY'
```

### Option 2 : Mailgun

```yaml
email_configs:
  - to: 'u4820065201@gmail.com'
    from: 'alerts@mg.cryptoplatform.com'
    smarthost: 'smtp.mailgun.org:587'
    auth_username: 'postmaster@mg.cryptoplatform.com'
    auth_password: 'YOUR_MAILGUN_PASSWORD'
```

### Option 3 : Webhook Discord (Alternative)

Si Gmail ne fonctionne pas, utilise Discord :

```yaml
webhook_configs:
  - url: 'https://discord.com/api/webhooks/TON_WEBHOOK_ID/TON_TOKEN'
    send_resolved: true
```

---

## FAQ

**Q : Pourquoi je ne reçois pas d'emails ?**
- Vérifie que le App Password Gmail est correct
- Vérifie les logs AlertManager : `kubectl logs deployment/alertmanager -n monitoring`
- Vérifie que la validation en 2 étapes est activée sur Gmail
- Vérifie les spams/courrier indésirable

**Q : Combien d'emails je vais recevoir ?**
- **critical** : Maximum 1 email par heure tant que l'alerte est active
- **warning** : Maximum 1 email toutes les 2 heures
- **default** : Maximum 1 email toutes les 4 heures

**Q : Comment désactiver les emails ?**
```bash
# Supprimer AlertManager
kubectl delete deployment alertmanager -n monitoring
```

**Q : Comment tester sans déclencher une vraie alerte ?**
```bash
# Envoyer une alerte de test manuellement
curl -X POST http://localhost:9093/api/v1/alerts -d '[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert",
      "description": "Ceci est un test"
    }
  }
]'
```

---

## Résumé des modifications

### Fichiers modifiés :

1. [k8s/monitoring/alertmanager/configmap.yaml](k8s/monitoring/alertmanager/configmap.yaml)
   - Ajout de `email_configs` pour les 3 receivers
   - Configuration SMTP Gmail
   - Templates d'email personnalisés

2. [k8s/monitoring/loki/deployment.yaml](k8s/monitoring/loki/deployment.yaml)
   - Ajout d'un PersistentVolumeClaim (5Gi)
   - Les logs sont maintenant sauvegardés de manière permanente

### À faire manuellement :

1. Créer un App Password Gmail
2. Remplacer `YOUR_APP_PASSWORD_HERE` dans alertmanager/configmap.yaml
3. Redéployer : `kubectl apply -k k8s/monitoring`
4. Tester en déclenchant une alerte

---

**Configuration finale** : Les logs sont sauvegardés sur volume persistant, et les alertes sont envoyées par email à **u4820065201@gmail.com** !
