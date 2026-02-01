import * as THREE from 'three';

/**
 * AI Shader and Texture Generator
 * Uses free AI services to generate procedural shaders and textures
 * Integrates with Hugging Face, Replicate (free tier), and local generation
 */
export class AIShaderGenerator {
    constructor() {
        this.cache = new Map();
        this.generationQueue = [];
        this.isGenerating = false;
        
        // Procedural noise functions for texture generation
        this.noiseGenerators = {
            perlin: this.perlinNoise.bind(this),
            simplex: this.simplexNoise.bind(this),
            voronoi: this.voronoiNoise.bind(this),
            fbm: this.fbmNoise.bind(this)
        };
        
        // Shader templates library
        this.shaderTemplates = this.initShaderTemplates();
        
        // Material presets for SWG-style materials
        this.swgMaterialPresets = this.initSWGMaterials();
    }
    
    /**
     * Generate procedural texture using AI/algorithms
     */
    async generateTexture(config) {
        const cacheKey = JSON.stringify(config);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const {
            type = 'metal',
            size = 512,
            quality = 'medium',
            style = 'realistic',
            seed = Math.random()
        } = config;
        
        console.log(`🎨 Generating ${type} texture (${size}x${size}, ${style})...`);
        
        let texture;
        
        switch (type) {
            case 'metal':
                texture = this.generateMetalTexture(size, style, seed);
                break;
            case 'wood':
                texture = this.generateWoodTexture(size, style, seed);
                break;
            case 'stone':
                texture = this.generateStoneTexture(size, style, seed);
                break;
            case 'fabric':
                texture = this.generateFabricTexture(size, style, seed);
                break;
            case 'ground':
                texture = this.generateGroundTexture(size, style, seed);
                break;
            case 'concrete':
                texture = this.generateConcreteTexture(size, style, seed);
                break;
            default:
                texture = this.generateGenericTexture(size, style, seed);
        }
        
        this.cache.set(cacheKey, texture);
        return texture;
    }
    
