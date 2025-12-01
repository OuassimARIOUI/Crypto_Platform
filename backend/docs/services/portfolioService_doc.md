# Documentation — portfolioService.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : src/services/portfolioService.js

---

## Objectif du fichier

Ce module gère toutes les opérations liées au **portefeuille utilisateur**, incluant :

- Récupération complète du portefeuille (`getMyPortfolio`)
- Achat d’une cryptomonnaie (`buyCrypto`)
- Vente d’une cryptomonnaie (`sellCrypto`)
- Calcul automatique des holdings (quantités détenues)
- Gestion de la balance (solde disponible)
- Enregistrement des transactions (historique)

Il constitue la partie centrale du module **Portefeuille / Trading virtuel**.

---

# 1. Fonction : getMyPortfolio(userId)

### Rôle  
Récupérer toutes les informations liées au portefeuille d’un utilisateur.

### Fonctionnement détaillé

1. Lecture du portefeuille associé à `userId`
2. Inclusion des transactions ordonnées par date décroissante
3. Calcul des **quantités finales** pour chaque crypto :
   - `buy` augmente la quantité
   - `sell` la diminue
4. Retour d’un objet contenant :
   - `balance`
   - `holdings` (quantités actuelles par crypto)
   - `transactions` (liste complète)

### Exemple de retour

```json
{
  "balance": 1500,
  "holdings": {
    "btc": 0.125,
    "eth": 2.5
  },
  "transactions": [
    {
      "id": 52,
      "type": "buy",
      "quantity": 0.05,
      "price_usd": 44000,
      "crypto": { "symbol": "btc" }
    }
  ]
}
```

---

# 2. Fonction : buyCrypto(userId, symbol, quantity)

### Rôle  
Permettre à l’utilisateur d’acheter une cryptomonnaie.

### Étapes de validation

1. Vérifier que la crypto existe
2. Obtenir le dernier prix connu
3. Vérifier que le portefeuille existe
4. Calculer le coût total :  
   ```
   cost = price * quantity
   ```
5. Vérifier que la balance est suffisante
6. Déduire le solde du portefeuille
7. Enregistrer une transaction de type `"buy"`
8. Retourner le portefeuille mis à jour

### Exemple d’appel

```js
await buyCrypto(12, "btc", 0.01);
```

---

# 3. Fonction : sellCrypto(userId, symbol, quantity)

### Rôle  
Permettre à l’utilisateur de vendre une cryptomonnaie.

### Étapes de validation

1. Vérifier que la crypto existe
2. Obtenir le dernier prix connu
3. Charger le portefeuille et les transactions
4. Calculer la quantité possédée :
   - additionner les `buy`
   - soustraire les `sell`
5. Vérifier que l’utilisateur possède assez de quantité pour vendre
6. Créditer la balance :
   ```
   gain = price * quantity
   ```
7. Enregistrer une transaction de type `"sell"`
8. Retourner le portefeuille mis à jour

### Exemple d’appel

```js
await sellCrypto(12, "eth", 1.2);
```

---



