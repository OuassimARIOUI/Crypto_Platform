# Documentation — Service de Messagerie

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `messagesService.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

## Objectif

Le service `messagesService` gère l'ensemble du système de messagerie de la plateforme.  
Il permet la création de conversations, l'envoi de messages, la gestion des participants et les notifications.

Fonctionnalités principales :
- Conversations directes entre utilisateurs
- Conversations de groupe
- Envoi de messages avec notifications temps réel
- Messages système automatiques (ban, transfert, etc.)
- Gestion des participants aux conversations
- Historique des messages

---

## Fonctions principales

### `ensureDirectConversationByUserIds`

Crée ou récupère une conversation directe entre deux utilisateurs.

```javascript
export async function ensureDirectConversationByUserIds({ userAId, userBId })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| userAId | Number | Identifiant du premier utilisateur |
| userBId | Number | Identifiant du second utilisateur |

#### Validation

- Les deux IDs doivent être valides et différents
- Impossible de créer une conversation avec soi-même

#### Fonctionnement

1. Génère une clé unique pour la conversation (format: `min:max`)
2. Utilise `upsert` pour créer ou récupérer la conversation
3. Crée automatiquement les participants si nouvelle conversation

#### Valeur retournée

```javascript
Number // ID de la conversation
```

---

### `sendTaggedMessageToDirectConversation`

Envoie un message système dans une conversation directe avec notification.

```javascript
export async function sendTaggedMessageToDirectConversation({ fromUserId, toUserId, body })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| fromUserId | Number | ID de l'expéditeur |
| toUserId | Number | ID du destinataire |
| body | String | Contenu du message (max 2000 caractères) |

#### Comportement

1. Assure l'existence de la conversation directe
2. Crée le message en base de données
3. Publie une notification temps réel au destinataire
4. Marque automatiquement le message comme "tagged" (système)

---

### `sendMessageToConversation`

Envoie un message dans une conversation (directe ou groupe).

```javascript
export async function sendMessageToConversation({ userId, conversationId, body })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| userId | Number | ID de l'utilisateur émetteur |
| conversationId | Number | ID de la conversation |
| body | String | Contenu du message (max 2000 caractères) |

#### Validation

- Vérifie que l'utilisateur est participant de la conversation
- Vérifie que le message n'est pas vide après normalisation

#### En cas d'erreur

```javascript
throw new Error("User not found in conversation participants")
throw new Error("Message body cannot be empty")
```

---

### `getConversationMessages`

Récupère l'historique des messages d'une conversation avec pagination.

```javascript
export async function getConversationMessages({ conversationId, userId, limit = 50, before })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| conversationId | Number | ID de la conversation |
| userId | Number | ID de l'utilisateur demandeur |
| limit | Number | Nombre de messages à récupérer (défaut: 50, max: 100) |
| before | Number | ID du message pour pagination (optionnel) |

#### Validation

- Vérifie que l'utilisateur est participant de la conversation
- Limite le nombre de messages à 100 maximum

#### Valeur retournée

```javascript
{
  messages: [
    {
      id: Number,
      user_id: Number,
      body: String,
      timestamp: Date,
      user: {
        pseudo: String,
        avatar_url: String
      }
    }
  ],
  hasMore: Boolean
}
```

---

### `getUserConversations`

Récupère la liste des conversations d'un utilisateur.

```javascript
export async function getUserConversations({ userId })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| userId | Number | ID de l'utilisateur |

#### Valeur retournée

```javascript
[
  {
    id: Number,
    type: String, // "direct" ou "group"
    name: String | null, // Nom du groupe (null pour direct)
    last_message_at: Date | null,
    participants: [
      {
        user: {
          id: Number,
          pseudo: String,
          avatar_url: String
        }
      }
    ],
    messages: [
      {
        id: Number,
        body: String,
        timestamp: Date,
        user: { pseudo: String }
      }
    ]
  }
]
```

---

### `formatBanNoticeBody`

Formate un message de notification de bannissement.

```javascript
export function formatBanNoticeBody({ reason, bannedUntil })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| reason | String | Motif du bannissement |
| bannedUntil | Date | Date de fin du ban (null si permanent) |

#### Format du message

```
[BAN]
Votre compte a été banni.
Motif: Violation des règles
Fin: 2026-02-01T00:00:00.000Z
```

---

## Fonctions utilitaires

### `normalizeBody`

Normalise le contenu d'un message.

```javascript
function normalizeBody(body)
```

- Accepte uniquement les chaînes de caractères
- Supprime les espaces avant/après
- Limite à 2000 caractères maximum
- Retourne une chaîne vide si invalide

---

### `directKeyFor`

Génère une clé unique pour une conversation directe.

```javascript
function directKeyFor(userAId, userBId)
```

- Format: `{min_id}:{max_id}`
- Assure l'unicité quelque soit l'ordre des utilisateurs
- Exemple: `directKeyFor(5, 2)` → `"2:5"`

---

## Accès Base de Données

### Tables utilisées

- `conversations` : stockage des conversations
- `conversation_participants` : liens utilisateurs-conversations
- `messages` : stockage des messages
- `users` : informations des utilisateurs

### Champs importants

```sql
-- conversations
id, type (direct/group), name, direct_key, last_message_at

-- conversation_participants
conversation_id, user_id

-- messages
id, conversation_id, user_id, body, timestamp

-- users
id, pseudo, avatar_url
```

---

## Notifications temps réel

Le service utilise `realtimeService` pour publier des événements WebSocket :

```javascript
// Nouveau message
publishToUser(participantId, "NEW_MESSAGE", {
  conversationId,
  message: {...}
})

// Message tagué système
publishToUser(toUserId, "TAGGED_MESSAGE", {
  conversationId,
  message: {...}
})
```

---

## Types de messages

### Messages utilisateur
Messages normaux envoyés par les utilisateurs dans les conversations.

### Messages système (tagged)
Messages automatiques envoyés par le système :
- Notifications de transfert
- Notifications de bannissement
- Alertes administratives

---

## Erreurs possibles

| Erreur | Cause |
|--------|-------|
| Invalid user ids | IDs utilisateurs invalides |
| Cannot create direct conversation with self | Tentative de conversation avec soi-même |
| User not found in conversation participants | Utilisateur non participant |
| Message body cannot be empty | Corps du message vide |
| Conversation not found | ID de conversation invalide |
| PrismaError | Erreur de base de données |

---

## Sécurité

Mesures de sécurité implémentées :
- Vérification de l'appartenance aux conversations
- Limitation de la taille des messages (2000 caractères)
- Validation des IDs utilisateurs
- Impossibilité de lire/écrire dans des conversations non autorisées
- Normalisation du contenu des messages
- Clé unique pour les conversations directes

---

## Pagination

Le système de pagination utilise le paramètre `before` :
- Par défaut : récupère les 50 derniers messages
- `before=messageId` : récupère les messages avant ce message
- Limite maximum : 100 messages par requête
- Tri : par timestamp décroissant (plus récents en premier)

---

## Tests

Cas à tester :
- Création de conversation directe
- Envoi de message dans conversation existante
- Envoi de message dans conversation inexistante
- Accès non autorisé à une conversation
- Message vide ou trop long
- Pagination des messages
- Récupération de la liste des conversations
- Messages système (tagged)
- Notifications temps réel
