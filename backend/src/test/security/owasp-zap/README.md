#  OWASP ZAP - Tests de Pénétration Automatisés

##  Description

OWASP ZAP (Zed Attack Proxy) est un outil de test de pénétration open-source qui scanne automatiquement l'application web pour détecter les vulnérabilités.

##  Installation

### Option 1: Docker (Recommandé)
```bash
docker pull ghcr.io/zaproxy/zaproxy:stable
```

### Option 2: Installation locale
Téléchargez depuis: https://www.zaproxy.org/download/

##  Configuration

Le fichier `zap-config.yaml` contient la configuration du scan:
- URLs à scanner
- Types de tests à exécuter
- Niveau de risque acceptable
- Exclusions

##  Exécution des Scans

### Scan Rapide (Baseline)
```bash
npm run security:zap:baseline
```

### Scan Complet
```bash
npm run security:zap:full
```

### Scan API
```bash
npm run security:zap:api
```

##  Rapports

Les rapports sont générés dans `src/test/security/owasp-zap/reports/`:
- `zap-report-{date}.html` - Rapport HTML détaillé
- `zap-report-{date}.json` - Données JSON brutes
- `zap-report-{date}.xml` - Format XML pour CI/CD

##  Tests Couverts

### Vulnérabilités détectées:
- SQL Injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Insecure Headers
- Cookie Security
- SSL/TLS Issues
- Information Disclosure
- Authentication Bypass
- Authorization Flaws
- Directory Traversal

##  Niveaux de Risque

| Niveau | Action |
|--------|--------|
| High |  Bloque le deployment |
| Medium |  Avertissement à corriger |
| Low |  Information |
| Informational | À documenter |

##  Exemple d'Utilisation en CI/CD

```yaml
# .github/workflows/security.yml
- name: OWASP ZAP Scan
  run: |
    docker run -v $(pwd):/zap/wrk/:rw \
      ghcr.io/zaproxy/zaproxy:stable \
      zap-baseline.py \
      -t http://localhost:3004 \
      -r zap-report.html
```

##  Configuration Avancée

### Authentification
Pour scanner des pages protégées, configurez l'authentification dans `zap-auth-config.json`.

### Exclusions
Modifiez `zap-config.yaml` pour exclure certaines URLs du scan:
```yaml
excludeUrls:
  - http://localhost:3004/metrics
  - http://localhost:3004/health
```

##  Ressources

- Documentation officielle: https://www.zaproxy.org/docs/
- API Documentation: https://www.zaproxy.org/docs/api/
- Vidéos tutoriels: https://www.zaproxy.org/videos/
