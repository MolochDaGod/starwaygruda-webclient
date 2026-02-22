/**
 * @fileoverview Floating combat text system with object pooling
 * Displays damage numbers, heals, misses, etc. rising from entities
 * @module components/combat/FloatingText
 */

import { eventBus, GameEvents } from '../../core/EventBus.js';
import { 
    CombatColors, 
    CombatResult, 
    DamageType,
    FloatingTextConfig,
    UIDefaults 
} from '../../core/Constants.js';

/**
 * @typedef {Object} FloatingTextData
 * @property {number} amount - Damage/heal amount
 * @property {string} type - CombatResult type
 * @property {string} [damageType] - DamageType for color
 * @property {THREE.Vector3} position - World position
 * @property {boolean} [isCrit=false] - Critical hit
 * @property {string} [customText] - Override text display
 * @property {string} [customColor] - Override color
 */

/**
 * Individual floating text element
 */
class FloatingTextElement {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'floating-text';
        this.element.style.cssText = `
            position: absolute;
            pointer-events: none;
            font-family: ${UIDefaults.FONT_FAMILY};
            font-weight: ${FloatingTextConfig.FONT_WEIGHT};
            text-shadow: 
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px 1px 0 #000,
                1px 1px 0 #000,
                0 0 4px rgba(0,0,0,0.8);
            white-space: nowrap;
            transform-origin: center center;
            z-index: 1000;
        `;
        
        this.active = false;
        this.elapsed = 0;
        this.duration = FloatingTextConfig.DURATION;
        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.worldPosition = null;
        this.isCrit = false;
    }
    
    /**
     * Activate the element with display data
     * @param {FloatingTextData} data
     * @param {number} screenX - Initial screen X
     * @param {number} screenY - Initial screen Y
     */
    activate(data, screenX, screenY) {
        this.active = true;
        this.elapsed = 0;
        this.startX = screenX;
        this.startY = screenY;
        this.offsetX = (Math.random() - 0.5) * FloatingTextConfig.SPREAD * 2;
        this.worldPosition = data.position ? data.position.clone() : null;
        this.isCrit = data.isCrit || false;
        
        // Determine text
        let text = data.customText;
        if (!text) {
            switch (data.type) {
                case CombatResult.MISS:
                    text = 'Miss';
                    break;
                case CombatResult.DODGE:
                    text = 'Dodge';
                    break;
                case CombatResult.PARRY:
                    text = 'Parry';
                    break;
                case CombatResult.BLOCK:
                    text = data.amount ? `-${Math.round(data.amount)}` : 'Block';
                    break;
                case CombatResult.ABSORB:
                    text = 'Absorb';
                    break;
                case CombatResult.IMMUNE:
                    text = 'Immune';
                    break;
                case CombatResult.RESIST:
                    text = 'Resist';
                    break;
                default:
                    text = data.amount > 0 ? `${Math.round(data.amount)}` : `+${Math.abs(Math.round(data.amount))}`;
            }
        }
        
        // Determine color
        let color = data.customColor;
        if (!color) {
            color = this._getColorForType(data);
        }
        
        // Set styles
        const fontSize = this.isCrit 
            ? FloatingTextConfig.FONT_SIZE_CRIT 
            : FloatingTextConfig.FONT_SIZE;
        
        this.element.textContent = this.isCrit ? `${text}!` : text;
        this.element.style.color = color;
        this.element.style.fontSize = `${fontSize}px`;
        this.element.style.display = 'block';
        this.element.style.opacity = '1';
        this.element.style.transform = 'scale(1)';
        
        // Position
        this.element.style.left = `${screenX}px`;
        this.element.style.top = `${screenY}px`;
        
        // Crit entrance animation
        if (this.isCrit) {
            this.element.style.transform = `scale(${FloatingTextConfig.SCALE_CRIT})`;
            setTimeout(() => {
                this.element.style.transition = 'transform 0.2s ease-out';
                this.element.style.transform = 'scale(1)';
            }, 50);
        }
    }
    
    /**
     * Deactivate and return to pool
     */
    deactivate() {
        this.active = false;
        this.element.style.display = 'none';
        this.element.style.transition = '';
        this.worldPosition = null;
    }
    
    /**
     * Update position each frame
     * @param {number} deltaTime - Seconds
     * @param {THREE.Camera} camera - For world-to-screen projection
     * @param {HTMLElement} container - Container for bounds
     * @returns {boolean} True if still active
     */
    update(deltaTime, camera, container) {
        if (!this.active) return false;
        
        this.elapsed += deltaTime;
        
        if (this.elapsed >= this.duration) {
            this.deactivate();
            return false;
        }
        
        const progress = this.elapsed / this.duration;
        
        // Calculate rise
        const rise = this.elapsed * FloatingTextConfig.RISE_SPEED;
        
        // Calculate screen position
        let screenX = this.startX + this.offsetX;
        let screenY = this.startY - rise;
        
        // If we have a world position, track it
        if (this.worldPosition && camera) {
            const screenPos = this._worldToScreen(this.worldPosition, camera, container);
            if (screenPos) {
                screenX = screenPos.x + this.offsetX;
                screenY = screenPos.y - rise;
            }
        }
        
        // Fade out
        let opacity = 1;
        if (progress > FloatingTextConfig.FADE_START) {
            const fadeProgress = (progress - FloatingTextConfig.FADE_START) / (1 - FloatingTextConfig.FADE_START);
            opacity = 1 - fadeProgress;
        }
        
        // Apply
        this.element.style.left = `${screenX}px`;
        this.element.style.top = `${screenY}px`;
        this.element.style.opacity = opacity.toString();
        
        return true;
    }
    
    /** @private */
    _getColorForType(data) {
        // Heal
        if (data.type === 'heal') {
            return CombatColors.HEAL;
        }
        
        // Crit
        if (data.isCrit) {
            return CombatColors.CRIT;
        }
        
        // Combat result colors
        switch (data.type) {
            case CombatResult.MISS:
                return CombatColors.MISS;
            case CombatResult.DODGE:
                return CombatColors.DODGE;
            case CombatResult.PARRY:
                return CombatColors.PARRY;
            case CombatResult.BLOCK:
                return CombatColors.BLOCK;
            default:
                break;
        }
        
        // Damage type colors
        if (data.damageType) {
            switch (data.damageType) {
                case DamageType.PHYSICAL:
                    return CombatColors.DAMAGE_PHYSICAL;
                case DamageType.MAGIC:
                    return CombatColors.DAMAGE_MAGIC;
                case DamageType.FIRE:
                    return CombatColors.DAMAGE_FIRE;
                case DamageType.ICE:
                    return CombatColors.DAMAGE_ICE;
                case DamageType.LIGHTNING:
                    return CombatColors.DAMAGE_LIGHTNING;
                case DamageType.HOLY:
                    return CombatColors.DAMAGE_HOLY;
                case DamageType.SHADOW:
                    return CombatColors.DAMAGE_SHADOW;
                case DamageType.POISON:
                    return CombatColors.DAMAGE_POISON;
                case DamageType.BLEED:
                    return CombatColors.DAMAGE_BLEED;
            }
        }
        
        return CombatColors.DAMAGE_PHYSICAL;
    }
    
    /** @private */
    _worldToScreen(worldPos, camera, container) {
        if (!camera || !container) return null;
        
        const vector = worldPos.clone();
        vector.project(camera);
        
        // Check if behind camera
        if (vector.z > 1) return null;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        return {
            x: (vector.x * 0.5 + 0.5) * width,
            y: (-vector.y * 0.5 + 0.5) * height
        };
    }
}

