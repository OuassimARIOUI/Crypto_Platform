# Documentation — Service de Paramètres Application

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `appSettingsService.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

## Objectif

Le service `appSettingsService` gère les paramètres globaux de l'application, notamment le mode maintenance.  
Il permet d'activer/désactiver le mode maintenance et de définir un message personnalisé pour les utilisateurs.

Fonctionnalités principales :
- Gestion du mode maintenance
- Message personnalisé de maintenance
- Cache en mémoire pour les performances
- Mise à jour en temps réel
- Notifications des administrateurs

---

## Fonctions principales

### `getMaintenanceConfig`

Récupère la configuration actuelle du mode maintenance avec cache.

```javascript
export async function getMaintenanceConfig({ noCache = false } = {})
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| noCache | Boolean | Ignorer le cache (optionnel, défaut: false) |

#### Cache

- Durée de vie du cache : 5 secondes (5000ms)
- Cache en mémoire (variable globale)
- Rafraîchissement automatique après expiration
- Option `noCache: true` pour forcer le rafraîchissement

#### Comportement

1. Vérifie si le cache est valide
2. Si cache valide et `noCache=false`, retourne le cache
3. Sinon, interroge la base de données (upsert)
4. Gère les collisions de clé unique (P2002)
5. Met à jour le cache
6. Retourne la configuration

#### Valeur retournée

```javascript
{
  enabled: Boolean,      // Mode maintenance activé
  message: String|null,  // Message personnalisé (max 200 caractères)
  updatedAt: Date       // Date de dernière mise à jour
}
```

---

### `setMaintenanceMode`

Active ou désactive le mode maintenance.

```javascript
export async function setMaintenanceMode({ enabled, message, actorId })
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| enabled | Boolean | Activer (true) ou désactiver (false) |
| message | String | Message personnalisé (optionnel, max 200 caractères) |
| actorId | Number | ID de l'administrateur effectuant l'action |

#### Validation

Le message est automatiquement :
- Trimé (suppression des espaces)
- Limité à 200 caractères
- Converti en `null` si vide ou invalide

#### Comportement

1. Normalise le message
2. Met à jour la configuration en base de données
3. Invalide le cache
4. Crée un log d'audit
5. Notifie tous les administrateurs via SSE
6. Retourne la nouvelle configuration

#### Valeur retournée

```javascript
{
  enabled: Boolean,
  message: String|null,
  updatedAt: Date
}
```

---

## Fonction utilitaire

### `normalizeMessage`

Normalise et valide un message de maintenance.

```javascript
function normalizeMessage(message)
```

#### Comportement

- Accepte uniquement les chaînes de caractères
- Supprime les espaces avant/après
- Limite à 200 caractères maximum
- Retourne `null` si vide ou invalide

---

## Accès Base de Données

### Table utilisée

```sql
app_settings (
  key TEXT PRIMARY KEY,
  maintenance_enabled BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Clé unique

La configuration utilise une clé unique : `"global"`

### Opérations

```sql
-- Récupération/Création (upsert)
INSERT INTO app_settings (key)
VALUES ('global')
ON CONFLICT (key) DO NOTHING

-- Mise à jour
UPDATE app_settings
SET maintenance_enabled = ?,
    maintenance_message = ?,
    updated_at = NOW()
WHERE key = 'global'
```

---

## Système de cache

### Variables globales

```javascript
let cachedMaintenance = null    // Cache de la configuration
let cacheExpiresAt = 0          // Timestamp d'expiration
const CACHE_TTL_MS = 5000       // Durée de vie : 5 secondes
```

### Stratégie

1. **Lecture avec cache** (défaut)
   - Vérifie l'expiration
   - Retourne le cache si valide
   - Sinon, interroge la BDD

2. **Lecture sans cache**
   - `noCache: true`
   - Interroge toujours la BDD
   - Met à jour le cache

3. **Invalidation**
   - `setMaintenanceMode` invalide automatiquement
   - `cacheExpiresAt = 0`

### Avantages

- Réduit la charge sur la base de données
- Réponses instantanées
- Mise à jour rapide (5s max)
- Pas de Redis nécessaire pour cette donnée

---

## Audit et Logs

Chaque modification du mode maintenance crée un log d'audit :

```javascript
createAuditLog({
  actorId,
  action: enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
  metadata: { message }
})
```

Cela permet de tracer :
- Qui a activé/désactivé le mode
- Quand l'action a été effectuée
- Quel message a été défini

---

## Notifications temps réel

Après modification, tous les administrateurs connectés reçoivent une notification SSE :

```javascript
publishToRoles(['admin'], 'MAINTENANCE_UPDATED', {
  enabled,
  message,
  updatedAt
})
```

Cela permet :
- Synchronisation immédiate des interfaces admin
- Pas besoin de rafraîchir la page
- Alertes en temps réel

---

## Gestion d'erreurs

### Collision de clé (P2002)

Si deux requêtes tentent de créer la configuration simultanément :

```javascript
try {
  await prisma.app_settings.upsert(...)
} catch (err) {
  if (err?.code === "P2002") {
    // Récupère la ligne existante
    row = await prisma.app_settings.findUnique(...)
  }
}
```

### Configuration manquante

Si la configuration n'existe pas après l'upsert (rare) :

```javascript
if (!row) {
  row = await prisma.app_settings.create({
    data: { key: GLOBAL_SETTINGS_KEY }
  })
}
```

---

## Utilisation dans l'application

### Vérifier le mode maintenance

```javascript
// Avec cache (rapide)
const config = await getMaintenanceConfig()
if (config.enabled) {
  return res.status(503).json({
    maintenance: true,
    message: config.message
  })
}

// Sans cache (pour forcer la vérification)
const config = await getMaintenanceConfig({ noCache: true })
```

### Activer le mode maintenance

```javascript
await setMaintenanceMode({
  enabled: true,
  message: "Maintenance programmée. Retour dans 1 heure.",
  actorId: req.user.id
})
```

### Désactiver le mode maintenance

```javascript
await setMaintenanceMode({
  enabled: false,
  message: null,
  actorId: req.user.id
})
```

---

## Middleware de vérification

Un middleware peut vérifier automatiquement le mode maintenance :

```javascript
async function maintenanceCheck(req, res, next) {
  // Exclure les admins
  if (req.user?.role === 'admin') {
    return next()
  }

  const config = await getMaintenanceConfig()
  
  if (config.enabled) {
    return res.status(503).json({
      error: 'Maintenance en cours',
      message: config.message || 'Service temporairement indisponible'
    })
  }

  next()
}
```

---

## Sécurité

Mesures de sécurité :
- Seuls les administrateurs peuvent modifier la configuration
- Logs d'audit pour traçabilité
- Validation et normalisation des messages
- Limitation de la taille des messages (200 caractères)
- Gestion des collisions de clé unique

---

## Performance

Optimisations :
- Cache en mémoire (5 secondes)
- Pas de requête BDD pour lectures fréquentes
- Upsert au lieu de SELECT puis INSERT/UPDATE
- Invalidation ciblée du cache

Charge typique :
- Lecture : < 1ms (cache hit)
- Lecture : ~5-10ms (cache miss)
- Écriture : ~10-20ms (avec audit et notification)

---

## Tests

Cas à tester :
- Récupération avec cache valide
- Récupération avec cache expiré
- Récupération avec `noCache: true`
- Activation du mode maintenance
- Désactivation du mode maintenance
- Message trop long (> 200 caractères)
- Message vide ou null
- Collision de clé unique
- Création de log d'audit
- Notification des admins
- Invalidation du cache
