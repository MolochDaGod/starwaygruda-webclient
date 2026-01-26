export class EnhancedAssetLoader {
    constructor() {
        this.loadedAssets = new Map();
        this.fallbackAssets = new Map();
        this.assetManifest = {
            textures: {
                // Terrain textures
                'heightmap.png': { width: 512, height: 512, type: 'heightmap' },
                'terrain_texture.jpg': { width: 1024, height: 1024, type: 'terrain' },
                'grass.jpg': { width: 512, height: 512, type: 'material' },
                'rock.jpg': { width: 512, height: 512, type: 'material' },
                'sand.jpg': { width: 512, height: 512, type: 'material' },
                'dirt.jpg': { width: 512, height: 512, type: 'material' },
                'lava.jpg': { width: 512, height: 512, type: 'material' },
                // Character textures
                'character.jpg': { width: 256, height: 256, type: 'character' },
                'placeholder.jpg': { width: 64, height: 64, type: 'placeholder' }
            },
            models: {
                'character.glb': { type: 'character' },
                'terrain.glb': { type: 'terrain' },
                'structures.glb': { type: 'buildings' }
            },
            planets: {
                'corellia': { heightmap: 'corellia_heightmap.png', texture: 'corellia_texture.jpg' },
                'dathomir': { heightmap: 'dathomir_heightmap.png', texture: 'dathomir_texture.jpg' },
                'naboo': { heightmap: 'naboo_heightmap.png', texture: 'naboo_texture.jpg' },
                'rori': { heightmap: 'rori_heightmap.png', texture: 'rori_texture.jpg' },
                'tatooine': { heightmap: 'tatooine_heightmap.png', texture: 'tatooine_texture.jpg' },
                'yavin4': { heightmap: 'yavin4_heightmap.png', texture: 'yavin4_texture.jpg' },
                'tutorial': { heightmap: 'tutorial_heightmap.png', texture: 'tutorial_texture.jpg' }
            }
        };
        
        this.generateFallbackAssets();
    }
    
    generateFallbackAssets() {
        // Create procedural fallback assets
        this.fallbackAssets.set('heightmap', this.createHeightmapCanvas(512, 512));
        this.fallbackAssets.set('terrain', this.createTerrainCanvas(1024, 1024));
        this.fallbackAssets.set('material', this.createMaterialCanvas(512, 512));
        this.fallbackAssets.set('character', this.createCharacterCanvas(256, 256));
        this.fallbackAssets.set('placeholder', this.createPlaceholderCanvas(64, 64));
    }
    
    createHeightmapCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Generate procedural heightmap using noise
        const imageData = ctx.createImageData(width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);
            
            // Simple noise function for terrain
            const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 0.5 + 0.5;
            const height = Math.floor(noise * 255);
            
            imageData.data[i] = height;     // R
            imageData.data[i + 1] = height; // G
            imageData.data[i + 2] = height; // B
            imageData.data[i + 3] = 255;    // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }
    
    createTerrainCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient terrain texture
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#8B4513'); // Brown
        gradient.addColorStop(0.5, '#DAA520'); // Goldenrod
        gradient.addColorStop(1, '#F4A460'); // Sandy brown
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add some texture noise
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3 + 1;
            ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 80 + 50}, ${Math.random() * 50}, 0.3)`;
            ctx.fillRect(x, y, size, size);
        }
        
        return canvas.toDataURL();
    }
    
    createMaterialCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create a tiled material pattern
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, width, height);
        
        // Add checkerboard pattern
        ctx.fillStyle = '#A0522D';
        const tileSize = 32;
        for (let x = 0; x < width; x += tileSize * 2) {
            for (let y = 0; y < height; y += tileSize * 2) {
                ctx.fillRect(x, y, tileSize, tileSize);
                ctx.fillRect(x + tileSize, y + tileSize, tileSize, tileSize);
            }
        }
        
        return canvas.toDataURL();
    }
    
    createCharacterCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create a simple character texture
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(0, 0, width, height);
        
        // Add some details
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(width * 0.3, height * 0.1, width * 0.4, height * 0.3); // Head
        ctx.fillRect(width * 0.2, height * 0.4, width * 0.6, height * 0.4); // Body
        ctx.fillRect(width * 0.1, height * 0.6, width * 0.3, height * 0.3); // Arm
        ctx.fillRect(width * 0.6, height * 0.6, width * 0.3, height * 0.3); // Arm
        
        return canvas.toDataURL();
    }
    
    createPlaceholderCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create a simple placeholder
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', width / 2, height / 2);
        
        return canvas.toDataURL();
    }
    
    async loadAsset(path, type = 'texture') {
        if (this.loadedAssets.has(path)) {
            return this.loadedAssets.get(path);
        }
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Asset not found: ${path}`);
            }
            
            if (type === 'texture') {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                this.loadedAssets.set(path, url);
                return url;
            } else if (type === 'json') {
                const data = await response.json();
                this.loadedAssets.set(path, data);
                return data;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to load asset: ${path}, using fallback`);
            
            // Use fallback based on file type
            const filename = path.split('/').pop().toLowerCase();
            let fallbackType = 'placeholder';
            
            if (filename.includes('heightmap')) fallbackType = 'heightmap';
            else if (filename.includes('terrain')) fallbackType = 'terrain';
            else if (filename.includes('character')) fallbackType = 'character';
            else if (filename.includes('grass') || filename.includes('rock') || 
                     filename.includes('sand') || filename.includes('dirt')) fallbackType = 'material';
            
            const fallback = this.fallbackAssets.get(fallbackType);
            this.loadedAssets.set(path, fallback);
            return fallback;
        }
    }
    
    async loadTerrain(planet = 'tatooine') {
        console.log(`🏔️ Loading terrain for planet: ${planet}`);
        
        const planetConfig = this.assetManifest.planets[planet] || this.assetManifest.planets['tatooine'];
        
        const terrainData = {
            heightmap: await this.loadAsset(`/public/planets/${planet}/${planetConfig.heightmap}`),
            texture: await this.loadAsset(`/public/planets/${planet}/${planetConfig.texture}`),
            grass: await this.loadAsset(`/public/textures/materials/grass.jpg`),
            rock: await this.loadAsset(`/public/textures/materials/rock.jpg`),
            sand: await this.loadAsset(`/public/textures/materials/sand.jpg`),
            dirt: await this.loadAsset(`/public/textures/materials/dirt.jpg`)
        };
        
        console.log('✅ Terrain data loaded successfully');
        return terrainData;
    }
    
    async loadModel(path) {
        return await this.loadAsset(path, 'model');
    }
    
    async loadJSON(path) {
        return await this.loadAsset(path, 'json');
    }
    
    getAssetInfo(filename) {
        return this.assetManifest.textures[filename] || 
               this.assetManifest.models[filename] || 
               { type: 'unknown' };
    }
}