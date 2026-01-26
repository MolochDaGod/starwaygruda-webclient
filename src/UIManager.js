import { InventorySystem } from './ui/InventorySystem.js';
import { WorldMapSystem } from './ui/WorldMapSystem.js';
import { CraftingInterface } from './ui/CraftingInterface.js';
import { CharacterSheet } from './ui/CharacterSheet.js';
import { ResourceManager } from './ui/ResourceManager.js';

export class UIManager {
    constructor() {
        this.systems = new Map();
        this.gameState = {
            player: {
                name: 'Galaxy Wanderer',
                level: 25,
                credits: 45750,
                bankCredits: 275000,
                position: { x: 1250, y: 3456, planet: 'tatooine' },
                health: 950,
                maxHealth: 1000,
                inventory: [],
                skills: {},
                profession: 'Master Artisan'
            },
            world: {
                currentPlanet: 'tatooine',
                knownLocations: [],
                waypoints: [],
                resources: []
            },
            ui: {
                openWindows: new Set(),
                windowPositions: new Map(),
                userPreferences: {
                    autoSort: true,
                    showTooltips: true,
                    minimapVisible: true,
                    chatChannels: ['General', 'Guild', 'Trade']
                }
            }
        };
        
        this.eventListeners = new Map();
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing UI Manager...');
        
        try {
            // Create all UI systems
            await this.createUISystems();
            
            // Setup global event handling
            this.setupGlobalEvents();
            
            // Setup system cross-communication
            this.setupSystemIntegration();
            
            // Create main UI control panel
            this.createMainPanel();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Load saved preferences
            this.loadUserPreferences();
            
            this.initialized = true;
            console.log('✅ UI Manager initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Failed to initialize UI Manager:', error);
        }
    }
    
    async createUISystems() {
        console.log('🔨 Creating UI systems...');
        
        // Initialize each UI system
        this.systems.set('inventory', new InventorySystem());
        this.systems.set('worldMap', new WorldMapSystem());
        this.systems.set('crafting', new CraftingInterface());
        this.systems.set('character', new CharacterSheet());
        this.systems.set('resources', new ResourceManager());
        
        // Make systems globally accessible for debugging/console access
        window.uiSystems = {
            inventory: this.systems.get('inventory'),
            worldMap: this.systems.get('worldMap'),
            crafting: this.systems.get('crafting'),
            character: this.systems.get('character'),
            resources: this.systems.get('resources')
        };
        
        console.log('✅ All UI systems created');
    }
    
    setupGlobalEvents() {
        // System opening/closing events
        document.addEventListener('ui:system:opened', (e) => {
            this.gameState.ui.openWindows.add(e.detail.system);
            this.updateMainPanelIndicators();
            console.log(`📖 ${e.detail.system} opened`);
        });
        
        document.addEventListener('ui:system:closed', (e) => {
            this.gameState.ui.openWindows.delete(e.detail.system);
            this.updateMainPanelIndicators();
            console.log(`📕 ${e.detail.system} closed`);
        });
        
        // Cross-system data events
        document.addEventListener('inventory:item:moved', (e) => {
            this.handleInventoryChange(e.detail);
        });
        
        document.addEventListener('worldMap:waypoint:set', (e) => {
            this.handleWaypointSet(e.detail);
        });
        
        document.addEventListener('crafting:item:created', (e) => {
            this.handleItemCrafted(e.detail);
        });
        
        document.addEventListener('character:stats:changed', (e) => {
            this.handleStatsChange(e.detail);
        });
        
        document.addEventListener('resources:discovered', (e) => {
            this.handleResourceDiscovered(e.detail);
        });
    }
    
    setupSystemIntegration() {
        // Share data between systems
        this.systems.get('inventory').setPlayerData(this.gameState.player);
        this.systems.get('character').updateCharacterData(this.gameState.player);
        this.systems.get('worldMap').setPlayerPosition(this.gameState.player.position);
        this.systems.get('resources').currentPlanet = this.gameState.world.currentPlanet;
        
        // Setup inter-system communication
        this.setupInventoryCraftingLink();
        this.setupMapResourceLink();
        this.setupCharacterProgressionLink();
    }
    
