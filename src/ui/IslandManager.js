import { gameState } from '../systems/GameStateManager.js';
import { RESOURCE_TYPES } from '../systems/HarvestingSystem.js';
import { ISLAND_LEVELS, ISLAND_RESOURCE_TYPES } from '../systems/IslandSystem.js';

/**
 * IslandManager UI — Home Island management window.
 *
 * Follows the existing game-window pattern (InventorySystem, CraftingInterface).
 * Provides: island overview grid, character assignment, harvest log, upgrade panel.
 */

export class IslandManager {
    constructor(islandSystem) {
        this.island = islandSystem;
        this.isVisible = false;
        this.selectedSlot = null;

        this.createUI();
        this.setupEventListeners();

        // Re-render on island ticks
        gameState.on('islandTick', () => this.refresh());
        gameState.on('islandHarvestCollected', () => this.refresh());
        gameState.on('islandUpgraded', () => this.refresh());
        gameState.on('islandNodeAssigned', () => this.refresh());
        gameState.on('islandNodeUnassigned', () => this.refresh());
        gameState.on('syncIslandHydrate', () => this.refresh());
        gameState.on('syncCharactersHydrate', () => this.refresh());
    }

    // ─── UI Creation ─────────────────────────────────────────

    createUI() {
        this.window = document.createElement('div');
        this.window.id = 'island-manager-window';
        this.window.className = 'game-window island-manager-window hidden';

        this.window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-island-tropical"></i>
                    🏝️ Home Island
                </div>
                <div class="window-controls">
                    <button class="minimize-btn"><i class="fas fa-minus"></i></button>
                    <button class="close-btn" id="island-close-btn"><i class="fas fa-times"></i></button>
                </div>
            </div>

            <div class="window-content">
                <div class="island-layout">
                    <!-- Left: Island Info + Upgrade -->
                    <div class="island-sidebar">
                        <div class="island-level-panel" id="island-level-panel"></div>
                        <div class="island-actions">
                            <button class="action-btn collect-btn" id="island-collect-btn">
                                <i class="fas fa-box-open"></i> Collect All
                            </button>
                            <button class="action-btn upgrade-btn" id="island-upgrade-btn">
                                <i class="fas fa-arrow-up"></i> Upgrade Island
                            </button>
                        </div>
                        <div class="island-characters" id="island-characters-panel"></div>
                    </div>

                    <!-- Center: Node Grid -->
                    <div class="island-nodes-panel">
                        <h3><i class="fas fa-th"></i> Resource Nodes</h3>
                        <div class="island-node-grid" id="island-node-grid"></div>
                    </div>

                    <!-- Right: Harvest Log -->
                    <div class="island-log-panel">
                        <h3><i class="fas fa-scroll"></i> Harvest Log</h3>
                        <div class="harvest-log" id="island-harvest-log"></div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .island-manager-window {
                position: fixed;
                top: 50px;
                left: 50px;
                width: 95vw;
                height: 90vh;
                max-width: 1300px;
                max-height: 850px;
                background: linear-gradient(135deg, #0a1628 0%, #122a1e 50%, #0a2a3a 100%);
                border: 2px solid #00ff88;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 255, 136, 0.25);
                z-index: 1002;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
            }
            .island-manager-window.hidden { display: none; }

            .island-manager-window .window-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: rgba(0, 255, 136, 0.1);
                border-bottom: 1px solid #00ff88;
                border-radius: 13px 13px 0 0;
            }
            .island-manager-window .window-title {
                font-size: 18px;
                font-weight: bold;
                color: #00ff88;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .island-manager-window .window-controls {
                display: flex; gap: 5px;
            }
            .island-manager-window .window-controls button {
                width: 30px; height: 30px; border: none; border-radius: 5px;
                background: rgba(255,255,255,0.1); color: white; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.3s;
            }
            .island-manager-window .window-controls button:hover {
                background: rgba(255,255,255,0.2); transform: scale(1.05);
            }

            .island-layout {
                flex: 1;
                display: grid;
                grid-template-columns: 240px 1fr 260px;
                gap: 15px;
                padding: 15px;
                overflow: hidden;
            }

            .island-sidebar, .island-nodes-panel, .island-log-panel {
                background: rgba(0,0,0,0.25);
                border: 1px solid rgba(0,255,136,0.2);
                border-radius: 10px;
                padding: 15px;
                overflow-y: auto;
            }

            .island-sidebar h3, .island-nodes-panel h3, .island-log-panel h3 {
                margin: 0 0 12px 0; color: #00ff88; font-size: 14px;
                display: flex; align-items: center; gap: 8px;
                border-bottom: 1px solid rgba(0,255,136,0.2); padding-bottom: 8px;
            }

            /* Level panel */
            .island-level-panel {
                text-align: center; margin-bottom: 15px;
            }
            .island-level-badge {
                display: inline-block; padding: 8px 20px;
                background: linear-gradient(135deg, #00ff88, #00d4ff);
                border-radius: 20px; font-weight: bold; font-size: 18px; color: #0a1628;
            }
            .island-stats { margin-top: 10px; font-size: 12px; color: #aaa; }
            .island-stats span { display: block; margin: 4px 0; }

            /* Actions */
            .island-actions { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
            .island-actions .action-btn {
                padding: 10px; border: 1px solid rgba(0,255,136,0.3); border-radius: 8px;
                background: rgba(0,255,136,0.1); color: #00ff88; font-size: 12px;
                cursor: pointer; transition: all 0.3s; text-align: center;
            }
            .island-actions .action-btn:hover { background: rgba(0,255,136,0.25); }
            .island-actions .collect-btn { border-color: #FFD700; color: #FFD700; background: rgba(255,215,0,0.1); }
            .island-actions .collect-btn:hover { background: rgba(255,215,0,0.25); }

            /* Characters panel */
            .island-characters h4 { color: #00d4ff; font-size: 13px; margin: 0 0 8px 0; }
            .char-item {
                padding: 8px; margin-bottom: 6px;
                background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.2);
                border-radius: 6px; font-size: 11px; cursor: grab;
                display: flex; justify-content: space-between; align-items: center;
            }
            .char-item:hover { border-color: #00d4ff; }
            .char-item.assigned { opacity: 0.5; cursor: default; }

            /* Node grid */
            .island-node-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 10px;
            }
            .island-node {
                padding: 12px; border-radius: 10px;
                background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.1);
                text-align: center; cursor: pointer; transition: all 0.3s;
                min-height: 120px; display: flex; flex-direction: column;
                justify-content: center; align-items: center; gap: 6px;
            }
            .island-node:hover { border-color: #00ff88; background: rgba(0,255,136,0.05); }
            .island-node.selected { border-color: #FFD700; box-shadow: 0 0 15px rgba(255,215,0,0.3); }
            .island-node.has-character { border-color: #00d4ff; }
            .island-node .node-icon { font-size: 28px; }
            .island-node .node-name { font-size: 11px; color: #aaa; }
            .island-node .node-character { font-size: 10px; color: #00d4ff; margin-top: 2px; }
            .island-node .node-accumulated {
                font-size: 12px; font-weight: bold; color: #FFD700;
                background: rgba(255,215,0,0.15); padding: 2px 8px; border-radius: 10px;
            }
            .island-node .node-yield { font-size: 10px; color: #888; }
            .island-node .node-empty { font-size: 10px; color: #555; font-style: italic; }

            /* Resource select dropdown inside node */
            .node-resource-select {
                background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,136,0.3);
                color: #00ff88; border-radius: 4px; padding: 2px 4px; font-size: 10px;
                cursor: pointer; margin-top: 4px;
            }

            /* Harvest log */
            .harvest-log { font-size: 11px; }
            .log-entry {
                padding: 6px 8px; margin-bottom: 4px;
                background: rgba(0,0,0,0.2); border-radius: 4px;
                border-left: 3px solid #00ff88;
            }
            .log-entry .log-amount { color: #FFD700; font-weight: bold; }
            .log-entry .log-resource { color: #00ff88; }
            .log-entry .log-character { color: #00d4ff; }
            .log-entry .log-time { color: #666; font-size: 10px; float: right; }
            .log-empty { color: #555; text-align: center; padding: 20px; font-style: italic; }

            /* Upgrade cost tooltip */
            .upgrade-cost-list { margin-top: 8px; font-size: 11px; }
            .upgrade-cost-item { display: flex; justify-content: space-between; margin: 3px 0; }
            .upgrade-cost-item .cost-name { color: #aaa; }
            .upgrade-cost-item .cost-amount { color: #FFD700; }
            .upgrade-cost-item .cost-have { color: #888; }
            .upgrade-cost-item.insufficient .cost-amount { color: #ff4444; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.window);
    }

    setupEventListeners() {
        this.window.querySelector('#island-close-btn').addEventListener('click', () => this.hide());
        this.window.querySelector('#island-collect-btn').addEventListener('click', () => {
            this.island.collectAll();
        });
        this.window.querySelector('#island-upgrade-btn').addEventListener('click', () => {
            this.island.upgrade();
        });
    }

    // ─── Show / Hide ─────────────────────────────────────────

    show() {
        this.isVisible = true;
        this.window.classList.remove('hidden');
        this.refresh();
    }

    hide() {
        this.isVisible = false;
        this.window.classList.add('hidden');
    }

    toggle() {
        this.isVisible ? this.hide() : this.show();
    }

    // ─── Render ──────────────────────────────────────────────

    refresh() {
        if (!this.isVisible) return;

        this.island.ensureIsland();
        const islandData = this.island.getIsland();
        const levelConfig = this.island.getLevelConfig();
        const characters = gameState.getState().accountCharacters || [];

        this._renderLevelPanel(islandData, levelConfig);
        this._renderNodeGrid(islandData, characters);
        this._renderCharactersPanel(islandData, characters);
        this._renderHarvestLog(islandData);
        this._renderUpgradeButton(islandData);
    }

    _renderLevelPanel(islandData, levelConfig) {
        const panel = this.window.querySelector('#island-level-panel');
        const assignedCount = islandData.nodes.filter(n => n.characterId).length;
        const totalAccum = islandData.nodes.reduce((s, n) => s + (n.accumulated || 0), 0);

        panel.innerHTML = `
            <div class="island-level-badge">Level ${islandData.level}</div>
            <div class="island-stats">
                <span>Nodes: ${islandData.nodes.length} / ${levelConfig.slots}</span>
                <span>Assigned: ${assignedCount} / ${islandData.nodes.length}</span>
                <span>Yield Multiplier: ${levelConfig.yieldMult}x</span>
                <span>Pending Resources: <strong style="color:#FFD700">${totalAccum}</strong></span>
            </div>
        `;
    }

    _renderNodeGrid(islandData, characters) {
        const grid = this.window.querySelector('#island-node-grid');
        grid.innerHTML = '';

        for (const node of islandData.nodes) {
            const resType = RESOURCE_TYPES[node.resourceType];
            const character = characters.find(c => c.id === node.characterId);
            const isSelected = this.selectedSlot === node.slotIndex;

            const nodeEl = document.createElement('div');
            nodeEl.className = `island-node${isSelected ? ' selected' : ''}${character ? ' has-character' : ''}`;
            nodeEl.dataset.slot = node.slotIndex;

            const colorHex = resType ? '#' + resType.color.toString(16).padStart(6, '0') : '#888';

            nodeEl.innerHTML = `
                <div class="node-icon" style="color:${colorHex}">${this._resourceIcon(node.resourceType)}</div>
                <div class="node-name">${resType?.name || node.resourceType}</div>
                <select class="node-resource-select" data-slot="${node.slotIndex}">
                    ${ISLAND_RESOURCE_TYPES.map(rt => `<option value="${rt}" ${rt === node.resourceType ? 'selected' : ''}>${RESOURCE_TYPES[rt]?.name || rt}</option>`).join('')}
                </select>
                ${character
                    ? `<div class="node-character">⚔️ ${character.name}</div>`
                    : `<div class="node-empty">No character</div>`}
                ${node.accumulated > 0
                    ? `<div class="node-accumulated">+${node.accumulated}</div>`
                    : `<div class="node-yield">${resType ? resType.baseYield : 0}/tick</div>`}
            `;

            // Click to select/deselect
            nodeEl.addEventListener('click', (e) => {
                if (e.target.tagName === 'SELECT') return;
                this.selectedSlot = this.selectedSlot === node.slotIndex ? null : node.slotIndex;
                this.refresh();
            });

            // Resource type change
            const select = nodeEl.querySelector('.node-resource-select');
            select.addEventListener('change', (e) => {
                this.island.setNodeResource(node.slotIndex, e.target.value);
                this.refresh();
            });

            grid.appendChild(nodeEl);
        }
    }

    _renderCharactersPanel(islandData, characters) {
        const panel = this.window.querySelector('#island-characters-panel');
        const assignedIds = new Set(islandData.nodes.filter(n => n.characterId).map(n => n.characterId));

        panel.innerHTML = `<h4><i class="fas fa-users"></i> Characters</h4>`;

        if (characters.length === 0) {
            panel.innerHTML += `<div style="color:#555;font-size:11px;font-style:italic">No characters found</div>`;
            return;
        }

        for (const char of characters) {
            const isAssigned = assignedIds.has(char.id);
            const el = document.createElement('div');
            el.className = `char-item${isAssigned ? ' assigned' : ''}`;
            el.innerHTML = `
                <span>${char.name || 'Unnamed'} <small style="color:#888">Lv${char.level || 1}</small></span>
                ${isAssigned
                    ? `<small style="color:#00ff88">Assigned</small>`
                    : `<button class="assign-char-btn" data-char="${char.id}" style="font-size:10px;padding:2px 6px;background:rgba(0,212,255,0.2);border:1px solid #00d4ff;color:#00d4ff;border-radius:4px;cursor:pointer">Assign</button>`
                }
            `;

            if (!isAssigned) {
                const btn = el.querySelector('.assign-char-btn');
                btn.addEventListener('click', () => {
                    if (this.selectedSlot !== null) {
                        this.island.assignCharacter(this.selectedSlot, char.id);
                        this.selectedSlot = null;
                        this.refresh();
                    } else {
                        // Auto-assign to first empty slot
                        const emptyNode = islandData.nodes.find(n => !n.characterId);
                        if (emptyNode) {
                            this.island.assignCharacter(emptyNode.slotIndex, char.id);
                            this.refresh();
                        }
                    }
                });
            }

            panel.appendChild(el);
        }
    }

    _renderHarvestLog(islandData) {
        const log = this.window.querySelector('#island-harvest-log');
        const entries = islandData.harvestLog || [];

        if (entries.length === 0) {
            log.innerHTML = `<div class="log-empty">No harvests yet. Assign characters to nodes!</div>`;
            return;
        }

        log.innerHTML = entries.map(entry => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString();
            return `
                <div class="log-entry">
                    <span class="log-time">${timeStr}</span>
                    <span class="log-character">${entry.characterName}</span> harvested
                    <span class="log-amount">+${entry.amount}</span>
                    <span class="log-resource">${entry.resourceName}</span>
                </div>
            `;
        }).join('');
    }

    _renderUpgradeButton(islandData) {
        const btn = this.window.querySelector('#island-upgrade-btn');
        const cost = this.island.getUpgradeCost();

        if (!cost) {
            btn.textContent = 'MAX LEVEL';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            return;
        }

        btn.disabled = false;
        btn.style.opacity = '1';

        const nextLevel = islandData.level + 1;
        const nextConfig = ISLAND_LEVELS.find(l => l.level === nextLevel);
        btn.innerHTML = `<i class="fas fa-arrow-up"></i> Upgrade to Lv${nextLevel} (${nextConfig?.slots || '?'} slots)`;
    }

    // ─── Helpers ──────────────────────────────────────────────

    _resourceIcon(resourceType) {
        const icons = {
            iron: '⛏️', copper: '🟤', aluminum: '⬜', steel: '🔩',
            flora: '🌿', wood: '🪵', radioactive: '☢️', solar: '☀️',
            meat: '🥩', hide: '🧶', bone: '🦴',
        };
        return icons[resourceType] || '📦';
    }
}

export default IslandManager;
