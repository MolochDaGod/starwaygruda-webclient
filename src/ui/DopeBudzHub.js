/**
 * DopeBudzHub.js
 *
 * Main hub UI for the Dope Budz game mode.
 * Dark green/black cannabis theme matching the Growerz Collection.
 * Tabs: MY NFTs, Card Inventory, Deck Builder, THC Battle, Territory & Leaderboards
 */

export class DopeBudzHub {
    constructor() {
        this.isVisible = false;
        this.container = null;
        this.activeTab = 'nfts';

        // Player data
        this.playerData = this._loadPlayerData();
        this.growerNFTs = this._loadGrowerNFTs();

        // Sub-system references (set externally)
        this.cardPackSystem = null;
        this.deckBuilder = null;
        this.battleArena = null;
        this.leaderboard = null;

        this._injectStyles();
        this.createUI();
    }

    // ── Persistence ──────────────────────────────────────────────────

    _loadPlayerData() {
        try {
            const saved = localStorage.getItem('dopebudz_player');
            if (saved) return JSON.parse(saved);
        } catch (_) { /* ignore */ }
        return {
            firstEntry: true,
            cards: [],
            decks: [],
            trophies: 0,
            wins: 0,
            losses: 0,
            level: 1,
            xp: 0,
            territories: [],
        };
    }

    _savePlayerData() {
        try {
            localStorage.setItem('dopebudz_player', JSON.stringify(this.playerData));
        } catch (_) { /* ignore */ }
    }

    _loadGrowerNFTs() {
        // Simulated NFT collection — replace with real wallet fetch
        return [
            { id: 'grower-931',  edition: 931,  name: 'THC LABZ Grower #931',  rarity: 87.2, traits: 7, image: null, level: 3,  wins: 12, losses: 4 },
            { id: 'grower-1502', edition: 1502, name: 'THC LABZ Grower #1502', rarity: 64.5, traits: 6, image: null, level: 1,  wins: 0,  losses: 0 },
            { id: 'grower-1335', edition: 1335, name: 'THC LABZ Grower #1335', rarity: 72.8, traits: 7, image: null, level: 2,  wins: 5,  losses: 3 },
        ];
    }