    setupInventoryCraftingLink() {
        // When crafting needs materials, check inventory
        const crafting = this.systems.get('crafting');
        const inventory = this.systems.get('inventory');
        
        if (crafting && inventory) {
            // Override crafting's checkMaterials method
            const originalCheckMaterials = crafting.checkMaterials;
            crafting.checkMaterials = (schematic) => {
                const inventoryItems = inventory.getAllItems();
                return this.validateCraftingMaterials(schematic, inventoryItems);
            };
        }
    }
    
    setupMapResourceLink() {
        // When resources are discovered, update map markers
        const worldMap = this.systems.get('worldMap');
        const resources = this.systems.get('resources');
        
        if (worldMap && resources) {
            // Link resource waypoints to world map
            resources.addResourceWaypoint = (resource) => {
                worldMap.addMarker({
                    type: 'resource',
                    name: resource.name,
                    position: resource.coordinates,
                    quality: resource.quality,
                    icon: this.getResourceIcon(resource.type)
                });
            };
        }
    }
    
    setupCharacterProgressionLink() {
        // When skills change, update available crafting schematics
        const character = this.systems.get('character');
        const crafting = this.systems.get('crafting');
        
        if (character && crafting) {
            character.onSkillLearned = (skill) => {
                crafting.updateAvailableSchematics(this.gameState.player.skills);
                this.showSkillUnlockedNotification(skill);
            };
        }
    }
    
    createMainPanel() {
        // Create floating main UI panel
        const panel = document.createElement('div');
        panel.id = 'main-ui-panel';
        panel.className = 'main-ui-panel';
        
        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <i class="fas fa-desktop"></i>
                    UI Control Panel
                </div>
                <button class="panel-toggle" onclick="window.uiManager.toggleMainPanel()">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            
            <div class="panel-content">
                <div class="system-controls">
                    <div class="control-group">
                        <h3><i class="fas fa-window-maximize"></i> Systems</h3>
                        <div class="system-buttons">
                            <button class="system-btn" data-system="inventory" onclick="window.uiManager.toggleSystem('inventory')">
                                <i class="fas fa-backpack"></i>
                                <span>Inventory</span>
                                <div class="status-indicator" id="inventory-status"></div>
                            </button>
                            
                            <button class="system-btn" data-system="character" onclick="window.uiManager.toggleSystem('character')">
                                <i class="fas fa-user"></i>
                                <span>Character</span>
                                <div class="status-indicator" id="character-status"></div>
                            </button>
                            
                            <button class="system-btn" data-system="worldMap" onclick="window.uiManager.toggleSystem('worldMap')">
                                <i class="fas fa-map"></i>
                                <span>Galaxy Map</span>
                                <div class="status-indicator" id="worldMap-status"></div>
                            </button>
                            
                            <button class="system-btn" data-system="crafting" onclick="window.uiManager.toggleSystem('crafting')">
                                <i class="fas fa-hammer"></i>
                                <span>Crafting</span>
                                <div class="status-indicator" id="crafting-status"></div>
                            </button>
                            
                            <button class="system-btn" data-system="resources" onclick="window.uiManager.toggleSystem('resources')">
                                <i class="fas fa-mountain"></i>
                                <span>Resources</span>
                                <div class="status-indicator" id="resources-status"></div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <h3><i class="fas fa-cogs"></i> Quick Actions</h3>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="window.uiManager.saveLayout()">
                                <i class="fas fa-save"></i>
                                Save Layout
                            </button>
                            
                            <button class="action-btn" onclick="window.uiManager.resetLayout()">
                                <i class="fas fa-undo"></i>
                                Reset Layout
                            </button>
                            
                            <button class="action-btn" onclick="window.uiManager.showKeyboardShortcuts()">
                                <i class="fas fa-keyboard"></i>
                                Shortcuts
                            </button>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <h3><i class="fas fa-chart-line"></i> Game Status</h3>
                        <div class="status-display">
                            <div class="status-item">
                                <i class="fas fa-user"></i>
                                <span id="player-name">${this.gameState.player.name}</span>
                            </div>
                            
                            <div class="status-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span id="current-location">${this.gameState.world.currentPlanet}</span>
                            </div>
                            
                            <div class="status-item">
                                <i class="fas fa-coins"></i>
                                <span id="credit-count">${this.gameState.player.credits.toLocaleString()}</span>
                            </div>
                            
                            <div class="status-item">
                                <i class="fas fa-star"></i>
                                <span id="player-level">Level ${this.gameState.player.level}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .main-ui-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: linear-gradient(135deg, #2d3436 0%, #636e72 50%, #00cec9 100%);
                border: 2px solid #00cec9;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 206, 201, 0.3);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                z-index: 2000;
                transition: all 0.3s;
            }
            
            .main-ui-panel.collapsed .panel-content {
                display: none;
            }
            
            .main-ui-panel.collapsed .panel-toggle i {
                transform: rotate(180deg);
            }
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid rgba(0, 206, 201, 0.3);
                background: rgba(0, 0, 0, 0.2);
                border-radius: 13px 13px 0 0;
            }
            
