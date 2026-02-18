import EventEmitter from 'eventemitter3';
import { produce, enableMapSet } from 'immer';

// Enable Immer support for Map and Set
enableMapSet();

/**
 * GameStateManager - Central state management for StarWayGRUDA
 * Handles all game state with event-driven updates
 * Based on SWG game architecture
 */
class GameStateManager extends EventEmitter {
    constructor() {
        super();
        
        // Core game state
        this.state = {
            player: {
                id: 'player-1',
                name: 'Unknown',
                species: 'Human',
                gender: 'Male',
                level: 1,
                health: { current: 1000, max: 1000 },
                action: { current: 500, max: 500 },
                mind: { current: 500, max: 500 },
                position: { x: 0, y: 0, z: 0 },
                credits: 1000,
                bankCredits: 0,
                faction: 'Neutral',
                currentPlanet: 'Tatooine'
            },
            
            // Targeting
            target: null,
            targetType: null, // 'creature', 'npc', 'player', 'object', 'resource'
            
            // Combat state
            combat: {
                inCombat: false,
                combatTargets: [],
                lastAttackTime: 0,
                globalCooldown: 0
            },
            
            // Inventory & Equipment
            inventory: {
                items: [],
                maxSlots: 80,
                credits: 1000
            },
            
            equipment: {
                head: null,
                chest: null,
                legs: null,
                feet: null,
                gloves: null,
                leftHand: null,  // weapon or shield
                rightHand: null, // weapon
                back: null,
                necklace: null,
                ring1: null,
                ring2: null
            },
            
            // Skills & Professions
            professions: {},
            skillPoints: {
                available: 250,
                spent: 0
            },
            
            // XP Pools (SWG style)
            experience: {
                combat: { current: 0, pending: 0 },
                crafting: { current: 0, pending: 0 },
                scouting: { current: 0, pending: 0 },
                medical: { current: 0, pending: 0 },
                entertainer: { current: 0, pending: 0 }
            },
            
            // Abilities
            abilities: [],
            cooldowns: {},
            
            // Harvesting
            harvesting: {
                isHarvesting: false,
                currentResource: null,
                harvestProgress: 0
            },
            
            // World entities (NPCs, creatures, players)
            entities: new Map(),
            
            // UI state
            ui: {
                radialMenuOpen: false,
                radialMenuTarget: null,
                inventoryOpen: false,
                skillsOpen: false,
                mapOpen: false,
                chatFocused: false
            },
            
            // Game settings
            settings: {
                autoAttack: true,
                showNameplates: true,
                showHealthBars: true,
                musicVolume: 0.5,
                sfxVolume: 0.7
            }
        };
        
        // State history for debugging
        this.stateHistory = [];
        this.maxHistory = 50;
        
        console.log('🎮 GameStateManager initialized');
    }
    
    /**
     * Get current state (immutable copy)
     */
    getState() {
        return this.state;
    }
    
    /**
     * Update state with immer for immutability
     */
    setState(updater, eventName = 'stateChange') {
        const prevState = this.state;
        
        this.state = produce(this.state, updater);
        
        // Track history
        if (this.stateHistory.length >= this.maxHistory) {
            this.stateHistory.shift();
        }
        this.stateHistory.push({ prevState, newState: this.state, event: eventName });
        
        // Emit change event
        this.emit(eventName, this.state, prevState);
        this.emit('stateChange', this.state, prevState);
    }
    
    /**
     * Alias for setState - used by many systems
     */
    updateState(updater, eventName = 'stateChange') {
        this.setState(updater, eventName);
    }
    
    /**
     * Modify HAM (Health/Action/Mind) values
     */
    modifyHAM(stat, amount) {
        const statMap = {
            'health': 'health',
            'action': 'action',
            'mind': 'mind'
        };
        
        const targetStat = statMap[stat.toLowerCase()] || stat;
        
        this.setState(draft => {
            if (draft.player[targetStat]) {
                draft.player[targetStat].current = Math.max(0, 
                    Math.min(draft.player[targetStat].current + amount, draft.player[targetStat].max)
                );
            }
        }, `${targetStat}Change`);
        
        this.emit('hamChange', { stat: targetStat, amount, newValue: this.state.player[targetStat]?.current });
    }
    
    /**
     * Update equipment stats from EquipmentSystem
     */
    updateEquipmentStats(stats) {
        this.setState(draft => {
            draft.equipmentStats = stats;
        }, 'equipmentStatsChange');
    }
    
    /**
     * Add a buff to the player
     */
    addBuff(buff) {
        this.setState(draft => {
            if (!draft.buffs) draft.buffs = [];
            // Remove existing buff with same id
            draft.buffs = draft.buffs.filter(b => b.id !== buff.id);
            draft.buffs.push(buff);
        }, 'buffAdded');
        
        this.emit('buffAdded', buff);
    }
    
