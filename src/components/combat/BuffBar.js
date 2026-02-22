/**
 * @fileoverview Buff and Debuff bar components with tooltips
 * Displays active buffs/debuffs with duration timers
 * @module components/combat/BuffBar
 */

import { UIComponent } from '../base/UIComponent.js';
import { eventBus, GameEvents } from '../../core/EventBus.js';
import { 
    UIDefaults, 
    BuffType, 
    BuffCategory,
    Timing,
    CombatColors 
} from '../../core/Constants.js';

/**
 * @typedef {Object} BuffData
 * @property {string} id - Unique buff ID
 * @property {string} name - Display name
 * @property {string} [description] - Tooltip description
 * @property {string} [icon] - Icon URL or data URI
 * @property {number} duration - Total duration in seconds
 * @property {number} remaining - Time remaining in seconds
 * @property {number} [stacks=1] - Stack count
 * @property {number} [maxStacks=1] - Maximum stacks
 * @property {string} type - BuffType (buff/debuff)
 * @property {string} [category] - BuffCategory
 * @property {string} [source] - Who applied this
 * @property {boolean} [isDispellable=true] - Can be removed
 */

/**
 * Individual buff icon component
 */
class BuffIcon extends UIComponent {
    /**
     * @param {BuffData} buffData
     * @param {Object} [options]
     */
    constructor(buffData, options = {}) {
        super(options);
        this.buffData = buffData;
        this.iconSize = options.iconSize || 32;
        this.showTooltip = options.showTooltip !== false;
        this._tooltipElement = null;
    }
    