/**
 * Floating text manager with object pooling
 */
export class FloatingTextSystem {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - DOM container
     * @param {THREE.Camera} options.camera - Three.js camera
     * @param {number} [options.poolSize=50] - Object pool size
     */
    constructor(options) {
        this.container = options.container;
        this.camera = options.camera;
        this.poolSize = options.poolSize || FloatingTextConfig.POOL_SIZE;
        
        /** @type {FloatingTextElement[]} */
        this.pool = [];
        
        /** @type {FloatingTextElement[]} */
        this.active = [];
        
        /** @private */
        this._enabled = true;
        
        /** @private - Queue for staggered display */
        this._queue = [];
        this._queueTimer = 0;
        
        /** @private - Event unsubscribers */
        this._unsubscribers = [];
        
        this._createContainer();
        this._initPool();
        this._bindEvents();
    }
    
    /** @private */
    _createContainer() {
        this.textContainer = document.createElement('div');
        this.textContainer.id = 'floating-text-container';
        this.textContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 100;
        `;
        this.container.appendChild(this.textContainer);
    }
    
    /** @private */
    _initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const element = new FloatingTextElement();
            element.deactivate();
            this.textContainer.appendChild(element.element);
            this.pool.push(element);
        }
    }
    
    /** @private */
    _bindEvents() {
        // Combat damage
        this._unsubscribers.push(eventBus.on(GameEvents.COMBAT_DAMAGE, (data) => {
            if (!this._enabled) return;
            this.spawn({
                amount: data.amount,
                type: CombatResult.HIT,
                damageType: data.damageType || DamageType.PHYSICAL,
                position: data.position,
                isCrit: data.isCrit
            });
        }));
        
        // Combat heal
        this._unsubscribers.push(eventBus.on(GameEvents.COMBAT_HEAL, (data) => {
            if (!this._enabled) return;
            this.spawn({
                amount: -data.amount, // Negative for + display
                type: 'heal',
                position: data.position
            });
        }));
        
        // Miss
        this._unsubscribers.push(eventBus.on(GameEvents.COMBAT_MISS, (data) => {
            if (!this._enabled) return;
            this.spawn({
                type: CombatResult.MISS,
                position: data.position
            });
        }));
        
        // Dodge
        this._unsubscribers.push(eventBus.on(GameEvents.COMBAT_DODGE, (data) => {
            if (!this._enabled) return;
            this.spawn({
                type: CombatResult.DODGE,
                position: data.position
            });
        }));
        
        // Parry
        this._unsubscribers.push(eventBus.on(GameEvents.COMBAT_PARRY, (data) => {
            if (!this._enabled) return;
            this.spawn({
                type: CombatResult.PARRY,
                position: data.position
            });
        }));
        
        // Block
        this._unsubscribers.push(eventBus.on(GameEvents.COMBAT_BLOCK, (data) => {
            if (!this._enabled) return;
            this.spawn({
                amount: data.amount,
                type: CombatResult.BLOCK,
                position: data.position
            });
        }));
        
        // XP Gain
        this._unsubscribers.push(eventBus.on(GameEvents.PLAYER_XP_GAIN, (data) => {
            if (!this._enabled) return;
            this.spawn({
                customText: `+${data.amount} XP`,
                customColor: CombatColors.XP_GAIN,
                position: data.position
            });
        }));
    }
    
    /**
     * Spawn a floating text
     * @param {FloatingTextData} data
     */
    spawn(data) {
        if (!this._enabled) return;
        
        // Queue if too many spawning at once
        if (this._queue.length > 0 || this.active.length > this.poolSize * 0.8) {
            this._queue.push(data);
            return;
        }
        
        this._spawnImmediate(data);
    }
    
    /** @private */
    _spawnImmediate(data) {
        // Get from pool
        let element = this.pool.find(e => !e.active);
        
        if (!element) {
            // Pool exhausted, recycle oldest
            element = this.active.shift();
            if (element) {
                element.deactivate();
            } else {
                return; // No elements available
            }
        }
        
        // Calculate screen position
        let screenX = this.container.clientWidth / 2;
        let screenY = this.container.clientHeight / 2;
        
        if (data.position && this.camera) {
            const vector = data.position.clone();
            vector.project(this.camera);
            
            if (vector.z <= 1) { // In front of camera
                screenX = (vector.x * 0.5 + 0.5) * this.container.clientWidth;
                screenY = (-vector.y * 0.5 + 0.5) * this.container.clientHeight;
            }
        }
        
        element.activate(data, screenX, screenY);
        this.active.push(element);
    }
    
    /**
     * Spawn text at screen coordinates (no world tracking)
     * @param {string} text
     * @param {number} x - Screen X
     * @param {number} y - Screen Y
     * @param {Object} [options]
     * @param {string} [options.color]
     * @param {boolean} [options.isCrit]
     */
    spawnAtScreen(text, x, y, options = {}) {
        let element = this.pool.find(e => !e.active);
        if (!element) return;
        
        element.activate({
            customText: text,
            customColor: options.color,
            isCrit: options.isCrit
        }, x, y);
        
        this.active.push(element);
    }
    
    /**
     * Update all active text elements
     * @param {number} deltaTime - Seconds since last frame
     */
    update(deltaTime) {
        // Process queue
        if (this._queue.length > 0) {
            this._queueTimer += deltaTime;
            if (this._queueTimer >= FloatingTextConfig.STACK_DELAY) {
                this._queueTimer = 0;
                const data = this._queue.shift();
                if (data) {
                    this._spawnImmediate(data);
                }
            }
        }
        
        // Update active elements
        for (let i = this.active.length - 1; i >= 0; i--) {
            const element = this.active[i];
            const stillActive = element.update(deltaTime, this.camera, this.container);
            
            if (!stillActive) {
                this.active.splice(i, 1);
            }
        }
    }
    
    /**
     * Enable/disable the system
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        
        if (!enabled) {
            // Clear all active
            this.active.forEach(e => e.deactivate());
            this.active = [];
            this._queue = [];
        }
    }
    
    /**
     * Update camera reference
     * @param {THREE.Camera} camera
     */
    setCamera(camera) {
        this.camera = camera;
    }
    
    /**
     * Clean up
     */
    destroy() {
        // Unsubscribe from all events
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
        
        this.active.forEach(e => e.deactivate());
        this.active = [];
        this.pool = [];
        this._queue = [];
        
        if (this.textContainer && this.textContainer.parentNode) {
            this.textContainer.parentNode.removeChild(this.textContainer);
        }
    }
}

export default FloatingTextSystem;
