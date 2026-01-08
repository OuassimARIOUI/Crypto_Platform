# Documentation — Service de Logs d'Audit

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `auditLogService.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

## Objectif

Le service `auditLogService` gère l'enregistrement des actions importantes effectuées dans l'application.  
Il permet de tracer toutes les opérations critiques pour la sécurité, la conformité et le débogage.

Fonctionnalités principales :
- Enregistrement des actions administratives
- Traçabilité des modifications utilisateur
- Historique des bannissements
- Logs des rapports traités
- Métadonnées personnalisées

---

## Fonction principale

### `createAuditLog`

Crée un nouvel enregistrement dans les logs d'audit.

```javascript
export async function createAuditLog({
    actorId,
    action,
    targetUserId,
    reportId,
    metadata,
})
```

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| actorId | Number | ID de l'utilisateur effectuant l'action (null pour système) |
| action | String | Type d'action effectuée |
| targetUserId | Number | ID de l'utilisateur cible (optionnel) |
| reportId | Number | ID du rapport concerné (optionnel) |
| metadata | Object | Données additionnelles JSON (optionnel) |

#### Comportement

Insère un nouvel enregistrement dans la table `audit_logs` avec :
- Timestamp automatique (créé par la base)
- Tous les paramètres fournis
- Conversion des valeurs null pour les champs optionnels

#### Valeur retournée

```javascript
{
  id: Number,
  actor_id: Number | null,
  action: String,
  target_user_id: Number | null,
  report_id: Number | null,
  metadata: Object | null,
  created_at: Date
}
```

---

## Types d'actions

### Actions administratives

| Action | Description | Actor | Target | Metadata |
|--------|-------------|-------|--------|----------|
| USER_BANNED | Bannissement utilisateur | Admin | User | `{ reason, bannedUntil }` |
| USER_UNBANNED | Débannissement utilisateur | Admin | User | `{ reason }` |
| USER_ROLE_CHANGED | Modification de rôle | Admin | User | `{ oldRole, newRole }` |
| USER_DELETED | Suppression de compte | Admin | User | `{ reason }` |

### Actions de maintenance

| Action | Description | Actor | Target | Metadata |
|--------|-------------|-------|--------|----------|
| MAINTENANCE_ENABLED | Activation maintenance | Admin | null | `{ message }` |
| MAINTENANCE_DISABLED | Désactivation maintenance | Admin | null | `{}` |

### Actions sur les rapports

| Action | Description | Actor | Target | Metadata |
|--------|-------------|-------|--------|----------|
| REPORT_CREATED | Création de rapport | User | User | `{ reason, type }` |
| REPORT_REVIEWED | Examen de rapport | Admin | User | `{ decision, comment }` |
| REPORT_DISMISSED | Rejet de rapport | Admin | User | `{ reason }` |
| REPORT_ACTIONED | Action suite à rapport | Admin | User | `{ action, severity }` |

### Actions utilisateur

| Action | Description | Actor | Target | Metadata |
|--------|-------------|-------|--------|----------|
| PROFILE_UPDATED | Modification profil | User | User (self) | `{ fields: [...] }` |
| PASSWORD_CHANGED | Changement mot de passe | User | User (self) | `{}` |
| EMAIL_CHANGED | Changement email | User | User (self) | `{ oldEmail, newEmail }` |

### Actions système

| Action | Description | Actor | Target | Metadata |
|--------|-------------|-------|--------|----------|
| AUTO_BAN | Bannissement automatique | null (système) | User | `{ reason, trigger }` |
| SECURITY_ALERT | Alerte sécurité | null (système) | User | `{ type, details }` |

---

## Accès Base de Données

### Table utilisée

```sql
audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id INTEGER REFERENCES users(id),
  report_id INTEGER REFERENCES reports(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Index recommandés

```sql
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_target ON audit_logs(target_user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## Métadonnées (metadata)

Le champ `metadata` est un objet JSON flexible pour stocker des informations additionnelles.

### Exemples de métadonnées

#### Bannissement

```javascript
{
  reason: "Spam répété",
  bannedUntil: "2026-02-01T00:00:00Z",
  reportIds: [12, 15, 18]
}
```

#### Modification de rôle

```javascript
{
  oldRole: "user",
  newRole: "admin",
  grantedBy: "SuperAdmin"
}
```

#### Rapport traité

```javascript
{
  decision: "ban",
  comment: "Comportement abusif confirmé",
  severity: "high",
  evidence: ["screenshot1.png", "log_extract.txt"]
}
```

---

## Exemples d'utilisation

### Bannir un utilisateur

```javascript
await createAuditLog({
  actorId: adminId,
  action: "USER_BANNED",
  targetUserId: userId,
  metadata: {
    reason: "Violation des conditions d'utilisation",
    bannedUntil: bannedUntil.toISOString(),
    severity: "high"
  }
})
```

### Activer le mode maintenance

```javascript
await createAuditLog({
  actorId: adminId,
  action: "MAINTENANCE_ENABLED",
  metadata: {
    message: "Mise à jour de la base de données",
    estimatedDuration: "1 hour"
  }
})
```

### Traiter un rapport

```javascript
await createAuditLog({
  actorId: adminId,
  action: "REPORT_REVIEWED",
  targetUserId: reportedUserId,
  reportId: reportId,
  metadata: {
    decision: "warning",
    comment: "Premier avertissement",
    reviewDuration: 300 // secondes
  }
})
```

### Action système

```javascript
await createAuditLog({
  actorId: null, // Système
  action: "AUTO_BAN",
  targetUserId: userId,
  metadata: {
    reason: "Trop de rapports reçus",
    trigger: "THRESHOLD_EXCEEDED",
    reportCount: 10,
    threshold: 5
  }
})
```

---

## Requêtes utiles

### Récupérer l'historique d'un utilisateur

```javascript
const logs = await prisma.audit_logs.findMany({
  where: {
    OR: [
      { actor_id: userId },
      { target_user_id: userId }
    ]
  },
  orderBy: { created_at: 'desc' },
  take: 50,
  include: {
    actor: { select: { pseudo: true, role: true } },
    target_user: { select: { pseudo: true } }
  }
})
```

### Récupérer les actions d'un admin

```javascript
const adminActions = await prisma.audit_logs.findMany({
  where: {
    actor_id: adminId,
    action: {
      in: ['USER_BANNED', 'USER_UNBANNED', 'REPORT_REVIEWED']
    }
  },
  orderBy: { created_at: 'desc' }
})
```

### Statistiques par action

```javascript
const stats = await prisma.audit_logs.groupBy({
  by: ['action'],
  _count: true,
  orderBy: {
    _count: {
      action: 'desc'
    }
  }
})
```

---

## Sécurité et Conformité

### Protection des données

- Les logs ne contiennent pas de mots de passe
- Les données sensibles sont hachées dans les métadonnées
- Rétention limitée (configurable, ex: 90 jours)
- Accès restreint aux administrateurs

### Conformité RGPD

- Droit à l'oubli : suppression des logs lors de la suppression du compte
- Droit d'accès : API pour récupérer les logs d'un utilisateur
- Minimisation des données : seulement les infos nécessaires
- Traçabilité : qui a fait quoi, quand

---

## Performance

### Optimisations

- Index sur les colonnes fréquemment recherchées
- Pagination systématique des résultats
- Archivage des anciens logs (> 90 jours)
- Pas de cascade delete pour préserver l'historique

### Volumétrie

Estimation pour 10 000 utilisateurs :
- ~1000 logs/jour
- ~30 000 logs/mois
- ~360 000 logs/an
- Taille : ~100-500 bytes/log

Avec archivage trimestriel : ~90 000 logs actifs en base

---

## Maintenance

### Archivage automatique

```javascript
// Script de nettoyage mensuel
await prisma.audit_logs.deleteMany({
  where: {
    created_at: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 jours
    }
  }
})
```

### Export pour analyse

```javascript
// Export CSV pour audit externe
const logs = await prisma.audit_logs.findMany({
  where: {
    created_at: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    actor: { select: { pseudo: true, email: true } },
    target_user: { select: { pseudo: true, email: true } }
  }
})

// Conversion en CSV...
```

---

## Tests

Cas à tester :
- Création de log avec tous les champs
- Création de log avec champs optionnels null
- Création de log système (actorId null)
- Métadonnées JSON complexes
- Récupération par actor_id
- Récupération par target_user_id
- Récupération par action
- Tri par date
- Pagination
- Suppression après archivage
