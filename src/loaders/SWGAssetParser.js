import { IFFLoader } from './IFFLoader.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SWGAssetParser - Comprehensive parser for SWG game assets
 * Parses:
 * - Characters (creature/player .iff files)
 * - Effects (.eft files)
 * - Professions (datatables/professions.iff)
 * - Stats (attribute_limits.iff, racial_mods.iff)
 * 
 * Used for identifying asset dependencies and planning replacement/conversion
 */
export class SWGAssetParser {
    constructor(swgTerrainPath = 'C:\\Users\\david\\OneDrive\\Desktop\\SWGTERRAIN') {
        this.swgPath = swgTerrainPath;
        this.iffLoader = new IFFLoader();
        
        // Asset inventories
        this.characters = new Map();
        this.effects = new Map();
        this.professions = new Map();
        this.stats = {
            attributes: {},
            racialMods: {},
            professionStats: {}
        };
        
        // Asset dependencies for replacement planning
        this.dependencies = {
            characterToEffect: new Map(),
            professionToSkills: new Map(),
            requiredAssets: new Set()
        };
    }

    /**
     * Parse all SWG assets and generate replacement manifest
     */
    async parseAllAssets() {
        console.log('Starting comprehensive SWG asset parsing...');
        
        const results = {
            characters: await this.parseCharacters(),
            effects: await this.parseEffects(),
            professions: await this.parseProfessions(),
            stats: await this.parseStats(),
            dependencies: this.analyzeDependencies()
        };
        
        return results;
    }

