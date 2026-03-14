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
import { GroundGameScene } from './world/GroundGameScene.js';
import { FlightDashboard } from './ui/FlightDashboard.js';
import { EXPERIMENT_HD } from './config/flags.js';
import { HUD } from './ui/HUD-Advanced.js';
import { Toolbar } from './ui/Toolbar.js';
import { CodeEditor } from './ui/CodeEditor.js';
import { findNearestPOI, getPlanetPOIs } from './data/poi-database.js';
import { CharacterSelection } from './ui/CharacterSelection.js';
import { getInputManager } from './core/UnifiedInputManager.js';

// Lazy-load the UI control panel (includes Dope Budz, Inventory, Crafting, etc.)
let uiControlPanelLoaded = false;
async function loadUIControlPanel() {
    if (uiControlPanelLoaded) return;
    uiControlPanelLoaded = true;
    try {
        await import('./UIManager.js');
        console.log('✅ UI Control Panel loaded (Dope Budz, Inventory, Crafting, Map)');
    } catch (err) {
        console.warn('⚠️ UI Control Panel not available:', err.message);
    }
}

class StarWayGRUDAClient {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        
        // Flight dashboard for space mode
        this.flightDashboard = new FlightDashboard();
        
        // Game systems
        this.api = new APIClient(); // URLs configured internally from VITE_AUTH_URL / VITE_API_URL env vars
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
        
        // Game mode state
        this.gameMode = 'ground'; // 'ground' or 'space'
        this.advancedScene = null;
        this.groundScene = null;
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
            
            // Initialize based on game mode - default to ground mode with character
            if (this.gameMode === 'ground') {
                this.groundScene = new GroundGameScene(this.mountRef);
                this.sceneCleanup = await this.groundScene.init(this.updateCharacterData.bind(this));
            } else {
                this.advancedScene = new AdvancedThreeScene(this.mountRef);
                this.sceneCleanup = this.advancedScene.init(this.updateFlightData.bind(this));
            }
            
            await this.updateLoading('Creating game world...', 80);
            
            await this.updateLoading('Ready to play!', 100);
            
            // Set HUD planet name
            const planetData = getPlanetPOIs(this.currentPlanet);
            this.hud.setPlanet(planetData.name);
            
            // Hide loading screen and start
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                this.startGame();
                // Load the UI control panel (Dope Budz, Inventory, etc.) after game starts
                loadUIControlPanel();
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
        // Show appropriate UI based on mode
        if (this.gameMode === 'space') {
            this.flightDashboard.show();
        }
        
        // Setup controls
        this.setupGameControls();
        
        // Start HUD loop
        this.startHUDLoop();
        
