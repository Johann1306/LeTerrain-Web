import { CombatEntity } from './CombatEntity.js';

export class FinalGame {
    constructor(app) {
        this.app = app; // Reference to main App for GameData and SaveManager

        this.hero = null;
        this.enemy = null;

        this.currentWave = 0; // Each wave is 1 enemy.
        this.currentBossIndex = 1; // 1 to 8
        this.enemiesPerBoss = 2; // Every 2 enemies -> 1 Boss

        this.isRunning = false;
        this.lastFrameTime = 0;

        this.logElem = document.getElementById('combatLog');

        this.loop = this.loop.bind(this);
    }

    start() {
        this.logElem.innerHTML = '';
        this.currentWave = 0;
        this.currentBossIndex = 1;

        // Initialize Hero
        this.hero = new CombatEntity('hero', this.app.saveManager.getPseudo() || 'Héros', true);
        this.hero.applyHeroStats(this.app.saveManager);

        this.log(`=== LE TERRAIN RPG ===`);
        this.log(`${this.hero.name} entre sur Le Terrain avec ${this.hero.maxHp} PV.`);

        this.spawnNextEnemy();

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.loop);

        this.updateUI();
    }

    stop() {
        this.isRunning = false;
    }

    spawnNextEnemy() {
        // Are we at a boss wave?
        if (this.currentWave > 0 && this.currentWave % this.enemiesPerBoss === 0) {
            // Spawn Boss
            if (this.currentBossIndex > 8) {
                this.victory();
                return;
            }

            const bossData = this.app.gameData.getBossData(this.currentBossIndex);
            this.enemy = new CombatEntity('boss', bossData.name, false);
            this.enemy.applyBossScaling(this.currentBossIndex);

            this.log(`\n⚠️ UN BOSS APPROCHE! ⚠️`);
            this.log(`"${bossData.quote}"`);

            // Advance boss index for next time
            this.currentBossIndex++;
        } else {
            // Spawn Normal Enemy
            const enemyName = this.app.gameData.getRandomEnemyName();
            this.enemy = new CombatEntity('enemy', enemyName, false);
            this.enemy.applyEnemyScaling(this.currentWave);

            this.log(`\nUn ${this.enemy.name} sauvage apparaît !`);
        }

        // Visual updates
        this.enemy.lastAttackTime = performance.now();
        this.hero.lastAttackTime = performance.now();
        this.updateUI();
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.processCombat(timestamp);
        this.updateUI();

        if (this.isRunning) {
            requestAnimationFrame(this.loop);
        }
    }

    processCombat(time) {
        if (!this.hero || !this.enemy) return;
        if (this.hero.hp <= 0 || this.enemy.hp <= 0) return;

        // Hero Attack
        if (time - this.hero.lastAttackTime >= this.hero.attackSpeed) {
            this.hero.lastAttackTime = time;
            this.performAttack(this.hero, this.enemy);

            // Intelligence -> Regen Check
            if (this.hero.regen > 0 && this.hero.hp > 0 && this.hero.hp < this.hero.maxHp) {
                const healed = this.hero.heal(this.hero.regen);
                if (healed > 0) {
                    this.log(`💚 ${this.hero.name} régénère ${healed} PV.`, 'heal');
                }
            }
        }

        // Check if Enemy died
        if (this.enemy.hp <= 0) {
            this.log(`💥 ${this.enemy.name} a été vaincu !`);
            this.currentWave++;
            setTimeout(() => this.spawnNextEnemy(), 1500); // 1.5s pause before next spawn
            return;
        }

        // Enemy Attack
        if (time - this.enemy.lastAttackTime >= this.enemy.attackSpeed) {
            this.enemy.lastAttackTime = time;
            this.performAttack(this.enemy, this.hero);
        }

        // Check if Hero died
        if (this.hero.hp <= 0) {
            this.gameOver();
        }
    }

    performAttack(attacker, defender) {
        // Precision check
        if (Math.random() > attacker.precision) {
            this.log(`💨 L'attaque de ${attacker.name} rate complètement !`);
            return;
        }

        let dmg = attacker.dmg;
        let isCrit = false;

        // Crit check
        if (Math.random() < attacker.critChance) {
            dmg = Math.floor(dmg * 2);
            isCrit = true;
        }

        // Apply Damage
        const result = defender.takeDamage(dmg);

        if (result.type === 'DODGE') {
            this.log(`💨 ${defender.name} a esquivé l'attaque !`, 'dodge');
        } else {
            let msg = `⚔️ ${attacker.name} inflige ${result.amount} dégâts.`;
            if (isCrit) msg = `💥 CRITIQUE! ${msg}`;
            if (defender.defense > 0 && attacker.dmg > result.amount) {
                msg += ` (-${attacker.dmg - result.amount} bloqués)`; // Show blocked damage
            }
            this.log(msg, isCrit ? 'crit' : 'dmg');

            // Visual feedback
            this.triggerHitAnimation(defender.id);
        }
    }

    log(message, type = '') {
        const p = document.createElement('div');
        p.className = `combat-msg ${type}`;
        p.innerText = message;
        this.logElem.appendChild(p);

        // Auto scroll to bottom
        this.logElem.scrollTop = this.logElem.scrollHeight;
    }

    updateUI() {
        if (!this.hero || !this.enemy) return;

        // Update Hero
        document.getElementById('heroName').innerText = this.hero.name;
        document.getElementById('heroHpText').innerText = `${this.hero.hp} / ${this.hero.maxHp}`;
        document.getElementById('heroHpFill').style.width = `${(this.hero.hp / this.hero.maxHp) * 100}%`;

        // Update Enemy
        document.getElementById('enemyName').innerText = this.enemy.name;
        document.getElementById('enemyHpText').innerText = `${this.enemy.hp} / ${this.enemy.maxHp}`;
        document.getElementById('enemyHpFill').style.width = `${(this.enemy.hp / this.enemy.maxHp) * 100}%`;
    }

    triggerHitAnimation(id) {
        const elem = id === 'hero' ? document.getElementById('heroSprite') : document.getElementById('enemySprite');
        if (elem) {
            elem.classList.add('hit-shake');
            setTimeout(() => elem.classList.remove('hit-shake'), 300);
        }
    }

    gameOver() {
        this.stop();
        this.log(`☠️ ${this.hero.name} est KO... Vous devez vous entraîner davantage !`, 'crit');
        // Wait a bit then show button
        setTimeout(() => {
            document.getElementById('returnHubBtn').classList.remove('hidden');
        }, 2000);
    }

    victory() {
        this.stop();
        this.log(`🏆 INCROYABLE ! ${this.hero.name} a vaincu tous les Boss ! LA RUE EST À VOUS !`, 'heal');
        setTimeout(() => {
            document.getElementById('returnHubBtn').classList.remove('hidden');
        }, 3000);
    }
}
