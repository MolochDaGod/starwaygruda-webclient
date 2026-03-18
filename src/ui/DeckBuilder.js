/**
 * DeckBuilder.js
 *
 * 8-card deck builder for Dope Budz THC Battle.
 * Drag-and-drop from card inventory into deck slots.
 * Card stats on hover. 5 saved deck presets. Avg elixir cost display.
 */

const RARITY_COLORS = {
    common:    '#22c55e',
    uncommon:  '#3b82f6',
    rare:      '#a855f7',
    legendary: '#fbbf24',
};

const MAX_DECK_SIZE = 8;
const MAX_PRESETS = 5;

export class DeckBuilder {
    constructor() {
        this._injectStyles();
    }

    _injectStyles() {
        if (document.getElementById('deck-builder-styles')) return;
        const style = document.createElement('style');
        style.id = 'deck-builder-styles';
        style.textContent = `
            .dkb-wrap { display: flex; gap: 24px; height: 100%; min-height: 500px; }

            /* Left: Deck area */
            .dkb-deck-panel {
                width: 320px; flex-shrink: 0;
                background: rgba(0,0,0,0.3); border: 1px solid rgba(34,197,94,0.15);
                border-radius: 12px; padding: 16px; display: flex; flex-direction: column;
            }
            .dkb-deck-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .dkb-deck-title { font-size: 16px; color: #22c55e; font-weight: 700; }
            .dkb-avg-elixir {
                font-size: 12px; color: #7c3aed; font-weight: 700;
                background: rgba(124,58,237,0.15); padding: 4px 10px; border-radius: 6px;
            }

            .dkb-deck-slots {
                display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex: 1;
            }
            .dkb-slot {
                border: 2px dashed rgba(34,197,94,0.2); border-radius: 10px;
                min-height: 90px; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                transition: all 0.2s; position: relative; cursor: pointer;
            }
            .dkb-slot.empty { background: rgba(34,197,94,0.03); }
            .dkb-slot.empty:hover { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.06); }
            .dkb-slot.dragover { border-color: #22c55e; background: rgba(34,197,94,0.12); }
            .dkb-slot.filled {
                border-style: solid; background: rgba(20,30,20,0.7);
                cursor: grab;
            }
            .dkb-slot .slot-num {
                position: absolute; top: 4px; right: 6px; font-size: 10px;
                color: rgba(255,255,255,0.2); font-weight: 700;
            }
            .dkb-slot .slot-icon { font-size: 28px; }
            .dkb-slot .slot-name { font-size: 10px; font-weight: 700; margin-top: 4px; color: #a3d9a3; }
            .dkb-slot .slot-cost {
                position: absolute; top: 4px; left: 6px;
                background: #7c3aed; color: #fff; width: 18px; height: 18px;
                border-radius: 50%; font-size: 9px; font-weight: 800;
                display: flex; align-items: center; justify-content: center;
            }
            .dkb-slot .slot-remove {
                position: absolute; bottom: 4px; right: 4px;
                background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.3);
                color: #ef4444; width: 18px; height: 18px; border-radius: 4px;
                font-size: 10px; cursor: pointer; display: none;
                align-items: center; justify-content: center;
            }
            .dkb-slot.filled:hover .slot-remove { display: flex; }

            /* Presets */
            .dkb-presets { display: flex; gap: 6px; margin-top: 12px; }
            .dkb-preset-btn {
                flex: 1; padding: 6px; font-size: 11px; font-weight: 700;
                background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                color: #5a7a5a; border-radius: 6px; cursor: pointer; transition: all 0.2s;
                text-align: center;
            }
            .dkb-preset-btn:hover { border-color: #22c55e; color: #a3d9a3; }
            .dkb-preset-btn.active { border-color: #22c55e; background: rgba(34,197,94,0.15); color: #22c55e; }
            .dkb-save-btn {
                margin-top: 8px; padding: 10px; width: 100%; font-size: 13px; font-weight: 700;
                background: #22c55e; color: #000; border: none; border-radius: 8px;
                cursor: pointer; transition: all 0.2s;
            }
            .dkb-save-btn:hover { background: #16a34a; }
            .dkb-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

            /* Right: Card inventory */
            .dkb-inv-panel {
                flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
                border-radius: 12px; padding: 16px; overflow-y: auto;
            }
            .dkb-inv-title { font-size: 14px; color: #a3d9a3; font-weight: 700; margin-bottom: 10px; }
            .dkb-inv-filter { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
            .dkb-inv-chip {
                padding: 4px 10px; font-size: 10px; border-radius: 999px;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                color: #666; cursor: pointer; transition: all 0.2s; font-weight: 600;
            }
            .dkb-inv-chip:hover { border-color: #22c55e; color: #a3d9a3; }
            .dkb-inv-chip.active { background: rgba(34,197,94,0.15); border-color: #22c55e; color: #22c55e; }

            .dkb-inv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
            .dkb-inv-card {
                background: rgba(20,30,20,0.8); border: 2px solid rgba(255,255,255,0.08);
                border-radius: 8px; padding: 8px; text-align: center;
                cursor: grab; transition: all 0.2s; position: relative;
            }
            .dkb-inv-card:hover { transform: translateY(-2px); border-color: rgba(34,197,94,0.4); }
            .dkb-inv-card.in-deck { opacity: 0.35; pointer-events: none; }
            .dkb-inv-card .ic-icon { font-size: 24px; }
            .dkb-inv-card .ic-name { font-size: 9px; font-weight: 700; color: #a3d9a3; margin-top: 4px; }
            .dkb-inv-card .ic-cost {
                position: absolute; top: 4px; left: 4px;
                background: #7c3aed; color: #fff; width: 16px; height: 16px;
                border-radius: 50%; font-size: 9px; font-weight: 800;
                display: flex; align-items: center; justify-content: center;
            }

            /* Tooltip */
            .dkb-tooltip {
                position: fixed; z-index: 6000;
                background: #0d1a0d; border: 1px solid rgba(34,197,94,0.3);
                border-radius: 8px; padding: 10px 14px; pointer-events: none;
                min-width: 160px; box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            }
            .dkb-tooltip .tt-name { font-size: 13px; font-weight: 700; color: #a3d9a3; margin-bottom: 4px; }
            .dkb-tooltip .tt-rarity { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
            .dkb-tooltip .tt-stat { font-size: 11px; color: #6b8f6b; margin-bottom: 2px; }
            .dkb-tooltip .tt-ability { font-size: 11px; color: #fbbf24; margin-top: 4px; }
        `;
        document.head.appendChild(style);
    }

