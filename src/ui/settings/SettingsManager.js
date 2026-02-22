/**
 * @fileoverview Settings manager with tabbed UI and localStorage persistence
 * Handles game configuration with Graphics, Audio, Keybinds, Interface tabs
 * @module ui/settings/SettingsManager
 */

import { UIComponent } from '../../components/base/UIComponent.js';
import { eventBus, GameEvents } from '../../core/EventBus.js';
import { 
    UIDefaults, 
    UILayer,
    SettingsKey, 
    DefaultSettings 
} from '../../core/Constants.js';

const STORAGE_KEY = 'grudge_game_settings';

/**
 * Settings manager - handles persistence and provides settings window
 */
export class SettingsManager extends UIComponent {
    constructor(options = {}) {
        super(options);
        
        /** @type {Object} - Current settings */
        this._settings = { ...DefaultSettings };
        
        /** @type {string} - Current tab */
        this._activeTab = 'graphics';
        
        /** @type {Map<string, Function>} - Setting change callbacks */
        this._watchers = new Map();
        
        // Load saved settings
        this._loadSettings();
    }
    
    render() {
        const el = this.createElement('div', {
            className: 'settings-window',
            style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                backgroundColor: UIDefaults.WINDOW_BACKGROUND,
                border: UIDefaults.WINDOW_BORDER,
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                zIndex: UILayer.WINDOWS.toString(),
                display: 'none',
                flexDirection: 'column',
                fontFamily: UIDefaults.FONT_FAMILY,
                color: '#eee'
            }
        });
        
        // Header
        const header = this.createElement('div', {
            className: 'settings-header',
            style: {
                background: UIDefaults.WINDOW_HEADER_BG,
                padding: '12px 16px',
                borderRadius: '6px 6px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #4a4a4a'
            }
        });
        
        const title = this.createElement('h2', {
            style: {
                margin: '0',
                fontSize: UIDefaults.FONT_SIZE_TITLE,
                fontWeight: 'bold'
            },
            textContent: 'Settings'
        });
        header.appendChild(title);
        
        this._closeBtn = this.createElement('button', {
            style: {
                background: 'none',
                border: 'none',
                color: '#aaa',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0 8px',
                lineHeight: '1'
            },
            textContent: '×'
        });
        header.appendChild(this._closeBtn);
        
        el.appendChild(header);
        
        // Tab bar
        this._tabBar = this.createElement('div', {
            className: 'settings-tabs',
            style: {
                display: 'flex',
                borderBottom: '1px solid #4a4a4a',
                backgroundColor: 'rgba(30, 30, 40, 0.5)'
            }
        });
        
        const tabs = [
            { id: 'graphics', label: 'Graphics' },
            { id: 'audio', label: 'Audio' },
            { id: 'interface', label: 'Interface' },
            { id: 'keybinds', label: 'Keybinds' }
        ];
        
        tabs.forEach(tab => {
            const tabBtn = this.createElement('button', {
                className: `settings-tab ${tab.id === this._activeTab ? 'active' : ''}`,
                style: {
                    flex: '1',
                    padding: '10px 16px',
                    border: 'none',
                    background: tab.id === this._activeTab ? 'rgba(60, 60, 80, 0.8)' : 'transparent',
                    color: tab.id === this._activeTab ? '#fff' : '#aaa',
                    fontSize: UIDefaults.FONT_SIZE_NORMAL,
                    cursor: 'pointer',
                    borderBottom: tab.id === this._activeTab ? '2px solid #66aaff' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                },
                textContent: tab.label,
                attributes: { 'data-tab': tab.id }
            });
            this._tabBar.appendChild(tabBtn);
        });
        
        el.appendChild(this._tabBar);
        
        // Content area
        this._content = this.createElement('div', {
            className: 'settings-content',
            style: {
                flex: '1',
                overflow: 'auto',
                padding: '16px'
            }
        });
        el.appendChild(this._content);
        
