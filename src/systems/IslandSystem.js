import { gameState } from './GameStateManager.js';
import { RESOURCE_TYPES } from './HarvestingSystem.js';

/**
 * IslandSystem — Home island per account.
 *
 * Each account owns an island with resource node slots.
 * Characters are assigned to nodes and autonomously harvest
 * based on their profession levels.
 *
 * Island levels 1–10 unlock more slots and better base yields.
 */

// ═══════════════════════════ ISLAND CONFIG ═══════════════════

const ISLAND_LEVELS = [
    { level: 1,  slots: 4,  yieldMult: 1.0,  upgradeCost: null },
    { level: 2,  slots: 6,  yieldMult: 1.1,  upgradeCost: { iron: 50, wood: 80 } },
    { level: 3,  slots: 8,  yieldMult: 1.2,  upgradeCost: { iron: 120, wood: 150, copper: 60 } },
    { level: 4,  slots: 10, yieldMult: 1.35, upgradeCost: { iron: 250, copper: 150, steel: 50 } },
    { level: 5,  slots: 12, yieldMult: 1.5,  upgradeCost: { steel: 150, copper: 200, flora: 100 } },
    { level: 6,  slots: 14, yieldMult: 1.65, upgradeCost: { steel: 300, aluminum: 150, radioactive: 30 } },
    { level: 7,  slots: 16, yieldMult: 1.8,  upgradeCost: { steel: 500, aluminum: 300, radioactive: 80 } },
    { level: 8,  slots: 18, yieldMult: 2.0,  upgradeCost: { steel: 800, radioactive: 150, solar: 200 } },
    { level: 9,  slots: 19, yieldMult: 2.2,  upgradeCost: { steel: 1200, radioactive: 300, solar: 400 } },
    { level: 10, slots: 20, yieldMult: 2.5,  upgradeCost: { steel: 2000, radioactive: 500, solar: 800 } },
];

// Tick interval: 60 seconds (autonomous harvest cycle)
const TICK_INTERVAL_MS = 60_000;

// Available resource types for island nodes
const ISLAND_RESOURCE_TYPES = ['iron', 'copper', 'aluminum', 'steel', 'flora', 'wood', 'radioactive', 'solar'];

// ═══════════════════════════ ISLAND SYSTEM ═══════════════════

export class IslandSystem {
    constructor(apiClient) {
        this.api = apiClient;
        this._tickTimer = null;

        // Listen for island state changes from hydration
        gameState.on('syncIslandHydrate', () => this._onIslandHydrated());

        console.log('🏝️ IslandSystem initialized');
    }

    // ─── Getters ─────────────────────────────────────────────

    getIsland() {
        return gameState.getState().island || this._defaultIsland();
    }

    getLevelConfig(level = null) {
        const island = this.getIsland();
        const lvl = level ?? island.level;
        return ISLAND_LEVELS.find(l => l.level === lvl) || ISLAND_LEVELS[0];
    }

    getMaxSlots() {
        return this.getLevelConfig().slots;
    }

    getAvailableResourceTypes() {
        return ISLAND_RESOURCE_TYPES.map(id => ({
            id,
            ...RESOURCE_TYPES[id],
        }));
    }

    // ─── Initialization ──────────────────────────────────────

    /**
     * Create a default island for a new account.
     */
    _defaultIsland() {
        return {
            level: 1,
            nodes: [
                { slotIndex: 0, resourceType: 'iron', characterId: null, accumulated: 0 },
                { slotIndex: 1, resourceType: 'wood', characterId: null, accumulated: 0 },
                { slotIndex: 2, resourceType: 'flora', characterId: null, accumulated: 0 },
                { slotIndex: 3, resourceType: 'copper', characterId: null, accumulated: 0 },
            ],
            lastTickTime: Date.now(),
            harvestLog: [],
        };
    }

    /**
     * Ensure the island state exists in gameState, creating defaults if needed.
     */
    ensureIsland() {
        const state = gameState.getState();
        if (!state.island) {
            const island = this._defaultIsland();
            gameState.setState(draft => {
                draft.island = island;
            }, 'islandCreated');
        }
    }

    // ─── Node Management ─────────────────────────────────────

