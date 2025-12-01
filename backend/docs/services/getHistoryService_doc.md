# Documentation — getHistoryService.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : src/services/getHistoryService.js

---

## Objectif du fichier

Ce module fournit une fonction permettant de récupérer l’historique des prix d’une cryptomonnaie sur une période donnée.  
Il est utilisé dans l’affichage des graphiques (sparkline, courbes d’évolution, dashboard).

---

## Fonction : getHistoryService(symbol, timeframe)

### Rôle

Récupérer les derniers enregistrements de prix pour une cryptomonnaie donnée, selon un **timeframe** configurable :

- 24h  
- 7 jours  
- 1 mois  
- 6 mois  
- 1 an  

La fonction retourne ensuite les données triées **du plus ancien au plus récent**.

---

## Paramètres

| Paramètre | Type | Description |
|----------|-------|-------------|
| symbol | string | Symbole de la crypto (ex : "btc", "eth") |
| timeframe | string | Période d’historique (par défaut : `"24h"`) |

---

## Déroulement de la fonction

### 1. Recherche de la crypto

```js
const crypto = await prisma.cryptos.findUnique({
    where: { symbol: symbol.toLowerCase() }
});
```

Si la crypto n'existe pas, la fonction retourne :

```js
[]
```

---

### 2. Conversion du timeframe en nombre d'heures

```js
const hours = {
    "24h": 24,
    "7d": 24 * 7,
    "1m": 24 * 30,
    "6m": 24 * 180,
    "1y": 24 * 365,
}[timeframe] || 24;
```

Si le timeframe est invalide, la valeur par défaut est :

```
24 heures
```

---

### 3. Récupération des prix

```js
const prices = await prisma.crypto_prices.findMany({
    where: { crypto_id: crypto.id },
    orderBy: { fetched_at: "desc" },
    take: hours,
});
```

Les résultats sont récupérés **du plus récent au plus ancien**.

---

### 4. Tri + formatage final

Les prix sont inversés pour être triés dans l’ordre chronologique :

```js
prices.reverse();
```

Puis chaque entrée est convertie en :

```js
{
    time: <timestamp>,
    price: <prix en Number>
}
```

---

## Exemple de retour

```json
[
  {
    "time": "2025-12-01T09:00:00Z",
    "price": 45000
  },
  {
    "time": "2025-12-01T10:00:00Z",
    "price": 45500
  }
]
```

---

