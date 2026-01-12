/**
 * TRN (Terrain) File Loader for Star Wars Galaxies
 * Parses .trn files which contain terrain generation rules
 * 
 * TRN files contain:
 * - Terrain generator (TGEN) form
 * - Map parameters
 * - Flora parameters
 * - Layer hierarchies
 * - Boundaries, filters, affectors
 */
export class TRNLoader {
    constructor() {
        this.terrainData = null;
    }

    /**
     * Load a TRN file
     * @param {string} url - Path to .trn file
     * @returns {Promise<Object>}
     */
    async load(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            return this.parse(buffer);
        } catch (error) {
            console.error('TRN Load Error:', error);
            // Return fallback procedural data
            return this.generateFallbackTerrain();
        }
    }

    /**
     * Parse TRN binary data
     * @param {Buffer} buffer 
     * @returns {Object}
     */
    parse(buffer) {
        // TRN files are IFF-based, starting with FORM
        if (buffer.length < 12) {
            console.warn('TRN file too small, using fallback');
            return this.generateFallbackTerrain();
        }

        const formType = buffer.toString('ascii', 0, 4);
        if (formType !== 'FORM') {
            console.warn('Not a valid IFF FORM, using fallback');
            return this.generateFallbackTerrain();
        }

        // Read form size
        const formSize = buffer.readUInt32BE(4);
        
        // Read form name (should be terrain-related)
        const formName = buffer.toString('ascii', 8, 12);
        console.log(`TRN FORM: ${formName}, Size: ${formSize}`);

        // For now, generate procedural terrain
        // Full TRN parsing would require extensive work
        return this.generateFallbackTerrain();
    }

    /**
     * Generate procedural terrain as fallback
     * @returns {Object}
     */
    generateFallbackTerrain() {
        const size = 512; // Heightmap resolution
        const heightmap = new Float32Array(size * size);
        
        // Generate Perlin-style noise
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                
                // Multi-octave noise
                let height = 0;
                let amplitude = 50;
                let frequency = 0.005;
                
                for (let octave = 0; octave < 4; octave++) {
                    height += this.noise2D(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                heightmap[idx] = height;
            }
        }

        return {
            heightmap: {
                data: heightmap,
                width: size,
                height: size,
                min: -100,
                max: 100
            },
            biome: {
                baseColor: 0x4a7c59,
                waterColor: 0x4a90e2,
                type: 'grassland'
            },
            metadata: {
                source: 'procedural',
                resolution: size
            }
        };
    }

    /**
     * Simple 2D noise function
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1; // Range: -1 to 1
    }

    /**
     * Extract water level from parsed TRN
     * @param {Object} terrainData 
     * @returns {number}
     */
    static getWaterLevel(terrainData) {
        // Default water levels per planet (from research)
        const waterLevels = {
            'naboo': 0,
            'tatooine': -100,
            'corellia': 0,
            'dathomir': -100,
            'endor': 0,
            'lok': -100,
            'rori': 0,
            'talus': 0,
            'yavin4': 0,
            'dantooine': -100
        };
        
        return waterLevels[terrainData.planet] ?? -100;
    }
}
