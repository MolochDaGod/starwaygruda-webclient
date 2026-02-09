import { gameState } from '../../systems/GameStateManager.js';

/**
 * SWG-Style Radial Menu (Pie Menu)
 * The iconic interaction menu from Star Wars Galaxies
 */
export class RadialMenu {
    constructor() {
        this.container = null;
        this.isOpen = false;
        this.targetEntity = null;
        this.selectedOption = null;
        this.options = [];
        this.subMenuStack = [];
        
        // Menu configuration
        this.radius = 120;
        this.innerRadius = 40;
        this.colors = {
            background: 'rgba(0, 20, 40, 0.95)',
            border: '#00ffff',
            hover: 'rgba(0, 255, 255, 0.3)',
            text: '#ffffff',
            subMenu: '#ffaa00',
            disabled: '#666666'
        };
        
        // Create DOM elements
        this.createElements();
        
        // Setup event handlers
        this.setupEvents();
        
        // Subscribe to game state
        gameState.on('radialMenuOpen', this.onOpen.bind(this));
        gameState.on('radialMenuClose', this.onClose.bind(this));
        
        console.log('🎯 RadialMenu UI initialized');
    }
    
    /**
     * Create DOM elements
     */
    createElements() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'radial-menu';
        this.container.innerHTML = `
            <style>
                #radial-menu {
                    position: fixed;
                    display: none;
                    z-index: 10000;
                    pointer-events: all;
                }
                
                #radial-menu.open {
                    display: block;
                }
                
                #radial-menu-svg {
                    filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
                }
                
                .radial-option {
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                
                .radial-option:hover .option-bg {
                    fill: rgba(0, 255, 255, 0.3);
                }
                
                .radial-option.disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }
                
                .radial-option.disabled:hover .option-bg {
                    fill: transparent;
                }
                
                .option-text {
                    font-family: 'Arial', sans-serif;
                    font-size: 11px;
                    font-weight: bold;
                    fill: #ffffff;
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                }
                
                .submenu-indicator {
                    fill: #ffaa00;
                }
                
                #radial-center {
                    cursor: pointer;
                }
                
                #radial-center:hover circle {
                    fill: rgba(255, 0, 0, 0.3);
                }
                
                #radial-target-name {
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #00ffff;
                    font-family: 'Arial', sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
                    white-space: nowrap;
                }
                
                #radial-breadcrumb {
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #888888;
                    font-family: 'Arial', sans-serif;
                    font-size: 10px;
                    white-space: nowrap;
                }
            </style>
            
            <div id="radial-target-name"></div>
            <svg id="radial-menu-svg" width="280" height="280"></svg>
            <div id="radial-breadcrumb"></div>
        `;
        
        document.body.appendChild(this.container);
        
