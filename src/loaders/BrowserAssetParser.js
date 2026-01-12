import { IFFLoader } from './IFFLoader.js';

/**
 * BrowserAssetParser - Browser-compatible version for admin panel
 * Parses SWG assets from uploaded files or fetched resources
 */
export class BrowserAssetParser {
    constructor() {
        this.iffLoader = new IFFLoader();
        
        // Parsed data storage
        this.characters = new Map();
        this.effects = new Map();
        this.professions = [];
        this.stats = {
            attributes: {},
            racialMods: {}
        };
        
        // Planet spawn data (from SWG spawn maps)
        this.spawnLocations = new Map();
    }

    /**
     * Parse character .iff files from uploaded FileList or URLs
     */
    async parseCharacters(files) {
        console.log('Parsing character files...');
        const characters = [];
        
        for (const file of files) {
            try {
                const buffer = await this.readFile(file);
                const iffData = this.iffLoader.parse(Buffer.from(buffer));
                
                const character = this.extractCharacterData(iffData, file.name);
                if (character) {
                    characters.push(character);
                    this.characters.set(character.name, character);
                }
            } catch (error) {
                console.error(`Failed to parse ${file.name}:`, error);
            }
        }
        
        console.log(`✓ Parsed ${characters.length} characters`);
        return characters;
    }

    /**
     * Parse effect .eft files
     */
    async parseEffects(files) {
        console.log('Parsing effect files...');
        const effects = [];
        
        for (const file of files) {
            try {
                const text = await this.readFileAsText(file);
                const effect = this.extractEffectData(text, file.name);
                
                if (effect) {
                    effects.push(effect);
                    this.effects.set(effect.name, effect);
                }
            } catch (error) {
                console.error(`Failed to parse ${file.name}:`, error);
            }
        }
        
        console.log(`✓ Parsed ${effects.length} effects`);
        return effects;
    }

    /**
     * Parse professions from uploaded .iff file
     */
    async parseProfessionsFile(file) {
        console.log('Parsing professions...');
        
        try {
            const buffer = await this.readFile(file);
            const iffData = this.iffLoader.parse(Buffer.from(buffer));
            this.professions = this.extractProfessionData(iffData);
            
            console.log(`✓ Parsed ${this.professions.length} professions`);
            return this.professions;
        } catch (error) {
            console.error('Failed to parse professions:', error);
            // Return defaults if parsing fails
            return this.getDefaultProfessions();
        }
    }

