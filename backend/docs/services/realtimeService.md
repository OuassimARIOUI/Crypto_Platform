# Documentation — Service Temps Réel (SSE)

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `realtimeService.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

## Objectif

Le service `realtimeService` gère les communications en temps réel via Server-Sent Events (SSE).  
Il permet de diffuser des mises à jour instantanées aux clients connectés sans qu'ils aient besoin de rafraîchir la page.

Fonctionnalités principales :
- Connexions SSE persistantes avec les clients
- Diffusion d'événements à des utilisateurs spécifiques
- Diffusion d'événements par rôle (admin, user)
- Keep-alive automatique des connexions
- Gestion automatique de la déconnexion

---

## Architecture

Le service utilise une architecture en mémoire :
- Map principale : `userId` → Map de connexions
- Chaque connexion : `connectionId` → `{ res, role }`
- Keep-alive par ping toutes les 20 secondes
- Nettoyage automatique à la déconnexion

**Note :** Cette implémentation est mono-instance. Pour un environnement multi-serveurs, il faudrait utiliser Redis ou un autre système de pubsub partagé.

---

## Fonctions principales

### `sseInit`

Initialise une réponse HTTP pour SSE.

```javascript
export function sseInit(res)
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| res | Response | Objet de réponse Express |

#### Comportement

Configure les en-têtes HTTP nécessaires :
```javascript
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
```

---

### `subscribeRealtime`

Enregistre une nouvelle connexion SSE pour un utilisateur.

```javascript
export function subscribeRealtime({ userId, role, res })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| userId | Number | ID de l'utilisateur |
| role | String | Rôle de l'utilisateur (user/admin) |
| res | Response | Objet de réponse Express |

#### Comportement

1. Génère un ID unique pour la connexion (UUID)
2. Stocke la connexion dans la Map
3. Envoie un message de bienvenue :
```javascript
event: hello
data: {"ok":true,"at":"2026-01-08T..."}
```
4. Démarre un intervalle de ping (20s)
5. Configure le nettoyage à la déconnexion

#### Valeur retournée

```javascript
String // UUID de la connexion
```

---

### `publishToUser`

Publie un événement à toutes les connexions d'un utilisateur spécifique.

```javascript
export function publishToUser(userId, event, data)
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| userId | Number | ID de l'utilisateur cible |
| event | String | Nom de l'événement |
| data | Object | Données à envoyer |

#### Exemple d'utilisation

```javascript
publishToUser(42, "PORTFOLIO_UPDATED", {
  balance: 1500.50,
  holdings: { btc: 0.5 }
})
```

#### Format envoyé

```
event: PORTFOLIO_UPDATED
data: {"balance":1500.50,"holdings":{"btc":0.5}}

```

---

### `publishToRoles`

Publie un événement à tous les utilisateurs ayant un rôle spécifique.

```javascript
export function publishToRoles(roles, event, data)
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| roles | Array<String> | Liste des rôles cibles (ex: ['admin']) |
| event | String | Nom de l'événement |
| data | Object | Données à envoyer |

#### Exemple d'utilisation

```javascript
publishToRoles(['admin'], "USER_BANNED", {
  userId: 123,
  reason: "Spam"
})
```

---

## Types d'événements

### Événements système

| Événement | Description | Données |
|-----------|-------------|---------|
| hello | Connexion établie | `{ ok: true, at: ISO8601 }` |
| ping | Keep-alive | Commentaire SSE `: ping {timestamp}` |

### Événements métier

| Événement | Description | Données |
|-----------|-------------|---------|
| PORTFOLIO_UPDATED | Portefeuille mis à jour | `{ balance, holdings }` |
| NEW_MESSAGE | Nouveau message reçu | `{ conversationId, message }` |
| TAGGED_MESSAGE | Message système | `{ conversationId, message }` |
| PRICE_UPDATE | Prix crypto mis à jour | `{ cryptoId, price, change }` |
| NEW_ALERT | Nouvelle alerte | `{ alert }` |
| USER_BANNED | Utilisateur banni (admin) | `{ userId, reason }` |
| MAINTENANCE_UPDATED | Mode maintenance changé (admin) | `{ enabled, message }` |

---

## Format SSE

Les messages suivent le format Server-Sent Events :

```
event: EVENT_NAME
data: {"key":"value"}

```

Chaque message se termine par deux sauts de ligne `\n\n`.

---

## Keep-alive

Le service envoie automatiquement des pings toutes les 20 secondes :

```
: ping 1704734400000

```

Cela permet :
- De maintenir la connexion active
- De détecter les connexions fermées
- D'éviter les timeouts proxy

---

## Gestion des connexions

### Stockage en mémoire

```javascript
connections = Map {
  userId1 => Map {
    connId1 => { res, role },
    connId2 => { res, role }
  },
  userId2 => Map {
    connId3 => { res, role }
  }
}
```

### Nettoyage automatique

À la déconnexion du client :
1. Arrêt de l'intervalle de ping
2. Suppression de la connexion de la Map
3. Si plus de connexion pour l'utilisateur, suppression de la Map utilisateur

---

## Sécurité

Mesures de sécurité :
- Vérification de l'identité utilisateur avant souscription
- Isolation des connexions par utilisateur
- Gestion des erreurs d'écriture (connexions cassées)
- Pas de diffusion cross-utilisateur non autorisée
- Filtrage par rôle pour les événements admin

---

## Erreurs possibles

| Erreur | Cause |
|--------|-------|
| Connexion fermée | Client déconnecté |
| Erreur d'écriture | Connexion réseau perdue |
| Map vide | Aucun utilisateur connecté |

Les erreurs sont gérées silencieusement (try/catch) pour ne pas crasher le serveur.

---

## Limitations

### Mono-instance
- Les connexions ne sont stockées qu'en mémoire locale
- Pas de partage entre serveurs multiples
- Perte des connexions au redémarrage

### Solution pour multi-instances
Pour un déploiement distribué, utiliser :
- Redis Pub/Sub
- Socket.io avec Redis adapter
- Message broker (RabbitMQ, Kafka)

---

## Performance

Considérations de performance :
- Légère empreinte mémoire par connexion
- Pas de base de données sollicitée
- Ping minimal (commentaire SSE)
- Nettoyage automatique des connexions fermées
- Pas de limite du nombre de connexions (dépend de la RAM)

---

## Utilisation dans l'application

### Côté Backend

```javascript
// Souscription
app.get('/api/realtime/subscribe', auth, (req, res) => {
  sseInit(res)
  subscribeRealtime({
    userId: req.user.id,
    role: req.user.role,
    res
  })
})

// Publication
publishToUser(userId, 'PORTFOLIO_UPDATED', data)
publishToRoles(['admin'], 'USER_BANNED', data)
```

### Côté Frontend

```javascript
const eventSource = new EventSource('/api/realtime/subscribe')

eventSource.addEventListener('hello', (e) => {
  console.log('Connecté:', JSON.parse(e.data))
})

eventSource.addEventListener('PORTFOLIO_UPDATED', (e) => {
  const data = JSON.parse(e.data)
  updateUI(data)
})

eventSource.onerror = () => {
  console.error('Connexion perdue')
}
```

---

## Tests

Cas à tester :
- Établissement de connexion SSE
- Réception du message hello
- Publication à un utilisateur
- Publication par rôle
- Keep-alive (ping)
- Déconnexion propre
- Gestion des erreurs d'écriture
- Connexions multiples par utilisateur
