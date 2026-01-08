#  Tests de Sécurité - Crypto Platform

##  Vue d'ensemble

Ce dossier contient tous les tests de sécurité pour l'application Crypto Platform, suivant les standards **OWASP Top 10** et utilisant les outils **OWASP ZAP** et **Snyk**.

## Structure des Tests

### 1. Tests Unitaires de Sécurité (`*.security.test.js`)
- **input.security.test.js** - Validation des entrées (XSS, SQL Injection)
- **auth.security.test.js** - Authentification et gestion des tokens
- **authorization.security.test.js** - Contrôle d'accès et permissions
- **http.security.test.js** - Sécurité HTTP (CORS, Headers, Rate Limiting)
- **data.security.test.js** - Protection des données sensibles
- **middleware.security.test.js** - Middleware de sécurité

### 2. Tests OWASP ZAP (`owasp-zap/`)
- Scans de vulnérabilités automatisés
- Tests de pénétration web
- Rapports de sécurité HTML/JSON

### 3. Tests Snyk (`snyk/`)
- Scan des dépendances npm
- Détection de CVE dans les packages
- Rapports de vulnérabilités

##  Exécution des Tests

### Tests Unitaires
```bash
npm test -- src/test/security/
```

### OWASP ZAP (voir owasp-zap/README.md)
```bash
npm run security:zap
```

### Snyk (voir snyk/README.md)
```bash
npm run security:snyk
```

##  Couverture de Sécurité

| Catégorie OWASP | Fichier de Test | Couverture |
|----------------|-----------------|------------|
| A01 - Broken Access Control | authorization.security.test.js | Oui |
| A02 - Cryptographic Failures | data.security.test.js | Oui |
| A03 - Injection | input.security.test.js | Oui |
| A04 - Insecure Design | middleware.security.test.js | Oui |
| A05 - Security Misconfiguration | http.security.test.js | Oui |
| A06 - Vulnerable Components | Snyk scan | Oui |
| A07 - Authentication Failures | auth.security.test.js | Oui |
| A08 - Data Integrity Failures | data.security.test.js | Oui |
| A09 - Logging Failures | data.security.test.js | Oui |
| A10 - SSRF | http.security.test.js | Oui |

##  Configuration

Les tests de sécurité sont configurés dans:
- `vitest.config.mjs` - Configuration Vitest
- `.snyk` - Politique Snyk
- `owasp-zap/zap-config.yaml` - Configuration OWASP ZAP

##  Bonnes Pratiques

1. **Exécuter les tests avant chaque commit**
2. **Vérifier les rapports Snyk hebdomadairement**
3. **Lancer OWASP ZAP avant chaque release**
4. **Maintenir 100% de couverture des tests de sécurité**
5. **Documenter toute exception de sécurité**
