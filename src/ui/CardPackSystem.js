/**
 * CardPackSystem.js
 *
 * Pack opening UI for Dope Budz.
 * First-time entry: 3 Basic Budz Packs (10 cards each).
 * Rarity: Common (green), Uncommon (blue), Rare (purple), Legendary (gold).
 * Animated card reveal with glow effects.
 */

// ── Card Pool ────────────────────────────────────────────────────────

const CARD_POOL = [
    // Common (green) — 60% drop
    { name: 'Seedling Scout',    icon: '🌱', rarity: 'common',    hp: 200,  dps: 40,  elixirCost: 2, ability: 'Fast deploy' },
    { name: 'Bud Brawler',      icon: '🥊', rarity: 'common',    hp: 350,  dps: 55,  elixirCost: 3, ability: 'Melee rush' },
    { name: 'Leaf Lobber',      icon: '🍃', rarity: 'common',    hp: 180,  dps: 65,  elixirCost: 3, ability: 'Ranged splash' },
    { name: 'Root Wall',        icon: '🪵', rarity: 'common',    hp: 800,  dps: 0,   elixirCost: 2, ability: 'Block path' },
    { name: 'Sprout Swarm',     icon: '🌿', rarity: 'common',    hp: 100,  dps: 30,  elixirCost: 2, ability: 'Deploy x3' },
    { name: 'Pollen Puffer',    icon: '💨', rarity: 'common',    hp: 250,  dps: 35,  elixirCost: 2, ability: 'Slow aura' },
    { name: 'Thorn Thrower',    icon: '🌵', rarity: 'common',    hp: 220,  dps: 70,  elixirCost: 3, ability: 'Piercing shot' },
    { name: 'Stalk Soldier',    icon: '🎋', rarity: 'common',    hp: 300,  dps: 45,  elixirCost: 2, ability: 'Shield 1s' },

    // Uncommon (blue) — 25% drop
    { name: 'Kush Knight',      icon: '🛡️', rarity: 'uncommon',  hp: 600,  dps: 60,  elixirCost: 4, ability: 'Shield allies' },
    { name: 'Haze Hunter',      icon: '🏹', rarity: 'uncommon',  hp: 320,  dps: 95,  elixirCost: 4, ability: 'Long range' },
    { name: 'Dank Druid',       icon: '🧙', rarity: 'uncommon',  hp: 400,  dps: 50,  elixirCost: 4, ability: 'Heal allies' },
    { name: 'Chronic Cannon',   icon: '💥', rarity: 'uncommon',  hp: 280,  dps: 110, elixirCost: 5, ability: 'AoE blast' },
    { name: 'Indica Infantry',  icon: '⚔️', rarity: 'uncommon',  hp: 450,  dps: 75,  elixirCost: 4, ability: 'Charge attack' },
    { name: 'Sativa Sniper',    icon: '🎯', rarity: 'uncommon',  hp: 250,  dps: 120, elixirCost: 5, ability: 'Crit shot' },

    // Rare (purple) — 12% drop
    { name: 'OG Overlord',      icon: '👑', rarity: 'rare',      hp: 900,  dps: 100, elixirCost: 6, ability: 'War cry (+DMG)' },
    { name: 'Purple Haze Mage', icon: '🔮', rarity: 'rare',      hp: 500,  dps: 140, elixirCost: 6, ability: 'Chain lightning' },
    { name: 'Blunt Berserker',  icon: '🪓', rarity: 'rare',      hp: 700,  dps: 130, elixirCost: 5, ability: 'Rage mode' },
    { name: 'Hydro Healer',     icon: '💧', rarity: 'rare',      hp: 550,  dps: 40,  elixirCost: 5, ability: 'Mass heal' },

    // Legendary (gold) — 3% drop
    { name: 'The Grand Grower', icon: '🌟', rarity: 'legendary', hp: 1200, dps: 160, elixirCost: 7, ability: 'Summon seedlings' },
    { name: 'THC Titan',        icon: '🗿', rarity: 'legendary', hp: 2000, dps: 90,  elixirCost: 8, ability: 'Tower smash' },
    { name: 'Dank Dragon',      icon: '🐉', rarity: 'legendary', hp: 1500, dps: 180, elixirCost: 8, ability: 'Fire breath AoE' },
];

