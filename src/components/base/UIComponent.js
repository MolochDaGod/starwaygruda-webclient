/**
 * @fileoverview Base class for all UI components
 * Provides lifecycle management, event handling, and common utilities
 * @module components/base/UIComponent
 */

import { eventBus } from '../../core/EventBus.js';
import { UIDefaults, Timing } from '../../core/Constants.js';

/**
 * @typedef {Object} UIComponentOptions
 * @property {string} [id] - Unique identifier
 * @property {string} [className] - CSS class name
 * @property {HTMLElement} [parent] - Parent element
 * @property {boolean} [visible=true] - Initial visibility
 * @property {Object} [style] - Initial inline styles
 */

/**
 * Base class for UI components
 * @abstract
 */
export class UIComponent {
    /**
     * @param {UIComponentOptions} [options={}]
     */
    constructor(options = {}) {
        /** @type {string} */
        this.id = options.id || `ui-${UIComponent._idCounter++}`;
        
        /** @type {HTMLElement|null} */
        this.element = null;
        
        /** @type {HTMLElement|null} */
        this.parent = options.parent || null;
        
        /** @type {boolean} */
        this._visible = options.visible !== false;
        
        /** @type {boolean} */
        this._initialized = false;
        
        /** @type {boolean} */
        this._destroyed = false;
        
        /** @type {Map<string, Function>} - Event unsubscribe functions */
        this._eventSubscriptions = new Map();
        
        /** @type {Map<string, number>} - Interval/timeout IDs */
        this._timers = new Map();
        
        /** @type {Object} - Component options */
        this._options = options;
        
        /** @type {UIComponent[]} - Child components */
        this._children = [];
        
        /** @type {UIComponent|null} - Parent component */
        this._parentComponent = null;
    }
    
    /** @private */
    static _idCounter = 0;
    
    // ========================================================================
    // LIFECYCLE METHODS
    // ========================================================================
    
    /**
     * Initialize the component - call this after construction
     * @returns {UIComponent} this for chaining
     */
    init() {
        if (this._initialized || this._destroyed) return this;
        
        this.element = this.render();
        
        if (this.element) {
            this.element.id = this.id;
            this.element.dataset.component = this.constructor.name;
            
            if (this._options.className) {
                this.element.classList.add(this._options.className);
            }
            
            if (this._options.style) {
                Object.assign(this.element.style, this._options.style);
            }
            
            if (!this._visible) {
                this.element.style.display = 'none';
            }
            
            this.bindEvents();
            
            if (this.parent) {
                this.parent.appendChild(this.element);
            }
        }
        
        this._initialized = true;
        this.onInit();
        
        return this;
    }
    
    /**
     * Create and return the component's DOM element
     * @abstract
     * @returns {HTMLElement}
     */
    render() {
        // Override in subclass
        const el = document.createElement('div');
        return el;
    }
    
    /**
     * Bind DOM and custom events
     * @abstract
     */
    bindEvents() {
        // Override in subclass
    }
    
    /**
     * Called after initialization
     * @abstract
     */
    onInit() {
        // Override in subclass
    }
    
    /**
     * Update the component (called each frame if registered)
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Override in subclass
    }
    
    /**
     * Clean up and destroy the component
     */
    destroy() {
        if (this._destroyed) return;
        
        this.onDestroy();
        
        // Destroy children first
        this._children.forEach(child => child.destroy());
        this._children = [];
        
        // Unsubscribe from all events
        this._eventSubscriptions.forEach(unsub => unsub());
        this._eventSubscriptions.clear();
        
        // Clear all timers
        this._timers.forEach((id, key) => {
            if (key.startsWith('interval:')) {
                clearInterval(id);
            } else {
                clearTimeout(id);
            }
        });
        this._timers.clear();
        
        // Remove from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Remove from parent component
        if (this._parentComponent) {
            const idx = this._parentComponent._children.indexOf(this);
            if (idx !== -1) {
                this._parentComponent._children.splice(idx, 1);
            }
        }
        
        this.element = null;
        this._destroyed = true;
    }
    
