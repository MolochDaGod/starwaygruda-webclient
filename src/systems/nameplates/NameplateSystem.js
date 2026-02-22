/**
 * @fileoverview Nameplate system for entities with 3D billboarding
 * Renders health bars, names, and levels above entities in world space
 * @module systems/nameplates/NameplateSystem
 */

import * as THREE from 'three';
import { eventBus, GameEvents } from '../../core/EventBus.js';
import {
    NameplateConfig,
    UIDefaults,
    EntityType,
    FactionRelation,
    Timing
} from '../../core/Constants.js';

/**
 * @typedef {Object} NameplateEntity
 * @property {string} id - Unique entity ID
 * @property {string} name - Display name
 * @property {number} level - Entity level
 * @property {string} [title] - Optional title
 * @property {string} [guild] - Guild name
 * @property {number} health - Current health
 * @property {number} maxHealth - Maximum health
 * @property {THREE.Object3D} object3D - The 3D object to follow
 * @property {string} entityType - EntityType enum value
 * @property {string} faction - FactionRelation to player
 * @property {boolean} [isElite=false] - Elite mob
 * @property {boolean} [isBoss=false] - Boss mob
 */

/**
 * Individual nameplate instance
 */
class Nameplate {
    /**
     * @param {NameplateEntity} entity
     * @param {HTMLElement} container
     */
    constructor(entity, container) {
        this.entity = entity;
        this.container = container;
        this.element = null;
        this._visible = true;
        this._opacity = 1;
        
        this._create();
    }
    
    /** @private */
    _create() {
        this.element = document.createElement('div');
        this.element.className = 'nameplate';
        this.element.dataset.entityId = this.entity.id;
        
        const styles = {
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            userSelect: 'none',
            transition: 'opacity 0.2s ease',
            fontFamily: UIDefaults.FONT_FAMILY
        };
        Object.assign(this.element.style, styles);
        
        // Name row (level + name)
        this._nameRow = document.createElement('div');
        this._nameRow.className = 'nameplate-name-row';
        this._nameRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 2px;
        `;
        
        // Level
        if (NameplateConfig.SHOW_LEVEL) {
            this._levelBadge = document.createElement('span');
            this._levelBadge.className = 'nameplate-level';
            this._levelBadge.style.cssText = `
                font-size: 10px;
                font-weight: bold;
                color: #ffcc00;
                background: rgba(0, 0, 0, 0.7);
                padding: 1px 4px;
                border-radius: 3px;
            `;
            this._levelBadge.textContent = this.entity.level;
            this._nameRow.appendChild(this._levelBadge);
        }
        
        // Name
        this._nameText = document.createElement('span');
        this._nameText.className = 'nameplate-name';
        this._nameText.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            text-shadow: 
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px 1px 0 #000,
                1px 1px 0 #000;
            white-space: nowrap;
        `;
        this._nameText.style.color = this._getNameColor();
        this._nameText.textContent = this.entity.name;
        this._nameRow.appendChild(this._nameText);
        
        this.element.appendChild(this._nameRow);
        
        // Guild
        if (NameplateConfig.SHOW_GUILD && this.entity.guild) {
            this._guildText = document.createElement('div');
            this._guildText.className = 'nameplate-guild';
            this._guildText.style.cssText = `
                font-size: 10px;
                color: #aaaaff;
                text-shadow: 1px 1px 1px #000;
                margin-bottom: 2px;
            `;
            this._guildText.textContent = `<${this.entity.guild}>`;
            this.element.appendChild(this._guildText);
        }
        
        // Health bar container
        this._healthContainer = document.createElement('div');
        this._healthContainer.className = 'nameplate-health-container';
        this._healthContainer.style.cssText = `
            width: ${NameplateConfig.BAR_WIDTH}px;
            height: ${NameplateConfig.BAR_HEIGHT}px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid ${this._getBorderColor()};
            border-radius: 2px;
            overflow: hidden;
        `;
        
        // Health bar fill
        this._healthBar = document.createElement('div');
        this._healthBar.className = 'nameplate-health-bar';
        this._healthBar.style.cssText = `
            height: 100%;
            background: ${UIDefaults.HEALTH_BAR_COLOR};
            transition: width 0.2s ease, background-color 0.3s ease;
        `;
        this._healthContainer.appendChild(this._healthBar);
        
        // Health text overlay
        this._healthText = document.createElement('div');
        this._healthText.className = 'nameplate-health-text';
        this._healthText.style.cssText = `
            position: absolute;
            width: 100%;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            color: #fff;
            text-shadow: 1px 1px 1px #000;
            line-height: ${NameplateConfig.BAR_HEIGHT}px;
            top: 0;
        `;
        this._healthContainer.style.position = 'relative';
        this._healthContainer.appendChild(this._healthText);
        
        this.element.appendChild(this._healthContainer);
        
        // Update initial state
        this.updateHealth();
        
        this.container.appendChild(this.element);
    }
    
