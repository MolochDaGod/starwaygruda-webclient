import * as THREE from 'three';
import { GameWorld } from './world/GameWorld.js';
import { PlayerController } from './player/PlayerController.js';
import { APIClient } from './api/APIClient.js';
import { AssetLoader } from './loaders/AssetLoader.js';
import { EnhancedAssetLoader } from './loaders/EnhancedAssetLoader.js';
import { HDAssetLoader, FREE_SW_ASSETS } from './loaders/HDAssetLoader.js';
import { EpicSpawnManager } from './world/EpicSpawnManager.js';
import { SpaceTravelSystem } from './world/SpaceTravelSystem.js';
import { ShipFleetManager } from './world/ShipFleetManager.js';
import { ShipInteractionSystem } from './world/ShipInteractionSystem.js';
import { EXPERIMENT_HD } from './config/flags.js';
import { HUD } from './ui/HUD.js';
import { Toolbar } from './ui/Toolbar.js';
import { HelpOverlay } from './ui/HelpOverlay.js';
// import { CodeEditor } from './ui/CodeEditor.js'; // Temporarily disabled
import { SimpleCodeEditor } from './ui/SimpleCodeEditor.js';
import { findNearestPOI, getPlanetPOIs } from './data/poi-database.js';
import { CharacterSelection } from './ui/CharacterSelection.js';

class StarWayGRUDAClient {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.loadingScreen = document.getElementById('loading-screen');
        
