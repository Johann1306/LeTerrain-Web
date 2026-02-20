export class CombatEntity {
    constructor(id, name, isHero = false) {
        this.id = id;
        this.name = name;
        this.isHero = isHero;

        // Base Stats
        this.maxHp = 100;
        this.hp = 100;
        this.dmg = 10;
        this.attackSpeed = 2000; // ms between attacks
        this.critChance = 0.05; // 5% base
        this.dodgeChance = 0.05; // 5% base
        this.precision = 0.90; // 90% chance to hit
        this.defense = 0; // dmg reduction
        this.regen = 0; // HP per attack cycle

        this.lastAttackTime = 0;
    }

    applyHeroStats(saveManager) {
        if (!this.isHero) return;

        // Base levels are 0 to 3 for each stat
        // Exploit -> Dégâts
        const exploitLvl = saveManager.getStat('nicolas');
        this.dmg += exploitLvl * 5;

        // Rapidité -> Vitesse d'attaque (lower is faster)
        const speedLvl = saveManager.getStat('ali');
        this.attackSpeed = Math.max(500, this.attackSpeed - (speedLvl * 400)); // 2000 -> 1600 -> 1200 -> 800

        // Chance -> Critique %
        const critLvl = saveManager.getStat('johann');
        this.critChance += critLvl * 0.15; // +15% per level

        // Agilité -> Esquive %
        const dodgeLvl = saveManager.getStat('pierre');
        this.dodgeChance += dodgeLvl * 0.10; // +10% per level

        // Technique -> Précision %
        const precLvl = saveManager.getStat('guillaume');
        this.precision = Math.min(1.0, this.precision + (precLvl * 0.05)); // +5% per level

        // Résistance -> Défense (réduction dégâts bruts)
        const resLvl = saveManager.getStat('yannick');
        this.defense += resLvl * 2; // -2 dmg per level

        // Intelligence -> Régénération (Soigne chaque fois qu'il attaque)
        const intLvl = saveManager.getStat('thomas');
        this.regen += intLvl * 5; // +5 HP healed per attack

        // Endurance -> Points de Vie Max
        const endLvl = saveManager.getStat('jonathan');
        this.maxHp += endLvl * 50;
        this.hp = this.maxHp;
    }

    applyEnemyScaling(waveIndex) {
        if (this.isHero) return;

        // Simple scaling: enemies get stronger every wave
        this.maxHp = 50 + (waveIndex * 20);
        this.hp = this.maxHp;
        this.dmg = 5 + (waveIndex * 2);
        this.attackSpeed = Math.max(1000, 2500 - (waveIndex * 100));
    }

    applyBossScaling(bossIndex) {
        if (this.isHero) return;

        // Bosses are significantly stronger
        this.maxHp = 300 + (bossIndex * 100);
        this.hp = this.maxHp;
        this.dmg = 15 + (bossIndex * 5);
        this.attackSpeed = Math.max(800, 2000 - (bossIndex * 100));
        this.critChance = 0.1 + (bossIndex * 0.02);
        this.defense = bossIndex;
    }

    takeDamage(rawDamage) {
        // Check Dodge
        if (Math.random() < this.dodgeChance) {
            return { type: 'DODGE', amount: 0 };
        }

        // Apply Defense
        let actualDamage = Math.max(1, rawDamage - this.defense);

        this.hp = Math.max(0, this.hp - actualDamage);
        return { type: 'HIT', amount: actualDamage };
    }

    heal(amount) {
        if (this.hp <= 0) return 0; // can't heal dead
        const healed = Math.min(amount, this.maxHp - this.hp);
        this.hp += healed;
        return healed;
    }
}
