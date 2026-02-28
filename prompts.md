On va redefinir le contenu du fichier 'specification.md' dans un premier temps. 
---
je veux maintenant qu'on étoffe la partie combat. je te donne toutes les fonctionnalités que je voudrais à terme et on va les découper intelligemment et dans un ordre precis pour qu'on puisse les implementer proprement en plusieurs fois (plusieurs prompts/reponses). Voici les fonctionnalités : 
- systeme de points de statistiques des personnages (valeur de 1 à 10 pour les attributs suivants : Chance, Exploit, Agilité, Intelligence, Résistance, Rapidité, Technique, Endurance et Nervosité (chaque personnage a une stat dans laquelle il domine les autres avec un 10/10 (Johann => Chance, Nicolas => Exploit, pierre => Agilité, thomas => Intelligence, yannick => Résistance, ali => Rapidité, guillaume => Technique, jonathan => Endurance et Nervosité ), les autres stats ne peuvent dépasser le 9/10. Chaque attribut a une influence sur les stats du perso lors du combat : (Chance => chance de critique, Exploit => dégats critique, Agilité => chance d'esquive, Intelligence => point de mana et cooldown reduction, Résistance => reduction de degats, Rapidité => vitesse des cooldown, Technique=> dégats, Endurance => point de vie et Nervosité => barre de rage)
- combats 1v1 à 8v8 ou (8v7 + 1 BOSS) possibles
- préparation de l'équipe (choix des personnages qui participent au combat + choix des pouvoirs des personnages, choix de la priorité d'utilisation des pouvoirs en fonctions des situations et des types de pouvoirs pour le combat automatique => système de priorité d'utilisation d'un sort "utilisable" (si la situation le permet , ex : heal si la vie<50, )par rapport à un autre, jusqu'à redescendre à l'attaque par défaut du pouvoir débloqué au départ. (permet de choisir quels pouvoirs un personnage utiliserta en priorité par rapport à un autre lorsqu'il le peut)
- combat automatique ou manuel (possibilité de changer pendant le combat de auto à manuel et inversement)
- utilisation des pouvoirs des personnages en combat (en automatique avec un cooldown différent et une durée d'effet qui varient en fonction des types de pouvoirs )
- systeme d'intelligence de combat des ennemis et des alliés en automatique (choix de la cible a attaquer ou de l'allié a defendre en fonction de la situation, choix de la cible à taunt, à stun, à attaquer, a voler le mana). La systeme de combat doit etre logique mais en meme temps imprévisible (systeme de randomisation pour une partie des stratégies pour ne pas focaliser toujours la meme cible, ou prendre systematiquement la meilleur decision et donner de la variété dans l'approche du combat). Possibilité de raté un coup, de bloquer un coup, de reduire les degats subis, d'augmenter les degats infligés, ...
-Systeme d'animation visuelles lors de l'utilisation de pouvoirs (colorés en fonction du type de pouvoir), lorsqu'une cilble est touchée ou soignée ou affecté par un pouvoir (stun, taunt, ...) pour dynamiser le déroulement des combats et ne pas avoir des combats statiques. Variations de l'animation lors de coups critique ou de dépassement de certain seuils de dégats par exemple
-Système visuel dynamique pendant le combat de points de vie (donc de mort), de points de mana, de points de bouclier, de rage (permet de declencher une attaque SPECIAL quand chargé), de l'état (affecté par un ou plusieurs status (aura, stun, taunt, ) represénté par des icones adaptés)
- Système de score en fonction du nombre de combats, de pouvoirs débloqués, du nombre de morts, 
- Système d'argent (gagné à chaque combat (+ autres?) puis utilisé pour acheter des pouvoirs, augmenter les stats, 
---

reorganise intelligement ces differnets elements et prévois la bonne manière d'implementer ces fonctionnalités dans le bon ordre en fonction des dependances des unes envers les autres pour faciliter le travail de l'ia en plusieurs itérations. Demande moi si des points demandent a etre eclairci ou si il y a des ambiguités ou si tu as des propositions qui te semblent pretinentes par rapports au contexte fournis.

Je vais d'abord lire le fichier specifications.md actuel pour comprendre le contexte existant avant de le mettre à jour.

Analyzed
Parfait, j'ai le contexte complet. Voici mon analyse et ma proposition de découpage avant de mettre à jour le specifications.md
.

Analyse et questions avant de commencer
J'ai bien compris toutes les fonctionnalités. Voici les dépendances techniques que j'identifie, qui dictent l'ordre d'implémentation :

Statistiques des persos
    └─> Moteur de combat de base (HP, Mana, Rage, Bouclier)
            └─> Affichage visuel dynamique (barres + statuts)
                    └─> Utilisation des pouvoirs (cooldowns, types)
                            └─> IA de combat (ciblage, randomisation)
                                    ├─> Préparation d'équipe (composition + priorités auto)
                                    ├─> Animations visuelles (projectiles, effets)
                                    └─> Combat manuel vs automatique
                                                └─> Score & Argent
Découpage proposé en 9 phases
Phase	Nom	Contenu	Dépendances
P1	Données & Stats	Définir les stats (1-10) de chaque perso + leurs formules d'influence sur le combat	Aucune
P2	Moteur de combat core	Boucle de combat, HP/Mana/Rage/Bouclier, hitvérification (miss/block/crit), mort	P1
P3	UI combat — barres dynamiques	Barres HP, Mana, Rage, Bouclier + icônes de statuts (stun, taunt, aura...)	P2
P4	Pouvoirs en combat	Intégrer les pouvoirs existants avec cooldown, durée d'effet, coût mana	P2 + P3
P5	IA de combat (auto)	Ciblage intelligent + randomisation, priorité d'utilisation des pouvoirs, logique allié/ennemi	P4
P6	Préparation d'équipe	Écran de sélection persos + pouvoirs + ordre de priorité des sorts	P5
P7	Combat manuel + switch auto/manuel	Clic sur cibles, utilisation manuelle des pouvoirs, toggle auto/manuel en cours	P5 + P6
P8	Animations visuelles	Projectiles colorés par type, impacts, effets critique, seuils de dégâts	P4
P9	Score & Argent	Système de score (combats, morts, pouvoirs), monnaie, boutique d'améliorations	P2+
Questions et points à clarifier
Avant de mettre à jour le fichier, j'ai quelques ambiguïtés :

Nervosité (Jonathan) : Dans les stats de persos tu indiques que Jonathan domine sur Endurance ET Nervosité (deux stats à 10/10 ?). Est-ce voulu, ou c'est une des deux seulement ?

Combat manuel : Quand le joueur est en mode manuel, comment interagit-il exactement ? Clic sur un ennemi pour attaquer, puis clic sur un pouvoir dans une barre d'actions ? Ou quelque chose de plus simple (type tour par tour) ?

Format des combats : Les combats sont-ils temps réel (tout se passe simultanément avec des timers) ou tour par tour (chaque perso agit dans un ordre défini) ?

Boss : Dans le format "8v7 + 1 BOSS", le Boss est-il un ennemi spécial avec ses propres mécaniques/phases, ou juste un ennemi normal avec plus de HP/dégâts ?

Système d'argent : Est-ce que l'argent est persistant entre plusieurs combats (méta-progression), ou reset à chaque combat ? Et la boutique, c'est accessible depuis le Hub ?

Équipe ennemie : Dans un combat, qui sont les ennemis ? Des versions des mêmes 8 persos (mode PvP) ? Des ennemis tirés de leTerrain.properties ? Ou les deux selon le type de combat ?

1) c'est voulu, j'ai 8 personnages mais 9 stats differentes, chacunes representant une des lettres du mot 'LE TERRAIN' => L pour Luck, T pour Technique, etc
2) quand le joueur est en mode manuelle, le jeu se met en pause lorsque le cooldown d'attaque est disponible pour un des alliés. le joeur selectionne alors l'un des pouvoirs de l'allié dont c'est le tour ainsi que la cible ou l'allié concerné par ce pouvoirs.
3) les combats sont en temps rééel en mode auto (les persos ont chacun un cooldown d'attaque qui varie en fonction de leur stats (combinaison de Rapidité, Vitesse, Technique et Endurance et Nervosité). en mode manuel, la logique est la meme concernant les cooldowns d'attaque des allié/ennemis mais lorsque le CD d'attaque d'un allié est disponible, le jeu se met en pause le temps de choisir un pouvoir et la cible (si besoin de cible. pas de ciblzpour une attque ou regen multi par exemple). et lorsque le pouvoir (ou pouvoir + cible) est séléctionné le jeu reprends jusqu'au prochain allié dont le CD d'attaque est disponible. Le jeu se met egalkement en pause pour les ennemis durant la selection du pouvoir.
4) meme si ils restent des ennemis comme les autres, les boss auront  leur propre mecanique (pouvoir supplementaire, plus de stats, ... Il faudra definir cela.
5)argent persistant, achat de pouvoirs, missions ou stats tout au long du jeu pour progresser, 
6) ennemis tirés de 'leTerrain.properties' => "ennemi.noms.gitan=
ennemi.noms.arabe=
ennemi.noms.noir=
ennemi.noms.handicape= "et boss tirés de "boss.citation.1" à "boss.citation.15" pour les citations et 'mission.boss.johann.1001.nom, mission.boss.johann.1001.inf=' à 'mission.miniboss.1015.nom=, mission.miniboss.1015.inf=' pour les noms et infos des boss et mini boss