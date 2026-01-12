#!/usr/bin/env node
/**
 * SWG Asset Parser - Node.js Edition
 * Automatically parses all SWG assets and generates JSON manifests
 * Much faster than manual web parsing!
 * 
 * Usage: node parse-assets-node.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SWG_PATH = 'C:\\Users\\david\\OneDrive\\Desktop\\SWGTERRAIN';

class SWGAssetParser {
    constructor(swgPath) {
        this.swgPath = swgPath;
        this.results = {
            characters: [],
            flying_mounts: [],
            effects: [],
            professions: [],
            stats: {}
        };
    }

    parseAll() {
        console.log('='.repeat(60));
        console.log('  SWG Asset Parser - Batch Processing');
        console.log('='.repeat(60));
        console.log(`Source: ${this.swgPath}\n`);

        this.parseCharacters();
        this.parseFlyingMounts();
        this.parseEffects();
        this.parseProfessions();
        this.parseStats();

        return this.results;
    }

    parseCharacters() {
        console.log('📦 Parsing characters...');
        const charPath = path.join(this.swgPath, 'object', 'creature', 'player');

        if (!fs.existsSync(charPath)) {
            console.log(`   ⚠️  Character path not found: ${charPath}`);
            return;
        }

        const files = fs.readdirSync(charPath).filter(f => f.endsWith('.iff'));
        
        for (const file of files) {
            try {
                const char = this.parseCharacterIff(file);
                this.results.characters.push(char);
            } catch (e) {
                console.log(`   ❌ Failed to parse ${file}: ${e.message}`);
            }
        }

        console.log(`   ✓ Parsed ${this.results.characters.length} characters\n`);
    }

    parseCharacterIff(fileName) {
        const name = fileName.replace('shared_', '').replace('.iff', '');
        const species = this.detectSpecies(name);
        const gender = name.includes('female') ? 'female' : 'male';

        return {
            name,
            fileName,
            species,
            gender,
            spawnLocations: this.getSpeciesSpawnLocations(species)
        };
    }

    parseFlyingMounts() {
        console.log('🚀 Parsing ships as flying mounts...');
        const shipPath = path.join(this.swgPath, 'object', 'ship');

        if (!fs.existsSync(shipPath)) {
            console.log(`   ⚠️  Ship path not found: ${shipPath}`);
            return;
        }

        const files = fs.readdirSync(shipPath).filter(f => f.startsWith('shared_') && f.endsWith('.iff'));

        for (const file of files) {
            try {
                const mount = this.parseMountIff(file);
                this.results.flying_mounts.push(mount);
            } catch (e) {
                console.log(`   ❌ Failed to parse ${file}: ${e.message}`);
            }
        }

        console.log(`   ✓ Parsed ${this.results.flying_mounts.length} flying mounts\n`);
    }

    parseMountIff(fileName) {
        const name = fileName.replace('shared_', '').replace('.iff', '');
        const tier = this.extractTier(name);
        const baseShip = name.replace(/_tier\d+/i, '');

        return {
            name,
            displayName: this.formatDisplayName(baseShip, tier),
            fileName,
            type: 'flying_mount',
            category: this.detectMountCategory(baseShip),
            tier,
            flightStats: {
                maxSpeed: this.calculateMountSpeed(baseShip, tier),
                acceleration: this.calculateAcceleration(baseShip),
                turnRate: this.calculateTurnRate(baseShip),
                maxAltitude: this.calculateMaxAltitude(baseShip),
                hoverHeight: this.calculateHoverHeight(baseShip)
            },
            mountStats: {
                mountTime: 2.0,
                dismountTime: 1.5,
                canFlyInCombat: false,
                passengerSeats: this.getPassengerCount(baseShip)
            },
            appearance: {
                scale: this.calculateMountScale(baseShip),
                hasTrails: true,
                engineGlow: true
            },
            availability: {
                requiresLicense: tier >= 3,
                minLevel: Math.max(1, (tier - 1) * 10),
                cost: this.calculateCost(baseShip, tier),
                planets: ['tatooine', 'naboo', 'corellia', 'dantooine', 'lok']
            }
        };
    }

    parseEffects() {
        console.log('✨ Parsing effects...');
        const effectPath = path.join(this.swgPath, 'effect');

        if (!fs.existsSync(effectPath)) {
            console.log(`   ⚠️  Effect path not found: ${effectPath}`);
            return;
        }

        const files = fs.readdirSync(effectPath).filter(f => f.endsWith('.eft'));

        for (const file of files) {
            try {
                const effect = this.parseEffectFile(file, path.join(effectPath, file));
                this.results.effects.push(effect);
            } catch (e) {
                console.log(`   ❌ Failed to parse ${file}: ${e.message}`);
            }
        }

        console.log(`   ✓ Parsed ${this.results.effects.length} effects\n`);
    }

    parseEffectFile(fileName, filePath) {
        const name = fileName.replace('.eft', '');
        let content = '';

        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            // Ignore read errors
        }

        return {
            name,
            fileName,
            type: 'effect',
            shaderType: this.detectShaderType(name),
            textures: this.extractTextureReferences(content),
            properties: {
                hasAlpha: name.includes('alpha'),
                hasBlend: name.includes('blend'),
                hasEmissive: name.includes('emis'),
                hasBump: name.includes('bump') || name.includes('cbmp'),
                hasSpecular: name.includes('spec')
            }
        };
    }

    parseProfessions() {
        console.log('🎯 Parsing professions...');

        this.results.professions = [
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

        console.log(`   ✓ Loaded ${this.results.professions.length} professions\n`);
    }

    parseStats() {
        console.log('📊 Parsing stats...');

        this.results.stats = {
            attributes: {
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
            },
            racialMods: {
                human: { health: 0, action: 0, mind: 0 },
                wookiee: { health: 100, action: 50, mind: -50, strength: 15 },
                twilek: { health: -50, action: 50, mind: 0, agility: 10 },
                zabrak: { health: 50, action: 0, mind: 0, stamina: 10 },
                ithorian: { health: 0, action: -50, mind: 100, willpower: 10 },
                sullustan: { health: -25, action: 25, mind: 25, agility: 8 }
            }
        };

        console.log('   ✓ Loaded stats and racial modifiers\n');
    }

    // Helper methods

    detectSpecies(name) {
        const lower = name.toLowerCase();
        if (lower.includes('human')) return 'human';
        if (lower.includes('wookiee')) return 'wookiee';
        if (lower.includes('twilek')) return 'twilek';
        if (lower.includes('zabrak')) return 'zabrak';
        if (lower.includes('ithorian')) return 'ithorian';
        if (lower.includes('sullustan')) return 'sullustan';
        if (lower.includes('trandoshan')) return 'trandoshan';
        if (lower.includes('bothan')) return 'bothan';
        if (lower.includes('rodian')) return 'rodian';
        return 'unknown';
    }

    getSpeciesSpawnLocations(species) {
        const spawnMap = {
            human: [
                { planet: 'tatooine', city: 'Bestine', x: -1290, y: 12, z: -3590 },
                { planet: 'naboo', city: 'Theed', x: -4856, y: 6, z: 4162 },
                { planet: 'corellia', city: 'Coronet', x: -137, y: 28, z: -4723 }
            ],
            wookiee: [{ planet: 'kashyyyk', city: 'Kachirho', x: 150, y: 15, z: 80 }],
            twilek: [{ planet: 'ryloth', city: "Kala'uun", x: -200, y: 10, z: 300 }],
            ithorian: [
                { planet: 'tatooine', city: 'Mos Eisley', x: 3528, y: 5, z: -4804 },
                { planet: 'naboo', city: 'Moenia', x: 4734, y: 4, z: -4677 }
            ],
            sullustan: [{ planet: 'corellia', city: 'Tyrena', x: -5045, y: 21, z: -2400 }]
        };
        return spawnMap[species] || spawnMap.human;
    }

    extractTier(name) {
        const match = name.match(/tier(\d+)/i);
        return match ? parseInt(match[1]) : 1;
    }

    detectMountCategory(shipName) {
        const fighters = ['xwing', 'tiefighter', 'awing', 'ywing', 'z95'];
        const speeders = ['flash_speeder', 'swoop'];
        const transports = ['transport', 'shuttle'];

        if (fighters.some(f => shipName.includes(f))) return 'fighter';
        if (speeders.some(s => shipName.includes(s))) return 'speeder';
        if (transports.some(t => shipName.includes(t))) return 'transport';
        return 'custom';
    }

    calculateMountSpeed(shipName, tier) {
        const baseSpeeds = {
            xwing: 25, tiefighter: 28, awing: 30,
            ywing: 20, z95: 22, flash_speeder: 18,
            swoop: 26, transport: 15
        };

        let speed = 20;
        for (const [ship, baseSpeed] of Object.entries(baseSpeeds)) {
            if (shipName.includes(ship)) {
                speed = baseSpeed;
                break;
            }
        }

        const tierMultiplier = 1 + ((tier - 1) * 0.05);
        return Math.round(speed * tierMultiplier);
    }

    calculateAcceleration(shipName) {
        if (shipName.includes('awing') || shipName.includes('tiefighter')) return 'high';
        if (shipName.includes('ywing') || shipName.includes('transport')) return 'low';
        return 'medium';
    }

    calculateTurnRate(shipName) {
        if (shipName.includes('tiefighter') || shipName.includes('awing')) return 'high';
        if (shipName.includes('ywing') || shipName.includes('z95')) return 'medium';
        if (shipName.includes('transport')) return 'low';
        return 'medium';
    }

    calculateMaxAltitude(shipName) {
        if (['xwing', 'tiefighter', 'awing', 'ywing'].some(s => shipName.includes(s))) return 200;
        if (shipName.includes('speeder') || shipName.includes('swoop')) return 50;
        return 100;
    }

    calculateHoverHeight(shipName) {
        return shipName.includes('speeder') ? 1.5 : 3.0;
    }

    getPassengerCount(shipName) {
        if (shipName.includes('transport') || shipName.includes('shuttle')) return 4;
        return 0;
    }

    calculateMountScale(shipName) {
        const scales = {
            tiefighter: 0.6, xwing: 0.7, awing: 0.7,
            ywing: 0.75, transport: 0.9, speeder: 0.5
        };
        for (const [ship, scale] of Object.entries(scales)) {
            if (shipName.includes(ship)) return scale;
        }
        return 0.7;
    }

    calculateCost(shipName, tier) {
        const baseCosts = {
            xwing: 15000, tiefighter: 12000, awing: 18000,
            ywing: 10000, transport: 25000
        };
        let baseCost = 5000;
        for (const [ship, cost] of Object.entries(baseCosts)) {
            if (shipName.includes(ship)) {
                baseCost = cost;
                break;
            }
        }
        return baseCost * tier;
    }

    formatDisplayName(baseName, tier) {
        const formatted = baseName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return tier > 1 ? `${formatted} Mk.${tier}` : formatted;
    }

    detectShaderType(name) {
        if (name.includes('particle')) return 'particle';
        if (name.includes('water')) return 'water';
        if (name.includes('terrain')) return 'terrain';
        if (name.includes('blend')) return 'blend';
        if (name.includes('alpha')) return 'alpha';
        if (name.includes('emis')) return 'emissive';
        return 'standard';
    }

    extractTextureReferences(content) {
        const textures = [];
        const patterns = [
            /["'](.*?\.(?:dds|tga))["']/gi,
            /texture\s*=\s*([^\s;]+)/gi
        ];
        for (const pattern of patterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                textures.push(match[1]);
            }
        }
        return [...new Set(textures)];
    }
}

// Main execution
const parser = new SWGAssetParser(SWG_PATH);
const results = parser.parseAll();

// Generate output filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const outputFile = `swg_assets_${timestamp}.json`;

// Save to JSON
fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

console.log('='.repeat(60));
console.log('  Summary');
console.log('='.repeat(60));
console.log(`Characters:     ${results.characters.length}`);
console.log(`Flying Mounts:  ${results.flying_mounts.length}`);
console.log(`Effects:        ${results.effects.length}`);
console.log(`Professions:    ${results.professions.length}`);
console.log(`Stats:          ${Object.keys(results.stats.attributes).length} attributes`);
console.log('='.repeat(60));
console.log(`\n✓ Saved to: ${outputFile}`);
console.log('\nYou can now import this JSON into your web client!');
