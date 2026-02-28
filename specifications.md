



# Système de Combat pour LeTerrain
## Introduction
Le projet vise à développer un système de combat dynamique et immersif avec des combats en temps réel (1v1 à 8v8 ou 8v7 + 1 BOSS), intégrant une IA intelligente, des animations visuelles et un système de progression personnalisé.

## Système de Statistiques des Personnages
### Structure des Stats
Chaque personnage possède 9 statistiques allant de 1 à 10 : Chance, Exploit, Agilité, Intelligence, Résistance, Rapidité, Technique, Endurance et Nervosité. Chaque personnage domine dans une seule stat (ex: Johann => Chance = 10/10). Les autres stats ne dépassent pas 9/10.

### Influences sur le Combat
| Statistique       | Influence sur le Combat                                                                 |
|-------------------|--------------------------------------------------------------------------------------|
| Chance            | Augmente la chance de critique.                                                     |
| Exploit           | Augmente les dégâts critiques.                                                       |
| Agilité           | Augmente la chance d'esquive.                                                        |
| Intelligence      | Augmente le point de mana et réduit le cooldown.                                      |
| Résistance        | Réduit les dégâts subis.                                                            |
| Rapidité          | Accélère la vitesse des cooldowns.                                                   |
| Technique         | Augmente les dégâts infligés par attaque.                                             |
| Endurance         | Augmente les points de vie (PV).                                                     |
| Nervosité         | Augmente la barre de rage (utilisée pour déclencher des attaques spéciales).            |

## Moteur de Combat
### Fonctionnalités de Base
- Combats en temps réel avec gestion dynamique des PV, Mana et Rage.
- Vérification des dégâts : miss, bloc ou critique. Détermination de la mort.
- Gestion des cooldowns d'attaque (basés sur les stats de Rapidité/Technique/Endurance/Nervosité).

## UI Combat – Barres Dynamiques
### Composants Visuels
- Barres dynamiques pour PV, Mana, Rage et Bouclier.
- Icônes pour les statuts (stun, taunt, aura) affichées en temps réel.

## Pouvoirs en Combat
### Intégration des Pouvoirs
- Chaque pouvoir a un coût mana, une durée d'effet et un cooldown spécifique.
- Les pouvoirs sont associés à des types (ex: attaque physique, magie, buff/debuff).
- Priorité d'utilisation basée sur la situation (ex: heal si PV < 50%).

## IA de Combat (Auto)
### Logique Intelligente
- Ciblage intelligent : choix de cible (allié/ennemi) en fonction des statuts.
- Randomisation pour éviter les stratégies répétitives.
- Priorité d'utilisation des pouvoirs en fonction du contexte.

## Préparation d'Équipe
### Système de Sélection
- Choix des personnages et leurs pouvoirs pour chaque combat.
- Définition des priorités automatiques (ex: utiliser un pouvoir de soin si PV < 50%).

## Combat Manuel vs Automatique
### Mode Manuel
- Pause du combat lorsque le cooldown d'attaque est disponible.
- Sélection d'un pouvoir et d'une cible pour les alliés.

## Animations Visuelles
### Effets Dynamiques
- Projectiles colorés par type de pouvoir.
- Impacts, effets critiques et seuils de dégâts (ex: explosions à 50% des PV).

## Système de Score & Argent
### Système Persistant
- Score basé sur les combats gagnés/morts et les pouvoirs débloqués.
- Argent persistant pour acheter des améliorations ou des pouvoirs.

## Boss et Équipes Ennemies
### Mécaniques Spéciales
- Les boss ont leurs propres mécaniques (pouvoirs supplémentaires, phases).
- Équipes ennemies tirées de `leTerrain.properties` (ex: ennemis nommés comme gitan, arabe, etc.).