    /**
     * Parse character/creature .iff files
     * Location: object/creature/player/*.iff
     */
    async parseCharacters() {
        console.log('Parsing characters from object/creature/player/...');
        
        const characterPath = path.join(this.swgPath, 'object', 'creature', 'player');
        const characters = [];
        
        try {
            // In Node.js environment, use fs
            if (typeof window === 'undefined') {
                const files = this.walkDirectory(characterPath, '.iff');
                
                for (const filePath of files) {
                    const character = await this.parseCharacterFile(filePath);
                    if (character) {
                        characters.push(character);
                        this.characters.set(character.name, character);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing characters:', error);
        }
        
        console.log(`Parsed ${characters.length} characters`);
        return characters;
    }

    /**
     * Parse individual character .iff file
     */
    async parseCharacterFile(filePath) {
        try {
            // For browser environment, we'll use fetch
            if (typeof window !== 'undefined') {
                const data = await this.iffLoader.load(filePath);
                return this.extractCharacterData(data, filePath);
            }
            
            // For Node.js
            const buffer = fs.readFileSync(filePath);
            const data = this.iffLoader.parse(buffer);
            return this.extractCharacterData(data, filePath);
            
        } catch (error) {
            console.warn(`Failed to parse ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Extract character data from parsed IFF
     */
    extractCharacterData(iffData, filePath) {
        const fileName = path.basename(filePath, '.iff');
        const character = {
            name: fileName.replace('shared_', ''),
            filePath: filePath,
            type: 'character',
            attributes: {},
            appearance: null,
            animations: [],
            effects: [],
            equipmentSlots: []
        };

        // Look for appearance reference
        const appearanceChunk = this.iffLoader.findChunk('APPR');
        if (appearanceChunk && appearanceChunk.data) {
            character.appearance = appearanceChunk.data.toString('ascii').replace(/\0/g, '');
        }

        // Look for collision data
        const collisionChunk = this.iffLoader.findChunk('COLL');
        if (collisionChunk) {
            character.hasCollision = true;
        }

        // Look for equipment slots
        const slotChunk = this.iffLoader.findChunk('SLOT');
        if (slotChunk && slotChunk.data) {
            character.equipmentSlots = this.parseSlotData(slotChunk.data);
        }

        // Parse any embedded effect references
        character.effects = this.findEffectReferences(iffData);
        
        return character;
    }

    /**
     * Parse effect files (.eft)
     * Location: effect/*.eft
     */
    async parseEffects() {
        console.log('Parsing effects from effect/...');
        
        const effectPath = path.join(this.swgPath, 'effect');
        const effects = [];
        
        try {
            if (typeof window === 'undefined') {
                const files = this.walkDirectory(effectPath, '.eft');
                
                for (const filePath of files) {
                    const effect = await this.parseEffectFile(filePath);
                    if (effect) {
                        effects.push(effect);
                        this.effects.set(effect.name, effect);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing effects:', error);
        }
        
        console.log(`Parsed ${effects.length} effects`);
        return effects;
    }

    /**
     * Parse individual .eft file
     */
    async parseEffectFile(filePath) {
        try {
            const fileName = path.basename(filePath, '.eft');
            
            // .eft files are text-based shader/effect definitions
            const content = typeof window === 'undefined' 
                ? fs.readFileSync(filePath, 'utf8')
                : await fetch(filePath).then(r => r.text());
            
            const effect = {
                name: fileName,
                filePath: filePath,
                type: 'effect',
                shaderType: this.detectShaderType(fileName),
                textures: this.extractTextureReferences(content),
                hasAlpha: fileName.includes('alpha'),
                hasBlend: fileName.includes('blend'),
                hasEmissive: fileName.includes('emis'),
                hasBump: fileName.includes('bump') || fileName.includes('cbmp'),
                hasSpecular: fileName.includes('spec'),
                content: content
            };
            
            return effect;
            
        } catch (error) {
            console.warn(`Failed to parse effect ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Parse profession data
     * Location: datatables/knowledgebase/professions.iff
     */
    async parseProfessions() {
        console.log('Parsing professions...');
        
        const professionFile = path.join(this.swgPath, 'datatables', 'knowledgebase', 'professions.iff');
        
        try {
            const buffer = typeof window === 'undefined'
                ? fs.readFileSync(professionFile)
                : await fetch(professionFile).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
            
            const data = this.iffLoader.parse(buffer);
            const professions = this.extractProfessionData(data);
            
            console.log(`Parsed ${professions.length} professions`);
            return professions;
            
        } catch (error) {
            console.error('Error parsing professions:', error);
            return this.getDefaultProfessions();
        }
    }

    /**
     * Extract profession data from datatable
     */
    extractProfessionData(iffData) {
        const professions = [];
        
        // IFF datatables use DTII (DataTable) format
        const datatableChunk = this.iffLoader.findChunk('DTII');
        
        if (datatableChunk) {
            // Parse datatable structure
            // SWG datatables have rows and columns
            const parsed = this.parseDatatable(datatableChunk.data);
            
            for (const row of parsed.rows) {
                const profession = {
                    name: row.name || 'Unknown',
                    description: row.description || '',
                    startingSkills: row.starting_skills || [],
                    skillTree: row.skill_tree || '',
                    requiredStats: this.parseRequiredStats(row),
                    abilities: row.abilities || []
                };
                
                professions.push(profession);
                this.professions.set(profession.name, profession);
            }
        }
        
        return professions;
    }

    /**
     * Parse stats and attributes
     * Locations:
     * - datatables/creation/attribute_limits.iff
     * - datatables/creation/racial_mods.iff
     */
    async parseStats() {
        console.log('Parsing stats and attributes...');
        
        const stats = {
            attributes: await this.parseAttributeLimits(),
            racialMods: await this.parseRacialMods()
        };
        
        this.stats = stats;
        return stats;
    }

    async parseAttributeLimits() {
        const limitFile = path.join(this.swgPath, 'datatables', 'creation', 'attribute_limits.iff');
        
        try {
            const buffer = typeof window === 'undefined'
                ? fs.readFileSync(limitFile)
                : await fetch(limitFile).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
            
            const data = this.iffLoader.parse(buffer);
            const datatableChunk = this.iffLoader.findChunk('DTII');
            
            if (datatableChunk) {
                const parsed = this.parseDatatable(datatableChunk.data);
                
                return {
                    health: { min: 100, max: 1000 },
                    action: { min: 100, max: 1000 },
                    mind: { min: 100, max: 1000 },
                    strength: { min: 0, max: 100 },
                    constitution: { min: 0, max: 100 },
                    stamina: { min: 0, max: 100 },
                    agility: { min: 0, max: 100 },
                    luck: { min: 0, max: 100 },
                    precision: { min: 0, max: 100 },
                    willpower: { min: 0, max: 100 },
                    rows: parsed.rows
                };
            }
        } catch (error) {
            console.error('Error parsing attribute limits:', error);
        }
        
        return this.getDefaultAttributeLimits();
    }

    async parseRacialMods() {
        const racialFile = path.join(this.swgPath, 'datatables', 'creation', 'racial_mods.iff');
        
        try {
            const buffer = typeof window === 'undefined'
                ? fs.readFileSync(racialFile)
                : await fetch(racialFile).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
            
            const data = this.iffLoader.parse(buffer);
            const datatableChunk = this.iffLoader.findChunk('DTII');
            
            if (datatableChunk) {
                const parsed = this.parseDatatable(datatableChunk.data);
                const racialMods = {};
                
                for (const row of parsed.rows) {
                    racialMods[row.species] = {
                        health: row.health_mod || 0,
                        action: row.action_mod || 0,
                        mind: row.mind_mod || 0,
                        strength: row.strength_mod || 0,
                        constitution: row.constitution_mod || 0,
                        stamina: row.stamina_mod || 0,
                        agility: row.agility_mod || 0
                    };
                }
                
                return racialMods;
            }
        } catch (error) {
            console.error('Error parsing racial mods:', error);
        }
        
        return this.getDefaultRacialMods();
    }

    /**
     * Parse IFF datatable format (DTII)
     */
    parseDatatable(data) {
        if (!data || data.length < 8) {
            return { columns: [], rows: [] };
        }
        
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        let offset = 0;
        
        // Read number of columns
        const numColumns = view.getInt32(offset, false); // big-endian
        offset += 4;
        
        // Read number of rows
        const numRows = view.getInt32(offset, false);
        offset += 4;
        
        const columns = [];
        const rows = [];
        
        // Parse column definitions
        for (let i = 0; i < numColumns; i++) {
            // Column name (null-terminated string)
            const nameStart = offset;
            while (data[offset] !== 0 && offset < data.length) offset++;
            const columnName = data.slice(nameStart, offset).toString('ascii');
            offset++; // skip null terminator
            
            // Column type (4 bytes)
            const columnType = String.fromCharCode(
                data[offset], data[offset+1], data[offset+2], data[offset+3]
            );
            offset += 4;
            
            columns.push({ name: columnName, type: columnType });
        }
        
        // Parse rows
        for (let i = 0; i < numRows; i++) {
            const row = {};
            
            for (const column of columns) {
                // Parse value based on type
                switch (column.type) {
                    case 'i   ': // integer
                        row[column.name] = view.getInt32(offset, false);
                        offset += 4;
                        break;
                    case 'f   ': // float
                        row[column.name] = view.getFloat32(offset, false);
                        offset += 4;
                        break;
                    case 's   ': // string
                        const strStart = offset;
                        while (data[offset] !== 0 && offset < data.length) offset++;
                        row[column.name] = data.slice(strStart, offset).toString('ascii');
                        offset++;
                        break;
                    default:
                        // Unknown type, skip
                        offset += 4;
                }
            }
            
            rows.push(row);
        }
        
        return { columns, rows };
    }

    /**
     * Analyze dependencies between assets
     */
    analyzeDependencies() {
        console.log('Analyzing asset dependencies...');
        
        const dependencies = {
            summary: {
                totalCharacters: this.characters.size,
                totalEffects: this.effects.size,
                totalProfessions: this.professions.size,
                totalTextures: 0,
                totalModels: 0
            },
            characterEffects: {},
            professionRequirements: {},
            missingAssets: []
        };
        
        // Map characters to their required effects
        for (const [charName, character] of this.characters) {
            dependencies.characterEffects[charName] = character.effects;
            
            // Track required assets
            if (character.appearance) {
                this.dependencies.requiredAssets.add(character.appearance);
            }
        }
        
        // Map professions to their requirements
        for (const [profName, profession] of this.professions) {
            dependencies.professionRequirements[profName] = {
                skills: profession.startingSkills,
                stats: profession.requiredStats
            };
        }
        
        return dependencies;
    }

    /**
     * Generate asset replacement manifest
     * This creates a plan for converting SWG assets to web-compatible formats
     */
    generateReplacementManifest() {
        const manifest = {
            timestamp: new Date().toISOString(),
            source: this.swgPath,
            
            characters: Array.from(this.characters.values()).map(char => ({
                original: char.filePath,
                name: char.name,
                replacement: {
                    model: `models/characters/${char.name}.gltf`,
                    textures: char.appearance ? [`textures/${char.appearance}.png`] : [],
                    animations: char.animations.map(a => `animations/${char.name}/${a}.json`)
                },
                requiredEffects: char.effects
            })),
            
            effects: Array.from(this.effects.values()).map(effect => ({
                original: effect.filePath,
                name: effect.name,
                replacement: {
                    shader: `shaders/${effect.shaderType}.glsl`,
                    textures: effect.textures.map(t => `textures/${t}.png`)
                },
                properties: {
                    hasAlpha: effect.hasAlpha,
                    hasBlend: effect.hasBlend,
                    hasEmissive: effect.hasEmissive,
                    hasBump: effect.hasBump,
                    hasSpecular: effect.hasSpecular
                }
            })),
            
            professions: Array.from(this.professions.values()).map(prof => ({
                name: prof.name,
                description: prof.description,
                skills: prof.startingSkills,
                requiredStats: prof.requiredStats
            })),
            
            stats: this.stats
        };
        
        return manifest;
    }

    // Utility functions

    walkDirectory(dir, extension) {
        const files = [];
        
        const walk = (currentPath) => {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                
                if (entry.isDirectory()) {
                    walk(fullPath);
                } else if (entry.name.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        };
        
        if (fs.existsSync(dir)) {
            walk(dir);
        }
        
        return files;
    }

    detectShaderType(effectName) {
        if (effectName.includes('particle')) return 'particle';
        if (effectName.includes('water')) return 'water';
        if (effectName.includes('blend')) return 'blend';
        if (effectName.includes('alpha')) return 'alpha';
        if (effectName.includes('emis')) return 'emissive';
        return 'standard';
    }

    extractTextureReferences(content) {
        const textures = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.includes('texture') || line.includes('.dds') || line.includes('.tga')) {
                const match = line.match(/["\']([^"\']+\.(dds|tga))["\']/) || 
                             line.match(/texture\s*=\s*([^\s;]+)/);
                if (match) {
                    textures.push(match[1]);
                }
            }
        }
        
        return textures;
    }

    findEffectReferences(iffData) {
        const effects = [];
        
        // Look for effect chunk references in IFF data
        for (const chunk of iffData.chunks) {
            if (chunk.type === 'EFCT' && chunk.data) {
                const effectName = chunk.data.toString('ascii').replace(/\0/g, '');
                if (effectName) effects.push(effectName);
            }
        }
        
        return effects;
    }

    parseSlotData(data) {
        const slots = [];
        // Parse equipment slot definitions
        // This is simplified - actual format varies
        return slots;
    }

    parseRequiredStats(row) {
        return {
            health: row.req_health || 0,
            action: row.req_action || 0,
            mind: row.req_mind || 0
        };
    }

    getDefaultProfessions() {
        return [
            { name: 'Brawler', startingSkills: ['unarmed_combat'], requiredStats: { health: 100 } },
            { name: 'Marksman', startingSkills: ['ranged_combat'], requiredStats: { action: 100 } },
            { name: 'Artisan', startingSkills: ['crafting'], requiredStats: { mind: 100 } },
            { name: 'Scout', startingSkills: ['exploration'], requiredStats: { action: 100 } },
            { name: 'Medic', startingSkills: ['healing'], requiredStats: { mind: 100 } },
            { name: 'Entertainer', startingSkills: ['music', 'dance'], requiredStats: { mind: 100 } }
        ];
    }

    getDefaultAttributeLimits() {
        return {
            health: { min: 100, max: 1000 },
            action: { min: 100, max: 1000 },
            mind: { min: 100, max: 1000 },
            strength: { min: 0, max: 100 },
            constitution: { min: 0, max: 100 },
            stamina: { min: 0, max: 100 }
        };
    }

    getDefaultRacialMods() {
        return {
            human: { health: 0, action: 0, mind: 0 },
            wookiee: { health: 100, action: 50, strength: 15 },
            twilek: { health: -50, action: 50, agility: 10 },
            zabrak: { health: 50, action: 0, stamina: 10 }
        };
    }
}

export default SWGAssetParser;
