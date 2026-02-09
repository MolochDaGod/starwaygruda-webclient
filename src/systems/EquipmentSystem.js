import { gameState } from './GameStateManager.js';

/**
 * Equipment System
 * Handles gear slots, items, and stat calculations
 */

// Equipment slot definitions (SWG-style)
export const EQUIPMENT_SLOTS = {
    head: { name: 'Head', icon: '🎩' },
    chest: { name: 'Chest', icon: '👕' },
    legs: { name: 'Legs', icon: '👖' },
    feet: { name: 'Feet', icon: '👟' },
    hands: { name: 'Hands', icon: '🧤' },
    back: { name: 'Back', icon: '🎒' },
    left_hand: { name: 'Left Hand', icon: '🛡️' },
    right_hand: { name: 'Right Hand', icon: '⚔️' },
    necklace: { name: 'Necklace', icon: '📿' },
    ring1: { name: 'Ring 1', icon: '💍' },
    ring2: { name: 'Ring 2', icon: '💍' },
    bracelet1: { name: 'Bracelet 1', icon: '⌚' },
    bracelet2: { name: 'Bracelet 2', icon: '⌚' }
};

// Item rarity levels
export const RARITY = {
    common: { name: 'Common', color: '#aaaaaa' },
    uncommon: { name: 'Uncommon', color: '#00ff00' },
    rare: { name: 'Rare', color: '#0088ff' },
    exceptional: { name: 'Exceptional', color: '#aa00ff' },
    legendary: { name: 'Legendary', color: '#ff8800' }
};

// Weapon types
export const WEAPON_TYPES = {
    pistol: { name: 'Pistol', speed: 1.0, range: 35 },
    carbine: { name: 'Carbine', speed: 0.8, range: 50 },
    rifle: { name: 'Rifle', speed: 0.5, range: 64 },
    sword: { name: 'Sword', speed: 1.2, range: 5 },
    polearm: { name: 'Polearm', speed: 0.7, range: 7 },
    unarmed: { name: 'Unarmed', speed: 1.5, range: 3 }
};

// Sample item database
export const ITEM_DATABASE = {
    // Weapons
    'cdef_pistol': {
        id: 'cdef_pistol',
        name: 'CDEF Pistol',
        type: 'weapon',
        weaponType: 'pistol',
        slot: 'right_hand',
        rarity: 'common',
        icon: '🔫',
        stats: {
            minDamage: 15,
            maxDamage: 30,
            attackSpeed: 1.0
        },
        requirements: {
            skills: ['marksman_novice']
        }
    },
    'dh17_carbine': {
        id: 'dh17_carbine',
        name: 'DH17 Carbine',
        type: 'weapon',
        weaponType: 'carbine',
        slot: 'right_hand',
        rarity: 'uncommon',
        icon: '🔫',
        stats: {
            minDamage: 40,
            maxDamage: 80,
            attackSpeed: 0.8
        },
        requirements: {
            skills: ['carbine_novice']
        }
    },
    'vibroblade': {
        id: 'vibroblade',
        name: 'Vibroblade',
        type: 'weapon',
        weaponType: 'sword',
        slot: 'right_hand',
        rarity: 'uncommon',
        icon: '⚔️',
        stats: {
            minDamage: 35,
            maxDamage: 70,
            attackSpeed: 1.2
        },
        requirements: {
            skills: ['brawler_novice']
        }
    },
    
    // Armor
    'composite_helmet': {
        id: 'composite_helmet',
        name: 'Composite Helmet',
        type: 'armor',
        slot: 'head',
        rarity: 'uncommon',
        icon: '🪖',
        stats: {
            armor: 500,
            kinetic: 30,
            energy: 20
        }
    },
    'composite_chest': {
        id: 'composite_chest',
        name: 'Composite Chestplate',
        type: 'armor',
        slot: 'chest',
        rarity: 'uncommon',
        icon: '🦺',
        stats: {
            armor: 1000,
            kinetic: 50,
            energy: 40
        }
    },
    'padded_boots': {
        id: 'padded_boots',
        name: 'Padded Boots',
        type: 'armor',
        slot: 'feet',
        rarity: 'common',
        icon: '🥾',
        stats: {
            armor: 200,
            kinetic: 15,
            energy: 10
        }
    },
    
    // Accessories
    'power_crystal': {
        id: 'power_crystal',
        name: 'Power Crystal',
        type: 'accessory',
        slot: 'necklace',
        rarity: 'rare',
        icon: '💎',
        stats: {
            bonusDamage: 10,
            critChance: 5
        }
    },
    'scout_ring': {
        id: 'scout_ring',
        name: 'Scout Ring',
        type: 'accessory',
        slot: 'ring1',
        rarity: 'common',
        icon: '💍',
        stats: {
            harvestBonus: 10,
            surveyRange: 5
        }
    },
    
    // Consumables
    'stim_a': {
        id: 'stim_a',
        name: 'Stim Pack - A',
        type: 'consumable',
        icon: '💉',
        rarity: 'common',
        stackable: true,
        maxStack: 20,
        effect: {
            type: 'heal',
            stat: 'health',
            amount: 200
        }
    },
    'food_ration': {
        id: 'food_ration',
        name: 'Food Ration',
        type: 'consumable',
        icon: '🍖',
        rarity: 'common',
        stackable: true,
        maxStack: 50,
        effect: {
            type: 'buff',
            stat: 'health_regen',
            amount: 5,
            duration: 300
        }
    },
    
    // Resources
    'iron_ore': {
        id: 'iron_ore',
        name: 'Iron Ore',
        type: 'resource',
        icon: '🪨',
        rarity: 'common',
        stackable: true,
        maxStack: 1000,
        resourceType: 'mineral'
    },
    'hide_wooly': {
        id: 'hide_wooly',
        name: 'Wooly Hide',
        type: 'resource',
        icon: '🧶',
        rarity: 'common',
        stackable: true,
        maxStack: 500,
        resourceType: 'organic'
    }
};

