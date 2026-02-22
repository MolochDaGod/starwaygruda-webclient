import * as THREE from 'three';
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from './GameStateManager.js';

/**
 * WoW-Style Tab Targeting System
 * 
 * Features:
 * - Tab cycles through hostile targets (prioritized)
 * - Shift+Tab cycles backwards
 * - Targets sorted by angle from camera (nearest to crosshair first)
 * - Click to target
 * - Visual selection ring under target
 * - Escape clears target
 */
export class WoWTargetingSystem {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        
        // Configuration
        this.config = {
            maxRange: options.maxRange || 50,
            tabPrioritizeHostile: options.tabPrioritizeHostile !== false,
            coneAngle: options.coneAngle || Math.PI / 3, // 60 degree cone in front
            showSelectionRing: options.showSelectionRing !== false,
            ringColor: options.ringColor || 0xff4444,
            friendlyRingColor: options.friendlyRingColor || 0x44ff44,
            neutralRingColor: options.neutralRingColor || 0xffff44
        };
        
        // State
        this.currentTarget = null;
        this.targetIndex = -1;
        this.targetList = [];
        this.targetableEntities = new Map(); // id -> entity data
        
        // Visual elements
        this.selectionRing = null;
        this.selectionArrow = null;
        
        // Raycaster for click targeting
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = this.config.maxRange;
        
        // Player position reference
        this.playerPosition = new THREE.Vector3();
        this.playerForward = new THREE.Vector3(0, 0, -1);
        
        this.createVisuals();
        this.setupInput();
        
