import * as THREE from 'three';
import { GameWorld } from './world/GameWorld.js';
import { PlayerController } from './player/PlayerController.js';
import { APIClient } from './api/APIClient.js';
import { AssetLoader } from './loaders/AssetLoader.js';
import { HDAssetLoader, FREE_SW_ASSETS } from './loaders/HDAssetLoader.js';
import { EpicSpawnManager } from './world/EpicSpawnManager.js';
import { SpaceTravelSystem } from './world/SpaceTravelSystem.js';
import { ShipFleetManager } from './world/ShipFleetManager.js';
import { AdvancedThreeScene } from './world/AdvancedThreeScene.js';
import { FlightDashboard } from './ui/FlightDashboard.js';
import { EXPERIMENT_HD } from './config/flags.js';
import { HUD } from './ui/HUD-Advanced.js';
import { Toolbar } from './ui/Toolbar.js';
import { CodeEditor } from './ui/CodeEditor.js';
import { findNearestPOI, getPlanetPOIs } from './data/poi-database.js';
import { CharacterSelection } from './ui/CharacterSelection.js';

class StarWayGRUDAClient {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        
        // Flight dashboard for space mode
        this.flightDashboard = new FlightDashboard();
        
        // Game systems
        this.api = new APIClient(''); // Use relative path to work with Vite proxy
        this.assetLoader = new AssetLoader();
        if (EXPERIMENT_HD) {
            this.hdLoader = new HDAssetLoader();
        }
        
        // Game state
        this.world = null;
        this.player = null;
        this.hud = new HUD();
        this.toolbar = new Toolbar();
        this.codeEditor = new CodeEditor();
        this.currentPlanet = 'tatooine';
        this.characterSelection = null;
        this.selectedCharacter = null;
        
        // Space flight state
        this.inSpaceMode = false;
        this.advancedScene = null;
        this.sceneCleanup = null;
        
        // Performance tracking
        this.clock = new THREE.Clock();
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        // Create mount point for Three.js scene
        this.mountRef = { current: document.getElementById('game-container') };
        
