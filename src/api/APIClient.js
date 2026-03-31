/**
 * StarWayGRUDA APIClient — connects directly to Grudge Studio backend
 *
 * Auth → id.grudge-studio.com
 * Game data → api.grudge-studio.com
 */

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://id.grudge-studio.com';
const API_URL  = import.meta.env.VITE_API_URL || 'https://api.grudge-studio.com';
const TOKEN_KEY = 'grudge_auth_token';
const USER_KEY  = 'grudge_user_data';

// Offline defaults for when backend is unreachable
const OFFLINE_DEFAULTS = {
    characters: [
        { id: 'offline-1', name: 'Player', race: 'human', class: 'warrior', faction: 'Crusade', level: 1, planet: 'tutorial', zone: 'Tutorial Island' }
    ],
    spawns: [
        { id: 'tutorial-spawn', zone: 'Tutorial Island', position: { x: 0, y: 0, z: 0 } }
    ],
};

async function safeFetch(url, opts = {}) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(timeout);
        return await res.json();
    } catch {
        return { offline: true };
    }
}

export class APIClient {
    constructor() {
        this._token = localStorage.getItem(TOKEN_KEY);
        try { this._user = JSON.parse(localStorage.getItem(USER_KEY)); } catch { this._user = null; }
        if (!this._user && this._token) {
            const storedUserId = localStorage.getItem('grudge_user_id');
            const storedGrudgeId = localStorage.getItem('grudge_id');
            const storedUsername = localStorage.getItem('grudge_username');
            if (storedGrudgeId || storedUsername) {
                this._user = {
                    id: storedUserId ? Number(storedUserId) : 0,
                    grudgeId: storedGrudgeId || '',
                    username: storedUsername || 'Pilot',
                    displayName: storedUsername || 'Pilot',
                    isGuest: false,
                    gold: 0,
                    gbuxBalance: 0,
                };
            }
        }
    }

    get token() { return this._token; }
    get user() { return this._user; }
    get isAuthenticated() { return !!this._token; }

    _persistSession(data) {
        if (data.token) {
            this._token = data.token;
            localStorage.setItem(TOKEN_KEY, data.token);
        }
        const u = data.user || data;
        const resolvedUserId = u.userId || u.id || data.userId || data.id || '';
        const resolvedGrudgeId = data.grudgeId || u.grudgeId || u.grudge_id || '';
        const resolvedUsername = u.username || u.displayName || data.username || 'Pilot';
        this._user = {
            id: resolvedUserId || 0,
            grudgeId: resolvedGrudgeId,
            username: resolvedUsername,
            displayName: u.displayName || resolvedUsername,
            isGuest: u.isGuest || false,
            gold: u.gold || 0,
            gbuxBalance: u.gbuxBalance || 0,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(this._user));
        if (resolvedUserId) localStorage.setItem('grudge_user_id', String(resolvedUserId));
        if (resolvedGrudgeId) localStorage.setItem('grudge_id', resolvedGrudgeId);
        if (resolvedUsername) localStorage.setItem('grudge_username', resolvedUsername);
    }

    async connect() {
        const data = await safeFetch(`${AUTH_URL}/health`);
        if (data.offline) {
            console.warn('⚠️ Server not available, running in offline mode');
            return { status: 'offline' };
        }
        console.log('✅ Connected to Grudge backend:', data);
        return data;
    }

    async login(username, password) {
        const data = await safeFetch(`${AUTH_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (data.offline) {
            return {
                success: true, offline: true,
                grudgeId: 'dev-grudge-id', token: 'dev-token',
                user: { id: 0, grudgeId: 'dev-grudge-id', username: username || 'Developer', displayName: username || 'Developer', isGuest: false, gold: 1000, gbuxBalance: 0 },
            };
        }
        if (data.token) this._persistSession(data);
        return data;
    }

    async register(username, password, email) {
        const data = await safeFetch(`${AUTH_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        });
        if (data.token) this._persistSession(data);
        return data;
    }

