#  Guide Complet - Tests de Sécurité OWASP ZAP & Snyk

##  Ce qui a été configuré

### 1. Structure des Tests de Sécurité
```
backend/src/test/security/
├── README.md                          #  Documentation principale
├── input.security.test.js             #  Tests XSS, SQL Injection
├── auth.security.test.js              #  Tests authentification
├── authorization.security.test.js     #  Tests autorisation
├── http.security.test.js              #  Tests sécurité HTTP
├── data.security.test.js              #  Tests protection données
├── middleware.security.test.js        #  Tests middleware sécurité
├── owasp-zap/                         # 🕷️ OWASP ZAP
│   ├── README.md
│   ├── zap-config.yaml
│   ├── run-zap-scan.sh               # Script d'exécution
│   └── reports/                       # Rapports générés
└── snyk/                              # 🔍 Snyk
    ├── README.md
    ├── run-snyk-scan.sh              # Script d'exécution
    └── reports/                       # Rapports générés
```

### 2. Configuration Snyk
- ✅ Fichier `.snyk` créé à la racine du backend
- ✅ Scripts npm ajoutés pour l'exécution
- ✅ Documentation complète dans `snyk/README.md`

### 3. Configuration OWASP ZAP
- ✅ Fichier de configuration `zap-config.yaml`
- ✅ Scripts bash pour automatiser les scans
- ✅ Support des scans: baseline, full, API
- ✅ Documentation complète dans `owasp-zap/README.md`

### 4. Scripts NPM Ajoutés

```json
{
  "test:security": "vitest run src/test/security/",
  "security:zap:baseline": "bash src/test/security/owasp-zap/run-zap-scan.sh baseline",
  "security:zap:full": "bash src/test/security/owasp-zap/run-zap-scan.sh full",
  "security:zap:api": "bash src/test/security/owasp-zap/run-zap-scan.sh api",
  "security:snyk:test": "snyk test --severity-threshold=high",
  "security:snyk:monitor": "snyk monitor",
  "security:snyk:fix": "snyk fix",
  "security:snyk:report": "bash src/test/security/snyk/run-snyk-scan.sh",
  "security:all": "npm run test:security && npm run security:snyk:test && npm run security:zap:baseline"
}
```

## 🚀 Comment Utiliser

### Tests de Sécurité Unitaires
```bash
# Exécuter tous les tests de sécurité
npm run test:security

# Mode watch (développement)
npm run test:security:watch

# Tests spécifiques
npm test -- src/test/security/input.security.test.js
```

### OWASP ZAP

#### Installation
```bash
# Avec Docker (recommandé)
docker pull ghcr.io/zaproxy/zaproxy:stable
```

#### Exécution des Scans
```bash
# 1. Démarrez l'application
npm start

# 2. Dans un autre terminal, lancez le scan
npm run security:zap:baseline     # Scan rapide (5-10 min)
npm run security:zap:api           # Scan API uniquement
npm run security:zap:full          # Scan complet (30-60 min)
npm run security:zap:all           # Tous les scans
```

#### Consulter les Rapports
Les rapports sont dans `src/test/security/owasp-zap/reports/`:
- `zap-baseline-YYYYMMDD_HHMMSS.html` - Rapport HTML interactif
- `zap-baseline-YYYYMMDD_HHMMSS.json` - Données brutes JSON
- `zap-baseline-YYYYMMDD_HHMMSS.md` - Résumé Markdown

### Snyk

#### Installation et Authentification
```bash
# Installer Snyk globalement
npm install -g snyk

# S'authentifier (première fois)
snyk auth
```

#### Exécution des Scans
```bash
# Test des dépendances npm
npm run security:snyk:test

# Scan complet (dépendances + code + container)
npm run security:snyk:report

# Scan du code source
npm run security:snyk:code

# Scan de l'image Docker
npm run security:snyk:container

# Monitoring continu
npm run security:snyk:monitor

# Correction automatique
npm run security:snyk:fix
```

#### Consulter les Rapports
Les rapports sont dans `src/test/security/snyk/reports/`:
- `snyk-dependencies-YYYYMMDD_HHMMSS.json`
- `snyk-code-YYYYMMDD_HHMMSS.sarif`
- `snyk-container-YYYYMMDD_HHMMSS.json`
- `snyk-full-report-YYYYMMDD_HHMMSS.html`

