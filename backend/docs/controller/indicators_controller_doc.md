# Documentation — indicators.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/indicators.controller.js`

---

## Objectif du fichier

Le contrôleur `indicatorsController` permet d’obtenir les **indicateurs techniques** (RSI, MACD, moyennes mobiles, etc.) d’une cryptomonnaie en fonction de son symbole.

Il délègue toute la logique métier au service :

```
getIndicatorsBySymbol(symbol)
```

et gère également la remontée des erreurs grâce au système de logs.

---

# Fonction : indicatorsController(req, res)

### Rôle

- Extraire le symbole depuis `req.params`
- Appeler le service `getIndicatorsBySymbol`
- Retourner la réponse au format JSON
- Enregistrer un message d’erreur si aucun indicateur n’est retourné
- Gérer les erreurs globales du contrôleur

---

## Paramètres attendus

| Nom | Emplacement | Type | Obligatoire | Description |
|-----|-------------|------|-------------|-------------|
| symbol | req.params | string | Oui | Le symbole de la cryptomonnaie (ex : btc, eth, sol) |

---

## Fonctionnement détaillé

### 1. Récupération du symbole

```js
const { symbol } = req.params;
```

### 2. Appel du service

```js
const result = await getIndicatorsBySymbol(symbol);
```

### 3. Vérification du résultat

Si `result` est `null` ou `undefined`, cela signifie probablement :

- Crypto inconnue
- Erreur dans les données
- Indicateurs non disponibles

Alors un log d’erreur est enregistré :

```js
if(!result){
    logError(`Indicators Controller  : Error getIndicatorsBySymbol symbol: ${symbol}`);
}
```

### 4. Réponse au client

```js
res.json(result);
```

### 5. Gestion des exceptions

Si une erreur survient dans le `try` :

```js
catch(err){
    logError("Indicators Controller  : catch error : " , err);
}
```

Remarque :  
Ce contrôleur ne renvoie **pas de status HTTP** ni de message d’erreur dans le catch.  
Le client reçoit donc **aucune réponse** en cas d’erreur.  
(Il serait conseillé de renvoyer au minimum un `res.status(500).json(...)`)

---

## Exemple de réponse

### Succès

```json
{
  "rsi": 48.32,
  "macd": -0.0021,
  "sma_20": 45980.12,
  "sma_50": 45200.88
}
```

### Résultat null (crypto inconnue ou aucune donnée)

```json
null
```

_Un message d’erreur sera loggé côté serveur._

---