    /**
     * Update entity health display
     */
    updateHealth() {
        const percent = Math.max(0, Math.min(100, (this.entity.health / this.entity.maxHealth) * 100));
        this._healthBar.style.width = `${percent}%`;
        
        // Color based on health
        if (percent <= UIDefaults.HEALTH_CRITICAL_THRESHOLD * 100) {
            this._healthBar.style.backgroundColor = UIDefaults.HEALTH_BAR_CRITICAL;
        } else if (percent <= UIDefaults.HEALTH_LOW_THRESHOLD * 100) {
            this._healthBar.style.backgroundColor = UIDefaults.HEALTH_BAR_LOW;
        } else {
            this._healthBar.style.backgroundColor = UIDefaults.HEALTH_BAR_COLOR;
        }
        
        // Health text
        this._healthText.textContent = `${Math.round(this.entity.health)} / ${this.entity.maxHealth}`;
    }
    
    /**
     * Update screen position
     * @param {number} x - Screen X
     * @param {number} y - Screen Y
     * @param {number} scale - Distance-based scale
     * @param {number} opacity - Distance-based opacity
     */
    updatePosition(x, y, scale, opacity) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.transform = `translate(-50%, -100%) scale(${scale})`;
        this.element.style.opacity = opacity.toString();
        this._opacity = opacity;
    }
    
    /**
     * Show/hide the nameplate
     * @param {boolean} visible
     */
    setVisible(visible) {
        this._visible = visible;
        this.element.style.display = visible ? 'flex' : 'none';
    }
    
    /**
     * Update entity data
     * @param {Partial<NameplateEntity>} data
     */
    updateEntity(data) {
        Object.assign(this.entity, data);
        
        if (data.name !== undefined) {
            this._nameText.textContent = this.entity.name;
        }
        if (data.level !== undefined && this._levelBadge) {
            this._levelBadge.textContent = this.entity.level;
        }
        if (data.health !== undefined || data.maxHealth !== undefined) {
            this.updateHealth();
        }
        if (data.faction !== undefined) {
            this._nameText.style.color = this._getNameColor();
        }
    }
    
    /**
     * Remove from DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
    
    /** @private */
    _getNameColor() {
        switch (this.entity.entityType) {
            case EntityType.PLAYER:
                return NameplateConfig.COLORS.PLAYER_NAME;
            case EntityType.NPC:
            case EntityType.GOULD:
                return NameplateConfig.COLORS.NPC_NAME;
            default:
                break;
        }
        
        switch (this.entity.faction) {
            case FactionRelation.FRIENDLY:
            case FactionRelation.ALLY:
                return NameplateConfig.COLORS.FRIENDLY_NAME;
            case FactionRelation.HOSTILE:
                return NameplateConfig.COLORS.HOSTILE_NAME;
            case FactionRelation.NEUTRAL:
            default:
                return NameplateConfig.COLORS.NEUTRAL_NAME;
        }
    }
    
    /** @private */
    _getBorderColor() {
        if (this.entity.isBoss) {
            return NameplateConfig.COLORS.BOSS_BORDER;
        }
        if (this.entity.isElite) {
            return NameplateConfig.COLORS.ELITE_BORDER;
        }
        return '#333';
    }
}

