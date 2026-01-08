# Documentation — Service Discord OAuth

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `discordService.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

## Objectif

Le service `discordService` gère l'intégration OAuth avec Discord.  
Il permet aux utilisateurs de lier leur compte Discord à leur profil sur la plateforme.

Fonctionnalités principales :
- Génération de l'URL d'autorisation Discord
- Échange du code d'autorisation contre un token
- Récupération des informations utilisateur Discord
- Liaison avec le compte utilisateur de la plateforme

---

## Configuration requise

### Variables d'environnement

```env
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_REDIRECT_URI=https://votre-domaine.com/api/discord/callback
```

---

## Fonctions principales

### `getDiscordAuthorizeUrl`

Génère l'URL d'autorisation OAuth Discord.

```javascript
export function getDiscordAuthorizeUrl()
```

#### Paramètres OAuth

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| client_id | Depuis env | ID de l'application Discord |
| redirect_uri | Depuis env | URL de callback |
| response_type | code | Type de réponse OAuth |
| scope | identify | Permissions demandées |
| prompt | consent | Force l'affichage du consentement |

#### Valeur retournée

```javascript
String // URL complète d'autorisation Discord
// Exemple: https://discord.com/oauth2/authorize?client_id=...&scope=identify...
```

#### Utilisation

```javascript
const authUrl = getDiscordAuthorizeUrl()
res.redirect(authUrl)
```

---

### `exchangeCodeForDiscordIdentity`

Échange le code d'autorisation contre les informations utilisateur Discord.

```javascript
export async function exchangeCodeForDiscordIdentity(code)
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| code | String | Code d'autorisation reçu de Discord |

#### Processus

1. **Échange code → token**
   - POST vers `/oauth2/token`
   - Récupère `access_token`

2. **Récupération profil**
   - GET vers `/users/@me`
   - Utilise `access_token` en Bearer

#### Valeur retournée

```javascript
{
  id: String,          // ID Discord unique
  username: String,    // Nom d'utilisateur Discord
  discriminator: String, // #1234
  avatar: String|null  // Hash de l'avatar
}
```

#### En cas d'erreur

```javascript
throw new Error("Discord token exchange failed")
throw new Error("Discord user fetch failed")
```

---

## Fonctions utilitaires

### `getEnv`

Récupère une variable d'environnement avec gestion des espaces.

```javascript
function getEnv(name)
```

- Retourne `null` si vide ou inexistante
- Trim automatique des espaces

### `requireEnv`

Récupère une variable d'environnement obligatoire.

```javascript
function requireEnv(name)
```

- Lance une erreur si manquante
- Utilisé pour les credentials Discord

---

## Flux OAuth complet

### 1. Redirection vers Discord

```javascript
// Route: GET /api/discord/authorize
const authUrl = getDiscordAuthorizeUrl()
res.redirect(authUrl)
```

### 2. Callback Discord

```javascript
// Route: GET /api/discord/callback?code=xxx
const { code } = req.query

try {
  const discordUser = await exchangeCodeForDiscordIdentity(code)
  
  // Lier le compte Discord au compte utilisateur
  await prisma.users.update({
    where: { id: req.user.id },
    data: {
      discord_id: discordUser.id,
      discord_username: `${discordUser.username}#${discordUser.discriminator}`
    }
  })
  
  res.redirect('/profile?discord=linked')
} catch (error) {
  res.redirect('/profile?discord=error')
}
```

---

## API Discord utilisée

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| /oauth2/authorize | GET | Autorisation utilisateur |
| /oauth2/token | POST | Échange code contre token |
| /users/@me | GET | Informations utilisateur |

### Base URL

```
https://discord.com/api/v10
```

---

## Gestion des erreurs

### Erreurs de configuration

```javascript
// Variable manquante
throw new Error("DISCORD_CLIENT_ID is required")
throw new Error("DISCORD_CLIENT_SECRET is required")
throw new Error("DISCORD_REDIRECT_URI is required")
```

### Erreurs OAuth

```javascript
// Échange token échoué
if (!tokenRes.ok) {
  throw new Error("Discord token exchange failed")
}

// Récupération profil échouée
if (!userRes.ok) {
  throw new Error("Discord user fetch failed")
}
```

---

## Sécurité

### Mesures implémentées

- Client secret stocké en variable d'environnement
- Validation de la redirection URI
- Scope minimal (`identify` seulement)
- Pas de stockage du token Discord (seulement l'ID)
- Vérification de l'authenticité du code

### Scope `identify`

Permissions accordées :
- ID utilisateur Discord
- Nom d'utilisateur
- Discriminateur (#1234)
- Avatar

Permissions NON accordées :
- Email
- Serveurs Discord
- Connexions tierces
- Amis

---

## Format des données Discord

### Informations utilisateur

```javascript
{
  id: "123456789012345678",
  username: "JohnDoe",
  discriminator: "1234",
  avatar: "a1b2c3d4e5f6" // hash
}
```

### URL de l'avatar

```javascript
const avatarUrl = discordUser.avatar
  ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
  : null
```

---

## Stockage en base de données

### Champs utilisateur

```sql
users (
  ...
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  ...
)
```

### Exemple de sauvegarde

```javascript
await prisma.users.update({
  where: { id: userId },
  data: {
    discord_id: discordUser.id,
    discord_username: `${discordUser.username}#${discordUser.discriminator}`,
    updated_at: new Date()
  }
})
```

---

## Déliaison du compte

```javascript
// Supprimer la liaison Discord
await prisma.users.update({
  where: { id: userId },
  data: {
    discord_id: null,
    discord_username: null
  }
})
```

---

## Tests

Cas à tester :
- Génération de l'URL d'autorisation
- Variables d'environnement manquantes
- Échange de code valide
- Échange de code invalide
- Code expiré
- Token invalide
- Récupération des informations utilisateur
- Liaison du compte
- Déliaison du compte
- Gestion des erreurs réseau

---

## Configuration Discord Developer Portal

### 1. Créer une application

1. Aller sur https://discord.com/developers/applications
2. Cliquer sur "New Application"
3. Donner un nom à l'application

### 2. Configurer OAuth2

1. Onglet "OAuth2"
2. Ajouter la Redirect URI : `https://votre-domaine.com/api/discord/callback`
3. Noter le Client ID et Client Secret

### 3. Définir les permissions

1. Sélectionner le scope `identify`
2. Copier l'URL générée pour tester

---

## Limitations

- Pas de rafraîchissement automatique du profil Discord
- Pas de webhook Discord
- Pas d'envoi de messages Discord
- Un seul compte Discord par utilisateur
- Nécessite que l'utilisateur soit connecté sur la plateforme

---

## Extensions possibles

- Ajout du scope `email` pour récupérer l'email Discord
- Synchronisation périodique du profil
- Notifications Discord via webhook
- Affichage des serveurs communs
- Badge "Discord vérifié" sur le profil
