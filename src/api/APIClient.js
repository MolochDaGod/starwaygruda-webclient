/**
 * StarWayGRUDA APIClient — Game-specific wrapper over grudge-studio SDK
 *
 * This thin layer adds StarWay-specific offline fallbacks and
 * convenience methods. All backend calls go through the shared SDK.
 */
import { GrudgeStudioSDK, OFFLINE_DEFAULTS } from 'grudge-studio/cloud';

export class APIClient {
    constructor() {
        this.sdk = new GrudgeStudioSDK();
        this.sdk.restoreSession(); // auto-login from localStorage if available
    }

    // Expose SDK state
    get token() { return this.sdk.token; }
    get user() { return this.sdk.user; }
    get isAuthenticated() { return this.sdk.isAuthenticated; }

    async connect() {
        const data = await this.sdk.health();
        if (data.offline) {
            console.warn('⚠️ Server not available, running in offline mode');
            return { status: 'offline' };
        }
        console.log('✅ Connected to game-api:', data);
        return data;
    }

    async login(username, password) {
        const data = await this.sdk.login(username, password);
        if (data.success) this.sdk.persistToken();
        if (data.offline) {
            // Offline dev fallback
            return {
                success: true, offline: true,
                grudgeId: 'dev-grudge-id', token: 'dev-token',
                user: { id: 0, grudgeId: 'dev-grudge-id', username: username || 'Developer', displayName: username || 'Developer', isGuest: false, gold: 1000, gbuxBalance: 0 },
            };
        }
        return data;
    }

    async register(username, password, email) {
        const data = await this.sdk.register(username, password, email);
        if (data.success) this.sdk.persistToken();
        return data;
    }

    async guestLogin() {
        const data = await this.sdk.guestLogin();
        if (data.success) this.sdk.persistToken();
        if (data.offline) {
            return { success: true, offline: true, grudgeId: 'dev-guest', token: 'dev-token', user: { id: 0, username: 'Guest', isGuest: true, gold: 500, gbuxBalance: 0 } };
        }
        return data;
    }

    async walletLogin(walletAddress, signature, message) {
        return this.sdk.walletLogin(walletAddress, signature, message);
    }

    async verify() { return this.sdk.verify(); }

    // ── Game data (with StarWay offline fallbacks) ─────────
    async getCharacters() {
        const data = await this.sdk.getCharacters();
        if (data.offline) return { characters: OFFLINE_DEFAULTS.characters };
        return data;
    }

    async createCharacter(characterData) {
        const data = await this.sdk.createCharacter(characterData);
        if (data.offline) return { success: true, character: { id: `char-${Date.now()}`, ...characterData } };
        return data;
    }

    async getSpawnLocations() {
        const data = await this.sdk.getSpawns();
        if (data.offline) return { spawns: OFFLINE_DEFAULTS.spawns };
        return data;
    }

    async getMissions() {
        const data = await this.sdk.getMissions();
        if (data.offline) return { missions: [] };
        return data;
    }

    async getInventory() {
        const data = await this.sdk.getInventory();
        if (data.offline) return { items: [] };
        return data;
    }

    logout() { this.sdk.clearSession(); }
}