    // ── Public API (called by DopeBudzHub) ───────────────────────────

    renderInto(container, playerData) {
        this.playerData = playerData;
        this.activePreset = 0;
        this.filter = 'All';

        // Load presets from playerData
        if (!playerData.decks || playerData.decks.length === 0) {
            playerData.decks = Array.from({ length: MAX_PRESETS }, () => []);
        }
        while (playerData.decks.length < MAX_PRESETS) {
            playerData.decks.push([]);
        }

        this.currentDeck = [...(playerData.decks[this.activePreset] || [])];

        container.innerHTML = '';
        this._buildUI(container);
    }

    // ── Build UI ─────────────────────────────────────────────────────

    _buildUI(container) {
        const wrap = document.createElement('div');
        wrap.className = 'dkb-wrap';

        // ─ Left: Deck panel
        const deckPanel = document.createElement('div');
        deckPanel.className = 'dkb-deck-panel';
        this._renderDeckPanel(deckPanel);
        wrap.appendChild(deckPanel);

        // ─ Right: Inventory panel
        const invPanel = document.createElement('div');
        invPanel.className = 'dkb-inv-panel';
        this._renderInventoryPanel(invPanel);
        wrap.appendChild(invPanel);

        container.appendChild(wrap);

        // Tooltip element
        this._tooltip = document.createElement('div');
        this._tooltip.className = 'dkb-tooltip';
        this._tooltip.style.display = 'none';
        document.body.appendChild(this._tooltip);
    }

