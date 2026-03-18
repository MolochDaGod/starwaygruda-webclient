import * as THREE from 'three';

/**
 * Unified Input Manager
 * Centralizes ALL hotkeys and input handling across game modes
 * Prevents conflicts and duplicates
 */
export class UnifiedInputManager {
    constructor() {
        // Current game mode determines which hotkeys are active
        this.mode = 'ground'; // 'ground', 'space', 'menu', 'chat', 'editor'
        
        // Key states
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        
        // Mouse state
        this.mouse = {
            x: 0, y: 0,
            deltaX: 0, deltaY: 0,
            leftDown: false, rightDown: false,
            leftJustPressed: false, rightJustPressed: false
        };
        
        // Registered callbacks by mode and key
        this.callbacks = {
            global: {},    // Always active
            ground: {},    // Ground/MMO mode
            space: {},     // Space flight mode
            combat: {},    // Combat mode
            menu: {},      // Menu/UI mode
        };
        
        // Movement state (always tracked)
        this.movement = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            sprint: false,
            jump: false
        };
        
        // Bound event handlers (for cleanup)
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        
        this.init();
        this.registerDefaultHotkeys();
        
        console.log('🎮 Unified Input Manager initialized');
    }
    
    init() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mouseup', this._onMouseUp);
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Register default hotkeys - THE SINGLE SOURCE OF TRUTH
     */
    registerDefaultHotkeys() {
        // ============ GLOBAL HOTKEYS (always work) ============
        this.register('global', 'Escape', 'closeMenu', 'Close current menu');
        this.register('global', 'F1', 'toggleHelp', 'Show help overlay');
        this.register('global', 'KeyH', 'toggleHelp', 'Show help overlay');
        this.register('global', 'Backquote', 'toggleConsole', 'Toggle dev console');
        
        // ============ GROUND MODE HOTKEYS ============
        // Movement
        this.register('ground', 'KeyW', 'moveForward', 'Move forward');
        this.register('ground', 'KeyS', 'moveBackward', 'Move backward');
        this.register('ground', 'KeyA', 'strafeLeft', 'Strafe left');
        this.register('ground', 'KeyD', 'strafeRight', 'Strafe right');
        this.register('ground', 'Space', 'jump', 'Jump');
        this.register('ground', 'ShiftLeft', 'sprint', 'Sprint');
        this.register('ground', 'ShiftRight', 'sprint', 'Sprint');
        
        // Interaction
        this.register('ground', 'KeyE', 'interact', 'Interact / Board ship');
        this.register('ground', 'KeyF', 'useItem', 'Use item / Takeoff');
        this.register('ground', 'KeyR', 'reload', 'Reload weapon');
        this.register('ground', 'Tab', 'cycleTarget', 'Cycle targets');
        
        // UI
        this.register('ground', 'KeyI', 'toggleInventory', 'Inventory');
        this.register('ground', 'KeyC', 'toggleCharacter', 'Character sheet');
        this.register('ground', 'KeyM', 'toggleMap', 'Map / Minimap');
        this.register('ground', 'KeyJ', 'toggleQuests', 'Quest log');
        this.register('ground', 'KeyK', 'toggleSkills', 'Skills');
        this.register('ground', 'KeyP', 'toggleParty', 'Party/Social');
        this.register('ground', 'KeyT', 'fastTravel', 'Fast travel (admin)');
        this.register('ground', 'KeyV', 'toggleCamera', 'Toggle camera view');
        
        // Hotbar (1-0 keys)
        for (let i = 1; i <= 9; i++) {
            this.register('ground', `Digit${i}`, `hotbar${i}`, `Hotbar slot ${i}`);
        }
        this.register('ground', 'Digit0', 'hotbar10', 'Hotbar slot 10');
        
        // ============ SPACE MODE HOTKEYS ============
        // Flight controls
        this.register('space', 'KeyW', 'thrustForward', 'Thrust forward');
        this.register('space', 'KeyS', 'thrustBackward', 'Thrust backward');
        this.register('space', 'KeyA', 'turnLeft', 'Turn left');
        this.register('space', 'KeyD', 'turnRight', 'Turn right');
        this.register('space', 'KeyQ', 'rollLeft', 'Roll left / Ascend');
        this.register('space', 'KeyE', 'rollRight', 'Roll right / Descend');
        this.register('space', 'ShiftLeft', 'boost', 'Boost / Afterburner');
        this.register('space', 'Space', 'fireWeapons', 'Fire weapons');
        
        // Ship controls  
        this.register('space', 'Tab', 'cycleShip', 'Cycle ships');
        this.register('space', 'KeyC', 'changeShip', 'Change ship type');
        this.register('space', 'KeyL', 'land', 'Land on planet');
        this.register('space', 'KeyM', 'toggleDashboard', 'Flight dashboard');
        this.register('space', 'KeyV', 'toggleCameraView', 'Camera view');
        this.register('space', 'KeyR', 'resetPosition', 'Reset position');
        this.register('space', 'KeyF', 'exitShip', 'Exit ship (when landed)');
        
        // ============ COMBAT MODE HOTKEYS ============
        this.register('combat', 'KeyZ', 'battleCry', 'Battle cry (Z mechanic)');
        this.register('combat', 'KeyX', 'block', 'Block / Parry');
        this.register('combat', 'KeyC', 'dodge', 'Dodge roll');
        
        console.log('📋 Default hotkeys registered');
    }
    
    /**
     * Register a hotkey
     */
    register(mode, keyCode, action, description = '') {
        if (!this.callbacks[mode]) {
            this.callbacks[mode] = {};
        }
        
        this.callbacks[mode][keyCode] = {
            action,
            description,
            callback: null, // Will be set by game systems
            enabled: true
        };
    }
    
    /**
     * Bind a callback to an action
     */
    bindAction(action, callback) {
        for (const mode of Object.keys(this.callbacks)) {
            for (const [keyCode, binding] of Object.entries(this.callbacks[mode])) {
                if (binding.action === action) {
                    binding.callback = callback;
                }
            }
        }
    }
    
    /**
     * Unbind an action
     */
    unbindAction(action) {
        for (const mode of Object.keys(this.callbacks)) {
            for (const [keyCode, binding] of Object.entries(this.callbacks[mode])) {
                if (binding.action === action) {
                    binding.callback = null;
                }
            }
        }
    }
    
    /**
     * Set the current game mode
     */
    setMode(mode) {
        if (this.callbacks[mode] || mode === 'chat' || mode === 'editor') {
            console.log(`🎮 Input mode changed: ${this.mode} → ${mode}`);
            this.mode = mode;
        }
    }
    
    /**
     * Check if typing in an input field
     */
    isTyping() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    }
    
    /**
     * Key down handler
     */
    onKeyDown(event) {
        const code = event.code;
        
        // Skip if typing in input
        if (this.isTyping() && code !== 'Escape') {
            return;
        }
        
        // Track key state
        if (!this.keys[code]) {
            this.keysJustPressed[code] = true;
        }
        this.keys[code] = true;
        
        // Update movement state
        this.updateMovement(code, true);
        
        // Fire callbacks for current mode and global
        this.fireCallback('global', code, event);
        this.fireCallback(this.mode, code, event);
    }
    
    /**
     * Key up handler
     */
    onKeyUp(event) {
        const code = event.code;
        
        this.keys[code] = false;
        this.keysJustReleased[code] = true;
        
        // Update movement state
        this.updateMovement(code, false);
    }
    
    /**
     * Update movement flags
     */
    updateMovement(code, pressed) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.movement.forward = pressed;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.movement.backward = pressed;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.movement.left = pressed;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.movement.right = pressed;
                break;
            case 'KeyQ':
                this.movement.up = pressed;
                break;
            case 'KeyE':
                this.movement.down = pressed;
                break;
            case 'Space':
                this.movement.jump = pressed;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.movement.sprint = pressed;
                break;
        }
    }
    
    /**
     * Fire callback for a key in a mode
     */
    fireCallback(mode, code, event) {
        const bindings = this.callbacks[mode];
        if (!bindings) return;
        
        const binding = bindings[code];
        if (binding && binding.enabled && binding.callback) {
            // Prevent default for game keys
            event.preventDefault();
            binding.callback(event);
        }
    }
    
    /**
     * Mouse move handler
     */
    onMouseMove(event) {
        this.mouse.deltaX = event.movementX || 0;
        this.mouse.deltaY = event.movementY || 0;
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }
    
    /**
     * Mouse down handler
     */
    onMouseDown(event) {
        if (event.button === 0) {
            this.mouse.leftJustPressed = !this.mouse.leftDown;
            this.mouse.leftDown = true;
        } else if (event.button === 2) {
            this.mouse.rightJustPressed = !this.mouse.rightDown;
            this.mouse.rightDown = true;
        }
    }
    
    /**
     * Mouse up handler
     */
    onMouseUp(event) {
        if (event.button === 0) {
            this.mouse.leftDown = false;
        } else if (event.button === 2) {
            this.mouse.rightDown = false;
        }
    }
    
    /**
     * Call once per frame to clear just-pressed states
     */
    update() {
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.mouse.leftJustPressed = false;
        this.mouse.rightJustPressed = false;
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    /**
     * Check if a key is currently held
     */
    isKeyDown(code) {
        return !!this.keys[code];
    }
    
    /**
     * Check if a key was just pressed this frame
     */
    isKeyJustPressed(code) {
        return !!this.keysJustPressed[code];
    }
    
    /**
     * Get all hotkeys for a mode (for help display)
     */
    getHotkeysForMode(mode) {
        const bindings = this.callbacks[mode] || {};
        return Object.entries(bindings).map(([code, binding]) => ({
            key: this.formatKeyCode(code),
            action: binding.action,
            description: binding.description
        }));
    }
    
    /**
     * Get all hotkeys as HTML for help overlay
     */
    getHotkeyHelpHTML() {
        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        // Global
        html += '<div><h3 style="color: #00ffff; border-bottom: 1px solid #00ffff;">Global</h3>';
        for (const hotkey of this.getHotkeysForMode('global')) {
            html += `<div><strong>${hotkey.key}</strong> - ${hotkey.description}</div>`;
        }
        html += '</div>';
        
        // Current mode
        const modeLabel = this.mode.charAt(0).toUpperCase() + this.mode.slice(1);
        html += `<div><h3 style="color: #ffaa00; border-bottom: 1px solid #ffaa00;">${modeLabel} Mode</h3>`;
        for (const hotkey of this.getHotkeysForMode(this.mode)) {
            html += `<div><strong>${hotkey.key}</strong> - ${hotkey.description}</div>`;
        }
        html += '</div>';
        
        html += '</div>';
        return html;
    }
    
    /**
     * Format key code for display
     */
    formatKeyCode(code) {
        const map = {
            'KeyW': 'W', 'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D',
            'KeyE': 'E', 'KeyF': 'F', 'KeyR': 'R', 'KeyQ': 'Q',
            'KeyI': 'I', 'KeyC': 'C', 'KeyM': 'M', 'KeyJ': 'J',
            'KeyK': 'K', 'KeyP': 'P', 'KeyT': 'T', 'KeyV': 'V',
            'KeyH': 'H', 'KeyL': 'L', 'KeyZ': 'Z', 'KeyX': 'X',
            'Space': 'Space', 'ShiftLeft': 'Shift', 'ShiftRight': 'Shift',
            'Tab': 'Tab', 'Escape': 'Esc', 'F1': 'F1',
            'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
            'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8',
            'Digit9': '9', 'Digit0': '0', 'Backquote': '`'
        };
        return map[code] || code;
    }
    
    /**
     * Cleanup
     */
    dispose() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mouseup', this._onMouseUp);
    }
}

// Singleton instance
let instance = null;

export function getInputManager() {
    if (!instance) {
        instance = new UnifiedInputManager();
    }
    return instance;
}

export default UnifiedInputManager;
