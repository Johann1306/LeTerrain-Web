import { PropertiesParser } from './propertiesParser.js';

export class GameData {
    constructor() {
        this.raw = {};
        this.nested = {};
        this.characters = [
            { id: 'guillaume', name: 'Guillaume', nickname: 'Guy', stat: 'Technique' },
            { id: 'pierre', name: 'Pierre', nickname: 'Pip', stat: 'Agilité' },
            { id: 'thomas', name: 'Thomas', nickname: 'Tom', stat: 'Intelligence' },
            { id: 'johann', name: 'Johann', nickname: 'Yo', stat: 'Chance' },
            { id: 'jonathan', name: 'Jonathan', nickname: 'Russ', stat: 'Endurance' },
            { id: 'yannick', name: 'Yannick', nickname: 'Ya', stat: 'Résistance' },
            { id: 'ali', name: 'Ali', nickname: 'Ali', stat: 'Rapidité' },
            { id: 'nicolas', name: 'Nicolas', nickname: 'Nico', stat: 'Exploit' }
        ];
    }

    async load() {
        try {
            const response = await fetch('./leTerrain.properties');
            const content = await response.text();
            this.raw = PropertiesParser.parse(content);
            this.nested = PropertiesParser.nest(this.raw);
            console.log('GameData loaded:', this.nested);
            return true;
        } catch (error) {
            console.error('Failed to load properties:', error);
            return false;
        }
    }

    getCharacterData(charId) {
        return {
            ...this.characters.find(c => c.id === charId),
            lore: this.nested.message?.dieu?.[charId],
            surnames: this.nested.surnom?.secondaires?.[charId]?.split(','),
            origin: this.nested.origines?.[charId],
            powers: this.getCharacterPowers(charId)
        };
    }

    getCharacterPowers(charId, completedMissions = []) {
        const powers = [];

        // Build a set of power IDs unlocked via completed missions
        const missions = this.getCharacterMissions(charId);
        const unlockedPowerIds = new Set();
        missions.forEach(m => {
            if (m.unlocksPowerId && completedMissions.includes(m.id)) {
                unlockedPowerIds.add(m.unlocksPowerId);
            }
        });

        // Base Power (defined in 'POUVOIRS DEBLOQUES DES LE DEBUT', ends in '01')
        const baseKeyMatch = Object.keys(this.raw).find(k => k.startsWith(`pouvoir.${charId}.`) && k.endsWith('01.nom'));

        if (baseKeyMatch) {
            const id = baseKeyMatch.split('.')[2];
            powers.push({
                id: id,
                name: this.raw[baseKeyMatch],
                desc: this.raw[`pouvoir.${charId}.${id}.inf`],
                isBase: true,
                isSpecial: false,
                isUnlocked: true,
                icon: this.getIcon(this.raw[baseKeyMatch], this.raw[`pouvoir.${charId}.${id}.inf`])
            });
        }

        // All other powers for this character (simplifié pour éviter les doublons et optimiser la lecture)
        const allCharacterPowerKeys = Object.keys(this.raw).filter(k => k.startsWith(`pouvoir.${charId}.`) && /\.nom$/.test(k) && !/\.01\.nom$/.test(k));

        // Cache des noms de pouvoirs pour éviter les doublons
        const powerCache = new Map();
        allCharacterPowerKeys.forEach(key => {
            const id = key.split('.')[2];
            if (!powerCache.has(id) && !key.endsWith('01.nom')) { // Évite les doublons pour le pouvoir de base
                powerCache.set(id, true);
                const isSpecial = id.match(/[1-8]8[1|2]$/) !== null;
                const isUnlocked = unlockedPowerIds.has(id);
                powers.push({
                    id: id,
                    name: this.raw[key],
                    desc: this.raw[`pouvoir.${charId}.${id}.inf`] || '',
                    isBase: false,
                    isSpecial: isSpecial,
                    isUnlocked: isUnlocked,
                    icon: this.getIcon(this.raw[key], this.raw[`pouvoir.${charId}.${id}.inf`] || '')
                });
            }
        });

        powers.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        return powers;
    }

