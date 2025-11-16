# Documentation -- indicatorService.js

## Description générale

Ce module est responsable du calcul et de la génération des indicateurs
techniques basés sur les données de prix des cryptomonnaies stockées
dans la base de données.\
Il utilise Prisma comme ORM pour interroger les tables `cryptos`,
`crypto_prices` et `indicators_history`.

------------------------------------------------------------------------

## 1. Fonction `calculateSMA(cryptoId, n)`

### **Rôle**

Calcule la **SMA (Simple Moving Average)**, c'est‑à‑dire la moyenne
mobile simple sur les *n* derniers enregistrements d'une cryptomonnaie.

### **Fonctionnement**

-   Récupère les *n* derniers prix dans `crypto_prices`.
-   Si le nombre de points est insuffisant → retourne `null`.
-   Sinon → retourne la moyenne arithmétique.

### **Sécurité**

-   Utilisation de `Number()` pour éviter des valeurs non numériques.
-   Requêtes Prisma sécurisées (évite l'injection SQL).

------------------------------------------------------------------------

## 2. Fonction `getVariation24h(cryptoId)`

### **Rôle**

Retourne la **variation du prix sur 24h** pour une cryptomonnaie donnée.

### **Fonctionnement**

-   Récupère le dernier enregistrement de `crypto_prices`.
-   Accède au champ `change_percent_24h`.
-   Si aucun enregistrement → retourne `null`.

------------------------------------------------------------------------

## 3. Fonction `computeIndicatorsForCrypto(cryptoId)`

### **Rôle**

Calcule les indicateurs suivants pour une cryptomonnaie : - SMA 7
jours - SMA 30 jours - Variation 24h

Puis les enregistre dans la table `indicators_history`.

### **Sécurité**

-   `cryptoId` est converti via `Number()` afin d'éviter l'injection
    (test sécurisé).
-   Toutes les requêtes Prisma sont paramétrées.
-   Structure des données contrôlée avant insertion.

### **Données insérées**

``` json
{
  "crypto_id": <number>,
  "sma7": <number|null>,
  "sma30": <number|null>,
  "variation_24h": <number|null>,
  "fetched_at": <Date>
}
```

------------------------------------------------------------------------

## 4. Fonction `computeAllIndicators()`

### **Rôle**

-   Récupère toutes les cryptomonnaies dans la table `cryptos`.
-   Applique `computeIndicatorsForCrypto()` pour *chaque crypto*.

### **Comportement**

-   Boucle sécurisée avec `for...of`.
-   Log console pour le suivi du calcul.

------------------------------------------------------------------------

## Résumé global

  ----------------------------------------------------------------------------------------------
  Fonction                         Rôle           Sortie       Gestion des erreurs
  -------------------------------- -------------- ------------ ---------------------------------
  `calculateSMA()`                 Calcul de      nombre ou    Vérification du nombre de points
                                   moyenne mobile `null`       

  `getVariation24h()`              Récupération   nombre ou    Valeur absente → `null`
                                   variation 24h  `null`       

  `computeIndicatorsForCrypto()`   Calcul et      insertion DB cryptoId sécurisé
                                   insertion des               
                                   indicateurs                 

  `computeAllIndicators()`         Application du aucune       Boucle contrôlée
                                   calcul à                    
                                   toutes les                  
                                   cryptos                     
  ----------------------------------------------------------------------------------------------

------------------------------------------------------------------------

**Auteur :** Arioui Mohamed Achraf Ouassim\
**Dernière mise à jour :** 16 Novembre 2025