    _renderDeckPanel(panel) {
        panel.innerHTML = '';

        const avgElixir = this.currentDeck.length > 0
            ? (this.currentDeck.reduce((s, c) => s + c.elixirCost, 0) / this.currentDeck.length).toFixed(1)
            : '0.0';

        // Header
        const header = document.createElement('div');
        header.className = 'dkb-deck-header';
        header.innerHTML = `
            <span class="dkb-deck-title">Battle Deck (${this.currentDeck.length}/${MAX_DECK_SIZE})</span>
            <span class="dkb-avg-elixir">⚡ ${avgElixir} avg</span>
        `;
        panel.appendChild(header);

        // Slots
        const slotsGrid = document.createElement('div');
        slotsGrid.className = 'dkb-deck-slots';

        for (let i = 0; i < MAX_DECK_SIZE; i++) {
            const slot = document.createElement('div');
            const card = this.currentDeck[i];

            if (card) {
                const rc = RARITY_COLORS[card.rarity] || '#22c55e';
                slot.className = 'dkb-slot filled';
                slot.style.borderColor = rc;
                slot.innerHTML = `
                    <span class="slot-num">#${i + 1}</span>
                    <span class="slot-cost">${card.elixirCost}</span>
                    <span class="slot-icon">${card.icon}</span>
                    <span class="slot-name">${card.name}</span>
                    <button class="slot-remove" data-idx="${i}">✕</button>
                `;
                slot.querySelector('.slot-remove').onclick = (e) => {
                    e.stopPropagation();
                    this._removeFromDeck(i, panel);
                };
                slot.onmouseenter = (e) => this._showTooltip(e, card);
                slot.onmouseleave = () => this._hideTooltip();
            } else {
                slot.className = 'dkb-slot empty';
                slot.innerHTML = `<span class="slot-num">#${i + 1}</span><span style="font-size:20px;color:rgba(34,197,94,0.2);">+</span>`;
            }

            // Drop target
            slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('dragover'); };
            slot.ondragleave = () => slot.classList.remove('dragover');
            slot.ondrop = (e) => {
                e.preventDefault();
                slot.classList.remove('dragover');
                try {
                    const cardData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    this._addToDeck(cardData, panel);
                } catch (_) {}
            };

            slotsGrid.appendChild(slot);
        }

        panel.appendChild(slotsGrid);