        // Footer with buttons
        const footer = this.createElement('div', {
            className: 'settings-footer',
            style: {
                padding: '12px 16px',
                borderTop: '1px solid #4a4a4a',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
            }
        });
        
        this._resetBtn = this.createElement('button', {
            style: this._buttonStyle('#666'),
            textContent: 'Reset to Defaults'
        });
        
        this._applyBtn = this.createElement('button', {
            style: this._buttonStyle('#4488cc'),
            textContent: 'Apply'
        });
        
        this._okBtn = this.createElement('button', {
            style: this._buttonStyle('#44aa44'),
            textContent: 'OK'
        });
        
        footer.appendChild(this._resetBtn);
        footer.appendChild(this._applyBtn);
        footer.appendChild(this._okBtn);
        el.appendChild(footer);
        
        return el;
    }
    
    bindEvents() {
        // Close button
        this.addDOMListener(this._closeBtn, 'click', () => this.hide());
        this.addDOMListener(this._closeBtn, 'mouseenter', () => {
            this._closeBtn.style.color = '#fff';
        });
        this.addDOMListener(this._closeBtn, 'mouseleave', () => {
            this._closeBtn.style.color = '#aaa';
        });
        
        // Tab clicks
        this.addDOMListener(this._tabBar, 'click', (e) => {
            const tabId = e.target.dataset?.tab;
            if (tabId) {
                this._switchTab(tabId);
            }
        });
        
        // Footer buttons
        this.addDOMListener(this._resetBtn, 'click', () => this.resetToDefaults());
        this.addDOMListener(this._applyBtn, 'click', () => this._saveSettings());
        this.addDOMListener(this._okBtn, 'click', () => {
            this._saveSettings();
            this.hide();
        });
        
        // ESC to close
        this.addDOMListener(document, 'keydown', (e) => {
            if (e.key === 'Escape' && this._visible) {
                this.hide();
            }
        });
    }
    
    onInit() {
        this._renderTabContent();
    }
    
    /**
     * Get a setting value
     * @param {string} key - SettingsKey
     * @returns {*} Setting value
     */
    get(key) {
        return this._settings[key] ?? DefaultSettings[key];
    }
    
    /**
     * Set a setting value
     * @param {string} key - SettingsKey
     * @param {*} value - New value
     * @param {boolean} [save=true] - Save to localStorage
     */
    set(key, value, save = true) {
        const oldValue = this._settings[key];
        this._settings[key] = value;
        
        // Notify watchers
        const watcher = this._watchers.get(key);
        if (watcher) {
            watcher(value, oldValue);
        }
        
        // Emit event
        eventBus.emit(GameEvents.UI_SETTINGS_CHANGED, { key, value, oldValue });
        
        if (save) {
            this._saveToStorage();
        }
    }
    
    /**
     * Watch a setting for changes
     * @param {string} key - SettingsKey
     * @param {Function} callback - (newValue, oldValue) => void
     * @returns {Function} Unwatch function
     */
    watch(key, callback) {
        this._watchers.set(key, callback);
        return () => this._watchers.delete(key);
    }
    
    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        this._settings = { ...DefaultSettings };
        this._saveToStorage();
        this._renderTabContent();
        
        // Emit changes for all keys
        Object.keys(DefaultSettings).forEach(key => {
            eventBus.emit(GameEvents.UI_SETTINGS_CHANGED, { 
                key, 
                value: DefaultSettings[key] 
            });
        });
    }
    
    /** @private */
    _buttonStyle(bgColor) {
        return {
            padding: '8px 16px',
            backgroundColor: bgColor,
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            fontSize: UIDefaults.FONT_SIZE_NORMAL,
            cursor: 'pointer',
            transition: 'filter 0.2s ease'
        };
    }
    
    /** @private */
    _switchTab(tabId) {
        this._activeTab = tabId;
        
        // Update tab styles
        Array.from(this._tabBar.children).forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            btn.style.background = isActive ? 'rgba(60, 60, 80, 0.8)' : 'transparent';
            btn.style.color = isActive ? '#fff' : '#aaa';
            btn.style.borderBottom = isActive ? '2px solid #66aaff' : '2px solid transparent';
        });
        
        this._renderTabContent();
    }
    
    /** @private */
    _renderTabContent() {
        this._content.innerHTML = '';
        
        switch (this._activeTab) {
            case 'graphics':
                this._renderGraphicsTab();
                break;
            case 'audio':
                this._renderAudioTab();
                break;
            case 'interface':
                this._renderInterfaceTab();
                break;
            case 'keybinds':
                this._renderKeybindsTab();
                break;
        }
    }
    
    /** @private */
    _renderGraphicsTab() {
        const settings = [
            {
                key: SettingsKey.GRAPHICS_QUALITY,
                label: 'Graphics Quality',
                type: 'select',
                options: [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'ultra', label: 'Ultra' }
                ]
            },
            {
                key: SettingsKey.SHADOW_QUALITY,
                label: 'Shadow Quality',
                type: 'select',
                options: [
                    { value: 'off', label: 'Off' },
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                ]
            },
            {
                key: SettingsKey.DRAW_DISTANCE,
                label: 'Draw Distance',
                type: 'slider',
                min: 100,
                max: 2000,
                step: 100
            },
            {
                key: SettingsKey.PARTICLE_DENSITY,
                label: 'Particle Density',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.1
            },
            {
                key: SettingsKey.ANTI_ALIASING,
                label: 'Anti-Aliasing',
                type: 'checkbox'
            },
            {
                key: SettingsKey.VSYNC,
                label: 'V-Sync',
                type: 'checkbox'
            },
            {
                key: SettingsKey.FPS_LIMIT,
                label: 'FPS Limit',
                type: 'select',
                options: [
                    { value: 30, label: '30 FPS' },
                    { value: 60, label: '60 FPS' },
                    { value: 120, label: '120 FPS' },
                    { value: 0, label: 'Unlimited' }
                ]
            }
        ];
        
        settings.forEach(s => this._renderSetting(s));
    }
    
    /** @private */
    _renderAudioTab() {
        const settings = [
            {
                key: SettingsKey.MASTER_VOLUME,
                label: 'Master Volume',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.05
            },
            {
                key: SettingsKey.MUSIC_VOLUME,
                label: 'Music Volume',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.05
            },
            {
                key: SettingsKey.SFX_VOLUME,
                label: 'Sound Effects',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.05
            },
            {
                key: SettingsKey.AMBIENT_VOLUME,
                label: 'Ambient Sounds',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.05
            },
            {
                key: SettingsKey.VOICE_VOLUME,
                label: 'Voice Volume',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.05
            }
        ];
        
        settings.forEach(s => this._renderSetting(s));
    }
    
    /** @private */
    _renderInterfaceTab() {
        const settings = [
            {
                key: SettingsKey.UI_SCALE,
                label: 'UI Scale',
                type: 'slider',
                min: 0.5,
                max: 2,
                step: 0.1
            },
            {
                key: SettingsKey.SHOW_TOOLTIPS,
                label: 'Show Tooltips',
                type: 'checkbox'
            },
            {
                key: SettingsKey.SHOW_DAMAGE_NUMBERS,
                label: 'Show Damage Numbers',
                type: 'checkbox'
            },
            {
                key: SettingsKey.SHOW_NAMEPLATES,
                label: 'Show Nameplates',
                type: 'checkbox'
            },
            {
                key: SettingsKey.SHOW_FRIENDLY_NAMEPLATES,
                label: 'Show Friendly Nameplates',
                type: 'checkbox'
            },
            {
                key: SettingsKey.SHOW_ENEMY_NAMEPLATES,
                label: 'Show Enemy Nameplates',
                type: 'checkbox'
            },
            {
                key: SettingsKey.NAMEPLATE_DISTANCE,
                label: 'Nameplate Distance',
                type: 'slider',
                min: 10,
                max: 100,
                step: 5
            },
            {
                key: SettingsKey.BUFF_ICON_SIZE,
                label: 'Buff Icon Size',
                type: 'slider',
                min: 24,
                max: 48,
                step: 4
            }
        ];
        
        settings.forEach(s => this._renderSetting(s));
    }
    
    /** @private */
    _renderKeybindsTab() {
        const keybinds = [
            { key: SettingsKey.KEYBIND_MOVE_FORWARD, label: 'Move Forward' },
            { key: SettingsKey.KEYBIND_MOVE_BACK, label: 'Move Backward' },
            { key: SettingsKey.KEYBIND_STRAFE_LEFT, label: 'Strafe Left' },
            { key: SettingsKey.KEYBIND_STRAFE_RIGHT, label: 'Strafe Right' },
            { key: SettingsKey.KEYBIND_JUMP, label: 'Jump' },
            { key: SettingsKey.KEYBIND_INTERACT, label: 'Interact' },
            { key: SettingsKey.KEYBIND_INVENTORY, label: 'Inventory' },
            { key: SettingsKey.KEYBIND_CHARACTER, label: 'Character Sheet' },
            { key: SettingsKey.KEYBIND_SKILLS, label: 'Skills' },
            { key: SettingsKey.KEYBIND_MAP, label: 'Map' }
        ];
        
        const container = this.createElement('div', {
            style: { display: 'flex', flexDirection: 'column', gap: '8px' }
        });
        
        keybinds.forEach(kb => {
            const row = this.createElement('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    backgroundColor: 'rgba(40, 40, 50, 0.5)',
                    borderRadius: '4px'
                }
            });
            
            const label = this.createElement('span', {
                textContent: kb.label
            });
            row.appendChild(label);
            
            const keyBtn = this.createElement('button', {
                style: {
                    minWidth: '120px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(60, 60, 80, 0.8)',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: UIDefaults.FONT_SIZE_NORMAL
                },
                textContent: this._formatKeyCode(this.get(kb.key)),
                attributes: { 'data-keybind': kb.key }
            });
            
            keyBtn.addEventListener('click', () => this._captureKeybind(kb.key, keyBtn));
            row.appendChild(keyBtn);
            
            container.appendChild(row);
        });
        
        this._content.appendChild(container);
    }
    
    /** @private */
    _renderSetting(config) {
        const row = this.createElement('div', {
            className: 'setting-row',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }
        });
        
        const label = this.createElement('label', {
            style: { flex: '1' },
            textContent: config.label
        });
        row.appendChild(label);
        
        const value = this.get(config.key);
        let input;
        
        switch (config.type) {
            case 'checkbox':
                input = this.createElement('input', {
                    attributes: {
                        type: 'checkbox',
                        'data-key': config.key
                    }
                });
                input.checked = value;
                input.style.cssText = 'width: 20px; height: 20px; cursor: pointer;';
                input.addEventListener('change', (e) => {
                    this._settings[config.key] = e.target.checked;
                });
                break;
                
            case 'slider':
                const sliderContainer = this.createElement('div', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: '200px'
                    }
                });
                
                input = this.createElement('input', {
                    attributes: {
                        type: 'range',
                        min: config.min.toString(),
                        max: config.max.toString(),
                        step: config.step.toString(),
                        'data-key': config.key
                    }
                });
                input.value = value;
                input.style.cssText = 'flex: 1; cursor: pointer;';
                
                const valueDisplay = this.createElement('span', {
                    style: {
                        minWidth: '50px',
                        textAlign: 'right',
                        fontSize: UIDefaults.FONT_SIZE_SMALL
                    },
                    textContent: value.toString()
                });
                
                input.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    this._settings[config.key] = val;
                    valueDisplay.textContent = val.toString();
                });
                
                sliderContainer.appendChild(input);
                sliderContainer.appendChild(valueDisplay);
                row.appendChild(sliderContainer);
                this._content.appendChild(row);
                return;
                
            case 'select':
                input = this.createElement('select', {
                    style: {
                        padding: '6px 12px',
                        backgroundColor: 'rgba(40, 40, 50, 0.8)',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        minWidth: '150px'
                    },
                    attributes: { 'data-key': config.key }
                });
                
                config.options.forEach(opt => {
                    const option = this.createElement('option', {
                        attributes: { value: opt.value.toString() },
                        textContent: opt.label
                    });
                    if (opt.value === value || opt.value.toString() === value.toString()) {
                        option.selected = true;
                    }
                    input.appendChild(option);
                });
                
                input.addEventListener('change', (e) => {
                    let val = e.target.value;
                    // Try to parse as number
                    if (!isNaN(val)) val = parseFloat(val);
                    this._settings[config.key] = val;
                });
                break;
        }
        
        if (input) {
            row.appendChild(input);
        }
        
        this._content.appendChild(row);
    }
    
    /** @private */
    _captureKeybind(key, button) {
        button.textContent = 'Press a key...';
        button.style.borderColor = '#66aaff';
        
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            let code = e.code;
            
            // Handle mouse buttons
            if (e.type === 'mousedown') {
                code = `Mouse${e.button}`;
            }
            
            this._settings[key] = code;
            button.textContent = this._formatKeyCode(code);
            button.style.borderColor = '#555';
            
            document.removeEventListener('keydown', handler);
            document.removeEventListener('mousedown', handler);
        };
        
        document.addEventListener('keydown', handler);
        document.addEventListener('mousedown', handler);
    }
    
    /** @private */
    _formatKeyCode(code) {
        if (!code) return 'None';
        
        // Mouse buttons
        if (code.startsWith('Mouse')) {
            const btn = code.replace('Mouse', '');
            switch (btn) {
                case '0': return 'Left Click';
                case '1': return 'Middle Click';
                case '2': return 'Right Click';
                default: return `Mouse ${btn}`;
            }
        }
        
        // Common keys
        const keyMap = {
            'Space': 'Space',
            'ShiftLeft': 'Left Shift',
            'ShiftRight': 'Right Shift',
            'ControlLeft': 'Left Ctrl',
            'ControlRight': 'Right Ctrl',
            'AltLeft': 'Left Alt',
            'AltRight': 'Right Alt',
            'Escape': 'Esc',
            'Tab': 'Tab',
            'Enter': 'Enter',
            'Backspace': 'Backspace'
        };
        
        if (keyMap[code]) return keyMap[code];
        
        // Letter keys
        if (code.startsWith('Key')) {
            return code.replace('Key', '');
        }
        
        // Number keys
        if (code.startsWith('Digit')) {
            return code.replace('Digit', '');
        }
        
        // Numpad
        if (code.startsWith('Numpad')) {
            return `Num ${code.replace('Numpad', '')}`;
        }
        
        return code;
    }
    
    /** @private */
    _saveSettings() {
        this._saveToStorage();
        
        // Emit all changes
        Object.entries(this._settings).forEach(([key, value]) => {
            eventBus.emit(GameEvents.UI_SETTINGS_CHANGED, { key, value });
        });
    }
    
    /** @private */
    _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
        } catch (e) {
            console.warn('[SettingsManager] Failed to save settings:', e);
        }
    }
    
    /** @private */
    _loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this._settings = { ...DefaultSettings, ...parsed };
            }
        } catch (e) {
            console.warn('[SettingsManager] Failed to load settings:', e);
        }
    }
    
    onShow() {
        this.element.style.display = 'flex';
        this._renderTabContent();
        this.emit(GameEvents.UI_WINDOW_OPENED, { window: 'settings' });
    }
    
    onHide() {
        this.element.style.display = 'none';
        this.emit(GameEvents.UI_WINDOW_CLOSED, { window: 'settings' });
    }
}

export default SettingsManager;
