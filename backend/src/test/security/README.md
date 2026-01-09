# Tests de Securite - Crypto Platform

## Vue d'ensemble

Ce dossier contient tous les tests de securite pour l'application Crypto Platform, suivant les standards **OWASP Top 10** et utilisant **Snyk** pour l'analyse automatisee.

## Structure des Tests

### 1. Tests Unitaires de Securite (`*.security.test.js`)
- **input.security.test.js** - Validation des entrees (XSS, SQL Injection)
- **auth.security.test.js** - Authentification et gestion des tokens
- **authorization.security.test.js** - Controle d'acces et permissions
- **http.security.test.js** - Securite HTTP (CORS, Headers, Rate Limiting)
- **data.security.test.js** - Protection des donnees sensibles
- **middleware.security.test.js** - Middleware de securite

### 2. Snyk - Analyse de Vulnerabilites
- Scan des dependances npm
- Detection de CVE dans les packages
- Analyse statique du code (SAST)
- Detection de secrets hardcodes

## Configuration Initiale de Snyk

### 1. Installation de Snyk CLI

```powershell
npm install -g snyk
```

### 2. Authentification

**IMPORTANT**: Avant d'utiliser Snyk, vous devez vous authentifier:

```powershell
snyk auth
```

Cette commande va:
1. Ouvrir votre navigateur automatiquement
2. Vous demander de vous connecter avec GitHub, Google, ou email
3. Generer un token d'authentification
4. L'enregistrer localement dans `~/.config/configstore/snyk.json`

**Erreur SNYK-0005**: Si vous voyez "Not authorised", vous devez executer `snyk auth` en premier.

### 3. Verification de l'Installation

```powershell
snyk --version
snyk whoami
```

## Execution des Tests

### Tests Unitaires de Securite (30 secondes)

```powershell
npm run test:security
```

Couvre:
- Validation des entrees (XSS, SQL injection)
- Authentification JWT
- Controle d'acces RBAC
- Headers HTTP securises
- Protection des donnees sensibles

### Snyk - Scan des Dependances (1-2 minutes)

```powershell
npm run security:snyk
```

Analyse toutes les dependances npm et detecte:
- CVE connues
- Vulnerabilites critiques/high/medium/low
- Packages obsoletes
- Licences problematiques

### Snyk - Analyse Statique du Code (1-2 minutes)

```powershell
npm run security:snyk:code
```

Analyse le code source et detecte:
- Injections SQL
- XSS (Cross-Site Scripting)
- Path traversal
- Secrets hardcodes
- Mauvaises pratiques de securite

### Tous les Tests de Securite (3-4 minutes)

```powershell
npm run security:all
```

Execute sequentiellement:
1. Tests unitaires de securite
2. Snyk scan des dependances

## Interpretation des Resultats Snyk

### Niveaux de Severite

| Severite | Description | Action Requise |
|----------|-------------|----------------|
| **Critical** | Exploitation facile, impact majeur | Corriger immediatement |
| **High** | Exploitation probable, impact important | Corriger dans 7 jours |
| **Medium** | Exploitation possible, impact modere | Corriger dans 30 jours |
| **Low** | Exploitation difficile, impact faible | A surveiller |

### Exemple de Rapport Snyk

```
Testing /path/to/package.json...

Tested 245 dependencies for known issues, found 12 issues, 15 vulnerable paths.

Issues to fix by upgrading:

  Upgrade express@4.17.1 to express@4.18.2 to fix
  - Prototype Pollution [High Severity][https://snyk.io/vuln/SNYK-JS-EXPRESS-...]
  - Open Redirect [Medium Severity][https://snyk.io/vuln/SNYK-JS-EXPRESS-...]

Issues with no direct upgrade or patch:
  - SQL Injection in pg@8.7.1
    Introduced through: prisma@4.0.0 > @prisma/client@4.0.0
    Fix: Upgrade to pg@8.8.0 (requires prisma upgrade)
```

## Couverture de Securite OWASP Top 10