    /**
     * Assign a character to a node slot.
     */
    assignCharacter(slotIndex, characterId) {
        this.ensureIsland();
        const island = this.getIsland();
        const node = island.nodes.find(n => n.slotIndex === slotIndex);
        if (!node) return false;

        // Check character isn't already assigned elsewhere
        const alreadyAssigned = island.nodes.find(n => n.characterId === characterId);
        if (alreadyAssigned && alreadyAssigned.slotIndex !== slotIndex) {
            console.warn(`Character ${characterId} already assigned to slot ${alreadyAssigned.slotIndex}`);
            return false;
        }

        gameState.setState(draft => {
            const n = draft.island.nodes.find(n => n.slotIndex === slotIndex);
            if (n) n.characterId = characterId;
        }, 'islandNodeAssigned');

        gameState.emit('islandNodeAssigned', { slotIndex, characterId });
        return true;
    }

    /**
     * Unassign a character from a node slot.
     */
    unassignCharacter(slotIndex) {
        this.ensureIsland();

        gameState.setState(draft => {
            const n = draft.island.nodes.find(n => n.slotIndex === slotIndex);
            if (n) n.characterId = null;
        }, 'islandNodeUnassigned');

        gameState.emit('islandNodeUnassigned', { slotIndex });
        return true;
    }

    /**
     * Change the resource type of a node slot.
     */
    setNodeResource(slotIndex, resourceType) {
        if (!ISLAND_RESOURCE_TYPES.includes(resourceType)) return false;
        this.ensureIsland();

        gameState.setState(draft => {
            const n = draft.island.nodes.find(n => n.slotIndex === slotIndex);
            if (n) {
                n.resourceType = resourceType;
                n.accumulated = 0; // Reset on type change
            }
        }, 'islandNodeResourceChanged');

        return true;
    }

    // ─── Upgrade ─────────────────────────────────────────────

    /**
     * Get the cost of the next upgrade, or null if max level.
     */
    getUpgradeCost() {
        const island = this.getIsland();
        const nextConfig = ISLAND_LEVELS.find(l => l.level === island.level + 1);
        return nextConfig?.upgradeCost || null;
    }

    /**
     * Attempt to upgrade the island to the next level.
     * Deducts resources from inventory.
     */
    upgrade() {
        const island = this.getIsland();
        const cost = this.getUpgradeCost();
        if (!cost) {
            console.warn('Island is at max level');
            return false;
        }

        const state = gameState.getState();
        const items = state.inventory.items;

        // Check if player has enough resources
        for (const [resType, amount] of Object.entries(cost)) {
            const total = items
                .filter(i => i.resourceType === resType && i.type === 'resource')
                .reduce((sum, i) => sum + (i.quantity || 1), 0);
            if (total < amount) {
                console.warn(`Not enough ${resType}: have ${total}, need ${amount}`);
                return false;
            }
        }

        // Deduct resources
        gameState.setState(draft => {
            for (const [resType, amount] of Object.entries(cost)) {
                let remaining = amount;
                draft.inventory.items = draft.inventory.items.filter(item => {
                    if (remaining <= 0) return true;
                    if (item.resourceType !== resType || item.type !== 'resource') return true;
                    const qty = item.quantity || 1;
                    if (qty <= remaining) {
                        remaining -= qty;
                        return false; // Remove entire stack
                    } else {
                        item.quantity -= remaining;
                        remaining = 0;
                        return true;
                    }
                });
            }

            // Level up
            draft.island.level += 1;

            // Add new empty node slots
            const nextConfig = ISLAND_LEVELS.find(l => l.level === draft.island.level);
            const currentSlotCount = draft.island.nodes.length;
            const newSlotCount = nextConfig ? nextConfig.slots : currentSlotCount;
            for (let i = currentSlotCount; i < newSlotCount; i++) {
                draft.island.nodes.push({
                    slotIndex: i,
                    resourceType: ISLAND_RESOURCE_TYPES[i % ISLAND_RESOURCE_TYPES.length],
                    characterId: null,
                    accumulated: 0,
                });
            }
        }, 'islandUpgraded');

        gameState.emit('islandUpgraded', { newLevel: island.level + 1 });
        console.log(`🏝️ Island upgraded to level ${island.level + 1}!`);
        return true;
    }

    // ─── Autonomous Harvest Tick ─────────────────────────────

    /**
     * Start the autonomous harvest timer.
     */
    startTicking() {
        this.ensureIsland();
        if (this._tickTimer) clearInterval(this._tickTimer);
        this._tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
        console.log('🏝️ Island harvest ticking started (60s intervals)');
    }

    /**
     * Stop the autonomous harvest timer.
     */
    stopTicking() {
        if (this._tickTimer) {
            clearInterval(this._tickTimer);
            this._tickTimer = null;
        }
    }