    // ── Styles ────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('dopebudz-hub-styles')) return;
        const style = document.createElement('style');
        style.id = 'dopebudz-hub-styles';
        style.textContent = `
            .db-hub {
                position: fixed; inset: 0; z-index: 4500;
                background: linear-gradient(145deg, #0a0f0a 0%, #0d1a0d 40%, #0a120a 100%);
                color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: none; flex-direction: column; overflow: hidden;
            }
            .db-hub.visible { display: flex; }
            .db-hub * { box-sizing: border-box; }

            /* Header */
            .db-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 14px 24px; border-bottom: 2px solid rgba(34,197,94,0.25);
                background: linear-gradient(90deg, rgba(0,0,0,0.6), rgba(34,197,94,0.08), rgba(0,0,0,0.6));
                flex-shrink: 0;
            }
            .db-brand { display: flex; align-items: center; gap: 14px; }
            .db-brand-icon { font-size: 36px; filter: drop-shadow(0 0 8px rgba(34,197,94,0.5)); }
            .db-brand h1 { font-size: 22px; color: #22c55e; margin: 0; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 12px rgba(34,197,94,0.4); }
            .db-brand p { font-size: 11px; color: #6b8f6b; margin: 2px 0 0; letter-spacing: 1px; }
            .db-close-btn {
                background: none; border: 1px solid rgba(255,255,255,0.15); color: #888;
                width: 36px; height: 36px; border-radius: 8px; cursor: pointer;
                font-size: 18px; transition: all 0.2s;
            }
            .db-close-btn:hover { border-color: #ef4444; color: #ef4444; }

            /* Tabs */
            .db-tabs {
                display: flex; gap: 0; border-bottom: 2px solid rgba(34,197,94,0.15);
                background: rgba(0,0,0,0.3); flex-shrink: 0; overflow-x: auto;
            }
            .db-tab {
                padding: 12px 24px; font-size: 12px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 1.5px;
                background: none; border: none; color: #5a7a5a;
                cursor: pointer; transition: all 0.2s; position: relative;
                white-space: nowrap;
            }
            .db-tab:hover { color: #a3d9a3; background: rgba(34,197,94,0.05); }
            .db-tab.active {
                color: #22c55e; background: rgba(34,197,94,0.1);
            }
            .db-tab.active::after {
                content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
                height: 2px; background: #22c55e;
            }

            /* Content */
            .db-content { flex: 1; overflow-y: auto; padding: 24px; }

            /* NFT Grid */
            .db-nft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
            .db-nft-card {
                background: linear-gradient(145deg, rgba(20,30,20,0.9), rgba(10,20,10,0.9));
                border: 2px solid rgba(34,197,94,0.2); border-radius: 12px;
                overflow: hidden; cursor: pointer; transition: all 0.3s;
                position: relative;
            }
            .db-nft-card:hover { border-color: #22c55e; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(34,197,94,0.2); }
            .db-nft-card .nft-img {
                width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #1a2e1a, #0d1a0d);
                display: flex; align-items: center; justify-content: center; font-size: 64px;
            }
            .db-nft-card .nft-info { padding: 14px; }
            .db-nft-card .nft-name { font-size: 13px; font-weight: 700; color: #a3d9a3; margin-bottom: 6px; }
            .db-nft-card .nft-edition { font-size: 11px; color: #5a7a5a; }
            .db-nft-card .nft-rarity { font-size: 11px; color: #fbbf24; margin-top: 4px; }
            .db-owned-badge {
                position: absolute; top: 10px; right: 10px;
                background: #22c55e; color: #000; font-size: 10px; font-weight: 800;
                padding: 3px 10px; border-radius: 4px; text-transform: uppercase;
                letter-spacing: 1px;
            }
            .db-traits-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; }
            .db-trait-badge {
                background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.25);
                border-radius: 4px; padding: 2px 6px; font-size: 9px; color: #6fcf6f;
            }

            /* NFT Detail Modal */
            .db-nft-detail {
                position: fixed; inset: 0; z-index: 5000;
                background: rgba(0,0,0,0.85); display: flex;
                align-items: center; justify-content: center;
                backdrop-filter: blur(4px);
            }
            .db-nft-detail-panel {
                background: linear-gradient(145deg, #0d1a0d, #142214);
                border: 2px solid rgba(34,197,94,0.3); border-radius: 16px;
                padding: 32px; width: 420px; max-width: 90vw;
            }
            .db-detail-stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .db-detail-stat .label { color: #6b8f6b; font-size: 13px; }
            .db-detail-stat .value { color: #a3d9a3; font-weight: 700; font-size: 13px; }

            /* Card Inventory Grid */
            .db-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
            .db-game-card {
                background: linear-gradient(145deg, rgba(20,30,20,0.9), rgba(10,20,10,0.9));
                border: 2px solid rgba(255,255,255,0.1); border-radius: 10px;
                padding: 12px; text-align: center; cursor: pointer; transition: all 0.3s;
                position: relative;
            }
            .db-game-card:hover { transform: translateY(-3px); }
            .db-game-card.rarity-common { border-color: rgba(34,197,94,0.4); }
            .db-game-card.rarity-uncommon { border-color: rgba(59,130,246,0.5); }
            .db-game-card.rarity-rare { border-color: rgba(168,85,247,0.5); }
            .db-game-card.rarity-legendary { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 12px rgba(251,191,36,0.2); }
            .db-game-card .card-icon { font-size: 36px; margin-bottom: 8px; }
            .db-game-card .card-name { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
            .db-game-card .card-cost {
                position: absolute; top: 6px; left: 6px;
                background: #7c3aed; color: #fff; width: 22px; height: 22px;
                border-radius: 50%; font-size: 11px; font-weight: 800;
                display: flex; align-items: center; justify-content: center;
            }
            .db-game-card .card-stats { font-size: 10px; color: #6b8f6b; }

            /* Empty state */
            .db-empty {
                text-align: center; padding: 60px 20px; color: #3a5a3a;
            }
            .db-empty .icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
            .db-empty h3 { color: #5a7a5a; margin-bottom: 8px; }
            .db-empty p { font-size: 13px; max-width: 400px; margin: 0 auto 20px; }
            .db-action-btn {
                padding: 12px 28px; font-size: 14px; font-weight: 700;
                background: #22c55e; color: #000; border: none; border-radius: 8px;
                cursor: pointer; transition: all 0.2s;
            }
            .db-action-btn:hover { background: #16a34a; transform: translateY(-2px); }
            .db-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

            /* Filter bar */
            .db-filter-bar {
                display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
            }
            .db-filter-chip {
                padding: 6px 14px; font-size: 11px; border-radius: 999px;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                color: #888; cursor: pointer; transition: all 0.2s; font-weight: 600;
            }
            .db-filter-chip:hover { border-color: #22c55e; color: #a3d9a3; }
            .db-filter-chip.active { background: rgba(34,197,94,0.2); border-color: #22c55e; color: #22c55e; }

            /* Section heading inside tabs */
            .db-section-title {
                font-size: 18px; color: #22c55e; margin: 0 0 16px;
                display: flex; align-items: center; gap: 10px;
            }
            .db-section-title .count { font-size: 13px; color: #5a7a5a; font-weight: 400; }
        `;
        document.head.appendChild(style);
    }

    // ── UI Creation ──────────────────────────────────────────────────

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'db-hub';
        document.body.appendChild(this.container);
        this._renderHub();
    }

    _renderHub() {
        const tabs = [
            { id: 'nfts', label: '🌿 My NFTs' },
            { id: 'cards', label: '🃏 Card Inventory' },
            { id: 'deckbuilder', label: '📦 Deck Builder' },
            { id: 'battle', label: '⚔️ THC Battle' },
            { id: 'leaderboard', label: '🏆 Territory & Leaderboards' },
        ];

        this.container.innerHTML = `
            <div class="db-header">
                <div class="db-brand">
                    <span class="db-brand-icon">🌿</span>
                    <div>
                        <h1>Dope Budz</h1>
                        <p>THC LABZ • THE GROWERZ CLUB</p>
                    </div>
                </div>
                <button class="db-close-btn" id="db-close-btn">✕</button>
            </div>
            <div class="db-tabs" id="db-tabs">
                ${tabs.map(t => `<button class="db-tab ${t.id === this.activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
            </div>
            <div class="db-content" id="db-content"></div>
        `;

        // Events
        this.container.querySelector('#db-close-btn').onclick = () => this.hide();
        this.container.querySelectorAll('.db-tab').forEach(btn => {
            btn.onclick = () => {
                this.activeTab = btn.dataset.tab;
                this.container.querySelectorAll('.db-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === this.activeTab));
                this._renderTabContent();
            };
        });

        this._renderTabContent();
    }

    // ── Tab Content Router ───────────────────────────────────────────

    _renderTabContent() {
        const content = this.container.querySelector('#db-content');
        if (!content) return;

        switch (this.activeTab) {
            case 'nfts':        this._renderNFTsTab(content); break;
            case 'cards':       this._renderCardsTab(content); break;
            case 'deckbuilder': this._renderDeckBuilderTab(content); break;
            case 'battle':      this._renderBattleTab(content); break;
            case 'leaderboard': this._renderLeaderboardTab(content); break;
        }
    }

    // ── MY NFTs Tab ──────────────────────────────────────────────────

    _renderNFTsTab(el) {
        el.innerHTML = '';

        const heading = document.createElement('div');
        heading.className = 'db-section-title';
        heading.innerHTML = `🌿 Growerz Collection <span class="count">${this.growerNFTs.length} in wallet</span>`;
        el.appendChild(heading);

        if (this.growerNFTs.length === 0) {
            el.innerHTML += `<div class="db-empty"><div class="icon">🌿</div><h3>No Growerz Found</h3><p>Connect your wallet or mint a Growerz NFT to get started.</p></div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'db-nft-grid';

        this.growerNFTs.forEach(nft => {
            const card = document.createElement('div');
            card.className = 'db-nft-card';
            card.innerHTML = `
                <div class="nft-img">🌿</div>
                <span class="db-owned-badge">OWNED</span>
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-edition">Edition #${nft.edition}</div>
                    <div class="nft-rarity">⭐ Rarity Score: ${nft.rarity}</div>
                    <div class="db-traits-row">
                        ${Array.from({ length: nft.traits }, (_, i) => `<span class="db-trait-badge">Trait ${i + 1}</span>`).join('')}
                    </div>
                </div>
            `;
            card.onclick = () => this._showNFTDetail(nft);
            grid.appendChild(card);
        });

        el.appendChild(grid);
    }

    _showNFTDetail(nft) {
        const overlay = document.createElement('div');
        overlay.className = 'db-nft-detail';
        overlay.innerHTML = `
            <div class="db-nft-detail-panel">
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="font-size:72px;margin-bottom:12px;">🌿</div>
                    <h2 style="color:#22c55e;margin:0 0 4px;">${nft.name}</h2>
                    <p style="color:#5a7a5a;font-size:12px;">Edition #${nft.edition}</p>
                </div>
                <div class="db-detail-stat"><span class="label">Rarity Score</span><span class="value" style="color:#fbbf24;">⭐ ${nft.rarity}</span></div>
                <div class="db-detail-stat"><span class="label">Traits</span><span class="value">${nft.traits}</span></div>
                <div class="db-detail-stat"><span class="label">THC Battle Level</span><span class="value" style="color:#22c55e;">Lv. ${nft.level}</span></div>
                <div class="db-detail-stat"><span class="label">Wins</span><span class="value" style="color:#4ade80;">${nft.wins}</span></div>
                <div class="db-detail-stat"><span class="label">Losses</span><span class="value" style="color:#ef4444;">${nft.losses}</span></div>
                <div class="db-detail-stat"><span class="label">Win Rate</span><span class="value">${nft.wins + nft.losses > 0 ? ((nft.wins / (nft.wins + nft.losses)) * 100).toFixed(1) + '%' : 'N/A'}</span></div>
                <div style="text-align:center;margin-top:20px;">
                    <button class="db-action-btn" id="db-detail-close">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#db-detail-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    }

    // ── Card Inventory Tab ───────────────────────────────────────────

    _renderCardsTab(el) {
        el.innerHTML = '';

        const cards = this.playerData.cards || [];

        const heading = document.createElement('div');
        heading.className = 'db-section-title';
        heading.innerHTML = `🃏 Card Collection <span class="count">${cards.length} cards</span>`;
        el.appendChild(heading);

        if (cards.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'db-empty';
            empty.innerHTML = `
                <div class="icon">🃏</div>
                <h3>No Cards Yet</h3>
                <p>Open your starter packs to begin collecting cards!</p>
                <button class="db-action-btn" id="db-open-packs-btn">Open Starter Packs</button>
            `;
            el.appendChild(empty);
            empty.querySelector('#db-open-packs-btn').onclick = () => this._triggerPackOpening();
            return;
        }

        // Filter bar
        const filterBar = document.createElement('div');
        filterBar.className = 'db-filter-bar';
        const rarities = ['All', 'Common', 'Uncommon', 'Rare', 'Legendary'];
        this._currentCardFilter = this._currentCardFilter || 'All';
        rarities.forEach(r => {
            const chip = document.createElement('button');
            chip.className = `db-filter-chip ${this._currentCardFilter === r ? 'active' : ''}`;
            chip.textContent = r;
            chip.onclick = () => {
                this._currentCardFilter = r;
                this._renderCardsTab(el);
            };
            filterBar.appendChild(chip);
        });
        el.appendChild(filterBar);

        const filtered = this._currentCardFilter === 'All'
            ? cards
            : cards.filter(c => c.rarity === this._currentCardFilter.toLowerCase());

        const grid = document.createElement('div');
        grid.className = 'db-card-grid';

        filtered.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `db-game-card rarity-${card.rarity}`;
            cardEl.innerHTML = `
                <div class="card-cost">${card.elixirCost}</div>
                <div class="card-icon">${card.icon || '🌱'}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-stats">HP ${card.hp} • DPS ${card.dps}</div>
            `;
            grid.appendChild(cardEl);
        });

        el.appendChild(grid);
    }

    // ── Deck Builder Tab (delegates to DeckBuilder system) ───────────

    _renderDeckBuilderTab(el) {
        el.innerHTML = '';
        if (this.deckBuilder) {
            this.deckBuilder.renderInto(el, this.playerData);
        } else {
            el.innerHTML = `<div class="db-empty"><div class="icon">📦</div><h3>Deck Builder</h3><p>Collect cards first, then build your battle deck!</p></div>`;
        }
    }

    // ── THC Battle Tab (delegates to THCBattleArena) ─────────────────

    _renderBattleTab(el) {
        el.innerHTML = '';
        if (this.playerData.decks && this.playerData.decks.length > 0) {
            const wrap = document.createElement('div');
            wrap.style.textAlign = 'center';
            wrap.innerHTML = `
                <div style="font-size:72px;margin-bottom:16px;">⚔️</div>
                <h2 style="color:#22c55e;margin-bottom:8px;">THC Battle Arena</h2>
                <p style="color:#5a7a5a;margin-bottom:24px;">Deploy your cards and destroy the enemy tower!</p>
                <button class="db-action-btn" id="db-start-battle">Start Battle</button>
                <div style="margin-top:12px;">
                    <button class="db-action-btn" style="background:#7c3aed;" id="db-ai-battle">Battle AI</button>
                </div>
                <div style="margin-top:24px;color:#5a7a5a;font-size:12px;">
                    Record: ${this.playerData.wins}W - ${this.playerData.losses}L • 🏆 ${this.playerData.trophies} Trophies
                </div>
            `;
            el.appendChild(wrap);

            wrap.querySelector('#db-start-battle').onclick = () => this._launchBattle('pvp');
            wrap.querySelector('#db-ai-battle').onclick = () => this._launchBattle('ai');
        } else {
            el.innerHTML = `<div class="db-empty"><div class="icon">⚔️</div><h3>Build a Deck First</h3><p>Go to the Deck Builder tab and create a battle deck before entering the arena.</p></div>`;
        }
    }

    // ── Leaderboard Tab (delegates to DopeBudzLeaderboard) ───────────

    _renderLeaderboardTab(el) {
        el.innerHTML = '';
        if (this.leaderboard) {
            this.leaderboard.renderInto(el, this.playerData);
        } else {
            el.innerHTML = `<div class="db-empty"><div class="icon">🏆</div><h3>Territory & Leaderboards</h3><p>Win battles to claim territory and climb the ranks!</p></div>`;
        }
    }

    // ── Actions ──────────────────────────────────────────────────────

    _triggerPackOpening() {
        if (this.cardPackSystem) {
            this.cardPackSystem.show(this.playerData, (newCards) => {
                this.playerData.cards = [...(this.playerData.cards || []), ...newCards];
                this.playerData.firstEntry = false;
                this._savePlayerData();
                this._renderTabContent();
            });
        } else {
            console.warn('[DopeBudzHub] CardPackSystem not linked');
        }
    }

    _launchBattle(mode) {
        if (this.battleArena) {
            const activeDeck = this.playerData.decks[0]; // use first deck for now
            this.battleArena.startBattle(mode, activeDeck, this.playerData, (result) => {
                if (result.won) {
                    this.playerData.wins++;
                    this.playerData.trophies += result.trophyChange || 30;
                    this.playerData.xp += 50;
                } else {
                    this.playerData.losses++;
                    this.playerData.trophies = Math.max(0, this.playerData.trophies - (result.trophyChange || 15));
                    this.playerData.xp += 10;
                }
                this._savePlayerData();
                this._renderTabContent();
            });
        } else {
            console.warn('[DopeBudzHub] THCBattleArena not linked');
        }
    }

    // ── Show / Hide / Toggle ─────────────────────────────────────────

    show() {
        this.playerData = this._loadPlayerData();
        this.isVisible = true;
        this.container.classList.add('visible');
        this._renderHub();

        // First-time pack grant
        if (this.playerData.firstEntry && this.cardPackSystem) {
            setTimeout(() => this._triggerPackOpening(), 600);
        }

        document.dispatchEvent(new CustomEvent('ui:system:opened', { detail: { system: 'dopeBudz' } }));
    }

    hide() {
        this.isVisible = false;
        this.container.classList.remove('visible');
        document.dispatchEvent(new CustomEvent('ui:system:closed', { detail: { system: 'dopeBudz' } }));
    }

    toggle() {
        this.isVisible ? this.hide() : this.show();
    }

    // ── Link sub-systems ─────────────────────────────────────────────

    linkSystems({ cardPackSystem, deckBuilder, battleArena, leaderboard }) {
        if (cardPackSystem) this.cardPackSystem = cardPackSystem;
        if (deckBuilder) this.deckBuilder = deckBuilder;
        if (battleArena) this.battleArena = battleArena;
        if (leaderboard) this.leaderboard = leaderboard;
    }
}

export default DopeBudzHub;
