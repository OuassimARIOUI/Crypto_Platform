# Documentation — getLatestPrices.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/getLatestPrices.controller.js`

---

## Objectif du fichier

Ce contrôleur a pour rôle de récupérer **les derniers prix** des cryptomonnaies via le service `getLatestPrices()` et de renvoyer ces données au frontend.

Il s’agit d’un point d’accès API utilisé pour afficher les prix récents sur le dashboard (tableau, graphiques, etc.).

---

# Fonction : getLatestPricesController(req, res)

### Rôle

- Appeler le service `getLatestPrices()`
- Logguer l’état de la connexion Prisma ↔ PostgreSQL
- Retourner la liste des prix au format JSON
- Gérer les erreurs en appelant `logError`

---

## Fonctionnement détaillé

### 1. Appel du service

```js
const prices = await getLatestPrices();
```

Ce service récupère dans la base les derniers prix disponibles, généralement triés par date (`fetched_at desc`).

---

### 2. Enregistrement d’un message d’information

```js
logInfo("Connexion prisma + PostgreSQL établie !");
```

Ce log confirme que la base de données est correctement accessible.

---

### 3. Réponse envoyée au client

```js
return res.json(prices);
```

---

### 4. Gestion des erreurs

```js
catch(error) {
    logError(error);
}
```

⚠️ **Attention :**  
Dans ce contrôleur, aucune réponse (status ou json) n’est renvoyée en cas d’erreur.  
Le client ne recevra donc **aucune réponse** si une exception se produit.  
Pour un comportement REST correct, il serait préférable de faire :

```js
return res.status(500).json({ error: "Erreur interne serveur" });
```

---

## Exemple de réponse

```json
[
  {
    "id": 15420,
    "crypto_id": 1,
    "price_usd": "43210.35",
    "fetched_at": "2025-12-01T14:22:11.120Z"
  },
  {
    "id": 15419,
    "crypto_id": 2,
    "price_usd": "2300.78",
    "fetched_at": "2025-12-01T14:21:54.910Z"
  }
]
```

---


