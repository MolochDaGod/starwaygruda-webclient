import * as THREE from 'three';
import { SWG_POIS, getPlanetPOIs, findNearestPOI } from '../data/poi-database.js';
import { NPC_SPAWNS, getPlanetSpawns, getSpawnsNearPosition, getTotalCreatureCount } from '../data/npc-spawns.js';

/**
 * WorldPopulator
 * Populates the 3D world with:
 * - Cities and buildings from POI database
 * - NPCs and creatures from spawn database
 * - Decorative objects and scenery
 */
export class WorldPopulator {
    constructor(scene, planetName = 'tatooine') {
        this.scene = scene;
        this.planetName = planetName;
        this.spawnedObjects = [];
        this.spawnedNPCs = [];
        
        // Load planet data
        this.planetData = getPlanetPOIs(planetName);
        this.spawnData = getPlanetSpawns(planetName);
        
        console.log(`🌍 WorldPopulator initialized for ${planetName}`);
        console.log(`   Cities: ${this.planetData?.cities?.length || 0}`);
        console.log(`   POIs: ${this.planetData?.pois?.length || 0}`);
        console.log(`   NPC spawns: ${this.spawnData?.creatures?.length || 0}`);
    }

    /**
     * Populate the entire world
     */
    async populate() {
        console.log(`\n🎨 Populating ${this.planetName}...`);
        
        const startTime = performance.now();
        
        // 1. Spawn cities and buildings
        this.spawnCities();
        
        // 2. Spawn POIs (landmarks, dungeons, etc.)
        this.spawnPOIs();
        
        // 3. Spawn NPCs and creatures
        this.spawnNPCs();
        
        // 4. Add decorative objects
        this.addDecoration();
        
        const elapsed = (performance.now() - startTime).toFixed(2);
        
        console.log(`✓ Population complete in ${elapsed}ms`);
        console.log(`   Total objects: ${this.spawnedObjects.length}`);
        console.log(`   Total NPCs: ${this.spawnedNPCs.length}`);
        
        return {
            objects: this.spawnedObjects.length,
            npcs: this.spawnedNPCs.length,
            cities: this.planetData?.cities?.length || 0,
            pois: this.planetData?.pois?.length || 0
        };
    }

    /**
     * Spawn all cities and their buildings
     */
    spawnCities() {
        if (!this.planetData?.cities) {
            console.log('   ⚠️  No cities to spawn');
            return;
        }

        console.log(`   🏙️  Spawning ${this.planetData.cities.length} cities...`);

        this.planetData.cities.forEach(city => {
            // City marker (center)
            const marker = this.createCityMarker(city);
            this.scene.add(marker);
            this.spawnedObjects.push(marker);

            // Spawn buildings
            if (city.buildings && city.buildings.length > 0) {
                city.buildings.forEach(building => {
                    const buildingMesh = this.createBuilding(building, city);
                    this.scene.add(buildingMesh);
                    this.spawnedObjects.push(buildingMesh);
                });
                
                console.log(`      ✓ ${city.name}: ${city.buildings.length} buildings`);
            } else {
                console.log(`      ✓ ${city.name}: marker only`);
            }
        });
    }

    /**
     * Spawn POIs (landmarks, dungeons, etc.)
     */
    spawnPOIs() {
        if (!this.planetData?.pois) {
            console.log('   ⚠️  No POIs to spawn');
            return;
        }

        console.log(`   📍 Spawning ${this.planetData.pois.length} POIs...`);

        this.planetData.pois.forEach(poi => {
            const poiMarker = this.createPOIMarker(poi);
            this.scene.add(poiMarker);
            this.spawnedObjects.push(poiMarker);
        });
    }

    /**
     * Spawn NPCs and creatures
     */
    spawnNPCs() {
        if (!this.spawnData?.creatures) {
            console.log('   ⚠️  No NPCs to spawn');
            return;
        }

        console.log(`   👥 Spawning NPCs and creatures...`);

        let totalSpawned = 0;

        this.spawnData.creatures.forEach(spawnDef => {
            const count = spawnDef.count || 1;
            
            for (let i = 0; i < count; i++) {
                const npc = this.createNPC(spawnDef, i);
                this.scene.add(npc);
                this.spawnedNPCs.push(npc);
                totalSpawned++;
            }
        });

        console.log(`      ✓ Spawned ${totalSpawned} NPCs/creatures`);
    }

