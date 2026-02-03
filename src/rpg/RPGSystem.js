/**
 * RPG System
 * Complete role-playing game mechanics:
 * - Character stats (STR, DEX, INT, VIT, LCK)
 * - Leveling and experience
 * - Equipment system with stat modifiers
 * - Skill trees and abilities
 * - Inventory management
 * - Loot system
 */
export class RPGSystem {
    constructor() {
        this.characters = new Map();
        this.itemDatabase = this.createItemDatabase();
        console.log('⚔️ RPG System initialized');
    }
    
    /**
     * Create a new character
     */
    createCharacter(id, config = {}) {
        const character = {
            id,
            name: config.name || 'Wanderer',
            level: 1,
            experience: 0,
            experienceToNext: 100,
            
            // Base stats
            stats: {
                strength: config.strength || 10,     // Physical damage
                dexterity: config.dexterity || 10,   // Attack speed, accuracy
                intelligence: config.intelligence || 10, // Magic damage
                vitality: config.vitality || 10,     // HP
                luck: config.luck || 10              // Crit chance, loot
            },
            
            // Combat stats (derived from base stats)
            combat: {
                health: 0,
                maxHealth: 0,
                mana: 0,
                maxMana: 0,
                stamina: 100,
                maxStamina: 100,
                physicalDamage: 0,
                magicDamage: 0,
                defense: 0,
                magicResist: 0,
                critChance: 0.05,
                critMultiplier: 2.0,
                attackSpeed: 1.0,
                moveSpeed: 1.0
            },
            
            // Equipment slots
            equipment: {
                weapon: null,
                armor: null,
                helmet: null,
                boots: null,
                accessory1: null,
                accessory2: null
            },
            
            // Inventory
            inventory: {
                items: [],
                maxSlots: 30,
                gold: 0
            },
            
            // Skills
            skills: {
                availablePoints: 0,
                trees: this.createSkillTrees()
            },
            
            // Status effects
            effects: []
        };
        
        this.updateDerivedStats(character);
        this.characters.set(id, character);
        
        console.log(`✅ Created character: ${character.name} (Level ${character.level})`);
        return character;
    }
    
    /**
     * Update derived combat stats from base stats and equipment
     */
    updateDerivedStats(character) {
        const stats = character.stats;
        const combat = character.combat;
        
        // Base calculations
        combat.maxHealth = 100 + (stats.vitality * 10);
        combat.maxMana = 50 + (stats.intelligence * 5);
        combat.physicalDamage = 10 + (stats.strength * 2);
        combat.magicDamage = 5 + (stats.intelligence * 2);
        combat.defense = stats.strength * 0.5;
        combat.magicResist = stats.intelligence * 0.5;
        combat.critChance = 0.05 + (stats.luck * 0.01);
        combat.attackSpeed = 1.0 + (stats.dexterity * 0.02);
        combat.moveSpeed = 1.0 + (stats.dexterity * 0.01);
        
        // Add equipment bonuses
        Object.values(character.equipment).forEach(item => {
            if (item && item.stats) {
                combat.physicalDamage += item.stats.damage || 0;
                combat.magicDamage += item.stats.magicDamage || 0;
                combat.defense += item.stats.defense || 0;
                combat.magicResist += item.stats.magicResist || 0;
                combat.maxHealth += item.stats.health || 0;
                combat.maxMana += item.stats.mana || 0;
            }
        });
        
        // Ensure health/mana don't exceed max
        combat.health = Math.min(combat.health || combat.maxHealth, combat.maxHealth);
        combat.mana = Math.min(combat.mana || combat.maxMana, combat.maxMana);
    }
    
    /**
     * Grant experience and handle leveling
     */
    grantExperience(characterId, amount) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        character.experience += amount;
        
        // Check for level up
        while (character.experience >= character.experienceToNext) {
            this.levelUp(character);
        }
        