            .panel-title {
                font-weight: bold;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #00cec9;
            }
            
            .panel-toggle {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 5px;
                border-radius: 3px;
                transition: all 0.3s;
            }
            
            .panel-toggle:hover {
                background: rgba(0, 206, 201, 0.2);
            }
            
            .panel-toggle i {
                transition: transform 0.3s;
            }
            
            .panel-content {
                padding: 20px;
            }
            
            .control-group {
                margin-bottom: 20px;
            }
            
            .control-group:last-child {
                margin-bottom: 0;
            }
            
            .control-group h3 {
                margin: 0 0 10px 0;
                font-size: 12px;
                color: #00cec9;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .system-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            .system-btn {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                padding: 12px 8px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 11px;
                min-height: 60px;
            }
            
            .system-btn:hover {
                background: rgba(0, 206, 201, 0.2);
                border-color: #00cec9;
                transform: translateY(-2px);
            }
            
            .system-btn.active {
                background: rgba(0, 206, 201, 0.3);
                border-color: #00cec9;
                box-shadow: 0 0 10px rgba(0, 206, 201, 0.5);
            }
            
            .system-btn i {
                font-size: 16px;
                margin-bottom: 2px;
            }
            
            .system-btn span {
                font-weight: bold;
                text-align: center;
                line-height: 1.2;
            }
            
            .status-indicator {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transition: all 0.3s;
            }
            