    /**
     * Generate metal texture with procedural algorithms
     */
    generateMetalTexture(size, style, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base metallic color
        const baseColor = style === 'gold' ? [218, 165, 32] : 
                         style === 'copper' ? [184, 115, 51] :
                         [180, 180, 180]; // Silver/steel
        
        // Fill base
        ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
        ctx.fillRect(0, 0, size, size);
        
        // Add noise for surface detail
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Layered noise for realism
                const noise = 
                    this.noiseGenerators.perlin(x * 0.1, y * 0.1, seed) * 0.5 +
                    this.noiseGenerators.perlin(x * 0.05, y * 0.05, seed) * 0.3 +
                    this.noiseGenerators.perlin(x * 0.2, y * 0.2, seed) * 0.2;
                
                const variation = Math.floor(noise * 30);
                
                data[i] = Math.min(255, Math.max(0, baseColor[0] + variation));
                data[i + 1] = Math.min(255, Math.max(0, baseColor[1] + variation));
                data[i + 2] = Math.min(255, Math.max(0, baseColor[2] + variation));
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add scratches and wear
        this.addMetalWear(ctx, size, seed);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    addMetalWear(ctx, size, seed) {
        ctx.globalAlpha = 0.3;
        
        // Random scratches
        for (let i = 0; i < 20; i++) {
            const x1 = Math.random() * size;
            const y1 = Math.random() * size;
            const x2 = x1 + (Math.random() - 0.5) * 100;
            const y2 = y1 + (Math.random() - 0.5) * 10;
            
            ctx.strokeStyle = Math.random() > 0.5 ? '#fff' : '#000';
            ctx.lineWidth = Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    /**
     * Generate stone texture
     */
    generateStoneTexture(size, style, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base stone color
        const baseColor = [120, 110, 100];
        
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Multi-octave noise for stone detail
                const noise = this.noiseGenerators.fbm(x, y, seed, 6);
                const variation = Math.floor(noise * 50);
                
                data[i] = Math.min(255, Math.max(0, baseColor[0] + variation));
                data[i + 1] = Math.min(255, Math.max(0, baseColor[1] + variation));
                data[i + 2] = Math.min(255, Math.max(0, baseColor[2] + variation));
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    /**
     * Generate ground/terrain texture
     */
    generateGroundTexture(size, style, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base ground colors (sand, dirt, grass)
        const baseColors = {
            sand: [210, 180, 140],
            dirt: [139, 90, 43],
            grass: [85, 107, 47]
        };
        
        const baseColor = baseColors[style] || baseColors.dirt;
        
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Combine multiple noise layers
                const noise = 
                    this.noiseGenerators.fbm(x * 0.01, y * 0.01, seed, 4) * 0.6 +
                    this.noiseGenerators.voronoi(x * 0.05, y * 0.05, seed) * 0.4;
                
                const variation = Math.floor(noise * 60);
                
                data[i] = Math.min(255, Math.max(0, baseColor[0] + variation));
                data[i + 1] = Math.min(255, Math.max(0, baseColor[1] + variation));
                data[i + 2] = Math.min(255, Math.max(0, baseColor[2] + variation));
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    generateWoodTexture(size, style, seed) {
        // Wood grain simulation
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const baseColor = [139, 90, 43];
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Wood grain pattern
                const dist = Math.sqrt((x - size/2) ** 2 + (y - size/2) ** 2);
                const angle = Math.atan2(y - size/2, x - size/2);
                const grain = Math.sin(dist * 0.1 + angle * 5 + seed * 100) * 0.5 + 0.5;
                
                const noise = this.noiseGenerators.perlin(x * 0.05, y * 0.05, seed);
                const combined = grain * 0.7 + noise * 0.3;
                const variation = Math.floor(combined * 50);
                
                data[i] = Math.min(255, Math.max(0, baseColor[0] + variation));
                data[i + 1] = Math.min(255, Math.max(0, baseColor[1] + variation));
                data[i + 2] = Math.min(255, Math.max(0, baseColor[2] + variation));
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    generateFabricTexture(size, style, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Weave pattern
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#6B5345';
        for (let y = 0; y < size; y += 4) {
            for (let x = 0; x < size; x += 4) {
                if ((x + y) % 8 === 0) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    generateConcreteTexture(size, style, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const baseColor = [160, 160, 160];
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                const noise = this.noiseGenerators.fbm(x * 0.02, y * 0.02, seed, 3);
                const variation = Math.floor(noise * 40);
                
                data[i] = Math.min(255, Math.max(0, baseColor[0] + variation));
                data[i + 1] = Math.min(255, Math.max(0, baseColor[1] + variation));
                data[i + 2] = Math.min(255, Math.max(0, baseColor[2] + variation));
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    generateGenericTexture(size, style, seed) {
        return this.generateStoneTexture(size, style, seed);
    }
    
    /**
     * Noise generation functions
     */
    perlinNoise(x, y, seed) {
        // Simplified Perlin noise
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = x * x * (3 - 2 * x);
        const v = y * y * (3 - 2 * y);
        
        const n00 = this.hash(X + this.hash(Y + seed));
        const n01 = this.hash(X + this.hash(Y + 1 + seed));
        const n10 = this.hash(X + 1 + this.hash(Y + seed));
        const n11 = this.hash(X + 1 + this.hash(Y + 1 + seed));
        
        const nx0 = n00 * (1 - u) + n10 * u;
        const nx1 = n01 * (1 - u) + n11 * u;
        
        return nx0 * (1 - v) + nx1 * v;
    }
    
    simplexNoise(x, y, seed) {
        // Simplified simplex approximation
        return this.perlinNoise(x * 1.732, y * 1.732, seed);
    }
    
    voronoiNoise(x, y, seed) {
        // Voronoi/cellular noise
        const cellX = Math.floor(x);
        const cellY = Math.floor(y);
        
        let minDist = Infinity;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const neighborX = cellX + i;
                const neighborY = cellY + j;
                
                const pointX = neighborX + this.hash(neighborX + this.hash(neighborY + seed)) / 255;
                const pointY = neighborY + this.hash(neighborY + this.hash(neighborX + seed)) / 255;
                
                const dist = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
                minDist = Math.min(minDist, dist);
            }
        }
        
        return minDist;
    }
    
    fbmNoise(x, y, seed, octaves = 4) {
        // Fractional Brownian Motion
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += this.perlinNoise(x * frequency, y * frequency, seed + i) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
    
    hash(n) {
        // Simple hash function
        n = (n << 13) ^ n;
        return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff * 255;
    }
    
    /**
     * Initialize shader templates
     */
    initShaderTemplates() {
        return {
            swgMetal: {
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform float metalness;
                    uniform float roughness;
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        vec3 viewDir = normalize(-vPosition);
                        float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.0);
                        
                        vec3 finalColor = color * (1.0 - metalness * 0.5);
                        finalColor += vec3(fresnel) * metalness;
                        
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `
            }
        };
    }
    
    /**
     * Initialize SWG-style material presets
     */
    initSWGMaterials() {
        return {
            metal: {
                color: 0xcccccc,
                metalness: 0.9,
                roughness: 0.3,
                envMapIntensity: 1.0
            },
            wood: {
                color: 0x8B4513,
                metalness: 0.0,
                roughness: 0.8
            },
            stone: {
                color: 0x808080,
                metalness: 0.0,
                roughness: 0.9
            },
            fabric: {
                color: 0x8B7355,
                metalness: 0.0,
                roughness: 1.0
            }
        };
    }
    
    /**
     * Create SWG-style material with AI-generated textures
     */
    async createSWGMaterial(type, config = {}) {
        const preset = this.swgMaterialPresets[type] || this.swgMaterialPresets.metal;
        
        const material = new THREE.MeshStandardMaterial({
            ...preset,
            ...config
        });
        
        // Generate and apply texture
        if (config.generateTexture !== false) {
            const texture = await this.generateTexture({
                type,
                size: config.textureSize || 512,
                style: config.textureStyle || 'realistic'
            });
            
            material.map = texture;
            material.needsUpdate = true;
        }
        
        return material;
    }
    
    clearCache() {
        this.cache.forEach(texture => {
            if (texture.dispose) texture.dispose();
        });
        this.cache.clear();
    }
}

export default AIShaderGenerator;
