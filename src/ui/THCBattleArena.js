/**
 * THCBattleArena.js
 *
 * Clash Royale-style battle arena for Dope Budz.
 * - Split arena (player bottom, enemy top)
 * - 4-card hand drawn from 8-card deck
 * - Elixir bar regen (1 per 2.8s, 2x in overtime)
 * - Click card in hand → click arena to deploy
 * - Units auto-path toward nearest enemy tower
 * - Win by destroying enemy main tower
 * - 3min battle + 1min overtime
 */

const ARENA_W = 600;
const ARENA_H = 800;
const TOWER_SIZE = 40;
const UNIT_RADIUS = 12;
const ELIXIR_MAX = 10;
const ELIXIR_RATE = 1 / 2.8;        // per second (normal)
const ELIXIR_RATE_OT = 1 / 1.4;     // per second (overtime 2x)
const BATTLE_TIME = 180;             // 3 min
const OVERTIME = 60;                 // 1 min overtime
const TICK_MS = 1000 / 30;           // 30 fps

const RARITY_COLORS = {
    common: '#22c55e', uncommon: '#3b82f6', rare: '#a855f7', legendary: '#fbbf24',
};

export class THCBattleArena {
    constructor() {
        this.overlay = null;
        this.canvas = null;
        this.ctx = null;
        this.running = false;
        this.tickInterval = null;

        // Battle state
        this.elixir = 5;
        this.enemyElixir = 5;
        this.timeLeft = BATTLE_TIME;
        this.overtime = false;
        this.battleResult = null;

        // Units & Towers
        this.playerUnits = [];
        this.enemyUnits = [];
        this.playerTowers = [];
        this.enemyTowers = [];
        this.projectiles = [];

        // Card hand
        this.deck = [];
        this.hand = [];
        this.selectedHandIdx = null;

        // Callbacks
        this.onBattleEnd = null;

        this._injectStyles();
    }

