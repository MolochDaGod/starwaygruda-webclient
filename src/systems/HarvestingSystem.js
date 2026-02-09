import * as THREE from 'three';
import { gameState } from './GameStateManager.js';

/**
 * SWG-Style Harvesting System
 * - Resource surveying and sampling
 * - Creature harvesting (meat, hide, bone)
 * - Resource quality and concentration
 */

// ==================== RESOURCE TYPES ====================

export const RESOURCE_TYPES = {
    // Minerals
    iron: { id: 'iron', name: 'Iron', category: 'mineral', color: 0x8b4513, xpType: 'crafting', baseYield: 10 },
    copper: { id: 'copper', name: 'Copper', category: 'mineral', color: 0xb87333, xpType: 'crafting', baseYield: 8 },
    aluminum: { id: 'aluminum', name: 'Aluminum', category: 'mineral', color: 0xc0c0c0, xpType: 'crafting', baseYield: 6 },
    steel: { id: 'steel', name: 'Steel', category: 'mineral', color: 0x71797e, xpType: 'crafting', baseYield: 5 },
    
    // Organic
    flora: { id: 'flora', name: 'Wild Flora', category: 'organic', color: 0x228b22, xpType: 'scouting', baseYield: 15 },
    wood: { id: 'wood', name: 'Wood', category: 'organic', color: 0x8b4513, xpType: 'scouting', baseYield: 12 },
    
    // Energy
    radioactive: { id: 'radioactive', name: 'Radioactive', category: 'energy', color: 0x00ff00, xpType: 'crafting', baseYield: 3 },
    solar: { id: 'solar', name: 'Solar Energy', category: 'energy', color: 0xffff00, xpType: 'crafting', baseYield: 8 },
    
    // Creature Resources
    meat: { id: 'meat', name: 'Creature Meat', category: 'creature', color: 0xcc3333, xpType: 'scouting', baseYield: 5 },
    hide: { id: 'hide', name: 'Creature Hide', category: 'creature', color: 0x8b4513, xpType: 'scouting', baseYield: 3 },
    bone: { id: 'bone', name: 'Creature Bone', category: 'creature', color: 0xf5f5dc, xpType: 'scouting', baseYield: 2 }
};

// ==================== HARVESTING SYSTEM ====================

