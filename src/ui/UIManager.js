/**
 * @fileoverview Central UI Manager for Phase 1 UX systems
 * Integrates FloatingText, BuffBar, Nameplates, Settings with game
 * @module ui/UIManager
 */

import { eventBus, GameEvents } from '../core/EventBus.js';
import { FloatingTextSystem } from '../components/combat/FloatingText.js';
import { BuffBar, DebuffBar } from '../components/combat/BuffBar.js';
import { NameplateSystem } from '../systems/nameplates/NameplateSystem.js';
import { SettingsManager } from './settings/SettingsManager.js';
import { SettingsKey } from '../core/Constants.js';

/**
 * Central UI Manager
 * Coordinates all UI systems and handles integration with game
 */
export class UIManager {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - Main game container
     * @param {THREE.Camera} options.camera - Three.js camera
     * @param {THREE.Scene} options.scene - Three.js scene
     */
    constructor(options) {
        this.container = options.container;
        this.camera = options.camera;
        this.scene = options.scene;
        
        /** @type {FloatingTextSystem} */
        this.floatingText = null;
        
        /** @type {BuffBar} */
        this.buffBar = null;
        
        /** @type {DebuffBar} */
        this.debuffBar = null;
        
        /** @type {NameplateSystem} */
        this.nameplates = null;
        
        /** @type {SettingsManager} */
        this.settings = null;
        
        /** @private */
        this._initialized = false;
        
        /** @private - For cleanup */
        this._eventUnsubscribers = [];
        this._keyHandler = null;
    }
    
    /**
     * Initialize all UI systems
     */
    init() {
        if (this._initialized) return;
        
        this._createUIContainer();
        this._initFloatingText();
        this._initBuffBars();
        this._initNameplates();
        this._initSettings();
        this._bindEvents();
        
        this._initialized = true;
        console.log('🎨 UIManager initialized with Phase 1 systems');
    }
    
