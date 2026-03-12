# Plateforme de Monitoring et Trading de Cryptomonnaies

**Version : 1.0.0**  
**Auteur : ARIOUI Achraf**

---

## Vue d'ensemble

Cette plateforme full-stack permet aux utilisateurs de suivre les cours des cryptomonnaies en temps réel, de gérer un portefeuille virtuel, d'effectuer des transactions d'achat/vente simulées et de communiquer avec d'autres utilisateurs.

L'application combine un backend Node.js robuste avec un frontend Next.js moderne, offrant une expérience utilisateur fluide et réactive.

---

## Fonctionnalités principales

### Suivi des Cryptomonnaies

- **Collecte automatique** : récupération des prix et données depuis l'API CoinGecko toutes les 60 secondes
- **Affichage en temps réel** : mise à jour instantanée des cours via Server-Sent Events (SSE)
- **Historique des prix** : stockage et consultation de l'évolution des cours
- **Top cryptomonnaies** : classement par capitalisation boursière
- **Recherche et filtrage** : recherche par nom ou symbole

### Gestion de Portefeuille

- **Portefeuille virtuel** : simulation d'un portefeuille de cryptomonnaies
- **Solde en USD** : gestion d'un solde virtuel pour les transactions
- **Ajout de fonds** : dépôt de fonds virtuels sur le compte
- **Achat de crypto** : acquisition de cryptomonnaies au prix du marché
- **Vente de crypto** : vente des cryptomonnaies détenues
- **Historique des transactions** : consultation de toutes les opérations
- **Calcul de profit/perte** : analyse des performances du portefeuille
- **Transferts entre utilisateurs** : envoi de fonds à d'autres utilisateurs

### Indicateurs Techniques

- **RSI (Relative Strength Index)** : indicateur de surachat/survente
- **MACD (Moving Average Convergence Divergence)** : analyse des tendances
- **Bollinger Bands** : bandes de volatilité
- **Moving Averages** : moyennes mobiles (SMA, EMA)
- **Volume Analysis** : analyse du volume de trading

### Système d'Alertes

- **Alertes de prix** : notification quand un seuil est atteint
- **Alertes d'indicateurs** : notification sur conditions techniques
- **Notifications temps réel** : alertes instantanées via SSE
- **Gestion des alertes** : création, modification, suppression

### Messagerie et Communication

- **Conversations directes** : chat privé entre utilisateurs
- **Messages de groupe** : discussions multi-utilisateurs (à venir)
- **Notifications en temps réel** : nouveaux messages via SSE
- **Messages système** : notifications automatiques (transferts, alertes admin)

### Authentification et Sécurité

- **Inscription/Connexion** : système d'authentification complet
- **Firebase Authentication** : intégration Firebase pour l'authentification
- **JWT Tokens** : gestion sécurisée des sessions
- **Réinitialisation de mot de passe** : via email
- **Vérification d'email** : confirmation du compte par email
- **OAuth Discord** : liaison optionnelle du compte Discord

### Administration

- **Panneau d'administration** : interface de gestion
- **Gestion des utilisateurs** : consultation, bannissement, modification de rôle
- **Gestion des rapports** : traitement des signalements utilisateurs
- **Mode maintenance** : activation/désactivation avec message personnalisé
- **Logs d'audit** : traçabilité de toutes les actions importantes
- **Statistiques** : tableau de bord des métriques de la plateforme

---

## Architecture technique

### Backend

**Stack technologique :**
- **Node.js** : environnement d'exécution JavaScript
- **Express** : framework web minimaliste
- **Prisma** : ORM pour PostgreSQL
- **PostgreSQL** : base de données relationnelle
- **Redis** : cache et gestion des workers
- **BullMQ** : gestion des tâches en arrière-plan
- **Firebase Admin** : intégration Firebase côté serveur
- **JWT** : authentification par tokens
- **Server-Sent Events** : communication temps réel

**Services principaux :**
- `authService` : authentification et gestion des utilisateurs
- `portfolioService` : gestion du portefeuille et transactions
- `getPricesService` : récupération des prix CoinGecko
- `getHistoryService` : historique des cours
- `indicatorService` : calcul des indicateurs techniques
- `alertsService` : gestion des alertes utilisateurs
- `messagesService` : système de messagerie
- `transferService` : transferts entre utilisateurs
- `realtimeService` : communication SSE
- `discordService` : intégration Discord OAuth
- `appSettingsService` : paramètres globaux
- `auditLogService` : logs d'audit

### Frontend

**Stack technologique :**
- **Next.js 15** : framework React avec App Router
- **React 19** : bibliothèque UI
- **Tailwind CSS** : framework CSS utilitaire
- **Firebase** : authentification côté client
- **Recharts** : graphiques et visualisations
- **Server-Sent Events** : réception des mises à jour temps réel

**Pages principales :**
- Dashboard : vue d'ensemble des cryptos et du marché
- Portfolio : gestion du portefeuille personnel
- Trading : interface d'achat/vente
- Indicateurs : analyse technique
- Profile : gestion du compte utilisateur
- Admin : panneau d'administration (role admin)

### Base de données