    /**
     * Called before destruction
     * @abstract
     */
    onDestroy() {
        // Override in subclass
    }
    
    // ========================================================================
    // VISIBILITY
    // ========================================================================
    
    /**
     * Show the component
     * @param {boolean} [animate=false] - Use fade animation
     */
    show(animate = false) {
        if (!this.element || this._visible) return;
        
        this._visible = true;
        
        if (animate) {
            this.element.style.opacity = '0';
            this.element.style.display = '';
            this.element.style.transition = `opacity ${UIDefaults.TRANSITION_NORMAL}`;
            
            requestAnimationFrame(() => {
                this.element.style.opacity = '1';
            });
        } else {
            this.element.style.display = '';
        }
        
        this.onShow();
    }
    
    /**
     * Hide the component
     * @param {boolean} [animate=false] - Use fade animation
     */
    hide(animate = false) {
        if (!this.element || !this._visible) return;
        
        this._visible = false;
        
        if (animate) {
            this.element.style.transition = `opacity ${UIDefaults.TRANSITION_NORMAL}`;
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                if (!this._visible) {
                    this.element.style.display = 'none';
                }
            }, parseFloat(UIDefaults.TRANSITION_NORMAL) * 1000);
        } else {
            this.element.style.display = 'none';
        }
        
        this.onHide();
    }
    
    /**
     * Toggle visibility
     * @param {boolean} [animate=false]
     */
    toggle(animate = false) {
        if (this._visible) {
            this.hide(animate);
        } else {
            this.show(animate);
        }
    }
    
    /** @returns {boolean} */
    get visible() {
        return this._visible;
    }
    
    /**
     * Called when shown
     * @abstract
     */
    onShow() {
        // Override in subclass
    }
    
    /**
     * Called when hidden
     * @abstract
     */
    onHide() {
        // Override in subclass
    }
    
    // ========================================================================
    // EVENT HELPERS
    // ========================================================================
    
    /**
     * Subscribe to a game event (auto-unsubscribes on destroy)
     * @param {string} event - Event name
     * @param {Function} callback - Handler
     * @param {Object} [context=this] - Execution context
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, context = this) {
        const unsub = eventBus.on(event, callback, context);
        this._eventSubscriptions.set(`${event}:${callback.name || 'anon'}`, unsub);
        return unsub;
    }
    
    /**
     * Subscribe to event once
     * @param {string} event - Event name
     * @param {Function} callback - Handler
     * @param {Object} [context=this]
     */
    once(event, callback, context = this) {
        const unsub = eventBus.once(event, callback, context);
        this._eventSubscriptions.set(`${event}:once:${callback.name || 'anon'}`, unsub);
        return unsub;
    }
    
    /**
     * Emit a game event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        eventBus.emit(event, data);
    }
    
    /**
     * Add DOM event listener (auto-removes on destroy)
     * @param {HTMLElement} element - Target element
     * @param {string} eventType - Event type
     * @param {Function} handler - Handler function
     * @param {Object} [options] - addEventListener options
     */
    addDOMListener(element, eventType, handler, options) {
        const boundHandler = handler.bind(this);
        element.addEventListener(eventType, boundHandler, options);
        
        // Store for cleanup
        const key = `dom:${element.id || 'el'}:${eventType}`;
        const cleanup = () => element.removeEventListener(eventType, boundHandler, options);
        this._eventSubscriptions.set(key, cleanup);
    }
    
    // ========================================================================
    // TIMER HELPERS
    // ========================================================================
    
    /**
     * Set an interval (auto-clears on destroy)
     * @param {Function} callback
     * @param {number} ms - Interval in milliseconds
     * @param {string} [key] - Optional key for manual clearing
     * @returns {number} Interval ID
     */
    setInterval(callback, ms, key = null) {
        const id = setInterval(callback.bind(this), ms);
        this._timers.set(`interval:${key || id}`, id);
        return id;
    }
    
    /**
     * Set a timeout (auto-clears on destroy)
     * @param {Function} callback
     * @param {number} ms - Delay in milliseconds
     * @param {string} [key] - Optional key for manual clearing
     * @returns {number} Timeout ID
     */
    setTimeout(callback, ms, key = null) {
        const id = setTimeout(() => {
            this._timers.delete(`timeout:${key || id}`);
            callback.call(this);
        }, ms);
        this._timers.set(`timeout:${key || id}`, id);
        return id;
    }
    
    /**
     * Clear a timer by key
     * @param {string} key
     */
    clearTimer(key) {
        if (this._timers.has(`interval:${key}`)) {
            clearInterval(this._timers.get(`interval:${key}`));
            this._timers.delete(`interval:${key}`);
        }
        if (this._timers.has(`timeout:${key}`)) {
            clearTimeout(this._timers.get(`timeout:${key}`));
            this._timers.delete(`timeout:${key}`);
        }
    }
    
    // ========================================================================
    // CHILD COMPONENT MANAGEMENT
    // ========================================================================
    
    /**
     * Add a child component
     * @param {UIComponent} child
     * @param {HTMLElement} [container=this.element] - Container element
     * @returns {UIComponent} The child
     */
    addChild(child, container = null) {
        child._parentComponent = this;
        child.parent = container || this.element;
        this._children.push(child);
        
        if (!child._initialized) {
            child.init();
        } else if (child.element && child.parent) {
            child.parent.appendChild(child.element);
        }
        
        return child;
    }
    
    /**
     * Remove a child component
     * @param {UIComponent} child
     * @param {boolean} [destroy=true] - Also destroy the child
     */
    removeChild(child, destroy = true) {
        const idx = this._children.indexOf(child);
        if (idx !== -1) {
            this._children.splice(idx, 1);
            child._parentComponent = null;
            
            if (destroy) {
                child.destroy();
            }
        }
    }
    
    /**
     * Find a child by ID
     * @param {string} id
     * @returns {UIComponent|null}
     */
    findChild(id) {
        return this._children.find(c => c.id === id) || null;
    }
    
    // ========================================================================
    // DOM HELPERS
    // ========================================================================
    
    /**
     * Query selector within this component
     * @param {string} selector
     * @returns {HTMLElement|null}
     */
    $(selector) {
        return this.element?.querySelector(selector) || null;
    }
    
    /**
     * Query selector all within this component
     * @param {string} selector
     * @returns {NodeList}
     */
    $$(selector) {
        return this.element?.querySelectorAll(selector) || [];
    }
    
    /**
     * Create an element with options
     * @param {string} tag - Tag name
     * @param {Object} [options] - Options
     * @param {string} [options.className] - CSS class
     * @param {string} [options.id] - Element ID
     * @param {string} [options.textContent] - Text content
     * @param {string} [options.innerHTML] - HTML content
     * @param {Object} [options.style] - Inline styles
     * @param {Object} [options.attributes] - HTML attributes
     * @param {HTMLElement[]} [options.children] - Child elements
     * @returns {HTMLElement}
     */
    createElement(tag, options = {}) {
        const el = document.createElement(tag);
        
        if (options.className) el.className = options.className;
        if (options.id) el.id = options.id;
        if (options.textContent) el.textContent = options.textContent;
        if (options.innerHTML) el.innerHTML = options.innerHTML;
        if (options.style) Object.assign(el.style, options.style);
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([k, v]) => el.setAttribute(k, v));
        }
        if (options.children) {
            options.children.forEach(child => el.appendChild(child));
        }
        
        return el;
    }
    
    /**
     * Apply styles to an element
     * @param {HTMLElement} element
     * @param {Object} styles
     */
    applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }
    
    /**
     * Set element position
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        if (this.element) {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
    }
    
    /**
     * Get element bounds
     * @returns {DOMRect|null}
     */
    getBounds() {
        return this.element?.getBoundingClientRect() || null;
    }
}

export default UIComponent;