const RARITY_CONFIG = {
    common:    { color: '#22c55e', glow: 'rgba(34,197,94,0.6)',   label: 'Common',    weight: 60 },
    uncommon:  { color: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  label: 'Uncommon',  weight: 25 },
    rare:      { color: '#a855f7', glow: 'rgba(168,85,247,0.6)',  label: 'Rare',      weight: 12 },
    legendary: { color: '#fbbf24', glow: 'rgba(251,191,36,0.7)',  label: 'Legendary', weight: 3 },
};

export class CardPackSystem {
    constructor() {
        this.overlay = null;
        this.onComplete = null;
        this.revealedCards = [];
        this.currentPack = 0;
        this.totalPacks = 3;
        this.cardsPerPack = 10;
        this.allNewCards = [];

        this._injectStyles();
    }

    // ── Styles ───────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('card-pack-styles')) return;
        const style = document.createElement('style');
        style.id = 'card-pack-styles';
        style.textContent = `
            .cp-overlay {
                position: fixed; inset: 0; z-index: 5500;
                background: rgba(0,0,0,0.92); backdrop-filter: blur(6px);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #fff;
            }
            .cp-overlay * { box-sizing: border-box; }

            /* Pack display */
            .cp-pack-display { text-align: center; }
            .cp-pack-icon {
                font-size: 120px; cursor: pointer; transition: transform 0.3s;
                filter: drop-shadow(0 0 20px rgba(34,197,94,0.5));
                animation: cp-float 2s ease-in-out infinite;
            }
            .cp-pack-icon:hover { transform: scale(1.1); }
            @keyframes cp-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .cp-pack-title { font-size: 28px; color: #22c55e; margin: 16px 0 4px; font-weight: 800; letter-spacing: 2px; }
            .cp-pack-sub { font-size: 14px; color: #5a7a5a; margin-bottom: 24px; }
            .cp-pack-counter { font-size: 12px; color: #3a5a3a; margin-top: 12px; }

            .cp-open-btn {
                padding: 14px 40px; font-size: 16px; font-weight: 800;
                background: linear-gradient(135deg, #22c55e, #16a34a); color: #000;
                border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s;
                text-transform: uppercase; letter-spacing: 2px;
            }
            .cp-open-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(34,197,94,0.4); }

            /* Card reveal grid */
            .cp-reveal-grid {
                display: grid; grid-template-columns: repeat(5, 120px); gap: 12px;
                margin: 20px 0;
            }
            .cp-card-reveal {
                width: 120px; height: 170px; perspective: 600px; cursor: pointer;
            }
            .cp-card-inner {
                position: relative; width: 100%; height: 100%;
                transition: transform 0.6s; transform-style: preserve-3d;
            }
            .cp-card-reveal.flipped .cp-card-inner { transform: rotateY(180deg); }

            .cp-card-front, .cp-card-back {
                position: absolute; inset: 0; border-radius: 10px;
                backface-visibility: hidden; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
            }
            .cp-card-front {
                background: linear-gradient(145deg, #1a2e1a, #0d1a0d);
                border: 2px solid rgba(34,197,94,0.3);
            }
            .cp-card-front .front-icon { font-size: 48px; opacity: 0.4; }
            .cp-card-front .front-label { font-size: 10px; color: #3a5a3a; margin-top: 8px; text-transform: uppercase; letter-spacing: 2px; }

            .cp-card-back {
                transform: rotateY(180deg); padding: 10px;
                background: linear-gradient(145deg, #142214, #0d1a0d);
            }
            .cp-card-back .card-icon { font-size: 32px; margin-bottom: 6px; }
            .cp-card-back .card-name { font-size: 10px; font-weight: 700; text-align: center; margin-bottom: 4px; }
            .cp-card-back .card-rarity {
                font-size: 9px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 1px; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px;
            }
            .cp-card-back .card-stats { font-size: 9px; color: #6b8f6b; text-align: center; }
            .cp-card-back .card-elixir {
                position: absolute; top: 6px; left: 6px;
                background: #7c3aed; color: #fff; width: 20px; height: 20px;
                border-radius: 50%; font-size: 10px; font-weight: 800;
                display: flex; align-items: center; justify-content: center;
            }

            /* Summary */
            .cp-summary { text-align: center; max-width: 700px; }
            .cp-summary h2 { color: #22c55e; margin-bottom: 12px; font-size: 24px; }
            .cp-summary-grid {
                display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 16px 0;
            }
            .cp-summary-chip {
                padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
                background: rgba(0,0,0,0.4);
            }
            .cp-done-btn {
                padding: 14px 48px; font-size: 15px; font-weight: 800;
                background: #22c55e; color: #000; border: none; border-radius: 10px;
                cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: all 0.2s;
            }
            .cp-done-btn:hover { background: #16a34a; transform: translateY(-2px); }

            /* Next pack button */
            .cp-next-btn {
                margin-top: 16px; padding: 12px 36px; font-size: 14px; font-weight: 700;
                background: rgba(34,197,94,0.2); border: 2px solid #22c55e; color: #22c55e;
                border-radius: 8px; cursor: pointer; transition: all 0.2s;
            }
            .cp-next-btn:hover { background: #22c55e; color: #000; }
        `;
        document.head.appendChild(style);
    }

    // ── Public API ───────────────────────────────────────────────────

    show(playerData, onComplete) {
        this.onComplete = onComplete;
        this.allNewCards = [];
        this.currentPack = 0;
        this.totalPacks = 3;

        this.overlay = document.createElement('div');
        this.overlay.className = 'cp-overlay';
        document.body.appendChild(this.overlay);

        this._renderPackScreen();
    }

    // ── Pack screen ──────────────────────────────────────────────────

    _renderPackScreen() {
        this.overlay.innerHTML = `
            <div class="cp-pack-display">
                <div class="cp-pack-icon">📦</div>
                <div class="cp-pack-title">Basic Budz Pack</div>
                <div class="cp-pack-sub">${this.cardsPerPack} Cards Inside</div>
                <button class="cp-open-btn" id="cp-open-btn">Open Pack</button>
                <div class="cp-pack-counter">Pack ${this.currentPack + 1} of ${this.totalPacks}</div>
            </div>
        `;

        this.overlay.querySelector('#cp-open-btn').onclick = () => this._openPack();
    }

    // ── Open a pack ──────────────────────────────────────────────────

    _openPack() {
        const cards = this._generateCards(this.cardsPerPack);
        this.revealedCards = cards;
        this.allNewCards.push(...cards);
        this._renderRevealScreen(cards);
    }

    _generateCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            const rarity = this._rollRarity();
            const pool = CARD_POOL.filter(c => c.rarity === rarity);
            const template = pool[Math.floor(Math.random() * pool.length)];
            cards.push({
                ...template,
                id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                level: 1,
            });
        }
        return cards;
    }

    _rollRarity() {
        const roll = Math.random() * 100;
        let cumulative = 0;
        for (const [rarity, cfg] of Object.entries(RARITY_CONFIG)) {
            cumulative += cfg.weight;
            if (roll < cumulative) return rarity;
        }
        return 'common';
    }

    // ── Reveal screen ────────────────────────────────────────────────

    _renderRevealScreen(cards) {
        this.overlay.innerHTML = '';

        const title = document.createElement('div');
        title.style.cssText = 'text-align:center;margin-bottom:12px;';
        title.innerHTML = `<h2 style="color:#22c55e;margin:0;">Pack ${this.currentPack + 1} of ${this.totalPacks}</h2>
            <p style="color:#5a7a5a;font-size:13px;">Click cards to reveal!</p>`;
        this.overlay.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'cp-reveal-grid';

        let flippedCount = 0;

        cards.forEach((card, i) => {
            const rc = RARITY_CONFIG[card.rarity];

            const wrapper = document.createElement('div');
            wrapper.className = 'cp-card-reveal';

            wrapper.innerHTML = `
                <div class="cp-card-inner">
                    <div class="cp-card-front">
                        <div class="front-icon">🌿</div>
                        <div class="front-label">Tap to reveal</div>
                    </div>
                    <div class="cp-card-back" style="border:2px solid ${rc.color};box-shadow:0 0 16px ${rc.glow};">
                        <div class="card-elixir">${card.elixirCost}</div>
                        <div class="card-icon">${card.icon}</div>
                        <div class="card-name">${card.name}</div>
                        <div class="card-rarity" style="background:${rc.color}22;color:${rc.color};">${rc.label}</div>
                        <div class="card-stats">HP ${card.hp} • DPS ${card.dps}</div>
                    </div>
                </div>
            `;

            wrapper.onclick = () => {
                if (wrapper.classList.contains('flipped')) return;
                wrapper.classList.add('flipped');
                flippedCount++;

                // Auto-show next/done button when all flipped
                if (flippedCount === cards.length) {
                    setTimeout(() => this._showPostReveal(), 400);
                }
            };

            // Stagger auto-animation hint
            setTimeout(() => {
                wrapper.style.opacity = '1';
            }, i * 60);

            grid.appendChild(wrapper);
        });

        this.overlay.appendChild(grid);

        // Reveal-all shortcut
        const revealAllBtn = document.createElement('button');
        revealAllBtn.className = 'cp-next-btn';
        revealAllBtn.style.marginTop = '12px';
        revealAllBtn.textContent = 'Reveal All';
        revealAllBtn.onclick = () => {
            grid.querySelectorAll('.cp-card-reveal:not(.flipped)').forEach((el, i) => {
                setTimeout(() => el.classList.add('flipped'), i * 80);
            });
            flippedCount = cards.length;
            setTimeout(() => this._showPostReveal(), cards.length * 80 + 400);
            revealAllBtn.remove();
        };
        this.overlay.appendChild(revealAllBtn);
    }

    _showPostReveal() {
        // Remove existing post-reveal buttons
        const existing = this.overlay.querySelector('#cp-post-reveal');
        if (existing) existing.remove();

        const wrap = document.createElement('div');
        wrap.id = 'cp-post-reveal';
        wrap.style.cssText = 'text-align:center;margin-top:12px;';

        if (this.currentPack < this.totalPacks - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'cp-next-btn';
            nextBtn.textContent = `Open Next Pack (${this.totalPacks - this.currentPack - 1} remaining)`;
            nextBtn.onclick = () => {
                this.currentPack++;
                this._renderPackScreen();
            };
            wrap.appendChild(nextBtn);
        } else {
            // All packs opened — show summary
            const doneBtn = document.createElement('button');
            doneBtn.className = 'cp-done-btn';
            doneBtn.textContent = 'View Collection';
            doneBtn.onclick = () => this._showSummary();
            wrap.appendChild(doneBtn);
        }

        this.overlay.appendChild(wrap);
    }

    // ── Summary ──────────────────────────────────────────────────────

    _showSummary() {
        this.overlay.innerHTML = '';

        const summary = document.createElement('div');
        summary.className = 'cp-summary';

        const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
        this.allNewCards.forEach(c => counts[c.rarity]++);

        summary.innerHTML = `
            <h2>🎉 All Packs Opened!</h2>
            <p style="color:#5a7a5a;margin-bottom:16px;">${this.allNewCards.length} cards added to your collection</p>
            <div class="cp-summary-grid">
                ${Object.entries(counts).filter(([, v]) => v > 0).map(([rarity, count]) => {
                    const rc = RARITY_CONFIG[rarity];
                    return `<div class="cp-summary-chip" style="border:1px solid ${rc.color};color:${rc.color};">${rc.label}: ${count}</div>`;
                }).join('')}
            </div>
            <button class="cp-done-btn" id="cp-finish-btn">Done</button>
        `;

        this.overlay.appendChild(summary);

        summary.querySelector('#cp-finish-btn').onclick = () => {
            this.overlay.remove();
            this.overlay = null;
            if (this.onComplete) this.onComplete(this.allNewCards);
        };
    }
}

export default CardPackSystem;
