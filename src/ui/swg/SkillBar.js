import { gameState } from '../../systems/GameStateManager.js';
import { AnimState } from '../../player/ClassAnimationRegistry.js';
import { eventBus, GameEvents } from '../../core/EventBus.js';

/**
 * SWG-Style Skill Bar UI
 * Horizontal ability hotbar with cooldowns and keybinds
 */
export class SkillBar {
    constructor() {
        this.container = null;
        this.slots = [];
        this.numSlots = 12;
        this.cooldowns = new Map();
        
        this.createElements();
        this.setupEventListeners();
        this.setupKeybindings();
        
        // Start cooldown tick
        this.startCooldownTick();
        
        console.log('🎯 SkillBar UI initialized');
    }
    
    createElements() {
        this.container = document.createElement('div');
        this.container.id = 'skill-bar';
        this.container.innerHTML = `
            <style>
                #skill-bar {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 4px;
                    padding: 8px;
                    background: linear-gradient(180deg, rgba(0,30,60,0.95) 0%, rgba(0,15,30,0.95) 100%);
                    border: 2px solid #00aaaa;
                    border-radius: 5px;
                    box-shadow: 0 0 20px rgba(0,150,150,0.4);
                    z-index: 1000;
                }
                
                .skill-slot {
                    width: 48px;
                    height: 48px;
                    background: rgba(0,0,0,0.6);
                    border: 2px solid #336666;
                    border-radius: 4px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.15s;
                    overflow: hidden;
                }
                
                .skill-slot:hover {
                    border-color: #00ffff;
                    box-shadow: 0 0 10px rgba(0,255,255,0.5);
                }
                
                .skill-slot.active {
                    border-color: #ffaa00;
                    box-shadow: 0 0 15px rgba(255,170,0,0.6);
                }
                
                .skill-slot.on-cooldown {
                    opacity: 0.7;
                }
                
                .skill-slot.disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                .skill-icon {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: #ffffff;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                }
                
                .skill-keybind {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    font-size: 10px;
                    color: #aaaaaa;
                    font-family: 'Arial', sans-serif;
                    font-weight: bold;
                    text-shadow: 1px 1px 1px rgba(0,0,0,0.9);
                }
                
                .skill-cooldown-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: none;
                }
                
                .skill-cooldown-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 14px;
                    font-weight: bold;
                    color: #ffffff;
                    font-family: 'Arial', sans-serif;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
                }
                
                .skill-cooldown-sweep {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: conic-gradient(transparent 0deg, rgba(0,0,0,0.7) 0deg);
                    display: none;
                }
                
                .skill-tooltip {
                    position: absolute;
                    bottom: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,20,40,0.98);
                    border: 1px solid #00aaaa;
                    border-radius: 4px;
                    padding: 8px 12px;
                    min-width: 150px;
                    max-width: 250px;
                    display: none;
                    z-index: 10001;
                    font-family: 'Arial', sans-serif;
                }
                
                .skill-slot:hover .skill-tooltip {
                    display: block;
                }
                
                .skill-tooltip-name {
                    color: #00ffff;
                    font-size: 13px;
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                
                .skill-tooltip-cost {
                    color: #888888;
                    font-size: 11px;
                    margin-bottom: 4px;
                }
                
                .skill-tooltip-desc {
                    color: #cccccc;
                    font-size: 11px;
                    line-height: 1.3;
                }
                
                .skill-tooltip-cooldown {
                    color: #ffaa00;
                    font-size: 10px;
                    margin-top: 4px;
                }
            </style>
            
            <div id="skill-slots"></div>
        `;
        
        document.body.appendChild(this.container);
        
        // Create slots
        const slotsContainer = this.container.querySelector('#skill-slots');
        slotsContainer.style.display = 'flex';
        slotsContainer.style.gap = '4px';
        
        for (let i = 0; i < this.numSlots; i++) {
            const slot = this.createSlot(i);
            slotsContainer.appendChild(slot);
            this.slots.push(slot);
        }
        
        // Set default abilities
        this.setDefaultAbilities();
    }
    
    createSlot(index) {
        const slot = document.createElement('div');
        slot.className = 'skill-slot';
        slot.dataset.slotIndex = index;
        
        const keybind = this.getKeybindForSlot(index);
        
        slot.innerHTML = `
            <div class="skill-icon"></div>
            <div class="skill-keybind">${keybind}</div>
            <div class="skill-cooldown-sweep"></div>
            <div class="skill-cooldown-overlay">
                <div class="skill-cooldown-text"></div>
            </div>
            <div class="skill-tooltip">
                <div class="skill-tooltip-name">Empty Slot</div>
                <div class="skill-tooltip-cost"></div>
                <div class="skill-tooltip-desc">Drag an ability here</div>
                <div class="skill-tooltip-cooldown"></div>
            </div>
        `;
        
        // Click handler
        slot.addEventListener('click', () => this.activateSlot(index));
        
        return slot;
    }
    