        // Setup event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        if (this.gameMode === 'ground') {
            console.log('🎮 StarWayGRUDA - Ground Mode Active!');
            console.log('   WASD - Move | SHIFT - Run | SPACE - Jump');
            console.log('   Mouse - Camera | Click - Lock Pointer');
            console.log('   Press G to switch to Space Mode');
            this.showGroundTutorial();
        } else {
            console.log('🚀 StarWayGRUDA - Space Flight Mode!');
        }
    }
    
    setupGameControls() {
        // Use unified input manager
        const input = getInputManager();
        input.setMode(this.gameMode);
        
        // Register custom action for mode switching
        input.register('global', 'KeyG', 'toggleGameMode', 'Switch game mode');
        
        // Bind action callbacks
        input.bindAction('toggleGameMode', () => this.toggleGameMode());
        input.bindAction('toggleCameraView', () => this.toggleViewMode());
        input.bindAction('toggleCamera', () => this.toggleViewMode());
        input.bindAction('changeShip', () => {
            if (this.gameMode === 'space') {
                this.changeSpaceship();
            }
        });
        input.bindAction('toggleDashboard', () => this.toggleFlightDashboard());
        input.bindAction('toggleMap', () => this.toggleFlightDashboard());
        input.bindAction('toggleHelp', () => this.showHelp());
        input.bindAction('resetPosition', () => {
            if (this.gameMode === 'space' && this.advancedScene && this.advancedScene.spaceship) {
                this.advancedScene.spaceship.position.set(0, 20, 0);
                this.advancedScene.spaceship.rotation.set(0, Math.PI, 0);
            } else if (this.gameMode === 'ground' && this.groundScene && this.groundScene.characterManager) {
                this.groundScene.characterManager.setPosition(0, 5, 0);
            }
        });
        
        console.log('🎮 Game controls configured via UnifiedInputManager');
    }
    
    toggleGameMode() {
        // Clean up current scene
        if (this.sceneCleanup) {
            this.sceneCleanup();
        }
        
        // Clear mount point
        while (this.mountRef.current.firstChild) {
            this.mountRef.current.removeChild(this.mountRef.current.firstChild);
        }
        
        // Switch mode
        this.gameMode = this.gameMode === 'ground' ? 'space' : 'ground';
        
        // Update input manager mode
        const input = getInputManager();
        input.setMode(this.gameMode);
        
        // Initialize new scene
        if (this.gameMode === 'ground') {
            this.groundScene = new GroundGameScene(this.mountRef);
            this.groundScene.init(this.updateCharacterData.bind(this));
            this.flightDashboard.hide();
            console.log('🎮 Switched to Ground Mode');
            this.showGroundTutorial();
        } else {
            this.advancedScene = new AdvancedThreeScene(this.mountRef);
            this.sceneCleanup = this.advancedScene.init(this.updateFlightData.bind(this));
            this.flightDashboard.show();
            console.log('🚀 Switched to Space Mode');
            this.showInitialTutorial();
        }
    }
    
    showGroundTutorial() {
        const tutorial = document.createElement('div');
        tutorial.innerHTML = `
            <div style="
                position: fixed;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #112211, #336633);
                color: #88ff88;
                padding: 25px;
                border-radius: 15px;
                border: 2px solid #88ff88;
                font-family: 'Orbitron', monospace;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 0 30px rgba(136, 255, 136, 0.3);
                animation: slideIn 1s ease-out;
            ">
                <h2 style="color: #ffff00; text-shadow: 0 0 10px #ffff00;">🎮 GROUND MODE</h2>
                <div style="text-align: left; margin: 15px 0;">
                    <p><strong>WASD</strong> - Move Character</p>
                    <p><strong>SHIFT</strong> - Run</p>
                    <p><strong>SPACE</strong> - Jump</p>
                    <p><strong>Mouse</strong> - Camera Control</p>
                    <p><strong>Scroll</strong> - Zoom In/Out</p>
                    <p><strong>G</strong> - Switch to Space Mode</p>
                    <p><strong>H</strong> - Help Menu</p>
                </div>
                <p style="color: #00ff00; margin-top: 20px;">
                    💎 Collect crystals • 🌳 Explore the world
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
        }, 8000);
    }
    
    showHelp() {
        if (this.gameMode === 'ground') {
            this.showGroundHelp();
        } else {
            this.showSpaceHelp();
        }
    }
    
    showGroundHelp() {
        const help = document.createElement('div');
        help.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(20, 40, 20, 0.95);
                color: #88ff88;
                padding: 30px;
                border-radius: 15px;
                border: 2px solid #88ff88;
                font-family: 'Courier New', monospace;
                z-index: 2000;
                max-width: 500px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 50px rgba(136, 255, 136, 0.3);
            ">
                <h2 style="color: #ffff00; text-align: center; margin-bottom: 20px;">🎮 CHARACTER CONTROLS</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="color: #ff9900; border-bottom: 1px solid #ff9900;">Movement</h4>
                        <p><strong>W/S</strong> - Forward/Backward</p>
                        <p><strong>A/D</strong> - Left/Right</p>
                        <p><strong>SHIFT</strong> - Run</p>
                        <p><strong>SPACE</strong> - Jump</p>
                    </div>
                    
                    <div>
                        <h4 style="color: #ff9900; border-bottom: 1px solid #ff9900;">Camera</h4>
                        <p><strong>Mouse</strong> - Look Around</p>
                        <p><strong>Scroll</strong> - Zoom</p>
                        <p><strong>Click</strong> - Lock Pointer</p>
                        <p><strong>ESC</strong> - Unlock</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(0, 100, 0, 0.3); border-radius: 8px;">
                    <h4 style="color: #00ff00; margin-bottom: 10px;">🎯 Tips</h4>
                    <p>• Collect glowing crystals for points</p>
                    <p>• Explore the terrain and find NPCs</p>
                    <p>• Press G to switch to Space Flight</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: linear-gradient(135deg, #336633, #66aa66); 
                                   color: #ffffff; border: none; padding: 10px 20px; 
                                   border-radius: 8px; cursor: pointer; font-weight: bold;">
                        CLOSE
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(help);
    }
    
    updateCharacterData(charData) {
        // Update HUD with character data
        this.hud.updatePosition(charData.altitude, 0, 0);
        this.hud.updateScore(charData.score || 0, 0);
        
        // Update speed display
        const speedEl = document.getElementById('speed');
        if (speedEl) {
            speedEl.textContent = `${Math.round(charData.speed)} km/h (${charData.state})`;
        }
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
        
        // Use procedural ships - no broken external URLs!
        const shipTypes = ['fighter', 'bomber', 'interceptor', 'transport'];
        const randomType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
        this.advancedScene.loadSpaceship(randomType);
        
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
        
        console.log('🛸 Spaceship changed to:', randomType);
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
        this.flightDashboard.update({
            speed: Math.round(flightData.speed),
            altitude: Math.round(flightData.altitude),
            heading: Math.round(flightData.heading),
            boostEnergy: Math.round(flightData.boostEnergy),
            isBoosting: flightData.isBoosting
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
        
        // Position from current scene
        if (this.gameMode === 'space' && this.advancedScene && this.advancedScene.spaceship) {
            const pos = this.advancedScene.spaceship.position;
            this.hud.updatePosition(pos.x, pos.y, pos.z);
            this.hud.updateScore(this.advancedScene.score, this.advancedScene.crystalsCollected);
        } else if (this.gameMode === 'ground' && this.groundScene && this.groundScene.characterManager) {
            const pos = this.groundScene.characterManager.getPosition();
            this.hud.updatePosition(pos.x, pos.y, pos.z);
            this.hud.updateScore(this.groundScene.score || 0, 0);
        }
    }
    
    onWindowResize() {
        // Resize is handled by AdvancedThreeScene
        console.log('🖥️ Window resized - handled by AdvancedThreeScene');
    }
    
    destroy() {
        // Cleanup current scene
        if (this.sceneCleanup) {
            this.sceneCleanup();
            this.sceneCleanup = null;
        }
        
        // Cleanup ground scene
        if (this.groundScene) {
            this.groundScene.cleanup();
            this.groundScene = null;
        }
        
        // Cleanup advanced scene
        if (this.advancedScene) {
            this.advancedScene.cleanup();
            this.advancedScene = null;
        }
        
        // Cleanup flight dashboard
        if (this.flightDashboard) {
            this.flightDashboard.dispose();
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