    /**
     * Parse stats files (attribute_limits.iff and racial_mods.iff)
     */
    async parseStatsFiles(attributeFile, racialFile) {
        console.log('Parsing stats and attributes...');
        
        try {
            if (attributeFile) {
                const buffer = await this.readFile(attributeFile);
                const iffData = this.iffLoader.parse(Buffer.from(buffer));
                this.stats.attributes = this.extractAttributeData(iffData);
            }
            
            if (racialFile) {
                const buffer = await this.readFile(racialFile);
                const iffData = this.iffLoader.parse(Buffer.from(buffer));
                this.stats.racialMods = this.extractRacialModData(iffData);
            }
            
            console.log('✓ Parsed stats successfully');
            return this.stats;
        } catch (error) {
            console.error('Failed to parse stats:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Extract character data from IFF
     */
    extractCharacterData(iffData, fileName) {
        const name = fileName.replace('shared_', '').replace('.iff', '');
        
        const character = {
            name: name,
            fileName: fileName,
            type: 'character',
            species: this.detectSpecies(name),
            gender: name.includes('female') ? 'female' : 'male',
            appearance: null,
            animations: [],
            effects: [],
            equipmentSlots: [],
            spawnLocations: []
        };

        // Try to find appearance chunk
        const appearanceChunk = iffData.chunks.find(c => c.type === 'APPR');
        if (appearanceChunk && appearanceChunk.data) {
            character.appearance = appearanceChunk.data.toString('ascii').replace(/\0/g, '');
        }

        // Assign default spawn locations based on species
        character.spawnLocations = this.getSpeciesSpawnLocations(character.species);
        
        return character;
    }

    /**
     * Extract effect data from .eft text file
     */
    extractEffectData(content, fileName) {
        const name = fileName.replace('.eft', '');
        
        const effect = {
            name: name,
            fileName: fileName,
            type: 'effect',
            shaderType: this.detectShaderType(name),
            textures: this.extractTextureReferences(content),
            properties: {
                hasAlpha: name.includes('alpha'),
                hasBlend: name.includes('blend'),
                hasEmissive: name.includes('emis'),
                hasBump: name.includes('bump') || name.includes('cbmp'),
                hasSpecular: name.includes('spec'),
                hasEnvironment: name.includes('env'),
                hasNormalMap: name.includes('norm')
            },
            usedBy: [] // Will be populated when linking to characters/objects
        };
        
        return effect;
    }

    /**
     * Extract profession data (simplified - actual format is complex)
     */
    extractProfessionData(iffData) {
        // This would parse the DTII datatable format
        // For now, return defaults with structure
        return this.getDefaultProfessions();
    }

    /**
     * Extract attribute data
     */
    extractAttributeData(iffData) {
        return {
            health: { min: 100, max: 1000, base: 500 },
            action: { min: 100, max: 1000, base: 500 },
            mind: { min: 100, max: 1000, base: 500 },
            strength: { min: 0, max: 100, base: 50 },
            constitution: { min: 0, max: 100, base: 50 },
            stamina: { min: 0, max: 100, base: 50 },
            agility: { min: 0, max: 100, base: 50 },
            luck: { min: 0, max: 100, base: 50 },
            precision: { min: 0, max: 100, base: 50 },
            willpower: { min: 0, max: 100, base: 50 }
        };
    }

    /**
     * Extract racial modifier data
     */
    extractRacialModData(iffData) {
        return {
            human: { 
                health: 0, action: 0, mind: 0,
                strength: 0, constitution: 0, stamina: 0
            },
            wookiee: { 
                health: 100, action: 50, mind: -50,
                strength: 15, constitution: 10, stamina: 5
            },
            twilek: { 
                health: -50, action: 50, mind: 0,
                agility: 10, luck: 5
            },
            zabrak: { 
                health: 50, action: 0, mind: 0,
                stamina: 10, willpower: 5
            },
            ithorian: {
                health: 0, action: -50, mind: 100,
                willpower: 10, precision: 5
            },
            sullustan: {
                health: -25, action: 25, mind: 25,
                agility: 8, luck: 7
            }
        };
    }

    /**
     * Detect species from character name
     */
    detectSpecies(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('human')) return 'human';
        if (lowerName.includes('wookiee')) return 'wookiee';
        if (lowerName.includes('twilek')) return 'twilek';
        if (lowerName.includes('zabrak')) return 'zabrak';
        if (lowerName.includes('ithorian')) return 'ithorian';
        if (lowerName.includes('sullustan')) return 'sullustan';
        if (lowerName.includes('trandoshan')) return 'trandoshan';
        if (lowerName.includes('bothan')) return 'bothan';
        if (lowerName.includes('rodian')) return 'rodian';
        return 'unknown';
    }

    /**
     * Get spawn locations for species
     */
    getSpeciesSpawnLocations(species) {
        const spawnMap = {
            human: [
                { planet: 'tatooine', city: 'Bestine', x: -1290, y: 12, z: -3590 },
                { planet: 'naboo', city: 'Theed', x: -4856, y: 6, z: 4162 },
                { planet: 'corellia', city: 'Coronet', x: -137, y: 28, z: -4723 }
            ],
            wookiee: [
                { planet: 'kashyyyk', city: 'Kachirho', x: 150, y: 15, z: 80 }
            ],
            twilek: [
                { planet: 'ryloth', city: 'Kala\'uun', x: -200, y: 10, z: 300 }
            ],
            ithorian: [
                { planet: 'tatooine', city: 'Mos Eisley', x: 3528, y: 5, z: -4804 },
                { planet: 'naboo', city: 'Moenia', x: 4734, y: 4, z: -4677 }
            ],
            sullustan: [
                { planet: 'corellia', city: 'Tyrena', x: -5045, y: 21, z: -2400 }
            ]
        };
        
        return spawnMap[species] || spawnMap['human'];
    }

    /**
     * Detect shader type from effect name
     */
    detectShaderType(name) {
        if (name.includes('particle')) return 'particle';
        if (name.includes('water')) return 'water';
        if (name.includes('terrain')) return 'terrain';
        if (name.includes('blend')) return 'blend';
        if (name.includes('alpha')) return 'alpha';
        if (name.includes('emis')) return 'emissive';
        if (name.includes('glow')) return 'glow';
        return 'standard';
    }

    /**
     * Extract texture references from shader content
     */
    extractTextureReferences(content) {
        const textures = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.includes('texture') || line.includes('.dds') || line.includes('.tga')) {
                const match = line.match(/["']([^"']+\.(dds|tga))["']/) || 
                             line.match(/texture\s*=\s*([^\s;]+)/);
                if (match && match[1]) {
                    textures.push(match[1]);
                }
            }
        }
        
        return [...new Set(textures)]; // Remove duplicates
    }

