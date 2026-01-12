import * as THREE from 'three';
import { getPlanetPOIs, findNearestPOI, isInWater } from '../data/poi-database.js';
import { SWGWorldLoader } from './SWGWorldLoader.js';

/**
 * GameWorld - Wrapper for SWG World Loader
 * Manages the planet environment and objects
 */
export class GameWorld {
    constructor(scene, terrainData, planetName = 'tatooine') {
        this.scene = scene;
        this.planetName = planetName;
        this.worldLoader = null;
        this.poiData = getPlanetPOIs(planetName);
        
        console.log(`🌍 Initializing ${this.poiData.name}...`);
        
        // Use SWG World Loader for authentic planets
        this.initSWGWorld();
    }
    
    async initSWGWorld() {
        this.worldLoader = new SWGWorldLoader(this.scene, this.planetName);
        const planetData = await this.worldLoader.load();
        console.log(`✓ ${planetData.name} loaded - REAL SWG DATA!`);
    }
    
    update(delta, cameraPosition) {
        // Future: LOD management, chunk streaming
        // Currently all objects are static and managed by SWGWorldLoader
    }
}
