# Backend - Plateforme de Trading Crypto

**Version : 1.0.0**  
**Node.js + Express + Prisma + PostgreSQL**

---

## Vue d'ensemble

API RESTful et système backend pour la plateforme de monitoring et trading de cryptomonnaies.  
Gère l'authentification, le portefeuille virtuel, les transactions, la collecte de données et les communications temps réel.

---

## Technologies utilisées

### Core
- **Node.js** 18+
- **Express** 4.x - Framework web
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL** 14+ - Base de données principale
- **Redis** 7+ - Cache et files d'attente

### Authentification
- **Firebase Admin SDK** - Authentification Firebase
- **JWT (jsonwebtoken)** - Tokens d'authentification
- **bcrypt** - Hachage des mots de passe

### Workers et Jobs
- **BullMQ** - Gestion des tâches en arrière-plan
- **node-cron** - Planification de tâches

### Communication
- **Server-Sent Events (SSE)** - Notifications temps réel
- **Discord OAuth** - Intégration Discord

### Tests
- **Vitest** - Framework de tests
- **Supertest** - Tests d'API
- **Jest** - Tests unitaires

### Utilitaires
- **Winston** - Logging structuré
- **Joi** - Validation des données
- **dotenv** - Variables d'environnement

---

## Structure du projet

```
backend/
├── src/
│   ├── controllers/     # Contrôleurs des routes
│   │   ├── auth.controller.js
│   │   ├── portfolio.controller.js
│   │   ├── price.controller.js
│   │   ├── indicators.controller.js
│   │   ├── alerts.controller.js
│   │   ├── messages.controller.js
│   │   ├── admin.controller.js
│   │   └── ...
│   ├── services/        # Logique métier
│   │   ├── authService.js
│   │   ├── portfolioService.js
│   │   ├── getPricesService.js
│   │   ├── indicatorService.js
│   │   ├── alertsService.js
│   │   ├── messagesService.js
│   │   ├── transferService.js
│   │   ├── realtimeService.js
│   │   └── ...
│   ├── middleware/      # Middlewares Express
│   │   ├── auth.middleware.js
│   │   ├── adminAuth.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── ...
│   ├── routes/          # Définition des routes
│   │   ├── auth.routes.js
│   │   ├── portfolio.routes.js
│   │   ├── prices.routes.js
│   │   └── ...
│   ├── workers/         # Workers BullMQ
│   │   ├── priceCollector.worker.js
│   │   └── alertChecker.worker.js
│   ├── queues/          # Définition des queues
│   │   └── priceQueue.js
│   ├── utils/           # Fonctions utilitaires
│   │   ├── logger.js
│   │   └── validators.js
│   └── test/            # Tests
│       ├── unit/
│       ├── integration/
│       └── security/
├── prisma/
│   ├── schema.prisma    # Schéma de la base de données
│   └── migrations/      # Migrations
├── docs/                # Documentation
│   ├── services/        # Documentation des services
│   ├── controller/      # Documentation des contrôleurs
│   └── routes/          # Documentation des routes
├── coverage/            # Rapports de couverture de tests
├── perf/                # Tests de performance
├── index.js             # Point d'entrée
├── package.json
├── .env.example         # Exemple de configuration
└── README.md            # Ce fichier
```

---

## Installation

### Prérequis

- Node.js 18 ou supérieur
- PostgreSQL 14 ou supérieur
- Redis 7 ou supérieur
- npm ou yarn

### Étapes

1. **Cloner le repository**
```bash
cd backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

4. **Configurer la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# (Optionnel) Remplir avec des données de test
npx prisma db seed
```

5. **Démarrer Redis**
```bash
redis-server
```

6. **Démarrer l'application**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

---

## Variables d'environnement

Créez un fichier `.env` à la racine du dossier backend :

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_db

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise

# Redis
REDIS_URL=redis://localhost:6379

# CoinGecko API
COINGECKO_API_KEY=votre_cle_api_coingecko

# Firebase
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@votre-project.iam.gserviceaccount.com

# Discord OAuth
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/discord/callback

# Configuration serveur
PORT=3001
NODE_ENV=development

# Emails (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe
```

---

## Scripts disponibles

```bash
# Développement
npm run dev              # Démarre avec nodemon (rechargement auto)

# Production
npm start                # Démarre le serveur

# Base de données
npm run db:migrate       # Exécute les migrations
npm run db:reset         # Reset la BDD et applique les migrations
npm run db:seed          # Remplit avec des données de test
npm run db:studio        # Ouvre Prisma Studio (interface graphique)