    getKeybindForSlot(index) {
        const keybinds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
        return keybinds[index] || '';
    }
    
    setDefaultAbilities() {
        // Default combat abilities
        const defaultAbilities = [
            {
                id: 'basic_shot',
                name: 'Basic Shot',
                icon: '🔫',
                description: 'A basic ranged attack',
                cost: { action: 20 },
                cooldown: 1500,
                damage: { min: 10, max: 25 },
                range: 35,
                animationKey: AnimState.ATTACK_1,
                attackType: 'ranged'
            },
            {
                id: 'power_shot',
                name: 'Power Shot',
                icon: '💥',
                description: 'A powerful charged shot dealing high damage',
                cost: { action: 50 },
                cooldown: 5000,
                damage: { min: 30, max: 60 },
                range: 35,
                animationKey: AnimState.ATTACK_2,
                attackType: 'ranged'
            },
            {
                id: 'melee_strike',
                name: 'Melee Strike',
                icon: '⚔️',
                description: 'Close-range melee attack',
                cost: { action: 15 },
                cooldown: 1000,
                damage: { min: 15, max: 30 },
                range: 5,
                animationKey: AnimState.ATTACK_1,
                attackType: 'melee'
            },
            {
                id: 'whirlwind',
                name: 'Whirlwind',
                icon: '🌀',
                description: 'Spin attack hitting all nearby enemies',
                cost: { action: 35 },
                cooldown: 8000,
                damage: { min: 20, max: 40 },
                range: 5,
                animationKey: AnimState.ATTACK_3,
                attackType: 'melee'
            },
            {
                id: 'stim_self',
                name: 'Stim Pack',
                icon: '💉',
                description: 'Use a stim pack to heal yourself',
                cost: { mind: 30 },
                cooldown: 30000,
                heal: { min: 100, max: 150 },
                animationKey: AnimState.CAST
            },
            null, // Slot 5 empty (per combat hotbar preference)
            {
                id: 'block',
                name: 'Block',
                icon: '🛡️',
                description: 'Raise your shield to block incoming damage',
                cost: { action: 10 },
                cooldown: 2000,
                effect: 'buff',
                duration: 3000,
                animationKey: AnimState.BLOCK
            },
            {
                id: 'dodge',
                name: 'Dodge Roll',
                icon: '💨',
                description: 'Evade attacks with a quick roll',
                cost: { action: 25 },
                cooldown: 6000,
                effect: 'buff',
                animationKey: AnimState.DODGE
            },
            {
                id: 'survey',
                name: 'Survey',
                icon: '📡',
                description: 'Survey the area for resources',
                cost: { mind: 10 },
                cooldown: 3000,
                effect: 'utility',
                animationKey: AnimState.INTERACT
            },
            {
                id: 'harvest',
                name: 'Harvest',
                icon: '⛏️',
                description: 'Harvest resources or creature parts',
                cost: { action: 20 },
                cooldown: 2000,
                effect: 'utility',
                animationKey: AnimState.PICKUP
            },
            null,
            null
        ];
        
        defaultAbilities.forEach((ability, index) => {
            if (ability) {
                this.setSlotAbility(index, ability);
            }
        });
    }
    
    setSlotAbility(slotIndex, ability) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return;
        
        const slot = this.slots[slotIndex];
        slot.dataset.abilityId = ability.id;
        slot.abilityData = ability;
        
        // Update visuals
        const iconEl = slot.querySelector('.skill-icon');
        const nameEl = slot.querySelector('.skill-tooltip-name');
        const costEl = slot.querySelector('.skill-tooltip-cost');
        const descEl = slot.querySelector('.skill-tooltip-desc');
        const cdEl = slot.querySelector('.skill-tooltip-cooldown');
        
        iconEl.textContent = ability.icon || '?';
        nameEl.textContent = ability.name;
        descEl.textContent = ability.description;
        
        // Cost text
        const costs = [];
        if (ability.cost) {
            if (ability.cost.health) costs.push(`${ability.cost.health} Health`);
            if (ability.cost.action) costs.push(`${ability.cost.action} Action`);
            if (ability.cost.mind) costs.push(`${ability.cost.mind} Mind`);
        }
        costEl.textContent = costs.join(', ');
        
