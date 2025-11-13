#  Documentation des Tests – CryptoPlatform

##  Structure des tests
```
src/test/
 ├── dbService.test.js
 ├── fetchService.test.js
 └── insertCryptoService.test.js
```

Chaque fichier correspond à un module métier et vérifie :
- la **sécurité**
- la **stabilité**
- la **performance**
- la **gestion d’erreurs**
- l’absence de fuite d’informations sensibles

---

#  dbService.test.js – Tests du module Base de Données

##  Objectifs
- Vérifier la connexion PostgreSQL
- Tester l’insertion sécurisée
- Empêcher les injections SQL
- Garantir qu’aucune donnée sensible n’apparaît dans les logs

##  Tests réalisés

### ️ Test : Connexion réussie à la DB
Simule une connexion PostgreSQL valide et vérifie que :
- `logInfo("Connexion ...")` est appelé

### ️ Test : Échec connexion → gestion d’erreur
Simule :
```js
connect()-> rejected
```
On vérifie que `logError` est appelé.

###  Test : Insertion réussie
Simule :
```js
client.query() -> success
```
On vérifie que `logInfo()` est bien appelé.

### ️ Test : Échec insertion SQL
Force `query()` à échouer pour tester la robustesse du code.

### ️ Test Sécurité : aucune donnée sensible dans les logs
Vérifie qu’aucun mot de passe n’est affiché :
```js
expect(message).not.toContain("mySuperSecret")
```

---

# fetchService.test.js – Tests du module API CoinGecko

##  Objectifs
- Vérifier la récupération correcte des données
- Tester la gestion d’erreurs API
- S'assurer des performances (rapidité)

##  Tests réalisés

###  Test Sécurité : retourne un tableau de cryptos
Simule une vraie réponse API.

### ️ Test : API échoue → retourne undefined
Simule une erreur réseau :
```js
axios.get.mockRejectedValueOnce(...)
```

### ️ Test Performance : temps < 2s
Mesure :
```js
start = performance.now()
await fetchCryptoData()
duration < 2000
```

---

# insertCryptoService.test.js – Tests d’insertion complète

##  Objectifs
- Tester l’intégration complète (API → DB)
- Vérifier les comportements en cas d’erreurs
- Mesurer les performances
- S’assurer de la robustesse face aux opérations massives

##  Tests réalisés

### ️ Test : Insertion réussie
Simule :
- connexion DB ok
- API retourne une crypto
- insertion dans `cryptos` + `crypto_prices`
  On vérifie que `logInfo()` est appelé.

### ️ Test : Aucune donnée → erreur
L’API retourne `[]` → on vérifie :
```
logError("Aucune donnée récupérée")
```

### ️ Test Sécurité : prévention injection SQL
Injecte :
```
"BTC; DROP TABLE users; --"
```
et vérifie qu’aucune erreur SQL n’apparaît dans les logs.

### ️ Test Performance : insertion < 3 secondes
Simule 5 cryptos
```js
duration < 3000
```

### ️ Test Résilience : 50 insertions simultanées
Exécute :
```
Promise.all(50 insertions)
```
Vérifie :
```
saveCrypto called 50 times
```

---

#  Résumé global

| Module | Domaines testés | Types de tests |
|--------|------------------|----------------|
| dbService | Connexion, sécurité, logs | Sécurité / Robustesse |
| fetchService | API, erreurs, performance | Sécurité / Performance |
| insertCryptoService | Intégration complète | Sécurité / Perf / Stress test |

---

**Auteur :** ARIOUI Mohamed Achraf Ouassim
---
**Dernière mise à jour :** 13 Novembre 2025  
