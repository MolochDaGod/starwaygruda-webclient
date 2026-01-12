import { IFFLoader } from './IFFLoader.js';

/**
 * FlyingMountParser - Parse space ships as flying mounts for planetary travel
 * 
 * Converts space ships into rideable flying vehicles that can be used on planets
 * Features:
 * - Flight speed and maneuverability
 * - Altitude limits for planetary flight
 * - Mount/dismount mechanics
 * - Visual appearance and scale
 */
export class FlyingMountParser {
    constructor() {
        this.iffLoader = new IFFLoader();
        this.mounts = new Map();
        
        // Mount categories based on ship type
        this.mountTypes = {
            fighter: ['xwing', 'tiefighter', 'awing', 'ywing', 'z95'],
            speeder: ['flash_speeder', 'swoop'],
            transport: ['transport', 'shuttle'],
            custom: []
        };
    }

    /**
     * Parse ship .iff files as flying mounts
     */
    async parseMounts(files) {
        console.log('Parsing ships as flying mounts...');
        const mounts = [];
        
        for (const file of files) {
            try {
                const buffer = await this.readFile(file);
                const iffData = this.iffLoader.parse(Buffer.from(buffer));
                
                const mount = this.extractMountData(iffData, file.name);
                if (mount) {
                    mounts.push(mount);
                    this.mounts.set(mount.name, mount);
                }
            } catch (error) {
                console.error(`Failed to parse ${file.name}:`, error);
            }
        }
        
        console.log(`✓ Parsed ${mounts.length} flying mounts`);
        return mounts;
    }

    /**
     * Extract mount data from ship IFF
     */
    extractMountData(iffData, fileName) {
        const name = fileName.replace('shared_', '').replace('.iff', '');
        const tier = this.extractTier(name);
        const baseShip = this.getBaseShipName(name);
        
        const mount = {
            name: name,
            displayName: this.formatDisplayName(baseShip, tier),
            fileName: fileName,
            type: 'flying_mount',
            category: this.detectMountCategory(baseShip),
            tier: tier,
            
            // Flight characteristics (scaled for planetary use)
            flightStats: {
                maxSpeed: this.calculateMountSpeed(baseShip, tier),
                acceleration: this.calculateAcceleration(baseShip),
                turnRate: this.calculateTurnRate(baseShip),
                maxAltitude: this.calculateMaxAltitude(baseShip),
                hoverHeight: this.calculateHoverHeight(baseShip)
            },
            
            // Mount mechanics
            mountStats: {
                mountTime: 2.0, // seconds to mount
                dismountTime: 1.5,
                canFlyInCombat: false,
                canUseAbilities: false,
                passengerSeats: this.getPassengerCount(baseShip)
            },
            
            // Visual properties
            appearance: {
                scale: this.calculateMountScale(baseShip),
                hasTrails: true,
                engineGlow: true,
                castsShadow: true
            },
            
            // Availability
            availability: {
                requiresLicense: tier >= 3,
                minLevel: this.calculateMinLevel(tier),
                cost: this.calculateCost(baseShip, tier),
                planets: ['tatooine', 'naboo', 'corellia', 'dantooine', 'lok']
            }
        };
        
        return mount;
    }

    /**
     * Extract tier from ship name (tier1, tier2, etc.)
     */
    extractTier(name) {
        const match = name.match(/tier(\d+)/i);
        return match ? parseInt(match[1]) : 1;
    }

    /**
     * Get base ship name without tier
     */
    getBaseShipName(name) {
        return name.replace(/_tier\d+/i, '');
    }

    /**
     * Detect mount category
     */
    detectMountCategory(shipName) {
        for (const [category, ships] of Object.entries(this.mountTypes)) {
            if (ships.some(s => shipName.includes(s))) {
                return category;
            }
        }
        return 'custom';
    }

    /**
     * Calculate mount speed based on ship type and tier
     * Space speeds are VERY fast, so we scale them down for planetary use
     */
    calculateMountSpeed(shipName, tier) {
        const baseSpeed = {
            xwing: 25,      // Fast fighter
            tiefighter: 28, // Very fast
            awing: 30,      // Fastest fighter
            ywing: 20,      // Slower bomber
            z95: 22,        // Balanced fighter
            flash_speeder: 18, // Ground speeder converted to flying
            swoop: 26,      // Fast racing speeder
            transport: 15   // Slow transport
        };
        
        // Find matching ship type
        let speed = 20; // default
        for (const [ship, baseSpd] of Object.entries(baseSpeed)) {
            if (shipName.includes(ship)) {
                speed = baseSpd;
                break;
            }
        }
        
        // Apply tier multiplier (5% increase per tier)
        const tierMultiplier = 1 + ((tier - 1) * 0.05);
        return Math.round(speed * tierMultiplier);
    }