            .status-indicator.active {
                background: #00ff88;
                box-shadow: 0 0 5px #00ff88;
            }
            
            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .action-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                color: white;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 11px;
            }
            
            .action-btn:hover {
                background: rgba(0, 206, 201, 0.2);
                border-color: #00cec9;
            }
            
            .action-btn i {
                width: 12px;
            }
            
            .status-display {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                padding: 5px 0;
            }
            
            .status-item i {
                width: 12px;
                color: #00cec9;
                text-align: center;
            }
            
            .status-item span {
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(panel);
        
        // Make globally accessible
        this.mainPanel = panel;
        window.uiManager = this;
        
        // Update initial indicators
        this.updateMainPanelIndicators();
    }
    
    setupKeyboardShortcuts() {
        const shortcuts = {
            'KeyI': 'inventory',       // I key
            'KeyC': 'character',       // C key  
            'KeyM': 'worldMap',        // M key
            'KeyT': 'crafting',        // T key (Trade skills)
            'KeyR': 'resources',       // R key
            'Escape': 'closeAll',      // ESC to close all
            'F1': 'help'              // F1 for help
        };
        
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const shortcut = shortcuts[e.code];
            if (shortcut) {
                e.preventDefault();
                
                if (shortcut === 'closeAll') {
                    this.closeAllSystems();
                } else if (shortcut === 'help') {
                    this.showKeyboardShortcuts();
                } else {
                    this.toggleSystem(shortcut);
                }
            }
        });
        
        console.log('⌨️ Keyboard shortcuts configured');
    }
    
    // System management methods
    toggleSystem(systemName) {
        const system = this.systems.get(systemName);
        if (!system) {
            console.warn(`❌ System '${systemName}' not found`);
            return;
        }
        
        system.toggle();
        this.updateMainPanelIndicators();
    }
    
    closeAllSystems() {
        this.systems.forEach((system, name) => {
            if (system.isVisible) {
                system.hide();
            }
        });
        
        this.gameState.ui.openWindows.clear();
        this.updateMainPanelIndicators();
        console.log('📕 All systems closed');
    }
    
    updateMainPanelIndicators() {
        this.systems.forEach((system, name) => {
            const indicator = document.getElementById(`${name}-status`);
            const button = document.querySelector(`[data-system="${name}"]`);
            
            if (indicator && button) {
                if (system.isVisible) {
                    indicator.classList.add('active');
                    button.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                    button.classList.remove('active');
                }
            }
        });
    }
    
    toggleMainPanel() {
        this.mainPanel.classList.toggle('collapsed');
    }
    
    // Event handlers for cross-system integration
    handleInventoryChange(data) {
        // Update crafting materials availability
        const crafting = this.systems.get('crafting');
        if (crafting && crafting.isVisible) {
            crafting.updateMaterialsAvailable();
        }
        
        // Update player credits display
        if (data.credits !== undefined) {
            this.gameState.player.credits = data.credits;
            const creditElement = document.getElementById('credit-count');
            if (creditElement) {
                creditElement.textContent = data.credits.toLocaleString();
            }
        }
    }
    
    handleWaypointSet(data) {
        // Add waypoint to resource manager if it's a resource location
        if (data.type === 'resource') {
            const resources = this.systems.get('resources');
            if (resources) {
                resources.addResourceLocation(data);
            }
        }
        
        // Update world map
        const worldMap = this.systems.get('worldMap');
        if (worldMap) {
            worldMap.addWaypoint(data);
        }
    }
    
    handleItemCrafted(data) {
        // Add item to inventory
        const inventory = this.systems.get('inventory');
        if (inventory) {
            inventory.addItem(data.item);
        }
        
        // Update character experience if applicable
        if (data.experienceGained) {
            const character = this.systems.get('character');
            if (character) {
                character.addExperience(data.experienceGained);
            }
        }
        
        // Show success notification
        this.showNotification(`Crafted: ${data.item.name}`, 'success');
    }
    
    handleStatsChange(data) {
        // Update any dependent systems
        this.gameState.player = { ...this.gameState.player, ...data };
        
        // Update main panel display
        const levelElement = document.getElementById('player-level');
        if (levelElement && data.level) {
            levelElement.textContent = `Level ${data.level}`;
        }
    }
    
    handleResourceDiscovered(data) {
        // Add to world map as marker
        const worldMap = this.systems.get('worldMap');
        if (worldMap) {
            worldMap.addResourceMarker(data);
        }
        
        // Update resource database
        this.gameState.world.resources.push(data);
        
        // Show discovery notification
        this.showNotification(`Discovered: ${data.name} (Quality: ${data.quality})`, 'discovery');
    }
    
    // Utility methods
    validateCraftingMaterials(schematic, inventoryItems) {
        if (!schematic || !schematic.materials) return false;
        
        for (const material of schematic.materials) {
            const hasRequired = inventoryItems.some(item => 
                item.name === material.name && item.quantity >= material.required
            );
            
            if (!hasRequired) {
                return false;
            }
        }
        
        return true;
    }
    
    getResourceIcon(resourceType) {
        const iconMap = {
            mineral: 'fas fa-gem',
            chemical: 'fas fa-flask',
            gas: 'fas fa-wind',
            energy: 'fas fa-bolt',
            flora: 'fas fa-leaf',
            creature: 'fas fa-paw'
        };
        
        return iconMap[resourceType] || 'fas fa-question';
    }
    
    showSkillUnlockedNotification(skill) {
        this.showNotification(`Skill Unlocked: ${skill.name}`, 'skill');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, ${this.getNotificationColors(type)});
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 15px 20px;
            color: white;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
    
    getNotificationIcon(type) {
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle',
            discovery: 'search-location',
            skill: 'star'
        };
        
        return iconMap[type] || 'info-circle';
    }
    
    getNotificationColors(type) {
        const colorMap = {
            success: '#00ff88, #00cec9',
            error: '#ff4757, #ff3838',
            warning: '#ffda79, #f39c12',
            info: '#74b9ff, #0984e3',
            discovery: '#fd79a8, #e84393',
            skill: '#fdcb6e, #e17055'
        };
        
        return colorMap[type] || '#74b9ff, #0984e3';
    }
    
    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'I', action: 'Toggle Inventory' },
            { key: 'C', action: 'Toggle Character Sheet' },
            { key: 'M', action: 'Toggle Galaxy Map' },
            { key: 'T', action: 'Toggle Crafting Interface' },
            { key: 'R', action: 'Toggle Resource Manager' },
            { key: 'ESC', action: 'Close All Windows' },
            { key: 'F1', action: 'Show This Help' }
        ];
        
        const helpContent = shortcuts.map(s => 
            `<div class="shortcut-item"><kbd>${s.key}</kbd> - ${s.action}</div>`
        ).join('');
        
        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="help-content">
                <h2><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h2>
                <div class="shortcuts-list">
                    ${helpContent}
                </div>
                <button onclick="this.closest('.help-modal').remove()" class="close-help-btn">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        // Style the modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 4000;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('🌌 All UI systems loaded! Press F1 for keyboard shortcuts.', 'info');
        }, 1000);
    }
    
    saveLayout() {
        const layout = {
            windowPositions: {},
            openWindows: Array.from(this.gameState.ui.openWindows),
            preferences: this.gameState.ui.userPreferences,
            timestamp: Date.now()
        };
        
        // Save window positions
        this.systems.forEach((system, name) => {
            if (system.window) {
                const rect = system.window.getBoundingClientRect();
                layout.windowPositions[name] = {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            }
        });
        
        localStorage.setItem('starway-ui-layout', JSON.stringify(layout));
        this.showNotification('Layout saved successfully!', 'success');
        console.log('💾 UI layout saved');
    }
    
    loadUserPreferences() {
        const saved = localStorage.getItem('starway-ui-layout');
        if (saved) {
            try {
                const layout = JSON.parse(saved);
                
                // Restore preferences
                if (layout.preferences) {
                    this.gameState.ui.userPreferences = { ...this.gameState.ui.userPreferences, ...layout.preferences };
                }
                
                // Restore window positions (with delay to ensure windows are created)
                if (layout.windowPositions) {
                    setTimeout(() => {
                        this.restoreWindowPositions(layout.windowPositions);
                    }, 500);
                }
                
                console.log('📖 User preferences loaded');
            } catch (error) {
                console.warn('⚠️ Failed to load saved layout:', error);
            }
        }
    }
    
    restoreWindowPositions(positions) {
        this.systems.forEach((system, name) => {
            const position = positions[name];
            if (position && system.window) {
                system.window.style.left = `${position.x}px`;
                system.window.style.top = `${position.y}px`;
                system.window.style.transform = 'none';
            }
        });
    }
    
    resetLayout() {
        // Reset all window positions to center
        this.systems.forEach((system) => {
            if (system.window) {
                system.window.style.left = '';
                system.window.style.top = '';
                system.window.style.transform = 'translate(-50%, -50%)';
            }
        });
        
        // Clear saved layout
        localStorage.removeItem('starway-ui-layout');
        this.showNotification('Layout reset to defaults!', 'info');
        console.log('🔄 UI layout reset');
    }
    
    // Public API methods for external integration
    getSystemStatus() {
        const status = {};
        this.systems.forEach((system, name) => {
            status[name] = {
                isVisible: system.isVisible,
                hasData: system.hasData?.() || false
            };
        });
        return status;
    }
    
    updatePlayerData(newData) {
        this.gameState.player = { ...this.gameState.player, ...newData };
        
        // Propagate updates to relevant systems
        this.systems.get('character')?.updateCharacterData(newData);
        this.systems.get('inventory')?.setPlayerData(newData);
        
        // Update main panel display
        this.updateMainPanelStatus();
    }
    
    updateMainPanelStatus() {
        const nameEl = document.getElementById('player-name');
        const locationEl = document.getElementById('current-location');
        const creditsEl = document.getElementById('credit-count');
        const levelEl = document.getElementById('player-level');
        
        if (nameEl) nameEl.textContent = this.gameState.player.name;
        if (locationEl) locationEl.textContent = this.gameState.world.currentPlanet;
        if (creditsEl) creditsEl.textContent = this.gameState.player.credits.toLocaleString();
        if (levelEl) levelEl.textContent = `Level ${this.gameState.player.level}`;
    }
    
    // Cleanup method
    destroy() {
        this.systems.forEach((system) => {
            if (system.destroy) {
                system.destroy();
            }
        });
        
        if (this.mainPanel) {
            this.mainPanel.remove();
        }
        
        // Remove global references
        delete window.uiManager;
        delete window.uiSystems;
        
        console.log('🗑️ UI Manager destroyed');
    }
}

// Initialize UI Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global UI Manager instance
    window.uiManager = new UIManager();
});

// Export for module systems
export default UIManager;