        return true;
    }
    
    levelUp(character) {
        character.level++;
        character.experience -= character.experienceToNext;
        character.experienceToNext = Math.floor(character.experienceToNext * 1.5);
        
        // Grant stat points
        character.stats.strength += 2;
        character.stats.dexterity += 2;
        character.stats.intelligence += 2;
        character.stats.vitality += 2;
        character.stats.luck += 1;
        
        // Grant skill point
        character.skills.availablePoints += 1;
        
        // Update derived stats
        this.updateDerivedStats(character);
        
        // Restore health and mana
        character.combat.health = character.combat.maxHealth;
        character.combat.mana = character.combat.maxMana;
        
        console.log(`🎉 ${character.name} reached level ${character.level}!`);
        return true;
    }
    
    /**
     * Equip an item
     */
    equipItem(characterId, item, slot) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        // Check if item can be equipped in slot
        if (item.slot !== slot) return false;
        
        // Unequip current item
        if (character.equipment[slot]) {
            this.unequipItem(characterId, slot);
        }
        
        // Equip new item
        character.equipment[slot] = item;
        
        // Update stats
        this.updateDerivedStats(character);
        
        console.log(`${character.name} equipped ${item.name}`);
        return true;
    }
    
    unequipItem(characterId, slot) {
        const character = this.characters.get(characterId);
        if (!character || !character.equipment[slot]) return false;
        
        const item = character.equipment[slot];
        
        // Add to inventory
        if (character.inventory.items.length < character.inventory.maxSlots) {
            character.inventory.items.push(item);
        }
        
        character.equipment[slot] = null;
        this.updateDerivedStats(character);
        
        return true;
    }
    
    /**
     * Inventory management
     */
    addItemToInventory(characterId, item) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        if (character.inventory.items.length >= character.inventory.maxSlots) {
            console.warn('Inventory full!');
            return false;
        }
        
        character.inventory.items.push(item);
        return true;
    }
    
    removeItemFromInventory(characterId, itemIndex) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        if (itemIndex >= 0 && itemIndex < character.inventory.items.length) {
            const item = character.inventory.items.splice(itemIndex, 1)[0];
            return item;
        }
        
        return null;
    }
    
    /**
     * Calculate damage output
     */
    calculateDamage(attacker, defender, isPhysical = true) {
        const damage = isPhysical ? attacker.combat.physicalDamage : attacker.combat.magicDamage;
        const defense = isPhysical ? defender.combat.defense : defender.combat.magicResist;
        
        // Base damage
        let finalDamage = Math.max(1, damage - defense);
        
        // Critical hit check
        const isCrit = Math.random() < attacker.combat.critChance;
        if (isCrit) {
            finalDamage *= attacker.combat.critMultiplier;
        }
        
        // Random variance (±10%)
        finalDamage *= 0.9 + Math.random() * 0.2;
        
        return {
            damage: Math.floor(finalDamage),
            isCrit
        };
    }
    
    /**
     * Apply damage to character
     */
    applyDamage(characterId, damage) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        character.combat.health -= damage;
        character.combat.health = Math.max(0, character.combat.health);
        
        if (character.combat.health === 0) {
            console.log(`💀 ${character.name} has been defeated!`);
            return { dead: true };
        }
        
        return { dead: false, currentHealth: character.combat.health };
    }
    
    /**
     * Heal character
     */
    heal(characterId, amount) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        const oldHealth = character.combat.health;
        character.combat.health = Math.min(
            character.combat.maxHealth,
            character.combat.health + amount
        );
        
        const actualHealing = character.combat.health - oldHealth;
        return { healed: actualHealing, currentHealth: character.combat.health };
    }
    
    /**
     * Skill tree system
     */
    createSkillTrees() {
        return {
            combat: {
                powerStrike: { level: 0, maxLevel: 5, description: '+10% physical damage per level' },
                criticalEye: { level: 0, maxLevel: 5, description: '+5% crit chance per level' },
                ironSkin: { level: 0, maxLevel: 5, description: '+10 defense per level' }
            },
            magic: {
                spellPower: { level: 0, maxLevel: 5, description: '+10% magic damage per level' },
                manaPool: { level: 0, maxLevel: 5, description: '+50 max mana per level' },
                magicShield: { level: 0, maxLevel: 5, description: '+10 magic resist per level' }
            },
            survival: {
                vitality: { level: 0, maxLevel: 5, description: '+50 max health per level' },
                regeneration: { level: 0, maxLevel: 5, description: '+2 HP per second per level' },
                swiftness: { level: 0, maxLevel: 5, description: '+5% move speed per level' }
            }
        };
    }
    
    learnSkill(characterId, tree, skillName) {
        const character = this.characters.get(characterId);
        if (!character) return false;
        
        const skill = character.skills.trees[tree]?.[skillName];
        if (!skill) return false;
        
        if (character.skills.availablePoints > 0 && skill.level < skill.maxLevel) {
            skill.level++;
            character.skills.availablePoints--;
            this.updateDerivedStats(character);
            console.log(`📖 ${character.name} learned ${skillName} (Level ${skill.level})`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Item database
     */
    createItemDatabase() {
        return {
            weapons: [
                {
                    id: 'sword_iron',
                    name: 'Iron Sword',
                    slot: 'weapon',
                    rarity: 'common',
                    stats: { damage: 15 },
                    value: 50
                },
                {
                    id: 'sword_steel',
                    name: 'Steel Sword',
                    slot: 'weapon',
                    rarity: 'uncommon',
                    stats: { damage: 30 },
                    value: 150
                },
                {
                    id: 'staff_apprentice',
                    name: 'Apprentice Staff',
                    slot: 'weapon',
                    rarity: 'common',
                    stats: { magicDamage: 20, mana: 20 },
                    value: 60
                },
                {
                    id: 'bow_hunter',
                    name: 'Hunter Bow',
                    slot: 'weapon',
                    rarity: 'uncommon',
                    stats: { damage: 25 },
                    value: 120
                }
            ],
            armor: [
                {
                    id: 'armor_leather',
                    name: 'Leather Armor',
                    slot: 'armor',
                    rarity: 'common',
                    stats: { defense: 10, health: 50 },
                    value: 80
                },
                {
                    id: 'armor_chainmail',
                    name: 'Chainmail Armor',
                    slot: 'armor',
                    rarity: 'uncommon',
                    stats: { defense: 25, health: 100 },
                    value: 250
                },
                {
                    id: 'robe_mage',
                    name: 'Mage Robe',
                    slot: 'armor',
                    rarity: 'uncommon',
                    stats: { magicResist: 20, mana: 50 },
                    value: 200
                }
            ],
            accessories: [
                {
                    id: 'ring_strength',
                    name: 'Ring of Strength',
                    slot: 'accessory1',
                    rarity: 'rare',
                    stats: { damage: 10 },
                    value: 300
                },
                {
                    id: 'amulet_health',
                    name: 'Amulet of Health',
                    slot: 'accessory2',
                    rarity: 'rare',
                    stats: { health: 100 },
                    value: 350
                }
            ]
        };
    }
    
    /**
     * Loot generation
     */
    generateLoot(characterLevel, enemyType = 'common') {
        const loot = {
            items: [],
            gold: Math.floor(10 * characterLevel * (0.5 + Math.random()))
        };
        
        // Chance to drop item based on enemy type
        const dropChances = {
            common: 0.3,
            elite: 0.6,
            boss: 1.0
        };
        
        if (Math.random() < (dropChances[enemyType] || 0.3)) {
            // Select random item
            const allItems = [
                ...this.itemDatabase.weapons,
                ...this.itemDatabase.armor,
                ...this.itemDatabase.accessories
            ];
            
            const item = allItems[Math.floor(Math.random() * allItems.length)];
            loot.items.push({ ...item }); // Clone item
        }
        
        return loot;
    }
    
    /**
     * Get character stats
     */
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }
    
    /**
     * Get all characters
     */
    getAllCharacters() {
        return Array.from(this.characters.values());
    }
}

export default RPGSystem;