**Tables principales :**
- `users` : comptes utilisateurs
- `portfolios` : portefeuilles virtuels
- `portfolio_transactions` : historique des transactions
- `cryptos` : liste des cryptomonnaies
- `crypto_prices` : prix actuels
- `price_history` : historique des cours
- `alerts` : alertes utilisateurs
- `conversations` : discussions
- `messages` : messages échangés
- `reports` : signalements
- `audit_logs` : logs d'actions importantes
- `app_settings` : paramètres globaux

---

## Collecte et traitement des données

### Worker de collecte des prix

Un worker BullMQ s'exécute en continu pour :

1. **Récupération des données** (toutes les 60 secondes)
   - Appel à l'API CoinGecko
   - Récupération du top 100 cryptomonnaies
   - Prix, variations 24h, capitalisation

2. **Stockage en base de données**
   - Mise à jour de la table `crypto_prices`
   - Insertion dans `price_history`
   - Timestamp précis de chaque collecte

3. **Calcul des indicateurs**
   - RSI calculé sur 14 périodes
   - MACD avec paramètres standards
   - Moyennes mobiles (7, 25, 99 jours)

4. **Vérification des alertes**
   - Parcours de toutes les alertes actives
   - Vérification des conditions (prix, indicateurs)
   - Déclenchement et notification si conditions remplies

5. **Notification temps réel**
   - Diffusion des nouveaux prix via SSE
   - Mise à jour instantanée des interfaces connectées

---

## Flux utilisateur typique

### Inscription et connexion

1. L'utilisateur s'inscrit avec email/mot de passe ou via Firebase
2. Vérification de l'email (optionnel)
3. Création automatique d'un portefeuille avec solde initial (0 USD)
4. Connexion et obtention d'un JWT

### Gestion du portefeuille

1. **Ajout de fonds**
   - L'utilisateur ajoute des fonds virtuels (simulation)
   - Mise à jour du solde en base de données
   - Notification temps réel

2. **Achat de crypto**
   - Consultation des prix en temps réel
   - Sélection de la crypto et quantité
   - Vérification du solde disponible
   - Débit du solde, ajout à `holdings`
   - Création d'une transaction

3. **Vente de crypto**
   - Sélection de la crypto détenue
   - Vérification de la quantité disponible
   - Crédit du solde, retrait de `holdings`
   - Création d'une transaction

4. **Consultation**
   - Vue d'ensemble du portefeuille
   - Holdings actuels avec valeur en temps réel
   - Historique des transactions
   - Calcul profit/perte

### Transferts entre utilisateurs

1. L'utilisateur initie un transfert
2. Sélection du destinataire par pseudo
3. Montant et motif optionnel
4. Vérification du solde
5. Transaction atomique en base
6. Notification temps réel au destinataire
7. Message automatique envoyé

---

## Déploiement

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Compte CoinGecko API
- Firebase Project (pour auth)
- Variables d'environnement configurées

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

---

## Variables d'environnement

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_db
JWT_SECRET=votre_secret_jwt
REDIS_URL=redis://localhost:6379
COINGECKO_API_KEY=votre_api_key
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_PRIVATE_KEY=votre_private_key
FIREBASE_CLIENT_EMAIL=votre_client_email
DISCORD_CLIENT_ID=votre_discord_client_id
DISCORD_CLIENT_SECRET=votre_discord_secret
DISCORD_REDIRECT_URI=https://votredomaine.com/api/discord/callback
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=votre_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_firebase_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
```

---

## Tests

### Backend

```bash
cd backend
npm test                  # Tous les tests
npm run test:coverage     # Avec couverture
```

Couverture actuelle : 90.31%

### Frontend

```bash
cd frontend
npm test                  # Tests unitaires
npm run test:coverage     # Avec couverture
```

Couverture actuelle : 26.79%

---

## Sécurité

### Mesures implémentées

- **Authentification** : JWT + Firebase
- **Hachage des mots de passe** : bcrypt
- **Protection CSRF** : tokens
- **Rate limiting** : limitation des requêtes
- **Validation des entrées** : sanitization systématique
- **Logs d'audit** : traçabilité des actions sensibles
- **Bannissement** : système de ban temporaire/permanent
- **Rôles** : séparation user/admin

---

## Performance

### Optimisations backend

- Cache Redis pour les prix
- Connexion persistante SSE
- Index sur colonnes critiques
- Pagination systématique
- Requêtes optimisées Prisma

### Optimisations frontend

- Server Components Next.js
- Lazy loading des composants
- Memoization React
- Debounce sur recherches
- Chunking code automatique

---

## Monitoring

- Logs structurés (Winston)
- Métriques de performance
- Alertes d'erreurs
- Suivi des requêtes API
- Dashboard admin

---

## Roadmap

### Prochaines fonctionnalités

- Graphiques avancés (candlestick, volume)
- Mode sombre complet
- Notifications push navigateur
- Export PDF des transactions
- API publique pour développeurs
- Application mobile (React Native)
- Trading automatique (bots)
- Leaderboard des meilleurs traders

---

## Support et Contact

Pour toute question ou problème :
- Email : support@crypto-platform.com

---

## Licence

Propriétaire - Tous droits réservés

---

## Contributions

Les contributions sont les bienvenues ! Consultez CONTRIBUTING.md pour les guidelines.

---

## Remerciements

- CoinGecko pour l'API de données crypto
- Firebase pour l'authentification
- La communauté open-source pour les bibliothèques utilisées