        this.svg = this.container.querySelector('#radial-menu-svg');
        this.targetNameEl = this.container.querySelector('#radial-target-name');
        this.breadcrumbEl = this.container.querySelector('#radial-breadcrumb');
    }
    
    /**
     * Setup event handlers
     */
    setupEvents() {
        // Right-click to open
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Check if clicking on a targetable entity
            // For now, open on any right-click
            this.open(e.clientX, e.clientY);
        });
        
        // Click outside to close
        document.addEventListener('mousedown', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });
        
        // Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                if (this.subMenuStack.length > 0) {
                    this.popSubMenu();
                } else {
                    this.close();
                }
            }
        });
    }
    
    /**
     * Open radial menu at position
     */
    open(x, y, targetEntity = null) {
        this.targetEntity = targetEntity || this.getTargetFromState();
        this.options = this.getOptionsForTarget(this.targetEntity);
        this.subMenuStack = [];
        
        if (this.options.length === 0) {
            this.options = this.getDefaultOptions();
        }
        
        // Position menu
        const menuSize = 280;
        const padding = 20;
        
        let posX = x - menuSize / 2;
        let posY = y - menuSize / 2;
        
        // Keep on screen
        posX = Math.max(padding, Math.min(window.innerWidth - menuSize - padding, posX));
        posY = Math.max(padding + 30, Math.min(window.innerHeight - menuSize - padding, posY));
        
        this.container.style.left = posX + 'px';
        this.container.style.top = posY + 'px';
        
        // Update target name
        if (this.targetEntity) {
            this.targetNameEl.textContent = this.targetEntity.name || 'Unknown';
        } else {
            this.targetNameEl.textContent = 'Actions';
        }
        
        this.breadcrumbEl.textContent = '';
        
        // Render menu
        this.render();
        
        this.container.classList.add('open');
        this.isOpen = true;
        
        gameState.openRadialMenu(this.targetEntity);
    }
    
    /**
     * Close radial menu
     */
    close() {
        this.container.classList.remove('open');
        this.isOpen = false;
        this.targetEntity = null;
        this.subMenuStack = [];
        
        gameState.closeRadialMenu();
    }
    
    /**
     * Get current target from game state
     */
    getTargetFromState() {
        const targetId = gameState.getState().target;
        if (!targetId) return null;
        
        return gameState.getEntity(targetId);
    }
    
    /**
     * Get contextual options for target
     */
    getOptionsForTarget(target) {
        if (!target) return this.getDefaultOptions();
        
        const options = [];
        
        // Common options
        options.push({
            id: 'examine',
            label: 'Examine',
            icon: '🔍',
            action: () => this.examineTarget(target)
        });
        
        // Target type specific options
        switch (target.type) {
            case 'creature':
                options.push({
                    id: 'attack',
                    label: 'Attack',
                    icon: '⚔️',
                    action: () => this.attackTarget(target)
                });
                
                if (target.dead) {
                    options.push({
                        id: 'harvest',
                        label: 'Harvest',
                        icon: '🦴',
                        subMenu: [
                            { id: 'harvest_meat', label: 'Meat', icon: '🥩', action: () => this.harvestCreature(target, 'meat') },
                            { id: 'harvest_hide', label: 'Hide', icon: '🧶', action: () => this.harvestCreature(target, 'hide') },
                            { id: 'harvest_bone', label: 'Bone', icon: '🦴', action: () => this.harvestCreature(target, 'bone') }
                        ]
                    });
                    
                    options.push({
                        id: 'loot',
                        label: 'Loot',
                        icon: '💰',
                        action: () => this.lootTarget(target)
                    });
                }
                break;
                
            case 'npc':
                options.push({
                    id: 'converse',
                    label: 'Converse',
                    icon: '💬',
                    action: () => this.converseWith(target)
                });
                
                if (target.vendor) {
                    options.push({
                        id: 'trade',
                        label: 'Trade',
                        icon: '💱',
                        action: () => this.tradeWith(target)
                    });
                }
                
                if (target.trainer) {
                    options.push({
                        id: 'train',
                        label: 'Train',
                        icon: '📚',
                        action: () => this.trainWith(target)
                    });
                }
                break;
                
            case 'resource':
                options.push({
                    id: 'harvest_resource',
                    label: 'Harvest',
                    icon: '⛏️',
                    action: () => this.harvestResource(target)
                });
                
                options.push({
                    id: 'survey',
                    label: 'Survey Area',
                    icon: '📡',
                    action: () => this.surveyArea()
                });
                break;
                
            case 'object':
                options.push({
                    id: 'use',
                    label: 'Use',
                    icon: '👆',
                    action: () => this.useObject(target)
                });
                break;
                
            case 'player':
                options.push({
                    id: 'invite',
                    label: 'Invite to Group',
                    icon: '👥',
                    action: () => this.invitePlayer(target)
                });
                
                options.push({
                    id: 'trade_player',
                    label: 'Trade',
                    icon: '🤝',
                    action: () => this.tradeWithPlayer(target)
                });
                
                options.push({
                    id: 'follow',
                    label: 'Follow',
                    icon: '🚶',
                    action: () => this.followPlayer(target)
                });
                break;
        }
        
        return options;
    }
    
    /**
     * Get default options when no target
     */
    getDefaultOptions() {
        return [
            {
                id: 'character',
                label: 'Character',
                icon: '👤',
                subMenu: [
                    { id: 'skills', label: 'Skills', icon: '📚', action: () => gameState.toggleSkills() },
                    { id: 'inventory', label: 'Inventory', icon: '🎒', action: () => gameState.toggleInventory() },
                    { id: 'equipment', label: 'Equipment', icon: '⚔️', action: () => this.openEquipment() }
                ]
            },
            {
                id: 'actions',
                label: 'Actions',
                icon: '⚡',
                subMenu: [
                    { id: 'sit', label: 'Sit', icon: '🪑', action: () => this.playerAction('sit') },
                    { id: 'stand', label: 'Stand', icon: '🧍', action: () => this.playerAction('stand') },
                    { id: 'kneel', label: 'Kneel', icon: '🧎', action: () => this.playerAction('kneel') }
                ]
            },
            {
                id: 'social',
                label: 'Social',
                icon: '💬',
                subMenu: [
                    { id: 'wave', label: 'Wave', icon: '👋', action: () => this.emote('wave') },
                    { id: 'bow', label: 'Bow', icon: '🙇', action: () => this.emote('bow') },
                    { id: 'dance', label: 'Dance', icon: '💃', action: () => this.emote('dance') }
                ]
            },
            {
                id: 'survey',
                label: 'Survey',
                icon: '📡',
                action: () => this.surveyArea()
            }
        ];
    }
    
    /**
     * Render the radial menu
     */
    render() {
        const centerX = 140;
        const centerY = 140;
        
        let svg = '';
        
        // Background circle
        svg += `
            <circle cx="${centerX}" cy="${centerY}" r="${this.radius + 10}" 
                    fill="${this.colors.background}" 
                    stroke="${this.colors.border}" 
                    stroke-width="2"/>
        `;
        
        // Render options
        const optionCount = this.options.length;
        const angleStep = (Math.PI * 2) / Math.max(optionCount, 1);
        const startAngle = -Math.PI / 2; // Start at top
        
        this.options.forEach((option, index) => {
            const angle1 = startAngle + angleStep * index;
            const angle2 = startAngle + angleStep * (index + 1);
            const midAngle = (angle1 + angle2) / 2;
            
            // Create pie slice path
            const x1 = centerX + Math.cos(angle1) * this.innerRadius;
            const y1 = centerY + Math.sin(angle1) * this.innerRadius;
            const x2 = centerX + Math.cos(angle1) * this.radius;
            const y2 = centerY + Math.sin(angle1) * this.radius;
            const x3 = centerX + Math.cos(angle2) * this.radius;
            const y3 = centerY + Math.sin(angle2) * this.radius;
            const x4 = centerX + Math.cos(angle2) * this.innerRadius;
            const y4 = centerY + Math.sin(angle2) * this.innerRadius;
            
            const largeArc = angleStep > Math.PI ? 1 : 0;
            
            const path = `
                M ${x1} ${y1}
                L ${x2} ${y2}
                A ${this.radius} ${this.radius} 0 ${largeArc} 1 ${x3} ${y3}
                L ${x4} ${y4}
                A ${this.innerRadius} ${this.innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
                Z
            `;
            
            // Label position
            const labelRadius = (this.innerRadius + this.radius) / 2;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;
            
            const disabled = option.disabled ? 'disabled' : '';
            
            svg += `
                <g class="radial-option ${disabled}" data-option-id="${option.id}" data-index="${index}">
                    <path class="option-bg" d="${path}" 
                          fill="transparent" 
                          stroke="${this.colors.border}" 
                          stroke-width="1"/>
                    <text class="option-text" x="${labelX}" y="${labelY - 8}">
                        ${option.icon || ''}
                    </text>
                    <text class="option-text" x="${labelX}" y="${labelY + 8}">
                        ${option.label}
                    </text>
                    ${option.subMenu ? `
                        <circle class="submenu-indicator" 
                                cx="${centerX + Math.cos(midAngle) * (this.radius - 10)}" 
                                cy="${centerY + Math.sin(midAngle) * (this.radius - 10)}" 
                                r="4"/>
                    ` : ''}
                </g>
            `;
        });
        
        // Center button (close/back)
        const centerLabel = this.subMenuStack.length > 0 ? '←' : '✕';
        svg += `
            <g id="radial-center">
                <circle cx="${centerX}" cy="${centerY}" r="${this.innerRadius - 5}" 
                        fill="rgba(100, 0, 0, 0.5)" 
                        stroke="#ff4444" 
                        stroke-width="2"/>
                <text x="${centerX}" y="${centerY}" 
                      class="option-text" 
                      style="font-size: 20px;">
                    ${centerLabel}
                </text>
            </g>
        `;
        
        this.svg.innerHTML = svg;
        
        // Add click handlers
        this.svg.querySelectorAll('.radial-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const index = parseInt(el.dataset.index);
                this.selectOption(index);
            });
        });
        
        this.svg.querySelector('#radial-center').addEventListener('click', () => {
            if (this.subMenuStack.length > 0) {
                this.popSubMenu();
            } else {
                this.close();
            }
        });
    }
    
    /**
     * Select an option
     */
    selectOption(index) {
        const option = this.options[index];
        if (!option || option.disabled) return;
        
        if (option.subMenu) {
            this.pushSubMenu(option);
        } else if (option.action) {
            option.action();
            this.close();
        }
    }
    
    /**
     * Push a submenu
     */
    pushSubMenu(parentOption) {
        this.subMenuStack.push({
            options: this.options,
            label: parentOption.label
        });
        
        this.options = parentOption.subMenu;
        
        // Update breadcrumb
        const breadcrumb = this.subMenuStack.map(s => s.label).join(' > ');
        this.breadcrumbEl.textContent = breadcrumb;
        
        this.render();
    }
    
    /**
     * Pop back to previous menu
     */
    popSubMenu() {
        if (this.subMenuStack.length === 0) return;
        
        const prev = this.subMenuStack.pop();
        this.options = prev.options;
        
        // Update breadcrumb
        const breadcrumb = this.subMenuStack.map(s => s.label).join(' > ');
        this.breadcrumbEl.textContent = breadcrumb;
        
        this.render();
    }
    
    /**
     * Handle radial menu open event
     */
    onOpen(target) {
        // Menu is already opened by direct call
    }
    
    /**
     * Handle radial menu close event
     */
    onClose() {
        // Menu is already closed by direct call
    }
    
    // ==================== ACTION HANDLERS ====================
    
    examineTarget(target) {
        console.log(`Examining ${target.name}`);
        gameState.emit('examine', { target });
    }
    
    attackTarget(target) {
        console.log(`Attacking ${target.name}`);
        gameState.enterCombat(target.id);
        gameState.emit('attack', { target });
    }
    
    harvestCreature(target, type) {
        console.log(`Harvesting ${type} from ${target.name}`);
        gameState.emit('harvestCreature', { target, type });
    }
    
    harvestResource(target) {
        console.log(`Harvesting resource ${target.name}`);
        gameState.emit('harvestResource', { target });
    }
    
    lootTarget(target) {
        console.log(`Looting ${target.name}`);
        gameState.emit('loot', { target });
    }
    
    converseWith(target) {
        console.log(`Conversing with ${target.name}`);
        gameState.emit('converse', { target });
    }
    
    tradeWith(target) {
        console.log(`Trading with ${target.name}`);
        gameState.emit('trade', { target });
    }
    
    trainWith(target) {
        console.log(`Training with ${target.name}`);
        gameState.emit('train', { target });
    }
    
    useObject(target) {
        console.log(`Using ${target.name}`);
        gameState.emit('use', { target });
    }
    
    invitePlayer(target) {
        console.log(`Inviting ${target.name} to group`);
        gameState.emit('groupInvite', { target });
    }
    
    tradeWithPlayer(target) {
        console.log(`Trading with player ${target.name}`);
        gameState.emit('playerTrade', { target });
    }
    
    followPlayer(target) {
        console.log(`Following ${target.name}`);
        gameState.emit('follow', { target });
    }
    
    surveyArea() {
        console.log('Surveying area');
        gameState.emit('survey');
    }
    
    openEquipment() {
        console.log('Opening equipment');
        gameState.emit('openEquipment');
    }
    
    playerAction(action) {
        console.log(`Player action: ${action}`);
        gameState.emit('playerAction', { action });
    }
    
    emote(emote) {
        console.log(`Emote: ${emote}`);
        gameState.emit('emote', { emote });
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default RadialMenu;
