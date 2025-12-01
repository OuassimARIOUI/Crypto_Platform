# Documentation — portfolio.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/portfolio.controller.js`

---

## Objectif du fichier

Ce contrôleur gère toutes les opérations liées au **portefeuille utilisateur**, notamment :

- Consultation du portefeuille (`getMyPortfolioController`)
- Achat de cryptomonnaie (`buyCryptoController`)
- Vente de cryptomonnaie (`sellCryptoController`)
- Ajout de fonds (`addFundsController`)

Il s’appuie sur les services suivants :

- `portfolioService.js` pour la logique d’achat/vente/portefeuille
- `addFundsService.js` pour le crédit d’argent
- `logger.js` pour la gestion des logs d’erreurs

---

# 1. Fonction : getMyPortfolioController(req, res)

### Rôle
Récupérer le portefeuille complet de l’utilisateur connecté via son `user.id`.

### Fonctionnement
1. Appel du service :
```js
const result = await getMyPortfolio(req.user.id);
```

2. Retour direct au client :
```js
return res.json(result);
```

3. Gestion des erreurs :
```js
logError("Error getMyPortfolioController", err);
return res.status(500).json({ error: "Erreur serveur" });
```

---

# 2. Fonction : buyCryptoController(req, res)

### Rôle  
Permettre à l’utilisateur d’acheter une cryptomonnaie.

### Validation
Vérifie si `symbol` et `quantity` sont fournis :

```js
if (!symbol || !quantity)
    return res.status(400).json({ error: "symbol & quantity requis" });
```

### Achat
```js
await buyCrypto(req.user.id, symbol, Number(quantity));
```

### Réponse
Retourne le portefeuille mis à jour.

### Gestion d’erreurs
Retourne systématiquement :

```json
{ "error": "Erreur serveur" }
```

en cas d’exception.

---

# 3. Fonction : sellCryptoController(req, res)

### Rôle  
Permettre à l’utilisateur de vendre une cryptomonnaie qu’il possède.

### Validation
```js
if (!symbol || !quantity)
    return res.status(400).json({ error: "symbol & quantity requis" });
```

### Vente
```js
await sellCrypto(req.user.id, symbol, Number(quantity));
```

### Réponse
Retourne le portefeuille mis à jour.

### Erreur
Retourne une erreur 500 en cas d’exception.

---

# 4. Fonction : addFundsController(req, res)

### Rôle  
Ajouter des fonds au portefeuille utilisateur (dépôt).

### Fonctionnement
1. Extraction :
```js
const { amount } = req.body;
const userId = req.user.id;
```

2. Crédit du portefeuille :
```js
const newBalance = await addFunds(userId, Number(amount));
```

3. Réponse :
```json
{
  "success": true,
  "balance": newBalance
}
```

### Erreurs
Cas particulier :  
Toute erreur renvoie un code **400** (et non 500) avec le message exact de l’erreur.

---

