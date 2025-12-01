# Documentation — getAllCryptos.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/getAllCryptos.controller.js`

---

## Objectif du fichier

Ce contrôleur permet de récupérer **toutes les cryptomonnaies présentes en base**, avec leur **dernier prix connu** et quelques informations formatées pour l'affichage dans le frontend.

Ce contrôleur est utilisé par la page principale du dashboard pour afficher la liste des actifs et leur évolution récente.

---

# 1. Fonction : getAllCryptosController(req, res)

### Rôle

- Interroger la base via Prisma  
- Récupérer la liste complète des cryptos  
- Récupérer pour chaque crypto **uniquement le dernier prix (ORDER BY DESC + take 1)**  
- Formater correctement les données  
- Retourner les informations prêtes à afficher au frontend  

---

## 2. Requête Prisma

```js
const cryptos = await prisma.cryptos.findMany({
    orderBy: { id: "asc" },
    include: {
        crypto_prices: {
            orderBy: { fetched_at: "desc" },
            take: 1
        }
    }
});
```

Cette requête :

- Trie les cryptos par ID  
- Ajoute les prix associés (`crypto_prices`)  
- Mais seulement **le plus récent**, grâce à :
  - `orderBy: fetched_at desc`
  - `take: 1`

---

## 3. Formatage des données

Chaque crypto récupérée est transformée en un objet plus lisible :

```js
const formatted = cryptos.map(c => {
    const last = c.crypto_prices?.[0];

    return {
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        logo: `https://cryptoicons.org/api/icon/${c.symbol.toLowerCase()}/200`,
        price: last?.price_usd ?? 0,
        change: last?.change_percent_24h ?? 0,
        sparkline: null
    };
});
```

### Explications :

| Champ | Description |
|-------|-------------|
| `id` | Identifiant interne |
| `symbol` | Symbole officiel (ex : BTC, ETH) |
| `name` | Nom de la cryptomonnaie |
| `logo` | Image générée via cryptoicons.org |
| `price` | Dernier prix connu, sinon **0** |
| `change` | Variation 24h, sinon **0** |
| `sparkline` | Future fonctionnalité (graph miniaturisé, actuellement null) |

---

## 4. Réponse envoyée au frontend

```json
[
  {
    "id": 1,
    "symbol": "BTC",
    "name": "Bitcoin",
    "logo": "https://cryptoicons.org/api/icon/btc/200",
    "price": "45000.00",
    "change": "-0.52",
    "sparkline": null
  }
]
```

---

## 5. Gestion des erreurs

En cas d’erreur :

```js
catch(err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur interne serveur" });
}
```

Le frontend reçoit :

```json
{
  "error": "Erreur interne serveur"
}
```

---