    /**
     * Remove a buff
     */
    removeBuff(buffId) {
        this.setState(draft => {
            if (draft.buffs) {
                draft.buffs = draft.buffs.filter(b => b.id !== buffId);
            }
        }, 'buffRemoved');
        
        this.emit('buffRemoved', { buffId });
    }
    
    // ==================== PLAYER METHODS ====================
    
    updatePlayerHealth(current, max = null) {
        this.setState(draft => {
            draft.player.health.current = Math.max(0, Math.min(current, draft.player.health.max));
            if (max !== null) draft.player.health.max = max;
        }, 'playerHealthChange');
    }
    
    updatePlayerAction(current, max = null) {
        this.setState(draft => {
            draft.player.action.current = Math.max(0, Math.min(current, draft.player.action.max));
            if (max !== null) draft.player.action.max = max;
        }, 'playerActionChange');
    }
    
    updatePlayerMind(current, max = null) {
        this.setState(draft => {
            draft.player.mind.current = Math.max(0, Math.min(current, draft.player.mind.max));
            if (max !== null) draft.player.mind.max = max;
        }, 'playerMindChange');
    }
    
    updatePlayerPosition(x, y, z) {
        this.setState(draft => {
            draft.player.position = { x, y, z };
        }, 'playerMove');
    }
    
    addCredits(amount) {
        this.setState(draft => {
            draft.player.credits += amount;
            draft.inventory.credits += amount;
        }, 'creditsChange');
    }
    
    // ==================== TARGETING METHODS ====================
    
    setTarget(entityId, entityType = 'creature') {
        const entity = this.state.entities.get(entityId);
        this.setState(draft => {
            draft.target = entityId;
            draft.targetType = entityType;
        }, 'targetChange');
        
        this.emit('targetAcquired', { entityId, entityType, entity });
    }
    
    clearTarget() {
        const prevTarget = this.state.target;
        this.setState(draft => {
            draft.target = null;
            draft.targetType = null;
        }, 'targetChange');
        
        this.emit('targetCleared', { prevTarget });
    }
    
    // ==================== COMBAT METHODS ====================
    
    enterCombat(targetId) {
        this.setState(draft => {
            draft.combat.inCombat = true;
            if (!draft.combat.combatTargets.includes(targetId)) {
                draft.combat.combatTargets.push(targetId);
            }
        }, 'combatEnter');
        
        this.emit('combatStart', { targetId });
    }
    
    exitCombat() {
        this.setState(draft => {
            draft.combat.inCombat = false;
            draft.combat.combatTargets = [];
        }, 'combatExit');
        
        this.emit('combatEnd');
    }
    
    setGlobalCooldown(duration = 1000) {
        const endTime = Date.now() + duration;
        this.setState(draft => {
            draft.combat.globalCooldown = endTime;
        }, 'globalCooldown');
    }
    
    isOnGlobalCooldown() {
        return Date.now() < this.state.combat.globalCooldown;
    }
    
    // ==================== INVENTORY METHODS ====================
    
    addItem(item) {
        if (this.state.inventory.items.length >= this.state.inventory.maxSlots) {
            this.emit('inventoryFull');
            return false;
        }
        
        const itemWithId = { ...item, id: item.id || `item-${Date.now()}` };
        
        this.setState(draft => {
            draft.inventory.items.push(itemWithId);
        }, 'itemAdded');
        
        this.emit('itemAdded', itemWithId);
        return true;
    }
    
    removeItem(itemId) {
        const item = this.state.inventory.items.find(i => i.id === itemId);
        if (!item) return false;
        
        this.setState(draft => {
            draft.inventory.items = draft.inventory.items.filter(i => i.id !== itemId);
        }, 'itemRemoved');
        
        this.emit('itemRemoved', item);
        return true;
    }
    
    equipItem(itemId, slot) {
        const item = this.state.inventory.items.find(i => i.id === itemId);
        if (!item) return false;
        
        const prevEquipped = this.state.equipment[slot];
        
        this.setState(draft => {
            // Unequip current item if any
            if (prevEquipped) {
                draft.inventory.items.push(prevEquipped);
            }
            
            // Remove from inventory and equip
            draft.inventory.items = draft.inventory.items.filter(i => i.id !== itemId);
            draft.equipment[slot] = item;
        }, 'itemEquipped');
        
        this.emit('itemEquipped', { item, slot, prevEquipped });
        return true;
    }
    
    unequipItem(slot) {
        const item = this.state.equipment[slot];
        if (!item) return false;
        
        if (this.state.inventory.items.length >= this.state.inventory.maxSlots) {
            this.emit('inventoryFull');
            return false;
        }
        
        this.setState(draft => {
            draft.inventory.items.push(item);
            draft.equipment[slot] = null;
        }, 'itemUnequipped');
        
        this.emit('itemUnequipped', { item, slot });
        return true;
    }
    