    render() {
        const el = this.createElement('div', {
            className: 'buff-icon',
            style: {
                position: 'relative',
                width: `${this.iconSize}px`,
                height: `${this.iconSize}px`,
                borderRadius: '4px',
                border: this._getBorderStyle(),
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
                flexShrink: '0'
            }
        });
        
        // Icon image
        const icon = this.createElement('div', {
            className: 'buff-icon-image',
            style: {
                width: '100%',
                height: '100%',
                backgroundImage: this.buffData.icon ? `url(${this.buffData.icon})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: this._getDefaultColor()
            }
        });
        
        // If no icon, show first letter
        if (!this.buffData.icon) {
            icon.textContent = this.buffData.name.charAt(0).toUpperCase();
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.fontSize = `${this.iconSize * 0.5}px`;
            icon.style.fontWeight = 'bold';
            icon.style.color = '#fff';
            icon.style.textShadow = '1px 1px 2px #000';
        }
        
        el.appendChild(icon);
        
        // Duration overlay
        this._durationOverlay = this.createElement('div', {
            className: 'buff-duration-overlay',
            style: {
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                transformOrigin: 'bottom',
                transform: 'scaleY(0)'
            }
        });
        el.appendChild(this._durationOverlay);
        
        // Duration text
        this._durationText = this.createElement('div', {
            className: 'buff-duration-text',
            style: {
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 1px #000',
                padding: '1px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
        });
        el.appendChild(this._durationText);
        
        // Stacks indicator
        if (this.buffData.maxStacks > 1) {
            this._stacksText = this.createElement('div', {
                className: 'buff-stacks',
                style: {
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '1px 1px 1px #000',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '0 3px',
                    borderRadius: '0 4px 0 4px'
                },
                textContent: this.buffData.stacks.toString()
            });
            el.appendChild(this._stacksText);
        }
        
        return el;
    }
    
    bindEvents() {
        // Hover for tooltip
        if (this.showTooltip) {
            this.addDOMListener(this.element, 'mouseenter', this._showTooltip);
            this.addDOMListener(this.element, 'mouseleave', this._hideTooltip);
        }
        
        // Hover effect
        this.addDOMListener(this.element, 'mouseenter', () => {
            this.element.style.transform = 'scale(1.1)';
        });
        this.addDOMListener(this.element, 'mouseleave', () => {
            this.element.style.transform = 'scale(1)';
        });
        
        // Right-click to cancel (if player buff)
        this.addDOMListener(this.element, 'contextmenu', (e) => {
            e.preventDefault();
            if (this.buffData.isDispellable !== false) {
                this.emit('buff:cancelRequest', { buffId: this.buffData.id });
            }
        });
    }
    
    /**
     * Update buff data
     * @param {Partial<BuffData>} data
     */
    updateBuff(data) {
        Object.assign(this.buffData, data);
        this._updateDisplay();
    }
    
    /** @private */
    _updateDisplay() {
        // Update duration
        const remaining = this.buffData.remaining;
        const duration = this.buffData.duration;
        
        if (duration > 0 && remaining >= 0) {
            // Progress overlay
            const progress = 1 - (remaining / duration);
            this._durationOverlay.style.transform = `scaleY(${progress})`;
            
            // Duration text
            if (remaining > 60) {
                this._durationText.textContent = `${Math.ceil(remaining / 60)}m`;
            } else if (remaining > 0) {
                this._durationText.textContent = remaining < 10 
                    ? remaining.toFixed(1) 
                    : Math.ceil(remaining).toString();
            } else {
                this._durationText.textContent = '';
            }
        } else {
            this._durationOverlay.style.transform = 'scaleY(0)';
            this._durationText.textContent = '';
        }
        
        // Update stacks
        if (this._stacksText) {
            this._stacksText.textContent = this.buffData.stacks.toString();
        }
    }
    
    /** @private */
    _showTooltip() {
        if (this._tooltipElement) return;
        
        this._tooltipElement = this.createElement('div', {
            className: 'buff-tooltip',
            style: {
                position: 'fixed',
                zIndex: '10000',
                backgroundColor: 'rgba(20, 20, 30, 0.95)',
                border: '1px solid #4a4a5a',
                borderRadius: '4px',
                padding: '8px 12px',
                maxWidth: '250px',
                pointerEvents: 'none',
                fontFamily: UIDefaults.FONT_FAMILY,
                fontSize: UIDefaults.FONT_SIZE_SMALL,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }
        });
        
        // Name
        const name = this.createElement('div', {
            style: {
                fontWeight: 'bold',
                fontSize: UIDefaults.FONT_SIZE_NORMAL,
                color: this.buffData.type === BuffType.DEBUFF ? '#ff6666' : '#66ff66',
                marginBottom: '4px'
            },
            textContent: this.buffData.name
        });
        this._tooltipElement.appendChild(name);
        
        // Category/Type
        if (this.buffData.category) {
            const category = this.createElement('div', {
                style: {
                    color: '#888',
                    fontSize: '10px',
                    marginBottom: '4px',
                    textTransform: 'capitalize'
                },
                textContent: `${this.buffData.category} ${this.buffData.type}`
            });
            this._tooltipElement.appendChild(category);
        }
        
        // Description
        if (this.buffData.description) {
            const desc = this.createElement('div', {
                style: {
                    color: '#ccc',
                    marginBottom: '4px'
                },
                textContent: this.buffData.description
            });
            this._tooltipElement.appendChild(desc);
        }
        
        // Duration
        if (this.buffData.duration > 0) {
            const durationInfo = this.createElement('div', {
                style: {
                    color: '#aaa',
                    fontSize: '10px'
                },
                textContent: `${Math.ceil(this.buffData.remaining)}s remaining`
            });
            this._tooltipElement.appendChild(durationInfo);
        }
        
        // Source
        if (this.buffData.source) {
            const source = this.createElement('div', {
                style: {
                    color: '#666',
                    fontSize: '10px',
                    marginTop: '4px'
                },
                textContent: `Applied by: ${this.buffData.source}`
            });
            this._tooltipElement.appendChild(source);
        }
        
        document.body.appendChild(this._tooltipElement);
        this._positionTooltip();
    }
    
    /** @private */
    _hideTooltip() {
        if (this._tooltipElement) {
            document.body.removeChild(this._tooltipElement);
            this._tooltipElement = null;
        }
    }
    
    /** @private */
    _positionTooltip() {
        if (!this._tooltipElement || !this.element) return;
        
        const iconRect = this.element.getBoundingClientRect();
        const tooltipRect = this._tooltipElement.getBoundingClientRect();
        
        let left = iconRect.left + (iconRect.width / 2) - (tooltipRect.width / 2);
        let top = iconRect.top - tooltipRect.height - 8;
        
        // Keep on screen
        if (left < 5) left = 5;
        if (left + tooltipRect.width > window.innerWidth - 5) {
            left = window.innerWidth - tooltipRect.width - 5;
        }
        if (top < 5) {
            top = iconRect.bottom + 8;
        }
        
        this._tooltipElement.style.left = `${left}px`;
        this._tooltipElement.style.top = `${top}px`;
    }
    
    /** @private */
    _getBorderStyle() {
        if (this.buffData.type === BuffType.DEBUFF) {
            return '2px solid #cc3333';
        }
        return '2px solid #33cc33';
    }
    
    /** @private */
    _getDefaultColor() {
        if (this.buffData.type === BuffType.DEBUFF) {
            return 'rgba(150, 50, 50, 0.8)';
        }
        
        switch (this.buffData.category) {
            case BuffCategory.STAT:
                return 'rgba(50, 100, 150, 0.8)';
            case BuffCategory.COMBAT:
                return 'rgba(150, 100, 50, 0.8)';
            case BuffCategory.DEFENSIVE:
                return 'rgba(100, 150, 50, 0.8)';
            case BuffCategory.MOVEMENT:
                return 'rgba(50, 150, 150, 0.8)';
            case BuffCategory.HEALING:
                return 'rgba(50, 150, 100, 0.8)';
            default:
                return 'rgba(80, 80, 100, 0.8)';
        }
    }
    
    onDestroy() {
        this._hideTooltip();
    }
}

/**
 * Buff bar container component
 */
export class BuffBar extends UIComponent {
    /**
     * @param {Object} [options]
     * @param {string} [options.type='buff'] - 'buff' or 'debuff'
     * @param {number} [options.iconSize=32]
     * @param {number} [options.maxVisible=16]
     * @param {boolean} [options.growLeft=false] - Grow direction
     */
    constructor(options = {}) {
        super(options);
        
        this.type = options.type || 'buff';
        this.iconSize = options.iconSize || 32;
        this.maxVisible = options.maxVisible || 16;
        this.growLeft = options.growLeft || false;
        
        /** @type {Map<string, BuffIcon>} */
        this._buffIcons = new Map();
        
        /** @type {Map<string, BuffData>} */
        this._buffs = new Map();
    }
    
    render() {
        const el = this.createElement('div', {
            className: `buff-bar buff-bar-${this.type}`,
            style: {
                display: 'flex',
                flexDirection: this.growLeft ? 'row-reverse' : 'row',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '4px',
                maxWidth: `${(this.iconSize + 4) * 8}px`,
                minHeight: `${this.iconSize + 8}px`
            }
        });
        
        return el;
    }
    
    bindEvents() {
        // Listen for buff events
        const applyEvent = this.type === 'debuff' 
            ? GameEvents.DEBUFF_APPLIED 
            : GameEvents.BUFF_APPLIED;
        const removeEvent = this.type === 'debuff'
            ? GameEvents.DEBUFF_REMOVED
            : GameEvents.BUFF_REMOVED;
        
        this.on(applyEvent, this._onBuffApplied);
        this.on(removeEvent, this._onBuffRemoved);
        this.on(GameEvents.BUFF_REFRESHED, this._onBuffRefreshed);
    }
    
    onInit() {
        // Start update interval
        this.setInterval(this._updateDurations, Timing.UI_UPDATE_RATE, 'duration-update');
    }
    
    /**
     * Add or update a buff
     * @param {BuffData} buffData
     */
    addBuff(buffData) {
        const existing = this._buffs.get(buffData.id);
        
        if (existing) {
            // Update existing
            this._buffs.set(buffData.id, { ...existing, ...buffData });
            const icon = this._buffIcons.get(buffData.id);
            if (icon) {
                icon.updateBuff(buffData);
            }
        } else {
            // Add new
            if (this._buffs.size >= this.maxVisible) {
                // Remove oldest
                const oldest = this._buffs.keys().next().value;
                this.removeBuff(oldest);
            }
            
            this._buffs.set(buffData.id, buffData);
            
            // Create icon
            const icon = new BuffIcon(buffData, {
                iconSize: this.iconSize,
                showTooltip: true
            });
            this._buffIcons.set(buffData.id, icon);
            this.addChild(icon);
        }
    }
    
    /**
     * Remove a buff
     * @param {string} buffId
     */
    removeBuff(buffId) {
        this._buffs.delete(buffId);
        
        const icon = this._buffIcons.get(buffId);
        if (icon) {
            this.removeChild(icon);
            this._buffIcons.delete(buffId);
        }
    }
    
    /**
     * Clear all buffs
     */
    clearAll() {
        this._buffIcons.forEach(icon => this.removeChild(icon));
        this._buffIcons.clear();
        this._buffs.clear();
    }
    
    /**
     * Get current buff count
     * @returns {number}
     */
    getCount() {
        return this._buffs.size;
    }
    
    /** @private */
    _onBuffApplied = (data) => {
        if (data.type !== this.type && 
            !(this.type === 'buff' && data.type === BuffType.BUFF) &&
            !(this.type === 'debuff' && data.type === BuffType.DEBUFF)) {
            return;
        }
        this.addBuff(data);
    }
    
    /** @private */
    _onBuffRemoved = (data) => {
        this.removeBuff(data.id);
    }
    
    /** @private */
    _onBuffRefreshed = (data) => {
        const buff = this._buffs.get(data.id);
        if (buff) {
            this.addBuff({ ...buff, ...data });
        }
    }
    
    /** @private */
    _updateDurations = () => {
        const now = Date.now();
        const dt = Timing.UI_UPDATE_RATE / 1000;
        
        this._buffs.forEach((buff, id) => {
            if (buff.duration > 0) {
                buff.remaining -= dt;
                
                if (buff.remaining <= 0) {
                    this.removeBuff(id);
                    this.emit(
                        buff.type === BuffType.DEBUFF ? GameEvents.DEBUFF_REMOVED : GameEvents.BUFF_REMOVED,
                        { id }
                    );
                } else {
                    const icon = this._buffIcons.get(id);
                    if (icon) {
                        icon.updateBuff({ remaining: buff.remaining });
                    }
                }
            }
        });
    }
    
    onDestroy() {
        this.clearAll();
    }
}

/**
 * Convenience class for debuff bar
 */
export class DebuffBar extends BuffBar {
    constructor(options = {}) {
        super({ ...options, type: 'debuff' });
    }
}

export default BuffBar;