    /**
     * Returns the list of missions for a given character, each with the ID of
     * the power it unlocks (if any). Relies on the sequential order of keys in
     * the raw object (JavaScript objects preserve insertion order for string keys).
     *
     * File structure (4 lines per pair):
     *   mission.[charId].[mId].nom = ...
     *   mission.[charId].[mId].inf = ...
     *   pouvoir.[charId].[pId].nom = ...   ← unlocked by the mission above
     *   pouvoir.[charId].[pId].inf = ...
     */
    getCharacterMissions(charId) {
        const allKeys = Object.keys(this.raw);
        const missions = [];
        const missionNomPattern = new RegExp(`^mission\.${charId}\.(\\d+)\.nom$`);
        const powerNomPattern = new RegExp(`^pouvoir\.${charId}\.(\\d+)\.nom$`);

        allKeys.forEach((key, index) => {
            const mMatch = key.match(missionNomPattern);
            if (!mMatch) return;

            const mId = mMatch[1];
            const missionId = `${charId}.${mId}`;

            // Look ahead: the next '.nom' key in sequence determines if a power is unlocked
            let unlocksPowerId = null;
            for (let i = index + 1; i < allKeys.length; i++) {
                const nextKey = allKeys[i];
                // Stop if we hit another mission.nom key without finding a pouvoir.nom
                if (nextKey.match(missionNomPattern)) break;
                const pMatch = nextKey.match(powerNomPattern);
                if (pMatch) {
                    unlocksPowerId = pMatch[1];
                    break;
                }
            }

            missions.push({
                id: missionId,
                nom: this.raw[key],
                inf: this.raw[`mission.${charId}.${mId}.inf`] || '',
                unlocksPowerId: unlocksPowerId,
                icon: this.getIcon(this.raw[key], this.raw[`mission.${charId}.${mId}.inf`] || '')
            });
        });

        return missions;
    }