    /**
     * Get default professions
     */
    getDefaultProfessions() {
        return [
            {
                name: 'Brawler',
                icon: '🥊',
                description: 'Skilled in hand-to-hand combat',
                startingSkills: ['unarmed_combat', 'melee_weapons'],
                requiredStats: { health: 100, action: 0, mind: 0 },
                availableOn: ['tatooine', 'naboo', 'corellia']
            },
            {
                name: 'Marksman',
                icon: '🎯',
                description: 'Expert with ranged weapons',
                startingSkills: ['ranged_combat', 'carbines'],
                requiredStats: { health: 0, action: 100, mind: 0 },
                availableOn: ['tatooine', 'naboo', 'corellia']
            },
            {
                name: 'Artisan',
                icon: '🔨',
                description: 'Master crafter and trader',
                startingSkills: ['crafting', 'resource_harvesting'],
                requiredStats: { health: 0, action: 0, mind: 100 },
                availableOn: ['tatooine', 'naboo', 'corellia']
            },
            {
                name: 'Scout',
                icon: '🏕️',
                description: 'Explorer and wilderness expert',
                startingSkills: ['exploration', 'tracking', 'camping'],
                requiredStats: { health: 50, action: 50, mind: 0 },
                availableOn: ['tatooine', 'naboo', 'corellia', 'dantooine']
            },
            {
                name: 'Medic',
                icon: '⚕️',
                description: 'Healer and doctor',
                startingSkills: ['healing', 'medicine'],
                requiredStats: { health: 0, action: 0, mind: 100 },
                availableOn: ['tatooine', 'naboo', 'corellia']
            },
            {
                name: 'Entertainer',
                icon: '🎭',
                description: 'Musician and dancer',
                startingSkills: ['music', 'dance'],
                requiredStats: { health: 0, action: 50, mind: 50 },
                availableOn: ['tatooine', 'naboo', 'corellia']
            }
        ];
    }

    /**
     * Get default stats
     */
    getDefaultStats() {
        return {
            attributes: this.extractAttributeData(null),
            racialMods: this.extractRacialModData(null)
        };
    }

    /**
     * File reading helpers
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Generate summary report
     */
    generateReport() {
        return {
            summary: {
                characters: this.characters.size,
                effects: this.effects.size,
                professions: this.professions.length,
                attributes: Object.keys(this.stats.attributes).length,
                racialMods: Object.keys(this.stats.racialMods).length
            },
            characters: Array.from(this.characters.values()),
            effects: Array.from(this.effects.values()),
            professions: this.professions,
            stats: this.stats
        };
    }
}

export default BrowserAssetParser;
