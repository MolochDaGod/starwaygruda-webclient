import * as THREE from 'three';
import { GameWorld } from './world/GameWorld.js';
import { PlayerController } from './player/PlayerController.js';
import { APIClient } from './api/APIClient.js';
import { AssetLoader } from './loaders/AssetLoader.js';
import { HDAssetLoader, FREE_SW_ASSETS } from './loaders/HDAssetLoader.js';
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
        this.api = new APIClient('http://localhost:44453'); // WSL SWGEmu server
        this.assetLoader = new AssetLoader();
        if (EXPERIMENT_HD) {
            this.hdLoader = new HDAssetLoader(this.renderer);
        }
        this.world = null;
        this.player = null;
        this.hud = new HUD();
        this.toolbar = new Toolbar();
        this.codeEditor = new CodeEditor();
        this.currentPlanet = 'tatooine';
        this.characterSelection = null;
        this.selectedCharacter = null;
        
        // Performance tracking
        this.clock = new THREE.Clock();
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
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
                    this.currentPlanet = event.detail.planet.toLowerCase();
                    resolve();
                }, { once: true });
            });
            
            // Show loading screen again
            this.loadingScreen.classList.remove('hidden');
            
            // Loading sequence
            await this.updateLoading('Connecting to server...', 20);
            await this.api.connect();
            
            await this.updateLoading('Loading terrain data...', 30);
            // Load SWG terrain heightmaps and textures
            const terrainData = await this.assetLoader.loadTerrain('tatooine');
            
            if (EXPERIMENT_HD) {
                await this.updateLoading('Loading HDR environment...', 45);
                const env = await this.hdLoader.loadEnvironment('/textures/sky/desert.hdr');
                this.scene.environment = env;
                this.scene.background = env;
            }

            await this.updateLoading('Loading game assets...', 55);
            // Load .iff models, .tre textures, etc.
            await this.assetLoader.loadGameAssets();
            
            if (EXPERIMENT_HD) {
            // Quick HD proof: load a ship and a building model
            await this.updateLoading('Loading HD models...', 65);
            const xwing = await this.hdLoader.loadModel('/models/ships/xwing.glb', { castShadow: true, receiveShadow: true });
            xwing.position.set(3528 + 30, 20, -4804 - 30);
            this.scene.add(xwing);

            const cantina = await this.hdLoader.loadModel('/models/buildings/cantina.glb', { castShadow: true, receiveShadow: true });
            cantina.position.set(3528 - 40, 10, -4804 + 20);
            this.scene.add(cantina);

            }
            await this.updateLoading('Creating world...', 75);
            this.world = new GameWorld(this.scene, terrainData, this.currentPlanet);
            
            await this.updateLoading('Spawning player...', 85);
            this.player = new PlayerController(this.camera, this.scene);
            
            // Set spawn location (Bestine on Tatooine - smaller spaceport)
            this.player.setPosition(-1290, 12, -3590);
            
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
        
        // Start render loop
        this.animate();
        
        // Setup event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('🎮 StarWayGRUDA client started!');
    }
    
    setupLighting() {
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
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update game systems
        if (this.player) {
            this.player.update(delta);
        }
        
        if (this.world) {
            this.world.update(delta, this.camera.position);
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