        // Cooldown text
        cdEl.textContent = ability.cooldown ? `Cooldown: ${(ability.cooldown / 1000).toFixed(1)}s` : '';
    }
    
    clearSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return;
        
        const slot = this.slots[slotIndex];
        delete slot.dataset.abilityId;
        slot.abilityData = null;
        
        const iconEl = slot.querySelector('.skill-icon');
        const nameEl = slot.querySelector('.skill-tooltip-name');
        const costEl = slot.querySelector('.skill-tooltip-cost');
        const descEl = slot.querySelector('.skill-tooltip-desc');
        const cdEl = slot.querySelector('.skill-tooltip-cooldown');
        
        iconEl.textContent = '';
        nameEl.textContent = 'Empty Slot';
        costEl.textContent = '';
        descEl.textContent = 'Drag an ability here';
        cdEl.textContent = '';
    }
    
    activateSlot(slotIndex) {
        const slot = this.slots[slotIndex];
        const ability = slot.abilityData;
        
        if (!ability) return;
        
        // Check cooldown
        const cooldownEnd = this.cooldowns.get(ability.id);
        if (cooldownEnd && Date.now() < cooldownEnd) {
            console.log(`${ability.name} is on cooldown`);
            return;
        }
        
        // Check costs
        const state = gameState.getState();
        const ham = state.player?.ham;
        
        if (ability.cost && ham) {
            if (ability.cost.health && ham.health.current < ability.cost.health) {
                console.log('Not enough health');
                return;
            }
            if (ability.cost.action && ham.action.current < ability.cost.action) {
                console.log('Not enough action');
                return;
            }
            if (ability.cost.mind && ham.mind.current < ability.cost.mind) {
                console.log('Not enough mind');
                return;
            }
        }
        
        // Check if requires target
        if (ability.range && ability.range > 0) {
            if (!state.target) {
                console.log('No target selected');
                return;
            }
        }
        
        // Deduct costs
        if (ability.cost) {
            if (ability.cost.health) gameState.modifyHAM('health', -ability.cost.health);
            if (ability.cost.action) gameState.modifyHAM('action', -ability.cost.action);
            if (ability.cost.mind) gameState.modifyHAM('mind', -ability.cost.mind);
        }
        
        // Start cooldown
        if (ability.cooldown) {
            this.cooldowns.set(ability.id, Date.now() + ability.cooldown);
        }
        
        // Visual feedback
        slot.classList.add('active');
        setTimeout(() => slot.classList.remove('active'), 200);
        
        // Emit ability use event
        console.log(`Using ability: ${ability.name}`);
        gameState.emit('abilityUsed', {
            ability,
            targetId: state.target
        });
        
        // Emit animation trigger so the character controller can play the right animation
        if (ability.animationKey) {
            eventBus.emit(GameEvents.COMBAT_ABILITY_ANIMATION, {
                animationKey: ability.animationKey,
                attackType: ability.attackType || 'melee',
                abilityId: ability.id,
                abilityName: ability.name,
            });
        }
    }
    
    setupEventListeners() {
        // Listen for ability changes
        gameState.on('abilityLearned', (data) => {
            // Could auto-assign to empty slot
        });
        
        gameState.on('cooldownReset', (abilityId) => {
            this.cooldowns.delete(abilityId);
        });
    }
    
    setupKeybindings() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Number keys 1-0
            if (e.key >= '1' && e.key <= '9') {
                this.activateSlot(parseInt(e.key) - 1);
            } else if (e.key === '0') {
                this.activateSlot(9);
            } else if (e.key === '-') {
                this.activateSlot(10);
            } else if (e.key === '=') {
                this.activateSlot(11);
            }
        });
    }
    
    startCooldownTick() {
        setInterval(() => this.updateCooldowns(), 100);
    }
    
    updateCooldowns() {
        const now = Date.now();
        
        this.slots.forEach((slot, index) => {
            const ability = slot.abilityData;
            if (!ability) return;
            
            const cooldownEnd = this.cooldowns.get(ability.id);
            const overlayEl = slot.querySelector('.skill-cooldown-overlay');
            const textEl = slot.querySelector('.skill-cooldown-text');
            const sweepEl = slot.querySelector('.skill-cooldown-sweep');
            
            if (cooldownEnd && now < cooldownEnd) {
                // On cooldown
                slot.classList.add('on-cooldown');
                overlayEl.style.display = 'block';
                
                const remaining = (cooldownEnd - now) / 1000;
                textEl.textContent = remaining.toFixed(1);
                
                // Sweep effect
                const totalCd = ability.cooldown;
                const elapsed = totalCd - (cooldownEnd - now);
                const percent = (elapsed / totalCd) * 360;
                sweepEl.style.background = `conic-gradient(transparent ${percent}deg, rgba(0,0,0,0.7) ${percent}deg)`;
                sweepEl.style.display = 'block';
            } else {
                // Off cooldown
                slot.classList.remove('on-cooldown');
                overlayEl.style.display = 'none';
                sweepEl.style.display = 'none';
                this.cooldowns.delete(ability.id);
            }
        });
    }
    
    /**
     * Swap abilities between slots (for drag-drop)
     */
    swapSlots(fromIndex, toIndex) {
        const fromAbility = this.slots[fromIndex].abilityData;
        const toAbility = this.slots[toIndex].abilityData;
        
        if (fromAbility) this.setSlotAbility(toIndex, fromAbility);
        else this.clearSlot(toIndex);
        
        if (toAbility) this.setSlotAbility(fromIndex, toAbility);
        else this.clearSlot(fromIndex);
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default SkillBar;
