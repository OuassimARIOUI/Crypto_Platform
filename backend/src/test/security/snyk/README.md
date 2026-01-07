# 🔍 Snyk - Scan des Vulnérabilités de Dépendances

## 📋 Description

Snyk analyse les dépendances npm de votre projet pour détecter les vulnérabilités de sécurité connues (CVE).

## 🚀 Installation

### Option 1: Installation globale
```bash
npm install -g snyk
```

### Option 2: Utilisation via npx (sans installation)
```bash
npx snyk test
```

## 🔐 Authentification

Première utilisation:
```bash
snyk auth
```

Cela ouvrira votre navigateur pour connecter Snyk à votre compte.

## 📊 Commandes Principales

### Test des Vulnérabilités
```bash
npm run security:snyk:test
```

### Monitoring Continu
```bash
npm run security:snyk:monitor
```

### Correction Automatique
```bash
npm run security:snyk:fix
```

### Rapports Détaillés
```bash
npm run security:snyk:report
```

## 🎯 Types de Scans

### 1. Scan des Dépendances npm
```bash
snyk test --severity-threshold=high
```

### 2. Scan du Code (SAST)
```bash
snyk code test
```

### 3. Scan des Images Docker
```bash
snyk container test crypto_platform-backend:latest
```

### 4. Scan des Configurations IaC
```bash
snyk iac test k8s/
```

## 📈 Niveaux de Sévérité

| Niveau | Action Requise |
|--------|---------------|
| Critical | 🔴 Correction immédiate |
| High | 🟠 Correction prioritaire |
| Medium | 🟡 Planifier correction |
| Low | 🟢 À évaluer |

## 🛡️ Politiques de Sécurité

Le fichier `.snyk` à la racine contient les règles:
- Ignorer certaines vulnérabilités (avec justification)
- Patches automatiques
- Exclusions de chemins

## 📝 Rapports

Les rapports sont générés dans `src/test/security/snyk/reports/`:
- `snyk-dependencies-{date}.json`
- `snyk-code-{date}.html`
- `snyk-container-{date}.json`

## 🔧 Configuration CI/CD

### GitHub Actions
```yaml
- name: Run Snyk Security Scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

### GitLab CI
```yaml
snyk_scan:
  image: snyk/snyk:node
  script:
    - snyk auth $SNYK_TOKEN
    - snyk test --json-file-output=snyk-report.json
```

## 🚨 Alertes et Notifications

Snyk peut envoyer des alertes via:
- Email
- Slack
- Jira
- PagerDuty

Configuration: https://app.snyk.io/org/[YOUR_ORG]/manage/integrations

## 📊 Dashboard

Consultez votre dashboard Snyk:
https://app.snyk.io/

## 🔄 Mises à Jour Automatiques

### Snyk Fix (Corrections Auto)
```bash
snyk fix
```

### Pull Requests Automatiques
Activez dans les paramètres Snyk pour recevoir des PR automatiques avec les corrections.

## 📚 Ressources

- Documentation: https://docs.snyk.io/
- API Reference: https://snyk.docs.apiary.io/
- Support: https://support.snyk.io/
- Blog: https://snyk.io/blog/
