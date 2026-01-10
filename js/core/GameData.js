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
            origin: this.nested.origines?.[charId]
        };
    }
}