    getIcon(name, desc) {
        const text = (name + ' ' + desc).toLowerCase();

        // 1. Character-specific unique matches
        // Jonathan
        if (text.includes('pompes') || text.includes('muscu')) return '💪';
        if (text.includes('racaille')) return '🦹';
        if (text.includes('kfc') || text.includes('poulet')) return '🍗';
        if (text.includes('caméléon')) return '🦎';
        if (text.includes('mamelles')) return '🐄';

        // Guillaume
        if (text.includes('tempête')) return '⛈️';
        if (text.includes('jonglerettes')) return '🤹';
        if (text.includes('chamanique')) return '🌿';
        if (text.includes('dauphin')) return '🐬';
        if (text.includes('whisky') || text.includes('bourré') || text.includes('champagne')) return '🍾';

        if (text.includes('mollard') || text.includes('brasserie')) return '🍺';

        // Ali
        if (text.includes('mécanique') || text.includes('outil')) return '🔧';
        if (text.includes('sensorielle') || text.includes('génie')) return '👁️';
        if (text.includes('roulette')) return '🎰';
        if (text.includes('cambriolage')) return '🥷';
        if (text.includes('jackson')) return '🕺';

        // Thomas
        if (text.includes('tortue')) return '🐢';
        if (text.includes('louveteaux')) return '🐺';
        if (text.includes('nasale') || text.includes('nez')) return '👃';
        if (text.includes('saigneur') || text.includes('sang')) return '🩸';
        if (text.includes('pilou') || text.includes('face')) return '🪙';
        if (text.includes('papiers')) return '📄';
        if (text.includes('communication') || text.includes('parle')) return '🗣️';

        // Yannick
        if (text.includes('poker')) return '🃏';
        if (text.includes('lapidation') || text.includes('caillou')) return '🪨';
        if (text.includes('marie-jeanne')) return '🌿';
        if (text.includes('contrefaçon')) return '🎭';
        if (text.includes('guêpe') || text.includes('piqué')) return '🐝';
        if (text.includes('acouphène')) return '👂';

        // Pierre
        if (text.includes('spray')) return '💦';
        if (text.includes('trottinette')) return '🛴';
        if (text.includes('oubli') || text.includes('clef')) return '🔑';
        if (text.includes('sommeil')) return '💤';

        // Nicolas
        if (text.includes('cheville')) return '🦶';
        if (text.includes('chasse')) return '🏹';
        if (text.includes('coq')) return '🐓';

        // Johann
        if (text.includes('claquette')) return '🩴';
        if (text.includes('pluie')) return '🌧️';
        if (text.includes('sieste')) return '😴';
        if (text.includes('vitesse')) return '🚀';
        if (text.includes('prout')) return '💨';
        if (text.includes('bûcheron')) return '🪓';

        // 2. Very specific exact matches (prioritizing rare or specific concepts)
        if (text.includes('cul')) return '🍑';
        if (text.includes('ballet') || text.includes('danse classique')) return '🩰';
        if (text.includes('crache')) return '💦';
        if (text.includes('waterloo')) return '🥼';
        if (text.includes('dark web')) return '💻';
        if (text.includes('escargot')) return '🐌';
        if (text.includes('pirate')) return '🦜';
        if (text.includes('zombie') || text.includes('mort-vivant')) return '🧟';
        if (text.includes('maconnerie') || text.includes('brique')) return '🧱';
        if (text.includes('tennis')) return '🎾';
        if (text.includes('dieu') || text.includes('divin')) return '⚡';
        if (text.includes('fantome') || text.includes('esprit')) return '👻';
        if (text.includes('dinosaure') || text.includes('t-rex')) return '🦖';
        if (text.includes('singe') || text.includes('macaque')) return '🐒';
        if (text.includes('robot') || text.includes('cyborg')) return '🤖';
        if (text.includes('alien') || text.includes('extraterrestre')) return '👽';
        if (text.includes('vampire')) return '🧛';
        if (text.includes('ninja')) return '🥷';
        if (text.includes('fleur') || text.includes('rose') || text.includes('plante')) return '🌹';
        if (text.includes('poisson') || text.includes('requin') || text.includes('baleine')) return '🦈';
        if (text.includes('chat') || text.includes('félin')) return '🐈';
        if (text.includes('chien') || text.includes('loup')) return '🐺';
        if (text.includes('chier') || text.includes('caca')) return '💩';
        if (text.includes('poudre') || text.includes('perlimpinpin')) return '✨';

        // 2. Thematic categories (more general)
        if (text.includes('soirée') || text.includes('boire') || text.includes('alcool') || text.includes('whisky') || text.includes('bar') || text.includes('bière') || text.includes('pinte')) return '🍺';
        if (text.includes('sport') || text.includes('piscine') || text.includes('natation') || text.includes('muscu') || text.includes('courir')) return '🏋️';
        if (text.includes('foot') || text.includes('match') || text.includes('ballon')) return '⚽';
        if (text.includes('nuit') || text.includes('fête') || text.includes('danc') || text.includes('club')) return '🌙';
        if (text.includes('voiture') || text.includes('conduit') || text.includes('avion') || text.includes('pilot') || text.includes('moto')) return '🚗';
        if (text.includes('musique') || text.includes('guitare') || text.includes('chanson') || text.includes('concert') || text.includes('chanter')) return '🎸';
        if (text.includes('combat') || text.includes('bagarre') || text.includes('poing') || text.includes('karate') || text.includes('tatami')) return '🥊';
        if (text.includes('film') || text.includes('cinéma') || text.includes('série') || text.includes('regarder')) return '🎬';
        if (text.includes('manger') || text.includes('cuisine') || text.includes('recette') || text.includes('pizza') || text.includes('sandwich') || text.includes('burger')) return '🍔';
        if (text.includes('voyage') || text.includes('partir') || text.includes('hotel') || text.includes('train')) return '✈️';
        if (text.includes('argent') || text.includes('achet') || text.includes('billet') || text.includes('cash') || text.includes('euro')) return '💰';
        if (text.includes('soleil') || text.includes('bronz') || text.includes('plage') || text.includes('vacances')) return '☀️';
        if (text.includes('danger') || text.includes('surviv') || text.includes('mort') || text.includes('risque')) return '💀';
        if (text.includes('amour') || text.includes('femme') || text.includes('fille') || text.includes('romance') || text.includes('couple') || text.includes('sex')) return '💋';
        if (text.includes('école') || text.includes('apprenti') || text.includes('apprendre') || text.includes('livre') || text.includes('étudier')) return '📚';
        if (text.includes('jeu') || text.includes('jouer') || text.includes('console') || text.includes('ordinat') || text.includes('pc') || text.includes('geek')) return '🎮';
        if (text.includes('doudoune sans manche')) return '🦺';
        if (text.includes('vetement') || text.includes('mode') || text.includes('style') || text.includes('habille') || text.includes('veste')) return '👕';
        if (text.includes('chaussure')) return '👟';
        if (text.includes('chance') || text.includes('trefle') || text.includes('golden')) return '🍀';
        if (text.includes('technique') || text.includes('outil')) return '⚙️';
        if (text.includes('eau') || text.includes('tsunami') || text.includes('vague')) return '🌊';
        if (text.includes('glace') || text.includes('gel') || text.includes('froid')) return '❄️';
        if (text.includes('terre') || text.includes('séisme') || text.includes('roche')) return '🪨';
        if (text.includes('vent') || text.includes('tornade') || text.includes('souffle')) return '🌪️';
        if (text.includes('poison') || text.includes('toxique') || text.includes('venin')) return '🧪';
        if (text.includes('lumière') || text.includes('soleil') || text.includes('laser')) return '☀️';
        if (text.includes('ombre') || text.includes('ténèbres') || text.includes('nuit')) return '🌑';

        // 3. Fallback
        return '⭐';
    }