export class HarvestingSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Resource nodes in the world
        this.resourceNodes = new Map();
        
        // Harvesting state
        this.isHarvesting = false;
        this.harvestProgress = 0;
        this.harvestTarget = null;
        this.harvestInterval = null;
        
        // Settings
        this.harvestTime = 3000; // 3 seconds base
        this.harvestRange = 5;
        
        // Survey results
        this.surveyResults = [];
        this.surveyRadius = 64;
        
        // Subscribe to events
        gameState.on('harvestStart', this.onHarvestStart.bind(this));
        gameState.on('harvestCancel', this.onHarvestCancel.bind(this));
        
        console.log('⛏️ HarvestingSystem initialized');
    }
    
    /**
     * Create a resource node in the world
     */
    createResourceNode(type, x, y, z, quality = 50, concentration = 50) {
        const resourceType = RESOURCE_TYPES[type];
        if (!resourceType) {
            console.warn(`Unknown resource type: ${type}`);
            return null;
        }
        
        const id = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create visual representation
        const geometry = new THREE.DodecahedronGeometry(0.8, 0);
        const material = new THREE.MeshStandardMaterial({
            color: resourceType.color,
            emissive: resourceType.color,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.6
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.8, z);
        mesh.userData = {
            entityId: id,
            type: 'resource',
            targetable: true,
            resourceType: type
        };
        mesh.castShadow = true;
        
        // Add glow effect
        const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: resourceType.color,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glow);
        
        this.scene.add(mesh);
        
        const node = {
            id,
            type,
            resourceType,
            position: { x, y, z },
            quality,           // 1-100, affects crafting results
            concentration,     // 1-100, affects yield
            depleted: false,
            mesh,
            harvestCount: 0,
            maxHarvests: Math.floor(concentration / 10) + 3
        };
        
        this.resourceNodes.set(id, node);
        
        // Register with game state
        gameState.registerEntity({
            id,
            type: 'resource',
            name: resourceType.name,
            position: { x, y, z },
            targetable: true,
            hostile: false,
            mesh,
            resourceData: node
        });
        
        return node;
    }
    
    /**
     * Survey for resources in area
     */
    survey(playerPosition, radius = null) {
        const surveyRadius = radius || this.surveyRadius;
        const results = [];
        
        // Find all resources within radius
        this.resourceNodes.forEach((node, id) => {
            if (node.depleted) return;
            
            const dx = node.position.x - playerPosition.x;
            const dz = node.position.z - playerPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= surveyRadius) {
                results.push({
                    id,
                    type: node.type,
                    name: node.resourceType.name,
                    distance: Math.round(distance),
                    direction: this.getDirection(dx, dz),
                    quality: node.quality,
                    concentration: node.concentration
                });
            }
        });
        
        // Sort by distance
        results.sort((a, b) => a.distance - b.distance);
        
        this.surveyResults = results;
        
        // Grant survey XP
        gameState.addExperience('crafting', 5);
        
        console.log(`📡 Survey found ${results.length} resource nodes`);
        gameState.emit('surveyComplete', { results, radius: surveyRadius });
        
        return results;
    }
    
    /**
     * Get compass direction
     */
    getDirection(dx, dz) {
        const angle = Math.atan2(dx, dz) * (180 / Math.PI);
        
        if (angle >= -22.5 && angle < 22.5) return 'N';
        if (angle >= 22.5 && angle < 67.5) return 'NE';
        if (angle >= 67.5 && angle < 112.5) return 'E';
        if (angle >= 112.5 && angle < 157.5) return 'SE';
        if (angle >= 157.5 || angle < -157.5) return 'S';
        if (angle >= -157.5 && angle < -112.5) return 'SW';
        if (angle >= -112.5 && angle < -67.5) return 'W';
        if (angle >= -67.5 && angle < -22.5) return 'NW';
        
        return 'N';
    }
    
    /**
     * Start harvesting a resource node
     */
    startHarvest(nodeId) {
        const node = this.resourceNodes.get(nodeId);
        if (!node) {
            console.warn('Resource node not found');
            return false;
        }
        
        if (node.depleted) {
            console.warn('Resource is depleted');
            gameState.emit('harvestFailed', { reason: 'depleted' });
            return false;
        }
        
        // Check range
        const playerPos = gameState.getState().player.position;
        const dx = node.position.x - playerPos.x;
        const dz = node.position.z - playerPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > this.harvestRange) {
            console.warn('Too far to harvest');
            gameState.emit('harvestFailed', { reason: 'outOfRange' });
            return false;
        }
        
        // Check if already harvesting
        if (this.isHarvesting) {
            this.cancelHarvest();
        }
        
        this.isHarvesting = true;
        this.harvestTarget = node;
        this.harvestProgress = 0;
        
        gameState.startHarvesting(node);
        
        // Start harvest progress
        const progressInterval = 100; // Update every 100ms
        const progressStep = progressInterval / this.harvestTime;
        
        this.harvestInterval = setInterval(() => {
            this.harvestProgress += progressStep;
            gameState.updateHarvestProgress(this.harvestProgress);
            
            if (this.harvestProgress >= 1) {
                this.completeHarvest();
            }
        }, progressInterval);
        
        console.log(`⛏️ Started harvesting ${node.resourceType.name}`);
        return true;
    }
    
    /**
     * Complete harvesting
     */
    completeHarvest() {
        if (!this.harvestTarget) return;
        
        clearInterval(this.harvestInterval);
        
        const node = this.harvestTarget;
        const resourceType = node.resourceType;
        
        // Calculate yield based on concentration and quality
        const baseYield = resourceType.baseYield;
        const concentrationBonus = node.concentration / 100;
        const qualityBonus = node.quality / 100;
        
        // Get player harvest bonus from skills
        const state = gameState.getState();
        let skillBonus = 1;
        // Would check for scout skills etc.
        
        const harvestAmount = Math.floor(baseYield * concentrationBonus * skillBonus * (0.8 + Math.random() * 0.4));
        
        // Create resource item
        const resource = {
            id: `${node.type}-${Date.now()}`,
            name: resourceType.name,
            type: 'resource',
            resourceType: node.type,
            quantity: harvestAmount,
            quality: node.quality,
            stackable: true
        };
        
        // Add to inventory
        gameState.addItem(resource);
        
        // Grant XP
        const xpAmount = harvestAmount * 5;
        gameState.addExperience(resourceType.xpType, xpAmount);
        
        // Update node
        node.harvestCount++;
        if (node.harvestCount >= node.maxHarvests) {
            node.depleted = true;
            node.mesh.material.emissiveIntensity = 0;
            node.mesh.material.opacity = 0.5;
            node.mesh.material.transparent = true;
        }
        
        this.isHarvesting = false;
        this.harvestTarget = null;
        this.harvestProgress = 0;
        
        gameState.completeHarvesting([resource]);
        
        console.log(`✅ Harvested ${harvestAmount}x ${resourceType.name} (+${xpAmount} ${resourceType.xpType} XP)`);
    }
    
    /**
     * Cancel harvesting
     */
    cancelHarvest() {
        if (this.harvestInterval) {
            clearInterval(this.harvestInterval);
        }
        
        this.isHarvesting = false;
        this.harvestTarget = null;
        this.harvestProgress = 0;
        
        gameState.cancelHarvesting();
    }
    
    /**
     * Harvest a dead creature
     */
    harvestCreature(creatureId, harvestType = 'meat') {
        const creature = gameState.getEntity(creatureId);
        if (!creature || !creature.dead) {
            console.warn('Cannot harvest - creature not dead');
            return false;
        }
        
        if (creature.harvested) {
            console.warn('Creature already harvested');
            return false;
        }
        
        const resourceType = RESOURCE_TYPES[harvestType];
        if (!resourceType) return false;
        
        // Calculate harvestAmount based on creature level
        const creatureLevel = creature.level || 1;
        const harvestAmount = Math.floor((resourceType.baseYield + creatureLevel) * (0.8 + Math.random() * 0.4));
        
        // Random quality based on creature
        const quality = Math.floor(30 + Math.random() * 50 + creatureLevel);
        
        const resource = {
            id: `${harvestType}-${Date.now()}`,
            name: resourceType.name,
            type: 'resource',
            resourceType: harvestType,
            quantity: harvestAmount,
            quality: Math.min(100, quality),
            stackable: true,
            source: creature.name
        };
        
        gameState.addItem(resource);
        
        // Mark creature as harvested for this type
        if (!creature.harvestedTypes) creature.harvestedTypes = [];
        creature.harvestedTypes.push(harvestType);
        
        // Check if fully harvested
        const harvestableTypes = ['meat', 'hide', 'bone'];
        if (harvestableTypes.every(t => creature.harvestedTypes.includes(t))) {
            creature.harvested = true;
        }
        
        // Grant XP
        const xpAmount = harvestAmount * 10;
        gameState.addExperience('scouting', xpAmount);
        
        console.log(`🦴 Harvested ${harvestAmount}x ${resourceType.name} from ${creature.name}`);
        gameState.emit('creatureHarvested', { creature, resource, harvestType });
        
        return resource;
    }
    
    /**
     * Handle harvest start event
     */
    onHarvestStart(node) {
        // Could trigger animations, sounds, etc.
    }
    
    /**
     * Handle harvest cancel event
     */
    onHarvestCancel() {
        if (this.harvestInterval) {
            clearInterval(this.harvestInterval);
        }
    }
    
    /**
     * Spawn random resources in area
     */
    spawnResourcesInArea(centerX, centerZ, radius, count = 10) {
        const resourceTypes = Object.keys(RESOURCE_TYPES).filter(
            t => RESOURCE_TYPES[t].category !== 'creature'
        );
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            const x = centerX + Math.cos(angle) * dist;
            const z = centerZ + Math.sin(angle) * dist;
            const y = 0; // Should get terrain height
            
            const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const quality = Math.floor(20 + Math.random() * 80);
            const concentration = Math.floor(20 + Math.random() * 80);
            
            this.createResourceNode(type, x, y, z, quality, concentration);
        }
        
        console.log(`⛏️ Spawned ${count} resource nodes`);
    }
    
    /**
     * Update - animate resource nodes
     */
    update(delta) {
        const time = performance.now() / 1000;
        
        this.resourceNodes.forEach(node => {
            if (node.mesh && !node.depleted) {
                // Float animation
                node.mesh.position.y = node.position.y + 0.8 + Math.sin(time * 2 + node.position.x) * 0.1;
                node.mesh.rotation.y += delta * 0.5;
            }
        });
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this.harvestInterval) {
            clearInterval(this.harvestInterval);
        }
        
        this.resourceNodes.forEach(node => {
            if (node.mesh) {
                this.scene.remove(node.mesh);
                node.mesh.geometry.dispose();
                node.mesh.material.dispose();
            }
        });
        
        this.resourceNodes.clear();
    }
}

export default HarvestingSystem;
