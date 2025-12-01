# Documentation — alerts.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/alerts.controller.js`

---

## Objectif du fichier

Ce contrôleur gère les alertes de prix pour une cryptomonnaie.  
Il reçoit les paramètres envoyés depuis le frontend et délègue la logique métier au service `checkAlert()`.

---

## Fonction : alertsController(req, res)

### Rôle

- Vérifier que le symbole est fourni  
- Appliquer des valeurs par défaut pour `up` et `down`  
- Appeler le service `checkAlert()`  
- Retourner le résultat  
- Gérer proprement les erreurs  

---

## Paramètres

| Paramètre | Type | Par défaut | Obligatoire |
|----------|-------|-------------|--------------|
| symbol | string | — | Oui |
| up | number | 0.000001 | Non |
| down | number | 0.000001 | Non |

---

## Fonctionnement détaillé

### 1. Extraction des paramètres

```js
const { symbol, up = 0.000001, down = 0.000001 } = req.query;
```

### 2. Vérification du paramètre obligatoire

Si `symbol` est absent :

```js
return res.status(400).json({ error: "symbol est requis" });
```

### 3. Appel du service métier

```js
const result = await checkAlert(symbol, up, down);
return res.json(result);
```

### 4. Gestion des erreurs

```js
catch(err) {
    logError("error AlertsController", err);
    return res.status(500).json({ error: "Erreur interne serveur" });
}
```

---

## Exemple de réponse

### Succès

```json
{
  "status": "ok",
  "symbol": "btc",
  "up_trigger": false,
  "down_trigger": true
}
```

### Erreur paramètre manquant

```json
{
  "error": "symbol est requis"
}
```

### Erreur interne

```json
{
  "error": "Erreur interne serveur"
}
```

---

