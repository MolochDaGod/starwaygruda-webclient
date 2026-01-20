import * as THREE from 'three';
import { HDAssetLoader } from '../loaders/HDAssetLoader.js';

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
        
        // Ship management
        this.playerShip = null;
        this.isInSpace = false;
        this.currentLocation = 'tatooine';
        this.targetLocation = null;
        
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
        const planetData = [
            { name: 'Tatooine', position: [1000, 0, 0], color: 0xd4a574, size: 100 },
            { name: 'Naboo', position: [-800, 200, 500], color: 0x4a90e2, size: 120 },
            { name: 'Corellia', position: [0, -300, 1200], color: 0x7ed321, size: 110 },
            { name: 'Rori', position: [-600, 100, -800], color: 0xf5a623, size: 80 },
            { name: 'Yavin4', position: [1200, 300, -600], color: 0x50e3c2, size: 90 }
        ];
        
        planetData.forEach(planet => {
            const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: planet.color,
                shininess: 30
            });
            
            const planetMesh = new THREE.Mesh(geometry, material);
            planetMesh.position.set(...planet.position);
            planetMesh.name = planet.name;
            
            // Add atmosphere glow
            const atmosphereGeometry = new THREE.SphereGeometry(planet.size * 1.1, 32, 32);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: planet.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            planetMesh.add(atmosphere);
            
            this.planets.set(planet.name.toLowerCase(), planetMesh);
            this.scene.add(planetMesh);
        });
        
        console.log(`🪐 Created ${planetData.length} planets in space`);
    }

    /**
     * Enter space travel mode
     */
    enterSpace(fromPlanet = 'tatooine') {
        console.log(`🚀 Launching from ${fromPlanet}...`);
        
        this.isInSpace = true;
        this.currentLocation = fromPlanet;
        
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
        
        // Hide player ship
        if (this.playerShip) {
            this.playerShip.visible = false;
        }
        
        // Remove starfield temporarily
        if (this.starField) {
            this.starField.visible = false;
        }
        
        // Restore planetary lighting
        this.restorePlanetaryLighting();
        
        console.log(`✅ Landed on ${planetName}!`);
        this.hideSpaceHUD();
        
        // Trigger world reload for new planet
        return planetName;
    }

    /**
     * Update ship physics and movement
     */
    update(deltaTime, inputKeys) {
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
        const prompt = document.createElement('div');
        prompt.innerHTML = `
            <div style="
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                padding: 20px;
                border: 2px solid #00ff00;
                border-radius: 10px;
                font-family: monospace;
                font-size: 16px;
                z-index: 1000;
                text-align: center;
            ">
                <h3>🛬 ${planetName.toUpperCase()}</h3>
                <p>Press ENTER to land</p>
                <p style="font-size: 12px;">ESC to continue flying</p>
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
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                document.body.removeChild(prompt);
                document.removeEventListener('keydown', handleKeyPress);
            }
        }, 5000);
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