# Tests
npm test                 # Exécute tous les tests
npm run test:unit        # Tests unitaires uniquement
npm run test:integration # Tests d'intégration uniquement
npm run test:coverage    # Tests avec rapport de couverture
npm run test:watch       # Mode watch pour le développement

# Sécurité
npm run security:check   # Scan des vulnérabilités
npm run security:zap     # Tests OWASP ZAP

# Performance
npm run perf:test        # Tests de charge avec k6

# Linting
npm run lint             # Vérifie le code
npm run lint:fix         # Corrige automatiquement

# Workers
npm run worker:prices    # Démarre le worker de collecte des prix
npm run worker:alerts    # Démarre le worker de vérification des alertes
```

---

## API Endpoints

### Authentification
```
POST   /api/auth/register          Inscription
POST   /api/auth/login             Connexion
GET    /api/auth/me                Profil utilisateur
POST   /api/auth/reset-password    Réinitialisation mot de passe
GET    /api/auth/pseudo-available  Vérifier disponibilité pseudo
```

### Portfolio
```
GET    /api/portfolio/me           Mon portefeuille
POST   /api/portfolio/add-funds    Ajouter des fonds
POST   /api/portfolio/buy          Acheter crypto
POST   /api/portfolio/sell         Vendre crypto
POST   /api/portfolio/transfer     Transférer des fonds
```

### Prix et Cryptos
```
GET    /api/prices                 Prix actuels
GET    /api/prices/history/:symbol Historique des prix
GET    /api/cryptos                Liste des cryptos
GET    /api/cryptos/:symbol        Détails d'une crypto
```

### Indicateurs
```
GET    /api/indicators/:symbol/rsi       RSI
GET    /api/indicators/:symbol/macd      MACD
GET    /api/indicators/:symbol/bollinger Bollinger Bands
GET    /api/indicators/:symbol/ma        Moyennes mobiles
```

### Alertes
```
GET    /api/alerts                 Mes alertes
POST   /api/alerts                 Créer une alerte
PUT    /api/alerts/:id             Modifier une alerte
DELETE /api/alerts/:id             Supprimer une alerte
```

### Messages
```
GET    /api/messages/conversations        Mes conversations
GET    /api/messages/:conversationId      Messages d'une conversation
POST   /api/messages/:conversationId      Envoyer un message
POST   /api/messages/direct/:userId       Créer conversation directe
```

### Temps réel
```
GET    /api/realtime/subscribe     Connexion SSE
```

### Admin (requiert rôle admin)
```
GET    /api/admin/users            Liste des utilisateurs
PUT    /api/admin/users/:id/ban    Bannir un utilisateur
PUT    /api/admin/users/:id/role   Modifier le rôle
GET    /api/admin/reports          Liste des rapports
PUT    /api/admin/reports/:id      Traiter un rapport
PUT    /api/admin/maintenance      Mode maintenance
```

Voir la documentation complète dans `/docs`

---

## Architecture

### Flow de collecte des prix

```
┌─────────────────┐
│  Worker BullMQ  │
│  (toutes les    │
│   60 secondes)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CoinGecko API  │
│  Récupération   │
│  top 100 cryptos│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  Sauvegarde     │
│  prix + history │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Calcul des     │
│  indicateurs    │
│  (RSI, MACD...) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vérification   │
│  des alertes    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notifications  │
│  SSE aux clients│
└─────────────────┘
```

### Flow d'authentification

```
Client
  │
  ├─► JWT Token ──────► Middleware auth ──► Routes protégées
  │
  └─► Firebase Token ─► Middleware auth ──► Routes protégées
```

### Communication temps réel

```
Client                Server
  │                      │
  ├──── GET /realtime ──►│
  │    subscribe         │
  │◄──── event:hello ────┤
  │                      │
  │                      │ [Événement système]
  │◄──── PRICE_UPDATE ───┤
  │◄──── NEW_MESSAGE ────┤
  │◄──── ALERT_TRIGGER ──┤
  │                      │
```

---

## Base de données

### Tables principales

- **users** : comptes utilisateurs
- **portfolios** : portefeuilles virtuels
- **portfolio_transactions** : historique des transactions
- **cryptos** : liste des cryptomonnaies
- **crypto_prices** : prix actuels
- **price_history** : historique des cours
- **alerts** : alertes utilisateurs
- **conversations** : discussions
- **messages** : messages échangés
- **reports** : signalements
- **audit_logs** : logs d'actions importantes
- **app_settings** : paramètres globaux

### Schéma

Consultez `prisma/schema.prisma` pour le schéma complet.

---

## Tests

### Couverture actuelle

- **Statements** : 90.31%
- **Branches** : 85.12%
- **Functions** : 88.45%
- **Lines** : 90.31%

### Lancer les tests

```bash
# Tous les tests
npm test

