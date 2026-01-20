import * as THREE from 'three';
import { HDAssetLoader, FREE_SW_ASSETS } from '../loaders/HDAssetLoader.js';

/**
 * Epic Spawn Experience Manager
 * Creates cinematic entry to world with high-quality assets
 */
export class EpicSpawnManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.hdLoader = new HDAssetLoader(renderer);
        this.spawnAssets = [];
        
        console.log('🌟 EPIC SPAWN MANAGER - No more trash models!');
    }

    /**
     * Create CINEMATIC spawn at Mos Eisley Cantina
     */
    async createEpicSpawn(position = [-1370, 10, -104]) {
        console.log('🎬 Creating EPIC spawn experience...');

        // 1. ENVIRONMENT - Desert HDR lighting
        await this.setupDesertEnvironment();

        // 2. CANTINA - Architectural masterpiece 
        const cantina = await this.spawnCantina(position);
        
        // 3. VEHICLES - Cool speeders nearby
        const speeder = await this.spawnSpeeder([position[0] + 50, position[1], position[2] + 30]);
        
        // 4. ATMOSPHERE - Particle effects, ambient sounds
        this.addAtmosphere(position);

        // 5. WELCOME MESSAGE
        this.showWelcomeMessage();

        console.log('✨ EPIC SPAWN COMPLETE - Welcome to the Galaxy!');
        return { cantina, speeder, position };
    }

    async setupDesertEnvironment() {
        // Load HDR environment for realistic lighting
        try {
            const hdrTexture = await this.hdLoader.loadEnvironmentHDR(
                FREE_SW_ASSETS.environments.desert
            );
            
            this.scene.environment = hdrTexture;
            this.scene.background = hdrTexture;
            
            // Warm desert lighting
            const sunLight = new THREE.DirectionalLight(0xffffcc, 1.2);
            sunLight.position.set(100, 100, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.setScalar(2048);
            this.scene.add(sunLight);

            console.log('🌅 Desert environment loaded - Twin suns of Tatooine!');
        } catch (error) {
            console.warn('HDR loading failed, using backup lighting:', error);
            this.createBackupLighting();
        }
    }

    async spawnCantina(position) {
        console.log('🏛️ Loading Mos Eisley Cantina (Sponza Architecture)...');
        
        try {
            const cantina = await this.hdLoader.loadModel(
                FREE_SW_ASSETS.buildings.tatooine_cantina.url, 
                { 
                    scale: FREE_SW_ASSETS.buildings.tatooine_cantina.scale,
                    castShadow: true,
                    receiveShadow: true
                }
            );
            
            cantina.position.set(position[0], position[1] - 5, position[2]);
            cantina.name = 'MosEisleyCantina';
            
            this.scene.add(cantina);
            this.spawnAssets.push(cantina);
            
            console.log('✅ CANTINA LOADED - Beautiful architecture!');
            return cantina;
            
        } catch (error) {
            console.error('Failed to load cantina:', error);
            return this.createFallbackBuilding(position, 'Cantina');
        }
    }

    async spawnSpeeder(position) {
        console.log('🏎️ Spawning Desert Speeder...');
        
        try {
            const speeder = await this.hdLoader.loadModel(
                FREE_SW_ASSETS.vehicles.speeder_bike.url,
                { 
                    scale: FREE_SW_ASSETS.vehicles.speeder_bike.scale,
                    castShadow: true 
                }
            );
            
            speeder.position.set(position[0], position[1], position[2]);
            speeder.rotation.y = Math.PI * 0.25; // Angled parking
            speeder.name = 'DesertSpeeder';
            
            this.scene.add(speeder);
            this.spawnAssets.push(speeder);
            
            console.log('✅ SPEEDER SPAWNED - Ready for adventure!');
            return speeder;
            
        } catch (error) {
            console.error('Failed to load speeder:', error);
            return this.createFallbackVehicle(position, 'Speeder');
        }
    }

    addAtmosphere(position) {
        // Desert wind particle system
        const windParticles = new THREE.Group();
        windParticles.name = 'DesertWind';
        
        // Simple dust particles
        const dustGeometry = new THREE.SphereGeometry(0.1, 6, 4);
        const dustMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xd4a574, 
            transparent: true, 
            opacity: 0.3 
        });
        
        for (let i = 0; i < 50; i++) {
            const dust = new THREE.Mesh(dustGeometry, dustMaterial);
            dust.position.set(
                position[0] + (Math.random() - 0.5) * 200,
                position[1] + Math.random() * 20,
                position[2] + (Math.random() - 0.5) * 200
            );
            windParticles.add(dust);
        }
        
        this.scene.add(windParticles);
        this.spawnAssets.push(windParticles);
        
        console.log('💨 Desert atmosphere added');
    }

    showWelcomeMessage() {
        // Create welcome overlay
        const welcomeDiv = document.createElement('div');
        welcomeDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #2c1810, #8b4513);
                color: #ffd700;
                padding: 30px;
                border-radius: 10px;
                border: 2px solid #ffd700;
                font-family: 'Orbitron', monospace;
                font-size: 18px;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
                animation: fadeIn 2s ease-in;
            ">
                <h2 style="margin-top: 0; color: #ffd700; text-shadow: 2px 2px 4px #000;">
                    🌟 Welcome to the Galaxy! 🌟
                </h2>
                <p>You've entered <strong>Mos Eisley Spaceport</strong></p>
                <p>The most wretched hive of scum and villainy...</p>
                <p style="font-size: 14px; opacity: 0.8; margin-top: 20px;">
                    High-quality models loaded • Epic adventure awaits
                </p>
            </div>
        `;
        
        // Add fade in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(welcomeDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            welcomeDiv.style.animation = 'fadeOut 1s ease-out forwards';
            setTimeout(() => welcomeDiv.remove(), 1000);
        }, 5000);
        
        // Add fadeOut animation
        style.textContent += `
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            }
        `;
    }

    createBackupLighting() {
        // Fallback lighting if HDR fails
        const ambientLight = new THREE.AmbientLight(0xffeaa7, 0.4);
        const sunLight = new THREE.DirectionalLight(0xffd93d, 0.8);
        sunLight.position.set(50, 100, 30);
        
        this.scene.add(ambientLight);
        this.scene.add(sunLight);
        
        console.log('🌞 Backup lighting created');
    }

    createFallbackBuilding(position, name) {
        // Better looking fallback than basic cubes
        const geometry = new THREE.BoxGeometry(30, 20, 40);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xd4a574,
            transparent: true,
            opacity: 0.9
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(position[0], position[1], position[2]);
        building.name = `Fallback${name}`;
        building.castShadow = true;
        building.receiveShadow = true;
        
        this.scene.add(building);
        return building;
    }

    createFallbackVehicle(position, name) {
        // Sleek fallback vehicle
        const geometry = new THREE.CylinderGeometry(3, 5, 2, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x4a4a4a,
            shininess: 100
        });
        
        const vehicle = new THREE.Mesh(geometry, material);
        vehicle.position.set(position[0], position[1], position[2]);
        vehicle.rotation.x = Math.PI / 2;
        vehicle.name = `Fallback${name}`;
        vehicle.castShadow = true;
        
        this.scene.add(vehicle);
        return vehicle;
    }

    /**
     * Clean up all spawn assets
     */
    dispose() {
        this.spawnAssets.forEach(asset => {
            this.scene.remove(asset);
            if (asset.geometry) asset.geometry.dispose();
            if (asset.material) {
                if (Array.isArray(asset.material)) {
                    asset.material.forEach(m => m.dispose());
                } else {
                    asset.material.dispose();
                }
            }
        });
        this.spawnAssets = [];
        
        console.log('🧹 Epic spawn assets cleaned up');
    }
}