/**
 * @fileoverview Draggable window component with position persistence
 * Base class for game windows (inventory, character, etc.)
 * @module components/base/DraggableWindow
 */

import { UIComponent } from './UIComponent.js';
import { eventBus, GameEvents } from '../../core/EventBus.js';
import { UIDefaults, UILayer } from '../../core/Constants.js';

const POSITION_STORAGE_KEY = 'grudge_window_positions';

/**
 * @typedef {Object} DraggableWindowOptions
 * @property {string} [title='Window'] - Window title
 * @property {number} [width=300] - Default width
 * @property {number} [height=400] - Default height
 * @property {number} [minWidth=200] - Minimum width
 * @property {number} [minHeight=150] - Minimum height
 * @property {boolean} [resizable=true] - Allow resizing
 * @property {boolean} [closable=true] - Show close button
 * @property {boolean} [minimizable=false] - Show minimize button
 * @property {string} [persistKey] - Key for position persistence
 * @property {number} [x] - Initial X position
 * @property {number} [y] - Initial Y position
 */

/**
 * Draggable window component
 */
export class DraggableWindow extends UIComponent {
    /**
     * @param {DraggableWindowOptions} [options={}]
     */
    constructor(options = {}) {
        super(options);
        
        this.title = options.title || 'Window';
        this.width = options.width || 300;
        this.height = options.height || 400;
        this.minWidth = options.minWidth || 200;
        this.minHeight = options.minHeight || 150;
        this.resizable = options.resizable !== false;
        this.closable = options.closable !== false;
        this.minimizable = options.minimizable || false;
        this.persistKey = options.persistKey || null;
        
        this._x = options.x ?? 100;
        this._y = options.y ?? 100;
        this._minimized = false;
        this._dragging = false;
        this._resizing = false;
        this._dragOffset = { x: 0, y: 0 };
        this._resizeStart = { x: 0, y: 0, width: 0, height: 0 };
        
        // Load saved position
        this._loadPosition();
    }
    
    render() {
        const el = this.createElement('div', {
            className: 'draggable-window',
            style: {
                position: 'fixed',
                left: `${this._x}px`,
                top: `${this._y}px`,
                width: `${this.width}px`,
                height: `${this.height}px`,
                minWidth: `${this.minWidth}px`,
                minHeight: `${this.minHeight}px`,
                backgroundColor: UIDefaults.WINDOW_BACKGROUND,
                border: UIDefaults.WINDOW_BORDER,
                borderRadius: UIDefaults.BORDER_RADIUS,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: UILayer.WINDOWS.toString(),
                fontFamily: UIDefaults.FONT_FAMILY,
                color: '#eee',
                overflow: 'hidden'
            }
        });
        
        // Header
        this._header = this.createElement('div', {
            className: 'window-header',
            style: {
                background: UIDefaults.WINDOW_HEADER_BG,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
                userSelect: 'none',
                borderBottom: '1px solid #4a4a4a',
                flexShrink: '0'
            }
        });
        
        // Title
        this._titleEl = this.createElement('span', {
            className: 'window-title',
            style: {
                fontWeight: 'bold',
                fontSize: UIDefaults.FONT_SIZE_NORMAL
            },
            textContent: this.title
        });
        this._header.appendChild(this._titleEl);
        
        // Header buttons
        const btnContainer = this.createElement('div', {
            style: {
                display: 'flex',
                gap: '4px'
            }
        });
        
        if (this.minimizable) {
            this._minimizeBtn = this._createHeaderButton('−');
            btnContainer.appendChild(this._minimizeBtn);
        }
        
        if (this.closable) {
            this._closeBtn = this._createHeaderButton('×');
            btnContainer.appendChild(this._closeBtn);
        }
        
        this._header.appendChild(btnContainer);
        el.appendChild(this._header);
        
        // Content area
        this._contentArea = this.createElement('div', {
            className: 'window-content',
            style: {
                flex: '1',
                overflow: 'auto',
                padding: '12px'
            }
        });
        el.appendChild(this._contentArea);
        
        // Resize handle
        if (this.resizable) {
            this._resizeHandle = this.createElement('div', {
                className: 'window-resize-handle',
                style: {
                    position: 'absolute',
                    right: '0',
                    bottom: '0',
                    width: '16px',
                    height: '16px',
                    cursor: 'se-resize',
                    background: `linear-gradient(135deg, 
                        transparent 0%, transparent 50%, 
                        #666 50%, #666 60%, 
                        transparent 60%, transparent 70%, 
                        #666 70%, #666 80%, 
                        transparent 80%, transparent 100%)`
                }
            });
            el.appendChild(this._resizeHandle);
        }
        
        return el;
    }
    