    /**
     * Run one harvest tick. Computes yields for all assigned nodes.
     */
    tick() {
        this.ensureIsland();
        const island = this.getIsland();
        const state = gameState.getState();
        const characters = state.accountCharacters || [];
        const levelConfig = this.getLevelConfig();
        const now = Date.now();

        const yields = [];

        for (const node of island.nodes) {
            if (!node.characterId) continue;

            const resType = RESOURCE_TYPES[node.resourceType];
            if (!resType) continue;

            const character = characters.find(c => c.id === node.characterId);
            const profBonus = this._computeProfessionBonus(character, node.resourceType);
            const baseYield = resType.baseYield;
            const amount = Math.max(1, Math.floor(baseYield * levelConfig.yieldMult * profBonus * (0.85 + Math.random() * 0.3)));

            yields.push({
                slotIndex: node.slotIndex,
                resourceType: node.resourceType,
                resourceName: resType.name,
                amount,
                characterName: character?.name || 'Unknown',
                timestamp: now,
            });
        }

        if (yields.length === 0) return;

        // Apply yields: accumulate on nodes
        gameState.setState(draft => {
            for (const y of yields) {
                const n = draft.island.nodes.find(n => n.slotIndex === y.slotIndex);
                if (n) n.accumulated += y.amount;
            }
            draft.island.lastTickTime = now;

            // Append to harvest log (keep last 50 entries)
            draft.island.harvestLog = [
                ...yields.map(y => ({
                    resourceType: y.resourceType,
                    resourceName: y.resourceName,
                    amount: y.amount,
                    characterName: y.characterName,
                    timestamp: y.timestamp,
                })),
                ...(draft.island.harvestLog || []),
            ].slice(0, 50);
        }, 'islandTick');

        console.log(`🏝️ Island tick: ${yields.length} nodes harvested`);
        gameState.emit('islandTick', { yields });
    }

    /**
     * Collect all accumulated resources from island nodes into account inventory.
     */
    collectAll() {
        this.ensureIsland();
        const island = this.getIsland();
        const collectedItems = [];

        gameState.setState(draft => {
            for (const node of draft.island.nodes) {
                if (node.accumulated <= 0) continue;

                const resType = RESOURCE_TYPES[node.resourceType];
                if (!resType) continue;

                const item = {
                    id: `island-${node.resourceType}-${Date.now()}-${node.slotIndex}`,
                    name: resType.name,
                    type: 'resource',
                    resourceType: node.resourceType,
                    quantity: node.accumulated,
                    quality: 50 + Math.floor(Math.random() * 30),
                    stackable: true,
                    source: 'Home Island',
                };

                draft.inventory.items.push(item);
                collectedItems.push({ ...item });
                node.accumulated = 0;
            }
        }, 'islandHarvestCollected');

        if (collectedItems.length > 0) {
            gameState.emit('islandHarvestCollected', { items: collectedItems });
            console.log(`🏝️ Collected ${collectedItems.length} resource stacks from island`);
        }

        return collectedItems;
    }

    // ─── Helpers ──────────────────────────────────────────────

    /**
     * Compute profession-based harvest bonus for a character.
     */
    _computeProfessionBonus(character, resourceType) {
        if (!character) return 1.0;

        let bonus = 1.0;
        const profs = character.professions || {};

        // Artisan survey skills → yield bonus for minerals/energy
        if (profs.artisan) {
            const surveySkills = (profs.artisan.skills || []).filter(s => s.startsWith('survey_'));
            bonus += surveySkills.length * 0.05;
        }

        // Scout survival skills → bonus for organic resources
        if (profs.scout) {
            const survivalSkills = (profs.scout.skills || []).filter(s => s.startsWith('surv_'));
            bonus += survivalSkills.length * 0.05;

            // Extra bonus for creature resources
            if (['meat', 'hide', 'bone'].includes(resourceType)) {
                const huntSkills = (profs.scout.skills || []).filter(s => s.startsWith('hunt_'));
                bonus += huntSkills.length * 0.04;
            }
        }

        return bonus;
    }

    _onIslandHydrated() {
        // Restart ticking after hydration
        this.startTicking();
    }

    destroy() {
        this.stopTicking();
    }
}

export { ISLAND_LEVELS, ISLAND_RESOURCE_TYPES, TICK_INTERVAL_MS };
export default IslandSystem;