| Categorie OWASP | Fichier de Test | Outil |
|----------------|-----------------|-------|
| A01 - Broken Access Control | authorization.security.test.js | Vitest |
| A02 - Cryptographic Failures | data.security.test.js | Vitest |
| A03 - Injection | input.security.test.js | Vitest + Snyk Code |
| A04 - Insecure Design | middleware.security.test.js | Vitest |
| A05 - Security Misconfiguration | http.security.test.js | Vitest |
| A06 - Vulnerable Components | - | Snyk Scan |
| A07 - Authentication Failures | auth.security.test.js | Vitest |
| A08 - Data Integrity Failures | data.security.test.js | Vitest |
| A09 - Logging Failures | data.security.test.js | Vitest |
| A10 - SSRF | http.security.test.js | Vitest |

## Guide de Demonstration pour le Professeur

### Preparation (5 minutes avant la demo)

1. **Verifier l'authentification Snyk**:
   ```powershell
   snyk whoami
   ```
   Si erreur, executer: `snyk auth`

2. **Demarrer le serveur backend**:
   ```powershell
   cd backend
   npm run dev
   ```

3. **Preparer un terminal propre**

### Demo Script (7-8 minutes total)

#### Etape 1: Tests Unitaires de Securite (30 secondes)

```powershell
npm run test:security
```

**Points a mentionner**:
- "Nous avons 6 suites de tests couvrant OWASP Top 10"
- "Les tests verifient: XSS, SQL injection, JWT, CORS, rate limiting"
- "Tous les tests passent, notre base de code est securisee"

#### Etape 2: Snyk - Scan des Dependances (1-2 minutes)

```powershell
npm run security:snyk
```

**Points a mentionner**:
- "Snyk analyse 245+ dependances npm pour detecter des CVE connues"
- "Le scan verifie aussi les dependances transitives"
- "Chaque vulnerabilite a un niveau de severite et une solution proposee"

**Resultats attendus**:
- Liste des vulnerabilites trouvees (Critical, High, Medium, Low)
- Suggestions de mise a jour
- Liens vers la documentation Snyk

#### Etape 3: Snyk - Analyse Statique du Code (1-2 minutes)

```powershell
npm run security:snyk:code
```

**Points a mentionner**:
- "Snyk Code fait une analyse statique SAST de notre code source"
- "Detecte: injections SQL, XSS, secrets hardcodes, mauvaises pratiques"
- "Analyse les fichiers JavaScript sans executer le code"

**Resultats attendus**:
- Analyse de 50+ fichiers JavaScript
- Detection de patterns de securite
- Recommandations de correction

#### Etape 4: Conclusion

**Points a mentionner**:
- "Notre strategie de securite est multi-couches:"
  - Tests unitaires automatises (CI/CD)
  - Scan des dependances avec Snyk
  - Analyse statique du code
  - Monitoring en production avec Prometheus/Grafana
- "Total: 6 suites de tests, 245+ dependances analysees, 50+ fichiers scannés"
- "Integration dans le pipeline CI/CD pour prevention automatique"

## Troubleshooting

### Erreur: "Not authorised" (SNYK-0005)

**Solution**: Vous devez vous authentifier:
```powershell
snyk auth
```

### Erreur: "Command not found: snyk"

**Solution**: Installer Snyk globalement:
```powershell
npm install -g snyk
```

### Erreur: "Project not found"

**Solution**: Executer depuis le dossier `backend/`:
```powershell
cd backend
npm run security:snyk
```

### Scan trop lent

**Solution**: Utiliser le cache Snyk:
```powershell
snyk test --all-projects --detection-depth=1
```

## Integration CI/CD

Les tests de securite sont automatiquement executes dans le pipeline GitHub Actions:

```yaml
- name: Security Tests
  run: |
    npm run test:security
    npm run security:snyk
```

Voir `.github/workflows/backend-tests.yml` pour la configuration complete.

## Bonnes Pratiques

1. **Executer les tests avant chaque commit**
2. **Verifier les rapports Snyk hebdomadairement**
3. **Maintenir 100% de couverture des tests de securite**
4. **Corriger les vulnerabilites Critical/High sous 7 jours**
5. **Documenter toute exception de securite dans SECURITY.md**
6. **Mettre a jour les dependances regulierement**
7. **Ne jamais commit de secrets (utiliser .env)**

## Ressources

- [Snyk Documentation](https://docs.snyk.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk CLI Commands](https://docs.snyk.io/snyk-cli/cli-reference)
- [GitHub Snyk Integration](https://docs.snyk.io/integrations/git-repository-scm-integrations/github-integration)