    bindEvents() {
        // Header drag
        this.addDOMListener(this._header, 'mousedown', this._onDragStart);
        
        // Close button
        if (this._closeBtn) {
            this.addDOMListener(this._closeBtn, 'click', () => this.hide());
        }
        
        // Minimize button
        if (this._minimizeBtn) {
            this.addDOMListener(this._minimizeBtn, 'click', () => this.toggleMinimize());
        }
        
        // Resize handle
        if (this._resizeHandle) {
            this.addDOMListener(this._resizeHandle, 'mousedown', this._onResizeStart);
        }
        
        // Global mouse events
        this.addDOMListener(document, 'mousemove', this._onMouseMove);
        this.addDOMListener(document, 'mouseup', this._onMouseUp);
        
        // Bring to front on click
        this.addDOMListener(this.element, 'mousedown', this._bringToFront);
    }
    
    /**
     * Set the window title
     * @param {string} title
     */
    setTitle(title) {
        this.title = title;
        if (this._titleEl) {
            this._titleEl.textContent = title;
        }
    }
    
    /**
     * Get the content container element
     * @returns {HTMLElement}
     */
    getContentElement() {
        return this._contentArea;
    }
    
    /**
     * Set window content HTML
     * @param {string} html
     */
    setContent(html) {
        if (this._contentArea) {
            this._contentArea.innerHTML = html;
        }
    }
    
    /**
     * Append element to content
     * @param {HTMLElement} element
     */
    appendContent(element) {
        if (this._contentArea) {
            this._contentArea.appendChild(element);
        }
    }
    
    /**
     * Clear content
     */
    clearContent() {
        if (this._contentArea) {
            this._contentArea.innerHTML = '';
        }
    }
    
    /**
     * Toggle minimized state
     */
    toggleMinimize() {
        this._minimized = !this._minimized;
        
        if (this._minimized) {
            this._savedHeight = this.element.style.height;
            this._contentArea.style.display = 'none';
            this.element.style.height = 'auto';
            this.element.style.minHeight = '0';
            if (this._resizeHandle) {
                this._resizeHandle.style.display = 'none';
            }
        } else {
            this._contentArea.style.display = 'block';
            this.element.style.height = this._savedHeight;
            this.element.style.minHeight = `${this.minHeight}px`;
            if (this._resizeHandle) {
                this._resizeHandle.style.display = 'block';
            }
        }
    }
    
    /**
     * Set window position
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this._x = x;
        this._y = y;
        
        if (this.element) {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
        
        this._savePosition();
    }
    
    /**
     * Set window size
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) {
        this.width = Math.max(width, this.minWidth);
        this.height = Math.max(height, this.minHeight);
        
        if (this.element) {
            this.element.style.width = `${this.width}px`;
            this.element.style.height = `${this.height}px`;
        }
        
        this._savePosition();
    }
    
    /**
     * Center the window on screen
     */
    center() {
        const x = (window.innerWidth - this.width) / 2;
        const y = (window.innerHeight - this.height) / 2;
        this.setPosition(x, y);
    }
    
    /** @private */
    _createHeaderButton(text) {
        return this.createElement('button', {
            style: {
                background: 'none',
                border: 'none',
                color: '#aaa',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 6px',
                lineHeight: '1',
                borderRadius: '2px',
                transition: 'background 0.1s ease'
            },
            textContent: text
        });
    }
    
