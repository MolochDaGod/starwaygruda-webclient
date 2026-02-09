import * as THREE from 'three';
import { gameState } from './GameStateManager.js';

/**
 * TargetingSystem - Handles entity targeting for combat and interactions
 * Based on SWG targeting mechanics
 */
export class TargetingSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Targeting settings
        this.maxTargetRange = 64; // meters (SWG standard)
        this.tabTargetIndex = 0;
        this.tabTargetList = [];
        
        // Raycaster for click targeting
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = this.maxTargetRange;
        
        // Visual indicators
        this.targetIndicator = null;
        this.targetLock = null;
        
        // Setup input handlers
        this.setupInput();
        
        // Create visual indicator
        this.createTargetIndicator();
        
        console.log('🎯 TargetingSystem initialized');
    }
    
    /**
     * Setup keyboard and mouse input
     */
    setupInput() {
        // Tab targeting
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.tabTargetPrevious();
                } else {
                    this.tabTargetNext();
                }
            }
            
            // Escape to clear target
            if (e.key === 'Escape') {
                this.clearTarget();
            }
            
            // Assist target (target of target)
            if (e.key === 'F1') {
                this.targetSelf();
            }
        });
        
        // Click targeting
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !gameState.getState().ui.radialMenuOpen) {
                // Left click - select target
                this.clickTarget(e);
            }
        });
    }
    
    /**
     * Create visual target indicator
     */
    createTargetIndicator() {
        // Ring indicator under targeted entity
        const geometry = new THREE.RingGeometry(1.2, 1.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        this.targetIndicator = new THREE.Mesh(geometry, material);
        this.targetIndicator.rotation.x = -Math.PI / 2;
        this.targetIndicator.visible = false;
        this.scene.add(this.targetIndicator);
        
        // Arrow indicator above target
        const arrowGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.targetArrow = new THREE.Mesh(arrowGeo, arrowMat);
        this.targetArrow.rotation.x = Math.PI;
        this.targetArrow.visible = false;
        this.scene.add(this.targetArrow);
    }
    
    /**
     * Handle click targeting via raycasting
     */
    clickTarget(event) {
        // Calculate mouse position in normalized device coordinates
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        this.raycaster.setFromCamera(mouse, this.camera);
        
        // Get all targetable objects
        const targetables = this.getTargetableObjects();
        const intersects = this.raycaster.intersectObjects(targetables, true);
        
        if (intersects.length > 0) {
            const target = this.findParentEntity(intersects[0].object);
            if (target && target.userData.entityId) {
                this.setTarget(target.userData.entityId);
            }
        }
    }
    
    /**
     * Tab to next target
     */
    tabTargetNext() {
        this.updateTabTargetList();
        
        if (this.tabTargetList.length === 0) return;
        
        this.tabTargetIndex = (this.tabTargetIndex + 1) % this.tabTargetList.length;
        this.setTarget(this.tabTargetList[this.tabTargetIndex]);
    }
    
    /**
     * Tab to previous target
     */
    tabTargetPrevious() {
        this.updateTabTargetList();
        
        if (this.tabTargetList.length === 0) return;
        
        this.tabTargetIndex = (this.tabTargetIndex - 1 + this.tabTargetList.length) % this.tabTargetList.length;
        this.setTarget(this.tabTargetList[this.tabTargetIndex]);
    }
    
    /**
     * Update list of targetable entities sorted by distance
     */
    updateTabTargetList() {
        const playerPos = gameState.getState().player.position;
        const entities = gameState.getState().entities;
        
        this.tabTargetList = [];
        
        entities.forEach((entity, id) => {
            if (!entity.targetable) return;
            
            // Calculate distance
            const dx = entity.position.x - playerPos.x;
            const dz = entity.position.z - playerPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= this.maxTargetRange) {
                this.tabTargetList.push({
                    id,
                    distance,
                    hostile: entity.hostile || false
                });
            }
        });
        
        // Sort: hostile first, then by distance
        this.tabTargetList.sort((a, b) => {
            if (a.hostile !== b.hostile) return b.hostile - a.hostile;
            return a.distance - b.distance;
        });
        
        this.tabTargetList = this.tabTargetList.map(e => e.id);
    }
    
    /**
     * Set current target
     */
    setTarget(entityId) {
        const entity = gameState.getEntity(entityId);
        if (!entity) return;
        
        // Determine target type
        let targetType = 'creature';
        if (entity.type === 'npc') targetType = 'npc';
        if (entity.type === 'player') targetType = 'player';
        if (entity.type === 'resource') targetType = 'resource';
        if (entity.type === 'object') targetType = 'object';
        
        gameState.setTarget(entityId, targetType);
        
        // Update visual indicator color based on hostility
        this.updateTargetIndicatorColor(entity.hostile);
        
        console.log(`🎯 Target: ${entity.name || entityId}`);
    }
    
    /**
     * Clear current target
     */
    clearTarget() {
        gameState.clearTarget();
        this.targetIndicator.visible = false;
        this.targetArrow.visible = false;
        this.tabTargetIndex = -1;
    }
    
    /**
     * Target self
     */
    targetSelf() {
        gameState.setTarget('player-1', 'player');
        this.updateTargetIndicatorColor(false);
    }
    
    /**
     * Update target indicator color
     */
    updateTargetIndicatorColor(hostile) {
        const color = hostile ? 0xff0000 : 0x00ff00;
        this.targetIndicator.material.color.setHex(color);
        this.targetArrow.material.color.setHex(color);
    }
    
    /**
     * Get all targetable objects from scene
     */
    getTargetableObjects() {
        const targetables = [];
        
        this.scene.traverse((object) => {
            if (object.userData.targetable || object.userData.entityId) {
                targetables.push(object);
            }
        });
        
        return targetables;
    }
    
    /**
     * Find parent entity from child mesh
     */
    findParentEntity(object) {
        let current = object;
        while (current) {
            if (current.userData.entityId) return current;
            current = current.parent;
        }
        return null;
    }
    
    /**
     * Check if entity is in range
     */
    isInRange(entityId, range = null) {
        const entity = gameState.getEntity(entityId);
        if (!entity) return false;
        
        const playerPos = gameState.getState().player.position;
        const maxRange = range || this.maxTargetRange;
        
        const dx = entity.position.x - playerPos.x;
        const dz = entity.position.z - playerPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        return distance <= maxRange;
    }
    
    /**
     * Get distance to target
     */
    getDistanceToTarget() {
        const targetId = gameState.getState().target;
        if (!targetId) return Infinity;
        
        const entity = gameState.getEntity(targetId);
        if (!entity) return Infinity;
        
        const playerPos = gameState.getState().player.position;
        const dx = entity.position.x - playerPos.x;
        const dy = entity.position.y - playerPos.y;
        const dz = entity.position.z - playerPos.z;
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Get target entity data
     */
    getTargetData() {
        const targetId = gameState.getState().target;
        if (!targetId) return null;
        
        return gameState.getEntity(targetId);
    }
    
    /**
     * Update method - call from game loop
     */
    update(delta) {
        const targetId = gameState.getState().target;
        
        if (targetId && targetId !== 'player-1') {
            const entity = gameState.getEntity(targetId);
            
            if (entity && entity.mesh) {
                // Position indicator under target
                this.targetIndicator.position.copy(entity.mesh.position);
                this.targetIndicator.position.y = 0.1;
                this.targetIndicator.visible = true;
                
                // Position arrow above target
                this.targetArrow.position.copy(entity.mesh.position);
                this.targetArrow.position.y = entity.height || 3;
                this.targetArrow.visible = true;
                
                // Rotate arrow
                this.targetArrow.rotation.y += delta * 2;
                
                // Pulse indicator
                const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
                this.targetIndicator.scale.set(pulse, pulse, 1);
            }
        } else {
            this.targetIndicator.visible = false;
            this.targetArrow.visible = false;
        }
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this.targetIndicator) {
            this.scene.remove(this.targetIndicator);
            this.targetIndicator.geometry.dispose();
            this.targetIndicator.material.dispose();
        }
        
        if (this.targetArrow) {
            this.scene.remove(this.targetArrow);
            this.targetArrow.geometry.dispose();
            this.targetArrow.material.dispose();
        }
    }
}

export default TargetingSystem;