    /**
     * Add decorative objects (trees, rocks, etc.)
     */
    addDecoration() {
        console.log(`   🌳 Adding decoration...`);
        
        // Add trees near cities
        let treeCount = 0;
        
        if (this.planetData?.cities) {
            this.planetData.cities.forEach(city => {
                // Only add trees on green planets
                if (this.planetName === 'naboo' || this.planetName === 'corellia' || this.planetName === 'endor') {
                    const trees = this.addTreesNearCity(city, 20);
                    treeCount += trees;
                }
            });
        }

        console.log(`      ✓ Added ${treeCount} trees`);
    }

    /**
     * Create a city center marker
     */
    createCityMarker(city) {
        const geometry = new THREE.CylinderGeometry(30, 30, 3, 32);
        const material = new THREE.MeshStandardMaterial({
            color: this.getCityColor(city.type),
            emissive: this.getCityColor(city.type),
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });

        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(city.position.x, city.position.y + 1.5, city.position.z);
        marker.castShadow = false;
        marker.receiveShadow = true;
        
        marker.userData = {
            type: 'city_marker',
            cityName: city.name,
            cityType: city.type,
            radius: city.radius,
            interactive: true
        };

        return marker;
    }

    /**
     * Create a building mesh
     */
    createBuilding(building, city) {
        const size = this.getBuildingSize(building.name);
        const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
        const material = new THREE.MeshStandardMaterial({
            color: this.getBuildingColor(building.name),
            roughness: 0.8,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(building.x, building.y + size.height / 2, building.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            type: 'building',
            name: building.name,
            city: city.name,
            interactive: true
        };

        return mesh;
    }

    /**
     * Create POI marker
     */
    createPOIMarker(poi) {
        const geometry = new THREE.SphereGeometry(8, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.getPOIColor(poi.type),
            emissive: this.getPOIColor(poi.type),
            emissiveIntensity: 0.5
        });

        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(poi.x, poi.y + 15, poi.z);
        marker.castShadow = false;

        marker.userData = {
            type: 'poi_marker',
            poiName: poi.name,
            poiType: poi.type,
            interactive: true
        };

        return marker;
    }

    /**
     * Create NPC/creature mesh
     */
    createNPC(spawnDef, index) {
        // Calculate position with random offset within spawn radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnDef.radius;
        const offsetX = Math.cos(angle) * distance;
        const offsetZ = Math.sin(angle) * distance;

        const x = spawnDef.x + offsetX;
        const z = spawnDef.z + offsetZ;

        // Create mesh based on NPC type
        const size = this.getNPCSize(spawnDef.type);
        const geometry = new THREE.CapsuleGeometry(size.radius, size.height, 8, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.getNPCColor(spawnDef.faction),
            roughness: 0.7
        });

        const npc = new THREE.Mesh(geometry, material);
        npc.position.set(x, spawnDef.y + size.height / 2, z);
        npc.castShadow = true;
        npc.receiveShadow = true;

        // Random rotation
        npc.rotation.y = Math.random() * Math.PI * 2;

        npc.userData = {
            type: 'npc',
            name: spawnDef.name,
            npcType: spawnDef.type,
            faction: spawnDef.faction,
            level: spawnDef.level,
            hostile: spawnDef.hostile || false,
            dialog: spawnDef.dialog || [],
            template: spawnDef.template,
            interactive: true,
            spawnIndex: index
        };

        return npc;
    }

    /**
     * Add trees near a city
     */
    addTreesNearCity(city, count) {
        const treeRadius = city.radius * 1.5; // Spawn trees outside city
        let spawned = 0;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = city.radius + Math.random() * treeRadius;
            const x = city.position.x + Math.cos(angle) * distance;
            const z = city.position.z + Math.sin(angle) * distance;

            const tree = this.createTree(x, city.position.y, z);
            this.scene.add(tree);
            this.spawnedObjects.push(tree);
            spawned++;
        }