# Avec couverture
npm run test:coverage

# Mode watch
npm run test:watch

# Tests spécifiques
npm test -- auth.test.js
```

### Structure des tests

```
src/test/
├── unit/              # Tests unitaires
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/       # Tests d'intégration
│   ├── api/
│   └── database/
└── security/          # Tests de sécurité
    ├── owasp-zap/
    └── snyk/
```

---

## Sécurité

### Mesures implémentées

- **Authentification** : JWT + Firebase
- **Hachage** : bcrypt pour les mots de passe
- **Rate limiting** : limitation des requêtes par IP
- **Validation** : validation stricte des entrées
- **Sanitization** : nettoyage des données
- **CORS** : configuration CORS sécurisée
- **Headers** : helmet pour les headers HTTP
- **Logs d'audit** : traçabilité des actions sensibles
- **Bannissement** : système de ban temporaire/permanent

### Scan de sécurité

```bash
# Vulnérabilités npm
npm audit

# Snyk
npm run security:check

# OWASP ZAP
npm run security:zap
```

---

## Performance

### Optimisations

- **Cache Redis** : mise en cache des prix
- **Connexions persistantes** : pool de connexions DB
- **Index** : index sur colonnes critiques
- **Pagination** : limitation des résultats
- **Batch processing** : traitement par lot des données

### Tests de charge

```bash
npm run perf:test
```

Utilise k6 pour simuler une charge réaliste.

---

## Monitoring

### Logs

Les logs sont structurés avec Winston :

```javascript
{
  level: 'info',
  message: 'User logged in',
  userId: 123,
  timestamp: '2026-01-08T...'
}
```

Niveaux : `error`, `warn`, `info`, `debug`

### Métriques

- Nombre de requêtes par endpoint
- Temps de réponse moyen
- Erreurs par type
- Utilisateurs actifs
- Transactions par jour

---

## Workers

### Price Collector Worker

Collecte les prix toutes les 60 secondes :

```bash
npm run worker:prices
```

Tâches :
1. Récupération des prix CoinGecko
2. Sauvegarde en base de données
3. Calcul des indicateurs
4. Vérification des alertes
5. Notification des clients connectés

### Alert Checker Worker

Vérifie les alertes en continu :

```bash
npm run worker:alerts
```

---

## Déploiement

### Docker

```bash
# Build
docker build -t crypto-backend .

# Run
docker run -p 3001:3001 --env-file .env crypto-backend
```

### Docker Compose

```bash
docker-compose up -d
```

### Production

1. Définir `NODE_ENV=production`
2. Configurer PostgreSQL en production
3. Configurer Redis en production
4. Définir un `JWT_SECRET` fort
5. Configurer les certificats SSL
6. Configurer les logs persistants
7. Mettre en place un reverse proxy (Nginx)
8. Configurer la sauvegarde de la BDD

---

## Troubleshooting

### Problème de connexion à la BDD

```bash
# Vérifier PostgreSQL
psql -U user -d crypto_db

# Tester la connexion
npm run db:studio
```

### Redis non disponible

```bash
# Vérifier Redis
redis-cli ping
# Devrait retourner PONG

# Démarrer Redis
redis-server
```

### Worker ne démarre pas

```bash
# Vérifier les logs
tail -f logs/worker.log

# Vérifier Redis
redis-cli LLEN bullmq:prices:wait
```

### Migrations échouées

```bash
# Reset complet (ATTENTION: perte de données)
npm run db:reset

# Réappliquer les migrations
npm run db:migrate
```

---

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

Consultez CONTRIBUTING.md pour plus de détails.

---

## Licence

Propriétaire - Tous droits réservés

---

## Contact

- **Auteur** : ARIOUI Achraf
- **Email** : support@crypto-platform.com
- **Documentation** : `/docs`

---

## Changelog

### Version 1.0.0 (Janvier 2026)
- Version initiale
- Authentification complète
- Gestion de portefeuille
- Collecte automatique des prix
- Indicateurs techniques
- Système d'alertes
- Messagerie
- Transferts entre utilisateurs
- Panel admin