    // ── Styles ───────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('thc-battle-styles')) return;
        const style = document.createElement('style');
        style.id = 'thc-battle-styles';
        style.textContent = `
            .ba-overlay {
                position: fixed; inset: 0; z-index: 5800;
                background: #050a05; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #fff;
            }
            .ba-overlay * { box-sizing: border-box; }

            .ba-hud {
                display: flex; justify-content: space-between; align-items: center;
                width: ${ARENA_W}px; padding: 8px 0;
            }
            .ba-timer {
                font-size: 20px; font-weight: 800; color: #fbbf24;
                text-shadow: 0 0 8px rgba(251,191,36,0.4);
            }
            .ba-timer.overtime { color: #ef4444; }
            .ba-score { font-size: 13px; color: #6b8f6b; }

            .ba-canvas {
                border: 2px solid rgba(34,197,94,0.25); border-radius: 4px;
                cursor: crosshair; display: block;
            }

            /* Elixir bar */
            .ba-elixir-wrap {
                width: ${ARENA_W}px; margin-top: 8px;
            }
            .ba-elixir-bar {
                height: 16px; background: rgba(0,0,0,0.5); border-radius: 8px;
                overflow: hidden; position: relative;
                border: 1px solid rgba(124,58,237,0.3);
            }
            .ba-elixir-fill {
                height: 100%; background: linear-gradient(90deg, #7c3aed, #a855f7);
                border-radius: 8px; transition: width 0.1s linear;
            }
            .ba-elixir-text {
                position: absolute; inset: 0; display: flex; align-items: center;
                justify-content: center; font-size: 11px; font-weight: 800; color: #fff;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }

            /* Card hand */
            .ba-hand {
                display: flex; gap: 8px; margin-top: 10px; width: ${ARENA_W}px; justify-content: center;
            }
            .ba-hand-card {
                width: 110px; height: 80px; border: 2px solid rgba(255,255,255,0.1);
                border-radius: 8px; background: rgba(20,30,20,0.8); cursor: pointer;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                transition: all 0.2s; position: relative;
            }
            .ba-hand-card:hover { border-color: rgba(34,197,94,0.5); transform: translateY(-4px); }
            .ba-hand-card.selected { border-color: #fbbf24; box-shadow: 0 0 16px rgba(251,191,36,0.4); transform: translateY(-6px); }
            .ba-hand-card.disabled { opacity: 0.3; pointer-events: none; }
            .ba-hand-card .hc-icon { font-size: 24px; }
            .ba-hand-card .hc-name { font-size: 9px; font-weight: 700; color: #a3d9a3; margin-top: 2px; }
            .ba-hand-card .hc-cost {
                position: absolute; top: 4px; left: 4px;
                background: #7c3aed; color: #fff; width: 18px; height: 18px;
                border-radius: 50%; font-size: 10px; font-weight: 800;
                display: flex; align-items: center; justify-content: center;
            }

            /* End screen */
            .ba-end-screen {
                position: absolute; inset: 0; z-index: 5900;
                background: rgba(0,0,0,0.85); display: flex;
                align-items: center; justify-content: center; backdrop-filter: blur(4px);
            }
            .ba-end-panel {
                text-align: center; background: linear-gradient(145deg, #0d1a0d, #142214);
                border: 2px solid rgba(34,197,94,0.3); border-radius: 16px; padding: 40px 60px;
            }
            .ba-end-panel h1 { font-size: 36px; margin-bottom: 8px; }
            .ba-end-panel p { color: #5a7a5a; margin-bottom: 24px; }
            .ba-end-btn {
                padding: 12px 40px; font-size: 15px; font-weight: 800;
                background: #22c55e; color: #000; border: none; border-radius: 8px;
                cursor: pointer; transition: all 0.2s;
            }
            .ba-end-btn:hover { background: #16a34a; }
        `;
        document.head.appendChild(style);
    }

    // ── Public API ───────────────────────────────────────────────────

    startBattle(mode, deck, playerData, onEnd) {
        this.onBattleEnd = onEnd;
        this.deck = this._shuffleArray([...(deck || [])]);
        this.hand = this.deck.splice(0, 4);
        this.mode = mode;

        // Reset state
        this.elixir = 5;
        this.enemyElixir = 5;
        this.timeLeft = BATTLE_TIME;
        this.overtime = false;
        this.battleResult = null;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.projectiles = [];
        this._lastTick = performance.now();

        // Towers: player (bottom), enemy (top)
        this.playerTowers = [
            { x: ARENA_W / 2, y: ARENA_H - 60, hp: 3000, maxHp: 3000, main: true, label: 'King' },
            { x: 140, y: ARENA_H - 120, hp: 1500, maxHp: 1500, main: false, label: 'Left' },
            { x: ARENA_W - 140, y: ARENA_H - 120, hp: 1500, maxHp: 1500, main: false, label: 'Right' },
        ];
        this.enemyTowers = [
            { x: ARENA_W / 2, y: 60, hp: 3000, maxHp: 3000, main: true, label: 'King' },
            { x: 140, y: 120, hp: 1500, maxHp: 1500, main: false, label: 'Left' },
            { x: ARENA_W - 140, y: 120, hp: 1500, maxHp: 1500, main: false, label: 'Right' },
        ];

        this._createOverlay();
        this._startLoop();
    }

    // ── Overlay ──────────────────────────────────────────────────────

    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'ba-overlay';

        // HUD
        const hud = document.createElement('div');
        hud.className = 'ba-hud';
        hud.innerHTML = `
            <div class="ba-score" id="ba-score-enemy">Enemy Towers: 3</div>
            <div class="ba-timer" id="ba-timer">${this._fmtTime(this.timeLeft)}</div>
            <div class="ba-score" id="ba-score-player">Your Towers: 3</div>
        `;
        this.overlay.appendChild(hud);

        // Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = ARENA_W;
        this.canvas.height = ARENA_H;
        this.canvas.className = 'ba-canvas';
        this.ctx = this.canvas.getContext('2d');
        this.overlay.appendChild(this.canvas);

        // Deploy click
        this.canvas.onclick = (e) => this._handleCanvasClick(e);

        // Elixir
        const elixirWrap = document.createElement('div');
        elixirWrap.className = 'ba-elixir-wrap';
        elixirWrap.innerHTML = `
            <div class="ba-elixir-bar">
                <div class="ba-elixir-fill" id="ba-elixir-fill" style="width:${(this.elixir / ELIXIR_MAX) * 100}%"></div>
                <div class="ba-elixir-text" id="ba-elixir-text">⚡ ${Math.floor(this.elixir)} / ${ELIXIR_MAX}</div>
            </div>
        `;
        this.overlay.appendChild(elixirWrap);

        // Hand
        this.handContainer = document.createElement('div');
        this.handContainer.className = 'ba-hand';
        this._renderHand();
        this.overlay.appendChild(this.handContainer);

        document.body.appendChild(this.overlay);
    }

    // ── Hand rendering ───────────────────────────────────────────────

    _renderHand() {
        this.handContainer.innerHTML = '';
        this.hand.forEach((card, i) => {
            const el = document.createElement('div');
            const canAfford = this.elixir >= card.elixirCost;
            el.className = `ba-hand-card ${i === this.selectedHandIdx ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`;
            el.style.borderColor = RARITY_COLORS[card.rarity] || '#22c55e';
            el.innerHTML = `
                <span class="hc-cost">${card.elixirCost}</span>
                <span class="hc-icon">${card.icon}</span>
                <span class="hc-name">${card.name}</span>
            `;
            el.onclick = () => {
                if (!canAfford) return;
                this.selectedHandIdx = this.selectedHandIdx === i ? null : i;
                this._renderHand();
            };
            this.handContainer.appendChild(el);
        });
    }

    // ── Canvas deploy ────────────────────────────────────────────────

    _handleCanvasClick(e) {
        if (this.selectedHandIdx === null) return;
        const card = this.hand[this.selectedHandIdx];
        if (!card || this.elixir < card.elixirCost) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Only allow deploy in bottom half (player side)
        if (y < ARENA_H / 2) return;

        this.elixir -= card.elixirCost;
        this._spawnUnit(card, x, y, 'player');

        // Draw next card from deck
        this.hand.splice(this.selectedHandIdx, 1);
        if (this.deck.length > 0) {
            this.hand.push(this.deck.shift());
        } else {
            // Recycle used cards
            this.deck = this._shuffleArray([...(this.hand)]);
        }
        if (this.hand.length < 4 && this.deck.length > 0) {
            this.hand.push(this.deck.shift());
        }

        this.selectedHandIdx = null;
        this._renderHand();
    }

    // ── Game Loop ────────────────────────────────────────────────────

    _startLoop() {
        this.running = true;
        this._lastTick = performance.now();

        this.tickInterval = setInterval(() => {
            const now = performance.now();
            const dt = (now - this._lastTick) / 1000;
            this._lastTick = now;
            this._update(dt);
            this._draw();
        }, TICK_MS);
    }

    _stopLoop() {
        this.running = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    // ── Update ───────────────────────────────────────────────────────

    _update(dt) {
        if (this.battleResult) return;

        // Timer
        this.timeLeft -= dt;
        if (this.timeLeft <= 0 && !this.overtime) {
            this.overtime = true;
            this.timeLeft = OVERTIME;
        } else if (this.timeLeft <= 0 && this.overtime) {
            this._endBattle();
            return;
        }

        // Elixir regen
        const rate = this.overtime ? ELIXIR_RATE_OT : ELIXIR_RATE;
        this.elixir = Math.min(ELIXIR_MAX, this.elixir + rate * dt);
        this.enemyElixir = Math.min(ELIXIR_MAX, this.enemyElixir + rate * dt);

        // AI deploy (simple)
        this._aiTick(dt);

        // Move units
        this._moveUnits(this.playerUnits, this.enemyTowers, this.enemyUnits, dt);
        this._moveUnits(this.enemyUnits, this.playerTowers, this.playerUnits, dt);

        // Tower attacks
        this._towerAttacks(this.playerTowers, this.enemyUnits, dt);
        this._towerAttacks(this.enemyTowers, this.playerUnits, dt);

        // Clean dead
        this.playerUnits = this.playerUnits.filter(u => u.hp > 0);
        this.enemyUnits = this.enemyUnits.filter(u => u.hp > 0);
        this.playerTowers = this.playerTowers.filter(t => t.hp > 0);
        this.enemyTowers = this.enemyTowers.filter(t => t.hp > 0);

        // Check win condition
        if (!this.enemyTowers.find(t => t.main)) {
            this.battleResult = { won: true, trophyChange: 30 };
            this._showEndScreen();
        } else if (!this.playerTowers.find(t => t.main)) {
            this.battleResult = { won: false, trophyChange: 15 };
            this._showEndScreen();
        }

        // Update HUD
        this._updateHUD();
    }

    _aiTick() {
        // Simple AI: deploy a random card occasionally
        if (this.enemyElixir >= 4 && Math.random() < 0.02) {
            const cost = Math.floor(Math.random() * 3) + 3;
            if (this.enemyElixir >= cost) {
                this.enemyElixir -= cost;
                const x = 100 + Math.random() * (ARENA_W - 200);
                const y = 80 + Math.random() * 200;
                this.enemyUnits.push({
                    x, y,
                    hp: 200 + Math.random() * 400,
                    maxHp: 600,
                    dps: 30 + Math.random() * 50,
                    speed: 40 + Math.random() * 30,
                    icon: ['👹', '🦇', '💀', '🐍'][Math.floor(Math.random() * 4)],
                    name: 'Enemy',
                    attackCooldown: 0,
                    attackRange: 30,
                });
            }
        }
    }

    _moveUnits(units, targetTowers, targetUnits, dt) {
        units.forEach(u => {
            // Find closest target (tower or enemy unit)
            let target = null;
            let minDist = Infinity;

            targetTowers.forEach(t => {
                const d = Math.hypot(t.x - u.x, t.y - u.y);
                if (d < minDist) { minDist = d; target = t; }
            });
            targetUnits.forEach(t => {
                const d = Math.hypot(t.x - u.x, t.y - u.y);
                if (d < minDist) { minDist = d; target = t; }
            });

            if (!target) return;

            if (minDist > (u.attackRange || 30)) {
                // Move toward target
                const dx = target.x - u.x;
                const dy = target.y - u.y;
                const len = Math.hypot(dx, dy);
                u.x += (dx / len) * (u.speed || 50) * dt;
                u.y += (dy / len) * (u.speed || 50) * dt;
            } else {
                // Attack
                u.attackCooldown = (u.attackCooldown || 0) - dt;
                if (u.attackCooldown <= 0) {
                    target.hp -= (u.dps || 30) * 0.5;
                    u.attackCooldown = 0.5;
                }
            }
        });
    }

    _towerAttacks(towers, enemies, dt) {
        towers.forEach(t => {
            t._cd = (t._cd || 0) - dt;
            if (t._cd > 0 || enemies.length === 0) return;

            // Find closest enemy in range
            let closest = null;
            let minD = 200; // tower range
            enemies.forEach(e => {
                const d = Math.hypot(e.x - t.x, e.y - t.y);
                if (d < minD) { minD = d; closest = e; }
            });

            if (closest) {
                closest.hp -= 40;
                t._cd = 1.0;
            }
        });
    }

    // ── Spawn ────────────────────────────────────────────────────────

    _spawnUnit(card, x, y, side) {
        const unit = {
            x, y,
            hp: card.hp,
            maxHp: card.hp,
            dps: card.dps,
            speed: 50 + Math.random() * 20,
            icon: card.icon,
            name: card.name,
            rarity: card.rarity,
            attackCooldown: 0,
            attackRange: 30,
            side,
        };

        if (side === 'player') this.playerUnits.push(unit);
        else this.enemyUnits.push(unit);
    }

    // ── Draw ─────────────────────────────────────────────────────────

    _draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, ARENA_W, ARENA_H);

        // Arena background
        ctx.fillStyle = '#0a140a';
        ctx.fillRect(0, 0, ARENA_W, ARENA_H);

        // Midline
        ctx.strokeStyle = 'rgba(34,197,94,0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, ARENA_H / 2);
        ctx.lineTo(ARENA_W, ARENA_H / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Bridge areas
        ctx.fillStyle = 'rgba(34,197,94,0.06)';
        ctx.fillRect(120, ARENA_H / 2 - 15, 80, 30);
        ctx.fillRect(ARENA_W - 200, ARENA_H / 2 - 15, 80, 30);

        // Grid lines
        ctx.strokeStyle = 'rgba(34,197,94,0.04)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < ARENA_W; gx += 50) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ARENA_H); ctx.stroke();
        }
        for (let gy = 0; gy < ARENA_H; gy += 50) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(ARENA_W, gy); ctx.stroke();
        }

        // Towers
        this._drawTowers(ctx, this.playerTowers, '#22c55e');
        this._drawTowers(ctx, this.enemyTowers, '#ef4444');

        // Units
        this._drawUnits(ctx, this.playerUnits, '#22c55e');
        this._drawUnits(ctx, this.enemyUnits, '#ef4444');

        // Deploy zone highlight
        if (this.selectedHandIdx !== null) {
            ctx.fillStyle = 'rgba(34,197,94,0.05)';
            ctx.fillRect(0, ARENA_H / 2, ARENA_W, ARENA_H / 2);
            ctx.strokeStyle = 'rgba(34,197,94,0.15)';
            ctx.strokeRect(0, ARENA_H / 2, ARENA_W, ARENA_H / 2);
        }
    }

    _drawTowers(ctx, towers, color) {
        towers.forEach(t => {
            // Base
            ctx.fillStyle = t.main ? color : `${color}88`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.main ? TOWER_SIZE : TOWER_SIZE * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // HP bar
            const barW = t.main ? 50 : 36;
            const hpPct = Math.max(0, t.hp / t.maxHp);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(t.x - barW / 2, t.y - (t.main ? TOWER_SIZE + 12 : TOWER_SIZE * 0.7 + 10), barW, 5);
            ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#fbbf24' : '#ef4444';
            ctx.fillRect(t.x - barW / 2, t.y - (t.main ? TOWER_SIZE + 12 : TOWER_SIZE * 0.7 + 10), barW * hpPct, 5);

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = t.main ? 'bold 14px sans-serif' : '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(t.main ? '👑' : '🏰', t.x, t.y + 5);
        });
    }

    _drawUnits(ctx, units, borderColor) {
        units.forEach(u => {
            // Circle
            ctx.fillStyle = 'rgba(20,30,20,0.8)';
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(u.x, u.y, UNIT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Icon
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(u.icon, u.x, u.y);

            // Mini HP bar
            const barW = 20;
            const hpPct = Math.max(0, u.hp / u.maxHp);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(u.x - barW / 2, u.y - UNIT_RADIUS - 6, barW, 3);
            ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : '#ef4444';
            ctx.fillRect(u.x - barW / 2, u.y - UNIT_RADIUS - 6, barW * hpPct, 3);
        });
    }

    // ── HUD ──────────────────────────────────────────────────────────

    _updateHUD() {
        const timerEl = this.overlay.querySelector('#ba-timer');
        if (timerEl) {
            timerEl.textContent = this._fmtTime(this.timeLeft);
            timerEl.className = `ba-timer ${this.overtime ? 'overtime' : ''}`;
        }

        const elixirFill = this.overlay.querySelector('#ba-elixir-fill');
        if (elixirFill) elixirFill.style.width = `${(this.elixir / ELIXIR_MAX) * 100}%`;

        const elixirText = this.overlay.querySelector('#ba-elixir-text');
        if (elixirText) elixirText.textContent = `⚡ ${Math.floor(this.elixir)} / ${ELIXIR_MAX}`;

        const scoreP = this.overlay.querySelector('#ba-score-player');
        if (scoreP) scoreP.textContent = `Your Towers: ${this.playerTowers.length}`;

        const scoreE = this.overlay.querySelector('#ba-score-enemy');
        if (scoreE) scoreE.textContent = `Enemy Towers: ${this.enemyTowers.length}`;

        // Refresh hand affordability
        this._renderHand();
    }

    // ── End ──────────────────────────────────────────────────────────

    _endBattle() {
        // Determine winner by tower count, then HP
        const pTowers = this.playerTowers.length;
        const eTowers = this.enemyTowers.length;
        let won;
        if (pTowers !== eTowers) {
            won = pTowers > eTowers;
        } else {
            const pHp = this.playerTowers.reduce((s, t) => s + t.hp, 0);
            const eHp = this.enemyTowers.reduce((s, t) => s + t.hp, 0);
            won = pHp >= eHp;
        }
        this.battleResult = { won, trophyChange: won ? 30 : 15 };
        this._showEndScreen();
    }

    _showEndScreen() {
        this._stopLoop();

        const endScreen = document.createElement('div');
        endScreen.className = 'ba-end-screen';
        const won = this.battleResult.won;
        endScreen.innerHTML = `
            <div class="ba-end-panel">
                <h1 style="color:${won ? '#22c55e' : '#ef4444'};">${won ? '🏆 VICTORY!' : '💀 DEFEAT'}</h1>
                <p>${won ? `+${this.battleResult.trophyChange} Trophies` : `-${this.battleResult.trophyChange} Trophies`}</p>
                <button class="ba-end-btn" id="ba-end-close">Return to Hub</button>
            </div>
        `;
        this.overlay.appendChild(endScreen);

        endScreen.querySelector('#ba-end-close').onclick = () => {
            this.overlay.remove();
            this.overlay = null;
            if (this.onBattleEnd) this.onBattleEnd(this.battleResult);
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────

    _fmtTime(seconds) {
        const s = Math.max(0, Math.ceil(seconds));
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }

    _shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

export default THCBattleArena;
