import { eventBus, GameEvents } from '../../core/EventBus.js';
import { EntityType, FactionRelation } from '../../core/Constants.js';

/**
 * WoW-Style Target Frame
 * 
 * Features:
 * - Target portrait/icon
 * - Health bar with percentage
 * - Name and level
 * - Hostile/friendly coloring
 * - Cast bar for target's abilities
 * - Target of Target display
 */
export class WoWTargetFrame {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.currentTarget = null;
        this.visible = false;
        
        // Configuration
        this.config = {
            width: 240,
            height: 60,
            position: { top: 20, left: '50%' },
            showTargetOfTarget: true,
            animateHealthChanges: true
        };
        
        // Elements
        this.element = null;
        this.healthBar = null;
        this.healthText = null;
        this.nameText = null;
        this.levelText = null;
        this.portrait = null;
        this.targetOfTarget = null;
        
        // Animation
        this.displayedHealth = 100;
        this.actualHealth = 100;
        
        this.createUI();
        this.setupEventListeners();
        
        console.log('🎯 WoW Target Frame initialized');
    }
    
    createUI() {
        // Main container
        this.element = document.createElement('div');
        this.element.id = 'wow-target-frame';
        this.element.style.cssText = `
            position: fixed;
            top: ${this.config.position.top}px;
            left: ${this.config.position.left};
            transform: translateX(-50%);
            width: ${this.config.width}px;
            height: ${this.config.height}px;
            background: linear-gradient(180deg, rgba(30,30,40,0.95) 0%, rgba(20,20,30,0.95) 100%);
            border: 2px solid #444;
            border-radius: 4px;
            font-family: 'Segoe UI', Arial, sans-serif;
            display: none;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            user-select: none;
        `;
        
        // Portrait area
        this.portrait = document.createElement('div');
        this.portrait.style.cssText = `
            position: absolute;
            left: 4px;
            top: 4px;
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, #333 0%, #222 100%);
            border: 2px solid #555;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        `;
        this.portrait.textContent = '👤';
        this.element.appendChild(this.portrait);
        
        // Info area (right of portrait)
        const infoArea = document.createElement('div');
        infoArea.style.cssText = `
            position: absolute;
            left: 64px;
            top: 4px;
            right: 8px;
            height: 52px;
        `;
        this.element.appendChild(infoArea);
        
        // Name row
        const nameRow = document.createElement('div');
        nameRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        `;
        infoArea.appendChild(nameRow);
        
        // Target name
        this.nameText = document.createElement('span');
        this.nameText.style.cssText = `
            color: #ff4444;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        `;
        this.nameText.textContent = 'Target Name';
        nameRow.appendChild(this.nameText);
        
        // Level
        this.levelText = document.createElement('span');
        this.levelText.style.cssText = `
            color: #ffcc00;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
        this.levelText.textContent = 'Lv 1';
        nameRow.appendChild(this.levelText);
        
        // Health bar container
        const healthBarContainer = document.createElement('div');
        healthBarContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 20px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 2px;
            overflow: hidden;
        `;
        infoArea.appendChild(healthBarContainer);
        
        // Health bar background (shows damage animation)
        this.healthBarDamage = document.createElement('div');
        this.healthBarDamage.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(180deg, #661111 0%, #441111 100%);
            transition: width 0.5s ease-out;
        `;
        healthBarContainer.appendChild(this.healthBarDamage);
        
        // Health bar fill
        this.healthBar = document.createElement('div');
        this.healthBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(180deg, #22cc22 0%, #118811 100%);
            transition: width 0.15s ease-out;
        `;
        healthBarContainer.appendChild(this.healthBar);
        
        // Health text
        this.healthText = document.createElement('span');
        this.healthText.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
        `;
        this.healthText.textContent = '100%';
        healthBarContainer.appendChild(this.healthText);
        
        // Secondary bar (mana/energy) - below health
        const secondaryBarContainer = document.createElement('div');
        secondaryBarContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 8px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 2px;
            margin-top: 2px;
            overflow: hidden;
        `;
        infoArea.appendChild(secondaryBarContainer);
        
        this.secondaryBar = document.createElement('div');
        this.secondaryBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(180deg, #4488ff 0%, #2266cc 100%);
        `;
        secondaryBarContainer.appendChild(this.secondaryBar);
        
        // Target of Target (smaller frame below)
        if (this.config.showTargetOfTarget) {
            this.targetOfTarget = document.createElement('div');
            this.targetOfTarget.style.cssText = `
                position: absolute;
                bottom: -28px;
                right: 0;
                width: 100px;
                height: 24px;
                background: rgba(20,20,30,0.9);
                border: 1px solid #444;
                border-radius: 3px;
                display: none;
                padding: 2px 6px;
                font-size: 10px;
                color: #aaa;
            `;
            this.targetOfTarget.innerHTML = '<span style="color:#ff8800;">ToT:</span> <span class="tot-name">Unknown</span>';
            this.element.appendChild(this.targetOfTarget);
        }
        
        // Add to container
        this.container.appendChild(this.element);
    }
    
    setupEventListeners() {
        // Listen for target changes
        this._unsubscribers = [
            eventBus.on(GameEvents.TARGET_CHANGED, (data) => this.onTargetChanged(data)),
            eventBus.on(GameEvents.ENTITY_DAMAGED, (data) => this.onEntityDamaged(data)),
            eventBus.on(GameEvents.ENTITY_HEALED, (data) => this.onEntityHealed(data))
        ];
    }
    
    /**
     * Set the current target
     */
    setTarget(targetData) {
        if (!targetData) {
            this.hide();
            this.currentTarget = null;
            return;
        }
        
        this.currentTarget = targetData;
        this.show();
        this.updateDisplay();
    }
    
    /**
     * Update the display with current target data
     */
    updateDisplay() {
        if (!this.currentTarget) return;
        
        const target = this.currentTarget;
        
        // Update name
        this.nameText.textContent = target.name || 'Unknown';
        
        // Update level
        this.levelText.textContent = target.level ? `Lv ${target.level}` : '';
        
        // Update name color based on hostility
        if (target.hostile) {
            this.nameText.style.color = '#ff4444'; // Red for hostile
        } else if (target.friendly) {
            this.nameText.style.color = '#44ff44'; // Green for friendly
        } else {
            this.nameText.style.color = '#ffff44'; // Yellow for neutral
        }
        
        // Update health
        this.updateHealth(target.currentHealth, target.maxHealth);
        
        // Update secondary bar (mana/energy)
        if (target.currentMana !== undefined && target.maxMana) {
            const manaPercent = (target.currentMana / target.maxMana) * 100;
            this.secondaryBar.style.width = `${manaPercent}%`;
            this.secondaryBar.parentElement.style.display = 'block';
        } else {
            this.secondaryBar.parentElement.style.display = 'none';
        }
        
        // Update portrait icon based on type
        this.updatePortrait(target);
        
        // Update target of target
        if (this.targetOfTarget && target.targetId) {
            this.targetOfTarget.style.display = 'block';
            this.targetOfTarget.querySelector('.tot-name').textContent = target.targetName || 'Unknown';
        } else if (this.targetOfTarget) {
            this.targetOfTarget.style.display = 'none';
        }
    }
    
    /**
     * Update health bar
     */
    updateHealth(current, max) {
        if (!max || max <= 0) {
            this.healthBar.style.width = '100%';
            this.healthBarDamage.style.width = '100%';
            this.healthText.textContent = '???';
            return;
        }
        
        const percent = Math.max(0, Math.min(100, (current / max) * 100));
        
        // Animate damage indicator (slower transition)
        this.healthBarDamage.style.width = `${percent}%`;
        
        // Health bar (faster transition)
        this.healthBar.style.width = `${percent}%`;
        
        // Update text
        this.healthText.textContent = `${Math.floor(current)} / ${Math.floor(max)} (${Math.floor(percent)}%)`;
        
        // Update color based on health percentage
        if (percent > 50) {
            this.healthBar.style.background = 'linear-gradient(180deg, #22cc22 0%, #118811 100%)';
        } else if (percent > 25) {
            this.healthBar.style.background = 'linear-gradient(180deg, #cccc22 0%, #888811 100%)';
        } else {
            this.healthBar.style.background = 'linear-gradient(180deg, #cc2222 0%, #881111 100%)';
        }
    }
    
    /**
     * Update portrait based on target type
     */
    updatePortrait(target) {
        let icon = '👤';
        
        switch (target.type) {
            case 'creature':
            case 'enemy':
                if (target.hostile) {
                    icon = '💀';
                } else {
                    icon = '🐾';
                }
                break;
            case 'npc':
                icon = target.hostile ? '⚔️' : '👤';
                break;
            case 'player':
                icon = '🎮';
                break;
            case 'boss':
                icon = '👹';
                break;
            case 'resource':
                icon = '🪨';
                break;
            default:
                icon = target.hostile ? '⚠️' : '❓';
        }
        
        // Add hostile border
        if (target.hostile) {
            this.portrait.style.borderColor = '#cc4444';
        } else if (target.friendly) {
            this.portrait.style.borderColor = '#44cc44';
        } else {
            this.portrait.style.borderColor = '#555';
        }
        
        this.portrait.textContent = icon;
    }
    
    /**
     * Handle target changed event
     */
    onTargetChanged(data) {
        if (data.target) {
            this.setTarget(data.target);
        } else {
            this.hide();
            this.currentTarget = null;
        }
    }
    
    /**
     * Handle entity damaged event
     */
    onEntityDamaged(data) {
        if (this.currentTarget && data.entityId === this.currentTarget.id) {
            this.currentTarget.currentHealth = data.newHealth;
            this.updateHealth(data.newHealth, this.currentTarget.maxHealth);
        }
    }
    
    /**
     * Handle entity healed event
     */
    onEntityHealed(data) {
        if (this.currentTarget && data.entityId === this.currentTarget.id) {
            this.currentTarget.currentHealth = data.newHealth;
            this.updateHealth(data.newHealth, this.currentTarget.maxHealth);
        }
    }
    
    /**
     * Show the target frame
     */
    show() {
        this.element.style.display = 'block';
        this.visible = true;
    }
    
    /**
     * Hide the target frame
     */
    hide() {
        this.element.style.display = 'none';
        this.visible = false;
    }
    
    /**
     * Clear target
     */
    clearTarget() {
        this.currentTarget = null;
        this.hide();
    }
    
    /**
     * Check if frame is visible
     */
    isVisible() {
        return this.visible;
    }
    
    /**
     * Get current target
     */
    getTarget() {
        return this.currentTarget;
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this._unsubscribers) {
            this._unsubscribers.forEach(unsub => unsub());
        }
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default WoWTargetFrame;
