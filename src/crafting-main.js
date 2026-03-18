/**
 * crafting-main.js — Lightweight entry point for grudge-crafting.puter.site
 *
 * Loads only the account-bound UI systems (no 3D scene):
 *   - Crafting Interface
 *   - Inventory System
 *   - Island Manager
 *   - Profession data
 *   - Account Sync
 */

import { APIClient } from './api/APIClient.js';
import { AccountSync } from './systems/AccountSync.js';
import { IslandSystem } from './systems/IslandSystem.js';
import { CraftingInterface } from './ui/CraftingInterface.js';
import { InventorySystem } from './ui/InventorySystem.js';
import { IslandManager } from './ui/IslandManager.js';
import { gameState } from './systems/GameStateManager.js';

class CraftingPortal {
    constructor() {
        this.api = new APIClient();
        this.sync = null;
        this.islandSystem = null;
        this.islandManager = null;
        this.craftingInterface = null;
        this.inventorySystem = null;

        this.init();
    }

    async init() {
        this._showStatus('Connecting to Grudge backend...');

        // 1. Connect & auto-login
        const connectResult = await this.api.connect();
        const isOnline = connectResult.status !== 'offline';

        if (!this.api.isAuthenticated) {
            this._showLoginScreen();
            return;
        }

        await this._bootstrap(isOnline);
    }

    async _bootstrap(isOnline) {
        this._showStatus('Loading account data...');

        // 2. Account Sync — hydrate from backend
        this.sync = new AccountSync(this.api);
        await this.sync.hydrate();

        // 3. Island System
        this.islandSystem = new IslandSystem(this.api);
        this.islandSystem.ensureIsland();
        this.islandSystem.startTicking();

        // 4. UI systems
        this._showStatus('Initializing interfaces...');

        this.craftingInterface = new CraftingInterface();
        this.inventorySystem = new InventorySystem();
        this.islandManager = new IslandManager(this.islandSystem);

        // Make globally accessible for onclick handlers
        window.craftingInterface = this.craftingInterface;
        window.inventorySystem = this.inventorySystem;
        window.islandManager = this.islandManager;
        window.gameState = gameState;

        // 5. Build nav bar
        this._buildNavBar();

        // 6. Hide status, show island by default
        this._hideStatus();
        this.islandManager.show();

        console.log('✅ Crafting Portal ready' + (isOnline ? '' : ' (offline mode)'));
    }

    // ─── Login Screen ────────────────────────────────────────

    _showLoginScreen() {
        const root = document.getElementById('app') || document.body;
        root.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;
                        background:linear-gradient(135deg,#0a1628,#122a1e,#0a2a3a);color:white;
                        font-family:'Segoe UI',sans-serif;">
                <div style="background:rgba(0,0,0,0.4);border:1px solid #00ff88;border-radius:15px;
                            padding:40px;width:360px;text-align:center;">
                    <h1 style="color:#00ff88;margin:0 0 8px 0;">🏝️ Grudge Crafting</h1>
                    <p style="color:#888;margin:0 0 25px 0;font-size:13px;">Inventory · Crafting · Island</p>
                    <input id="login-user" type="text" placeholder="Username"
                        style="width:100%;padding:10px;margin-bottom:10px;background:rgba(0,0,0,0.3);
                               border:1px solid #00d4ff;border-radius:6px;color:white;font-size:14px;box-sizing:border-box;">
                    <input id="login-pass" type="password" placeholder="Password"
                        style="width:100%;padding:10px;margin-bottom:15px;background:rgba(0,0,0,0.3);
                               border:1px solid #00d4ff;border-radius:6px;color:white;font-size:14px;box-sizing:border-box;">
                    <button id="login-btn"
                        style="width:100%;padding:12px;background:linear-gradient(135deg,#00ff88,#00d4ff);
                               border:none;border-radius:8px;color:#0a1628;font-weight:bold;font-size:15px;
                               cursor:pointer;margin-bottom:10px;">Login</button>
                    <button id="guest-btn"
                        style="width:100%;padding:10px;background:rgba(255,255,255,0.05);
                               border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#aaa;
                               font-size:13px;cursor:pointer;">Continue as Guest</button>
                    <p id="login-error" style="color:#ff4444;font-size:12px;margin-top:10px;display:none;"></p>
                </div>
            </div>
        `;

        document.getElementById('login-btn').addEventListener('click', async () => {
            const user = document.getElementById('login-user').value.trim();
            const pass = document.getElementById('login-pass').value;
            if (!user || !pass) return;

            const res = await this.api.login(user, pass);
            if (res.token || res.offline) {
                await this._bootstrap(!!res.token);
            } else {
                const err = document.getElementById('login-error');
                err.textContent = res.error || 'Login failed';
                err.style.display = 'block';
            }
        });

        document.getElementById('guest-btn').addEventListener('click', async () => {
            const res = await this.api.guestLogin();
            if (res.token || res.offline) {
                await this._bootstrap(!!res.token);
            }
        });
    }

    // ─── Nav Bar ──────────────────────────────────────────────

    _buildNavBar() {
        const existing = document.getElementById('crafting-nav');
        if (existing) existing.remove();

        const nav = document.createElement('div');
        nav.id = 'crafting-nav';
        nav.style.cssText = `
            position:fixed;top:0;left:0;right:0;height:48px;z-index:2000;
            background:rgba(10,22,40,0.95);border-bottom:1px solid #00ff88;
            display:flex;align-items:center;padding:0 20px;gap:12px;
            font-family:'Segoe UI',sans-serif;
        `;

        const buttons = [
            { label: '🏝️ Island', action: () => this.islandManager.toggle() },
            { label: '⚒️ Crafting', action: () => this.craftingInterface.toggle() },
            { label: '🎒 Inventory', action: () => this.inventorySystem.toggle() },
        ];

        const title = document.createElement('span');
        title.style.cssText = 'color:#00ff88;font-weight:bold;font-size:16px;margin-right:auto;';
        title.textContent = 'Grudge Crafting Portal';
        nav.appendChild(title);

        for (const btn of buttons) {
            const el = document.createElement('button');
            el.textContent = btn.label;
            el.style.cssText = `
                padding:6px 16px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);
                border-radius:6px;color:#00ff88;font-size:13px;cursor:pointer;transition:all 0.2s;
            `;
            el.addEventListener('mouseenter', () => { el.style.background = 'rgba(0,255,136,0.25)'; });
            el.addEventListener('mouseleave', () => { el.style.background = 'rgba(0,255,136,0.1)'; });
            el.addEventListener('click', btn.action);
            nav.appendChild(el);
        }

        // User info
        const user = this.api.user;
        if (user) {
            const info = document.createElement('span');
            info.style.cssText = 'color:#888;font-size:12px;margin-left:12px;';
            info.textContent = `👤 ${user.displayName || user.username || 'Guest'}`;
            nav.appendChild(info);
        }

        document.body.appendChild(nav);

        // Push windows down below nav
        document.body.style.paddingTop = '48px';
    }

    // ─── Status ───────────────────────────────────────────────

    _showStatus(msg) {
        let el = document.getElementById('crafting-status');
        if (!el) {
            el = document.createElement('div');
            el.id = 'crafting-status';
            el.style.cssText = `
                position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;
                display:flex;align-items:center;justify-content:center;
                background:linear-gradient(135deg,#0a1628,#122a1e,#0a2a3a);
                color:#00ff88;font-family:'Segoe UI',sans-serif;font-size:18px;
            `;
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.display = 'flex';
    }

    _hideStatus() {
        const el = document.getElementById('crafting-status');
        if (el) el.style.display = 'none';
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    new CraftingPortal();
});
