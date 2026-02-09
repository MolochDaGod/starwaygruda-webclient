import * as THREE from 'three';
import { HDAssetLoader } from '../loaders/HDAssetLoader.js';
import { PlanetGenerator } from './PlanetGenerator.js';

/**
 * Space Travel System
 * Implements ship-based movement between planets and space stations
 */
export class SpaceTravelSystem {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.hdLoader = new HDAssetLoader(renderer);
        this.planetGenerator = new PlanetGenerator(scene, renderer);
        
        // Ship management
        this.playerShip = null;
        this.isInSpace = false;
        this.currentLocation = 'tatooine';
        this.targetLocation = null;
        
        // Ship interaction reference (set by main.js)
        this.shipInteraction = null;
        
        // Landing callbacks
        this.onLandingComplete = null;
        
        // Space environment
        this.spaceEnvironment = null;
        this.starField = null;
        this.planets = new Map();
        
        // Movement physics
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.maxSpeed = 50;
        this.thrustPower = 2;
        
        console.log('🚀 Space Travel System initialized');
    }

    /**
     * Initialize space environment with starfield and planets
     */
    async initializeSpace() {
        console.log('🌌 Creating space environment...');
        
        // Create starfield background
        this.createStarField();
        
        // Create space lighting
        this.setupSpaceLighting();
        
        // Load player ship
        await this.loadPlayerShip();
        
        // Position planets in space
        this.createPlanetSystem();
        
        console.log('✨ Space environment ready!');
    }

    createStarField() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 10000;
        const positions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20000;     // x
            positions[i + 1] = (Math.random() - 0.5) * 20000; // y
            positions[i + 2] = (Math.random() - 0.5) * 20000; // z
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: false
        });
        
        this.starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starField);
        
        console.log('⭐ Starfield created with 10,000 stars');
    }

    setupSpaceLighting() {
        // Remove planetary lighting
        const lights = this.scene.children.filter(child => child.isLight);
        lights.forEach(light => this.scene.remove(light));
        
        // Add space lighting
        const spaceAmbient = new THREE.AmbientLight(0x404040, 0.3);
        const starLight = new THREE.DirectionalLight(0xffffff, 0.8);
        starLight.position.set(1000, 1000, 1000);
        
        this.scene.add(spaceAmbient);
        this.scene.add(starLight);
        
        // Dark space background
        this.scene.background = new THREE.Color(0x000011);
    }

    async loadPlayerShip() {
        console.log('🛸 Loading player starship...');
        
        try {
            // Load a sci-fi ship model (using available assets)
            this.playerShip = await this.hdLoader.loadModel(
                'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Draco/FlightHelmet.gltf',
                {
                    scale: [5, 5, 5],
                    castShadow: true,
                    receiveShadow: true
                }
            );
            
            this.playerShip.name = 'PlayerStarship';
            this.playerShip.position.set(0, 0, 0);
            this.playerShip.visible = false; // Hidden until space travel
            
            // Add engine effects
            this.addEngineEffects();
            
            this.scene.add(this.playerShip);
            console.log('✅ Player starship loaded and ready');
            
        } catch (error) {
            console.error('Failed to load ship model:', error);
            this.createFallbackShip();
        }
    }

    addEngineEffects() {
        if (!this.playerShip) return;
        
        // Create engine thrust particles
        const engineGeometry = new THREE.ConeGeometry(0.5, 3, 8);
        const engineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-3, -1, -8);
        leftEngine.rotation.x = Math.PI;
        
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(3, -1, -8);
        rightEngine.rotation.x = Math.PI;
        
        this.playerShip.add(leftEngine);
        this.playerShip.add(rightEngine);
        
        console.log('🔥 Engine effects added');
    }

    createPlanetSystem() {
        // Create ALL Star Wars Galaxies planets with realistic textures and features
        const planetConfigs = [
            // === ORIGINAL SWG LAUNCH PLANETS ===
            {
                name: 'Tatooine',
                position: [1000, 0, 0],
                radius: 100,
                type: 'desert',
                hasWater: false,
                roughness: 0.9,
                seed: 1001,
                description: 'Desert world with twin suns'
            },
            {
                name: 'Naboo',
                position: [-800, 200, 500],
                radius: 120,
                type: 'ocean',
                hasWater: true,
                waterLevel: 0.6,
                roughness: 0.6,
                seed: 2002,
                description: 'Lush world with rolling plains'
            },
            {
                name: 'Corellia',
                position: [0, -300, 1200],
                radius: 110,
                type: 'forest',
                hasWater: true,
                waterLevel: 0.3,
                roughness: 0.7,
                seed: 3003,
                description: 'Industrial world, birthplace of Han Solo'
            },
            {
                name: 'Talus',
                position: [200, -250, 1400],
                radius: 75,
                type: 'forest',
                hasWater: true,
                waterLevel: 0.35,
                roughness: 0.65,
                seed: 3004,
                description: 'Twin world of Corellia'
            },
            {
                name: 'Rori',
                position: [-600, 100, 700],
                radius: 80,
                type: 'swamp',
                hasWater: true,
                waterLevel: 0.5,
                roughness: 0.5,
                seed: 4004,
                description: 'Swampy moon of Naboo'
            },
            {
                name: 'Lok',
                position: [1300, 100, 200],
                radius: 85,
                type: 'desert',
                hasWater: false,
                roughness: 0.88,
                seed: 4005,
                description: 'Lawless desert world'
            },
            {
                name: 'Dantooine',
                position: [-1200, 150, -400],
                radius: 95,
                type: 'grassland',
                hasWater: true,
                waterLevel: 0.25,
                roughness: 0.55,
                seed: 4006,
                description: 'Peaceful grassland world'
            },
            {
                name: 'Yavin4',
                position: [1200, 300, -600],
                radius: 90,
                type: 'forest',
                hasWater: true,
                waterLevel: 0.4,
                roughness: 0.8,
                seed: 5005,
                description: 'Jungle moon, Rebel base location'
            },
            {
                name: 'Dathomir',
                position: [800, -200, -900],
                radius: 95,
                type: 'swamp',
                hasWater: true,
                waterLevel: 0.4,
                roughness: 0.85,
                seed: 6006,
                description: 'Dark world of the Nightsisters'
            },
            {
                name: 'Endor',
                position: [-500, 350, -1100],
                radius: 88,
                type: 'forest',
                hasWater: true,
                waterLevel: 0.3,
                roughness: 0.75,
                seed: 6007,
                description: 'Forest moon, home of Ewoks'
            },
            {
                name: 'Kashyyyk',
                position: [-1400, -100, 300],
                radius: 105,
                type: 'forest',
                hasWater: true,
                waterLevel: 0.45,
                roughness: 0.7,
                seed: 6008,
                description: 'Wookiee homeworld'
            },
            // === EXPANSION PLANETS ===
            {
                name: 'Hoth',
                position: [-1000, -400, 200],
                radius: 85,
                type: 'ice',
                hasWater: true,
                waterLevel: 0.2,
                roughness: 0.7,
                seed: 7007,
                description: 'Frozen wasteland'
            },
            {
                name: 'Mustafar',
                position: [500, 400, 1100],
                radius: 75,
                type: 'lava',
                hasWater: false,
                roughness: 0.95,
                seed: 8008,
                description: 'Volcanic mining world'
            }
        ];
        
        planetConfigs.forEach(config => {
            const planetGroup = this.planetGenerator.generatePlanet(config);
            this.planets.set(config.name.toLowerCase(), planetGroup);
        });
        
        console.log(`🪐 Created ${planetConfigs.length} unique planets with realistic features`);
    }

    /**
     * Enter space travel mode
     */
    enterSpace(fromPlanet = 'tatooine') {
        console.log(`🚀 Launching from ${fromPlanet}...`);
        
        this.isInSpace = true;
        this.currentLocation = fromPlanet;
        
        // Show starfield
        if (this.starField) {
            this.starField.visible = true;
        }
        
        // Show planets
        this.planets.forEach(p => {
            if (p.visible !== undefined) p.visible = true;
        });
        
        // Show player ship
        if (this.playerShip) {
            this.playerShip.visible = true;
            this.playerShip.position.set(0, 0, 0);
            
            // Position camera behind ship
            this.camera.position.set(0, 5, 15);
            this.camera.lookAt(this.playerShip.position);
        }
        
        // Switch to space environment
        this.setupSpaceLighting();
        
        console.log('🌌 Now in space - use WASD to pilot your ship!');
        this.showSpaceHUD();
    }

    /**
     * Land on a planet
     */
    async landOnPlanet(planetName) {
        console.log(`🛬 Landing on ${planetName}...`);
        
        this.isInSpace = false;
        this.currentLocation = planetName.toLowerCase();
        
        // Calculate landing position (near planet center, on ground)
        const planet = this.planets.get(planetName.toLowerCase());
        const landingPosition = new THREE.Vector3();
        
        if (planet) {
            // Land near the planet - offset from center
            landingPosition.copy(planet.position);
            landingPosition.x += 50;  // Offset from planet center
            landingPosition.y = 5;    // Ground level
            landingPosition.z += 50;
        } else {
            // Default landing position
            landingPosition.set(0, 5, 0);
        }
        
        // Notify ship interaction system about landing
        if (this.shipInteraction) {
            this.shipInteraction.land(planetName, landingPosition);
        }
        
        // Hide player ship in space (it's now on the ground via ship interaction)
        if (this.playerShip) {
            this.playerShip.visible = false;
        }
        
        // Remove starfield temporarily
        if (this.starField) {
            this.starField.visible = false;
        }
        
        // Hide space planets
        this.planets.forEach(p => {
            if (p.visible !== undefined) p.visible = false;
        });
        
        // Restore planetary lighting
        this.restorePlanetaryLighting();
        
        console.log(`✅ Landed on ${planetName} at position ${landingPosition.x.toFixed(0)}, ${landingPosition.z.toFixed(0)}!`);
        this.hideSpaceHUD();
        
        // Trigger callback
        if (this.onLandingComplete) {
            this.onLandingComplete(planetName, landingPosition);
        }
        
        // Trigger world reload for new planet
        return planetName;
    }

    /**
     * Update ship physics and movement
     */
    update(deltaTime, inputKeys) {
        // Update planets (rotation, water animation, clouds)
        this.planetGenerator.update(deltaTime);
        
        if (!this.isInSpace || !this.playerShip) return;
        
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Handle input
        if (inputKeys.KeyW || inputKeys.ArrowUp) {
            this.acceleration.add(this.playerShip.getWorldDirection(new THREE.Vector3()).multiplyScalar(this.thrustPower));
        }
        if (inputKeys.KeyS || inputKeys.ArrowDown) {
            this.acceleration.add(this.playerShip.getWorldDirection(new THREE.Vector3()).multiplyScalar(-this.thrustPower * 0.5));
        }
        if (inputKeys.KeyA || inputKeys.ArrowLeft) {
            this.playerShip.rotation.y += 0.02;
        }
        if (inputKeys.KeyD || inputKeys.ArrowRight) {
            this.playerShip.rotation.y -= 0.02;
        }
        if (inputKeys.KeyQ) {
            this.playerShip.rotation.z += 0.02;
        }
        if (inputKeys.KeyE) {
            this.playerShip.rotation.z -= 0.02;
        }
        
        // Apply physics
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        this.velocity.clampLength(0, this.maxSpeed);
        
        // Apply drag
        this.velocity.multiplyScalar(0.98);
        
        // Move ship
        this.playerShip.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update camera to follow ship
        const cameraOffset = new THREE.Vector3(0, 5, 15);
        cameraOffset.applyQuaternion(this.playerShip.quaternion);
        this.camera.position.copy(this.playerShip.position.clone().add(cameraOffset));
        this.camera.lookAt(this.playerShip.position);
        
        // Check for planetary proximity
        this.checkPlanetProximity();
    }

    checkPlanetProximity() {
        if (!this.playerShip) return;
        
        this.planets.forEach((planet, name) => {
            const distance = this.playerShip.position.distanceTo(planet.position);
            if (distance < 200) { // Landing zone
                if (!planet.landingPromptShown) {
                    this.showLandingPrompt(name);
                    planet.landingPromptShown = true;
                }
            } else {
                planet.landingPromptShown = false;
            }
        });
    }

    showLandingPrompt(planetName) {
        // Get planet description
        const planetConfigs = {
            tatooine: 'Desert world with twin suns',
            naboo: 'Lush world with rolling plains',
            corellia: 'Industrial world, birthplace of Han Solo',
            talus: 'Twin world of Corellia',
            rori: 'Swampy moon of Naboo',
            lok: 'Lawless desert world',
            dantooine: 'Peaceful grassland world',
            yavin4: 'Jungle moon, Rebel base location',
            dathomir: 'Dark world of the Nightsisters',
            endor: 'Forest moon, home of Ewoks',
            kashyyyk: 'Wookiee homeworld',
            hoth: 'Frozen wasteland',
            mustafar: 'Volcanic mining world'
        };
        
        const description = planetConfigs[planetName.toLowerCase()] || 'Unknown world';
        
        const prompt = document.createElement('div');
        prompt.innerHTML = `
            <div style="
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,60,0.95));
                color: #00ff00;
                padding: 25px 35px;
                border: 2px solid #00ff00;
                border-radius: 15px;
                font-family: 'Orbitron', monospace;
                font-size: 16px;
                z-index: 1000;
                text-align: center;
                box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
            ">
                <h3 style="color: #ffff00; margin-bottom: 10px;">🌍 ${planetName.toUpperCase()}</h3>
                <p style="color: #88ccff; font-size: 12px; margin-bottom: 15px;">${description}</p>
                <p style="color: #00ff00;">Press <span style="background: #003300; padding: 3px 8px; border-radius: 4px;">ENTER</span> to land</p>
                <p style="font-size: 11px; color: #666; margin-top: 10px;">ESC to continue flying</p>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                document.body.removeChild(prompt);
                document.removeEventListener('keydown', handleKeyPress);
                this.landOnPlanet(planetName);
            } else if (event.key === 'Escape') {
                document.body.removeChild(prompt);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                document.body.removeChild(prompt);
                document.removeEventListener('keydown', handleKeyPress);
            }
        }, 8000);
    }

    showSpaceHUD() {
        const spaceHUD = document.createElement('div');
        spaceHUD.id = 'space-hud';
        spaceHUD.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(0, 0, 50, 0.8);
                color: #00ffff;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                border: 1px solid #00ffff;
            ">
                <h4>🚀 STARSHIP STATUS</h4>
                <p>Location: Deep Space</p>
                <p>Speed: <span id="ship-speed">0</span> km/s</p>
                <p>Controls: WASD + Q/E for roll</p>
                <p>Press SPACE to exit ship</p>
            </div>
        `;
        
        document.body.appendChild(spaceHUD);
    }

    hideSpaceHUD() {
        const spaceHUD = document.getElementById('space-hud');
        if (spaceHUD) {
            document.body.removeChild(spaceHUD);
        }
    }

    restorePlanetaryLighting() {
        // Remove space lighting
        const lights = this.scene.children.filter(child => child.isLight);
        lights.forEach(light => this.scene.remove(light));
        
        // Add planetary lighting back
        const ambientLight = new THREE.AmbientLight(0xffeaa7, 0.4);
        const sunLight = new THREE.DirectionalLight(0xffd93d, 0.8);
        sunLight.position.set(50, 100, 30);
        sunLight.castShadow = true;
        
        this.scene.add(ambientLight);
        this.scene.add(sunLight);
        
        // Restore sky background
        this.scene.background = new THREE.Color(0x87ceeb);
    }

    createFallbackShip() {
        // Create a basic ship if model loading fails
        const shipGroup = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(6, 2, 12);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        shipGroup.add(body);
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(12, 0.5, 4);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.z = -2;
        shipGroup.add(wings);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 8);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4444ff,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 1, 2);
        shipGroup.add(cockpit);
        
        this.playerShip = shipGroup;
        this.playerShip.name = 'PlayerStarship_Fallback';
        this.playerShip.visible = false;
        
        this.addEngineEffects();
        this.scene.add(this.playerShip);
        
        console.log('🛸 Fallback ship created');
    }

    /**
     * Get available destinations
     */
    getDestinations() {
        return Array.from(this.planets.keys());
    }

    /**
     * Quick travel to planet (for testing)
     */
    quickTravelTo(planetName) {
        if (this.planets.has(planetName.toLowerCase())) {
            return this.landOnPlanet(planetName);
        }
        console.warn(`Planet ${planetName} not found`);
        return null;
    }

    dispose() {
        // Clean up space assets
        if (this.starField) {
            this.scene.remove(this.starField);
        }
        this.planets.forEach(planet => {
            this.scene.remove(planet);
        });
        if (this.playerShip) {
            this.scene.remove(this.playerShip);
        }
        
        this.hideSpaceHUD();
        console.log('🧹 Space Travel System disposed');
    }
}