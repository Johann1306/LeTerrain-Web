import { GameData } from './core/GameData.js';
import { SaveManager } from './core/SaveManager.js';
import { FinalGame } from './game/FinalGame.js';

class App {
    constructor() {
        console.log("App: Constructor start");
        this.gameData = new GameData();
        this.saveManager = new SaveManager();
        this.finalGame = new FinalGame(this);
        this.init();
    }

    async init() {
        console.log("App: init() start");
        const status = document.getElementById('status-bar');

        // 1. Load Data
        const loaded = await this.gameData.load();
        if (!loaded) {
            status.innerText = "ERREUR DE CONNEXION AU PROTOCOLE";
            return;
        }

        status.innerText = "Bienvenue sur Le Terrain";

        // 2. Event Listeners
        console.log("App: Setting up event listeners");
        this.setupEventListeners();

        // 3. Visual Initialization
        this.renderHub();
        this.updateFinalMissionStatus();

        // 4. Check Registration
        const pseudo = this.saveManager.getPseudo();
        console.log("App: Current pseudo:", pseudo);
        if (!pseudo) {
            this.showRegistration();
        }
    }

    setupEventListeners() {
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log("Reset clicked");
                if (window.confirm("Recommencer la partie ? Toutes les données seront effacées.")) {
                    this.saveManager.reset();
                }
            });
        }

        const hsBtn = document.getElementById('highScoresBtn');
        if (hsBtn) {
            hsBtn.addEventListener('click', () => {
                console.log("High Scores clicked");
                this.showLeaderboard();
            });
        }

        const closeHsBtn = document.getElementById('closeLeaderboardBtn');
        if (closeHsBtn) {
            closeHsBtn.addEventListener('click', () => {
                console.log("Close Leaderboard clicked");
                this.hideModals();
            });
        }

        const savePseudoBtn = document.getElementById('savePseudoBtn');
        if (savePseudoBtn) {
            savePseudoBtn.addEventListener('click', (e) => {
                console.log("START button Click handler triggered", e);
                savePseudoBtn.style.backgroundColor = 'white';
                savePseudoBtn.style.color = 'black';
                this.registerPseudo();
            });
            console.log("App: START button listener attached v1.3");
        }

        // Global debug: log where clicks land
        window.addEventListener('click', (e) => {
            console.log("Global Click at:", e.clientX, e.clientY, "Target:", e.target.id || e.target.tagName);
        });

        const input = document.getElementById('pseudoInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    console.log("Enter key pressed in input");
                    this.registerPseudo();
                }
            });
        }

        // Final Game Listeners
        const fleeBtn = document.getElementById('fleeBtn');
        if (fleeBtn) {
            fleeBtn.addEventListener('click', () => {
                const conf = window.confirm("Es-tu sûr de vouloir fuir comme un lâche ?");
                if (conf) {
                    this.finalGame.stop();
                    this.showHub();
                }
            });
        }
        // Add Close Info Modal Listener
        const closeInfoBtn = document.getElementById('closeInfoBtn');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => {
                document.getElementById('charInfoModal').classList.add('hidden');
                document.getElementById('modalContainer').classList.add('hidden');
            });
        }

        // Add Close Missions Modal Listener
        const closeMissionsBtn = document.getElementById('closeMissionsBtn');
        if (closeMissionsBtn) {
            closeMissionsBtn.addEventListener('click', () => {
                document.getElementById('charMissionsModal').classList.add('hidden');
                document.getElementById('modalContainer').classList.add('hidden');
            });
        }
    }

    showRegistration() {
        const modal = document.getElementById('modalContainer');
        const regModal = document.getElementById('registrationModal');
        const input = document.getElementById('pseudoInput');

        modal.classList.remove('hidden');
        regModal.classList.remove('hidden');
        document.getElementById('leaderboardModal').classList.add('hidden');

        // Focus for better UX
        setTimeout(() => {
            input.focus();
        }, 100);
    }

    registerPseudo() {
        try {
            console.log("registerPseudo started");
            const input = document.getElementById('pseudoInput');
            if (!input) throw new Error("pseudoInput not found");

            const pseudo = input.value.trim().toUpperCase();
            console.log("Attempting to register pseudo:", pseudo);

            if (pseudo.length > 0 && pseudo.length <= 3) {
                console.log("Pseudo valid, saving...");
                this.saveManager.setPseudo(pseudo);
                this.hideModals();

                const statusBar = document.getElementById('status-bar');
                if (statusBar) {
                    statusBar.innerText = `BIENVENUE SUR LE TERRAIN, ${pseudo}`;
                }

                this.renderHub();
                console.log("Registration complete");
            } else {
                console.warn("Invalid pseudo length:", pseudo.length);
                input.classList.add('error-shake');
                setTimeout(() => input.classList.remove('error-shake'), 500);
            }
        } catch (err) {
            console.error("FATAL ERROR in registerPseudo:", err);
            alert("ERREUR CRITIQUE: " + err.message);
        }
    }

    showLeaderboard() {
        const list = document.getElementById('leaderboardList');
        const scores = this.saveManager.getLeaderboard();

        list.innerHTML = scores.map((s, i) => `
            <div class="leaderboard-item">
                <span class="rank">${i + 1}.</span>
                <span class="pseudo">${s.pseudo}</span>
                <span class="score">${s.score.toString().padStart(6, '0')}</span>
            </div>
        `).join('');

        document.getElementById('modalContainer').classList.remove('hidden');
        document.getElementById('leaderboardModal').classList.remove('hidden');
        document.getElementById('registrationModal').classList.add('hidden');
    }

    hideModals() {
        document.getElementById('modalContainer').classList.add('hidden');
    }



    renderHub() {
        const grid = document.getElementById('charGrid');
        grid.innerHTML = '';

        // Create the Mission Button element first (it will be inserted at index 4)
        const missionItem = document.createElement('div');
        missionItem.className = 'final-mission-item';
        missionItem.innerHTML = `
            <button id="finalMissionBtn" class="btn-final locked">
                <span class="lock-icon">🔒</span>
                MISSION FINALE
            </button>
        `;

        this.gameData.characters.forEach((char, index) => {
            // Insert mission button at the center (index 4 in a 3x3 grid)
            if (index === 4) {
                grid.appendChild(missionItem);
            }

            const card = document.createElement('div');
            card.className = 'character-card';

            const level = this.saveManager.getStat(char.id) || 0;
            const maxLevel = SaveManager.MAX_LEVEL || 3;
            const progressPercent = (level / maxLevel) * 100;
            const initial = char.name[0].toUpperCase();

            card.innerHTML = `
                <div class="card-play-area">
                    <div class="char-avatar">${initial}</div>
                    <div class="char-name">${char.name} (${char.nickname})</div>
                    <div class="char-stat-name">${char.stat}</div>
                    <div class="progress-section">
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="level-text">Niveau ${level}/${maxLevel}</span>
                    </div>
                </div>
                <div class="card-btn-row">
                    <button class="card-info-btn" data-char="${char.id}"><span class="stats-icon">⚡</span> STATS</button>
                    <button class="card-missions-btn" data-char="${char.id}">🗺️ MISSIONS</button>
                </div>
            `;

            card.querySelector('.card-play-area').addEventListener('click', () => {
                this.launchMiniGame(char);
            });

            card.querySelector('.card-info-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openCharacterInfo(char.id);
            });

            card.querySelector('.card-missions-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMissionsModal(char.id);
            });
            grid.appendChild(card);
        });
    }

    openCharacterInfo(charId) {
        const data = this.gameData.getCharacterData(charId);
        if (!data) return;

        // Set Header
        const initial = data.name[0].toUpperCase();
        document.getElementById('infoAvatar').innerText = initial;
        document.getElementById('infoName').innerText = data.name;
        document.getElementById('infoStat').innerText = data.stat;

        // Set Lore & Details
        document.getElementById('infoLore').innerText = `"${data.lore || 'Pas de message divin.'}"`;

        let nicknames = data.nickname || '';
        if (data.surnames && data.surnames.length > 0) {
            const randomSurname = data.surnames[Math.floor(Math.random() * data.surnames.length)].trim();
            nicknames += ` / ${randomSurname}`;
        }
        document.getElementById('infoNicknames').innerText = nicknames;
        document.getElementById('infoOrigin').innerText = data.origin || 'Inconnue';

        // Set Powers (pass completed missions to determine unlock status)
        const completedMissions = this.saveManager.getCompletedMissions();
        const powersList = document.getElementById('infoPowersList');
        powersList.innerHTML = '';

        const powers = this.gameData.getCharacterPowers(charId, completedMissions);

        if (powers && powers.length > 0) {
            powers.forEach(p => {
                const powerEl = document.createElement('div');
                const parsed = this.gameData.parsePowerName(p.name);
                let extraClass = '';
                if (p.isBase || p.isUnlocked) {
                    extraClass = p.isBase ? 'power-base' : (p.isSpecial ? 'power-special' : '');
                } else {
                    extraClass = p.isSpecial ? 'power-special power-locked' : 'power-locked';
                }

                const typeBadge = parsed.type
                    ? `<span class="power-type-badge ${parsed.typeClass}">${parsed.type}</span>`
                    : '';

                powerEl.className = `power-card ${extraClass}`;
                powerEl.innerHTML = `
                    <div class="power-icon">${p.icon}</div>
                    <div class="power-info">
                        ${typeBadge}
                        <div class="power-name">${parsed.displayName}</div>
                        <div class="power-desc">${p.desc || ''}</div>
                    </div>
                `;
                powersList.appendChild(powerEl);
            });
        } else {
            powersList.innerHTML = '<p style="color:#aaa; font-size:0.7rem; text-align:center;">Aucun pouvoir répertorié.</p>';
        }

        // Show Modal
        document.getElementById('registrationModal').classList.add('hidden');
        document.getElementById('leaderboardModal').classList.add('hidden');
        document.getElementById('charMissionsModal').classList.add('hidden');
        document.getElementById('charInfoModal').classList.remove('hidden');
        document.getElementById('modalContainer').classList.remove('hidden');
    }

    openMissionsModal(charId) {
        const char = this.gameData.characters.find(c => c.id === charId);
        if (!char) return;

        const initial = char.name[0].toUpperCase();
        document.getElementById('missionsAvatar').innerText = initial;
        document.getElementById('missionsName').innerText = char.name;
        document.getElementById('missionsStat').innerText = char.stat;

        this._renderMissionsList(charId);

        // Show modal
        document.getElementById('registrationModal').classList.add('hidden');
        document.getElementById('leaderboardModal').classList.add('hidden');
        document.getElementById('charInfoModal').classList.add('hidden');
        document.getElementById('charMissionsModal').classList.remove('hidden');
        document.getElementById('modalContainer').classList.remove('hidden');
    }

    _renderMissionsList(charId) {
        const missions = this.gameData.getCharacterMissions(charId);
        const missionsList = document.getElementById('missionsList');
        missionsList.innerHTML = '';

        if (missions.length === 0) {
            missionsList.innerHTML = '<p style="color:#aaa; font-size:0.7rem; text-align:center;">Aucune mission disponible.</p>';
            return;
        }

        missions.forEach(m => {
            const completed = this.saveManager.isMissionCompleted(m.id);
            const card = document.createElement('div');
            card.className = `mission-card ${completed ? 'mission-completed' : ''}`;

            const rewardHtml = m.unlocksPowerId
                ? `<span class="mission-reward">🔓 Débloque un pouvoir</span>`
                : `<span class="mission-reward mission-no-reward">Pas de récompense</span>`;

            card.innerHTML = `
                <div class="mission-icon">${m.icon}</div>
                <div class="mission-info">
                    <div class="mission-name">${m.nom}</div>
                    <div class="mission-desc">${m.inf}</div>
                    ${rewardHtml}
                </div>
                <div class="mission-action">
                    ${completed
                    ? `<span class="mission-done">✅</span>`
                    : `<button class="mission-validate-btn" data-mission="${m.id}">VALIDER</button>`
                }
                </div>
            `;

            if (!completed) {
                card.querySelector('.mission-validate-btn').addEventListener('click', () => {
                    this.saveManager.completeMission(m.id);
                    this._renderMissionsList(charId);
                    this.renderHub();
                    this.updateFinalMissionStatus();
                });
            }

            missionsList.appendChild(card);
        });
    }

    updateFinalMissionStatus() {
        const btn = document.getElementById('finalMissionBtn');
        if (!btn) return;

        if (this.saveManager.isMissionFinalUnlocked()) {
            btn.classList.remove('locked');
            btn.classList.add('unlocked');
            const icon = btn.querySelector('.lock-icon');
            if (icon) icon.innerText = '🔓';
            btn.onclick = () => this.launchFinalGame();
        }
    }

    launchMiniGame(char) {
        alert(`Lancement du mini-jeu de ${char.name} (${char.stat})...`);

        // si perdu, on ne fait rien

        // si gagné, on met à jour le stat
        this.saveManager.updateStat(char.id, this.saveManager.getStat(char.id) + 1);
        this.renderHub();
        this.updateFinalMissionStatus();
    }

    showHub() {
        document.getElementById('rpgScreen').classList.add('hidden');
        document.getElementById('hub').classList.remove('hidden');
        document.getElementById('status-bar').innerText = `Où veux-tu t'entraîner ?`;
        this.renderHub();
        this.updateFinalMissionStatus();
    }

    launchFinalGame() {
        document.getElementById('hub').classList.add('hidden');
        document.getElementById('rpgScreen').classList.remove('hidden');
        document.getElementById('status-bar').innerText = `L'HEURE DE LA REVANCHE A SONNÉ !`;

        this.finalGame.start();
    }
}

// Start the app
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