### Scan Complet de Sécurité
```bash
# Exécute tous les tests de sécurité
npm run security:all

# Ou manuellement:
npm run test:security          # Tests unitaires
npm run security:snyk:test     # Snyk dépendances
npm run security:zap:baseline  # OWASP ZAP
```

## 📊 Interprétation des Résultats

### Niveaux de Risque

| Niveau | OWASP ZAP | Snyk | Action |
|--------|-----------|------|--------|
| 🔴 Critical/High | High | Critical/High | ⛔ **BLOQUE LE DEPLOYMENT** |
| 🟠 Medium | Medium | Medium | ⚠️ À corriger avant release |
| 🟡 Low | Low | Low | 📝 À planifier |
| 🔵 Info | Informational | Info | ℹ️ À documenter |

### Que faire en cas de vulnérabilité ?

#### 1. Vulnérabilités Critiques/High
```bash
# 1. Identifier la vulnérabilité
cat src/test/security/snyk/reports/snyk-dependencies-*.json | jq '.vulnerabilities[] | select(.severity=="critical")'

# 2. Tenter une correction automatique
npm run security:snyk:fix

# 3. Si pas de fix automatique, mettre à jour manuellement
npm update <package>

# 4. Vérifier que c'est corrigé
npm run security:snyk:test
```

#### 2. Vulnérabilités OWASP ZAP
```bash
# 1. Ouvrir le rapport HTML
open src/test/security/owasp-zap/reports/zap-baseline-*.html

# 2. Pour chaque vulnérabilité:
#    - Lire la description
#    - Identifier le code vulnérable
#    - Appliquer la solution recommandée
#    - Re-tester

# 3. Relancer le scan
npm run security:zap:baseline
```

## 🔐 Bonnes Pratiques

### Développement
1. **Avant chaque commit:**
   ```bash
   npm run test:security
   ```

2. **Tests en mode watch pendant le développement:**
   ```bash
   npm run test:security:watch
   ```

### CI/CD
1. **Pipeline de base:**
   ```yaml
   - name: Security Tests
     run: npm run security:all
   ```

2. **Pipeline avancé (GitHub Actions):**
   ```yaml
   name: Security Scan
   on: [push, pull_request]
   
   jobs:
     security:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         
         # Tests unitaires
         - run: npm run test:security
         
         # Snyk
         - uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             args: --severity-threshold=high
         
         # OWASP ZAP
         - run: |
             npm start &
             sleep 10
             npm run security:zap:baseline
   ```

### Release
1. **Avant chaque release:**
   ```bash
   # Scan complet
   npm run security:snyk:report
   npm run security:zap:full
   
   # Vérifier qu'il n'y a pas de Critical/High
   ```

2. **Après le deployment:**
   ```bash
   # Monitoring continu
   npm run security:snyk:monitor
   ```

## 📚 Ressources

### Documentation
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Snyk Documentation](https://docs.snyk.io/)
- [Vitest Documentation](https://vitest.dev/)

### Tutoriels
- [OWASP ZAP Getting Started](https://www.zaproxy.org/getting-started/)
- [Snyk Tutorial](https://learn.snyk.io/)
- [Security Testing Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Web_Application_Security_Testing_Cheat_Sheet.html)

## ❓ FAQ

**Q: Dois-je exécuter tous les tests à chaque commit?**
A: Les tests unitaires oui, OWASP ZAP baseline avant chaque PR, full scan avant chaque release.

**Q: Puis-je ignorer certaines vulnérabilités Snyk?**
A: Oui, via le fichier `.snyk`, mais TOUJOURS documenter la raison et définir une date d'expiration.

**Q: OWASP ZAP ralentit mon développement, que faire?**
A: Utilisez `baseline` en local, `full` en CI/CD uniquement.

**Q: Comment gérer les faux positifs?**
A: Ajoutez des exclusions dans `zap-config.yaml` avec commentaires expliquant pourquoi.

## 🎉 Prochaines Étapes

1. ✅ **Installez Snyk:** `npm install -g snyk && snyk auth`
2. ✅ **Testez les scans:** `npm run test:security`
3. ✅ **Lancez un scan Snyk:** `npm run security:snyk:test`
4. ✅ **Lancez OWASP ZAP:** `npm run security:zap:baseline`
5. ✅ **Configurez votre CI/CD** avec les tests de sécurité
6. ✅ **Consultez les rapports** et corrigez les vulnérabilités

---

**🔒 La sécurité n'est jamais terminée, c'est un processus continu!**
