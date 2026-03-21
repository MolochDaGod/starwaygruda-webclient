/**
 * @fileoverview Global Event Bus implementing the Observer pattern
 * Provides decoupled communication between game systems
 * @module core/EventBus
 */

/**
 * @typedef {Object} EventSubscription
 * @property {string} event - Event name
 * @property {Function} callback - Callback function
 * @property {Object} [context] - Execution context
 * @property {boolean} [once] - If true, unsubscribe after first call
 */

/**
 * Global Event Bus for pub/sub messaging
 * @class
 * @example
 * // Subscribe to an event
 * eventBus.on('player:damaged', (data) => console.log(data.amount));
 * 
 * // Emit an event
 * eventBus.emit('player:damaged', { amount: 50, source: 'enemy' });
 */
class EventBus {
    constructor() {
        /** @private */
        this._listeners = new Map();
        
        /** @private */
        this._onceListeners = new Map();
        
        /** @private - For debugging */
        this._eventHistory = [];
        this._maxHistory = 100;
        
        /** @private */
        this._paused = false;
        this._queuedEvents = [];
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name (use namespacing like 'combat:damage')
     * @param {Function} callback - Callback function
     * @param {Object} [context=null] - Execution context (this binding)
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, context = null) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        
        const subscription = { callback, context };
        this._listeners.get(event).push(subscription);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Subscribe to an event, but only fire once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} [context=null] - Execution context
     * @returns {Function} Unsubscribe function
     */
    once(event, callback, context = null) {
        if (!this._onceListeners.has(event)) {
            this._onceListeners.set(event, []);
        }
        
        const subscription = { callback, context };
        this._onceListeners.get(event).push(subscription);
        
        return () => this.off(event, callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - The callback to remove
     */
    off(event, callback) {
        // Check regular listeners
        if (this._listeners.has(event)) {
            const listeners = this._listeners.get(event);
            const index = listeners.findIndex(sub => sub.callback === callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
        
        // Check once listeners
        if (this._onceListeners.has(event)) {
            const listeners = this._onceListeners.get(event);
            const index = listeners.findIndex(sub => sub.callback === callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} [data] - Data to pass to callbacks
     * @returns {boolean} True if any listeners were called
     */
    emit(event, data = null) {
        if (this._paused) {
            this._queuedEvents.push({ event, data, timestamp: Date.now() });
            return false;
        }
        
        let called = false;
        
        // Track event history (for debugging)
        this._trackEvent(event, data);
        
        // Call regular listeners
        if (this._listeners.has(event)) {
            const listeners = this._listeners.get(event);
            listeners.forEach(sub => {
                try {
                    sub.callback.call(sub.context, data);
                    called = true;
                } catch (error) {
                    console.error(`[EventBus] Error in listener for "${event}":`, error);
                }
            });
        }
        
        // Call and remove once listeners
        if (this._onceListeners.has(event)) {
            const listeners = this._onceListeners.get(event);
            listeners.forEach(sub => {
                try {
                    sub.callback.call(sub.context, data);
                    called = true;
                } catch (error) {
                    console.error(`[EventBus] Error in once-listener for "${event}":`, error);
                }
            });
            this._onceListeners.delete(event);
        }
        
        // Also emit to wildcard listeners
        if (this._listeners.has('*')) {
            this._listeners.get('*').forEach(sub => {
                try {
                    sub.callback.call(sub.context, { event, data });
                } catch (error) {
                    console.error(`[EventBus] Error in wildcard listener:`, error);
                }
            });
        }
        
        return called;
    }
    
    /**
     * Remove all listeners for an event, or all events
     * @param {string} [event] - Event name, or omit to clear all
     */
    clear(event = null) {
        if (event) {
            this._listeners.delete(event);
            this._onceListeners.delete(event);
        } else {
            this._listeners.clear();
            this._onceListeners.clear();
        }
    }
    
    /**
     * Pause event emission (events are queued)
     */
    pause() {
        this._paused = true;
    }
    
    /**
     * Resume event emission and flush queued events
     */
    resume() {
        this._paused = false;
        
        // Flush queued events
        const queued = [...this._queuedEvents];
        this._queuedEvents = [];
        
        queued.forEach(({ event, data }) => {
            this.emit(event, data);
        });
    }
    
    /**
     * Get count of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Listener count
     */
    listenerCount(event) {
        let count = 0;
        if (this._listeners.has(event)) {
            count += this._listeners.get(event).length;
        }
        if (this._onceListeners.has(event)) {
            count += this._onceListeners.get(event).length;
        }
        return count;
    }
    
    /**
     * Get event history for debugging
     * @returns {Array} Recent event history
     */
    getHistory() {
        return [...this._eventHistory];
    }
    
    /** @private */
    _trackEvent(event, data) {
        this._eventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });
        
        // Trim history
        if (this._eventHistory.length > this._maxHistory) {
            this._eventHistory.shift();
        }
    }
}

// Singleton instance
export const eventBus = new EventBus();

// Named events for type safety and autocomplete
export const GameEvents = {
    // Combat
    COMBAT_DAMAGE: 'combat:damage',
    COMBAT_HEAL: 'combat:heal',
    COMBAT_MISS: 'combat:miss',
    COMBAT_DODGE: 'combat:dodge',
    COMBAT_PARRY: 'combat:parry',
    COMBAT_BLOCK: 'combat:block',
    COMBAT_CRIT: 'combat:crit',
    COMBAT_KILL: 'combat:kill',
    COMBAT_DEATH: 'combat:death',
    COMBAT_ABILITY_ANIMATION: 'combat:abilityAnimation',
    
    // Player
    PLAYER_LEVEL_UP: 'player:levelUp',
    PLAYER_XP_GAIN: 'player:xpGain',
    PLAYER_STAT_CHANGE: 'player:statChange',
    PLAYER_POSITION: 'player:position',
    
    // Buffs
    BUFF_APPLIED: 'buff:applied',
    BUFF_REMOVED: 'buff:removed',
    BUFF_REFRESHED: 'buff:refreshed',
    DEBUFF_APPLIED: 'debuff:applied',
    DEBUFF_REMOVED: 'debuff:removed',
    
    // Target
    TARGET_CHANGED: 'target:changed',
    TARGET_LOST: 'target:lost',
    TARGET_HEALTH_CHANGED: 'target:healthChanged',
    
    // Entity
    ENTITY_DAMAGED: 'entity:damaged',
    ENTITY_HEALED: 'entity:healed',
    ENTITY_DIED: 'entity:died',
    ENTITY_SPAWNED: 'entity:spawned',
    
    // UI
    UI_WINDOW_OPENED: 'ui:windowOpened',
    UI_WINDOW_CLOSED: 'ui:windowClosed',
    UI_SETTINGS_CHANGED: 'ui:settingsChanged',
    
    // System
    SYSTEM_READY: 'system:ready',
    SYSTEM_ERROR: 'system:error',
    SYSTEM_PAUSE: 'system:pause',
    SYSTEM_RESUME: 'system:resume'
};

export default EventBus;