        // Presets
        const presets = document.createElement('div');
        presets.className = 'dkb-presets';
        for (let p = 0; p < MAX_PRESETS; p++) {
            const btn = document.createElement('button');
            btn.className = `dkb-preset-btn ${p === this.activePreset ? 'active' : ''}`;
            btn.textContent = `Deck ${p + 1}`;
            btn.onclick = () => {
                this._saveCurrent();
                this.activePreset = p;
                this.currentDeck = [...(this.playerData.decks[p] || [])];
                this._renderDeckPanel(panel);
                // Re-render inventory to update "in-deck" state
                const invPanel = panel.parentElement.querySelector('.dkb-inv-panel');
                if (invPanel) this._renderInventoryPanel(invPanel);
            };
            presets.appendChild(btn);
        }
        panel.appendChild(presets);

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'dkb-save-btn';
        saveBtn.textContent = `Save Deck ${this.activePreset + 1}`;
        saveBtn.disabled = this.currentDeck.length === 0;
        saveBtn.onclick = () => {
            this._saveCurrent();
            saveBtn.textContent = '✓ Saved!';
            setTimeout(() => { saveBtn.textContent = `Save Deck ${this.activePreset + 1}`; }, 1200);
        };
        panel.appendChild(saveBtn);
    }

    _renderInventoryPanel(panel) {
        panel.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'dkb-inv-title';
        title.textContent = `Card Collection (${(this.playerData.cards || []).length})`;
        panel.appendChild(title);

        // Filter
        const filterBar = document.createElement('div');
        filterBar.className = 'dkb-inv-filter';
        ['All', 'Common', 'Uncommon', 'Rare', 'Legendary'].forEach(r => {
            const chip = document.createElement('button');
            chip.className = `dkb-inv-chip ${this.filter === r ? 'active' : ''}`;
            chip.textContent = r;
            chip.onclick = () => { this.filter = r; this._renderInventoryPanel(panel); };
            filterBar.appendChild(chip);
        });
        panel.appendChild(filterBar);

        const allCards = this.playerData.cards || [];
        const filtered = this.filter === 'All' ? allCards : allCards.filter(c => c.rarity === this.filter.toLowerCase());
        const deckIds = new Set(this.currentDeck.map(c => c.id));

        const grid = document.createElement('div');
        grid.className = 'dkb-inv-grid';

        filtered.forEach(card => {
            const el = document.createElement('div');
            const inDeck = deckIds.has(card.id);
            el.className = `dkb-inv-card ${inDeck ? 'in-deck' : ''}`;
            el.style.borderColor = RARITY_COLORS[card.rarity] || '#22c55e';
            el.draggable = !inDeck;
            el.innerHTML = `
                <span class="ic-cost">${card.elixirCost}</span>
                <div class="ic-icon">${card.icon}</div>
                <div class="ic-name">${card.name}</div>
            `;

            el.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(card));
            };

            // Click to add
            if (!inDeck) {
                el.onclick = () => {
                    const deckPanel = panel.parentElement.querySelector('.dkb-deck-panel');
                    this._addToDeck(card, deckPanel);
                    this._renderInventoryPanel(panel);
                };
            }

            el.onmouseenter = (e) => this._showTooltip(e, card);
            el.onmouseleave = () => this._hideTooltip();

            grid.appendChild(el);
        });

        panel.appendChild(grid);
    }

    // ── Deck operations ──────────────────────────────────────────────

    _addToDeck(card, deckPanel) {
        if (this.currentDeck.length >= MAX_DECK_SIZE) return;
        if (this.currentDeck.some(c => c.id === card.id)) return;
        this.currentDeck.push(card);
        if (deckPanel) this._renderDeckPanel(deckPanel);
        // Also refresh inventory
        const invPanel = deckPanel?.parentElement?.querySelector('.dkb-inv-panel');
        if (invPanel) this._renderInventoryPanel(invPanel);
    }

    _removeFromDeck(idx, deckPanel) {
        this.currentDeck.splice(idx, 1);
        if (deckPanel) this._renderDeckPanel(deckPanel);
        const invPanel = deckPanel?.parentElement?.querySelector('.dkb-inv-panel');
        if (invPanel) this._renderInventoryPanel(invPanel);
    }

    _saveCurrent() {
        this.playerData.decks[this.activePreset] = [...this.currentDeck];
        try {
            localStorage.setItem('dopebudz_player', JSON.stringify(this.playerData));
        } catch (_) {}
    }

    // ── Tooltip ──────────────────────────────────────────────────────

    _showTooltip(e, card) {
        if (!this._tooltip) return;
        const rc = RARITY_COLORS[card.rarity] || '#22c55e';
        this._tooltip.innerHTML = `
            <div class="tt-name">${card.icon} ${card.name}</div>
            <div class="tt-rarity" style="color:${rc};">${card.rarity}</div>
            <div class="tt-stat">HP: ${card.hp}</div>
            <div class="tt-stat">DPS: ${card.dps}</div>
            <div class="tt-stat">Elixir: ${card.elixirCost}</div>
            ${card.ability ? `<div class="tt-ability">✦ ${card.ability}</div>` : ''}
        `;
        this._tooltip.style.display = 'block';
        this._tooltip.style.left = `${e.clientX + 12}px`;
        this._tooltip.style.top = `${e.clientY + 12}px`;
    }

    _hideTooltip() {
        if (this._tooltip) this._tooltip.style.display = 'none';
    }
}

export default DeckBuilder;
