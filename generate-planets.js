// Generate Planet Heightmaps and Textures
// Fixes 404 errors for planet data

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const planets = {
    tatooine: {
        heightRange: [0, 50],      // Flat desert
        baseColor: [218, 165, 32], // Gold
        waterLevel: null,          // No water
        roughness: 0.3
    },
    naboo: {
        heightRange: [0, 100],     // Rolling hills
        baseColor: [74, 124, 89],  // Green
        waterLevel: 20,            // Lots of water
        roughness: 0.6
    },
    corellia: {
        heightRange: [0, 80],      // Moderate terrain
        baseColor: [93, 138, 58],  // Green
        waterLevel: 15,
        roughness: 0.5
    },
    endor: {
        heightRange: [0, 120],     // Mountainous
        baseColor: [60, 80, 40],   // Dark green
        waterLevel: 10,
        roughness: 0.8
    },
    dathomir: {
        heightRange: [0, 150],     // Very mountainous
        baseColor: [100, 60, 80],  // Purple-brown
        waterLevel: 5,
        roughness: 0.9
    },
    lok: {
        heightRange: [0, 60],      // Rocky desert
        baseColor: [160, 120, 80], // Brown
        waterLevel: null,
        roughness: 0.7
    },
    rori: {
        heightRange: [0, 70],      // Similar to Naboo
        baseColor: [80, 130, 70],  // Light green
        waterLevel: 18,
        roughness: 0.5
    },
    talus: {
        heightRange: [0, 90],      // Varied
        baseColor: [70, 110, 60],  // Green-gray
        waterLevel: 12,
        roughness: 0.6
    },
    yavin4: {
        heightRange: [0, 110],     // Jungle terrain
        baseColor: [40, 90, 40],   // Deep green
        waterLevel: 8,
        roughness: 0.7
    },
    tutorial: {
        heightRange: [0, 30],      // Very flat
        baseColor: [93, 138, 58],  // Green
        waterLevel: 5,
        roughness: 0.2
    }
};

// Simple noise function
function noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

// Multi-octave Perlin-like noise
function generateHeight(x, y, config) {
    let height = 0;
    height += noise2D(x * 0.005, y * 0.005) * 0.5;  // Large features
    height += noise2D(x * 0.02, y * 0.02) * 0.3;    // Medium features
    height += noise2D(x * 0.05, y * 0.05) * 0.15;   // Small features  
    height += noise2D(x * 0.1, y * 0.1) * 0.05;     // Fine details
    
    // Apply roughness
    height = Math.pow(height, 2 - config.roughness);
    
    // Map to height range
    const [min, max] = config.heightRange;
    return min + height * (max - min);
}

async function generatePlanetHeightmap(planetName, config, size = 512) {
    console.log(`Generating heightmap for ${planetName}...`);
    
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const height = generateHeight(x, y, config);
            
            // Convert height to grayscale (0-255)
            const [min, max] = config.heightRange;
            const normalized = (height - min) / (max - min);
            const gray = Math.floor(normalized * 255);
            
            const i = (y * size + x) * 4;
            imageData.data[i] = gray;     // R
            imageData.data[i + 1] = gray; // G
            imageData.data[i + 2] = gray; // B
            imageData.data[i + 3] = 255;  // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Save heightmap
    const planetDir = path.join(__dirname, 'public', 'planets', planetName);
    fs.mkdirSync(planetDir, { recursive: true });
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(planetDir, 'heightmap.png'), buffer);
    
    console.log(`  ✓ Heightmap saved: ${planetDir}/heightmap.png`);
}

async function generateColorMap(planetName, config, size = 512) {
    console.log(`Generating color map for ${planetName}...`);
    
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    
    const [r, g, b] = config.baseColor;
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const height = generateHeight(x, y, config);
            
            // Vary color based on height
            const variation = noise2D(x * 0.1, y * 0.1) * 30 - 15;
            
            const i = (y * size + x) * 4;
            imageData.data[i] = Math.max(0, Math.min(255, r + variation));
            imageData.data[i + 1] = Math.max(0, Math.min(255, g + variation));
            imageData.data[i + 2] = Math.max(0, Math.min(255, b + variation));
            imageData.data[i + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const planetDir = path.join(__dirname, 'public', 'planets', planetName);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(planetDir, 'texture.png'), buffer);
    
    console.log(`  ✓ Texture saved: ${planetDir}/texture.png`);
}

async function generateAllPlanets() {
    console.log('========================================');
    console.log('  Generating Planet Data');
    console.log('========================================\n');
    
    for (const [planetName, config] of Object.entries(planets)) {
        await generatePlanetHeightmap(planetName, config);
        await generateColorMap(planetName, config);
        console.log('');
    }
    
    console.log('========================================');
    console.log('  ✓ All Planets Generated!');
    console.log('========================================');
    console.log('\nPlanets created:');
    Object.keys(planets).forEach(name => {
        console.log(`  - ${name}`);
    });
    console.log('\nFiles in public/planets/<name>/:');
    console.log('  - heightmap.png (terrain elevation)');
    console.log('  - texture.png (base color map)');
}

// Run generation
generateAllPlanets().catch(console.error);
