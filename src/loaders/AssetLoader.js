import * as THREE from 'three';

/**
 * AssetLoader - Loads original SWG game assets
 * Supports:
 * - .trn (terrain heightmaps)
 * - .iff (models and textures)
 * - .tre (resource archives)
 * - .ws (world snapshots)
 */
export class AssetLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadedAssets = new Map();
        
        // Paths to SWG game files (configure these based on your setup)
        this.assetPaths = {
            terrain: '/assets/terrain',
            textures: '/assets/textures',
            models: '/assets/models',
            tre: '/assets/tre'
        };
    }
    
    /**
     * Load terrain data for a planet
     * SWG stores terrain in .trn files with heightmaps and layer maps
     */
    async loadTerrain(planetName) {
        console.log(`Loading terrain for ${planetName}...`);
        
        try {
            // 1) Preferred: load pre-extracted heightmap PNG exported via SIE/SWB
            const pngPath = `/planets/${planetName}/heightmap.png`;
            const pngResp = await fetch(pngPath);
            if (pngResp.ok) {
                const blob = await pngResp.blob();
                const terrain = await this.parseHeightmapPNG(blob, planetName);
                if (terrain) return terrain;
            }

            // 2) Try to load actual .trn file if available
            const terrainFile = `${this.assetPaths.terrain}/${planetName}.trn`;
            const response = await fetch(terrainFile);
            
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                return this.parseTRNFile(buffer, planetName);
            }
        } catch (error) {
            console.warn('Could not load .trn file, using procedural terrain:', error);
        }
        
        // Fallback: Generate procedural terrain based on known coordinates
        return this.generateProceduralTerrain(planetName);
    }
    
    /**
     * Parse SWG .trn terrain file format
     * Format: Binary file with heightmap data, texture layers, shader info
     */
    parseTRNFile(buffer, planetName) {
        const view = new DataView(buffer);
        
        // SWG .trn file structure (simplified)
        // Header: FORM identifier (4 bytes)
        const formId = String.fromCharCode(
            view.getUint8(0),
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3)
        );
        
        if (formId !== 'FORM') {
            throw new Error('Invalid .trn file format');
        }
        
        // Parse terrain chunks
        // This is a simplified parser - real SWG files are more complex
        return {
            type: 'parsed',
            planet: planetName,
            heightmap: this.extractHeightmap(view),
            textureLayers: this.extractTextureLayers(view),
            size: 16000 // SWG planets are 16km x 16km
        };
    }
    
    async parseHeightmapPNG(blob, planetName) {
        const img = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        const heightmap = new Float32Array(img.width * img.height);
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const i = (y * img.width + x) * 4;
                // Assume grayscale PNG; use red channel
                const v = data[i];
                // Map 0-255 to height range (-50..+150 meters as placeholder)
                heightmap[y * img.width + x] = (v / 255) * 200 - 50;
            }
        }

        return {
            type: 'heightmap_png',
            planet: planetName,
            heightmap: { width: img.width, height: img.height, data: heightmap },
            size: 16000
        };
    }

    extractHeightmap(view) {
        // SWG stores heightmaps as 16-bit integers
        // This is simplified - actual parsing requires chunk traversal
        const size = 512; // Typical heightmap resolution
        const heightmap = new Float32Array(size * size);
        
        // Read heightmap data from file
        // (In real implementation, find HGHT chunk and parse)
        
        return {
            width: size,
            height: size,
            data: heightmap
        };
    }
    
    extractTextureLayers(view) {
        // SWG uses multiple texture layers (grass, rock, water, etc.)
        // Parse LYRS chunk to get texture blend information
        return [
            { name: 'grass', blend: 0.6 },
            { name: 'dirt', blend: 0.3 },
            { name: 'rock', blend: 0.1 }
        ];
    }
    
    /**
     * Generate procedural terrain when .trn files aren't available
     * Uses known spawn locations and biome data
     */
    generateProceduralTerrain(planetName) {
        const biomes = {
            tutorial: {
                baseColor: 0x5d8a3a,
                waterColor: 0x4a90e2,
                grass: true,
                rolling: false,
                flat: true
            },
            naboo: {
                baseColor: 0x4a7c59,
                waterColor: 0x4a90e2,
                grass: true,
                rolling: true
            },
            tatooine: {
                baseColor: 0xdaa520,
                waterColor: null,
                grass: false,
                flat: true
            },
            corellia: {
                baseColor: 0x5d8a3a,
                waterColor: 0x2e5c8a,
                grass: true,
                rolling: true
            }
        };
        
        const biome = biomes[planetName] || biomes.naboo;
        
        // Generate heightmap using Perlin noise
        const size = 512;
        const heightmap = new Float32Array(size * size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                
                // Multi-octave noise for realistic terrain
                let height = 0;
                height += this.noise2D(x * 0.01, y * 0.01) * 50; // Large features
                height += this.noise2D(x * 0.05, y * 0.05) * 10; // Medium features
                height += this.noise2D(x * 0.1, y * 0.1) * 2;    // Small details
                
                heightmap[idx] = height;
            }
        }
        
        return {
            type: 'procedural',
            planet: planetName,
            biome: biome,
            heightmap: {
                width: size,
                height: size,
                data: heightmap
            },
            size: 16000
        };
    }
    
    /**
     * Simple 2D noise function (use a proper noise library in production)
     */
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }
    
    /**
     * Load SWG game assets (.iff models, .tre archives)
     */
    async loadGameAssets() {
        console.log('Loading game assets...');
        
        // Load common assets
        await Promise.all([
            this.loadTextures(),
            this.loadModels(),
            this.loadTREArchives()
        ]);
    }
    
    async loadTextures() {
        // Common SWG textures
        const textures = [
            'grass_default',
            'dirt_default',
            'rock_default',
            'water_default'
        ];
        
        for (const texName of textures) {
            try {
                // Try loading converted textures (you'll need to extract from .tre files)
                const texture = await this.textureLoader.loadAsync(
                    `${this.assetPaths.textures}/${texName}.png`
                );
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.loadedAssets.set(texName, texture);
            } catch (error) {
                // Fallback to solid colors
                console.warn(`Texture ${texName} not found, using fallback`);
                this.loadedAssets.set(texName, this.createFallbackTexture());
            }
        }
    }
    
    createFallbackTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create a simple pattern
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#3d6a4a';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(
                Math.random() * 256,
                Math.random() * 256,
                20, 20
            );
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    async loadModels() {
        // SWG models are in .iff format
        // You'll need to extract and convert them to .gltf or .obj
        console.log('Models: Using placeholder meshes (extract .iff files for real models)');
    }
    
    async loadTREArchives() {
        // .tre files are SWG's archive format (like .zip)
        // Contains textures, models, sounds, etc.
        // You'll need a TRE extractor tool to unpack these
        console.log('TRE archives: Use TRE Viewer to extract assets from game files');
    }
    
    /**
     * Get a loaded asset
     */
    getAsset(name) {
        return this.loadedAssets.get(name);
    }
}