        // THREE.js core
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Enhanced lighting and atmosphere
        this.renderer.physicallyCorrectLights = true;
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.00008); // Atmospheric haze
        
        // Game systems
        this.api = new APIClient(); // URLs configured internally from VITE_AUTH_URL / VITE_API_URL env vars
        
        // Check API server availability
        this.checkAPIServer();
        
        this.assetLoader = new EnhancedAssetLoader(); // Enhanced with fallbacks
        // Enhanced post-processing system
        if (EXPERIMENT_HD) {
            this.hdLoader = new HDAssetLoader(this.renderer);
        }
        this.postProcessing = null; // Will be initialized in init()
        
        // Enhanced lighting system
        this.lighting = null; // Will be initialized in init()
        
        this.epicSpawn = new EpicSpawnManager(this.scene, this.renderer);
        
        // 🚀 SPACE TRAVEL SYSTEMS
        this.spaceTravel = new SpaceTravelSystem(this.scene, this.renderer, this.camera);
        this.shipFleet = new ShipFleetManager(this.scene, this.renderer);
        this.shipInteraction = null; // Will be initialized after player
        this.inSpaceMode = false;
        this.groundShips = []; // Ships on the ground that player can board
        
        this.world = null;
        this.player = null;
        this.hud = new HUD();
        this.toolbar = new Toolbar();
        this.helpOverlay = new HelpOverlay(); // F1 help system
        this.codeEditor = new SimpleCodeEditor(); // Simple AI-powered editor
        this.currentPlanet = 'tatooine';
        this.characterSelection = null;
        this.selectedCharacter = null;
        
        // Input tracking for space controls
        this.keys = {};
        this.setupInputTracking();
        
        // Performance tracking
        this.clock = new THREE.Clock();
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        this.init();
    }

    setupInputTracking() {
        // Track key states for space controls
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // AI Code Editor shortcuts (F1 handled by help overlay)
            if (event.ctrlKey && event.code === 'KeyI') {
                event.preventDefault();
                if (this.codeEditor) {
                    this.codeEditor.toggle();
                }
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Make help overlay globally accessible
        window.helpOverlay = this.helpOverlay;
        window.game = this; // For AI status updates
        
        console.log('⌨️ Input tracking initialized for space controls');
    }
    
    async checkAPIServer() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/health`);
            if (response.ok) {
                console.log('✅ API Server connected');
            } else {
                throw new Error('API server not responding');
            }
        } catch (error) {
            console.warn('⚠️ API Server not available, using offline mode');
            this.offlineMode = true;
            
            // Notify AI Code Editor about offline status
            if (this.codeEditor && this.codeEditor.setPuterAIProvider) {
                this.codeEditor.setPuterAIProvider({
                    provider: 'offline',
                    enabled: true,
                    note: 'Using offline AI assistance'
                });
            }
        }
    }
    
    async init() {
        try {
            // Initialize post-processing and lighting systems
            this.postProcessing = new (await import('./world/PostProcessingSystem.js')).PostProcessingSystem(this.renderer, this.scene, this.camera);
            this.postProcessing.setQualityPreset('high'); // Start with high quality
            
            this.lighting = new (await import('./world/LightingSystem.js')).LightingSystem(this.scene);
            
            // Show character selection first
            await this.updateLoading('Initializing...', 10);
            this.characterSelection = new CharacterSelection(this.api);
            
            // Wait for character selection
            await new Promise((resolve) => {
                window.addEventListener('characterSelected', (event) => {
                    this.selectedCharacter = event.detail;
                    // Set planet from character data
                    this.currentPlanet = event.detail.planet ? event.detail.planet.toLowerCase() : 'tutorial';
                    resolve();
                }, { once: true });
            });
            
            // Show loading screen again
            this.loadingScreen.classList.remove('hidden');
            
            // Loading sequence
            await this.updateLoading('Connecting to server...', 20);
            await this.api.connect();
            
            await this.updateLoading('Loading terrain data...', 30);
            // Load SWG terrain heightmaps and textures for selected planet
            const terrainData = await this.assetLoader.loadTerrain(this.currentPlanet);
            
            if (EXPERIMENT_HD) {
                await this.updateLoading('Loading HDR environment...', 45);
                const env = await this.hdLoader.loadEnvironment('/textures/sky/desert.hdr');
                this.scene.environment = env;
                this.scene.background = env;
            }

            await this.updateLoading('Loading game assets...', 55);
            // Load .iff models, .tre textures, etc.
            await this.assetLoader.loadGameAssets();
            
            // 🌟 EPIC HD EXPERIENCE - No more trash models!
            if (EXPERIMENT_HD) {
                await this.updateLoading('Creating epic spawn experience...', 65);
                
                // Create cinematic spawn at Mos Eisley Cantina
                const spawnData = await this.epicSpawn.createEpicSpawn([-1370, 10, -104]);
                console.log('🎬 EPIC SPAWN CREATED:', spawnData);
                
                // 🚀 Initialize space travel systems
                await this.updateLoading('Initializing space systems...', 70);
                await this.spaceTravel.initializeSpace();
                
                // Spawn player ships at spaceport
                await this.updateLoading('Loading starships...', 72);
                await this.shipFleet.spawnShip('player-fighter', 'fighter', [-1320, 15, -104]);
                await this.shipFleet.spawnShip('player-transport', 'transport', [-1300, 15, -120]);
                console.log('🛸 Player fleet ready!');
            }

            await this.updateLoading('Creating world...', 75);
            this.world = new GameWorld(this.scene, terrainData, this.currentPlanet);
            
            await this.updateLoading('Spawning player...', 85);
            this.player = new PlayerController(this.camera, this.scene);
            
            // Initialize ship interaction system
            await this.updateLoading('Setting up ship systems...', 88);
            this.shipInteraction = new ShipInteractionSystem(this.scene, this.camera);
            this.shipInteraction.setPlayer(this.player, this.player.mesh);
            
            // Setup ship interaction callbacks
            this.shipInteraction.onEnterShip = (ship) => this.handleEnterShip(ship);
            this.shipInteraction.onExitShip = (ship, pos) => this.handleExitShip(ship, pos);
            this.shipInteraction.onLand = (planet, pos) => this.handleLanding(planet, pos);
            this.shipInteraction.onTakeoff = () => this.handleTakeoff();
            
            // Connect ship interaction to space travel
            this.spaceTravel.shipInteraction = this.shipInteraction;
            this.spaceTravel.onLandingComplete = (planet, pos) => {
                // Spawn a ship at landing position for player
                this.spawnShipAtLanding(pos);
            };
            
            // Spawn ground ships near player spawn
            await this.spawnGroundShips();
            
            // Set spawn location - MOS EISLEY CANTINA (cinematic!)
            if (this.currentPlanet === 'tutorial') {
                // Tutorial zone spawn point
                this.player.setPosition(0, 10, 0);
            } else if (this.currentPlanet === 'tatooine') {
                // 🌟 MOS EISLEY CANTINA - Most famous location in Star Wars!
                this.player.setPosition(-1370, 15, -104); // Outside the cantina
                console.log('🏛️ Spawned at MOS EISLEY CANTINA - where Han shot first!');
            } else {
                // Default spawn  
                this.player.setPosition(0, 10, 0);
            }
            
            await this.updateLoading('Ready!', 100);
            
            // Set HUD planet name
            const planetData = getPlanetPOIs(this.currentPlanet);
            this.hud.setPlanet(planetData.name);
            
            // Hide loading screen
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                this.startGame();
            }, 500);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.updateLoading('Error: ' + error.message, 0);
        }
    }
    
    async updateLoading(text, progress) {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('progress-bar').style.width = progress + '%';
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    startGame() {
        // Setup lighting
        this.setupLighting();
        
        // Setup space travel controls
        this.setupSpaceControls();
        
        // Start render loop
        this.animate();
        
        // Setup event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('🎮 StarWayGRUDA client started with space travel!');
    }

    setupSpaceControls() {
        // Space travel hotkeys
        document.addEventListener('keydown', (event) => {
            const shipState = this.shipInteraction ? this.shipInteraction.getState() : null;
            
            switch (event.key.toLowerCase()) {
                case 'f': // Launch to space (only if in ship and landed)
                    if (shipState && shipState.isInShip && shipState.isLanded) {
                        this.shipInteraction.takeoff();
                        setTimeout(() => this.launchToSpace(), 1500);
                    } else if (!shipState?.isInShip && !this.inSpaceMode) {
                        // Not in a ship - show message
                        this.showNotification('Board a ship first! (Press E near a ship)', 3000);
                    }
                    break;
                case 'l': // Land on planet
                    if (this.inSpaceMode) {
                        // Let SpaceTravelSystem handle landing prompts
                    }
                    break;
                case 'tab': // Switch ships in space
                    if (this.inSpaceMode) {
                        event.preventDefault();
                        this.shipFleet.switchShip();
                    }
                    break;
                case ' ': // Fire weapons
                    if (this.inSpaceMode) {
                        event.preventDefault();
                        this.shipFleet.fireWeapons();
                    }
                    break;
                case 'h': // Help
                    this.showSpaceHelp();
                    break;
            }
        });

        console.log('🎮 Space controls configured (E=Board/Exit, F=Takeoff, Tab=Switch Ship)');
    }
    
    /**
     * Spawn ground ships that player can board
     */
    async spawnGroundShips() {
        const spawnPositions = [
            { pos: [-1320, 3, -104], type: 'fighter', name: 'X-Wing Fighter' },
            { pos: [-1300, 3, -120], type: 'transport', name: 'Light Freighter' },
        ];
        
        for (const spawn of spawnPositions) {
            const shipMesh = this.createGroundShipMesh(spawn.type);
            shipMesh.position.set(spawn.pos[0], spawn.pos[1], spawn.pos[2]);
            this.scene.add(shipMesh);
            
            // Register with ship interaction system
            this.shipInteraction.registerShip(`ground-${spawn.type}`, shipMesh, {
                type: spawn.type,
                name: spawn.name,
                isPlayerOwned: true,
                exitOffset: new THREE.Vector3(8, 0, 0),
            });
            
            this.groundShips.push(shipMesh);
        }
        
        console.log(`🛸 Spawned ${spawnPositions.length} ground ships near player`);
    }
    
    /**
     * Create a simple ground ship mesh
     */
    createGroundShipMesh(type) {
        const group = new THREE.Group();
        
        if (type === 'fighter') {
            // X-Wing style fighter
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(4, 1.5, 10),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 })
            );
            body.position.y = 1.5;
            group.add(body);
            
            // Wings
            const wingMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5 });
            const topWing = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 3), wingMat);
            topWing.position.set(0, 2.5, -1);
            group.add(topWing);
            
            const bottomWing = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 3), wingMat);
            bottomWing.position.set(0, 0.5, -1);
            group.add(bottomWing);
            
            // Cockpit
            const cockpit = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 16, 8),
                new THREE.MeshStandardMaterial({ color: 0x3366aa, transparent: true, opacity: 0.7 })
            );
            cockpit.position.set(0, 2, 3);
            cockpit.scale.set(1, 0.6, 1.2);
            group.add(cockpit);
            
            // Engines
            const engineMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            for (let x of [-1.5, 1.5]) {
                const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3, 8), engineMat);
                engine.rotation.x = Math.PI / 2;
                engine.position.set(x, 1.5, -5);
                group.add(engine);
            }
        } else {
            // Transport/Freighter
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(8, 4, 14),
                new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.5 })
            );
            body.position.y = 3;
            group.add(body);
            
            // Cockpit
            const cockpit = new THREE.Mesh(
                new THREE.BoxGeometry(4, 2, 4),
                new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6 })
            );
            cockpit.position.set(0, 5, 5);
            group.add(cockpit);
            
            // Window
            const window = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x4488cc, transparent: true, opacity: 0.6 })
            );
            window.position.set(0, 5.5, 7.01);
            group.add(window);
            
            // Landing gear
            const gearMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            for (let pos of [[-3, 0, 4], [3, 0, 4], [-3, 0, -4], [3, 0, -4]]) {
                const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), gearMat);
                gear.position.set(pos[0], pos[1] + 1, pos[2]);
                group.add(gear);
            }
        }
        
        group.castShadow = true;
        group.receiveShadow = true;
        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return group;
    }
    
    /**
     * Handle entering a ship
     */
    handleEnterShip(ship) {
        console.log(`🚀 Player entered ${ship.name}`);
        
        // Hide ground player controls
        if (this.player) {
            this.player.mesh.visible = false;
        }
        
        // Show ship controls hint
        this.showNotification(`Piloting ${ship.name} - Press F to launch, E to exit (when landed)`, 5000);
    }
    
    /**
     * Handle exiting a ship
     */
    handleExitShip(ship, exitPosition) {
        console.log(`🚶 Player exited ${ship.name}`);
        
        // Show player at exit position
        if (this.player) {
            this.player.mesh.visible = true;
            this.player.setPosition(exitPosition.x, exitPosition.y + 1, exitPosition.z);
        }
        
        this.inSpaceMode = false;
        this.showNotification('You are now on foot. Press E near a ship to board.', 4000);
    }
    
    /**
     * Handle landing on planet
     */
    handleLanding(planetName, position) {
        console.log(`🛬 Landed on ${planetName}`);
        this.inSpaceMode = false;
        this.currentPlanet = planetName.toLowerCase();
        
        // Show ground ships again
        this.groundShips.forEach(ship => {
            ship.visible = true;
        });
        
        // Restore planetary environment
        this.restorePlanetaryEnvironment();
    }
    
    /**
     * Handle takeoff
     */
    handleTakeoff() {
        console.log('🚀 Taking off!');
    }
    
    /**
     * Spawn a ship at the landing position
     */
    spawnShipAtLanding(position) {
        // Check if we already have a ship nearby
        let hasNearbyShip = false;
        this.groundShips.forEach(ship => {
            if (ship.position.distanceTo(position) < 20) {
                hasNearbyShip = true;
            }
        });
        
        if (!hasNearbyShip) {
            const shipMesh = this.createGroundShipMesh('fighter');
            shipMesh.position.set(position.x, position.y, position.z);
            this.scene.add(shipMesh);
            
            const shipId = `landed-ship-${Date.now()}`;
            this.shipInteraction.registerShip(shipId, shipMesh, {
                type: 'fighter',
                name: 'Your Starship',
                isPlayerOwned: true,
                exitOffset: new THREE.Vector3(8, 0, 0),
            });
            
            this.groundShips.push(shipMesh);
            console.log('🛸 Ship spawned at landing position');
        }
    }
    
    /**
     * Restore planet environment after landing
     */
    restorePlanetaryEnvironment() {
        // Remove space elements
        if (this.spaceTravel.starField) {
            this.spaceTravel.starField.visible = false;
        }
        
        // Restore saved planetary lighting (preserves original sun/terrain)
        if (this.spaceTravel.savedPlanetaryState) {
            this.spaceTravel.restoreSavedPlanetaryState();
        } else {
            this.setupLighting();
        }
    }
    
    /**
     * Show notification to player
     */
    showNotification(message, duration = 3000) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: #00ffff;
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid #00aaff;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            z-index: 1001;
            text-align: center;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.5s';
            setTimeout(() => notif.remove(), 500);
        }, duration);
    }

    async launchToSpace() {
        console.log('🚀 LAUNCHING TO SPACE!');
        
        this.inSpaceMode = true;
        
        // Update ship interaction - no longer landed
        if (this.shipInteraction) {
            this.shipInteraction.isLanded = false;
            this.shipInteraction.landedPlanet = null;
        }
        
        // Hide ground ships while in space
        this.groundShips.forEach(ship => {
            ship.visible = false;
        });
        
        // Enter space mode
        this.spaceTravel.enterSpace(this.currentPlanet);
        
        // Set active ship
        this.shipFleet.setActiveShip('player-fighter');
        
        // Show space tutorial
        this.showSpaceTutorial();
    }

    showSpaceTutorial() {
        const tutorial = document.createElement('div');
        tutorial.innerHTML = `
            <div style="
                position: fixed;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #001122, #003366);
                color: #00ffff;
                padding: 25px;
                border-radius: 15px;
                border: 2px solid #00ffff;
                font-family: 'Orbitron', monospace;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
            ">
                <h2 style="color: #ffff00; text-shadow: 0 0 10px #ffff00;">🚀 SPACE PILOT TRAINING</h2>
                <div style="text-align: left; margin: 15px 0;">
                    <p><strong>WASD</strong> - Thrust and Maneuver</p>
                    <p><strong>Q/E</strong> - Roll Ship</p>
                    <p><strong>TAB</strong> - Switch Ships</p>
                    <p><strong>SPACE</strong> - Fire Weapons</p>
                    <p><strong>F</strong> - Land on Planet (when near)</p>
                </div>
                <p style="color: #00ff00; margin-top: 20px;">
                    Fly close to planets to land • May the Force be with you!
                </p>
            </div>
        `;
        
        document.body.appendChild(tutorial);
        
        setTimeout(() => {
            if (document.body.contains(tutorial)) {
                tutorial.style.animation = 'fadeOut 1s ease-out forwards';
                setTimeout(() => tutorial.remove(), 1000);
            }
        }, 8000);
    }

    showSpaceHelp() {
        const help = document.createElement('div');
        help.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #00ffff;
                padding: 30px;
                border-radius: 10px;
                border: 2px solid #00ffff;
                font-family: monospace;
                z-index: 1000;
                max-width: 400px;
            ">
                <h3>🛸 STARSHIP CONTROLS</h3>
                <div style="text-align: left;">
                    <p><strong>F</strong> - Launch to Space / Land</p>
                    <p><strong>WASD</strong> - Ship Movement</p>
                    <p><strong>Q/E</strong> - Roll Maneuvers</p>
                    <p><strong>TAB</strong> - Switch Ships</p>
                    <p><strong>SPACE</strong> - Fire Weapons</p>
                    <p><strong>H</strong> - Show this help</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: #003366; color: #00ffff; border: 1px solid #00ffff; 
                                   padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(help);
    }
    
    setupLighting() {
        if (this.currentPlanet === 'tutorial') {
            // Tutorial zone lighting (balanced, neutral)
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
            sunLight.position.set(100, 200, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            this.scene.add(sunLight);
            
            // Sky (neutral blue)
            this.scene.background = new THREE.Color(0x6bb3d9);
            this.scene.fog = new THREE.Fog(0x6bb3d9, 100, 3000);
        } else if (this.currentPlanet === 'tatooine' || this.currentPlanet === 'lok') {
            // Desert planet lighting (twin suns but not blinding)
            const ambientLight = new THREE.AmbientLight(0xffe4b5, 0.4);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xfff4e6, 0.75);
            sunLight.position.set(100, 200, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            this.scene.add(sunLight);
            
            // Sky (desert tan, not too bright)
            this.scene.background = new THREE.Color(0xd4b896);
            this.scene.fog = new THREE.Fog(0xd4b896, 100, 5000);
        } else if (this.currentPlanet === 'hoth') {
            // Ice planet - cold blue-white lighting
            const ambientLight = new THREE.AmbientLight(0xc0d8ff, 0.45);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xffffff, 0.65);
            sunLight.position.set(100, 150, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            this.scene.add(sunLight);
            
            this.scene.background = new THREE.Color(0xa8c8e8);
            this.scene.fog = new THREE.Fog(0xc8d8f0, 50, 2000);
        } else if (this.currentPlanet === 'mustafar') {
            // Lava planet - red/orange volcanic glow
            const ambientLight = new THREE.AmbientLight(0xff6633, 0.35);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xff8844, 0.5);
            sunLight.position.set(100, 100, 50);
            sunLight.castShadow = true;
            this.scene.add(sunLight);
            
            this.scene.background = new THREE.Color(0x331100);
            this.scene.fog = new THREE.Fog(0x220800, 30, 800);
        } else if (this.currentPlanet === 'dathomir') {
            // Dark swamp - eerie red/purple
            const ambientLight = new THREE.AmbientLight(0x8866aa, 0.3);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xaa8899, 0.45);
            sunLight.position.set(80, 120, 40);
            sunLight.castShadow = true;
            this.scene.add(sunLight);
            
            this.scene.background = new THREE.Color(0x442244);
            this.scene.fog = new THREE.Fog(0x332233, 50, 1500);
        } else if (this.currentPlanet === 'endor' || this.currentPlanet === 'kashyyyk' || this.currentPlanet === 'yavin4') {
            // Forest moons - dappled green light
            const ambientLight = new THREE.AmbientLight(0x88aa88, 0.4);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xffffcc, 0.55);
            sunLight.position.set(80, 180, 60);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            this.scene.add(sunLight);
            
            this.scene.background = new THREE.Color(0x5588aa);
            this.scene.fog = new THREE.Fog(0x447766, 80, 2500);
        } else if (this.currentPlanet === 'dantooine') {
            // Grassland - soft golden light
            const ambientLight = new THREE.AmbientLight(0xccddaa, 0.4);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xffeedd, 0.6);
            sunLight.position.set(100, 200, 50);
            sunLight.castShadow = true;
            this.scene.add(sunLight);
            
            this.scene.background = new THREE.Color(0x7799bb);
            this.scene.fog = new THREE.Fog(0x99aacc, 100, 4000);
        } else {
            // Default lighting for other planets (Naboo, Corellia, Talus, Rori)
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xfffaf0, 0.65);
            sunLight.position.set(100, 200, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            this.scene.add(sunLight);
            
            this.scene.background = new THREE.Color(0x6699cc);
            this.scene.fog = new THREE.Fog(0x7799bb, 100, 4000);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Get input keys for space travel
        const inputKeys = {};
        if (this.inSpaceMode) {
            // Capture keyboard state for ship controls
            inputKeys.KeyW = this.keys?.KeyW || false;
            inputKeys.KeyA = this.keys?.KeyA || false;
            inputKeys.KeyS = this.keys?.KeyS || false;
            inputKeys.KeyD = this.keys?.KeyD || false;
            inputKeys.KeyQ = this.keys?.KeyQ || false;
            inputKeys.KeyE = this.keys?.KeyE || false;
            inputKeys.ArrowUp = this.keys?.ArrowUp || false;
            inputKeys.ArrowDown = this.keys?.ArrowDown || false;
            inputKeys.ArrowLeft = this.keys?.ArrowLeft || false;
            inputKeys.ArrowRight = this.keys?.ArrowRight || false;
        }
        
        // Update game systems
        if (this.inSpaceMode) {
            // 🚀 SPACE MODE - Update space travel and ships
            this.spaceTravel.update(delta, inputKeys);
            
            // Update active ship
            const activeShip = this.shipFleet.activeShip;
            if (activeShip) {
                this.shipFleet.updateShip(activeShip, delta, inputKeys);
            }
            
            // Update all ships
            this.shipFleet.ships.forEach(ship => {
                if (ship !== activeShip) {
                    this.shipFleet.updateShip(ship, delta, {});
                }
            });
        } else {
            // 🌍 PLANET MODE - Normal gameplay
            const shipState = this.shipInteraction ? this.shipInteraction.getState() : null;
            
            // Only update player if on foot (not in ship)
            if (this.player && (!shipState || shipState.state === 'on_foot')) {
                this.player.update(delta);
                
                // Update ship interaction system
                if (this.shipInteraction) {
                    this.shipInteraction.update(this.player.getPosition());
                }
                
                // Update lighting to follow player
                if (this.lighting) {
                    this.lighting.followPlayer(this.player.getPosition());
                    this.lighting.updateTimeOfDay(0.5); // Midday, less bright
                }
            }
            
            if (this.world) {
                this.world.update(delta, this.camera.position);
            }
        }
        
        // Update HUD
        this.updateHUD();
        
        // Render with enhanced post-processing
        if (this.postProcessing) {
            // Update post-processing with player data
            const speed = this.player?.velocity ? this.player.velocity.length() : 0;
            this.postProcessing.updateEffects({
                speed: speed,
                isRunning: this.player?.isRunning || false,
                timeOfDay: 0.6, // Can be made dynamic later
                weatherIntensity: 0
            });
            this.postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    updateHUD() {
        // FPS counter
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            this.hud.updateFPS(this.fps);
        }
        
        // Player position
        if (this.player) {
            const pos = this.player.getPosition();
            this.hud.updatePosition(pos.x, pos.y, pos.z);
            
            // Update nearest POI
            const result = findNearestPOI(this.currentPlanet, pos.x, pos.y, pos.z);
            if (result) {
                this.hud.updateNearestPOI(result.poi.name, result.distance);
            } else {
                this.hud.updateNearestPOI(null, null);
            }
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update post-processing for new window size
        if (this.postProcessing) {
            this.postProcessing.resize(window.innerWidth, window.innerHeight);
        }
    }
}

// Start the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new StarWayGRUDAClient();
});
