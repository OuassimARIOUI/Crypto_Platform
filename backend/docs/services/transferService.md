# Documentation — Service de Transfert

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `transferService.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

## Objectif

Le service `transferService` permet de gérer les transferts d'argent entre utilisateurs de la plateforme.  
Il assure la validation des données, la vérification des soldes, la mise à jour des portefeuilles et l'envoi de notifications.

Fonctionnalités principales :
- Transfert de fonds entre deux utilisateurs
- Validation des montants et des participants
- Vérification du solde disponible
- Création de transactions dans l'historique
- Notification en temps réel du destinataire
- Envoi de message automatique au destinataire

---

## Fonctions principales

### `transferBetweenUsers`

Effectue un transfert de fonds d'un utilisateur vers un autre.

```javascript
export async function transferBetweenUsers({ senderId, receiverPseudo, amount, reason })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| senderId | Number | Identifiant de l'utilisateur émetteur |
| receiverPseudo | String | Pseudo de l'utilisateur destinataire |
| amount | Number | Montant à transférer (> 0) |
| reason | String | Motif du transfert (optionnel, max 500 caractères) |

#### Validation

La fonction vérifie :
- Que le `senderId` est valide
- Que le `receiverPseudo` est fourni et non vide
- Que le `amount` est un nombre positif
- Que l'émetteur existe et n'est pas banni
- Que le destinataire existe et n'est pas banni
- Que l'émetteur ne transfère pas à lui-même
- Que le solde de l'émetteur est suffisant

#### En cas d'erreur

```javascript
throw new Error("User id manquant")
throw new Error("Pseudo destinataire requis")
throw new Error("Montant invalide")
throw new Error("Utilisateur émetteur introuvable")
throw new Error("Utilisateur banni")
throw new Error("Destinataire introuvable")
throw new Error("Destinataire banni")
throw new Error("Impossible de transférer vers soi-même")
throw new Error("Solde insuffisant")
```

#### Fonctionnement interne

1. Valide les paramètres d'entrée
2. Récupère les informations de l'émetteur et du destinataire
3. Vérifie que l'émetteur a un solde suffisant
4. Effectue une transaction Prisma pour :
   - Débiter le portefeuille de l'émetteur
   - Créditer le portefeuille du destinataire
   - Créer l'enregistrement de la transaction
5. Publie une notification temps réel au destinataire
6. Envoie un message automatique au destinataire

#### Accès Base de Données

Tables modifiées :
- `portfolios` : mise à jour des soldes (decrement/increment)
- `portfolio_transactions` : création d'un enregistrement

Champs modifiés :
```sql
-- Portefeuille émetteur
balance = balance - amount

-- Portefeuille destinataire
balance = balance + amount

-- Transaction créée
sender_user_id, receiver_user_id, amount, reason, timestamp
```

#### Valeur retournée

```javascript
{
  success: true,
  transaction: {
    id: Number,
    sender_user_id: Number,
    receiver_user_id: Number,
    amount: Number,
    reason: String | null,
    timestamp: Date
  },
  newSenderBalance: Number,
  newReceiverBalance: Number
}
```

---

### `normalizeReason`

Normalise et valide le motif du transfert.

```javascript
function normalizeReason(reason)
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| reason | String | Motif du transfert |

#### Comportement

- Accepte uniquement les chaînes de caractères
- Supprime les espaces avant/après
- Limite à 500 caractères maximum
- Retourne `null` si vide ou invalide

---

### `formatTransferNoticeBody`

Formate le message de notification envoyé au destinataire.

```javascript
function formatTransferNoticeBody({ senderPseudo, amount, reason })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| senderPseudo | String | Pseudo de l'émetteur |
| amount | Number | Montant transféré |
| reason | String | Motif du transfert (optionnel) |

#### Format du message

```
[TRANSFER]
Vous avez reçu un transfert de @pseudo_emetteur.
Montant: 100.00
Motif: Remboursement repas
```

---

## Erreurs possibles

| Erreur | Cause |
|--------|-------|
| User id manquant | senderId invalide ou manquant |
| Pseudo destinataire requis | receiverPseudo vide ou manquant |
| Montant invalide | amount ≤ 0 ou non numérique |
| Utilisateur émetteur introuvable | senderId n'existe pas en base |
| Utilisateur banni | Émetteur ou destinataire banni |
| Destinataire introuvable | Pseudo destinataire n'existe pas |
| Impossible de transférer vers soi-même | senderId == receiverId |
| Solde insuffisant | Balance émetteur < amount |
| PrismaError | Erreur de transaction base de données |

---

## Notifications

Après un transfert réussi, le système :

1. Publie un événement temps réel via WebSocket :
```javascript
publishToUser(receiverId, "PORTFOLIO_UPDATED", { balance: newReceiverBalance })
```

2. Envoie un message direct au destinataire :
```javascript
sendTaggedMessageToDirectConversation({
  fromUserId: senderId,
  toUserId: receiverId,
  body: formatTransferNoticeBody(...)
})
```

---

## Sécurité

Le service implémente plusieurs mesures de sécurité :
- Validation stricte des types et montants
- Vérification de l'existence et du statut des utilisateurs
- Vérification du solde disponible
- Transaction atomique en base de données
- Limitation de la taille du motif (500 caractères)
- Impossibilité de transférer vers soi-même
- Blocage des utilisateurs bannis

---

## Tests

La fonction doit être testée avec les cas suivants :
- Transfert valide entre deux utilisateurs
- Montant invalide (≤ 0, NaN, undefined)
- Utilisateur émetteur inexistant
- Utilisateur destinataire inexistant
- Utilisateur banni
- Solde insuffisant
- Auto-transfert (vers soi-même)
- Motif trop long (> 500 caractères)
- Transaction base de données échouée
