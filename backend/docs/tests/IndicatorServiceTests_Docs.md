# Documentation des Tests – indicatorService.test.js

Ce document décrit la structure, la logique et les objectifs des tests écrits pour le module `indicatorService.js`.  
Les tests utilisent **Vitest** et couvrent :  
- les tests unitaires  
- les tests de sécurité  
- les tests de performance  
- un test d’intégration  

---

## 1. Objectif des tests

Les tests visent à valider :
- La validité des calculs (SMA, variation 24h)
- La robustesse contre les entrées dangereuses (injections)
- La performance du calcul d’indicateurs
- Le bon fonctionnement général du module

Ces tests garantissent que le système est fiable, sécurisé et cohérent dans son comportement.

---

## 2. Technologies utilisées

- **Vitest** pour les tests
- **Mocking** des services Prisma via `vi.mock()`
- **Mocking** de la base de données

---

## 3. Structure des tests

### 3.1 Tests Unitaires

#### ✔ calculateSMA()
Valide le calcul de la moyenne mobile simple :

- Test du cas normal  
- Test du cas où les données sont insuffisantes  

#### ✔ getVariation24h()
Valide l’extraction du pourcentage de variation :

- Retourne une valeur valide  
- Retourne `null` si aucune donnée  

---

### 3.2 Tests de Sécurité

#### ✔ Protection contre la fuite de données sensibles
Vérifie qu’aucune information critique n’est insérée dans `indicators_history`.

#### ✔ Protection contre l’injection SQL
Simule une tentative d’injection à travers `crypto_id`.

Objectif : s’assurer que `computeAllIndicators()` ne laisse jamais passer des données modifiées ou dangereuses.

---

### 3.3 Tests de Performance

Valide que le module peut :

- Traiter plusieurs cryptos rapidement  
- Rester performant (< 2 secondes pour 5 cryptos)

---

### 3.4 Test d’Intégration

Vérifie que :

- L’appel à `computeAllIndicators()` mène bien à l’insertion d’un enregistrement dans `indicators_history`.

---

## 4. Organisation du fichier

- Mocking du module Prisma : empêche les interactions avec la vraie DB.
- Tests regroupés par catégories : unitaires, sécurité, performance, intégration.
- Utilisation systématique de `beforeEach()` pour nettoyer les mocks.

---

## 5. Résumé

Ce fichier de tests couvre :

| Catégorie        | Objectif |
|------------------|----------|
| Unitaire         | Validation des fonctions internes |
| Sécurité         | Empêcher les injections & fuite de données |
| Performance      | Vérifier la rapidité des calculs |
| Intégration      | Vérifier la cohérence globale |

Ces tests assurent un haut niveau de fiabilité, stabilité et sécurité.

------------------------------------------------------------------------

**Auteur :** Arioui Mohamed Achraf Ouassim\
**Dernière mise à jour :** 16 Novembre 2025
