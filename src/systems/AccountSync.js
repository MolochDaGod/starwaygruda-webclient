import { gameState } from './GameStateManager.js';

/**
 * AccountSync — thin sync layer between client GameStateManager and Grudge backend.
 *
 * Responsibilities:
 *  1. Hydrate gameState from backend on login.
 *  2. Debounce-push dirty sections (inventory, professions, island) to backend.
 *  3. Queue mutations while offline; flush on reconnect.
 */

const DEBOUNCE_MS = 2000; // 2-second debounce per section
const SYNC_SECTIONS = ['inventory', 'professions', 'island'];

export class AccountSync {
    constructor(apiClient) {
        this.api = apiClient;
        this.online = true;

        // Dirty flags + debounce timers per section
        this._dirty = {};
        this._timers = {};
        SYNC_SECTIONS.forEach(s => {
            this._dirty[s] = false;
            this._timers[s] = null;
        });

        // Offline mutation queue: array of { section, payload, timestamp }
        this._offlineQueue = [];

        // Bind to GameStateManager events that signal mutations
        this._bindEvents();

        console.log('🔄 AccountSync initialized');
    }

    // ─── Hydration ──────────────────────────────────────────

    /**
     * Pull all account data from backend and merge into gameState.
     * Call once after successful login.
     */
    async hydrate() {
        try {
            const [invRes, profRes, islandRes, charRes] = await Promise.all([
                this.api.getAccountInventory(),
                this.api.getAccountProfessions(),
                this.api.getIsland(),
                this.api.getAccountCharacters(),
            ]);

            // Inventory
            if (!invRes.offline && invRes.items) {
                gameState.setState(draft => {
                    draft.inventory.items = invRes.items;
                    if (invRes.credits != null) draft.inventory.credits = invRes.credits;
                    if (invRes.bankCredits != null) draft.player.bankCredits = invRes.bankCredits;
                }, 'syncInventoryHydrate');
            }

            // Professions + XP
            if (!profRes.offline && profRes.professions) {
                gameState.setState(draft => {
                    draft.professions = profRes.professions;
                    if (profRes.skillPoints) draft.skillPoints = profRes.skillPoints;
                    if (profRes.experience) draft.experience = profRes.experience;
                }, 'syncProfessionsHydrate');
            }

            // Island
            if (!islandRes.offline && islandRes.island) {
                gameState.setState(draft => {
                    draft.island = islandRes.island;
                }, 'syncIslandHydrate');
            }

            // Characters (store on state for island assignment UI)
            if (!charRes.offline && charRes.characters) {
                gameState.setState(draft => {
                    draft.accountCharacters = charRes.characters;
                }, 'syncCharactersHydrate');
            }

            this.online = true;
            console.log('✅ AccountSync hydration complete');

            // Flush any queued offline mutations
            await this._flushOfflineQueue();
        } catch (err) {
            console.warn('⚠️ AccountSync hydration failed, running offline', err);
            this.online = false;
        }
    }

    // ─── Push (debounced) ───────────────────────────────────

    /**
     * Mark a section as dirty and schedule a debounced push.
     * @param {'inventory'|'professions'|'island'} section
     */
    push(section) {
        if (!SYNC_SECTIONS.includes(section)) return;

        this._dirty[section] = true;

        // Clear existing timer and set a new one
        if (this._timers[section]) clearTimeout(this._timers[section]);
        this._timers[section] = setTimeout(() => this._pushSection(section), DEBOUNCE_MS);
    }

    /**
     * Force-push all dirty sections immediately (e.g. before page unload).
     */
    async flushAll() {
        const promises = [];
        for (const section of SYNC_SECTIONS) {
            if (this._dirty[section]) {
                if (this._timers[section]) clearTimeout(this._timers[section]);
                promises.push(this._pushSection(section));
            }
        }
        await Promise.allSettled(promises);
    }

    // ─── Internal ───────────────────────────────────────────

    async _pushSection(section) {
        this._dirty[section] = false;
        const state = gameState.getState();

        let payload;
        let saveFn;

        switch (section) {
            case 'inventory':
                payload = {
                    items: state.inventory.items,
                    credits: state.inventory.credits,
                    bankCredits: state.player.bankCredits,
                };
                saveFn = () => this.api.saveAccountInventory(payload);
                break;

            case 'professions':
                payload = {
                    professions: state.professions,
                    skillPoints: state.skillPoints,
                    experience: state.experience,
                };
                saveFn = () => this.api.saveAccountProfessions(payload);
                break;

            case 'island':
                payload = state.island || {};
                saveFn = () => this.api.saveIsland(payload);
                break;

            default:
                return;
        }

        if (!this.online) {
            this._offlineQueue.push({ section, payload, timestamp: Date.now() });
            console.log(`📦 Queued offline mutation: ${section}`);
            return;
        }

        try {
            const res = await saveFn();
            if (res.offline) {
                this.online = false;
                this._offlineQueue.push({ section, payload, timestamp: Date.now() });
                console.warn(`⚠️ Push failed (offline), queued: ${section}`);
            } else {
                console.log(`☁️ Synced ${section}`);
            }
        } catch (err) {
            this.online = false;
            this._offlineQueue.push({ section, payload, timestamp: Date.now() });
            console.warn(`⚠️ Push error for ${section}, queued`, err);
        }
    }

    async _flushOfflineQueue() {
        if (this._offlineQueue.length === 0) return;
        console.log(`🔄 Flushing ${this._offlineQueue.length} offline mutations`);

        const queue = [...this._offlineQueue];
        this._offlineQueue = [];

        for (const entry of queue) {
            this._dirty[entry.section] = true;
            await this._pushSection(entry.section);
        }
    }

    // ─── Event bindings ─────────────────────────────────────

    _bindEvents() {
        // Inventory mutations
        const inventoryEvents = [
            'itemAdded', 'itemRemoved', 'itemEquipped', 'itemUnequipped',
            'creditsChange', 'harvestComplete'
        ];
        inventoryEvents.forEach(evt => {
            gameState.on(evt, () => this.push('inventory'));
        });

        // Profession / skill mutations
        const professionEvents = ['skillLearned', 'xpGained', 'xpApplied', 'abilityLearned'];
        professionEvents.forEach(evt => {
            gameState.on(evt, () => this.push('professions'));
        });

        // Island mutations
        const islandEvents = [
            'islandNodeAssigned', 'islandNodeUnassigned',
            'islandUpgraded', 'islandHarvestCollected'
        ];
        islandEvents.forEach(evt => {
            gameState.on(evt, () => this.push('island'));
        });

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flushAll());
        }
    }
}

export default AccountSync;