    /** @private */
    _createUIContainer() {
        // Create HUD container for buff bars
        this._hudContainer = document.createElement('div');
        this._hudContainer.id = 'game-hud';
        this._hudContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        this.container.appendChild(this._hudContainer);
        
        // Buff bar container (top right, below minimap area)
        this._buffContainer = document.createElement('div');
        this._buffContainer.id = 'buff-container';
        this._buffContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 220px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            pointer-events: auto;
        `;
        this._hudContainer.appendChild(this._buffContainer);
    }
    
    /** @private */
    _initFloatingText() {
        this.floatingText = new FloatingTextSystem({
            container: this.container,
            camera: this.camera,
            poolSize: 50
        });
        
        console.log('  ✓ FloatingText system ready');
    }
    
    /** @private */
    _initBuffBars() {
        // Player buff bar
        this.buffBar = new BuffBar({
            id: 'player-buff-bar',
            parent: this._buffContainer,
            type: 'buff',
            iconSize: 32,
            maxVisible: 16
        });
        this.buffBar.init();
        
        // Player debuff bar
        this.debuffBar = new DebuffBar({
            id: 'player-debuff-bar',
            parent: this._buffContainer,
            iconSize: 32,
            maxVisible: 8
        });
        this.debuffBar.init();
        
        console.log('  ✓ BuffBar and DebuffBar ready');
    }
    
    /** @private */
    _initNameplates() {
        this.nameplates = new NameplateSystem({
            container: this.container,
            camera: this.camera,
            scene: this.scene
        });
        
        console.log('  ✓ Nameplate system ready');
    }
    
    /** @private */
    _initSettings() {
        this.settings = new SettingsManager({
            id: 'game-settings',
            parent: document.body,
            visible: false
        });
        this.settings.init();
        
        console.log('  ✓ Settings manager ready');
    }
    
    /** @private */
    _bindEvents() {
        // Apply initial settings
        this._applySettings();
        
        // Listen for settings changes
        const unsubSettings = eventBus.on(GameEvents.UI_SETTINGS_CHANGED, (data) => {
            this._onSettingChanged(data.key, data.value);
        });
        this._eventUnsubscribers.push(unsubSettings);
        
        // ESC key to open/close settings
        this._keyHandler = (e) => {
            if (e.key === 'Escape') {
                // Only toggle if no other modal is open
                if (this.settings && this.settings.visible) {
                    this.settings.hide();
                }
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }
    
    /** @private */
    _applySettings() {
        // Apply damage numbers setting
        const showDamage = this.settings.get(SettingsKey.SHOW_DAMAGE_NUMBERS);
        if (this.floatingText) {
            this.floatingText.setEnabled(showDamage);
        }
        
        // Apply nameplate settings
        const showNameplates = this.settings.get(SettingsKey.SHOW_NAMEPLATES);
        if (this.nameplates) {
            this.nameplates.setEnabled(showNameplates);
        }
    }
    
    /** @private */
    _onSettingChanged(key, value) {
        switch (key) {
            case SettingsKey.SHOW_DAMAGE_NUMBERS:
                if (this.floatingText) {
                    this.floatingText.setEnabled(value);
                }
                break;
                
            case SettingsKey.SHOW_NAMEPLATES:
                if (this.nameplates) {
                    this.nameplates.setEnabled(value);
                }
                break;
        }
    }
    
    /**
     * Update UI systems each frame
     * @param {number} deltaTime - Seconds since last frame
     * @param {THREE.Vector3} [playerPosition] - Current player position
     */
    update(deltaTime, playerPosition) {
        // Update floating text
        if (this.floatingText) {
            this.floatingText.update(deltaTime);
        }
        
        // Update nameplates
        if (this.nameplates) {
            this.nameplates.update(deltaTime, playerPosition);
        }
    }
    
    /**
     * Update camera reference (call when camera changes)
     * @param {THREE.Camera} camera
     */
    setCamera(camera) {
        this.camera = camera;
        
        if (this.floatingText) {
            this.floatingText.setCamera(camera);
        }
        if (this.nameplates) {
            this.nameplates.setCamera(camera);
        }
    }
    
    /**
     * Register an entity for nameplate display
     * @param {Object} entity - Entity data
     */
    registerEntity(entity) {
        if (this.nameplates) {
            this.nameplates.registerEntity(entity);
        }
    }
    
    /**
     * Unregister an entity
     * @param {string} entityId
     */
    unregisterEntity(entityId) {
        if (this.nameplates) {
            this.nameplates.unregisterEntity(entityId);
        }
    }
    
    /**
     * Add a buff to the player buff bar
     * @param {Object} buffData
     */
    addBuff(buffData) {
        if (this.buffBar) {
            this.buffBar.addBuff(buffData);
        }
    }
    
    /**
     * Add a debuff to the player debuff bar
     * @param {Object} debuffData
     */
    addDebuff(debuffData) {
        if (this.debuffBar) {
            this.debuffBar.addBuff(debuffData);
        }
    }
    
    /**
     * Show damage number at a world position
     * @param {Object} data - { amount, type, damageType, position, isCrit }
     */
    showDamage(data) {
        // Emit event - FloatingText listens to these
        eventBus.emit(GameEvents.COMBAT_DAMAGE, data);
    }
    
    /**
     * Show heal number at a world position
     * @param {Object} data - { amount, position }
     */
    showHeal(data) {
        eventBus.emit(GameEvents.COMBAT_HEAL, data);
    }
    
    /**
     * Show custom floating text
     * @param {string} text
     * @param {THREE.Vector3} position
     * @param {Object} [options]
     */
    showFloatingText(text, position, options = {}) {
        if (this.floatingText) {
            this.floatingText.spawn({
                customText: text,
                customColor: options.color,
                position: position,
                isCrit: options.isCrit
            });
        }
    }
    
    /**
     * Open the settings window
     */
    openSettings() {
        if (this.settings) {
            this.settings.show();
        }
    }
    
    /**
     * Close the settings window
     */
    closeSettings() {
        if (this.settings) {
            this.settings.hide();
        }
    }
    
    /**
     * Get a setting value
     * @param {string} key - SettingsKey
     * @returns {*}
     */
    getSetting(key) {
        return this.settings ? this.settings.get(key) : null;
    }
    
    /**
     * Set a setting value
     * @param {string} key - SettingsKey
     * @param {*} value
     */
    setSetting(key, value) {
        if (this.settings) {
            this.settings.set(key, value);
        }
    }
    
    /**
     * Clean up all UI systems
     */
    destroy() {
        // Unsubscribe from events
        this._eventUnsubscribers.forEach(unsub => unsub());
        this._eventUnsubscribers = [];
        
        // Remove key handler
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        
        if (this.floatingText) {
            this.floatingText.destroy();
            this.floatingText = null;
        }
        
        if (this.buffBar) {
            this.buffBar.destroy();
            this.buffBar = null;
        }
        
        if (this.debuffBar) {
            this.debuffBar.destroy();
            this.debuffBar = null;
        }
        
        if (this.nameplates) {
            this.nameplates.destroy();
            this.nameplates = null;
        }
        
        if (this.settings) {
            this.settings.destroy();
            this.settings = null;
        }
        
        if (this._hudContainer && this._hudContainer.parentNode) {
            this._hudContainer.parentNode.removeChild(this._hudContainer);
        }
        
        this._initialized = false;
    }
}

export default UIManager;
