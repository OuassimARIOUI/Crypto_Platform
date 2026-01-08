#  Documentation des Fonctionnalités – Services du Projet CryptoPlatform

##  Fichiers documentés
- `src/services/dbService.js`
- `src/services/fetchService.js`
- `src/services/insertCryptoService.js`

---

##  1. dbService.js — Service de Base de Données (PostgreSQL)

###  Rôle
Ce module gère toutes les interactions entre l’application et la base de données PostgreSQL :
- Connexion sécurisée via les variables d’environnement (`.env`)
- Insertion des données de cryptomonnaies

### Détails techniques

####  Fonction `connectDB()`
- Établit la connexion avec la base PostgreSQL en utilisant le package **pg**.
- Les paramètres de connexion sont lus depuis le fichier `.env` :
  ```env
  DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
  ```
- Si la connexion réussit → log : `"Connexion PostgreSQL établie !"`
- En cas d’échec → log d’erreur : `"Erreur de connexion PostgreSQL : ..."`

 **Mécanisme de sécurité :**
- Les identifiants ne sont jamais écrits dans les logs.
- Une seule connexion est établie et réutilisée (singleton `client`).

---

####  Fonction `saveCrypto(name, price)`
- Insère un enregistrement dans la table `crypto` :
  ```sql
  INSERT INTO crypto (name, price, timestamp)
  VALUES ($1, $2, NOW());
  ```
- Utilise des **requêtes paramétrées** (`$1`, `$2`) pour éviter les **injections SQL**.
- En cas de succès → `logInfo("Insertion faite avec succès !")`
- En cas d’erreur → `logError("Erreur lors de l’insertion : ...")`

---

###  En résumé
| Fonction | Description | Sécurité |
|-----------|--------------|-----------|
| `connectDB()` | Connecte à PostgreSQL et gère les erreurs |  Protection des credentials |
| `saveCrypto()` | Insère un enregistrement sécurisé |  Prévention d’injection SQL |

---

##  2. fetchService.js — Service d’Acquisition des Données

###  Rôle
Ce service interroge l’API publique **CoinGecko** pour obtenir les données de marché des cryptomonnaies.

###  Fonctionnement

####  Fonction `fetchCryptoData()`
- Envoie une requête `GET` vers :
  ```
  https://api.coingecko.com/api/v3/coins/markets
  ```
- Paramètres de la requête :
  | Paramètre | Valeur | Description |
  |------------|---------|-------------|
  | `vs_currency` | `usd` | Devise utilisée |
  | `order` | `market_cap_desc` | Tri par capitalisation |
  | `per_page` | `5` | Nombre de cryptos retournées |
  | `page` | `1` | Numéro de page |
  | `sparkline` | `false` | Pas de données graphiques |

- Si la requête réussit :
    - Log des cryptos récupérées sous forme :
      ```
      Bitcoin      → 50000.00 USD
      Ethereum     → 3000.00 USD
      ```
    - Retourne un tableau d’objets contenant :
      ```js
      [
        { name, symbol, current_price, total_volume, market_cap, ... }
      ]
      ```
- Si une erreur survient (API indisponible) → `logError("Erreur lors de la récupération des données")`

---

###  En résumé
| Fonction | Description | Journalisation |
|-----------|--------------|----------------|
| `fetchCryptoData()` | Récupère les données du marché via CoinGecko |  logInfo / logError |

---

##  3. insertCryptoService.js — Service d’Insertion Complète

###  Rôle
C’est le module **orchestrateur** qui combine :
1. La récupération des données (via `fetchService`)
2. La connexion à la base (via `dbService`)
3. L’insertion dans les tables SQL `cryptos` et `crypto_prices`

###  Fonctionnement Étape par Étape

#### Connexion à la base
```js
const client = await connectDB();
logInfo("Connexion à la base établie depuis insertService.js");
```

####  Récupération des données de l’API
```js
const data = await fetchCryptoData();
if (!data || data.length === 0) {
  logError("Aucune donnée récupérée depuis l’API.");
  return;
}
```

####  Insertion des données
Pour chaque crypto `c` :
- Vérifie si elle existe déjà :
  ```sql
  SELECT id FROM cryptos WHERE symbol = $1;
  ```
- Si non → insère une nouvelle crypto :
  ```sql
  INSERT INTO cryptos (symbol, name, created_at)
  VALUES ($1, $2, NOW()) RETURNING id;
  ```
- Ensuite, insère les données détaillées dans `crypto_prices` :
  ```sql
  INSERT INTO crypto_prices (
    crypto_id, price_usd, volume_usd_24h, market_cap_usd,
    change_percent_24h, high_24h, low_24h,
    circulating_supply, total_supply,
    ath, ath_change_percent,
    atl, atl_change_percent, fetched_at
  ) VALUES (...)
  ```

- Chaque insertion est loguée :
  ```
  Bitcoin      → 50000.00 USD
  Insertion terminée !
  ```

####  Gestion des erreurs
- Si un problème survient dans une requête SQL ou API :
  ```
  logError("Erreur lors de l’insertion :", err.message);
  ```

---

###  En résumé
| Étape | Action | Fonctionnalité |
|----|---------|----------------|
| 1. | Connexion à PostgreSQL | `connectDB()` |
| 2. | Récupération API | `fetchCryptoData()` |
| 3. | Insertion sécurisée | `INSERT INTO cryptos / crypto_prices` |
| 4. | Logging | `logInfo` / `logError` |

---

##  Résumé global

| Fichier | Rôle principal | Fonction(s) clé(s) | Description courte |
|----------|----------------|--------------------|---------------------|
| `dbService.js` | Connexion et insertion DB | `connectDB`, `saveCrypto` | Gère PostgreSQL et la sécurité SQL |
| `fetchService.js` | Récupération API | `fetchCryptoData` | Collecte et formate les données CoinGecko |
| `insertCryptoService.js` | Orchestration complète | `insertCryptoData` | Combine fetch + insertion + logs |

---

------------------------------------------------------------------------

**Auteur :** Arioui Mohamed Achraf Ouassim\
**Dernière mise à jour :** 16 Novembre 2025
 
