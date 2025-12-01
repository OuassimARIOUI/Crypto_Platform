# Documentation — getLatestPrices.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : src/services/getLatestPrices.js

---

## Objectif du fichier

Ce module fournit une fonction permettant de récupérer les **100 derniers prix** enregistrés dans la base de données pour l’ensemble des cryptomonnaies.

Cette fonction est généralement utilisée pour :

- alimenter un tableau de données en temps réel,
- afficher les prix les plus récents dans un dashboard,
- fournir des données aux modules d’analyse ou d’alertes.

---

## Fonction : getLatestPrices()

### Rôle

Retourner les entrées les plus récentes de la table `crypto_prices`, triées par date de récupération (`fetched_at`), du plus récent au plus ancien.

---

## Dépendance utilisée

| Module | Rôle |
|--------|------|
| Prisma (`prisma`) | Lecture des données dans la table `crypto_prices` |

---

## Behavior détaillé

### 1. Requête Prisma

```js
prisma.crypto_prices.findMany({
    orderBy: { fetched_at: "desc" },
    take: 100
});
```

#### Détails :

- `orderBy: { fetched_at: "desc" }`  
  Trie les prix par date de récupération, **du plus récent au plus ancien**.

- `take: 100`  
  Limite les résultats aux **100 dernières entrées**, ce qui permet d’éviter une surcharge de données.

---

## Exemple d’appel

```js
const prices = await getLatestPrices();
```

---

## Exemple de retour

```json
[
  {
    "id": 15530,
    "crypto_id": 1,
    "price_usd": "43210.35",
    "fetched_at": "2025-12-01T15:22:10.123Z"
  },
  {
    "id": 15529,
    "crypto_id": 1,
    "price_usd": "43180.10",
    "fetched_at": "2025-12-01T15:21:10.500Z"
  }
]
```

---