export class EquipmentSystem {
    constructor() {
        this.equipped = {};
        this.inventory = [];
        this.inventorySize = 80;
        this.totalStats = {};
        
        // Initialize empty equipment slots
        Object.keys(EQUIPMENT_SLOTS).forEach(slot => {
            this.equipped[slot] = null;
        });
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Give starter gear
        this.giveStarterGear();
        
        console.log('⚔️ EquipmentSystem initialized');
    }
    
    setupEventHandlers() {
        gameState.on('equipItem', (data) => this.equipItem(data.itemId, data.slot));
        gameState.on('unequipItem', (data) => this.unequipSlot(data.slot));
        gameState.on('useItem', (data) => this.useItem(data.itemId));
        gameState.on('openEquipment', () => this.openEquipmentUI());
    }
    
    giveStarterGear() {
        // Add some starter items to inventory
        this.addToInventory('cdef_pistol');
        this.addToInventory('stim_a', 5);
        this.addToInventory('food_ration', 10);
        
        // Equip the pistol
        this.equipItem('cdef_pistol');
    }
    
    /**
     * Get item definition from database
     */
    getItemDef(itemId) {
        return ITEM_DATABASE[itemId] || null;
    }
    
    /**
     * Create an item instance
     */
    createItem(itemId, quantity = 1) {
        const def = this.getItemDef(itemId);
        if (!def) return null;
        
        return {
            id: `${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            templateId: itemId,
            ...def,
            quantity: def.stackable ? quantity : 1
        };
    }
    
    /**
     * Add item to inventory
     */
    addToInventory(itemId, quantity = 1) {
        const def = this.getItemDef(itemId);
        if (!def) {
            console.warn(`Unknown item: ${itemId}`);
            return false;
        }
        
        // Check for stackable items already in inventory
        if (def.stackable) {
            const existing = this.inventory.find(i => i.templateId === itemId);
            if (existing) {
                existing.quantity = Math.min(existing.quantity + quantity, def.maxStack || 999);
                this.emitInventoryChange();
                return true;
            }
        }
        
        // Check inventory space
        if (this.inventory.length >= this.inventorySize) {
            console.log('Inventory full');
            return false;
        }
        
        const item = this.createItem(itemId, quantity);
        this.inventory.push(item);
        this.emitInventoryChange();
        
        console.log(`Added ${item.name} x${quantity} to inventory`);
        return true;
    }
    
    /**
     * Remove item from inventory
     */
    removeFromInventory(instanceId, quantity = 1) {
        const index = this.inventory.findIndex(i => i.id === instanceId);
        if (index === -1) return false;
        
        const item = this.inventory[index];
        
        if (item.stackable && item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            this.inventory.splice(index, 1);
        }
        
        this.emitInventoryChange();
        return true;
    }
    
    /**
     * Equip item from inventory
     */
    equipItem(itemIdOrInstanceId, targetSlot = null) {
        // Find item in inventory
        let item = this.inventory.find(i => i.id === itemIdOrInstanceId || i.templateId === itemIdOrInstanceId);
        
        if (!item) {
            // Try to create from template (for starter gear)
            item = this.createItem(itemIdOrInstanceId);
            if (!item) {
                console.warn(`Cannot equip: item not found`);
                return false;
            }
            this.inventory.push(item);
        }
        
        // Determine slot
        const slot = targetSlot || item.slot;
        if (!slot || !EQUIPMENT_SLOTS[slot]) {
            console.warn(`Invalid equipment slot: ${slot}`);
            return false;
        }
        
        // Check requirements
        if (!this.meetsRequirements(item)) {
            console.log(`Missing requirements for ${item.name}`);
            return false;
        }
        
        // Unequip existing item in slot
        if (this.equipped[slot]) {
            this.unequipSlot(slot);
        }
        
        // Remove from inventory and equip
        this.removeFromInventory(item.id);
        this.equipped[slot] = item;
        
        this.recalculateStats();
        this.emitEquipmentChange(slot, item);
        
        console.log(`Equipped ${item.name} to ${EQUIPMENT_SLOTS[slot].name}`);
        return true;
    }
    
    /**
     * Unequip item from slot
     */
    unequipSlot(slot) {
        const item = this.equipped[slot];
        if (!item) return false;
        
        // Check inventory space
        if (this.inventory.length >= this.inventorySize) {
            console.log('Inventory full, cannot unequip');
            return false;
        }
        
        this.equipped[slot] = null;
        this.inventory.push(item);
        
        this.recalculateStats();
        this.emitEquipmentChange(slot, null);
        
        console.log(`Unequipped ${item.name} from ${EQUIPMENT_SLOTS[slot].name}`);
        return true;
    }
    
    /**
     * Check if player meets item requirements
     */
    meetsRequirements(item) {
        if (!item.requirements) return true;
        
        const state = gameState.getState();
        
        // Check skill requirements
        if (item.requirements.skills) {
            const playerSkills = state.professions?.learnedSkills || [];
            for (const skill of item.requirements.skills) {
                if (!playerSkills.includes(skill)) {
                    return false;
                }
            }
        }
        
        // Check level requirements
        if (item.requirements.level) {
            if ((state.player?.level || 1) < item.requirements.level) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Recalculate total stats from equipment
     */
    recalculateStats() {
        this.totalStats = {
            armor: 0,
            kinetic: 0,
            energy: 0,
            minDamage: 0,
            maxDamage: 0,
            attackSpeed: 1.0,
            bonusDamage: 0,
            critChance: 0,
            harvestBonus: 0,
            surveyRange: 0
        };
        
        Object.values(this.equipped).forEach(item => {
            if (!item || !item.stats) return;
            
            Object.entries(item.stats).forEach(([stat, value]) => {
                if (this.totalStats[stat] !== undefined) {
                    if (stat === 'attackSpeed') {
                        // Use weapon's attack speed directly
                        this.totalStats[stat] = value;
                    } else {
                        this.totalStats[stat] += value;
                    }
                }
            });
        });
        
        // Update game state
        gameState.updateEquipmentStats(this.totalStats);
        
        return this.totalStats;
    }
    
    /**
     * Use a consumable item
     */
    useItem(instanceId) {
        const item = this.inventory.find(i => i.id === instanceId);
        if (!item || item.type !== 'consumable') {
            console.warn('Cannot use item');
            return false;
        }
        
        // Apply effect
        if (item.effect) {
            switch (item.effect.type) {
                case 'heal':
                    gameState.modifyHAM(item.effect.stat, item.effect.amount);
                    console.log(`Healed ${item.effect.amount} ${item.effect.stat}`);
                    break;
                    
                case 'buff':
                    gameState.addBuff({
                        id: `${item.templateId}_buff`,
                        name: item.name,
                        stat: item.effect.stat,
                        amount: item.effect.amount,
                        duration: item.effect.duration,
                        startTime: Date.now()
                    });
                    console.log(`Applied buff: ${item.name}`);
                    break;
            }
        }
        
        // Remove from inventory
        this.removeFromInventory(instanceId, 1);
        
        gameState.emit('itemUsed', { item });
        return true;
    }
    
    /**
     * Get equipped weapon info
     */
    getEquippedWeapon() {
        return this.equipped.right_hand;
    }
    
    /**
     * Get all equipped items
     */
    getEquipped() {
        return { ...this.equipped };
    }
    
    /**
     * Get inventory
     */
    getInventory() {
        return [...this.inventory];
    }
    
    /**
     * Get total stats
     */
    getTotalStats() {
        return { ...this.totalStats };
    }
    
    /**
     * Emit inventory change event
     */
    emitInventoryChange() {
        gameState.emit('inventoryChange', {
            inventory: this.getInventory(),
            size: this.inventorySize,
            used: this.inventory.length
        });
    }
    
    /**
     * Emit equipment change event
     */
    emitEquipmentChange(slot, item) {
        gameState.emit('equipmentChange', {
            slot,
            item,
            equipped: this.getEquipped(),
            stats: this.getTotalStats()
        });
    }
    
    /**
     * Open equipment UI
     */
    openEquipmentUI() {
        gameState.emit('showEquipmentUI', {
            equipped: this.getEquipped(),
            inventory: this.getInventory(),
            stats: this.getTotalStats()
        });
    }
}

// Singleton instance
export const equipmentSystem = new EquipmentSystem();
export default equipmentSystem;
