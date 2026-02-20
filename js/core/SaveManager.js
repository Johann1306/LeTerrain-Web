export class SaveManager {
    constructor() {
        this.PLAYER_KEY = 'le_terrain_player';
        this.LEADERBOARD_KEY = 'le_terrain_leaderboard';

        this.playerData = this.loadPlayer();
        this.leaderboardData = this.loadLeaderboard();
    }

    loadPlayer() {
        const saved = localStorage.getItem(this.PLAYER_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Player save corruption:', e);
            }
        }
        return this.getInitialPlayerSave();
    }

    loadLeaderboard() {
        const saved = localStorage.getItem(this.LEADERBOARD_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Leaderboard corruption:', e);
            }
        }
        const initial = this.getInitialLeaderboard();
        this.saveLeaderboard(initial);
        return initial;
    }

    getInitialPlayerSave() {
        return {
            pseudo: '',
            stats: {
                johann: 0,
                nicolas: 0,
                pierre: 0,
                thomas: 0,
                yannick: 0,
                ali: 0,
                guillaume: 0,
                jonathan: 0
            },
            completedMissions: [],
            discoveredPowers: [],
            lastPlayed: new Date().toISOString()
        };
    }

    getInitialLeaderboard() {
        return [
            { pseudo: 'YOU', score: 1500 },
            { pseudo: 'AAA', score: 1400 },
            { pseudo: 'BBB', score: 1300 },
            { pseudo: 'CCC', score: 1200 },
            { pseudo: 'DDD', score: 1100 },
            { pseudo: 'EEE', score: 1000 },
            { pseudo: 'FFF', score: 900 },
            { pseudo: 'GGG', score: 800 },
            { pseudo: 'HHH', score: 700 },
            { pseudo: 'III', score: 600 }
        ];
    }

    setPseudo(pseudo) {
        this.playerData.pseudo = pseudo.toUpperCase().substring(0, 3);
        this.savePlayer();
    }

    getPseudo() {
        return this.playerData.pseudo || '';
    }

    addScore(pseudo, score) {
        this.leaderboardData.push({ pseudo: pseudo.toUpperCase().substring(0, 3), score: score });
        this.leaderboardData.sort((a, b) => b.score - a.score);
        this.leaderboardData = this.leaderboardData.slice(0, 10);
        this.saveLeaderboard(this.leaderboardData);
    }

    getLeaderboard() {
        return this.leaderboardData;
    }

    savePlayer() {
        this.playerData.lastPlayed = new Date().toISOString();
        localStorage.setItem(this.PLAYER_KEY, JSON.stringify(this.playerData));
    }

    saveLeaderboard(data) {
        localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(data));
    }

    updateStat(charId, level) {
        if (this.playerData.stats[charId] !== undefined) {
            this.playerData.stats[charId] = Math.min(level, 3);
            this.savePlayer();
        }
    }

    getStat(charId) {
        return this.playerData.stats[charId] || 0;
    }

    completeMission(missionId) {
        if (!this.playerData.completedMissions) {
            this.playerData.completedMissions = [];
        }
        if (!this.playerData.completedMissions.includes(missionId)) {
            this.playerData.completedMissions.push(missionId);
            this.savePlayer();
        }
    }

    isMissionCompleted(missionId) {
        return (this.playerData.completedMissions || []).includes(missionId);
    }

    getCompletedMissions() {
        return this.playerData.completedMissions || [];
    }

    reset() {
        // Only reset player data
        localStorage.removeItem(this.PLAYER_KEY);
        // We could also just set this.playerData = this.getInitialPlayerSave() and save()
        // but removing the key forces a clean "New Player" state on reload
        window.location.reload();
    }

    isMissionFinalUnlocked() {
        return Object.values(this.playerData.stats).every(lvl => lvl >= 1);
    }
}