    async guestLogin() {
        const deviceId = localStorage.getItem('grudge_device_id') || `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('grudge_device_id', deviceId);
        const data = await safeFetch(`${AUTH_URL}/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId }),
        });
        if (data.offline) {
            return { success: true, offline: true, grudgeId: 'dev-guest', token: 'dev-token', user: { id: 0, username: 'Guest', isGuest: true, gold: 500, gbuxBalance: 0 } };
        }
        if (data.token) this._persistSession(data);
        return data;
    }

    async walletLogin(walletAddress, signature, message) {
        const data = await safeFetch(`${AUTH_URL}/auth/wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: walletAddress, signature, message }),
        });
        if (data.token) this._persistSession(data);
        return data;
    }

    async verify() {
        if (!this._token) return { valid: false };
        return safeFetch(`${AUTH_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: this._token }),
        });
    }

    // ── Game data (with StarWay offline fallbacks) ─────────
    async getCharacters() {
        const data = await safeFetch(`${API_URL}/api/characters`, {
            headers: { Authorization: `Bearer ${this._token}` },
        });
        if (data.offline) return { characters: OFFLINE_DEFAULTS.characters };
        return data;
    }

    async createCharacter(characterData) {
        const data = await safeFetch(`${API_URL}/api/characters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this._token}` },
            body: JSON.stringify(characterData),
        });
        if (data.offline) return { success: true, character: { id: `char-${Date.now()}`, ...characterData } };
        return data;
    }

    async getSpawnLocations() {
        const data = await safeFetch(`${API_URL}/api/spawns`, {
            headers: { Authorization: `Bearer ${this._token}` },
        });
        if (data.offline) return { spawns: OFFLINE_DEFAULTS.spawns };
        return data;
    }

    async getMissions() {
        const data = await safeFetch(`${API_URL}/api/missions`, {
            headers: { Authorization: `Bearer ${this._token}` },
        });
        if (data.offline) return { missions: [] };
        return data;
    }

    async getInventory() {
        const data = await safeFetch(`${API_URL}/api/inventory`, {
            headers: { Authorization: `Bearer ${this._token}` },
        });
        if (data.offline) return { items: [] };
        return data;
    }

    // ── Account-bound data (inventory, professions, island) ──

    _authHeaders(extra = {}) {
        return { Authorization: `Bearer ${this._token}`, 'Content-Type': 'application/json', ...extra };
    }

    async getAccountInventory() {
        const data = await safeFetch(`${API_URL}/api/account/inventory`, {
            headers: this._authHeaders(),
        });
        if (data.offline) return { offline: true, items: [], credits: 1000, bankCredits: 0 };
        return data;
    }

    async saveAccountInventory(payload) {
        return safeFetch(`${API_URL}/api/account/inventory`, {
            method: 'PUT',
            headers: this._authHeaders(),
            body: JSON.stringify(payload),
        });
    }

    async getAccountProfessions() {
        const data = await safeFetch(`${API_URL}/api/account/professions`, {
            headers: this._authHeaders(),
        });
        if (data.offline) return { offline: true, professions: {}, skillPoints: { available: 250, spent: 0 }, experience: {} };
        return data;
    }

    async saveAccountProfessions(payload) {
        return safeFetch(`${API_URL}/api/account/professions`, {
            method: 'PUT',
            headers: this._authHeaders(),
            body: JSON.stringify(payload),
        });
    }

    async getIsland() {
        const data = await safeFetch(`${API_URL}/api/account/island`, {
            headers: this._authHeaders(),
        });
        if (data.offline) return { offline: true, island: null };
        return data;
    }

    async saveIsland(payload) {
        return safeFetch(`${API_URL}/api/account/island`, {
            method: 'PUT',
            headers: this._authHeaders(),
            body: JSON.stringify(payload),
        });
    }

    async triggerIslandHarvest(collectedItems) {
        return safeFetch(`${API_URL}/api/account/island/harvest`, {
            method: 'POST',
            headers: this._authHeaders(),
            body: JSON.stringify({ collectedItems }),
        });
    }

    async getAccountCharacters() {
        const data = await safeFetch(`${API_URL}/api/account/characters`, {
            headers: this._authHeaders(),
        });
        if (data.offline) return { offline: true, characters: OFFLINE_DEFAULTS.characters };
        return data;
    }

    logout() {
        this._token = null;
        this._user = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('grudge_user_id');
        localStorage.removeItem('grudge_id');
        localStorage.removeItem('grudge_username');
    }
}