/**
 * Nameplate system manager
 */
export class NameplateSystem {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - DOM container for nameplates
     * @param {THREE.Camera} options.camera - Three.js camera
     * @param {THREE.Scene} options.scene - Three.js scene (for raycasting)
     */
    constructor(options) {
        this.container = options.container;
        this.camera = options.camera;
        this.scene = options.scene;
        
        /** @type {Map<string, Nameplate>} */
        this._nameplates = new Map();
        
        /** @type {Map<string, NameplateEntity>} */
        this._entities = new Map();
        
        /** @private */
        this._enabled = true;
        this._showFriendly = true;
        this._showEnemy = true;
        this._maxDistance = NameplateConfig.MAX_DISTANCE;
        
        // For raycasting occlusion (optional)
        this._raycaster = new THREE.Raycaster();
        this._useOcclusion = false;
        
        /** @private - Event unsubscribers */
        this._unsubscribers = [];
        
        this._createContainer();
        this._bindEvents();
    }
    
    /** @private */
    _createContainer() {
        this._nameplateContainer = document.createElement('div');
        this._nameplateContainer.id = 'nameplate-container';
        this._nameplateContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 50;
        `;
        this.container.appendChild(this._nameplateContainer);
    }
    
    /** @private */
    _bindEvents() {
        // Target health changes
        this._unsubscribers.push(eventBus.on(GameEvents.TARGET_HEALTH_CHANGED, (data) => {
            const nameplate = this._nameplates.get(data.entityId);
            if (nameplate) {
                nameplate.updateEntity({ 
                    health: data.health,
                    maxHealth: data.maxHealth
                });
            }
        }));
        
        // Settings changes
        this._unsubscribers.push(eventBus.on(GameEvents.UI_SETTINGS_CHANGED, (data) => {
            if (data.key === 'interface.nameplates') {
                this.setEnabled(data.value);
            }
            if (data.key === 'interface.friendlyNameplates') {
                this._showFriendly = data.value;
            }
            if (data.key === 'interface.enemyNameplates') {
                this._showEnemy = data.value;
            }
            if (data.key === 'interface.nameplateDistance') {
                this._maxDistance = data.value;
            }
        }));
    }
    
    /**
     * Register an entity to show a nameplate
     * @param {NameplateEntity} entity
     */
    registerEntity(entity) {
        if (this._entities.has(entity.id)) {
            this.updateEntity(entity.id, entity);
            return;
        }
        
        this._entities.set(entity.id, entity);
        
        // Create nameplate
        const nameplate = new Nameplate(entity, this._nameplateContainer);
        this._nameplates.set(entity.id, nameplate);
    }
    
    /**
     * Unregister an entity
     * @param {string} entityId
     */
    unregisterEntity(entityId) {
        const nameplate = this._nameplates.get(entityId);
        if (nameplate) {
            nameplate.destroy();
            this._nameplates.delete(entityId);
        }
        this._entities.delete(entityId);
    }
    
    /**
     * Update entity data
     * @param {string} entityId
     * @param {Partial<NameplateEntity>} data
     */
    updateEntity(entityId, data) {
        const entity = this._entities.get(entityId);
        if (entity) {
            Object.assign(entity, data);
            
            const nameplate = this._nameplates.get(entityId);
            if (nameplate) {
                nameplate.updateEntity(data);
            }
        }
    }
    
    /**
     * Update all nameplates each frame
     * @param {number} deltaTime
     * @param {THREE.Vector3} [playerPosition] - For distance calculations
     */
    update(deltaTime, playerPosition) {
        if (!this._enabled || !this.camera) return;
        
        const cameraPos = this.camera.position;
        const screenWidth = this.container.clientWidth;
        const screenHeight = this.container.clientHeight;
        
        this._nameplates.forEach((nameplate, entityId) => {
            const entity = nameplate.entity;
            
            // Check visibility settings
            if (!this._shouldShowNameplate(entity)) {
                nameplate.setVisible(false);
                return;
            }
            
            // Get world position
            if (!entity.object3D) {
                nameplate.setVisible(false);
                return;
            }
            
            const worldPos = new THREE.Vector3();
            entity.object3D.getWorldPosition(worldPos);
            worldPos.y += NameplateConfig.HEIGHT_OFFSET;
            
            // Calculate distance
            const distance = cameraPos.distanceTo(worldPos);
            
            // Too far
            if (distance > this._maxDistance) {
                nameplate.setVisible(false);
                return;
            }
            
            // Project to screen
            const screenPos = worldPos.clone().project(this.camera);
            
            // Behind camera
            if (screenPos.z > 1) {
                nameplate.setVisible(false);
                return;
            }
            
            // Convert to pixel coords
            const x = (screenPos.x * 0.5 + 0.5) * screenWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * screenHeight;
            
            // Off screen
            if (x < -50 || x > screenWidth + 50 || y < -50 || y > screenHeight + 50) {
                nameplate.setVisible(false);
                return;
            }
            
            // Calculate scale based on distance
            const scale = THREE.MathUtils.clamp(
                THREE.MathUtils.mapLinear(
                    distance,
                    5, this._maxDistance,
                    NameplateConfig.SCALE_MAX, NameplateConfig.SCALE_MIN
                ),
                NameplateConfig.SCALE_MIN,
                NameplateConfig.SCALE_MAX
            );
            
            // Calculate opacity for fade
            let opacity = 1;
            if (distance > NameplateConfig.FADE_START) {
                opacity = THREE.MathUtils.mapLinear(
                    distance,
                    NameplateConfig.FADE_START, this._maxDistance,
                    1, 0
                );
            }
            
            nameplate.setVisible(true);
            nameplate.updatePosition(x, y, scale, opacity);
        });
    }
    
    /**
     * Enable/disable the nameplate system
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        this._nameplateContainer.style.display = enabled ? 'block' : 'none';
    }
    
    /**
     * Update camera reference
     * @param {THREE.Camera} camera
     */
    setCamera(camera) {
        this.camera = camera;
    }
    
    /**
     * Get all registered entities
     * @returns {Map<string, NameplateEntity>}
     */
    getEntities() {
        return new Map(this._entities);
    }
    
    /**
     * Check if entity has a nameplate
     * @param {string} entityId
     * @returns {boolean}
     */
    hasEntity(entityId) {
        return this._entities.has(entityId);
    }
    
    /** @private */
    _shouldShowNameplate(entity) {
        // Player's own nameplate usually hidden
        if (entity.entityType === EntityType.PLAYER && entity.isLocalPlayer) {
            return false;
        }
        
        // Faction filtering
        if (entity.faction === FactionRelation.FRIENDLY || 
            entity.faction === FactionRelation.ALLY) {
            return this._showFriendly;
        }
        
        if (entity.faction === FactionRelation.HOSTILE) {
            return this._showEnemy;
        }
        
        return true; // Neutral always shown
    }
    
    /**
     * Clean up
     */
    destroy() {
        // Unsubscribe from all events
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
        
        this._nameplates.forEach(np => np.destroy());
        this._nameplates.clear();
        this._entities.clear();
        
        if (this._nameplateContainer && this._nameplateContainer.parentNode) {
            this._nameplateContainer.parentNode.removeChild(this._nameplateContainer);
        }
    }
}

export default NameplateSystem;
