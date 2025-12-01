# Documentation — middleware/auth.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/middleware/auth.js`

---

## Objectif du fichier

Ce middleware gère :
- **L’authentification via JWT** (`auth`)
- **La restriction aux administrateurs** (`adminOnly`)

Ce fichier permet de sécuriser les routes du backend :

- Empêcher l’accès aux utilisateurs non connectés
- Vérifier l’identité de l’utilisateur via un token JWT
- Limiter certaines routes aux administrateurs uniquement

---

# 1. Fonction : auth(req, res, next)

### Rôle  
Vérifier qu’un utilisateur possède un **token JWT valide**.

---

## Étapes détaillées

### 1. Vérifier la présence du header Authorization

```js
const header = req.headers.authorization;
if (!header) return res.status(401).json({ error: "Token manquant" });
```

Si aucun token :
➡️ **HTTP 401 — Token manquant**

---

### 2. Extraire le token

Les requêtes doivent suivre le format :
```
Authorization: Bearer <token>
```

```js
const token = header.split(" ")[1];
```

---

### 3. Vérifier le token

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

Si le token est invalide ou expiré :
➡️ **HTTP 401 — Token invalide**

---

### 4. Attacher l’utilisateur à req

En cas de succès :

```js
req.user = decoded;
next();
```

Le contrôleur des routes pourra ensuite accéder à :
```js
req.user.id
req.user.role
```

---

## Exemple d’erreurs

### Token manquant
```json
{
  "error": "Token manquant"
}
```

### Token invalide
```json
{
  "error": "Token invalide"
}
```

---

# 2. Fonction : adminOnly(req, res, next)

### Rôle  
Autoriser **uniquement les administrateurs** à accéder à certaines routes.

---

## Fonctionnement

```js
if (req.user.role !== "admin")
    return res.status(403).json({ error: "Accès refusé" });
```

Si l’utilisateur n’est pas admin :
➡️ **HTTP 403 — Accès refusé**

Sinon :
```js
next();
```

---

## Exemple d’utilisation

```js
app.get("/admin/dashboard", auth, adminOnly, adminDashboardController);
```

---

## Code source complet

```js
import jwt from "jsonwebtoken";

export function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Token manquant" });

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token invalide" });
    }
}

export function adminOnly(req, res, next) {
    if (req.user.role !== "admin")
        return res.status(403).json({ error: "Accès refusé" });

    next();
}
```

