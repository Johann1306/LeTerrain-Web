import { GameData } from './core/GameData.js';
import { SaveManager } from './core/SaveManager.js';

class App {
    constructor() {
        console.log("App: Constructor start");
        this.gameData = new GameData();
        this.saveManager = new SaveManager();
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
            const progressPercent = (level / 3) * 100;
            const initial = char.name[0].toUpperCase();

            card.innerHTML = `
                <div class="char-avatar">${initial}</div>
                <div class="char-name">${char.name} (${char.nickname})</div>
                <div class="char-stat-name">${char.stat}</div>
                <div class="progress-section">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="level-text">Niveau ${level}/3</span>
                </div>
            `;

            card.addEventListener('click', () => this.launchMiniGame(char));
            grid.appendChild(card);
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
        this.saveManager.savePlayer();
        this.saveManager.saveLeaderboard();
        this.renderHub();
        this.updateFinalMissionStatus();
    }

    launchFinalGame() {
        alert("Lancement de la MISSION FINALE !");
    }
}

// Start the app
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
