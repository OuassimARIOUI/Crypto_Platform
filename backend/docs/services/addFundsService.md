#  Documentation — Fonction `addFunds`

**Auteur : ARIOUI Achraf**  
**Fichier documenté :** `addFunds.js`  
**Projet : Crypto Monitoring Platform — Backend (Node.js + Prisma)**

---

##  Objectif

La fonction `addFunds` permet d’ajouter un montant d’argent au portefeuille virtuel d’un utilisateur.  
Elle met à jour le solde dans la table `portfolios` en utilisant Prisma, puis retourne le nouveau solde.

Elle est utilisée pour :

- augmenter le solde du portefeuille,
- permettre des opérations BUY,
- initialiser un solde de départ lors d’un dépôt.

---

##  Prototype

```js
export async function addFunds(userId, amount)
Paramètre	Type	Description
userId	Number	Identifiant de lutilisateur
amount	Number	Montant à ajouter au solde
```
## ✔ Validation
La fonction vérifie :

que amount est défini,

que amount est un nombre strictement positif.

### En cas d’erreur :

throw new Error("Montant invalide")
## ⚙ Fonctionnement interne
Vérifie que le montant est valide.

Met à jour le portefeuille utilisateur avec Prisma :

const portfolio = await prisma.portfolios.update({
  where: { user_id: userId },
  data: {
    balance: { increment: Number(amount) }
  }
});
Retourne le nouveau solde :


return portfolio.balance;
🗄 Accès Base de Données
La mise à jour se fait sur la table :


portfolios
Champ modifié :


balance = balance + amount
## Valeur retournée
``` js
Number  // le nouveau solde de l’utilisateur 
```
## Erreurs possibles
Erreur	Cause
Montant invalide	Si amount ≤ 0 ou undefined
PrismaError	Si le portefeuille n’existe pas ou la BDD n’est pas accessible

## Tests unitaires
La fonction est testée avec Jest en mockant Prisma.

Cas testés :

Montant invalide → erreur

Bonne requête Prisma avec les bons paramètres

Nouveau solde correctement retourné

