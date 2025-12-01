# Documentation — authService.js

## Projet : Crypto Monitoring Platform  
Auteur : Arioui Achraf  
Fichier documenté : src/services/authService.js

---

## Objectif du fichier

Ce module fournit les services d’authentification du backend :

- Création d’un nouveau compte utilisateur (`register`)
- Connexion d’un utilisateur existant (`login`)
- Gestion du hachage des mots de passe
- Génération d’un token JWT pour les sessions authentifiées
- Création automatique d’un portefeuille associé à chaque utilisateur

Ces fonctions sont utilisées ensuite dans les routes `/auth/register` et `/auth/login`.

---

## Dépendances utilisées

| Module | Rôle |
|-------|------|
| Prisma (`prisma`) | Interaction avec la base de données |
| bcryptjs | Hachage et vérification des mots de passe |
| jsonwebtoken (JWT) | Création des tokens d’authentification |

---

## Fonction : register(email, password, pseudo)

### Rôle  
Créer un nouvel utilisateur dans la base de données et lui associer un portefeuille initialisé à 0.

### Étapes détaillées

1. Hachage sécurisé du mot de passe avec bcrypt (10 rounds)
2. Création d'un utilisateur dans users
3. Création d’un portefeuille associé dans portfolios
4. Retourne l’objet utilisateur nouvellement créé

### Exemple d’appel

```js
const user = await register("test@mail.com", "password", "achraf");
```

### Exemple de retour

```json
{
  "id": 12,
  "email": "test@mail.com",
  "pseudo": "achraf",
  "password": "$2a$10$..."
}
```

---

## Fonction : login(email, password)

### Rôle  
Authentifier un utilisateur et générer un token JWT valide pendant 2 heures.

### Étapes détaillées

1. Vérifier que l’utilisateur existe dans la base  
2. Comparer le mot de passe donné avec le hash stocké  
3. Générer un token JWT contenant : id, role  
4. Retourner { token, user }

### Exemple d’appel

```js
const result = await login("test@mail.com", "password");
```

### Exemple de retour

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
      "id": 12,
      "email": "test@mail.com",
      "pseudo": "achraf",
      "role": "user"
  }
}
```

---

## Résumé global

| Fonction | Description |
|---------|-------------|
| register() | Crée un utilisateur, hache le mot de passe, génère un portefeuille |
| login() | Vérifie le mot de passe, génère un token JWT, retourne l'utilisateur |


