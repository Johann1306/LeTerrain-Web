export class CombatEntity {
    constructor(id, name, isHero = false) {
        this.id = id;
        this.name = name;
        this.isHero = isHero;

        // Base Stats
        this.maxHp = 100;
        this.hp = 100;
        this.dmg = 10;
        this.attackSpeed = 2000; // ms between attacks (basé sur la vitesse)
        this.critChance = 0.05; // Chance de critique
        this.dodgeChance = 0.05; // Chance d'esquive
        this.precision = 0.90; // Précision de base
        this.defense = 0; // Réduction des dégâts
        this.regen = 0; // Régénération de HP
        this.mana = 100; // Mana initial
        this.rage = 0; // Barre de rage initiale
        this.lastAttackTime = 0;

        // Stats personnalisées (à charger depuis le saveManager)
        this.chanceLevel = 0;
        this.exploitLevel = 0;
        this.agilityLevel = 0;
        this.intelligenceLevel = 0;
        this.resistanceLevel = 0;
        this.speedLevel = 0;
        this.techniqueLevel = 0;
        this.enduranceLevel = 0;
    }

    applyHeroStats(saveManager) {
        if (!this.isHero) return;

        // Charger les stats personnalisées depuis le saveManager
        const stats = {
            chance: saveManager.getStat('johann'),
            exploit: saveManager.getStat('nicolas'),
            agility: saveManager.getStat('pierre'),
            intelligence: saveManager.getStat('thomas'),
            resistance: saveManager.getStat('yannick'),
            speed: saveManager.getStat('ali'),
            technique: saveManager.getStat('guillaume'),
            endurance: saveManager.getStat('jonathan'),
            rage: 0 // Initialisation de la barre de rage
        };

        // Appliquer les stats dynamiquement
        this.chanceLevel = stats.chance;
        this.exploitLevel = stats.exploit;
        this.agilityLevel = stats.agility;
        this.intelligenceLevel = stats.intelligence;
        this.resistanceLevel = stats.resistance;
        this.speedLevel = stats.speed;
        this.techniqueLevel = stats.technique;
        this.enduranceLevel = stats.endurance;

        // Calcul de la chance de critique et d'esquive
        const critMultiplier = 0.1 + (stats.chance * 0.2);
        this.critChance = Math.min(1.0, critMultiplier);

        const dodgeMultiplier = 0.1 + (stats.agility * 0.15); // Chance d'esquive
        this.dodgeChance = Math.min(1.0, dodgeMultiplier);

        // Calculer le cooldown basé sur la vitesse et la technique
        const speedCooldownFactor = 1 / (1 + stats.speed * 0.2); // Réduction du temps de cooldown
        this.attackSpeed = Math.max(500, this.attackSpeed * speedCooldownFactor);

        // Technique -> Précision et dégâts
        const precisionBoost = Math.min(1.0, stats.technique * 0.2);
        this.precision = Math.min(1.0, this.precision + precisionBoost);

        // Résistance -> Réduction des dégâts
        this.resistanceLevel += stats.resistance;

        // Intelligence -> Régénération et mana
        const manaFactor = 5 + (stats.intelligence * 2); // Augmentation du mana max
        this.mana = Math.min(100, this.mana + manaFactor);

        // Endurance -> Points de Vie Max
        this.maxHp += stats.endurance * 20;
        this.hp = Math.min(this.maxHp, this.hp);
    }

    applyEnemyScaling(waveIndex) {
        if (this.isHero) return;

        // Scaling basé sur les stats et le niveau de l'ennemi
        const enemyLevel = waveIndex + 1; // Niveau de l'ennemi
        this.maxHp += Math.min(50, enemyLevel * 20);
        this.hp = Math.min(this.maxHp, this.hp);

        // Augmentation des dégâts et réduction du cooldown
        const speedMultiplier = 1 / (enemyLevel * 0.1); // Réduction du temps de cooldown
        this.attackSpeed = Math.max(500, this.attackSpeed * speedMultiplier);

        // Augmentation des stats de résistance et technique
        this.resistanceLevel += Math.min(3, enemyLevel / 2);
        this.techniqueLevel += Math.min(1, enemyLevel / 4);
    }

    applyBossScaling(bossIndex) {
        if (this.isHero) return;

        // Scaling pour les boss basé sur leur niveau et leurs stats spéciales
        const bossLevel = bossIndex + 1; // Niveau du boss

        // Augmentation des PV et dégâts
        this.maxHp += Math.min(300, bossLevel * 50);
        this.hp = Math.min(this.maxHp, this.hp);

        // Réduction du temps de cooldown et augmentation des stats
        const speedMultiplier = 1 / (bossLevel * 0.2); // Réduction du temps de cooldown
        this.attackSpeed = Math.max(500, this.attackSpeed * speedMultiplier);

        // Augmentation de la chance de critique et résistance
        this.critChance += Math.min(0.3, bossLevel * 0.1);
        this.resistanceLevel += Math.min(4, bossLevel / 2);

        // Stat technique pour les attaques spéciales
        this.techniqueLevel = Math.max(1, bossLevel / 2);
    }

    takeDamage(rawDamage) {
        // Check Dodge based on Agility stat
        if (Math.random() < this.dodgeChance) {
            return { type: 'DODGE', amount: 0 };
        }

        // Calcul de la chance de critique basée sur Exploit et Chance stats
        const critMultiplier = this.critChance + (this.exploitLevel * 0.2);
        if (Math.random() < critMultiplier && rawDamage > 0) {
            return { type: 'CRITICAL_HIT', amount: Math.max(1, rawDamage * 2) };
        }

        // Apply Defense based on Resistance stat
        const defenseReduction = this.resistanceLevel * 0.5; // Réduction des dégâts par résistance
        let actualDamage = Math.max(1, rawDamage - (defenseReduction + this.defense));

        this.hp = Math.max(0, this.hp - actualDamage);
        return { type: 'HIT', amount: actualDamage };
    }

    heal(amount) {
        if (this.hp <= 0) return 0; // can't heal dead

        // Appliquer la régénération basée sur l'intelligence du personnage
        const regenAmount = this.regen * amount;
        const healed = Math.min(amount + regenAmount, this.maxHp - this.hp);
        this.hp += healed;
        return healed;
    }
}
