# Documentation — getPriceHistory.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/getPriceHistory.controller.js`

---

## Objectif du fichier

Ce contrôleur permet de récupérer **l’historique des prix d’une cryptomonnaie** sur une période donnée.  
Il utilise le service `getHistoryService()` qui interroge la base pour retourner une liste chronologique :

- timestamp
- prix USD

Ce contrôleur est utilisé par les graphiques (lines, sparkline, zone chart…) dans le frontend.

---

# Fonction : getPriceHistoryController(req, res)

### Rôle

- Lire les paramètres HTTP : `symbol` et `timeframe`
- Appeler le service `getHistoryService(symbol, timeframe)`
- Retourner les données au format JSON
- Gérer les erreurs et renvoyer un code 500 en cas de problème

---

## Paramètres attendus

| Nom | Emplacement | Type | Obligatoire | Description |
|-----|-------------|------|-------------|-------------|
| symbol | req.params | string | Oui | Le symbole de la cryptomonnaie (btc, eth…) |
| timeframe | req.query | string | Non | Ex : 24h, 7d, 1m, 6m, 1y (24h par défaut) |

---

## Fonctionnement détaillé

### 1. Extraction des données de la requête

```js
const { symbol } = req.params;
const timeframe = req.query.timeframe || "24h";
```

- `symbol` → obligatoire  
- `timeframe` → facultatif, valeur par défaut : **"24h"**

---

### 2. Appel du service métier

```js
const data = await getHistoryService(symbol, timeframe);
```

Ce service :
- récupère X heures de données selon le timeframe
- les trie du plus ancien au plus récent
- formate `{ time, price }`

---

### 3. Réponse envoyée au client

```js
return res.json(data);
```

Exemple typique :

```json
[
  { "time": "2025-01-01T10:00:00Z", "price": 43000.11 },
  { "time": "2025-01-01T11:00:00Z", "price": 43210.55 }
]
```

---

### 4. Gestion des erreurs

En cas de problème :

```js
catch(err) {
    console.error("History Controller Error:", err);
    return res.status(500).json({ error: "Erreur interne serveur" });
}
```

Le client reçoit alors :

```json
{ "error": "Erreur interne serveur" }
```

---


