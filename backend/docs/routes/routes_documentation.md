# Documentation — Routes Backend (Express.js)

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/routes/*`

---

#  Objectif du document

Ce document regroupe **toutes les routes de l’API backend** dans un seul fichier.  
Chaque section explique :

- Le chemin HTTP (endpoint)
- La méthode utilisée (GET / POST)
- Le contrôleur appelé
- La logique générale de la route
- L’authentification (si nécessaire)

---

#  Structure complète des routes

```
routes/
 ├── alerts.routes.js
 ├── auth.routes.js
 ├── cryptos.routes.js
 ├── indicators.routes.js
 ├── portfolio.routes.js
 └── prices.routes.js
```

---

# alerts.routes.js  
**Base URL :** `/alerts`

### ▶ Route : GET `/alerts`
- **Contrôleur :** `alertsController`
- **Description :**  
  Analyse une crypto selon des seuils `up` et `down` passés en query.
- **Paramètres :**
  - `symbol` (obligatoire)
  - `up` (optionnel)
  - `down` (optionnel)

---

#  auth.routes.js  
**Base URL :** `/auth`

### ▶ POST `/auth/register`
Inscription d’un utilisateur.

### ▶ POST `/auth/login`
Connexion utilisateur.

### ▶ GET `/auth/me`
Retourne l’utilisateur connecté via JWT.

---

#  cryptos.routes.js  
**Base URL :** `/cryptos`

### ▶ GET `/cryptos`
Retourne la liste des cryptomonnaies + dernier prix.

---

#  indicators.routes.js  
**Base URL :** `/indicators`

### ▶ GET `/indicators/:symbol`
Retourne les indicateurs techniques d’une crypto.

---

# portfolio.routes.js  
**Base URL :** `/portfolio`

🛡 Toutes les routes nécessitent **un token JWT valide**.

### ▶ GET `/portfolio/me`
Retourne le portefeuille utilisateur.

### ▶ POST `/portfolio/buy`
Achat de crypto.

### ▶ POST `/portfolio/sell`
Vente de crypto.

### ▶ POST `/portfolio/add-funds`
Ajout d’argent au portefeuille.

---

#  prices.routes.js  
**Base URL :** `/prices`

### ▶ GET `/prices`
Retourne les derniers prix enregistrés.

### ▶ GET `/prices/history/:symbol`
Retourne l’historique des prix d’une crypto.

---

#  Fin de la documentation
