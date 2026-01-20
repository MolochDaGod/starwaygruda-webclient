import * as THREE from 'three';
import { GameWorld } from './world/GameWorld.js';
import { PlayerController } from './player/PlayerController.js';
import { APIClient } from './api/APIClient.js';
import { AssetLoader } from './loaders/AssetLoader.js';
import { HDAssetLoader, FREE_SW_ASSETS } from './loaders/HDAssetLoader.js';
import { EpicSpawnManager } from './world/EpicSpawnManager.js';
import { SpaceTravelSystem } from './world/SpaceTravelSystem.js';
import { ShipFleetManager } from './world/ShipFleetManager.js';
import { EXPERIMENT_HD } from './config/flags.js';
import { HUD } from './ui/HUD.js';
import { Toolbar } from './ui/Toolbar.js';
import { CodeEditor } from './ui/CodeEditor.js';
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
            antialias: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Game systems
        this.api = new APIClient(''); // Use relative path to work with Vite proxy
        this.assetLoader = new AssetLoader();
        if (EXPERIMENT_HD) {
            this.hdLoader = new HDAssetLoader(this.renderer);
        }
        this.epicSpawn = new EpicSpawnManager(this.scene, this.renderer);
        
        // 🚀 SPACE TRAVEL SYSTEMS
        this.spaceTravel = new SpaceTravelSystem(this.scene, this.renderer, this.camera);
        this.shipFleet = new ShipFleetManager(this.scene, this.renderer);
        this.inSpaceMode = false;
        
        this.world = null;
        this.player = null;
        this.hud = new HUD();
        this.toolbar = new Toolbar();
        this.codeEditor = new CodeEditor();
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
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        console.log('⌨️ Input tracking initialized for space controls');
    }
    
    async init() {
        try {
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
            switch (event.key.toLowerCase()) {
                case 'f': // Launch to space
                    if (!this.inSpaceMode) {
                        this.launchToSpace();
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

        console.log('🎮 Space controls configured (F=Launch, Tab=Switch Ship, Space=Fire)');
    }

    async launchToSpace() {
        console.log('🚀 LAUNCHING TO SPACE!');
        
        this.inSpaceMode = true;
        
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
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
            sunLight.position.set(100, 200, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            this.scene.add(sunLight);
            
            // Sky (neutral blue)
            this.scene.background = new THREE.Color(0x87ceeb);
            this.scene.fog = new THREE.Fog(0x87ceeb, 100, 3000);
        } else {
            // Tatooine desert lighting (harsh twin suns)
            const ambientLight = new THREE.AmbientLight(0xffe4b5, 0.8);
            this.scene.add(ambientLight);
            
            const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
            sunLight.position.set(100, 200, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            this.scene.add(sunLight);
            
            // Sky (desert tan/orange)
            this.scene.background = new THREE.Color(0xfad6a5);
            this.scene.fog = new THREE.Fog(0xfad6a5, 100, 5000);
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
            if (this.player) {
                this.player.update(delta);
            }
            
            if (this.world) {
                this.world.update(delta, this.camera.position);
            }
        }
        
        // Update HUD
        this.updateHUD();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
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
    }
}

// Start the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new StarWayGRUDAClient();
});