    /** @private */
    _onDragStart = (e) => {
        // Only drag from header, not buttons
        if (e.target.tagName === 'BUTTON') return;
        
        this._dragging = true;
        this._dragOffset = {
            x: e.clientX - this._x,
            y: e.clientY - this._y
        };
        
        this.element.style.transition = 'none';
        this._bringToFront();
    }
    
    /** @private */
    _onResizeStart = (e) => {
        e.stopPropagation();
        this._resizing = true;
        this._resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: this.element.offsetWidth,
            height: this.element.offsetHeight
        };
        
        this.element.style.transition = 'none';
    }
    
    /** @private */
    _onMouseMove = (e) => {
        if (this._dragging) {
            let newX = e.clientX - this._dragOffset.x;
            let newY = e.clientY - this._dragOffset.y;
            
            // Keep on screen
            newX = Math.max(0, Math.min(newX, window.innerWidth - 50));
            newY = Math.max(0, Math.min(newY, window.innerHeight - 50));
            
            this._x = newX;
            this._y = newY;
            this.element.style.left = `${newX}px`;
            this.element.style.top = `${newY}px`;
        }
        
        if (this._resizing) {
            const deltaX = e.clientX - this._resizeStart.x;
            const deltaY = e.clientY - this._resizeStart.y;
            
            const newWidth = Math.max(this.minWidth, this._resizeStart.width + deltaX);
            const newHeight = Math.max(this.minHeight, this._resizeStart.height + deltaY);
            
            this.width = newWidth;
            this.height = newHeight;
            this.element.style.width = `${newWidth}px`;
            this.element.style.height = `${newHeight}px`;
        }
    }
    
    /** @private */
    _onMouseUp = () => {
        if (this._dragging || this._resizing) {
            this._savePosition();
        }
        
        this._dragging = false;
        this._resizing = false;
        
        if (this.element) {
            this.element.style.transition = '';
        }
    }
    
    /** @private */
    _bringToFront = () => {
        // Get all windows and find highest z-index
        const windows = document.querySelectorAll('.draggable-window');
        let maxZ = UILayer.WINDOWS;
        
        windows.forEach(win => {
            const z = parseInt(win.style.zIndex) || UILayer.WINDOWS;
            if (z > maxZ) maxZ = z;
        });
        
        this.element.style.zIndex = (maxZ + 1).toString();
    }
    
    /** @private */
    _savePosition() {
        if (!this.persistKey) return;
        
        try {
            const saved = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
            saved[this.persistKey] = {
                x: this._x,
                y: this._y,
                width: this.width,
                height: this.height
            };
            localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(saved));
        } catch (e) {
            // Ignore storage errors
        }
    }
    
    /** @private */
    _loadPosition() {
        if (!this.persistKey) return;
        
        try {
            const saved = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
            const pos = saved[this.persistKey];
            
            if (pos) {
                this._x = pos.x ?? this._x;
                this._y = pos.y ?? this._y;
                this.width = pos.width ?? this.width;
                this.height = pos.height ?? this.height;
                
                // Validate on screen
                if (this._x > window.innerWidth - 50) {
                    this._x = window.innerWidth - this.width - 50;
                }
                if (this._y > window.innerHeight - 50) {
                    this._y = window.innerHeight - this.height - 50;
                }
                if (this._x < 0) this._x = 0;
                if (this._y < 0) this._y = 0;
            }
        } catch (e) {
            // Ignore storage errors
        }
    }
    
    onShow() {
        this._visible = true;
        if (this.element) {
            this.element.style.display = 'flex';
        }
        this._bringToFront();
        this.emit(GameEvents.UI_WINDOW_OPENED, { window: this.persistKey || this.id });
    }
    
    onHide() {
        this._visible = false;
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.emit(GameEvents.UI_WINDOW_CLOSED, { window: this.persistKey || this.id });
    }
}

export default DraggableWindow;