        return spawned;
    }

    /**
     * Create a tree
     */
    createTree(x, y, z) {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(1, 1.5, 8, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3520 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, y + 4, z);

        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(5, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, y + 10, z);

        // Group
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(foliage);
        tree.position.set(0, 0, 0);
        tree.castShadow = true;
        tree.receiveShadow = true;

        tree.userData = { type: 'tree', decorative: true };

        return tree;
    }

    /**
     * Get city color based on type
     */
    getCityColor(type) {
        const colors = {
            capital: 0xffaa00,
            city: 0xff8800,
            outpost: 0xffcc00,
            pirate_base: 0xff0000,
            default: 0xffd700
        };
        return colors[type] || colors.default;
    }

    /**
     * Get building size based on name
     */
    getBuildingSize(name) {
        const lower = name.toLowerCase();
        
        if (lower.includes('starport')) return { width: 60, height: 30, depth: 60 };
        if (lower.includes('cantina')) return { width: 40, height: 20, depth: 40 };
        if (lower.includes('palace')) return { width: 80, height: 40, depth: 80 };
        if (lower.includes('capitol')) return { width: 70, height: 35, depth: 70 };
        if (lower.includes('hospital') || lower.includes('medical')) return { width: 35, height: 18, depth: 35 };
        if (lower.includes('bazaar')) return { width: 50, height: 15, depth: 50 };
        
        return { width: 30, height: 15, depth: 30 };
    }

    /**
     * Get building color based on name
     */
    getBuildingColor(name) {
        const lower = name.toLowerCase();
        
        if (lower.includes('starport')) return 0x808080;
        if (lower.includes('cantina')) return 0xa0826d;
        if (lower.includes('palace')) return 0xffd700;
        if (lower.includes('capitol')) return 0xb0b0b0;
        if (lower.includes('medical') || lower.includes('hospital')) return 0xffffff;
        if (lower.includes('bazaar')) return 0xd4af37;
        
        return 0xcccccc;
    }

    /**
     * Get POI color based on type
     */
    getPOIColor(type) {
        const colors = {
            ruins: 0x8b4513,
            landmark: 0x00ffff,
            dungeon: 0xff0000,
            imperial: 0x00ff00,
            rebel: 0xff6600,
            village: 0xffff00,
            camp: 0xff9900,
            spawn: 0xff00ff,
            default: 0xffffff
        };
        return colors[type] || colors.default;
    }

    /**
     * Get NPC size based on type
     */
    getNPCSize(type) {
        if (type === 'creature') {
            return { radius: 1.5, height: 2 };
        }
        return { radius: 0.4, height: 1.8 };
    }

    /**
     * Get NPC color based on faction
     */
    getNPCColor(faction) {
        const colors = {
            imperial: 0x4a4a4a,
            rebel: 0xff8800,
            neutral: 0x88aaff,
            corsec: 0x0044aa,
            naboo: 0xffaa00,
            gungan: 0xff6600,
            ewok: 0x8b4513,
            pirate: 0xff0000,
            nightsister: 0x660066,
            jawa: 0xaa6600,
            tusken: 0x8b7355,
            default: 0xaaaaaa
        };
        return colors[faction] || colors.default;
    }

    /**
     * Find nearest interactive object to position
     */
    findNearestInteractive(position, maxDistance = 100) {
        let nearest = null;
        let nearestDist = maxDistance;

        [...this.spawnedObjects, ...this.spawnedNPCs].forEach(obj => {
            if (!obj.userData.interactive) return;

            const dist = position.distanceTo(obj.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = obj;
            }
        });

        return nearest ? { object: nearest, distance: nearestDist } : null;
    }

    /**
     * Get NPCs near position
     */
    getNPCsNearPosition(position, radius = 100) {
        return this.spawnedNPCs.filter(npc => {
            const dist = position.distanceTo(npc.position);
            return dist <= radius;
        });
    }

    /**
     * Clean up all spawned objects
     */
    dispose() {
        console.log('🧹 Cleaning up world population...');

        [...this.spawnedObjects, ...this.spawnedNPCs].forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });

        this.spawnedObjects = [];
        this.spawnedNPCs = [];
    }

    /**
     * Get population stats
     */
    getStats() {
        return {
            planet: this.planetName,
            cities: this.planetData?.cities?.length || 0,
            pois: this.planetData?.pois?.length || 0,
            objects: this.spawnedObjects.length,
            npcs: this.spawnedNPCs.length,
            totalCreatures: getTotalCreatureCount()
        };
    }
}