    /**
     * Calculate acceleration
     */
    calculateAcceleration(shipName) {
        if (shipName.includes('awing') || shipName.includes('tiefighter')) {
            return 'high';
        } else if (shipName.includes('ywing') || shipName.includes('transport')) {
            return 'low';
        }
        return 'medium';
    }

    /**
     * Calculate turn rate
     */
    calculateTurnRate(shipName) {
        if (shipName.includes('tiefighter') || shipName.includes('awing')) {
            return 'high'; // Very maneuverable
        } else if (shipName.includes('ywing') || shipName.includes('z95')) {
            return 'medium';
        } else if (shipName.includes('transport')) {
            return 'low';
        }
        return 'medium';
    }

    /**
     * Calculate max altitude for planetary flight
     */
    calculateMaxAltitude(shipName) {
        // Fighters can fly higher than speeders
        if (shipName.includes('xwing') || shipName.includes('tiefighter') || 
            shipName.includes('awing') || shipName.includes('ywing')) {
            return 200; // 200 meters max altitude
        } else if (shipName.includes('speeder') || shipName.includes('swoop')) {
            return 50; // Low altitude speeders
        }
        return 100; // default
    }

    /**
     * Calculate hover height when idle
     */
    calculateHoverHeight(shipName) {
        if (shipName.includes('speeder')) {
            return 1.5; // Low hover
        }
        return 3; // Default hover height
    }

    /**
     * Get passenger seat count
     */
    getPassengerCount(shipName) {
        if (shipName.includes('transport') || shipName.includes('shuttle')) {
            return 4; // Multi-passenger
        } else if (shipName.includes('xwing') || shipName.includes('ywing')) {
            return 0; // Single seat + astromech (not counted)
        }
        return 0; // Single pilot only
    }

    /**
     * Calculate visual scale for mount (ships are too big, scale them down)
     */
    calculateMountScale(shipName) {
        if (shipName.includes('tiefighter')) {
            return 0.6; // TIE fighters are compact
        } else if (shipName.includes('xwing') || shipName.includes('awing')) {
            return 0.7;
        } else if (shipName.includes('ywing')) {
            return 0.75; // Y-wings are chunkier
        } else if (shipName.includes('transport')) {
            return 0.9; // Transports stay bigger
        } else if (shipName.includes('speeder')) {
            return 0.5; // Speeders are small
        }
        return 0.7; // default scale
    }

    /**
     * Calculate minimum level required
     */
    calculateMinLevel(tier) {
        return Math.max(1, (tier - 1) * 10); // tier 1 = lvl 1, tier 2 = lvl 10, etc.
    }

    /**
     * Calculate cost
     */
    calculateCost(shipName, tier) {
        let baseCost = 5000;
        
        // More expensive ships
        if (shipName.includes('xwing')) baseCost = 15000;
        if (shipName.includes('tiefighter')) baseCost = 12000;
        if (shipName.includes('awing')) baseCost = 18000;
        if (shipName.includes('ywing')) baseCost = 10000;
        if (shipName.includes('transport')) baseCost = 25000;
        
        // Tier multiplier
        return baseCost * tier;
    }

    /**
     * Format display name
     */
    formatDisplayName(baseName, tier) {
        // Convert snake_case to Title Case
        const formatted = baseName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return tier > 1 ? `${formatted} Mk.${tier}` : formatted;
    }

    /**
     * Generate mount manifest
     */
    generateMountManifest() {
        const manifest = {
            timestamp: new Date().toISOString(),
            totalMounts: this.mounts.size,
            categories: {},
            mounts: Array.from(this.mounts.values())
        };
        
        // Group by category
        for (const mount of manifest.mounts) {
            if (!manifest.categories[mount.category]) {
                manifest.categories[mount.category] = [];
            }
            manifest.categories[mount.category].push(mount.name);
        }
        
        return manifest;
    }

    /**
     * File reading helper
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Get mount by name
     */
    getMount(name) {
        return this.mounts.get(name);
    }

    /**
     * Get mounts by category
     */
    getMountsByCategory(category) {
        return Array.from(this.mounts.values()).filter(m => m.category === category);
    }

    /**
     * Get mounts by tier
     */
    getMountsByTier(tier) {
        return Array.from(this.mounts.values()).filter(m => m.tier === tier);
    }
}

export default FlyingMountParser;