    // ==================== XP & SKILLS METHODS ====================
    
    addExperience(type, amount) {
        if (!this.state.experience[type]) return;
        
        this.setState(draft => {
            draft.experience[type].pending += amount;
        }, 'xpGained');
        
        this.emit('experienceGained', { type, amount });
    }
    
    applyPendingExperience() {
        this.setState(draft => {
            Object.keys(draft.experience).forEach(type => {
                draft.experience[type].current += draft.experience[type].pending;
                draft.experience[type].pending = 0;
            });
        }, 'xpApplied');
    }
    
    learnSkill(professionId, skillBoxId, cost) {
        if (this.state.skillPoints.available < cost) {
            this.emit('insufficientSkillPoints');
            return false;
        }
        
        this.setState(draft => {
            if (!draft.professions[professionId]) {
                draft.professions[professionId] = { skills: [], level: 0 };
            }
            draft.professions[professionId].skills.push(skillBoxId);
            draft.skillPoints.available -= cost;
            draft.skillPoints.spent += cost;
        }, 'skillLearned');
        
        this.emit('skillLearned', { professionId, skillBoxId, cost });
        return true;
    }
    
    addAbility(ability) {
        this.setState(draft => {
            if (!draft.abilities.find(a => a.id === ability.id)) {
                draft.abilities.push(ability);
            }
        }, 'abilityLearned');
        
        this.emit('abilityLearned', ability);
    }
    
    // ==================== ENTITY METHODS ====================
    
    registerEntity(entity) {
        this.setState(draft => {
            draft.entities.set(entity.id, entity);
        }, 'entityAdded');
    }
    
    updateEntity(entityId, updates) {
        this.setState(draft => {
            const entity = draft.entities.get(entityId);
            if (entity) {
                Object.assign(entity, updates);
            }
        }, 'entityUpdated');
    }
    
    removeEntity(entityId) {
        this.setState(draft => {
            draft.entities.delete(entityId);
            if (draft.target === entityId) {
                draft.target = null;
                draft.targetType = null;
            }
        }, 'entityRemoved');
    }
    
    getEntity(entityId) {
        return this.state.entities.get(entityId);
    }
    
    // ==================== HARVESTING METHODS ====================
    
    startHarvesting(resourceNode) {
        this.setState(draft => {
            draft.harvesting.isHarvesting = true;
            draft.harvesting.currentResource = resourceNode;
            draft.harvesting.harvestProgress = 0;
        }, 'harvestStart');
        
        this.emit('harvestStart', resourceNode);
    }
    
    updateHarvestProgress(progress) {
        this.setState(draft => {
            draft.harvesting.harvestProgress = progress;
        }, 'harvestProgress');
    }
    
    completeHarvesting(resources) {
        const resourceNode = this.state.harvesting.currentResource;
        
        this.setState(draft => {
            draft.harvesting.isHarvesting = false;
            draft.harvesting.currentResource = null;
            draft.harvesting.harvestProgress = 0;
        }, 'harvestComplete');
        
        this.emit('harvestComplete', { resourceNode, resources });
    }
    
    cancelHarvesting() {
        this.setState(draft => {
            draft.harvesting.isHarvesting = false;
            draft.harvesting.currentResource = null;
            draft.harvesting.harvestProgress = 0;
        }, 'harvestCancel');
        
        this.emit('harvestCancel');
    }
    
    // ==================== UI STATE METHODS ====================
    
    openRadialMenu(targetEntity) {
        this.setState(draft => {
            draft.ui.radialMenuOpen = true;
            draft.ui.radialMenuTarget = targetEntity;
        }, 'radialMenuOpen');
    }
    
    closeRadialMenu() {
        this.setState(draft => {
            draft.ui.radialMenuOpen = false;
            draft.ui.radialMenuTarget = null;
        }, 'radialMenuClose');
    }
    
    toggleInventory() {
        this.setState(draft => {
            draft.ui.inventoryOpen = !draft.ui.inventoryOpen;
        }, 'inventoryToggle');
    }
    
    toggleSkills() {
        this.setState(draft => {
            draft.ui.skillsOpen = !draft.ui.skillsOpen;
        }, 'skillsToggle');
    }
    
    // ==================== SERIALIZATION ====================
    
    serialize() {
        return JSON.stringify({
            player: this.state.player,
            inventory: this.state.inventory,
            equipment: this.state.equipment,
            professions: this.state.professions,
            skillPoints: this.state.skillPoints,
            experience: this.state.experience,
            abilities: this.state.abilities,
            settings: this.state.settings
        });
    }
    
    deserialize(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.setState(draft => {
                Object.assign(draft, data);
            }, 'stateLoaded');
            return true;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return false;
        }
    }
}

// Singleton instance
export const gameState = new GameStateManager();
export default gameState;
