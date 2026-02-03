import * as THREE from 'three';

/**
 * Advanced Planet Generator
 * Creates unique, realistic planets with:
 * - Procedural terrain textures
 * - Height maps for elevation
 * - Water layers with wave animations
 * - Atmospheric effects
 * - Planet-specific biomes (desert, swamp, ocean, etc.)
 */
export class PlanetGenerator {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.planets = new Map();
        
        console.log('🪐 Advanced Planet Generator initialized');
    }

    /**
     * Generate a unique planet with realistic features
     */
    generatePlanet(config) {
        const {
            name,
            position,
            radius = 100,
            type = 'desert', // desert, ocean, swamp, ice, lava, forest
            hasWater = false,
            waterLevel = 0.3,
            roughness = 0.8,
            seed = Math.random() * 1000
        } = config;

        console.log(`🌍 Generating ${type} planet: ${name}`);

        // Create planet group to hold all meshes
        const planetGroup = new THREE.Group();
        planetGroup.name = name;
        planetGroup.position.set(...position);

        // Generate terrain surface
        const terrainMesh = this.createTerrainSurface(radius, type, roughness, seed);
        planetGroup.add(terrainMesh);

        // Add water layer if planet has water
        if (hasWater) {
            const waterMesh = this.createWaterLayer(radius, waterLevel);
            planetGroup.add(waterMesh);
        }

        // Add atmosphere
        const atmosphere = this.createAtmosphere(radius, type);
        planetGroup.add(atmosphere);

        // Add clouds for some planet types
        if (['ocean', 'forest', 'swamp'].includes(type)) {
            const clouds = this.createClouds(radius);
            planetGroup.add(clouds);
        }

        this.planets.set(name.toLowerCase(), {
            group: planetGroup,
            type,
            radius,
            hasWater,
            seed
        });

        this.scene.add(planetGroup);
        
        console.log(`✅ Planet ${name} generated with ${hasWater ? 'water' : 'no water'}`);
        return planetGroup;
    }

    /**
     * Create terrain surface with procedural texture
     */
    createTerrainSurface(radius, type, roughness, seed) {
        const geometry = new THREE.SphereGeometry(radius, 128, 128);
        
        // Generate height map for terrain elevation
        const heightMap = this.generateHeightMap(128, 128, roughness, seed);
        
        // Apply height displacement to geometry
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            );
            
            const height = heightMap[i % heightMap.length];
            vertex.normalize().multiplyScalar(radius + height * radius * 0.1);
            
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        geometry.computeVertexNormals();

        // Create procedural texture based on planet type
        const material = this.createPlanetMaterial(type, heightMap);
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'terrain';
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Rotate slowly for realism
        mesh.userData.rotationSpeed = 0.0001 + Math.random() * 0.0002;

        return mesh;
    }

    /**
     * Generate height map using multiple octaves of noise
     */
    generateHeightMap(width, height, roughness, seed) {
        const size = width * height;
        const heightMap = new Float32Array(size);
        
        // Simple multi-octave noise
        for (let i = 0; i < size; i++) {
            let value = 0;
            let amplitude = 1;
            let frequency = 1;
            
            // 4 octaves of noise
            for (let octave = 0; octave < 4; octave++) {
                const x = (i % width) * frequency / width + seed;
                const y = Math.floor(i / width) * frequency / height + seed;
                
                // Simple pseudo-noise function
                const noise = this.noise2D(x, y);
                value += noise * amplitude;
                
                amplitude *= roughness;
                frequency *= 2;
            }
            
            heightMap[i] = value;
        }
        
        return heightMap;
    }

    /**
     * Simple 2D noise function
     */
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    /**
     * Create planet-specific material with realistic textures
     */
    createPlanetMaterial(type, heightMap) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Generate texture based on planet type
        switch (type) {
            case 'desert':
                this.generateDesertTexture(ctx, heightMap);
                break;
            case 'ocean':
                this.generateOceanTexture(ctx, heightMap);
                break;
            case 'swamp':
                this.generateSwampTexture(ctx, heightMap);
                break;
            case 'ice':
                this.generateIceTexture(ctx, heightMap);
                break;
            case 'lava':
                this.generateLavaTexture(ctx, heightMap);
                break;
            case 'forest':
                this.generateForestTexture(ctx, heightMap);
                break;
            default:
                this.generateDefaultTexture(ctx, heightMap);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.2,
            bumpMap: texture,
            bumpScale: 5
        });
    }

    generateDesertTexture(ctx, heightMap) {
        // Sandy desert with dunes - yellows and browns
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2; // Normalize to 0-1
                
                // Sand colors from light to dark
                const r = 210 + h * 40;
                const g = 180 - h * 50;
                const b = 140 - h * 80;
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    generateOceanTexture(ctx, heightMap) {
        // Ocean world - blues and greens
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2;
                
                if (h > 0.6) {
                    // Land - browns and greens
                    const r = 100 + h * 40;
                    const g = 140 + h * 30;
                    const b = 80 + h * 20;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else {
                    // Deep to shallow water
                    const r = 20 + h * 60;
                    const g = 60 + h * 100;
                    const b = 150 + h * 80;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                }
                
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    generateSwampTexture(ctx, heightMap) {
        // Dark, murky swamp - dark greens and browns
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2;
                
                // Murky greens and browns
                const r = 40 + h * 60;
                const g = 60 + h * 50;
                const b = 30 + h * 40;
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    generateIceTexture(ctx, heightMap) {
        // Icy world - whites and light blues
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2;
                
                const r = 220 + h * 35;
                const g = 230 + h * 25;
                const b = 250 + h * 5;
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    generateLavaTexture(ctx, heightMap) {
        // Volcanic lava world - reds, oranges, blacks
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2;
                
                if (h > 0.5) {
                    // Hot lava
                    const r = 255;
                    const g = 100 + h * 100;
                    const b = 0;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else {
                    // Cooled rock
                    const val = h * 80;
                    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
                }
                
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    generateForestTexture(ctx, heightMap) {
        // Forest world - various greens
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2;
                
                const r = 60 + h * 80;
                const g = 120 + h * 80;
                const b = 60 + h * 40;
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    generateDefaultTexture(ctx, heightMap) {
        // Generic rocky planet
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) % heightMap.length;
                const h = (heightMap[i] + 1) / 2;
                
                const val = 100 + h * 100;
                ctx.fillStyle = `rgb(${val}, ${val * 0.9}, ${val * 0.8})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    /**
     * Create animated water layer
     */
    createWaterLayer(radius, waterLevel) {
        const waterRadius = radius * (0.98 + waterLevel * 0.05);
        const geometry = new THREE.SphereGeometry(waterRadius, 64, 64);
        
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x0077be,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
            side: THREE.DoubleSide
        });
        
        const water = new THREE.Mesh(geometry, material);
        water.name = 'water';
        
        // Store wave animation data
        water.userData.waveTime = 0;
        water.userData.waveSpeed = 0.5;
        
        return water;
    }

    /**
     * Create atmospheric glow effect
     */
    createAtmosphere(radius, type) {
        const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.15, 32, 32);
        
        // Atmosphere color based on planet type
        const atmosphereColors = {
            desert: 0xffcc88,
            ocean: 0x88ccff,
            swamp: 0x88aa66,
            ice: 0xccddff,
            lava: 0xff6600,
            forest: 0x99dd88
        };
        
        const color = atmosphereColors[type] || 0xaabbcc;
        
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.name = 'atmosphere';
        
        return atmosphere;
    }

    /**
     * Create animated cloud layer
     */
    createClouds(radius) {
        const cloudGeometry = new THREE.SphereGeometry(radius * 1.08, 32, 32);
        
        // Generate cloud texture
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = 512;
        cloudCanvas.height = 512;
        const ctx = cloudCanvas.getContext('2d');
        
        // Simple cloud pattern
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 512, 512);
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = 20 + Math.random() * 60;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
        
        const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
        cloudTexture.wrapS = THREE.RepeatWrapping;
        cloudTexture.wrapT = THREE.RepeatWrapping;
        
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.6,
            blending: THREE.NormalBlending
        });
        
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.name = 'clouds';
        clouds.userData.rotationSpeed = 0.0003;
        
        return clouds;
    }

    /**
     * Update animated elements
     */
    update(deltaTime) {
        this.planets.forEach((planetData) => {
            const group = planetData.group;
            
            // Rotate terrain
            const terrain = group.getObjectByName('terrain');
            if (terrain && terrain.userData.rotationSpeed) {
                terrain.rotation.y += terrain.userData.rotationSpeed;
            }
            
            // Animate water
            const water = group.getObjectByName('water');
            if (water) {
                water.userData.waveTime += deltaTime * water.userData.waveSpeed;
                water.rotation.y += 0.0001;
                
                // Subtle wave animation
                const scale = 1 + Math.sin(water.userData.waveTime) * 0.002;
                water.scale.set(scale, scale, scale);
            }
            
            // Rotate clouds
            const clouds = group.getObjectByName('clouds');
            if (clouds && clouds.userData.rotationSpeed) {
                clouds.rotation.y += clouds.userData.rotationSpeed;
            }
        });
    }

    /**
     * Get planet by name
     */
    getPlanet(name) {
        return this.planets.get(name.toLowerCase());
    }

    /**
     * Remove planet
     */
    removePlanet(name) {
        const planetData = this.planets.get(name.toLowerCase());
        if (planetData) {
            this.scene.remove(planetData.group);
            this.planets.delete(name.toLowerCase());
        }
    }
}