    getIconForPowerType(fullName) {
        const parsed = this.parsePowerName(fullName);

        if (parsed.typeClass) {
            switch (parsed.typeClass) {
                case 'ptype-regen-vie-perso': return '❤️';
                case 'ptype-regen-vie-mono': return '💘';
                case 'ptype-regen-vie-multi': return '💞';

                case 'ptype-regen-mana-perso': return '🔮';
                case 'ptype-regen-mana-mono': return '🪄';
                case 'ptype-regen-mana-multi': return '🌌';

                case 'ptype-absorb-vie-mono': return '🧛';
                case 'ptype-absorb-vie-multi': return '🦇';

                case 'ptype-absorb-mana-mono': return '🧿';
                case 'ptype-absorb-mana-multi': return '🌀';

                case 'ptype-bouclier-perso': return '🛡️';
                case 'ptype-bouclier-mono': return '🔰';
                case 'ptype-bouclier-multi': return '🏰';

                case 'ptype-degats-mono': return '💥';
                case 'ptype-degats-multi': return '☄️';
                case 'ptype-degats-all': return '☢️';

                case 'ptype-brulure-mono': return '🔥';
                case 'ptype-brulure-multi': return '🌋';

                case 'ptype-stun-mono': return '💫';
                case 'ptype-stun-multi': return '😵‍💫';

                case 'ptype-taunt-mono': return '🤬';
                case 'ptype-taunt-multi': return '📣';

                case 'ptype-esquive': return '💨';

                case 'ptype-aura-mono': return '✨';
                case 'ptype-aura-multi': return '💫';

                case 'ptype-resurrection-mono': return '👼';
                case 'ptype-resurrection-multi': return '🕊️';
            }
        }

        return '🌟';
    }

    /**
     * Parses a power name like "(Dégâts Multi) Rocky Balboula"
     * Returns { type: "Dégâts", scope: "Multi", displayName: "Rocky Balboula", typeClass: "power-type-degats-multi" }
     */
    parsePowerName(fullName) {
        const match = fullName.match(/^\(([^)]+)\)\s*(.+)$/);
        if (!match) {
            return { type: null, scope: null, displayName: fullName, typeClass: '' };
        }

