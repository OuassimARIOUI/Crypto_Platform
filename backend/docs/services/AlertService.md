# Documentation — Fonction `checkAlert`

## Auteur
Arioui Achraf

## Fichier concerné
`src/services/alertsService.js`

---

## 1. Objectif de la fonction

La fonction `checkAlert` permet d’évaluer si une alerte doit être déclenchée pour une cryptomonnaie donnée en fonction de sa variation sur 24 heures.  
Elle compare le pourcentage de variation actuel avec deux seuils :

- un seuil de hausse (`upPercent`)
- un seuil de baisse (`downPercent`)

Elle retourne ensuite un objet décrivant l’état de l’alerte.

---

## 2. Description générale

La fonction réalise les opérations suivantes :

1. Récupère la crypto via son symbole.
2. Récupère le dernier prix enregistré.
3. Calcule la variation sur 24h.
4. Détermine si une alerte doit être déclenchée selon les seuils fournis.
5. Retourne le résultat structuré.

---

## 3. Paramètres

| Paramètre      | Type     | Description |
|----------------|----------|-------------|
| `symbol`       | String   | Symbole de la cryptomonnaie (ex: `"btc"`). |
| `upPercent`    | Number   | Seuil minimal de hausse pour déclencher une alerte. |
| `downPercent`  | Number   | Seuil maximal de baisse pour déclencher une alerte. |

---

## 4. Préconditions

- La crypto doit exister dans la table `cryptos`.
- Il doit exister au moins une entrée dans `crypto_prices` pour cette crypto.
- Les seuils doivent être des valeurs numériques valides.

---

## 5. Déroulement détaillé

### a) Récupération de la crypto
```js
const crypto = await prisma.cryptos.findUnique({
    where: { symbol }
});
```
Si aucune crypto ne correspond, la fonction retourne null.

### b) Récupération du dernier prix connu
```js
const lastPrice = await prisma.crypto_prices.findFirst({
    where: { crypto_id: crypto.id },
    orderBy: { fetched_at: "desc" }
});
```
Si aucun prix n'est disponible, la fonction retourne null.

### 
### c) Lecture de la variation
const variation = lastPrice.change_percent_24h;

### d) Vérification des seuils

````js
if (variation >= Number(upPercent)) {
AlertTriggered = true;
AlertType = `increase_${upPercent}%`;
}

if (variation <= Number(downPercent)) {
AlertTriggered = true;
AlertType = `decrease_${downPercent}%`;
}


````

### e) Valeur retournée
````js
return {
symbol,
price: lastPrice.price_usd,
variation_24h: variation,
alert: AlertTriggered,
alertType: AlertType
};
````


## 6. Valeur de retour

Un objet contenant :

Clé	Type	Description
symbol	String	Symbole de la crypto.
price	Number	Dernier prix connu.
variation_24h	Number	Variation sur 24 heures.
alert	Boolean	true si une alerte est déclenchée.
alertType	String	Type de l’alerte (ex: "increase_3%").

En cas d'erreur ou si les données sont manquantes, la fonction retourne null.

## 7. Comportements d’erreur
   Situation	Action
   Crypto introuvable	Retourne null et journalise une erreur.
   Aucun prix disponible	Retourne null et journalise une erreur.
   Paramètres invalides	Les comparaisons peuvent produire un résultat incorrect mais la fonction ne casse pas.
## 8. Exemple d’utilisation
```js
   const alert = await checkAlert("btc", 2, -5);

if (alert && alert.alert) {
console.log("Alerte déclenchée :", alert.alertType);
}

```
## 9. Limites actuelles

La fonction ne gère pas plusieurs types d'alertes en même temps.

Aucune notification n’est envoyée, seule la logique de détection est couverte.

La priorité est donnée automatiquement à la baisse si les deux seuils sont vérifiés.