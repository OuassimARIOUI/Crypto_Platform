# Documentation — auth.controller.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : `src/controllers/auth.controller.js`

---

## Objectif du fichier

Ce contrôleur gère toute la logique d’authentification :

- Inscription (`registerController`)
- Connexion (`loginController`)
- Récupération de l’utilisateur courant via token (`meController`)

Il interagit avec :
- `authService.js` pour la logique métier (register / login)
- `logger.js` pour le suivi des logs
- `jsonwebtoken` pour la vérification du token JWT
- Prisma pour récupérer l’utilisateur associé au token

---

# 1. Fonction : registerController(req, res)

### Rôle  
Créer un nouvel utilisateur via le service `register()` et retourner son profil.

### Fonctionnement détaillé

1. Extraction des données :
```js
const { email, password, pseudo } = req.body;
```

2. Appel du service métier :
```js
const user = await register(email, password, pseudo);
```

3. Logging de confirmation :
```js
logInfo(`User registered: ${pseudo}`);
```

4. Réponse :
```json
{
  "success": true,
  "user": { ... }
}
```

5. Gestion des erreurs :
```js
logError("Failed to register user", err);
return res.status(500).json({ error: "Erreur serveur" });
```

---

# 2. Fonction : loginController(req, res)

### Rôle  
Connecter un utilisateur via `login()` et retourner token + user.

### Fonctionnement détaillé

1. Extraction :
```js
const { email, password } = req.body;
```

2. Appel du service login :
```js
const result = await login(email, password);
```

3. Si identifiants incorrects :
```js
return res.status(400).json({ error: "Identifiants incorrects" });
```

4. Logging :
```js
logInfo(`User login: ${email}`);
```

5. Réponse :
```json
{
  "token": "...",
  "user": { ... }
}
```

6. Gestion d’erreur serveur :
```js
return res.status(500).json({ error: "Erreur serveur" });
```

---

# 3. Fonction : meController(req, res)

### Rôle  
Vérifier le token JWT, décoder l’utilisateur et retourner son profil.

### Fonctionnement détaillé

1. Extraction du token :
```js
const token = req.headers.authorization?.split(" ")[1];
```

2. Si pas de token :
```js
return res.status(401).json({ error: "No token" });
```

3. Vérification JWT :
```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

4. Récupération de l’utilisateur :
```js
const user = await prisma.users.findUnique({
    where: { id: decoded.id }
});
```

5. Réponse utilisateur :
```json
{ "id": 1, "email": "...", ... }
```

6. Token invalide :
```js
return res.status(401).json({ error: "Invalid token" });
```

---