        const bracketContent = match[1].trim(); // e.g. "Dégâts Multi" or "Aura Multi - Rapidité"
        const displayName = match[2].trim();

        // Determine the base type
        const lc = bracketContent.toLowerCase();
        let type = bracketContent;
        let typeClass = '';

        if (lc.includes('dégats') || lc.includes('degats')) {
            typeClass = lc.includes('multi') ? 'ptype-degats-multi'
                : lc.includes('all') ? 'ptype-degats-all'
                    : 'ptype-degats-mono';
        } else if (lc.includes('bouclier')) {
            typeClass = lc.includes('multi') ? 'ptype-bouclier-multi'
                : lc.includes('mono') ? 'ptype-bouclier-mono'
                    : 'ptype-bouclier-perso';
        } else if (lc.includes('regen') && lc.includes('vie')) {
            typeClass = lc.includes('multi') ? 'ptype-regen-vie-multi'
                : lc.includes('mono') ? 'ptype-regen-vie-mono'
                    : 'ptype-regen-vie-perso';
        } else if (lc.includes('regen') && lc.includes('mana')) {
            typeClass = lc.includes('multi') ? 'ptype-regen-mana-multi'
                : lc.includes('mono') ? 'ptype-regen-mana-mono'
                    : 'ptype-regen-mana-perso';
        } else if (lc.includes('absorb') && lc.includes('vie')) {
            typeClass = lc.includes('multi') ? 'ptype-absorb-vie-multi' : 'ptype-absorb-vie-mono';
        } else if (lc.includes('absorb') && lc.includes('mana')) {
            typeClass = lc.includes('multi') ? 'ptype-absorb-mana-multi' : 'ptype-absorb-mana-mono';
        } else if (lc.includes('brûlure') || lc.includes('brulure')) {
            typeClass = lc.includes('multi') ? 'ptype-brulure-multi' : 'ptype-brulure-mono';
        } else if (lc.includes('stun')) {
            typeClass = lc.includes('multi') ? 'ptype-stun-multi' : 'ptype-stun-mono';
        } else if (lc.includes('taunt')) {
            typeClass = lc.includes('multi') ? 'ptype-taunt-multi' : 'ptype-taunt-mono';
        } else if (lc.includes('esquive')) {
            typeClass = 'ptype-esquive';
        } else if (lc.includes('aura')) {
            typeClass = lc.includes('multi') ? 'ptype-aura-multi' : 'ptype-aura-mono';
        } else if (lc.includes('résurrection') || lc.includes('resurrection')) {
            typeClass = lc.includes('multi') ? 'ptype-resurrection-multi' : 'ptype-resurrection-mono';
        }

        return { type: bracketContent, displayName, typeClass };
    }

    // --- FINAL GAME DATA ACCESSEURS ---
    getRandomEnemyName() {
        const types = Object.keys(this.nested.ennemi?.noms || {});
        if (types.length === 0) return "Ennemi Inconnu";

        const randomType = types[Math.floor(Math.random() * types.length)];
        const namesString = this.nested.ennemi.noms[randomType];

        if (!namesString) return "Ennemi Inconnu";

        const names = namesString.split(',');
        return names[Math.floor(Math.random() * names.length)].trim();
    }

    getBossData(bossIndex) {
        // bosses are 1001-1008
        const id = 1000 + bossIndex; // bossIndex from 1 to 8
        const missionKey = `boss`; // the key in nested is actually mission.boss.[author].[1001] but let's parse raw for easier access

        // Find the mission in raw data since nested structure for boss depends on dynamic char name
        const bossNameKey = Object.keys(this.raw).find(k => k.startsWith('mission.boss.') && k.endsWith(`.${id}.nom`));
        const bossQuoteKey = `boss.citation.${bossIndex}`;

        return {
            name: bossNameKey ? this.raw[bossNameKey] : `Boss ${bossIndex}`,
            quote: this.raw[bossQuoteKey] || "Je vais te détruire!"
        };
    }
}