        console.log('🎯 WoW Targeting System initialized');
    }
    
    /**
     * Create selection ring and arrow visuals
     */
    createVisuals() {
        if (!this.config.showSelectionRing) return;
        
        // Selection ring (circle under target)
        const ringGeo = new THREE.RingGeometry(1.0, 1.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: this.config.ringColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
        this.selectionRing.rotation.x = -Math.PI / 2;
        this.selectionRing.visible = false;
        this.scene.add(this.selectionRing);
        
        // Pointing arrow above target
        const arrowGeo = new THREE.ConeGeometry(0.25, 0.5, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ 
            color: this.config.ringColor,
            transparent: true,
            opacity: 0.9
        });
        this.selectionArrow = new THREE.Mesh(arrowGeo, arrowMat);
        this.selectionArrow.rotation.x = Math.PI;
        this.selectionArrow.visible = false;
        this.scene.add(this.selectionArrow);
    }
    
    /**
     * Setup keyboard input for targeting
     */
    setupInput() {
        this._keyHandler = (e) => {
            // Escape to clear target
            if (e.key === 'Escape') {
                this.clearTarget();
            }
        };
        
        this._clickHandler = (e) => {
            if (e.button === 0) { // LMB
                this.clickTarget(e);
            }
        };
        
        document.addEventListener('keydown', this._keyHandler);
        document.addEventListener('mousedown', this._clickHandler);
    }
    
    /**
     * Register an entity as targetable
     */
    registerEntity(entity) {
        this.targetableEntities.set(entity.id, entity);
    }
    
    /**
     * Unregister an entity
     */
    unregisterEntity(entityId) {
        this.targetableEntities.delete(entityId);
        
        if (this.currentTarget && this.currentTarget.id === entityId) {
            this.clearTarget();
        }
    }
    
    /**
     * Update entity data
     */
    updateEntity(entityId, data) {
        if (this.targetableEntities.has(entityId)) {
            const entity = this.targetableEntities.get(entityId);
            Object.assign(entity, data);
            
            // Update target frame if this is current target
            if (this.currentTarget && this.currentTarget.id === entityId) {
                this.currentTarget = entity;
                eventBus.emit(GameEvents.TARGET_CHANGED, { target: this.currentTarget });
            }
        }
    }
    
    /**
     * Tab to next target
     */
    cycleTarget(direction = 1) {
        this.buildTargetList();
        
        if (this.targetList.length === 0) {
            this.clearTarget();
            return;
        }
        
        // Move to next/previous target
        this.targetIndex += direction;
        
        // Wrap around
        if (this.targetIndex >= this.targetList.length) {
            this.targetIndex = 0;
        } else if (this.targetIndex < 0) {
            this.targetIndex = this.targetList.length - 1;
        }
        
        this.setTarget(this.targetList[this.targetIndex]);
    }
    
    /**
     * Build sorted list of valid targets for tab targeting
     */
    buildTargetList() {
        const candidates = [];
        const cameraForward = new THREE.Vector3();
        this.camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;
        cameraForward.normalize();
        
        this.targetableEntities.forEach((entity, id) => {
            if (!entity.mesh && !entity.position) return;
            
            const entityPos = entity.mesh ? entity.mesh.position : 
                new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z);
            
            // Calculate distance
            const distance = this.playerPosition.distanceTo(entityPos);
            if (distance > this.config.maxRange) return;
            
            // Calculate angle from camera forward
            const toEntity = entityPos.clone().sub(this.playerPosition);
            toEntity.y = 0;
            toEntity.normalize();
            
            const angle = Math.acos(Math.max(-1, Math.min(1, cameraForward.dot(toEntity))));
            
            // Prioritize targets in front (within cone)
            const inCone = angle <= this.config.coneAngle;
            
            candidates.push({
                entity,
                distance,
                angle,
                inCone,
                hostile: entity.hostile || false
            });
        });
        
        // Sort: hostile first, then by angle (nearest to crosshair), then by distance
        candidates.sort((a, b) => {
            // Hostile priority
            if (this.config.tabPrioritizeHostile) {
                if (a.hostile !== b.hostile) return b.hostile - a.hostile;
            }
            
            // In-cone priority
            if (a.inCone !== b.inCone) return b.inCone - a.inCone;
            
            // Angle (nearest to center of view)
            if (Math.abs(a.angle - b.angle) > 0.1) return a.angle - b.angle;
            
            // Distance
            return a.distance - b.distance;
        });
        
        this.targetList = candidates.map(c => c.entity);
    }
    
    /**
     * Click to target via raycasting
     */
    clickTarget(event) {
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        this.raycaster.setFromCamera(mouse, this.camera);
        
        // Collect all meshes from targetable entities
        const meshes = [];
        this.targetableEntities.forEach((entity) => {
            if (entity.mesh) {
                meshes.push(entity.mesh);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            // Find the entity that owns this mesh
            const hitObject = intersects[0].object;
            let targetEntity = null;
            
            // Walk up the hierarchy to find the entity
            let current = hitObject;
            while (current) {
                this.targetableEntities.forEach((entity) => {
                    if (entity.mesh === current || entity.mesh?.children?.includes(current)) {
                        targetEntity = entity;
                    }
                });
                if (targetEntity) break;
                current = current.parent;
            }
            
            // Also check by userData
            if (!targetEntity && hitObject.userData.entityId) {
                targetEntity = this.targetableEntities.get(hitObject.userData.entityId);
            }
            
            if (targetEntity) {
                this.setTarget(targetEntity);
            }
        }
    }
    
    /**
     * Set the current target
     */
    setTarget(entity) {
        this.currentTarget = entity;
        
        // Update visual ring color
        if (this.selectionRing) {
            if (entity.hostile) {
                this.selectionRing.material.color.setHex(this.config.ringColor);
                this.selectionArrow.material.color.setHex(this.config.ringColor);
            } else if (entity.friendly) {
                this.selectionRing.material.color.setHex(this.config.friendlyRingColor);
                this.selectionArrow.material.color.setHex(this.config.friendlyRingColor);
            } else {
                this.selectionRing.material.color.setHex(this.config.neutralRingColor);
                this.selectionArrow.material.color.setHex(this.config.neutralRingColor);
            }
            
            this.selectionRing.visible = true;
            this.selectionArrow.visible = true;
        }
        
        // Update target index in list
        this.targetIndex = this.targetList.findIndex(e => e.id === entity.id);
        
        // Emit event for UI
        eventBus.emit(GameEvents.TARGET_CHANGED, { target: entity });
        
        // Also update game state
        if (gameState && gameState.setTarget) {
            gameState.setTarget(entity.id, entity.type || 'creature');
        }
        
        console.log(`🎯 Target: ${entity.name || entity.id}`);
    }
    
    /**
     * Clear current target
     */
    clearTarget() {
        this.currentTarget = null;
        this.targetIndex = -1;
        
        if (this.selectionRing) {
            this.selectionRing.visible = false;
            this.selectionArrow.visible = false;
        }
        
        eventBus.emit(GameEvents.TARGET_CHANGED, { target: null });
        
        if (gameState && gameState.clearTarget) {
            gameState.clearTarget();
        }
    }
    
    /**
     * Get current target
     */
    getTarget() {
        return this.currentTarget;
    }
    
    /**
     * Check if entity is current target
     */
    isTarget(entityId) {
        return this.currentTarget && this.currentTarget.id === entityId;
    }
    
    /**
     * Update player position for distance calculations
     */
    setPlayerPosition(position) {
        this.playerPosition.copy(position);
    }
    
    /**
     * Update loop - call each frame
     */
    update(deltaTime) {
        // Update selection ring position
        if (this.currentTarget && this.selectionRing && this.selectionRing.visible) {
            const targetPos = this.currentTarget.mesh ? 
                this.currentTarget.mesh.position : 
                new THREE.Vector3(
                    this.currentTarget.position.x,
                    this.currentTarget.position.y,
                    this.currentTarget.position.z
                );
            
            // Ring at ground level
            this.selectionRing.position.set(targetPos.x, 0.1, targetPos.z);
            
            // Arrow above target
            const height = this.currentTarget.height || 2.5;
            this.selectionArrow.position.set(targetPos.x, targetPos.y + height + 0.5, targetPos.z);
            
            // Rotate arrow
            this.selectionArrow.rotation.y += deltaTime * 2;
            
            // Pulse ring
            const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
            this.selectionRing.scale.set(pulse, pulse, 1);
        }
        
        // Verify target still exists and in range
        if (this.currentTarget) {
            if (!this.targetableEntities.has(this.currentTarget.id)) {
                this.clearTarget();
            }
        }
    }
    
    /**
     * Get target data for UI
     */
    getTargetData() {
        if (!this.currentTarget) return null;
        
        return {
            id: this.currentTarget.id,
            name: this.currentTarget.name,
            level: this.currentTarget.level,
            type: this.currentTarget.type,
            hostile: this.currentTarget.hostile,
            friendly: this.currentTarget.friendly,
            currentHealth: this.currentTarget.currentHealth,
            maxHealth: this.currentTarget.maxHealth,
            currentMana: this.currentTarget.currentMana,
            maxMana: this.currentTarget.maxMana
        };
    }
    
    /**
     * Cleanup
     */
    dispose() {
        document.removeEventListener('keydown', this._keyHandler);
        document.removeEventListener('mousedown', this._clickHandler);
        
        if (this.selectionRing) {
            this.scene.remove(this.selectionRing);
            this.selectionRing.geometry.dispose();
            this.selectionRing.material.dispose();
        }
        
        if (this.selectionArrow) {
            this.scene.remove(this.selectionArrow);
            this.selectionArrow.geometry.dispose();
            this.selectionArrow.material.dispose();
        }
        
        this.targetableEntities.clear();
    }
}

export default WoWTargetingSystem;