        this.init();
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
                    this.currentPlanet = event.detail.planet ? event.detail.planet.toLowerCase() : 'tatooine';
                    resolve();
                }, { once: true });
            });
            
            // Show loading screen again
            this.loadingScreen.classList.remove('hidden');
            
            // Loading sequence
            await this.updateLoading('Connecting to server...', 20);
            await this.api.connect();
            
            await this.updateLoading('Loading terrain data...', 30);
            const terrainData = await this.assetLoader.loadTerrain(this.currentPlanet);
            
            if (EXPERIMENT_HD) {
                await this.updateLoading('Loading HDR environment...', 45);
                const env = await this.hdLoader.loadEnvironment('/textures/sky/desert.hdr');
            }

            await this.updateLoading('Loading game assets...', 55);
            await this.assetLoader.loadGameAssets();
            
            await this.updateLoading('Initializing 3D systems...', 70);
            
            // Initialize the advanced Three.js scene
            this.advancedScene = new AdvancedThreeScene(this.mountRef);
            this.sceneCleanup = this.advancedScene.init(this.updateFlightData.bind(this));
            
            await this.updateLoading('Creating epic spawn experience...', 80);
            
            await this.updateLoading('Ready for space flight!', 100);
            
            // Set HUD planet name
            const planetData = getPlanetPOIs(this.currentPlanet);
            this.hud.setPlanet(planetData.name);
            
            // Hide loading screen and start
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
        // Initialize flight dashboard
        this.flightDashboard.init();
        
        // Setup space flight controls
        this.setupSpaceControls();
        
        // Start render loop (handled by AdvancedThreeScene)
        this.startHUDLoop();
        
        // Setup event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('🚀 StarWayGRUDA client started with advanced space flight!');
    }
    
    setupSpaceControls() {
        // Space flight hotkeys
        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'v': // Toggle view mode
                    this.toggleViewMode();
                    break;
                case 'c': // Change spaceship
                    this.changeSpaceship();
                    break;
                case 'm': // Toggle flight dashboard
                    this.toggleFlightDashboard();
                    break;
                case 'h': // Show help
                    this.showSpaceHelp();
                    break;
                case 'r': // Reset position
                    if (this.advancedScene && this.advancedScene.spaceship) {
                        this.advancedScene.spaceship.position.set(0, 20, 0);
                        this.advancedScene.spaceship.rotation.set(0, Math.PI, 0);
                    }
                    break;
            }
        });
        
        console.log('🎮 Advanced space controls configured');
        this.showInitialTutorial();
    }
    
    showInitialTutorial() {
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
                animation: slideIn 1s ease-out;
            ">
                <h2 style="color: #ffff00; text-shadow: 0 0 10px #ffff00;">🌟 WELCOME TO STARWAY GRUDA</h2>
                <div style="text-align: left; margin: 15px 0;">
                    <p><strong>WASD</strong> - Flight Controls</p>
                    <p><strong>Q/E</strong> - Vertical Movement</p>
                    <p><strong>SHIFT</strong> - Boost (uses energy)</p>
                    <p><strong>C</strong> - Change Spaceship</p>
                    <p><strong>M</strong> - Toggle Flight Dashboard</p>
                    <p><strong>V</strong> - Toggle Camera View</p>
                    <p><strong>H</strong> - Help Menu</p>
                </div>
                <p style="color: #00ff00; margin-top: 20px;">
                    🎯 Collect crystals • ⭐ Experience the desert planet
                </p>
                <p style="color: #ff9900; font-size: 14px;">
                    Press H anytime for detailed controls
                </p>
            </div>
            
            <style>
                @keyframes slideIn {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0%); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            </style>
        `;
        
        document.body.appendChild(tutorial);
        
        setTimeout(() => {
            if (document.body.contains(tutorial)) {
                tutorial.style.animation = 'fadeOut 1s ease-out forwards';
                setTimeout(() => tutorial.remove(), 1000);
            }
        }, 12000);
    }
    
    showSpaceHelp() {
        const help = document.createElement('div');
        help.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 20, 40, 0.95);
                color: #00ffff;
                padding: 30px;
                border-radius: 15px;
                border: 2px solid #00ffff;
                font-family: 'Courier New', monospace;
                z-index: 2000;
                max-width: 500px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 50px rgba(0, 255, 255, 0.3);
            ">
                <h2 style="color: #ffff00; text-align: center; margin-bottom: 20px;">🛸 STARSHIP MANUAL</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="color: #ff9900; border-bottom: 1px solid #ff9900;">Flight Controls</h4>
                        <p><strong>W/S</strong> - Forward/Backward</p>
                        <p><strong>A/D</strong> - Left/Right Turn</p>
                        <p><strong>Q/E</strong> - Up/Down</p>
                        <p><strong>SHIFT</strong> - Boost Mode</p>
                        <p><strong>Arrows</strong> - Alternative Controls</p>
                    </div>
                    
                    <div>
                        <h4 style="color: #ff9900; border-bottom: 1px solid #ff9900;">System Controls</h4>
                        <p><strong>C</strong> - Change Ship</p>
                        <p><strong>M</strong> - Flight Dashboard</p>
                        <p><strong>V</strong> - Camera View</p>
                        <p><strong>R</strong> - Reset Position</p>
                        <p><strong>H</strong> - This Help</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(0, 100, 0, 0.3); border-radius: 8px;">
                    <h4 style="color: #00ff00; margin-bottom: 10px;">🎯 Mission Objectives</h4>
                    <p>• Explore the vast desert terrain</p>
                    <p>• Collect glowing crystals for points</p>
                    <p>• Experience dynamic day/night cycles</p>
                    <p>• Master advanced flight mechanics</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: linear-gradient(135deg, #003366, #0066cc); 
                                   color: #ffffff; border: none; padding: 10px 20px; 
                                   border-radius: 8px; cursor: pointer; font-weight: bold;
                                   box-shadow: 0 4px 15px rgba(0, 102, 204, 0.3);">
                        CLOSE MANUAL
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(help);
    }
    
    toggleViewMode() {
        // This could be implemented to switch camera perspectives
        console.log('🎥 Camera view toggled');
        
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 255, 255, 0.2);
                color: #00ffff;
                padding: 10px 20px;
                border-radius: 8px;
                border: 1px solid #00ffff;
                font-family: monospace;
                z-index: 1000;
                animation: fadeInOut 2s ease-in-out forwards;
            ">
                🎥 Camera View Updated
            </div>
            
            <style>
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(100px); }
                    20% { opacity: 1; transform: translateX(0px); }
                    80% { opacity: 1; transform: translateX(0px); }
                    100% { opacity: 0; transform: translateX(100px); }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
    
    changeSpaceship() {
        if (!this.advancedScene) return;
        
        const shipModels = [
            'https://play.rosebud.ai/assets/Spaceship_RaeTheRedPanda.gltf?D7yt',
            'https://play.rosebud.ai/assets/Spaceship_02.glb?n6ry',
            'https://play.rosebud.ai/assets/fighter_ship.glb?x8mn',
            'https://play.rosebud.ai/assets/transport_ship.glb?k2vl'
        ];
        
        const randomModel = shipModels[Math.floor(Math.random() * shipModels.length)];
        this.advancedScene.loadSpaceship(randomModel);
        
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ff6600, #ff9900);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(255, 102, 0, 0.4);
                animation: slideInRight 0.5s ease-out forwards;
            ">
                🛸 NEW SHIP DEPLOYED!
            </div>
            
            <style>
                @keyframes slideInRight {
                    from { transform: translateX(300px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse forwards';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
        
        console.log('🛸 Spaceship changed to:', randomModel);
    }
    
    toggleFlightDashboard() {
        this.flightDashboard.toggle();
        
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 200, 255, 0.2);
                color: #00ccff;
                padding: 8px 16px;
                border-radius: 20px;
                border: 1px solid #00ccff;
                font-family: monospace;
                z-index: 1000;
                animation: bounceIn 0.5s ease-out forwards;
            ">
                📊 Flight Dashboard ${this.flightDashboard.isVisible ? 'Enabled' : 'Disabled'}
            </div>
            
            <style>
                @keyframes bounceIn {
                    0% { transform: translate(-50%, 100px) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
    
    updateFlightData(flightData) {
        // Update flight dashboard with real-time data
        this.flightDashboard.updateData({
            speed: Math.round(flightData.speed),
            altitude: Math.round(flightData.altitude),
            heading: Math.round(flightData.heading),
            boostEnergy: Math.round(flightData.boostEnergy),
            isBoosting: flightData.isBoosting,
            renderDistance: flightData.renderDistance || 0
        });
        
        // Update HUD with space flight data
        this.hud.updateSpaceFlightData({
            speed: flightData.speed,
            altitude: flightData.altitude,
            boosting: flightData.isBoosting
        });
    }
    
    startHUDLoop() {
        // Start a separate loop for HUD updates
        const updateHUD = () => {
            requestAnimationFrame(updateHUD);
            this.updateHUD();
        };
        updateHUD();
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
        
        // Position from advanced scene
        if (this.advancedScene && this.advancedScene.spaceship) {
            const pos = this.advancedScene.spaceship.position;
            this.hud.updatePosition(pos.x, pos.y, pos.z);
            
            // Update score
            this.hud.updateScore(this.advancedScene.score, this.advancedScene.crystalsCollected);
        }
    }
    
    onWindowResize() {
        // Resize is handled by AdvancedThreeScene
        console.log('🖥️ Window resized - handled by AdvancedThreeScene');
    }
    
    destroy() {
        // Cleanup advanced scene
        if (this.sceneCleanup) {
            this.sceneCleanup();
            this.sceneCleanup = null;
        }
        
        // Cleanup flight dashboard
        if (this.flightDashboard) {
            this.flightDashboard.destroy();
        }
        
        console.log('🧹 StarWayGRUDA client cleaned up');
    }
}

// Start the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.starwayClient = new StarWayGRUDAClient();
});

// Export for module usage
export { StarWayGRUDAClient };